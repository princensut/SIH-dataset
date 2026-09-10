<img width="1362" height="628" alt="image" src="https://github.com/user-attachments/assets/2bf3d83e-20a5-42ba-b272-9ada9b42a1c8" /># Cyclone Intensity Prediction

## 1. Project Information

- Project Title: Cyclone AI - Cyclone  Intensity Prediction
- PS ID: SIH26070
- PS Title: AI-powered tropical cyclone intensity estimation and disaster-risk assessment from satellite data
- Category: Software
- Theme: Disaster Management / Climate Resilience

## Project Snapshot

- Detects cyclone intensity from satellite inputs(NetCDF files)
- Uses a deep learning model for wind-speed and pressure estimation
- Classifies storm severity using IMD-style categories
- Provides a web dashboard for live results and history
- Stores prediction records using SQLite for analysis

## 2. Problem Statement

Early identification and intensity estimation of tropical cyclones remain challenging because meteorologists and disaster-response teams often rely on limited satellite interpretation and delayed forecasting workflows. In many situations, the lack of rapid and reliable intensity estimates can lead to poor preparedness, weaker emergency planning, and higher risk to coastal communities.

This project addresses that gap by creating an AI-driven system that can estimate cyclone intensity from satellite brightness-temperature data in near real time, helping users make faster and more informed decisions.

## 3. Proposed Solution

We propose an end-to-end cyclone intensity prediction system built with a machine-learning model, a FastAPI backend, and a React-based dashboard. The system accepts satellite data in NetCDF format, preprocesses it, predicts cyclone intensity metrics such as wind speed and central pressure, classifies the storm according to IMD severity levels, and displays results through an interactive web interface.

The platform also keeps a prediction history for analysis and supports quick deployment for demo and evaluation scenarios.

## 4. Key Features

- Satellite-based cyclone intensity prediction using deep learning
- NetCDF file upload and preprocessing pipeline
- Wind speed and central pressure estimation
- IMD-style intensity classification
- Interactive dashboard for prediction and result analysis
- Prediction history tracking with SQLite persistence
- FastAPI backend with API documentation
- Responsive frontend for demo and deployment

## 5. Technology Stack

- Frontend: React, TypeScript, Next.js, Tailwind CSS
- Backend: Python, FastAPI, Uvicorn
- Machine Learning: TensorFlow / Keras, NumPy
- Data Processing: NetCDF, Pandas, SciPy
- Database: SQLite
- Deployment: Render / Vercel-ready architecture

## 6. Architecture

See [docs/architecture.md](docs/architecture.md) for the system design and data flow.

```mermaid
flowchart LR
    A[Satellite NetCDF Input] --> B[Preprocessing Pipeline]
    B --> C[Deep Learning Model]
    C --> D[Wind Speed + Pressure Estimation]
    D --> E[Severity Classification]
    E --> F[FastAPI Backend]
    F --> G[Dashboard + Prediction History]
    G --> H[Decision Support]
```

### System Overview

```text
User / Operator
      |
      v
Frontend Dashboard
      |
      v
FastAPI Backend
      |
      +----> Preprocessing Pipeline
      |
      +----> Deep Learning Model
      |
      +----> SQLite Prediction History
      |
      v
Prediction Results + Severity Classification
```

## 7. Repository Structure

```text
SIH-dataset/
├── README.md
├── Reasearch.md
├── SUBMISSION_GUIDE.md
├── DEPLOYMENT.md
├── requirements.txt
├── runtime.txt
├── render.yaml
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── requirements.txt
│   ├── model/
│   │   └── cyclone_intensity_model.keras
│   ├── preprocessing/
│   │   └── preprocess.py
│   ├── schemas/
│   │   └── prediction.py
│   ├── services/
│   │   ├── model_service.py
│   │   └── prediction_service.py
│   └── test/
│       └── test_api.py
├── frontend/
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── public/
│   └── src/
├── src/
│   ├── models/
│   ├── preprocessing/
│   ├── training/
│   └── visualization/
├── data/
│   ├── metadata/
│   ├── processed/
│   └── splits/
├── docs/
│   └── architecture.md
├── submission/
│   ├── PRESENTATION.md
│   └── DEMO.md
├── assets/
│   └── screenshots/
├── evaluate_model.py
├── create_seamless_earth_clip.py
├── training/
│   └── notebooks/
└── .gitignore
```

## 8. Final Presentation

Keep the final SIH presentation in this repository whenever the file size allows. If the presentation file is too large for GitHub, upload it to Google Drive or OneDrive and add the shareable link in [submission/PRESENTATION.md](submission/PRESENTATION.md).

## 9. Demo Video

A demo video is recommended to explain the product in action. Add the YouTube or Google Drive link in [submission/DEMO.md](submission/DEMO.md).

## 10. Screenshots / Prototype Photos

<img width="1362" height="628" alt="image" src="https://github.com/user-attachments/assets/52683236-11b2-4d11-86de-e64d77db20aa" />



## 11. Installation

```bash
git clone https://github.com/princensut/SIH-dataset.git
cd SIH-dataset

# Python environment
python -m venv .venv
# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1
# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
```

## 12. Run

### Backend

```bash
python -m uvicorn backend.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend UI: http://localhost:3000 or http://localhost:5173 depending on the configured dev server.

## 13. Future Scope

- Extend the model to support multi-cyclone tracking and sequence-based forecasting
- Add real-time geospatial visualization for cyclone paths and intensity zones
- Integrate radar and weather data sources for improved prediction accuracy
- Build a mobile-friendly early-warning dashboard for emergency response teams
- Add multilingual advisory generation for farmers and coastal communities

## Important

Before submission, ensure the repository is public and accessible to reviewers. Do not upload passwords, API keys, access tokens, or sensitive confidential data.

## About

Cyclone Intensity Prediction is an AI-assisted disaster-preparedness system that estimates tropical cyclone intensity from satellite brightness-temperature data. It combines modern deep learning with a practical web interface to speed up cyclone assessment and decision support.

## License

This project is distributed under the MIT license. See the repository LICENSE file for details.

## Contributors
- Env pushers
- Members:
- 1. Prince kumar (https://www.github.com/princensut)
  2. Lakshay dhall (https://www.github.com/lakshay2k6)
  3. Rishabh Gupta (https://www.github.com/rishicancode)
  4. Nidhi (https://www.github.com/thenidhz)
  5. arshiya jain (https://www.github.com)
  6. Rohit dahiya (https://www.github.com/senkuthegreat)

## Languages

- Python
- TypeScript
- JavaScript
  
