<div align="center">

<img src="static/img/favicon.png" alt="Lisan Logo" width="120" height="120" style="border-radius: 20px;">

# لِسَان — Lisan

### 🌟 AI-Powered Arabic Language Learning Platform

*Master Arabic grammar, spelling, morphology, and more — powered by cutting-edge AI*

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0+-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Elasticsearch](https://img.shields.io/badge/Elasticsearch-8.x-005571?style=for-the-badge&logo=elasticsearch&logoColor=white)](https://elastic.co)
[![License](https://img.shields.io/badge/License-Private-C9A227?style=for-the-badge)](LICENSE)

---

**[🌐 Live Demo](https://lisan.alaadin-alynaey.site)** · **[📧 Contact](mailto:alaadinalynaey@gmail.com)**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [AI Models](#-ai-models)
- [Credits System](#-credits-system)
- [Authentication](#-authentication)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Developer](#-developer)

---

## 🌟 Overview

**Lisan (لِسَان)** is a comprehensive AI-powered Arabic language platform that provides real-time grammar analysis, spelling correction, diacritization (tashkeel), morphological analysis, dictionary lookup, and an extensive grammar rules bank. Built with a sleek dark-themed UI and designed for both students and professionals of the Arabic language.

> **لِسَان** — اسم عربي يعني "اللغة" و"اللسان"، ويرمز إلى جوهر التواصل والتعبير في اللغة العربية

---

## ✨ Features

### 🔤 Core Language Tools

| Feature | Description | Credit Cost |
|:--------|:-----------|:----------:|
| **📖 الإعراب — Grammar Analysis** | Full i'rab analysis of Arabic sentences with detailed grammatical breakdowns | 0.5 – 1.0 |
| **✏️ التدقيق الإملائي — Spelling Check** | AI-powered spelling correction with explanations | 0.5 – 1.0 |
| **🔊 تشكيل النص — Tashkeel** | Automatic diacritization of Arabic text | 0.5 |
| **🔬 التحليل الصرفي — Morphology** | Root extraction, pattern analysis, verb conjugation | 0.5 |
| **📚 المعاجم اللغوية — Dictionary** | Multi-dictionary lookup with cross-referencing | 0.5 – 1.0 |
| **💡 المعاني — Meanings** | Contextual meaning analysis and synonyms | 0.5 |
| **📐 بنك القواعد — Grammar Bank** | 50+ Arabic grammar rules with examples | Free |

### 📸 Image Analysis
Upload images of Arabic text — the AI extracts and analyzes them automatically.

### 💬 Contextual Chat
Ask follow-up questions about any analysis. The AI remembers context for natural conversation.

### 🔐 Security & Auth
- **Email verification** with 6-digit codes via SMTP
- **Google OAuth** integration for quick sign-in
- **Disposable email blocking** (100+ temp domains)
- **Session persistence** — 30 minutes, stored in Elasticsearch
- **Atomic credit deduction** — race-condition proof via ES scripted updates

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (Browser)                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │Grammar  │ │Spelling │ │Tashkeel │ │Dictionary│  │
│  │ Page    │ │ Page    │ │ Page    │ │ Page     │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬─────┘  │
│       └───────────┼───────────┼───────────┘         │
│                   ▼                                  │
│            layout.js (API + Credits + Persistence)   │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS
┌───────────────────▼─────────────────────────────────┐
│              Flask Application (app.py)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │Rate      │ │CSRF      │ │Auth Decorators       │ │
│  │Limiter   │ │Protection│ │@login @credits @admin│ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
│                                                      │
│  ┌──────────────── AI Router ───────────────────┐   │
│  │  Strong ──▶ OpenRouter (gemini-3.1-pro)      │   │
│  │    ↓ fail    └──▶ fallback (qwen3-coder:free)│   │
│  │  Medium ──▶ Groq (gpt-oss-120b)             │   │
│  │  Low    ──▶ Ollama (qwen2.5:7b)             │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────── Auth Module ─────────────────┐   │
│  │  Signup → Email Verification → Login          │   │
│  │  Google OAuth │ Profile │ Admin Panel          │   │
│  │  Credits System │ Receipt Upload               │   │
│  └──────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│              Elasticsearch 8.x                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │Users     │ │Sessions  │ │Credit Requests       │ │
│  │Codes     │ │Content   │ │Verification Codes    │ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|:------|:----------|
| **Backend** | Python 3.10+, Flask 3.0, Gunicorn |
| **Database** | Elasticsearch 8.x |
| **AI (Strong)** | OpenRouter → Google Gemini 3.1 Pro / Qwen3-Coder |
| **AI (Medium)** | Groq → GPT-OSS-120B |
| **AI (Local)** | Ollama → Qwen 2.5 7B |
| **Auth** | bcrypt, Google OAuth (Authlib), SMTP verification |
| **Frontend** | Vanilla HTML/CSS/JS, RTL-first design |
| **Process Manager** | PM2 |
| **Reverse Proxy** | Nginx |

---

## 🚀 Installation

### Prerequisites
- Python 3.10+
- Elasticsearch 8.x running on `localhost:9200`
- Node.js (for PM2)
- Nginx (for production)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/AladdinAlynaey/lisan.git
cd lisan

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp env.example .env
# Edit .env with your API keys and settings

# 5. Run development server
python app.py

# Or with Gunicorn
gunicorn -c gunicorn.conf.py app:app
```

### Production Deployment (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Auto-restart on reboot
pm2 save
pm2 startup
```

---

## ⚙️ Configuration

Copy `env.example` to `.env` and configure:

```env
# Flask
FLASK_SECRET_KEY=your-strong-random-secret-key
FLASK_DEBUG=false
FLASK_PORT=5018

# AI Providers
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-3.1-pro-preview
OPENROUTER_FALLBACK_MODEL=qwen/qwen3-coder:free

GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b

OLLAMA_MODEL=qwen2.5:7b

# SMTP (Gmail)
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password

# Rate Limiting
RATE_LIMIT_ANALYZE=10/minute
RATE_LIMIT_CHAT=20/minute
```

---

## 🤖 AI Models

Lisan uses a **3-tier AI provider system** with automatic fallback:

| Tier | Provider | Model | Use Case |
|:-----|:---------|:------|:---------|
| 🟢 **Strong** | OpenRouter | `google/gemini-3.1-pro-preview` | Best quality analysis |
| 🟡 **Strong Fallback** | OpenRouter | `qwen/qwen3-coder:free` | Free fallback if primary fails |
| 🔵 **Medium** | Groq | `openai/gpt-oss-120b` | Fast, reliable |
| ⚪ **Low** | Ollama | `qwen2.5:7b` | Local, offline-capable |

If the strong model fails (e.g., 402 Payment Required), it automatically falls back to the free model, then to Groq, then to Ollama.

---

## 💎 Credits System

Users start with **3 free credits**. Each API call costs credits based on the service and model:

| Service | Strong | Med/Low |
|:--------|:------:|:-------:|
| Grammar Analysis | 1.0 | 0.5 |
| Spelling Check | 1.0 | 0.5 |
| Dictionary Lookup | 1.0 | 0.5 |
| Image Analysis | 1.0 | 1.0 |
| Tashkeel | 0.5 | 0.5 |
| Morphology | 0.5 | 0.5 |
| Meanings | 0.5 | 0.5 |

### Purchasing Credits

| Package | Price | Credits |
|:--------|:-----:|:-------:|
| 🥉 Basic | $10 | 50 |
| 🥈 Pro | $20 | 120 |
| 🥇 Premium | $50 | 300 |

Users upload payment receipts → Admin reviews and approves → Credits added automatically.

### Security
- Credits stored server-side in Elasticsearch (never in browser)
- **Atomic deduction** via ES Painless scripting prevents race conditions
- Server-side validation on every request

---

## 🔐 Authentication

### Signup Flow
1. User enters name, email, password
2. Disposable emails are **blocked** (100+ domains)
3. **6-digit verification code** sent via Gmail SMTP
4. User enters code on verification page
5. Account activated → redirected to app

### Login Methods
- **Email + Password** (bcrypt hashed)
- **Google OAuth** (one-click sign-in)

### Admin Panel (`/auth/admin`)
- View all users and their credits
- Approve/reject credit purchase requests
- View uploaded payment receipts
- Add credits directly to any user

---

## 📡 API Reference

All API endpoints require authentication. Include the CSRF token in headers.

| Method | Endpoint | Description | Credits |
|:-------|:---------|:-----------|:-------:|
| `POST` | `/api/analyze` | Grammar analysis | 0.5-1.0 |
| `POST` | `/api/analyze-image` | Image grammar analysis | 1.0 |
| `POST` | `/api/spell-check` | Spelling check | 0.5-1.0 |
| `POST` | `/api/spell-check-image` | Image spelling check | 1.0 |
| `POST` | `/api/tashkeel` | Add diacritics | 0.5 |
| `POST` | `/api/morphology` | Morphological analysis | 0.5 |
| `POST` | `/api/dictionary` | Dictionary lookup | 0.5-1.0 |
| `GET` | `/auth/api/me` | Current user info | Free |
| `POST` | `/auth/api/content/save` | Save page content | Free |
| `POST` | `/auth/api/content/load` | Load page content | Free |

### Request Example

```javascript
const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
    },
    body: JSON.stringify({
        text: 'ذهب الطالبُ إلى المدرسةِ',
        power_level: 'strong'
    })
});
```

---

## 📁 Project Structure

```
lisan/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── ecosystem.config.js     # PM2 configuration
├── gunicorn.conf.py        # Gunicorn settings
├── .env                    # Environment variables (gitignored)
├── env.example             # Example environment file
│
├── ai/                     # AI Engine
│   ├── router.py           # Multi-provider router with fallback
│   ├── providers.py        # OpenRouter, Groq, Ollama providers
│   └── prompts.py          # Arabic-optimized system prompts
│
├── auth/                   # Authentication Module (gitignored)
│   ├── routes.py           # Login, signup, profile, admin routes
│   ├── models.py           # Elasticsearch user models
│   ├── decorators.py       # @login_required, @credits_required
│   ├── email_service.py    # SMTP verification emails
│   └── google_oauth.py     # Google OAuth integration
│
├── chat/                   # Contextual Chat
│   └── context_chat.py     # Follow-up question handling
│
├── vision/                 # Image Processing
│   └── image_parser.py     # OCR + AI image analysis
│
├── config/                 # Configuration
│   └── settings.py         # Centralized config from .env
│
├── templates/              # Jinja2 HTML Templates
│   ├── base.html           # Layout with sidebar + mobile nav
│   ├── grammar.html        # Grammar analysis page
│   ├── spelling.html       # Spelling check page
│   ├── tashkeel.html       # Diacritization page
│   ├── morphology.html     # Morphological analysis page
│   ├── dictionary.html     # Dictionary lookup page
│   ├── meanings.html       # Meanings page
│   └── grammar_bank.html   # Grammar rules bank (50+ rules)
│
└── static/
    ├── css/                # Stylesheets
    │   ├── layout.css      # Core layout + responsive design
    │   ├── grammar.css     # Grammar page styles
    │   └── ...             # Per-page styles
    ├── js/                 # JavaScript
    │   ├── layout.js       # Shared: API, loading, credits, toast
    │   ├── grammar.js      # Grammar page logic
    │   └── ...             # Per-page scripts
    └── img/
        └── favicon.png     # App icon
```

---

## 🌐 Deployment

### Nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name lisan.alaadin-alynaey.site;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:5018;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
}
```

---

## 👨‍💻 Developer

<div align="center">

**Alaadin Alynaey**

[![GitHub](https://img.shields.io/badge/GitHub-AladdinAlynaey-181717?style=for-the-badge&logo=github)](https://github.com/AladdinAlynaey)
[![Email](https://img.shields.io/badge/Email-alaadinalynaey@gmail.com-D14836?style=for-the-badge&logo=gmail)](mailto:alaadinalynaey@gmail.com)

</div>

---

<div align="center">

**لِسَان** — *اللغة العربية بالذكاء الاصطناعي* 🌙

*Built with ❤️ for the Arabic language*

</div>
