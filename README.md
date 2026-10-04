# 📄 Async Document Parser — Asynchronous Document Processing & Extraction Engine

> A high-throughput asynchronous document ingestion and information extraction engine built with FastAPI, LangChain, and Google Gemini — delivering non-blocking file processing, structured entity extraction, and a dynamic React.js dashboard.

![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-0.3-1C3C3C?logo=langchain&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-1.5%20Pro-4285F4?logo=google-gemini&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-success)

---

## 🚀 Features

- **Non-Blocking Asynchronous Ingestion** — Upload multi-megabyte PDFs and raw documents without blocking server I/O, utilizing async/await primitives.
- **LLM Entity & Schema Extraction** — Leverages Google Gemini and LangChain structured output chains with Pydantic validation to guarantee clean JSON outputs.
- **Context-Aware Document Chunking** — Intelligent text chunking preserving paragraph boundaries and table structures for downstream Q&A.
- **Modern Interactive Dashboard** — Clean React 19 interface powered by Vite, featuring file drag-and-drop, extraction progress tracking, and formatted JSON exports.
- **Robust Exception Handling** — Handles corrupt files, token rate limits, and schema violations with resilient fallback strategies.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend API** | FastAPI, Python 3.12 | High-concurrency async REST routes & validation |
| **AI / Orchestration** | LangChain 0.3, Google Gemini | LLM prompts, chains & schema-guided extraction |
| **Data Validation** | Pydantic v2 | Strict schema enforcement on extracted payload |
| **Frontend** | React 19, Vite, Tailwind CSS | Upload dashboard, status tracker, JSON viewer |
| **Testing** | PyTest, HTTPX AsyncClient | Automated route and extractor test suites |

---

## 🏗️ Architecture Flow

```
[Document Upload (PDF/TXT)]
            │
            ▼
   [FastAPI Async Endpoint]
            │
            ▼
   [Document Chunking Engine]
            │
            ▼
   [LangChain Extraction Chain] ◄──► [Google Gemini 1.5 Pro]
            │
            ▼
   [Pydantic Schema Validation]
            │
            ▼
  [Structured JSON Response] ──► [React 19 Dashboard]
```

---

## ⚡ Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API Key

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
cp .env.example .env     # Add your GEMINI_API_KEY
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

Open `http://localhost:5173` to start parsing documents!

---

## 👨‍💻 Author & Connect

**Rushikesh Deshmukh**  
*Full Stack Developer & AI Engineer*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Rushikesh_Deshmukh-0A66C2?logo=linkedin&logoColor=white)](https://linkedin.com/in/rushikesh-sunil-deshmukh)
[![GitHub](https://img.shields.io/badge/GitHub-Rushi--code1-181717?logo=github&logoColor=white)](https://github.com/Rushi-code1)
[![Portfolio](https://img.shields.io/badge/Portfolio-Live_Site-6366F1?logo=google-chrome&logoColor=white)](https://rushi-code1.github.io/portfolio2/)
[![Email](https://img.shields.io/badge/Email-rushikesh.deshmukh1103%40gmail.com-EA4335?logo=gmail&logoColor=white)](mailto:rushikesh.deshmukh1103@gmail.com)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
