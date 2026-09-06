import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


# ============================================================
# PATH SETUP
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parents[1]

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


# ============================================================
# IMPORT APPLICATION
# ============================================================

from main import app


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = BACKEND_DIR.parent

IMAGE_DIRECTORY = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "images"
)


# ============================================================
# FIND REAL NETCDF
# ============================================================

def find_test_netcdf():

    if not IMAGE_DIRECTORY.exists():

        pytest.fail(
            "Image directory does not exist:\n"
            f"{IMAGE_DIRECTORY}"
        )

    files = list(
        IMAGE_DIRECTORY.rglob("*.nc")
    )

    if not files:

        pytest.fail(
            "No .nc test file was found in:\n"
            f"{IMAGE_DIRECTORY}"
        )

    return files[0]


TEST_NETCDF = find_test_netcdf()


# ============================================================
# TEST CLIENT
# ============================================================

@pytest.fixture
def client():

    with TestClient(app) as test_client:

        yield test_client


# ============================================================
# ROOT
# ============================================================

def test_root(client):

    response = client.get("/")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "running"

    assert "model_loaded" in data


# ============================================================
# HEALTH
# ============================================================

def test_health(client):

    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "healthy"

    assert data["model_loaded"] is True


# ============================================================
# MODEL INFO
# ============================================================

def test_model_info(client):

    response = client.get(
        "/model-info"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["model_loaded"] is True

    assert "input_shape" in data

    assert "outputs" in data

    assert "parameters" in data


# ============================================================
# REAL PREDICTION
# ============================================================

def test_prediction(client):

    with open(
        TEST_NETCDF,
        "rb"
    ) as file:

        response = client.post(
            "/predict",
            files={
                "file": (
                    TEST_NETCDF.name,
                    file,
                    "application/x-netcdf",
                )
            },
        )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True

    assert "prediction_id" in data

    assert len(
        data["prediction_id"]
    ) > 0

    assert "prediction" in data

    prediction = data["prediction"]

    assert "wind_speed_kt" in prediction

    assert "pressure_mb" in prediction

    assert "intensity_category" in prediction

    assert "input" in data

    assert (
        data["input"]["filename"]
        == TEST_NETCDF.name
    )

    assert "data_quality" in data

    quality = data["data_quality"]

    assert quality["total_pixels"] > 0

    assert quality["valid_pixels"] > 0

    assert quality["valid_percentage"] > 0

    assert "processing" in data

    assert (
        data["processing"][
            "processing_time_seconds"
        ] >= 0
    )


# ============================================================
# PREDICTION HISTORY
# ============================================================

def test_prediction_history(client):

    response = client.get(
        "/predictions"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True

    assert "count" in data

    assert "predictions" in data

    assert isinstance(
        data["predictions"],
        list
    )


# ============================================================
# INVALID EXTENSION
# ============================================================

def test_invalid_file_extension(client):

    response = client.post(
        "/predict",
        files={
            "file": (
                "test.txt",
                b"This is not a NetCDF file.",
                "text/plain",
            )
        },
    )

    assert response.status_code == 400

    assert "detail" in response.json()


# ============================================================
# EMPTY FILE
# ============================================================

def test_empty_file(client):

    response = client.post(
        "/predict",
        files={
            "file": (
                "empty.nc",
                b"",
                "application/x-netcdf",
            )
        },
    )

    assert response.status_code == 400

    assert "detail" in response.json()


# ============================================================
# CORRUPTED NETCDF
# ============================================================

def test_corrupted_netcdf(client):

    response = client.post(
        "/predict",
        files={
            "file": (
                "corrupted.nc",
                b"This is definitely not a NetCDF file.",
                "application/x-netcdf",
            )
        },
    )

    assert response.status_code in [
        422,
        500,
    ]

    assert "detail" in response.json()