# MiniKaland

## About the Project

MiniKaland is a web application that generates age-appropriate activities for children using a large language model. I built it to make it easier for parents to come up with practical games without spending time searching for ideas or buying special materials.

The user chooses the child's age, the time available, a topic, and one or more activity types. MiniKaland then generates an activity in Hungarian with a title, a short description, a materials list, three steps, and a safety note. The suggestions are generated for each request rather than selected from a fixed catalogue.

## How It Works

The React frontend collects the user's preferences and sends them to a Python backend built with FastAPI. The backend prepares a prompt, calls the Google Gemini API, and validates the structured JSON response before returning the activity to the interface.

The prompt combines the user's input with instructions about age suitability, everyday materials, clear steps, and safety. It can also include titles from the current session to encourage the model to suggest a different activity on subsequent requests. This helps reduce repetition but does not guarantee unique results.

The frontend communicates with the API through `MiniKaland_frontend/src/lib/api.ts`. The backend routes are defined in `backend/routes.py`, activity generation is handled by `backend/activity_service.py`, and the prompts are assembled in `backend/prompts.py`. The actual Gemini requests are made in `backend/gemini_service.py`, using response schemas defined in `backend/schemas.py`.

## Skills

MiniKaland has four selectable prompt-based skills: Montessori, Skill Development, Creative Activities, and Movement Activities. Montessori focuses on independent exploration, sensory experiences, and practical tasks. Skill Development emphasizes attention, memory, logical thinking, and language. Creative Activities encourage imagination and open-ended expression. Movement Activities focus on coordination, balance, and safe physical play, with opportunities to include rhymes or songs.

The skills are defined as separate Python instructions in `backend/skills.py`. When more than one skill is selected, `build_skill_instructions()` combines their instructions into the activity prompt. They are modular prompt components, not separate agents or native Gemini skills.

## AI Tools

The application also includes two additional AI-powered tools that work with an activity after it has been generated. They are exposed as separate FastAPI endpoints, rather than being invoked through Gemini's native function-calling mechanism.

The **Development Evaluation** tool estimates three developmental areas supported by an activity and assigns each one a rating of one to three stars. It makes a separate Gemini request using the activity's details. The result is intended as an informal interpretation of the activity, not a validated developmental assessment or diagnosis.

The **Adventure Sheet** tool generates an extra challenge related to the activity and produces a downloadable A4 PDF. Gemini generates the short bonus content, while Python and ReportLab handle the PDF layout. The PDF is designed to be printed and used alongside the original game, rather than replacing it.

Both tool implementations are in `backend/tools.py`. Their prompts are in `backend/prompts.py`, their API routes are in `backend/routes.py`, and the PDF rendering code is in `backend/pdf_renderer.py`. Keeping the tools separate also means that a failed optional tool request does not erase an activity that has already been generated.

## Technology and Development

The frontend uses React, TypeScript, and Vite. The backend uses Python, FastAPI, Pydantic, and the Google Gen AI SDK. ReportLab generates the printable PDF, while pytest and FastAPI's TestClient support backend testing.

I started the interface with Lovable and continued development in Visual Studio Code, using GitHub Copilot to assist with implementation, debugging, and refactoring. Git and GitHub were used to track changes throughout the project.

The backend is organized into modules for routing, data validation, prompts, skills, Gemini communication, activity generation, tools, and PDF rendering. This separation makes the different AI features easier to test and maintain.

## Reliability and Testing

Model output is validated against Pydantic schemas before the frontend uses it. Backend tests cover the API endpoints, input validation, generated responses, tool behaviour, and PDF generation, using mocked Gemini responses so that automated tests do not depend on a live API key. The frontend also has tests for API error handling and request sequencing.

Gemini is an external service, so requests can occasionally fail or take longer than expected. The backend includes limited retries for temporary service-unavailable responses and an alternative model attempt after repeated availability failures. Other errors, such as invalid requests or exhausted quotas, are not retried indiscriminately. The application reports failures rather than silently passing off a predefined activity as a generated result.

## Running the Project Locally

You will need Python, Node.js, npm, and a Google Gemini API key. Run the commands below from the repository root, unless otherwise noted.

Create a Python virtual environment, activate it, and install the backend dependencies:

```powershell
python -m venv backend/.venv
.\backend\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
```

Create `backend/.env` based on `backend/.env.example` and set `GEMINI_API_KEY` to your own key. Do not commit this file.

Start the backend from the repository root:

```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn backend.main:app
```

Open a second terminal and start the frontend:

```powershell
cd MiniKaland_frontend
npm install
npm run dev
```

The application is available at `http://localhost:5173`. FastAPI's interactive API documentation is at `http://127.0.0.1:8000/docs`. The frontend uses the local backend by default; a different API URL can be set with `VITE_API_BASE_URL`.

## API Endpoints

The backend exposes `GET /health` for a basic health check, `POST /jatek` for activity generation, `POST /jatek/ertekeles` for developmental evaluation, and `POST /jatek/kalandlap` for a printable PDF bonus card. Request and response schemas are available through the FastAPI documentation.

## Running the Tests

Run the backend tests from the repository root:

```powershell
.\backend\.venv\Scripts\python.exe -m pytest backend
```

Run frontend tests and check the production build:

```powershell
cd MiniKaland_frontend
npm test
npm run build
```

A manual Gemini smoke test is available through `python -m backend.manual_gemini_smoke`. Unlike the mocked automated tests, this calls the live Gemini API and requires a valid API key.

## Limitations and Lessons Learned

MiniKaland is a prototype, not a substitute for adult supervision or professional developmental advice. AI-generated activities may vary in quality or repeat ideas, and parents should review the materials, steps, and safety instructions before using them.

The project helped me explore how an LLM fits into a larger application. Prompt design matters, but so do structured responses, input and output validation, independent tools, error handling, and automated testing. Those surrounding components are what make generated content practical to use.
