# FormNest - Typeform Clone (Next.js & FastAPI)

A modern, full-stack clone of Typeform featuring a conversational form respondent flow, an interactive drag-and-drop form builder, variables management, logic branching, integrations, and workspace collaboration.

---

## 🚀 Features

*   **Form Builder**: Drag-and-drop question ordering, interactive canvas preview, and dynamic right properties panel settings customized per question type.
*   **Conversational Flow**: One-question-at-a-time form responding flow with custom progress bars and responsive design for mobile & desktop views.
*   **Variables Modal**: Manage default and custom variables (`score`, `price`, `segment`) in your form settings.
*   **Logic Branching**: Add question routing rules to customize the flow based on user responses.
*   **Integrations**: Direct Google Sheets account linking and spreadsheet integration workflow.
*   **Workspace Collaboration**: Create workspaces, invite teammates, duplicate forms, and manage workspace actions.

---

## 🛠️ Technology Stack

### Frontend
*   **Framework**: Next.js 14 (App Router)
*   **State & Transitions**: React, Framer Motion
*   **Styling**: Tailwind CSS
*   **Deployment**: Netlify

### Backend
*   **Framework**: FastAPI (Python 3.9+)
*   **Database ORM**: SQLAlchemy with SQLite
*   **Server**: Uvicorn
*   **Deployment**: Render

---

## 📦 Local Setup Instructions

### 1. Prerequisites
Ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [Python](https://www.python.org/) (v3.9 or higher)

### 2. Backend Setup
1.  Navigate into the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # On Windows:
    .\venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```
3.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Start the FastAPI local development server:
    ```bash
    uvicorn app.main:app --reload
    ```
    *The API will be available at `http://localhost:8000`.*

### 3. Frontend Setup
1.  Navigate into the `frontend/` directory:
    ```bash
    cd ../frontend
    ```
2.  Install npm dependencies:
    ```bash
    npm install
    ```
3.  Create an environment configuration file:
    Create a `.env.local` file inside the `frontend/` folder:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8000
    ```
4.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
    *The site will be available at `http://localhost:3000`.*

---

## ☁️ Deployment Guide

This project is optimized with configuration files for deploying the **Frontend to Netlify** and the **Backend to Render**.

### 1. Backend Deployment (Render)
Render reads the root `render.yaml` blueprint file automatically to deploy the web service.

1.  Sign in to [Render](https://render.com/).
2.  Click **New +** and select **Blueprint**.
3.  Connect your Git repository.
4.  Render will auto-detect the configuration:
    *   **Service Name**: `typeform-clone-backend`
    *   **Environment**: `Python`
    *   **Root Directory**: `backend`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5.  Click **Apply** to deploy. Copy your Render service URL (e.g. `https://typeform-clone-backend.onrender.com`).

### 2. Frontend Deployment (Netlify)
Netlify reads the root `netlify.toml` file to manage monorepo builds automatically.

1.  Sign in to [Netlify](https://www.netlify.com/).
2.  Click **Add new site** -> **Import from Git**.
3.  Select your Git repository.
4.  Netlify will automatically load the build settings from `netlify.toml`:
    *   **Base directory**: `frontend`
    *   **Build command**: `npm run build`
    *   **Publish directory**: `.next`
5.  **Environment Variables**: Add your backend server URL in the Netlify site configuration environment variables:
    *   `NEXT_PUBLIC_API_URL` = `https://your-backend-service-url.onrender.com` (Your Render backend URL).
6.  Click **Deploy site**.

---

## 📄 License
This project is open-source. Feel free to customize and extend it!