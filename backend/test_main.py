import io
import uuid
import pytest
from fastapi.testclient import TestClient
from main import app
from database import Base, engine

# Initialize TestClient
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield

def test_user_registration_and_login_flow():
    uname = f"docuser_{uuid.uuid4().hex[:6]}"
    # Register
    reg_res = client.post("/api/v1/auth/register", json={
        "username": uname,
        "password": "docpassword123",
        "email": f"{uname}@example.com"
    })
    assert reg_res.status_code == 201
    assert reg_res.json()["username"] == uname

    # Login
    login_res = client.post("/api/v1/auth/token", data={
        "username": uname,
        "password": "docpassword123"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

def test_document_upload_and_extraction_pipeline():
    uname = f"parser_tester_{uuid.uuid4().hex[:6]}"
    # Login to get token
    client.post("/api/v1/auth/register", json={
        "username": uname,
        "password": "pass"
    })
    token_res = client.post("/api/v1/auth/token", data={"username": uname, "password": "pass"})
    token = token_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload mock PDF file
    file_bytes = b"%PDF-1.4 Mock PDF Invoice Content for Gemini Testing"
    upload_res = client.post(
        "/api/v1/parser/upload",
        files={"file": ("sample_invoice.pdf", io.BytesIO(file_bytes), "application/pdf")},
        headers=headers
    )
    assert upload_res.status_code == 202
    task_data = upload_res.json()
    assert task_data["status"] == "PENDING"
    task_id = task_data["task_id"]

    # Run extraction worker synchronously
    from extractor import process_document_background
    process_document_background(task_id)

    # Fetch status
    status_res = client.get(f"/api/v1/parser/tasks/{task_id}", headers=headers)
    assert status_res.status_code == 200
    data = status_res.json()
    assert data["status"] == "COMPLETED"
    assert data["extracted_data"] is not None
    assert "vendor_name" in data["extracted_data"]
    assert "total_amount" in data["extracted_data"]

def test_manual_verification_and_csv_export():
    uname = f"verify_tester_{uuid.uuid4().hex[:6]}"
    # Login
    client.post("/api/v1/auth/register", json={"username": uname, "password": "pass"})
    token = client.post("/api/v1/auth/token", data={"username": uname, "password": "pass"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload & process
    upload_res = client.post(
        "/api/v1/parser/upload",
        files={"file": ("test_receipt.png", io.BytesIO(b"png content"), "image/png")},
        headers=headers
    )
    task_id = upload_res.json()["task_id"]
    from extractor import process_document_background
    process_document_background(task_id)

    # Manual edit correction
    new_extracted = {
        "vendor_name": "Corrected Vendor Inc",
        "invoice_number": "INV-CORRECTED-99",
        "invoice_date": "2026-07-26",
        "line_items": [{"item_name": "Corrected Item", "quantity": 1, "unit_price": 500.0, "total": 500.0}],
        "tax": 50.0,
        "total_amount": 550.0
    }
    update_res = client.put(f"/api/v1/parser/tasks/{task_id}", json={"extracted_data": new_extracted}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["extracted_data"]["vendor_name"] == "Corrected Vendor Inc"

    # Export CSV
    export_res = client.get("/api/v1/parser/export/csv", headers=headers)
    assert export_res.status_code == 200
    assert "text/csv" in export_res.headers["content-type"]
    assert "Corrected Vendor Inc" in export_res.text
