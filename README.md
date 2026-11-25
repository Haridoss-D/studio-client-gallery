# Studio Frame

Private client photo selection platform. React + Vite, Django REST Framework, Neon PostgreSQL, Cloudinary.

## Run locally (Windows PowerShell)

Backend:
    cd backend
    python -m venv venv
    venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    copy .env.example .env      (then edit .env)
    python manage.py migrate
    python manage.py createsuperuser
    python manage.py runserver

Frontend (second terminal):
    cd frontend
    npm install
    npm run dev
