# Architecture

## Overview

The system is designed as a modular AI pipeline for cyclone intensity estimation from satellite brightness-temperature data.

## Components

### 1. Data acquisition

Satellite data is supplied as NetCDF files containing brightness-temperature information. The preprocessing layer validates the file, loads the relevant arrays, and normalizes values before feeding them into the model.

### 2. Preprocessing pipeline

The preprocessing module performs:

- file validation
- NetCDF parsing
- shape and array checks
- normalization to model-compatible ranges
- resizing and formatting for CNN input

### 3. Deep learning model

A TensorFlow/Keras CNN model estimates cyclone attributes such as wind speed and central pressure. The model output is then mapped into intensity categories based on cyclone severity thresholds.

### 4. Backend API

The FastAPI backend exposes endpoints for:

- health checks
- upload of NetCDF data
- prediction execution
- prediction history retrieval
- result serialization with metadata

### 5. Frontend dashboard

The React frontend provides an interactive experience for uploading files, reviewing model outputs, and inspecting prior predictions.

## Data flow

```text
Satellite NetCDF file
        |
        v
Preprocessing layer
        |
        v
CNN model inference
        |
        +--> Estimated wind speed / pressure
        |
        v
Severity classification
        |
        v
API response + UI display
        |
        v
SQLite prediction history
```

## Deployment view

The project is structured to support local development and cloud deployment, with the backend and frontend running as separate services and communicating through HTTP requests.
