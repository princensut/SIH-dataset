# CycloneAI — Deployment Guide (Vercel + Render)

This project is configured for a unified deployment:
- **Frontend**: Next.js deployed to **Vercel**
- **Backend**: FastAPI + TensorFlow ML pipeline deployed to **Render** (free tier)
- **API Proxy**: Next.js Serverless Routes (`/api/*` and `/api`) proxy requests to Render, making the entire application function seamlessly under a single domain with zero CORS issues.
- **Keep-Alive Cron**: Keeps Render's free tier awake 24/7 so predictions are instantaneous without cold-start delays.

---

## Step 1: Deploy Backend on Render

1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** -> **Blueprint** (or **Web Service**).
2. Connect your Git repository (`SIH-dataset`).
3. Render will automatically detect `render.yaml` at the root and configure:
   - **Service Name**: `cycloneai-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
   - **Environment Variables**:
     - `PYTHON_VERSION`: `3.11.9`
     - `TF_CPP_MIN_LOG_LEVEL`: `2`
4. Click **Apply**.
5. Once the build finishes and service is active, copy your Render Web Service URL (e.g., `https://cycloneai-backend.onrender.com`).
6. Verify the backend is live by opening:
   ```
   https://cycloneai-backend.onrender.com/health
   ```
   You should receive:
   ```json
   {"status":"healthy","model_loaded":true}
   ```

---

## Step 2: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
2. Import your Git repository.
3. In the project setup settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: Click "Edit" and choose `frontend`
   - **Environment Variables**: Add one variable:
     - **Key**: `BACKEND_URL`
     - **Value**: `https://cycloneai-backend.onrender.com` (your Render URL from Step 1, without trailing slash)
4. Click **Deploy**.
5. Once deployed, visit your Vercel URL (e.g. `https://cyclone-ai.vercel.app`).
   - The UI loads directly from Vercel's Edge CDN.
   - All backend calls go to `/api/*` and are proxied automatically to your Render backend.

---

## Step 3: Keep Backend Alive 24/7 (Choose One)

Render's free tier spins down web services after 15 minutes of inactivity. We provide two free options and one native option:

### Option A: GitHub Actions (Recommended, 100% Free)
A ready-to-use GitHub Actions workflow is included at `.github/workflows/keep-alive.yml`.
1. In your GitHub repository, go to **Settings** -> **Secrets and variables** -> **Actions**.
2. Click **New repository secret**.
3. Name: `BACKEND_URL`
4. Value: `https://cycloneai-backend.onrender.com`
5. GitHub will automatically ping `https://cycloneai-backend.onrender.com/ping` every 14 minutes.

### Option B: Free External Web Cron (cron-job.org or UptimeRobot)
1. Register on [cron-job.org](https://cron-job.org) or [uptimerobot.com](https://uptimerobot.com) (free).
2. Create a new monitor / cron job:
   - **URL**: `https://cycloneai-backend.onrender.com/ping`
   - **Interval**: Every 10 to 14 minutes.

### Option C: Render Native Cron Service
If you have a Render paid plan (Starter $1/mo min), uncomment the `type: cron` block in `render.yaml` to have Render schedule the pings natively.

---

## Local Development

To run the entire app locally:

1. **Backend**:
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate  # Windows (or source .venv/bin/activate on Mac/Linux)
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:3000`. Next.js proxies all `/api/*` requests to `http://127.0.0.1:8000` automatically!
