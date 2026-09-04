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
print("CREATING ALIGNED INTENSITY ARRAYS")
print("===================================")


# ============================================================
# LOAD TARGETS
# ============================================================

targets_file = os.path.join(
    ARRAY_DIR,
    "intensity_targets.csv"
)

targets = pd.read_csv(targets_file)

print("Valid target records:", len(targets))


# ============================================================
# PROCESS EACH SPLIT
# ============================================================

for split in ["train", "val", "test"]:

    print()
    print("===================================")
    print("Processing:", split)
    print("===================================")

    # --------------------------------------------------------
    # Load original arrays
    # --------------------------------------------------------

    X_file = os.path.join(
        ARRAY_DIR,
        f"X_{split}.npy"
    )

    y_file = os.path.join(
        ARRAY_DIR,
        f"y_{split}.npy"
    )

    X = np.load(X_file)

    y = np.load(
        y_file,
        allow_pickle=True
    )

    print("Original X:", X.shape)
    print("Original y:", y.shape)

    # --------------------------------------------------------
    # Select valid targets for this split
    # --------------------------------------------------------

    split_targets = targets[
        targets["split"] == split
    ].copy()

    print(
        "Valid target rows:",
        len(split_targets)
    )

    # --------------------------------------------------------
    # Create lookup using filename
    # --------------------------------------------------------

    valid_filenames = set(
        split_targets["filename"].astype(str)
    )

    # --------------------------------------------------------
    # Load dataset.csv to preserve array order
    # --------------------------------------------------------

    dataset_file = os.path.join(
        PROJECT_ROOT,
        "data",
        "processed",
        "dataset",
        "dataset.csv"
    )

    dataset = pd.read_csv(dataset_file)

    dataset_split = dataset[
        dataset["split"] == split
    ].reset_index(drop=True)

    # --------------------------------------------------------
    # Find valid array indices
    # --------------------------------------------------------

    valid_indices = []

    for i, row in dataset_split.iterrows():

        filename = str(row["filename"])

        if filename in valid_filenames:

            valid_indices.append(i)

    # --------------------------------------------------------
    # Safety check
    # --------------------------------------------------------

    if len(valid_indices) != len(split_targets):

        print()
        print("WARNING!")
        print(
            "Matched indices:",
            len(valid_indices)
        )

        print(
            "Target rows:",
            len(split_targets)
        )

        print("Something does not match.")

        continue

    # --------------------------------------------------------
    # Extract valid images
    # --------------------------------------------------------

    X_clean = X[valid_indices]

    # --------------------------------------------------------
    # Match targets in EXACT image order
    # --------------------------------------------------------

    target_lookup = split_targets.set_index(
        "filename"
    )

    wind_values = []
    pressure_values = []

    for i in valid_indices:

        filename = str(
            dataset_split.iloc[i]["filename"]
        )

        wind_values.append(
            float(
                target_lookup.loc[
                    filename,
                    "wind_kt"
                ]
            )
        )

        pressure_values.append(
            float(
                target_lookup.loc[
                    filename,
                    "pressure_mb"
                ]
            )
        )

    y_wind = np.array(
        wind_values,
        dtype=np.float32
    )

    y_pressure = np.array(
        pressure_values,
        dtype=np.float32
    )

    # --------------------------------------------------------
    # Save
    # --------------------------------------------------------

    np.save(
        os.path.join(
            ARRAY_DIR,
            f"X_{split}_intensity.npy"
        ),
        X_clean
    )

    np.save(
        os.path.join(
            ARRAY_DIR,
            f"y_{split}_wind.npy"
        ),
        y_wind
    )

    np.save(
        os.path.join(
            ARRAY_DIR,
            f"y_{split}_pressure.npy"
        ),
        y_pressure
    )

    # --------------------------------------------------------
    # Print results
    # --------------------------------------------------------

    print()
    print("Clean X:", X_clean.shape)
    print("Wind:", y_wind.shape)
    print("Pressure:", y_pressure.shape)

    print(
        "Wind range:",
        y_wind.min(),
        "→",
        y_wind.max()
    )

    print(
        "Pressure range:",
        y_pressure.min(),
        "→",
        y_pressure.max()
    )

    print("Saved successfully.")


# ============================================================
# FINAL
# ============================================================

print()
print("===================================")
print("INTENSITY ARRAYS CREATED")
print("===================================")

print()
print("Files created:")

for split in ["train", "val", "test"]:

    print()
    print(split)

    print(
        f"X_{split}_intensity.npy"
    )

    print(
        f"y_{split}_wind.npy"
    )

    print(
        f"y_{split}_pressure.npy"
    )

print()
print("===================================")
print("DONE")
print("===================================")