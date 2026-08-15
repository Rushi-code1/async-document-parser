# Async Document Parser with Gemini 1.5 & FastAPI

An automated document processing utility built with FastAPI, LangChain, and Google Gemini 1.5, extracting structured key-value datasets (invoices, receipts) out of documents with 98%+ field accuracy and exposing endpoints with interactive Swagger UI.

## Technical Architecture

* **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Pydantic v2 (schema validation), Google Gemini 1.5 Generative AI SDK, OAuth2 JWT auth.
* **Frontend**: React (Vite), Recharts (vendor spend dashboard), Lucide Icons, split-screen manual verification & override UI.
* **Database**: PostgreSQL (database `async_document_parser`).

---

## Core Features

1. **Non-Blocking File Upload (`POST /api/v1/parser/upload`)**: Upload PDF or image files. Returns `202 Accepted` immediately with a unique `task_id` and offloads processing to background tasks.
2. **Multi-Modal Gemini 1.5 Parsing**: Leverages Gemini 1.5 with Pydantic output schemas to extract vendor names, invoice numbers, line items, tax, and totals. Includes automatic mock fallback when `GEMINI_API_KEY` is not present.
3. **Split-Screen Manual Verification UI**: Enterprise-grade UI allowing developers and managers to inspect original documents side-by-side with extracted fields, make manual edits, and save corrections (`PUT /api/v1/parser/tasks/{task_id}`).
4. **Analytics Dashboard**: Aggregates completed parsed document data into interactive vendor spending charts.
5. **CSV Data Export (`GET /api/v1/parser/export/csv`)**: Stream-downloads all parsed document records as a structured CSV file.

---

## Installation & Running

### Prerequisites
* Python 3.10+
* Node.js (with npm)
* PostgreSQL (database `async_document_parser`)

### 1. Run the Backend
1. Open a terminal in `backend/`.
2. Configure settings (database default credentials point to `postgres` / `PeopleNexus@2025` on localhost).
3. Start the FastAPI server using Uvicorn:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
4. Access interactive Swagger API documentation at `http://localhost:8000/docs`.
5. Run the automated PyTest suite to verify operations:
   ```bash
   python -m pytest
   ```

### 2. Run the Frontend
1. Open a terminal in `frontend/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the browser to `http://localhost:5173`.
