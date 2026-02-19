# CodeNest 🐣✨

AI-powered plagiarism detection for academic code projects. CodeNest helps faculties and students ensure academic integrity with fast analysis, detailed similarity reports, and a modern single-page experience.

## 🚀 Highlights

- 🎯 Single landing page with smooth scroll + scroll‑spy navigation
- 🧑‍🏫 Faculty workflow: batch uploads, project history, detailed insights
- 🧑‍🎓 Student workflow: pre‑submission checks with actionable tips
- 🔐 Role‑based auth (faculty/student) and protected routes
- 📊 ML‑powered similarity detection (pre‑trained model included)
- ⚡ Fast, responsive React UI with Framer Motion animations

## 🗂️ Repository Structure

```
CodeNest/
  backend/                 # Django backend (API + ML integration)
  frontend/                # React (Vite) frontend app
  README.md                # You are here ✅
```

Backend apps: `authentication/`, `plagiarism_check/`, `project_analysis/`, `blog/`

Frontend dirs: `src/components/`, `src/pages/`, `src/context/`, `src/services/`

## 🧰 Tech Stack

- Frontend: React (Vite) · React Router · Context API · Tailwind CSS · Framer Motion · Lucide Icons
- Backend: Django · Django REST Framework
- ML: scikit‑learn model serialized as `plagiarism_model.pkl`
- DB: SQLite (development)

## ▶️ Getting Started

Run backend (API) and frontend (app) separately. Windows PowerShell shown; macOS/Linux equivalents provided.

### 1) Backend (Django API)

Prerequisites: Python 3.10+ and pip

```powershell
cd backend
python -m venv .venv
. .venv\Scripts\Activate.ps1   # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

API: `http://localhost:8000/`

Optional backend .env (or configure in settings):

```env
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=CodeNest <no-reply@codenest.com>
```

### 2) Frontend (Vite React)

Prerequisites: Node 18+

```powershell
cd frontend
npm install

# API base URL
echo VITE_API_BASE_URL=http://localhost:8000 > .env

npm run dev
```

App: typically `http://localhost:5173`

### 3) Default Routes

- Landing: `/` (Hero, Features, Faculty, Student, Contact in one page)
- Auth: `/login`, `/register`
- Faculty: `/faculty/upload`, `/faculty/history`, `/faculty/results/:batchId`
- Student: `/student/upload`, `/student/history`, `/student/results/:projectId`
- Profile: `/profile`
- Blog: `/blog`

## 🧪 Typical Workflows

- Faculty
  1. Register/login
  2. Upload a zipped batch of student projects
  3. View batch results with similarity scores and insights
  4. Review prior batches in History

- Student
  1. Register/login
  2. Upload your project for pre‑submission checks
  3. Review similarity report and recommendations
  4. Track your submission history

## 🧱 Frontend Notes

- `components/CodeNestLanding.jsx` contains all public sections with:
  - Smooth scrolling and scroll‑spy highlighting
  - Programmatic scrolling with a header offset so section titles aren’t obscured
  - Framer Motion animations for a premium feel

## 🔌 Backend Notes

- DRF exposes JSON APIs for auth, uploads, analysis, and history
- Pre‑trained model at `backend/ml_models/plagiarism_model.pkl`
- SQLite by default; switch to Postgres/MySQL for production

## 🐞 Troubleshooting

- CORS issues: ensure `VITE_API_BASE_URL` matches backend URL; set CORS on backend
- Port conflicts: `npm run dev -- --port 5174` (frontend) · `python manage.py runserver 0.0.0.0:8001` (backend)
- Migrations: `python manage.py makemigrations && python manage.py migrate`

## 🛡️ Production Checklist

- Postgres (or managed DB) + persistent object storage for uploads
- SMTP or transactional email provider
- HTTPS, reverse proxy (Nginx), gunicorn/uvicorn
- Frontend build: `npm run build` and serve via CDN/Nginx
- Set `DJANGO_DEBUG=False`, rotate a strong `DJANGO_SECRET_KEY`

## 🔭 Future Scope

- 📬 Contact form → backend email delivery + CRM integration
- 🤖 Continuous model training and evaluation pipeline
- 🧩 Similarity explanations with code diff visualizations
- 🧑‍💼 Organization multi‑tenancy and granular roles
- 🌐 i18n and RTL support
- 🐳 Docker Compose for one‑command dev setup
- ✅ CI/CD with automated tests and quality gates

## 🤝 Contributing

1. Fork and create a feature branch
2. Follow existing code style and lint rules
3. Open a PR with a clear description and screenshots if UI changes

## 📄 License

For educational purposes. Add a LICENSE file if you intend to distribute.

— Made with ❤️ for students and educators.

