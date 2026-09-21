# 📄 Async Document Parser

> An **AI-powered document intelligence platform** that extracts structured data from unstructured documents using FastAPI, LangChain, and Google Gemini 1.5 — with a React.js dashboard and full test coverage.

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![LangChain](https://img.shields.io/badge/LangChain-0.2-yellow)](https://langchain.com)
[![Gemini](https://img.shields.io/badge/Gemini-1.5-blue?logo=google)](https://deepmind.google/gemini)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](LICENSE)

---

## 🚀 Features

- **AI-Powered Extraction** — Extracts structured JSON from PDFs, DOCXs, and images using Gemini 1.5 Pro
- **LangChain Pipelines** — Modular extraction chains with prompt templates and output parsers
- **FastAPI Backend** — Async REST API with JWT authentication and schema validation
- **JWT Auth** — Secure endpoint protection with token-based authentication
- **Structured Output** — Returns typed Pydantic schemas — no hallucinated fields
- **React.js Dashboard** — Upload documents and view extracted data in a clean UI
- **PyTest Suite** — Unit + integration tests for extractors, auth, and API routes

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI, Python 3.11 |
| **AI / LLM** | LangChain 0.2, Google Gemini 1.5 Pro |
| **Auth** | JWT (python-jose) |
| **Validation** | Pydantic v2 |
| **Frontend** | React.js 18 |
| **Testing** | PyTest, httpx (async test client) |
| **Deployment** | Docker, Docker Compose |

---

## 🏗️ Architecture

```
┌────────────────┐     REST API      ┌──────────────────────────┐
│  React.js UI   │ ────────────────► │     FastAPI Backend       │
│  (Upload/View) │ ◄──── JSON ────── │  (Async, JWT Protected)   │
└────────────────┘                   └──────────┬───────────────┘
                                                 │ LangChain Chain
                                     ┌───────────▼───────────────┐
                                     │    Gemini 1.5 Pro API      │
                                     │  (Document Understanding)  │
                                     └───────────────────────────┘
```

---

## 📁 Project Structure

```
async-document-parser/
├── backend/
│   ├── app/
│   │   ├── extractor.py        # LangChain + Gemini extraction logic
│   │   ├── auth.py             # JWT authentication handlers
│   │   ├── schemas.py          # Pydantic request/response models
│   │   ├── routes.py           # FastAPI route definitions
│   │   └── main.py             # App entry point
│   ├── tests/
│   │   └── test_main.py        # PyTest integration tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # Upload, Result, Dashboard components
│   │   └── App.jsx
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### 1. Clone the Repository
```bash
git clone https://github.com/Rushi-code1/async-document-parser.git
cd async-document-parser
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Set GEMINI_API_KEY, SECRET_KEY, ALGORITHM

uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Or Use Docker Compose
```bash
docker-compose up --build
```

---

## 🧪 Running Tests
```bash
cd backend
pytest tests/ -v
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | Get JWT access token |
| `POST` | `/documents/parse` | Upload & extract document |
| `GET` | `/documents/{id}` | Retrieve parsed result |
| `GET` | `/health` | Health check |

### Example: Parse a Document
```bash
curl -X POST http://localhost:8000/documents/parse \
  -H "Authorization: Bearer <token>" \
  -F "file=@invoice.pdf"
```

**Response:**
```json
{
  "document_id": "abc123",
  "extracted_fields": {
    "invoice_number": "INV-2024-001",
    "total_amount": 15000.00,
    "vendor": "TechCorp Pvt Ltd",
    "date": "2024-09-15"
  },
  "confidence": 0.97
}
```

---

## 🔑 Key Implementation Highlights

- **`extractor.py`** — LangChain `LLMChain` with `StructuredOutputParser` and Gemini 1.5 Pro integration
- **`auth.py`** — OAuth2 password flow with JWT token creation and validation
- **`schemas.py`** — Strict Pydantic v2 models ensuring type-safe API contracts
- **`test_main.py`** — `AsyncClient` tests covering auth flow, file upload, and extraction accuracy

---

## 👨‍💻 Author

**Rushikesh Sunil Deshmukh**  
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin)](https://linkedin.com/in/rushikesh-sunil-deshmukh)
[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-green)](https://rushi-code1.github.io/portfolio2/)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-black?logo=github)](https://github.com/Rushi-code1)

---

## 📄 License
This project is licensed under the MIT License.
