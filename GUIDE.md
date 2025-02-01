# Crawl4AI Web Interface Guide

## Prerequisites
- Node.js v16+ 
- Python 3.9+
- PostgreSQL 13+

## Installation
```bash
# Clone repository
git clone https://github.com/yourorg/crawl4ai-web.git
cd crawl4ai-web

# Frontend setup
cd frontend
npm install

# Backend setup
cd ../backend
pip install -r requirements.txt

# Environment variables
cp .env.example .env  # Update with your credentials
```

## Running the Application
```bash
# Start frontend (from /frontend)
npm run dev

# Start backend (from /backend)
python main.py
```

## Key Features
### 1. Dashboard
- Access at `http://localhost:5173/dashboard`
- Real-time metrics:
  - Active crawls
  - System resource usage
  - Crawl success rates

### 2. Crawler Interface
- URL: `http://localhost:5173/crawler`
- Parameters:
  - URL: Target website
  - Extraction Mode (Basic/Advanced)
  - Depth (1-5 pages)
  - Timeout (30-300 seconds)

### 3. Scheduled Crawls
- Create recurring crawls:
  - Daily/Weekly/Monthly
  - Email notifications
  - Automatic data exports

### 4. Settings
- Configure:
  - API Keys (DeepSeek, Supabase)
  - Rate Limits
  - Data Retention Policies
  - Notification Preferences

## Authentication
1. Sign up with email/password
2. Verify email
3. Manage API keys in Settings

## Troubleshooting
```bash
# Common issues
- Backend not running: Check port 8000
- CORS errors: Verify .env CORS settings
- Missing dependencies: Re-run npm install/pip install
```

## Development Notes
- Mock Data: Enabled by default
- Tech Stack:
  - Frontend: React + Vite + Material-UI
  - Backend: FastAPI + Supabase
  - Database: PostgreSQL

## Support
Contact: support@crawl4ai.com
Documentation: https://docs.crawl4ai.com
