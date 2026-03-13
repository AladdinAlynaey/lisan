<p align="center">
  <img src="static/img/favicon.png" alt="Lisan Logo" width="180">
</p>

<h1 align="center">لِسَان — Lisan</h1>

<p align="center">
  <strong>AI-Powered Arabic Grammar Learning Platform</strong><br>
  <em>Master Arabic grammar, spelling, and vocabulary with the power of Artificial Intelligence</em>
</p>

<p align="center">
  <a href="https://lisan.alaadin-alynaey.site">🌐 Live Demo</a> •
  <a href="#features">✨ Features</a> •
  <a href="#architecture">🏗️ Architecture</a> •
  <a href="#getting-started">🚀 Getting Started</a> •
  <a href="#api-reference">📡 API</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask">
  <img src="https://img.shields.io/badge/Gunicorn-gevent-499848?style=for-the-badge&logo=gunicorn&logoColor=white" alt="Gunicorn">
  <img src="https://img.shields.io/badge/AI-Multi--Provider-FF6B6B?style=for-the-badge&logo=openai&logoColor=white" alt="AI">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License">
</p>

---

## 🌟 What is Lisan?

**Lisan** (لِسَان — Arabic for "tongue" or "language") is a full-stack, production-grade Arabic grammar learning platform powered by multiple AI providers. It provides instant, precise **I'rab (إعراب)** — the classical Arabic grammatical analysis that determines the syntactic role and case ending of every word in a sentence.

Built for students, educators, and Arabic language enthusiasts, Lisan makes the notoriously complex world of Arabic grammar accessible through an intelligent, beautiful interface that supports **thousands of daily users** with enterprise-grade reliability.

> 🎯 **The Problem**: Arabic grammar (النحو العربي) is one of the most complex grammatical systems in any language. Students spend years mastering I'rab rules across Sibawayh, Ibn Malik, and Ibn Hisham's classical frameworks. Lisan democratizes this knowledge with AI.

---

## ✨ Features

### 📖 Grammar Analysis (الإعراب)
The heart of Lisan. Submit any Arabic sentence and receive a complete grammatical breakdown:

- **Concise Mode** — Quick I'rab for each word (word + grammatical role)
- **Detailed Mode** — Full analysis including:
  - Word type (اسم، فعل، حرف)
  - Complete I'rab (الإعراب الكامل)
  - Case ending (العلامة الإعرابية)
  - Grammatical role (الدور النحوي)
  - Detailed explanation of **why** each word has its specific I'rab
- **Image Analysis** — Upload an image containing Arabic text, and Lisan extracts and analyzes it automatically via AI vision models

### ✏️ Spelling Correction (التصحيح الإملائي)
AI-powered spelling checker grounded in classical Arabic dictionaries:
- Detects and corrects spelling errors
- Explains the **rule** behind each correction (e.g., همزة القطع vs. همزة الوصل)
- Supports image input for handwritten/printed text correction
- References: لسان العرب، المعجم الوسيط، تاج العروس

### 📚 Meanings & Synonyms (المعاني والمرادفات)
A smart Arabic dictionary powered by AI:
- Full word meaning with linguistic context
- Root extraction (الجذر) and morphological pattern (الوزن الصرفي)
- Synonyms (مرادفات) and antonyms (أضداد)
- Usage examples in complete sentences

### 💬 Contextual Grammar Chat (المساعد النحوي)
An AI chat assistant that answers questions **about the analyzed sentence**:
- Ask follow-up questions about any word's I'rab
- Get explanations of grammatical rules
- Maintains conversation context for natural dialogue
- References classical grammar authorities (Sibawayh, Ibn Malik, Ibn Hisham)

### 🔍 Word Exploration (استكشاف الكلمة)
Click any word in the analysis to explore it deeply:
- Trilateral/quadrilateral root
- Morphological pattern (الوزن الصرفي)
- Synonyms, derived forms, and linguistic notes

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (Browser)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Grammar  │  │ Spelling │  │ Meanings/Synonyms│   │
│  │  Page    │  │   Page   │  │      Page        │   │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│       └──────────────┼────────────────┘             │
│                      │ REST API (JSON)              │
└──────────────────────┼──────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────┐
│              Flask Application (app.py)             │
│  ┌───────────────────┼──────────────────────────┐   │
│  │           AI Router (ai/router.py)           │   │
│  │  Routes requests to the appropriate provider │   │
│  │                                              │   │
│  │  ┌──────────────┐ ┌──────────┐ ┌───────────┐ │   │
│  │  │ OpenRouter   │ │  Groq    │ │  Ollama   │ │   │
│  │  │ (Advanced)   │ │(Standard)│ │  (Local)  │ │   │
│  │  │ Gemini Pro   │ │ GPT-OSS  │ │ Qwen 2.5  │ │   │
│  │  └──────────────┘ └──────────┘ └───────────┘ │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Context Chat│  │ Image Parser │  │  Prompts   │  │
│  │ (chat/)     │  │ (vision/)    │  │  (ai/)     │  │
│  └─────────────┘  └──────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 🤖 AI Provider Tiers — Power Level System

Lisan uses a **three-tier AI provider system** with automatic fallback:

| Power Level | Provider | Model | Best For |
|:-----------:|:--------:|:-----:|:--------:|
| 🟢 **Strong** (قوي) | OpenRouter | Gemini Pro | Highest accuracy, complex sentences |
| 🟡 **Medium** (متوسط) | Groq | GPT-OSS 120B | Fast responses, good quality |
| 🔵 **Local** (محلي) | Ollama | Qwen 2.5 7B | Offline/private usage |

> **Fallback Chain**: If the selected provider fails, Lisan automatically tries the next provider in the chain. This ensures **99.9% uptime** even when individual API services experience issues.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.12+
- At least one AI provider API key (OpenRouter recommended)
- PM2 (for production deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/AladdinAlynaey/lisan.git
cd lisan

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn gevent

# Configure environment
cp env.example .env
# Edit .env with your API keys
```

### Configuration

Edit `.env` with your API keys:

```env
# Required: At least one AI provider
OPENROUTER_API_KEY=your-openrouter-key
GROQ_API_KEY=your-groq-key

# Optional: Local Ollama
OLLAMA_BASE_URL=http://localhost:11434

# App Settings
FLASK_PORT=5018
FLASK_DEBUG=false
```

### Running in Development

```bash
source venv/bin/activate
python app.py
```

### Running in Production (Recommended)

```bash
# Start with PM2 + Gunicorn (gevent async workers)
pm2 start ecosystem.config.js
pm2 save

# The app runs on port 5018 with:
# - 7 gevent async workers
# - 1000 concurrent connections per worker
# - Auto-restart on crash or server reboot
# - Auto-reload on code changes
```

---

## 📡 API Reference

All API endpoints accept and return JSON. CSRF token required in header: `X-CSRFToken`.

### Grammar Analysis

```http
POST /api/analyze
Content-Type: application/json

{
  "sentence": "ذهب الطالب إلى المدرسة",
  "mode": "detailed",        // "concise" | "detailed"
  "power_level": "strong"    // "strong" | "med" | "low"
}
```

### Image Analysis

```http
POST /api/analyze-image
Content-Type: multipart/form-data

image: <file>
mode: "detailed"
power_level: "strong"
```

### Spell Check

```http
POST /api/spell-check
Content-Type: application/json

{
  "text": "ذهب الطالب الى المدرسه",
  "power_level": "strong"
}
```

### Meanings & Synonyms

```http
POST /api/meanings
Content-Type: application/json

{
  "word": "كتاب",
  "power_level": "strong"
}
```

### Contextual Chat

```http
POST /api/chat
Content-Type: application/json

{
  "question": "لماذا جاءت كلمة الطالب مرفوعة؟",
  "sentence": "ذهب الطالب إلى المدرسة",
  "analysis": { ... },
  "history": [],
  "power_level": "strong"
}
```

### Word Exploration

```http
POST /api/explore-word
Content-Type: application/json

{
  "word": "ذهب",
  "sentence": "ذهب الطالب إلى المدرسة",
  "power_level": "strong"
}
```

---

## 🛡️ Security & Rate Limiting

| Feature | Implementation |
|:--------|:--------------|
| **CSRF Protection** | Flask-WTF CSRFProtect on all POST routes |
| **Rate Limiting** | 10 requests/min for analysis, 20/min for chat |
| **Input Validation** | Arabic character detection, text length limits (2000 chars) |
| **File Validation** | Extension + MIME type checking, 10MB upload limit |
| **File Cleanup** | Uploaded images are deleted immediately after processing |
| **Secret Key** | Configurable via environment variable |

---

## 🏎️ Performance

Deployed with **Gunicorn + gevent async workers** for production-grade concurrency:

| Metric | Value |
|:-------|:------|
| **Workers** | 7 (gevent async) |
| **Connections/Worker** | 1,000 |
| **Theoretical Capacity** | 7,000 concurrent connections |
| **Page Load (p50)** | 7-16ms |
| **Static Assets (p50)** | 7-12ms |
| **Worker Recycling** | Every 1,000 requests ± 100 |
| **Graceful Shutdown** | 30s timeout |

> **Load Test Results**: 200 concurrent users × 60 seconds → **4,465 requests** with **0% failure** on all page loads and static assets. API rate limiting (429) correctly enforced on analysis endpoints.

---

## 📁 Project Structure

```
lisan/
├── app.py                  # Flask application & routes
├── gunicorn.conf.py        # Gunicorn production config
├── ecosystem.config.js     # PM2 deployment config
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (not in git)
├── env.example             # Example environment template
│
├── ai/                     # AI Provider Layer
│   ├── router.py           # Multi-provider routing & fallback
│   ├── providers.py        # OpenRouter, Groq, Ollama clients
│   └── prompts.py          # Arabic grammar analysis prompts
│
├── chat/                   # Chat Module
│   └── context_chat.py     # Contextual grammar Q&A
│
├── config/                 # Configuration
│   └── settings.py         # Centralized config from .env
│
├── vision/                 # Image Processing
│   ├── image_parser.py     # Multi-provider image text extraction
│   └── docling_ocr.py      # Docling OCR fallback
│
├── templates/              # Jinja2 HTML Templates
│   ├── base.html           # Layout with sidebar & mobile nav
│   ├── grammar.html        # Grammar analysis page
│   ├── spelling.html       # Spelling correction page
│   └── meanings.html       # Meanings & synonyms page
│
├── static/
│   ├── css/
│   │   ├── layout.css      # Layout & responsive design
│   │   └── styles.css      # Component styles & themes
│   ├── js/
│   │   ├── layout.js       # Navigation & sidebar logic
│   │   ├── app.js          # Grammar analysis frontend
│   │   ├── spelling.js     # Spelling page frontend
│   │   └── meanings.js     # Meanings page frontend
│   └── img/
│       └── favicon.png     # Lisan golden logo
│
└── uploads/                # Temporary image uploads (auto-cleaned)
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Backend** | Flask 3.x | Web framework |
| **WSGI Server** | Gunicorn + gevent | Production server with async workers |
| **Process Manager** | PM2 | Auto-restart, file watching, log management |
| **AI (Primary)** | OpenRouter → Gemini Pro | Advanced grammar analysis |
| **AI (Secondary)** | Groq → GPT-OSS 120B | Standard analysis with fast inference |
| **AI (Fallback)** | Ollama → Qwen 2.5 | Local/offline analysis |
| **OCR** | AI Vision + Docling | Arabic text extraction from images |
| **Frontend** | Vanilla HTML/CSS/JS | Responsive RTL interface |
| **Security** | Flask-WTF, Flask-Limiter | CSRF protection, rate limiting |

---

## 👨‍💻 Developer

<p align="center">
  Built with ❤️ by <a href="https://alaadin-alynaey.site/"><strong>Alaadin Alynaey</strong></a><br>
  AI Engineer
</p>

---

<p align="center">
  <strong>لِسَان</strong> — Because every Arabic sentence tells a story through its grammar ✨
</p>
