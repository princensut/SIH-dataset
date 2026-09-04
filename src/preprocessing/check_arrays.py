import os
import numpy as np
import pandas as pd


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


# ============================================================
# HEADER
# ============================================================

print("===================================")
print("CHECKING ARRAYS")
print("===================================")


# ============================================================
# CHECK TRAIN / VAL / TEST ARRAYS
# ============================================================

for split in ["train", "val", "test"]:

    X_path = os.path.join(
        ARRAY_DIR,
        f"X_{split}.npy"
    )

    y_path = os.path.join(
        ARRAY_DIR,
        f"y_{split}.npy"
    )

    print()
    print("-----------------------------------")
    print(split.upper())
    print("-----------------------------------")

    if not os.path.exists(X_path):
        print("ERROR: Missing", X_path)
        continue

    if not os.path.exists(y_path):
        print("ERROR: Missing", y_path)
        continue

    X = np.load(X_path)
    y = np.load(y_path)

    print("X shape:", X.shape)
    print("y shape:", y.shape)

    # Satellite image checks
    print("X minimum:", X.min())
    print("X maximum:", X.max())
    print("X mean:", X.mean())

    print("NaN in X:", np.isnan(X).sum())
    print("Infinite values in X:", np.isinf(X).sum())

    # Label checks
    print("y data type:", y.dtype)

    print("Labels:")
    print(np.unique(y))

    # Check missing labels safely
    if y.dtype.kind in "OUS":
        print("Missing labels:", pd.isna(y).sum())
    else:
        print("NaN in y:", np.isnan(y).sum())
        print("Infinite values in y:", np.isinf(y).sum())


# ============================================================
# CHECK TARGET CSV
# ============================================================

print()
print("===================================")
print("CHECKING TARGETS")
print("===================================")

targets_path = os.path.join(
    ARRAY_DIR,
    "targets.csv"
)

if not os.path.exists(targets_path):

    print("ERROR: targets.csv not found!")

else:

    targets = pd.read_csv(targets_path)

    print("Target rows:", len(targets))

    print()
    print("Columns:")
    print(list(targets.columns))

    print()
    print("First 5 rows:")
    print(targets.head())

    print()
    print("Missing values:")
    print(targets.isna().sum())


# ============================================================
# FINAL
# ============================================================

print()
print("===================================")
print("CHECK COMPLETE")
print("===================================")