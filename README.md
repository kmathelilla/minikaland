# MiniKaland

### AI-Powered Activity Planner for Kids

MiniKaland is a web application designed to help parents discover creative, educational, and age-appropriate activities for their children.

The goal is simple: **turn everyday moments into meaningful adventures.**

## Features

- Personalized activity recommendations based on age and available time
- Four activity categories: Montessori, Skill Development, Creative, and Physical Activities
- Simple, modern, and responsive user interface
- Activity suggestions with materials and instructions
- AI-powered activity generation using Google Gemini *(planned)*

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript |
| Backend | Python, FastAPI |
| AI Model | Google Gemini API |
| AI Skills | Four specialized SKILL.md modules |
| Tools | Python function calling |
| Development | VS Code, GitHub Copilot |
| Version Control | Git, GitHub |

## AI Architecture

The planned AI system combines four specialized skills:

1. **Montessori** – Independent, hands-on learning activities
2. **Skill Development** – Cognitive and motor skill exercises
3. **Creative** – Imaginative arts, crafts, and storytelling
4. **Physical Activities** – Movement-based indoor and outdoor games

Three custom tools will support activity discovery, material availability checks, and time planning.

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.10 or newer (for the backend)

### Frontend

```bash
cd MiniKaland_frontend
npm install
npm run dev
```

Open the local URL displayed in the terminal.

### Backend

Install dependencies from the project root:

```powershell
python -m pip install -r backend\requirements.txt
```

Set `GEMINI_API_KEY` in `backend\.env`, then start the API:

```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

The API is available at `http://127.0.0.1:8000`. Check `GET /health`, or
generate an activity with `POST /jatek`:

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/jatek `
  -ContentType "application/json" `
  -Body '{"age":6,"duration":20,"theme":"erdő"}'
```

The request accepts ages 3–12, durations of 5–120 minutes, and a theme.
The response contains a title, materials list, and exactly three activity
steps. Run the mocked backend tests from the project root with
`backend\.venv\Scripts\python.exe -m pytest backend`.

## Project Status

**Work in progress.**

The initial React frontend and visual design are available