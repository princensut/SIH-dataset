from pathlib import Path

import numpy as np
import tensorflow as tf

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = (
    BASE_DIR
    / "backend"
    / "model"
    / "cyclone_intensity_model.keras"
)

TEST_DIR = (
    BASE_DIR
    / "data"
    / "processed"
    / "arrays"
    / "test"
)


X_PATH = TEST_DIR / "X_test_intensity.npy"
WIND_PATH = TEST_DIR / "y_test_wind.npy"
PRESSURE_PATH = TEST_DIR / "y_test_pressure.npy"


# ============================================================
# TARGET NORMALIZATION
# ============================================================

WIND_MEAN = 33.518520
WIND_STD = 13.663606

PRESSURE_MEAN = 998.231506
PRESSURE_STD = 8.444378


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("DIRECT MODEL EVALUATION")
print("=" * 70)

print("\nLoading model...")

model = tf.keras.models.load_model(
    MODEL_PATH,
    compile=False
)

print("Model loaded:")
print(MODEL_PATH)

print("\nModel input:")
print(model.input_shape)

print("\nModel outputs:")
print(model.output_names)


print("\nLoading test arrays...")

X_test = np.load(X_PATH)
y_wind = np.load(WIND_PATH)
y_pressure = np.load(PRESSURE_PATH)


print("X_test:", X_test.shape)
print("Wind:", y_wind.shape)
print("Pressure:", y_pressure.shape)


# ============================================================
# PREDICT
# ============================================================

print("\nRunning predictions...")

predictions = model.predict(
    X_test,
    verbose=0
)


if isinstance(predictions, dict):

    wind_pred_z = np.asarray(
        predictions["wind"]
    ).reshape(-1)

    pressure_pred_z = np.asarray(
        predictions["pressure"]
    ).reshape(-1)

elif isinstance(predictions, (list, tuple)):

    wind_pred_z = np.asarray(
        predictions[0]
    ).reshape(-1)

    pressure_pred_z = np.asarray(
        predictions[1]
    ).reshape(-1)

else:

    raise RuntimeError(
        "Unexpected model output format."
    )


# ============================================================
# INVERSE Z-SCORE
# ============================================================

wind_pred = (
    wind_pred_z
    * WIND_STD
    + WIND_MEAN
)

pressure_pred = (
    pressure_pred_z
    * PRESSURE_STD
    + PRESSURE_MEAN
)


# ============================================================
# METRICS
# ============================================================

wind_mae = mean_absolute_error(
    y_wind,
    wind_pred
)

wind_rmse = np.sqrt(
    mean_squared_error(
        y_wind,
        wind_pred
    )
)

wind_r2 = r2_score(
    y_wind,
    wind_pred
)


pressure_mae = mean_absolute_error(
    y_pressure,
    pressure_pred
)

pressure_rmse = np.sqrt(
    mean_squared_error(
        y_pressure,
        pressure_pred
    )
)

pressure_r2 = r2_score(
    y_pressure,
    pressure_pred
)


# ============================================================
# RESULTS
# ============================================================

print("\n" + "=" * 70)
print("RESULTS")
print("=" * 70)

print("\nWIND")
print("-" * 70)
print(f"MAE  : {wind_mae:.3f} kt")
print(f"RMSE : {wind_rmse:.3f} kt")
print(f"R²   : {wind_r2:.3f}")

print("\nPRESSURE")
print("-" * 70)
print(f"MAE  : {pressure_mae:.3f} mb")
print(f"RMSE : {pressure_rmse:.3f} mb")
print(f"R²   : {pressure_r2:.3f}")


# ============================================================
# PREDICTION TABLE
# ============================================================

print("\n" + "=" * 70)
print("SAMPLE-BY-SAMPLE PREDICTIONS")
print("=" * 70)

print(
    f"{'IDX':>3} "
    f"{'ACT WIND':>10} "
    f"{'PRED WIND':>10} "
    f"{'ACT PRESS':>11} "
    f"{'PRED PRESS':>11}"
)

print("-" * 70)

for i in range(len(X_test)):

    print(
        f"{i + 1:>3} "
        f"{y_wind[i]:>10.1f} "
        f"{wind_pred[i]:>10.1f} "
        f"{y_pressure[i]:>11.1f} "
        f"{pressure_pred[i]:>11.1f}"
    )


# ============================================================
# PREDICTION DISTRIBUTION
# ============================================================

print("\n" + "=" * 70)
print("PREDICTION DISTRIBUTION")
print("=" * 70)

print(
    f"Wind prediction min    : {wind_pred.min():.2f}"
)

print(
    f"Wind prediction max    : {wind_pred.max():.2f}"
)

print(
    f"Wind prediction mean   : {wind_pred.mean():.2f}"
)

print(
    f"Wind prediction std    : {wind_pred.std():.2f}"
)

print()

print(
    f"Pressure prediction min  : {pressure_pred.min():.2f}"
)

print(
    f"Pressure prediction max  : {pressure_pred.max():.2f}"
)

print(
    f"Pressure prediction mean : {pressure_pred.mean():.2f}"
)

print(
    f"Pressure prediction std  : {pressure_pred.std():.2f}"
)

print("\n" + "=" * 70)
print("DONE")
print("=" * 70)