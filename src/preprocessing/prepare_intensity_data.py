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
# LOAD TARGETS
# ============================================================

targets_file = os.path.join(
    ARRAY_DIR,
    "targets.csv"
)

targets = pd.read_csv(targets_file)

print("===================================")
print("PREPARING INTENSITY DATA")
print("===================================")

print("Total target records:", len(targets))


# ============================================================
# CHECK WIND / PRESSURE
# ============================================================

print()
print("Missing before cleaning:")

print(
    "Wind:",
    targets["wind_kt"].isna().sum()
)

print(
    "Pressure:",
    targets["pressure_mb"].isna().sum()
)


# ============================================================
# KEEP ONLY RECORDS WITH BOTH TARGETS
# ============================================================

clean_targets = targets.dropna(
    subset=[
        "wind_kt",
        "pressure_mb"
    ]
).copy()


print()
print("Records with BOTH wind and pressure:")
print(len(clean_targets))


# ============================================================
# LOAD IMAGE ARRAYS
# ============================================================

X_train = np.load(
    os.path.join(
        ARRAY_DIR,
        "X_train.npy"
    )
)

X_val = np.load(
    os.path.join(
        ARRAY_DIR,
        "X_val.npy"
    )
)

X_test = np.load(
    os.path.join(
        ARRAY_DIR,
        "X_test.npy"
    )
)


# ============================================================
# MATCH TARGETS WITH SPLITS
# ============================================================

train_targets = clean_targets[
    clean_targets["split"] == "train"
].copy()

val_targets = clean_targets[
    clean_targets["split"] == "val"
].copy()

test_targets = clean_targets[
    clean_targets["split"] == "test"
].copy()


# ============================================================
# SUMMARY
# ============================================================

print()
print("===================================")
print("CLEAN TARGET SUMMARY")
print("===================================")

print(
    "Train images:",
    len(X_train)
)

print(
    "Train valid targets:",
    len(train_targets)
)

print(
    "Validation images:",
    len(X_val)
)

print(
    "Validation valid targets:",
    len(val_targets)
)

print(
    "Test images:",
    len(X_test)
)

print(
    "Test valid targets:",
    len(test_targets)
)


# ============================================================
# SAVE CLEAN TARGETS
# ============================================================

output_file = os.path.join(
    ARRAY_DIR,
    "intensity_targets.csv"
)

clean_targets.to_csv(
    output_file,
    index=False
)


print()
print("Saved:")
print(output_file)


# ============================================================
# SHOW TARGET RANGES
# ============================================================

print()
print("===================================")
print("TARGET RANGES")
print("===================================")

print(
    "Wind minimum:",
    clean_targets["wind_kt"].min()
)

print(
    "Wind maximum:",
    clean_targets["wind_kt"].max()
)

print(
    "Pressure minimum:",
    clean_targets["pressure_mb"].min()
)

print(
    "Pressure maximum:",
    clean_targets["pressure_mb"].max()
)

print()
print("===================================")
print("DONE")
print("===================================")