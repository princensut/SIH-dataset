# SIH Submission Guide

## 1. Project Overview

This repository contains the complete implementation of an AI/ML-based Tropical Cyclone Intelligence Platform developed for **SIH Problem Statement 26070**.

The system integrates multi-source satellite and cyclone data, automated scientific preprocessing, CNN-based intensity estimation, and a web-based prediction platform.

## 2. Repository Readiness

Before submission, verify that:

- The repository is public and accessible.
- The README contains the SIH problem statement, project overview, solution, features, architecture, and setup instructions.
- No API keys, passwords, tokens, `.env` files, or other secrets are committed.
- Backend, frontend, preprocessing, training, and deployment files are organized correctly.
- The trained model required for inference is available at the documented location.
- All project names, PS ID, dataset names, and technical terminology are consistent.

## 3. Submission Checklist

- [ ] README completed and updated
- [ ] SIH PS 26070 clearly mentioned
- [ ] Project description and key features added
- [ ] System architecture documented in `docs/architecture.md`
- [ ] Research documentation added in `RESEARCH.md`
- [ ] Demo video link added in `submission/DEMO.md`
- [ ] Presentation/PPT link added in `submission/PRESENTATION.md`
- [ ] Project screenshots added under `assets/screenshots/`
- [ ] Backend API tested successfully
- [ ] Frontend and backend integration verified
- [ ] NetCDF upload-to-prediction workflow tested
- [ ] Prediction history and filtering verified
- [ ] Deployment verified
- [ ] Installation and execution steps tested from a clean environment

## 4. Data & AI/ML

The project uses:

- **NASA Earthdata** for satellite observations
- **IBTrACS** for historical cyclone information
- **MOSDAC** for Indian satellite and meteorological data resources
- **NetCDF/xarray** for scientific data processing
- **Brightness Temperature** as the primary satellite feature
- **CNN** for spatial feature extraction and intensity estimation
- Multi-output regression for **wind speed and central pressure**

The current model should be presented as a **baseline implementation**. Large-scale validation and further model improvement remain part of the future research scope.

## 5. Application Demo

The demonstration should clearly show the complete workflow:

1. Open the deployed cyclone-analysis platform.
2. Upload a supported satellite **NetCDF** file.
3. Show automated data validation and preprocessing.
4. Generate the AI prediction.
5. Display predicted wind speed, central pressure and intensity category.
6. Demonstrate prediction history.
7. Demonstrate search/filter functionality.
8. Briefly explain the backend and model pipeline.

The demo should focus on the complete working workflow rather than only showing individual screens.

## 6. Technical Architecture

The major system flow is:

**Satellite NetCDF → Brightness Temperature Extraction → Data Validation & Preprocessing → CNN → Wind Speed & Pressure → Intensity Classification → FastAPI → React Dashboard → SQLite**

The repository should contain sufficient documentation for evaluators to understand this architecture without requiring additional explanation.

## 7. Deployment

The deployed application should be tested before submission.

Verify:

- Frontend loads correctly.
- Backend API is accessible.
- NetCDF files can be uploaded.
- Model inference works correctly.
- Prediction results are displayed properly.
- Prediction history is stored and retrieved.
- No development-only localhost configuration remains in the production frontend.
- Deployment configuration is documented.

## 8. Presentation & Demo Video

The PPT should communicate:

- Problem and motivation
- Proposed solution
- Multi-source datasets
- Technical approach
- System architecture
- Working web application
- Challenges and mitigation strategies
- Technical and deployment feasibility
- Impact and benefits
- Future scope
- Research references

The demo video should provide a concise walkthrough of the **actual deployed system**, including the NetCDF upload, AI prediction and prediction-history workflow.

## 9. Evaluation Readiness

Evaluators should be able to understand:

- What problem the project solves.
- Why satellite NetCDF data is used.
- How brightness temperature is processed.
- How the CNN generates predictions.
- How wind speed and pressure are obtained.
- How the web application communicates with the backend.
- How prediction history is maintained.
- How the system is deployed.
- What the current limitations are.
- How the system can be extended in the future.

## 10. Final Review

Before submission, perform a complete end-to-end test:

**Dataset → Preprocessing → Model → API → Web Dashboard → Prediction → History → Deployment**

Ensure that all links, screenshots, documentation, repository files, PPT and demo video are final and accessible.

The submission should present the project as a **complete end-to-end cyclone intelligence platform**, rather than only as a machine-learning model or a web application.
