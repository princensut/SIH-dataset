# Research

## 1. Research Overview

This project focuses on developing an AI/ML-based system for identification, classification, and intensity estimation of tropical cyclones using multi-source satellite and meteorological data.

The research combines satellite-based brightness temperature observations with historical cyclone information to develop an automated end-to-end cyclone analysis pipeline.

## 2. Research Problem

Tropical cyclone analysis involves large volumes of satellite and meteorological observations. Extracting meaningful intensity information from these datasets requires extensive preprocessing, synchronization, and analysis.

The project investigates how deep learning can be used to automatically learn spatial patterns from satellite observations and estimate important cyclone-intensity parameters.

## 3. Research Objectives

- Develop an automated satellite-data preprocessing pipeline.
- Integrate satellite observations with historical cyclone records.
- Extract and standardize brightness-temperature information from NetCDF data.
- Develop a CNN-based model for cyclone intensity estimation.
- Predict wind speed and central pressure using multi-output regression.
- Classify cyclone intensity based on predicted wind speed.
- Integrate the model into an accessible web-based platform.
- Establish a foundation for future near-real-time cyclone intelligence.

## 4. Data Sources

### [NASA Earthdata](https://www.earthdata.nasa.gov/)

NASA Earthdata provides satellite observations used as the primary source of brightness-temperature information. The project uses scientific NetCDF data to preserve numerical observations and associated metadata.

### [IBTrACS](https://www.ncei.noaa.gov/products/international-best-track-archive)

The International Best Track Archive for Climate Stewardship (IBTrACS) provides historical tropical cyclone information, including cyclone tracks, wind speed, pressure, location, and timestamps.

### [MOSDAC](https://mosdac.gov.in/)

MOSDAC provides Indian satellite and meteorological data resources that can support future expansion of the dataset and integration of additional observations.

## 5. Data Processing Methodology

The satellite data is processed through the following stages:

1. NetCDF file identification and loading.
2. Brightness-temperature variable extraction.
3. Data validation and quality checking.
4. Missing and invalid observation handling.
5. Timestamp synchronization with cyclone records.
6. Brightness-temperature normalization.
7. Spatial resizing to 128 × 128 pixels.
8. Dataset generation for model training and evaluation.

Cyclone-wise train, validation, and test splits are used to reduce the risk of data leakage between different cyclone events.

## 6. AI/ML Methodology

A Convolutional Neural Network (CNN) is used to learn spatial patterns from satellite brightness-temperature observations.

The model performs multi-output regression with two outputs:

- Wind speed
- Central pressure

The predicted wind speed is subsequently mapped to the corresponding cyclone-intensity category.

The current implementation serves as a baseline model, with further improvements planned through larger datasets, additional features, and advanced architectures.

## 7. System Architecture

The research pipeline connects scientific data processing with AI inference and web deployment:

**Satellite NetCDF → Brightness Temperature → Preprocessing → CNN → Wind Speed & Pressure → Intensity Classification → Web Dashboard**

The backend is implemented using FastAPI, while the frontend uses React/Vite. SQLite is used to maintain prediction history.

## 8. Research Contributions

The main contribution of this work is the integration of:

- Multi-source cyclone and satellite data.
- Automated scientific preprocessing.
- Brightness-temperature-based AI analysis.
- CNN-based multi-output intensity estimation.
- Automated cyclone-intensity classification.
- API-based model deployment.
- Web-based visualization and prediction history.

Rather than focusing only on model development, the project establishes an end-to-end framework connecting scientific observations, machine learning, and an accessible application.

## 9. Current Limitations

- Limited labelled cyclone observations.
- Missing or invalid satellite pixels.
- Differences in temporal resolution between datasets.
- Limited satellite features in the current baseline.
- Model generalization requires larger-scale validation.
- Current predictions should be treated as a baseline rather than operational forecasts.

## 10. Future Research

Future research will focus on:

- Expanding the number of cyclone events.
- Incorporating additional satellite channels.
- Integrating environmental variables such as atmospheric and oceanic parameters.
- Evaluating advanced CNN and deep-learning architectures.
- Improving model generalization through larger cyclone-wise datasets.
- Developing uncertainty estimation for predictions.
- Automating satellite-data ingestion.
- Extending the system toward near-real-time cyclone intelligence.

## 11. Key Technologies

- Python
- TensorFlow / Keras
- CNN
- NumPy
- Pandas
- xarray
- NetCDF
- Pillow
- FastAPI
- React
- Vite
- SQLite
- Render

## 12. References

### Data Sources

- NASA Earthdata
- IBTrACS
- MOSDAC

### Technical Foundations

- Convolutional Neural Networks and deep learning literature
- Satellite-based tropical cyclone intensity estimation research
- Brightness-temperature-based meteorological analysis
- Multi-source Earth observation research

## 13. Research Direction

The long-term objective is to develop a scalable multimodal cyclone-intelligence framework capable of combining satellite observations, historical cyclone information, and environmental variables for improved cyclone identification, classification, and intensity estimation.
