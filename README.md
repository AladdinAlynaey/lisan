<div align="center">

<img src="static/img/favicon.png" alt="Lisan Logo" width="140" height="140" style="border-radius: 24px;">

# لِسَان — Lisan

### 🌟 AI-Powered Arabic Language Intelligence Platform

*The most comprehensive Arabic language analysis suite — powered by multi-model AI with automatic failover*

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0+-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Elasticsearch](https://img.shields.io/badge/Elasticsearch-8.x-005571?style=for-the-badge&logo=elasticsearch&logoColor=white)](https://elastic.co)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-AI-FF6B35?style=for-the-badge)](https://openrouter.ai)
[![License](https://img.shields.io/badge/License-Private-C9A227?style=for-the-badge)](LICENSE)

---

**[🌐 Live Demo](https://lisan.alaadin-alynaey.site)** · **[📧 Contact](mailto:alaadinalynaey@gmail.com)** · **[👨‍💻 Developer](https://alaadin-alynaey.site)**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [AI Models & Failover](#-ai-models--failover)
- [Credits System](#-credits-system)
- [Admin Dashboard](#-admin-dashboard)
- [Authentication & Security](#-authentication--security)
- [E-Wallet Payment System](#-e-wallet-payment-system)
- [Email Notifications](#-email-notifications)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Developer](#-developer)

---

## 🌟 Overview

**Lisan (لِسَان)** is a production-grade, AI-powered Arabic language intelligence platform. It provides real-time grammar analysis (إعراب), spelling correction, diacritization (تشكيل), morphological analysis (صرف), dictionary lookup across multiple classical Arabic dictionaries, contextual meaning analysis, and an extensive grammar rules bank.

The platform features a premium dark-themed UI, multi-model AI with automatic failover, a complete credit-based billing system with e-wallet payments, email notifications, Telegram admin alerts, and a powerful admin dashboard.

> **لِسَان** — اسم عربي يعني "اللغة" و"اللسان"، ويرمز إلى جوهر التواصل والتعبير في اللغة العربية

---

## ✨ Features

### 🔤 Core Language Tools

| Feature | Description | Credit Cost |
|:--------|:-----------|:----------:|
| **📖 الإعراب — Grammar Analysis** | Full i'rab analysis with detailed grammatical breakdowns, color-coded parts of speech | 0.5 – 1.0 |
| **✏️ التدقيق الإملائي — Spelling Check** | AI-powered spelling correction with explanations and context | 0.5 – 1.0 |
| **🔊 تشكيل النص — Tashkeel** | Automatic diacritization with full harakat placement | 0.5 |
| **🔬 التحليل الصرفي — Morphology** | Root extraction, pattern analysis, verb conjugation tables | 0.5 |
| **📚 المعاجم اللغوية — Dictionary** | Multi-dictionary lookup (Lisan al-Arab, Mukhtar al-Sihah, al-Qamus, etc.) | 0.5 – 1.0 |
| **💡 المعاني والمرادفات — Meanings** | Contextual meaning analysis with synonyms and antonyms | 0.5 |
| **📐 بنك القواعد — Grammar Bank** | 50+ Arabic grammar rules with examples and interactive quizzes | **Free** |

### 📸 Image Analysis
Upload images of Arabic text (handwritten or printed) — the AI extracts and analyzes them automatically using vision models.

### 💬 Contextual Follow-up Chat
Ask follow-up questions about any analysis. The AI maintains conversation context for natural dialogue about grammar and language.

### 🔄 Content Persistence
User content is saved per-page and per-user for 30 minutes. Navigate between pages and return to find your work exactly where you left it — even after refreshing.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐  │
│  │Grammar  │ │Spelling │ │Tashkeel │ │Dictionary    │  │
│  │ Page    │ │ Page    │ │ Page    │ │ + Morphology │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └──────┬───────┘  │
│       └───────────┼───────────┼──────────────┘           │
│                   ▼                                      │
│        layout.js (API + Credits + Persistence)           │
└───────────────────┬──────────────────────────────────────┘
                    │ HTTPS (Nginx reverse proxy)
┌───────────────────▼──────────────────────────────────────┐
│              Flask Application (Gunicorn/PM2)            │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────┐ │
│  │Rate      │ │CSRF      │ │Auth Decorators           │ │
│  │Limiter   │ │Protection│ │@login @credits @admin    │ │
│  └──────────┘ └──────────┘ └──────────────────────────┘ │
│                                                          │
│  ┌─────────────── AI Router (Smart Failover) ────────┐  │
│  │                                                    │  │
│  │  1️⃣  Google Gemini 2.5 Pro (Primary — Strong)      │  │
│  │  2️⃣  Qwen Qwen3-Coder (Fallback — Free)           │  │
│  │  3️⃣  Groq (Emergency Fallback)                     │  │
│  │                                                    │  │
│  │  Credit Cost: Strong Model → 1.0 | Standard → 0.5 │  │
│  └────────────────────┬───────────────────────────────┘  │
│                       │                                   │
│  ┌────────────────────▼───────────────────────────────┐  │
│  │               Elasticsearch 8.x                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │  │
│  │  │Users     │ │Credits   │ │Content Persistence │ │  │
│  │  │Index     │ │Requests  │ │(30-min TTL)        │ │  │
│  │  └──────────┘ └──────────┘ └────────────────────┘ │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────── Notifications ─────────────────┐  │
│  │  📧 SMTP Email    │  📱 Telegram Bot API           │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 🤖 AI Models & Failover

Lisan uses a **3-tier AI failover system** to ensure 100% uptime:

| Priority | Model | Provider | Cost | Use Case |
|:--------:|:------|:---------|:----:|:---------|
| 1️⃣ | `google/gemini-2.5-pro-preview` | OpenRouter | 1.0 credit | Primary — highest quality |
| 2️⃣ | `qwen/qwen3-coder:free` | OpenRouter | 0.5 credit | Free fallback |
| 3️⃣ | `openai/gpt-oss-120b` | Groq | 0.5 credit | Emergency fallback |

- Users select **Strong** (1.0 credit) or **Standard** (0.5 credit) mode per request
- If Model 1 fails → automatic fallback to Model 2 → Model 3
- Vision requests (image analysis) use the primary model only

---

## 💳 Credits System

| Plan | Credits | Price | Per Credit |
|:-----|:-------:|:-----:|:----------:|
| 🥉 Starter | 30 | $5 | $0.17 |
| 🥈 Popular | 60 | $8 | $0.13 |
| 🥇 Best Value | 120 | $20 | $0.17 |

- Credits are deducted **atomically** using Elasticsearch scripted updates (race-condition proof)
- Credit costs vary by service and model (0.5–1.0 per request)
- Users upload payment receipts; admin reviews and approves/rejects with email notification

---

## 🎛️ Admin Dashboard

The admin panel (`/auth/admin`) provides a comprehensive management interface:

### 📊 Statistics
- Total users, verified users, pending requests, total request count
- Real-time overview cards

### 👥 User Management
- Full users table with name, email, credits, verification status
- **Add/Remove credits** with optional message (included in email notification)
- **View user history** — full payment and credit request timeline
- **Delete users** with confirmation (prevents self-deletion)

### 📩 Request Management
- **Approve/Reject** pending credit requests with optional admin comment
- **Cancel approved orders** — deducts credits and notifies user
- All actions send detailed email notifications with:
  - Admin's custom message
  - Balance before and after the action
  - Branded HTML email template

### 💳 E-Wallet Management
- Upload wallet images (PNG/JPG/WEBP)
- Set account numbers per wallet (displayed to users on click)
- Delete wallets — images and account data cleaned up
- Responsive grid layout

### ⚙️ Settings
- Admin phone number (displayed to users for WhatsApp contact)
- All settings stored securely in Elasticsearch

---

## 🔐 Authentication & Security

| Feature | Description |
|:--------|:-----------|
| **Email Verification** | 6-digit code sent via SMTP, required before access |
| **Google OAuth** | One-click sign-in with Google accounts |
| **Disposable Email Blocking** | 100+ temp email domains blocked |
| **CSRF Protection** | Flask-WTF CSRF tokens on all forms and API calls |
| **Rate Limiting** | Flask-Limiter prevents abuse |
| **Session Management** | Server-side sessions with 30-minute persistence |
| **Admin Authorization** | `@admin_required` decorator on all admin routes |
| **Password Hashing** | Werkzeug security for password storage |

---

## 💳 E-Wallet Payment System

- Admin uploads wallet images (e.g., Jawali, Jaib, Kuraimi)
- Each wallet has an **account number** set by admin
- Users click wallet image → **popup modal** with large image + account number + copy-to-clipboard
- Wallet images are stored in `auth/wallets/` (gitignored for security)
- Fully responsive grid that adapts to any number of wallets

---

## 📧 Email Notifications

**5 types of automated emails** with branded HTML templates:

| Type | Trigger | Content |
|:-----|:--------|:--------|
| ✅ Approved | Admin approves credit request | Credits added, balance update, admin message |
| ❌ Rejected | Admin rejects request | Reason, admin message, current balance |
| ➕ Credit Added | Admin manually adds credits | Amount, admin message, balance before/after |
| ➖ Credit Removed | Admin removes credits | Amount, reason, balance before/after |
| 🚫 Order Cancelled | Admin cancels approved order | Credits deducted, admin message, balance |

All emails include:
- Lisan branding and gold-themed styling
- Admin's optional custom message in a highlighted quote box
- Balance before and after the action

---

## 🛠️ Tech Stack

| Layer | Technology |
|:------|:----------|
| **Backend** | Python 3.10+, Flask 3.0+, Gunicorn |
| **Database** | Elasticsearch 8.x |
| **AI** | OpenRouter API (Gemini, Qwen, Groq) |
| **Auth** | Flask sessions, Google OAuth, SMTP email verification |
| **Frontend** | Vanilla HTML/CSS/JS, RTL Arabic layout |
| **Notifications** | SMTP email, Telegram Bot API |
| **Process Manager** | PM2 |
| **Reverse Proxy** | Nginx with SSL |

---

## 📦 Installation

### Prerequisites
- Python 3.10+
- Elasticsearch 8.x running locally
- SMTP email service credentials

### Setup

```bash
# Clone the repository
git clone https://github.com/AladdinAlynaey/lisan.git
cd lisan

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys and configuration

# Create wallet directory
mkdir -p auth/wallets

# Run development server
python app.py
```

---

## ⚙️ Configuration

Copy `.env.example` to `.env` and configure:

```env
# ── AI Configuration ──
OPENROUTER_API_KEY=sk-or-...
GROQ_API_KEY=gsk_...

# ── Elasticsearch ──
ELASTICSEARCH_URL=http://localhost:9200

# ── Application ──
SECRET_KEY=your-super-secret-key
FLASK_ENV=production

# ── Email (SMTP) ──
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=Lisan

# ── Google OAuth (Optional) ──
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# ── Telegram Notifications (Optional) ──
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ADMIN_CHAT_ID=...

# ── Admin ──
ADMIN_EMAIL=admin@yourdomain.com
```

---

## 📁 Project Structure

```
lisan/
├── app.py                    # Main Flask application & AI router
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables (gitignored)
├── .env.example              # Environment template
│
├── auth/                     # Authentication module
│   ├── __init__.py           # Blueprint registration
│   ├── routes.py             # Auth routes, admin panel, wallet CRUD
│   ├── models.py             # Elasticsearch user/credit models
│   ├── decorators.py         # @login_required, @admin_required, @credits_required
│   ├── email_service.py      # SMTP email verification
│   ├── google_oauth.py       # Google OAuth integration
│   ├── telegram_service.py   # Telegram bot notifications
│   ├── wallets/              # E-wallet images (gitignored)
│   ├── receipts/             # Payment receipts (gitignored)
│   └── templates/            # Auth HTML templates
│       ├── login.html        # Login page
│       ├── signup.html       # Registration page
│       ├── verify_email.html # Email verification
│       ├── profile.html      # User profile & credit purchase
│       ├── admin.html        # Admin dashboard
│       └── user_history.html # User history (admin view)
│
├── templates/                # Main app templates
│   └── base.html             # Base layout (sidebar, bottom nav, header)
│
├── static/
│   ├── css/
│   │   ├── layout.css        # Sidebar, nav, responsive layout
│   │   └── styles.css        # Component styles
│   ├── js/
│   │   └── layout.js         # Shared JS (API calls, credits, persistence)
│   └── img/                  # Static images
│
└── page_templates/           # Individual page templates
    ├── grammar.html          # Grammar analysis
    ├── spelling.html         # Spelling correction
    ├── tashkeel.html         # Diacritization
    ├── morphology.html       # Morphological analysis
    ├── meanings.html         # Meanings & synonyms
    ├── grammar_bank.html     # Grammar rules bank
    └── dictionary.html       # Dictionary lookup
```

---

## 🚀 Deployment

### Production with PM2

```bash
# Start with PM2
pm2 start venv/bin/gunicorn --name lisan -- -w 3 -b 127.0.0.1:5000 app:app

# Save PM2 process list
pm2 save

# Auto-start on reboot
pm2 startup
```

### Nginx Configuration

```nginx
server {
    server_name lisan.yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }
}
```

---

## 👨‍💻 Developer

<div align="center">

**Alaadin Alynaey**

[![Website](https://img.shields.io/badge/Website-alaadin--alynaey.site-C9A227?style=for-the-badge)](https://alaadin-alynaey.site)
[![Email](https://img.shields.io/badge/Email-alaadinalynaey@gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:alaadinalynaey@gmail.com)

---

*Built with ❤️ and ☕ for the Arabic language*

</div>
