import os
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, Model


# ============================================================
# SETTINGS
# ============================================================

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../..")
)

ARRAY_DIR = os.path.join(
    PROJECT_ROOT,
    "data",
    "processed",
    "arrays"
)

MODEL_DIR = os.path.join(
    PROJECT_ROOT,
    "models"
)

os.makedirs(MODEL_DIR, exist_ok=True)


# ============================================================
# LOAD TRAINING DATA
# ============================================================

print("===================================")
print("LOADING INTENSITY DATA")
print("===================================")

X_train = np.load(
    os.path.join(
        ARRAY_DIR,
        "X_train_intensity.npy"
    )
)

y_train_wind = np.load(
    os.path.join(
        ARRAY_DIR,
        "y_train_wind.npy"
    )
)

y_train_pressure = np.load(
    os.path.join(
        ARRAY_DIR,
        "y_train_pressure.npy"
    )
)


# ============================================================
# LOAD VALIDATION DATA
# ============================================================

X_val = np.load(
    os.path.join(
        ARRAY_DIR,
        "X_val_intensity.npy"
    )
)

y_val_wind = np.load(
    os.path.join(
        ARRAY_DIR,
        "y_val_wind.npy"
    )
)

y_val_pressure = np.load(
    os.path.join(
        ARRAY_DIR,
        "y_val_pressure.npy"
    )
)


# ============================================================
# LOAD TEST DATA
# ============================================================

X_test = np.load(
    os.path.join(
        ARRAY_DIR,
        "X_test_intensity.npy"
    )
)

y_test_wind = np.load(
    os.path.join(
        ARRAY_DIR,
        "y_test_wind.npy"
    )
)

y_test_pressure = np.load(
    os.path.join(
        ARRAY_DIR,
        "y_test_pressure.npy"
    )
)


# ============================================================
# PRINT DATA INFORMATION
# ============================================================

print()
print("TRAIN:")
print("X:", X_train.shape)
print("Wind:", y_train_wind.shape)
print("Pressure:", y_train_pressure.shape)

print()
print("VALIDATION:")
print("X:", X_val.shape)
print("Wind:", y_val_wind.shape)
print("Pressure:", y_val_pressure.shape)

print()
print("TEST:")
print("X:", X_test.shape)
print("Wind:", y_test_wind.shape)
print("Pressure:", y_test_pressure.shape)


# ============================================================
# BUILD CNN
# ============================================================

print()
print("===================================")
print("BUILDING CNN")
print("===================================")

inputs = layers.Input(
    shape=(128, 128, 1)
)


# Feature extraction
x = layers.Conv2D(
    32,
    (3, 3),
    activation="relu",
    padding="same"
)(inputs)

x = layers.MaxPooling2D(
    (2, 2)
)(x)


x = layers.Conv2D(
    64,
    (3, 3),
    activation="relu",
    padding="same"
)(x)

x = layers.MaxPooling2D(
    (2, 2)
)(x)


x = layers.Conv2D(
    128,
    (3, 3),
    activation="relu",
    padding="same"
)(x)

x = layers.MaxPooling2D(
    (2, 2)
)(x)


# Convert feature maps into feature vector
x = layers.GlobalAveragePooling2D()(x)

x = layers.Dense(
    128,
    activation="relu"
)(x)

x = layers.Dropout(
    0.3
)(x)


# ============================================================
# TWO OUTPUTS
# ============================================================

wind_output = layers.Dense(
    1,
    name="wind"
)(x)

pressure_output = layers.Dense(
    1,
    name="pressure"
)(x)


# ============================================================
# CREATE MODEL
# ============================================================

model = Model(
    inputs=inputs,
    outputs=[
        wind_output,
        pressure_output
    ]
)


# ============================================================
# COMPILE
# ============================================================

model.compile(

    optimizer=tf.keras.optimizers.Adam(
        learning_rate=0.001
    ),

    loss={
        "wind": "mse",
        "pressure": "mse"
    },

    metrics={
        "wind": ["mae"],
        "pressure": ["mae"]
    }
)


# ============================================================
# SHOW MODEL
# ============================================================

model.summary()


# ============================================================
# TRAIN
# ============================================================

print()
print("===================================")
print("TRAINING MODEL")
print("===================================")

history = model.fit(

    X_train,

    {
        "wind": y_train_wind,
        "pressure": y_train_pressure
    },

    validation_data=(

        X_val,

        {
            "wind": y_val_wind,
            "pressure": y_val_pressure
        }

    ),

    epochs=50,

    batch_size=4,

    verbose=1
)


# ============================================================
# SAVE MODEL
# ============================================================

model_path = os.path.join(
    MODEL_DIR,
    "cyclone_intensity_model.keras"
)

model.save(model_path)


print()
print("===================================")
print("MODEL TRAINING COMPLETE")
print("===================================")

print()
print("Model saved at:")
print(model_path)