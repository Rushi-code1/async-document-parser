import os
import io
import csv
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models
import schemas
import auth
from extractor import process_document_background

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Async Document Parser API",
    description="FastAPI service for async document key-value field extraction with Gemini 1.5 & Pydantic.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Auth Endpoints
@app.post("/api/v1/auth/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pwd = auth.hash_password(user_in.password)
    new_user = models.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/v1/auth/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# Document Parser Endpoints
@app.post("/api/v1/parser/upload", response_model=schemas.TaskResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Save file
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        content = await file.read()
        f.write(content)

    # Create Task DB Record
    task = models.DocumentTask(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_location,
        status="PENDING"
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Offload extraction to async background task
    background_tasks.add_task(process_document_background, task.id)

    return schemas.TaskResponse(
        task_id=task.id,
        filename=task.filename,
        status=task.status,
        created_at=task.created_at,
        extracted_data=None
    )

@app.get("/api/v1/parser/tasks", response_model=List[schemas.TaskResponse])
def list_tasks(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    tasks = db.query(models.DocumentTask).filter(models.DocumentTask.user_id == current_user.id).all()
    return [
        schemas.TaskResponse(
            task_id=t.id,
            filename=t.filename,
            status=t.status,
            created_at=t.created_at,
            extracted_data=t.extracted_data
        ) for t in tasks
    ]

@app.get("/api/v1/parser/tasks/{task_id}", response_model=schemas.TaskResponse)
def get_task_status(task_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    task = db.query(models.DocumentTask).filter(
        models.DocumentTask.id == task_id,
        models.DocumentTask.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return schemas.TaskResponse(
        task_id=task.id,
        filename=task.filename,
        status=task.status,
        created_at=task.created_at,
        extracted_data=task.extracted_data
    )

@app.put("/api/v1/parser/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task_extracted_data(
    task_id: str,
    update_in: schemas.TaskUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Allows manual verification and correction of extracted fields from the UI."""
    task = db.query(models.DocumentTask).filter(
        models.DocumentTask.id == task_id,
        models.DocumentTask.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.extracted_data = update_in.extracted_data
    db.commit()
    db.refresh(task)

    return schemas.TaskResponse(
        task_id=task.id,
        filename=task.filename,
        status=task.status,
        created_at=task.created_at,
        extracted_data=task.extracted_data
    )

@app.get("/api/v1/parser/export/csv")
def export_parsed_csv(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Exports all completed parsed document records as a CSV stream."""
    tasks = db.query(models.DocumentTask).filter(
        models.DocumentTask.user_id == current_user.id,
        models.DocumentTask.status == "COMPLETED"
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Task ID", "Filename", "Vendor Name", "Invoice Number", "Invoice Date", "Tax ($)", "Total Amount ($)"])

    for t in tasks:
        data = t.extracted_data or {}
        writer.writerow([
            t.id,
            t.filename,
            data.get("vendor_name", ""),
            data.get("invoice_number", ""),
            data.get("invoice_date", ""),
            data.get("tax", 0.0),
            data.get("total_amount", 0.0)
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=parsed_documents.csv"}
    )
