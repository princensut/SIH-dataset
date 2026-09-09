import sqlite3
from pathlib import Path
from datetime import datetime, timezone


# ============================================================
# DATABASE CONFIGURATION
# ============================================================
import os

BASE_DIR = Path(__file__).resolve().parent

# On Render's free tier the filesystem (except /tmp) is read-only,
# so we place the SQLite DB in /tmp. Locally we use the project dir.
if os.environ.get("RENDER"):
    DATABASE_PATH = Path("/tmp") / "cyclone_predictions.db"
else:
    DATABASE_PATH = BASE_DIR / "cyclone_predictions.db"


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():
    """
    Create a connection to the SQLite database.
    """

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    connection.row_factory = sqlite3.Row

    return connection


# ============================================================
# INITIALIZE DATABASE
# ============================================================

def initialize_database():
    """
    Create the predictions table if it does not already exist.
    """

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS predictions (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            prediction_id TEXT UNIQUE NOT NULL,

            filename TEXT NOT NULL,

            wind_speed_kt REAL NOT NULL,

            pressure_mb REAL NOT NULL,

            intensity_category TEXT NOT NULL,

            tb_variable TEXT NOT NULL,

            original_shape TEXT,

            valid_percentage REAL,

            minimum_kelvin REAL,

            maximum_kelvin REAL,

            mean_kelvin REAL,

            processing_time_seconds REAL,

            created_at TEXT NOT NULL

        )
        """
    )

    connection.commit()

    connection.close()


# ============================================================
# SAVE PREDICTION
# ============================================================

def save_prediction(
    prediction_id,
    filename,
    wind_speed_kt,
    pressure_mb,
    intensity_category,
    tb_variable,
    original_shape,
    valid_percentage,
    minimum_kelvin,
    maximum_kelvin,
    mean_kelvin,
    processing_time_seconds,
):
    """
    Save one prediction into the database.
    """

    connection = get_connection()

    cursor = connection.cursor()

    created_at = datetime.now(
        timezone.utc
    ).isoformat()

    cursor.execute(
        """
        INSERT INTO predictions (
            prediction_id,
            filename,
            wind_speed_kt,
            pressure_mb,
            intensity_category,
            tb_variable,
            original_shape,
            valid_percentage,
            minimum_kelvin,
            maximum_kelvin,
            mean_kelvin,
            processing_time_seconds,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            prediction_id,
            filename,
            wind_speed_kt,
            pressure_mb,
            intensity_category,
            tb_variable,
            str(original_shape),
            valid_percentage,
            minimum_kelvin,
            maximum_kelvin,
            mean_kelvin,
            processing_time_seconds,
            created_at,
        ),
    )

    connection.commit()

    connection.close()

    return created_at


# ============================================================
# GET ALL PREDICTIONS
# ============================================================

def get_all_predictions():
    """
    Return all saved predictions.
    """

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM predictions
        ORDER BY id DESC
        """
    )

    rows = cursor.fetchall()

    connection.close()

    return [
        dict(row)
        for row in rows
    ]


# ============================================================
# GET ONE PREDICTION
# ============================================================

def get_prediction(prediction_id):
    """
    Retrieve a prediction using its unique prediction ID.
    """

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM predictions
        WHERE prediction_id = ?
        """,
        (prediction_id,),
    )

    row = cursor.fetchone()

    connection.close()

    if row is None:
        return None

    return dict(row)