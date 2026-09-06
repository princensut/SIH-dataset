from pathlib import Path
from time import perf_counter
from uuid import uuid4
from typing import List

import numpy as np
import tensorflow as tf

from fastapi import (
    FastAPI,
    File,
    UploadFile,
    HTTPException,
    Query,
)

from fastapi.middleware.cors import CORSMiddleware

from preprocessing.preprocess import (
    load_tb_from_netcdf,
    validate_tb,
    preprocess_tb,
    inverse_transform_predictions,
    TB_MIN,
    TB_MAX,
    IMAGE_SIZE,
)

from database import (
    initialize_database,
    save_prediction,
    get_all_predictions,
    get_prediction,
)

from schemas.prediction import (
    PredictionResponse,
    PredictionHistoryResponse,
    BatchPredictionResponse,
)


# ============================================================
# APPLICATION CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = (
    BASE_DIR
    / "model"
    / "cyclone_intensity_model.keras"
)

API_VERSION = "1.3.0"

MAX_FILE_SIZE = 50 * 1024 * 1024


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Cyclone Intensity Prediction API",
    description=(
        "AI-powered backend for tropical cyclone intensity "
        "estimation from satellite brightness-temperature data."
    ),
    version=API_VERSION,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# GLOBAL MODEL
# ============================================================

model = None


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

@app.on_event("startup")
def startup():

    global model

    print()
    print("=" * 60)
    print("CYCLONE AI BACKEND STARTING")
    print("=" * 60)

    # --------------------------------------------------------
    # Initialize SQLite
    # --------------------------------------------------------

    try:

        initialize_database()

        print(
            "SQLite database initialized successfully."
        )

    except Exception as e:

        print(
            f"ERROR: Could not initialize database: {e}"
        )

    # --------------------------------------------------------
    # Load ML model
    # --------------------------------------------------------

    if not MODEL_PATH.exists():

        print(
            f"WARNING: Model not found at:\n{MODEL_PATH}"
        )

        print("=" * 60)

        return

    try:

        model = tf.keras.models.load_model(
            MODEL_PATH,
            compile=False,
        )

        print(
            "Cyclone intensity model loaded successfully."
        )

        print(
            f"Model path : {MODEL_PATH}"
        )

        print(
            f"Input shape: {model.input_shape}"
        )

        print(
            f"Outputs    : {model.output_names}"
        )

        print(
            f"Parameters : {model.count_params():,}"
        )

    except Exception as e:

        print(
            f"ERROR: Could not load model:\n{e}"
        )

        model = None

    print("=" * 60)
    print()


# ============================================================
# INTENSITY CLASSIFICATION
# ============================================================

def classify_intensity(wind_kt):
    """
    Classify cyclone intensity using wind speed in knots.
    """

    if wind_kt < 17:
        return "Below Depression"

    if wind_kt < 28:
        return "Depression"

    if wind_kt < 34:
        return "Deep Depression"

    if wind_kt < 48:
        return "Cyclonic Storm"

    if wind_kt < 64:
        return "Severe Cyclonic Storm"

    if wind_kt < 90:
        return "Very Severe Cyclonic Storm"

    if wind_kt < 120:
        return "Extremely Severe Cyclonic Storm"

    return "Super Cyclonic Storm"


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "name": "Cyclone Intensity Prediction API",
        "version": API_VERSION,
        "status": "running",
        "model_loaded": model is not None,

        "endpoints": {
            "health": "/health",
            "model_info": "/model-info",
            "prediction": "/predict",
            "batch_prediction": "/predict/batch",
            "prediction_history": "/predictions",
            "prediction_summary": "/predictions/summary",
            "documentation": "/docs",
        },
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    if model is None:

        return {
            "status": "degraded",
            "model_loaded": False,
        }

    return {
        "status": "healthy",
        "model_loaded": True,
    }


# ============================================================
# MODEL INFORMATION
# ============================================================

@app.get("/model-info")
def model_info():

    if model is None:

        raise HTTPException(
            status_code=503,
            detail="Prediction model is not loaded.",
        )

    return {

        "model_loaded": True,

        "model_file": MODEL_PATH.name,

        "input_shape": list(
            model.input_shape
        ),

        "outputs": model.output_names,

        "parameters": model.count_params(),

        "preprocessing": {

            "brightness_temperature_range_kelvin": [
                TB_MIN,
                TB_MAX,
            ],

            "model_image_size": list(
                IMAGE_SIZE
            ),

            "channels": 1,
        },

        "prediction_targets": [
            "wind_speed_kt",
            "pressure_mb",
        ],
    }


# ============================================================
# HELPER: VALIDATE UPLOAD
# ============================================================

async def read_and_validate_file(
    file: UploadFile
):

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file was uploaded.",
        )

    original_filename = file.filename

    filename = original_filename.lower()

    allowed_extensions = (
        ".nc",
        ".nc4",
        ".netcdf",
    )

    if not filename.endswith(
        allowed_extensions
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file type. "
                "Please upload a NetCDF file "
                "(.nc, .nc4, or .netcdf)."
            ),
        )

    try:

        file_bytes = await file.read()

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=(
                "Could not read uploaded file: "
                f"{str(e)}"
            ),
        )

    file_size = len(file_bytes)

    if file_size == 0:

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    if file_size > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=413,
            detail=(
                "Uploaded file is too large. "
                "Maximum allowed size is 50 MB."
            ),
        )

    return (
        original_filename,
        file_bytes,
        file_size,
    )


# ============================================================
# HELPER: RUN MODEL PREDICTION
# ============================================================

def run_model_prediction(X):

    if model is None:

        raise RuntimeError(
            "Prediction model is not loaded."
        )

    predictions = model.predict(
        X,
        verbose=0,
    )

    # --------------------------------------------------------
    # Handle dictionary output
    # --------------------------------------------------------

    if isinstance(
        predictions,
        dict,
    ):

        if "wind" not in predictions:

            raise ValueError(
                "Model output does not contain 'wind'."
            )

        if "pressure" not in predictions:

            raise ValueError(
                "Model output does not contain 'pressure'."
            )

        wind_prediction = predictions[
            "wind"
        ]

        pressure_prediction = predictions[
            "pressure"
        ]

    # --------------------------------------------------------
    # Handle list / tuple output
    # --------------------------------------------------------

    elif isinstance(
        predictions,
        (list, tuple),
    ):

        if len(predictions) < 2:

            raise ValueError(
                "Model returned fewer than two outputs."
            )

        wind_prediction = predictions[0]

        pressure_prediction = predictions[1]

    else:

        raise ValueError(
            "Unexpected model output format."
        )

    # --------------------------------------------------------
    # Extract scalar values
    # --------------------------------------------------------

    wind_z = float(
        np.asarray(
            wind_prediction
        ).reshape(-1)[0]
    )

    pressure_z = float(
        np.asarray(
            pressure_prediction
        ).reshape(-1)[0]
    )

    # --------------------------------------------------------
    # Validate output
    # --------------------------------------------------------

    if not np.isfinite(wind_z):

        raise ValueError(
            "Model returned an invalid wind prediction."
        )

    if not np.isfinite(pressure_z):

        raise ValueError(
            "Model returned an invalid pressure prediction."
        )

    # --------------------------------------------------------
    # Inverse transform
    # --------------------------------------------------------

    wind_kt, pressure_mb = (
        inverse_transform_predictions(
            wind_z,
            pressure_z,
        )
    )

    intensity_category = classify_intensity(
        wind_kt
    )

    return (
        wind_kt,
        pressure_mb,
        intensity_category,
    )


# ============================================================
# HELPER: PROCESS ONE FILE
# ============================================================

async def process_prediction_file(
    file: UploadFile,
):

    start_time = perf_counter()

    (
        original_filename,
        file_bytes,
        file_size,
    ) = await read_and_validate_file(
        file
    )

    # --------------------------------------------------------
    # NetCDF processing
    # --------------------------------------------------------

    try:

        tb, input_metadata = (
            load_tb_from_netcdf(
                file_bytes
            )
        )

        tb_statistics = validate_tb(
            tb
        )

        X = preprocess_tb(
            tb
        )

    except ValueError as e:

        raise HTTPException(
            status_code=422,
            detail=str(e),
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed while processing the "
                f"NetCDF file: {str(e)}"
            ),
        )

    # --------------------------------------------------------
    # Model inference
    # --------------------------------------------------------

    try:

        (
            wind_kt,
            pressure_mb,
            intensity_category,
        ) = run_model_prediction(X)

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Model prediction failed: "
                f"{str(e)}"
            ),
        )

    # --------------------------------------------------------
    # Processing time
    # --------------------------------------------------------

    processing_time = (
        perf_counter()
        - start_time
    )

    # --------------------------------------------------------
    # Generate prediction ID
    # --------------------------------------------------------

    prediction_id = (
        uuid4()
        .hex[:12]
        .upper()
    )

    # --------------------------------------------------------
    # Save to database
    # --------------------------------------------------------

    try:

        created_at = save_prediction(

            prediction_id=prediction_id,

            filename=original_filename,

            wind_speed_kt=wind_kt,

            pressure_mb=pressure_mb,

            intensity_category=(
                intensity_category
            ),

            tb_variable=(
                input_metadata[
                    "tb_variable"
                ]
            ),

            original_shape=(
                input_metadata[
                    "original_shape"
                ]
            ),

            valid_percentage=(
                tb_statistics[
                    "valid_percentage"
                ]
            ),

            minimum_kelvin=(
                tb_statistics[
                    "minimum_kelvin"
                ]
            ),

            maximum_kelvin=(
                tb_statistics[
                    "maximum_kelvin"
                ]
            ),

            mean_kelvin=(
                tb_statistics[
                    "mean_kelvin"
                ]
            ),

            processing_time_seconds=(
                processing_time
            ),
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Prediction succeeded but "
                "could not be saved to the database: "
                f"{str(e)}"
            ),
        )

    # --------------------------------------------------------
    # Return structured prediction
    # --------------------------------------------------------

    return {

        "success": True,

        "prediction_id": prediction_id,

        "created_at": created_at,

        "prediction": {

            "wind_speed_kt": round(
                wind_kt,
                2,
            ),

            "pressure_mb": round(
                pressure_mb,
                2,
            ),

            "intensity_category": (
                intensity_category
            ),
        },

        "input": {

            "filename": (
                original_filename
            ),

            "file_size_bytes": (
                file_size
            ),

            "tb_variable": (
                input_metadata[
                    "tb_variable"
                ]
            ),

            "original_shape": (
                input_metadata[
                    "original_shape"
                ]
            ),

            "dimensions": (
                input_metadata[
                    "dimensions"
                ]
            ),

            "units": (
                input_metadata[
                    "units"
                ]
            ),

            "long_name": (
                input_metadata[
                    "long_name"
                ]
            ),
        },

        "data_quality": {

            "total_pixels": (
                tb_statistics[
                    "total_pixels"
                ]
            ),

            "valid_pixels": (
                tb_statistics[
                    "valid_pixels"
                ]
            ),

            "invalid_pixels": (
                tb_statistics[
                    "invalid_pixels"
                ]
            ),

            "valid_percentage": (
                tb_statistics[
                    "valid_percentage"
                ]
            ),

            "minimum_kelvin": (
                tb_statistics[
                    "minimum_kelvin"
                ]
            ),

            "maximum_kelvin": (
                tb_statistics[
                    "maximum_kelvin"
                ]
            ),

            "mean_kelvin": (
                tb_statistics[
                    "mean_kelvin"
                ]
            ),
        },

        "processing": {

            "normalization": (
                "180-330 K → 0-1"
            ),

            "model_input_size": [
                IMAGE_SIZE[0],
                IMAGE_SIZE[1],
                1,
            ],

            "processing_time_seconds": round(
                processing_time,
                4,
            ),
        },

        "prototype": {

            "status": "prototype",

            "note": (
                "Predictions are generated by "
                "the current trained cyclone "
                "intensity model and should not "
                "be treated as an operational forecast."
            ),
        },
    }


# ============================================================
# CREATE SINGLE PREDICTION
# ============================================================

@app.post(
    "/predict",
    response_model=PredictionResponse,
)
async def predict(
    file: UploadFile = File(...),
):

    global model

    if model is None:

        raise HTTPException(
            status_code=503,
            detail="Prediction model is not loaded.",
        )

    return await process_prediction_file(
        file
    )


# ============================================================
# BATCH PREDICTION
# ============================================================

@app.post(
    "/predict/batch",
    response_model=BatchPredictionResponse,
)
async def predict_batch(
    files: List[UploadFile] = File(...),
):

    global model

    if model is None:

        raise HTTPException(
            status_code=503,
            detail="Prediction model is not loaded.",
        )

    # --------------------------------------------------------
    # Check number of files
    # --------------------------------------------------------

    if not files:

        raise HTTPException(
            status_code=400,
            detail="No files were uploaded.",
        )

    # --------------------------------------------------------
    # Process files individually
    # --------------------------------------------------------

    successful_predictions = []
    failed_predictions = []

    for file in files:

        try:

            result = (
                await process_prediction_file(
                    file
                )
            )

            successful_predictions.append(
                result
            )

        except HTTPException as e:

            failed_predictions.append({

                "filename": (
                    file.filename
                    if file.filename
                    else "unknown"
                ),

                "success": False,

                "status_code": e.status_code,

                "error": str(e.detail),
            })

        except Exception as e:

            failed_predictions.append({

                "filename": (
                    file.filename
                    if file.filename
                    else "unknown"
                ),

                "success": False,

                "status_code": 500,

                "error": str(e),
            })

    # --------------------------------------------------------
    # Determine overall batch status
    # --------------------------------------------------------

    total_files = len(files)

    successful_files = len(
        successful_predictions
    )

    failed_files = len(
        failed_predictions
    )

    batch_success = (
        failed_files == 0
        and successful_files == total_files
    )

    # --------------------------------------------------------
    # Return batch response
    # --------------------------------------------------------

    return {

        "success": batch_success,

        "count": successful_files,

        "total_files": total_files,

        "successful_files": successful_files,

        "failed_files": failed_files,

        "predictions": (
            successful_predictions
        ),

        "failures": (
            failed_predictions
        ),
    }


# ============================================================
# GET PREDICTION HISTORY
# ============================================================

@app.get(
    "/predictions",
    response_model=PredictionHistoryResponse,
)
def predictions(
    limit: int = Query(
        20,
        ge=1,
        le=100,
        description="Number of predictions to return.",
    ),
    offset: int = Query(
        0,
        ge=0,
        description="Number of predictions to skip.",
    ),
    category: str | None = Query(
        None,
        description="Filter by intensity category.",
    ),
    search: str | None = Query(
        None,
        description="Search predictions by filename.",
    ),
):

    try:

        records = get_all_predictions()

        # ----------------------------------------------------
        # Filter by intensity category
        # ----------------------------------------------------

        if category:

            category_lower = (
                category.strip().lower()
            )

            records = [
                record
                for record in records
                if str(
                    record.get(
                        "intensity_category",
                        "",
                    )
                ).lower()
                == category_lower
            ]

        # ----------------------------------------------------
        # Search by filename
        # ----------------------------------------------------

        if search:

            search_lower = (
                search.strip().lower()
            )

            records = [
                record
                for record in records
                if search_lower
                in str(
                    record.get(
                        "filename",
                        "",
                    )
                ).lower()
            ]

        # ----------------------------------------------------
        # Total after filtering
        # ----------------------------------------------------

        total = len(records)

        # ----------------------------------------------------
        # Pagination
        # ----------------------------------------------------

        paginated_records = records[
            offset : offset + limit
        ]

        return {

            "success": True,

            "count": len(
                paginated_records
            ),

            "total": total,

            "limit": limit,

            "offset": offset,

            "predictions": (
                paginated_records
            ),
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Could not retrieve prediction history: "
                f"{str(e)}"
            ),
        )


# ============================================================
# GET PREDICTION SUMMARY
# ============================================================

@app.get(
    "/predictions/summary"
)
def prediction_summary():

    try:

        records = get_all_predictions()

        # ----------------------------------------------------
        # Empty database
        # ----------------------------------------------------

        if not records:

            return {

                "success": True,

                "total_predictions": 0,

                "average_wind_kt": None,

                "average_pressure_mb": None,

                "maximum_wind_kt": None,

                "minimum_wind_kt": None,

                "maximum_pressure_mb": None,

                "minimum_pressure_mb": None,

                "categories": {},
            }

        # ----------------------------------------------------
        # Extract wind values
        # ----------------------------------------------------

        wind_values = [
            float(
                record[
                    "wind_speed_kt"
                ]
            )
            for record in records
            if record.get(
                "wind_speed_kt"
            ) is not None
        ]

        # ----------------------------------------------------
        # Extract pressure values
        # ----------------------------------------------------

        pressure_values = [
            float(
                record[
                    "pressure_mb"
                ]
            )
            for record in records
            if record.get(
                "pressure_mb"
            ) is not None
        ]

        # ----------------------------------------------------
        # Category counts
        # ----------------------------------------------------

        category_counts = {}

        for record in records:

            category = record.get(
                "intensity_category",
                "Unknown",
            )

            category_counts[
                category
            ] = (
                category_counts.get(
                    category,
                    0,
                )
                + 1
            )

        # ----------------------------------------------------
        # Build summary response
        # ----------------------------------------------------

        return {

            "success": True,

            "total_predictions": len(
                records
            ),

            "average_wind_kt": (
                round(
                    float(
                        np.mean(
                            wind_values
                        )
                    ),
                    2,
                )
                if wind_values
                else None
            ),

            "average_pressure_mb": (
                round(
                    float(
                        np.mean(
                            pressure_values
                        )
                    ),
                    2,
                )
                if pressure_values
                else None
            ),

            "maximum_wind_kt": (
                round(
                    max(wind_values),
                    2,
                )
                if wind_values
                else None
            ),

            "minimum_wind_kt": (
                round(
                    min(wind_values),
                    2,
                )
                if wind_values
                else None
            ),

            "maximum_pressure_mb": (
                round(
                    max(pressure_values),
                    2,
                )
                if pressure_values
                else None
            ),

            "minimum_pressure_mb": (
                round(
                    min(pressure_values),
                    2,
                )
                if pressure_values
                else None
            ),

            "categories": (
                category_counts
            ),
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Could not generate prediction summary: "
                f"{str(e)}"
            ),
        )


# ============================================================
# GET ONE PREDICTION
# ============================================================

@app.get(
    "/predictions/{prediction_id}"
)
def prediction_by_id(
    prediction_id: str,
):

    try:

        record = get_prediction(
            prediction_id
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Could not retrieve prediction: "
                f"{str(e)}"
            ),
        )

    if record is None:

        raise HTTPException(
            status_code=404,
            detail=(
                f"Prediction '{prediction_id}' "
                "was not found."
            ),
        )

    return {

        "success": True,

        "prediction": record,
    }