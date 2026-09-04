import os
import glob
import re
import pandas as pd
import numpy as np


# ============================================================
# SETTINGS
# ============================================================

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../..")
)

DATASET_DIR = os.path.join(
    PROJECT_ROOT,
    "data",
    "processed",
    "dataset"
)

LABEL_DIR = os.path.join(
    PROJECT_ROOT,
    "data",
    "processed",
    "labels"
)

ARRAY_DIR = os.path.join(
    PROJECT_ROOT,
    "data",
    "processed",
    "arrays"
)

OUTPUT_FILE = os.path.join(
    ARRAY_DIR,
    "targets.csv"
)


# ============================================================
# EXTRACT DATETIME FROM PATCH FILENAME
# ============================================================

def get_datetime_from_filename(filename):

    # Example:
    # HAMOON_20231020_0600.nc

    match = re.search(
        r"_(\d{8})_(\d{4})\.nc$",
        filename
    )

    if match is None:
        return None

    date_part = match.group(1)
    time_part = match.group(2)

    return pd.to_datetime(
        date_part + time_part,
        format="%Y%m%d%H%M",
        errors="coerce"
    )


# ============================================================
# LOAD ALL LABEL CSV FILES
# ============================================================

def load_labels():

    all_labels = []

    csv_files = glob.glob(
        os.path.join(
            LABEL_DIR,
            "*.csv"
        )
    )

    print(
        "Label CSV files found:",
        len(csv_files)
    )

    for csv_file in csv_files:

        try:

            df = pd.read_csv(csv_file)

            df.columns = (
                df.columns
                .str.strip()
            )

            # ------------------------------------------------
            # Create datetime
            # ------------------------------------------------

            df["datetime"] = pd.to_datetime(
                df["date"].astype(str)
                + " "
                + df["time_utc"].astype(str),
                errors="coerce"
            )

            # ------------------------------------------------
            # Keep required columns
            # ------------------------------------------------

            required_columns = [
                "cyclone_name",
                "datetime",
                "wind_kt",
                "pressure_mb"
            ]

            for column in required_columns:

                if column not in df.columns:

                    print(
                        "WARNING:",
                        column,
                        "missing in",
                        os.path.basename(csv_file)
                    )

            all_labels.append(
                df[
                    [
                        "cyclone_name",
                        "datetime",
                        "wind_kt",
                        "pressure_mb"
                    ]
                ]
            )

        except Exception as e:

            print(
                "ERROR reading:",
                csv_file
            )

            print(e)

    if len(all_labels) == 0:

        return pd.DataFrame()

    labels = pd.concat(
        all_labels,
        ignore_index=True
    )

    return labels


# ============================================================
# FIND CYCLONE NAME FROM DATASET FOLDER
# ============================================================

def get_cyclone_name_from_path(file_path):

    # Expected:
    #
    # dataset/
    #   train/
    #      HAMOON/
    #         HAMOON_20231020_0600.nc

    cyclone_folder = os.path.basename(
        os.path.dirname(file_path)
    )

    return cyclone_folder


# ============================================================
# MAIN
# ============================================================

print("===================================")
print("CREATING NUMERICAL TARGETS")
print("===================================")


# ------------------------------------------------------------
# Load labels
# ------------------------------------------------------------

labels = load_labels()

print(
    "Total label records:",
    len(labels)
)


if len(labels) == 0:

    print(
        "ERROR: No labels found!"
    )

    exit()


# ------------------------------------------------------------
# Process dataset splits
# ------------------------------------------------------------

rows = []


for split in [
    "train",
    "val",
    "test"
]:

    split_dir = os.path.join(
        DATASET_DIR,
        split
    )

    if not os.path.exists(split_dir):

        print(
            "WARNING: Missing split:",
            split
        )

        continue

    nc_files = glob.glob(
        os.path.join(
            split_dir,
            "*",
            "*.nc"
        )
    )

    print()
    print(
        "Processing:",
        split
    )

    print(
        "Patches found:",
        len(nc_files)
    )


    # --------------------------------------------------------
    # Process every patch
    # --------------------------------------------------------

    for file_path in nc_files:

        filename = os.path.basename(
            file_path
        )

        cyclone = get_cyclone_name_from_path(
            file_path
        )

        patch_datetime = (
            get_datetime_from_filename(
                filename
            )
        )

        if patch_datetime is None:

            print(
                "WARNING: Cannot read datetime:",
                filename
            )

            continue


        # ----------------------------------------------------
        # Match cyclone + datetime
        # ----------------------------------------------------

        matches = labels[
            (
                labels["cyclone_name"]
                .astype(str)
                .str.upper()
                ==
                cyclone.upper()
            )
            &
            (
                labels["datetime"]
                ==
                patch_datetime
            )
        ]


        # ----------------------------------------------------
        # Handle UNNAMED / naming differences
        # ----------------------------------------------------

        if len(matches) == 0:

            if cyclone.upper() == "UNNAMED_2024":

                matches = labels[
                    (
                        labels["datetime"]
                        ==
                        patch_datetime
                    )
                    &
                    (
                        labels["cyclone_name"]
                        .astype(str)
                        .str.upper()
                        .isin(
                            [
                                "UNNAMED",
                                "UNNAMED_2024"
                            ]
                        )
                    )
                ]


        # ----------------------------------------------------
        # No match
        # ----------------------------------------------------

        if len(matches) == 0:

            print(
                "NO LABEL:",
                filename
            )

            continue


        # ----------------------------------------------------
        # Take first matching record
        # ----------------------------------------------------

        label = matches.iloc[0]


        # ----------------------------------------------------
        # Numerical targets
        # ----------------------------------------------------

        wind = label["wind_kt"]

        pressure = label["pressure_mb"]


        # ----------------------------------------------------
        # Store
        # ----------------------------------------------------

        rows.append({

            "split": split,

            "cyclone_name": cyclone,

            "filename": filename,

            "datetime": patch_datetime,

            "wind_kt": (
                np.nan
                if pd.isna(wind)
                else float(wind)
            ),

            "pressure_mb": (
                np.nan
                if pd.isna(pressure)
                else float(pressure)
            ),

            "source_path": file_path

        })


# ============================================================
# CREATE TARGET DATAFRAME
# ============================================================

targets = pd.DataFrame(rows)


print()
print("===================================")
print("TARGET SUMMARY")
print("===================================")


print(
    "Total matched patches:",
    len(targets)
)


if len(targets) > 0:

    print()
    print(
        "Missing wind values:",
        targets["wind_kt"].isna().sum()
    )

    print(
        "Missing pressure values:",
        targets["pressure_mb"].isna().sum()
    )


# ============================================================
# SAVE
# ============================================================

os.makedirs(
    ARRAY_DIR,
    exist_ok=True
)


targets.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# FINAL
# ============================================================

print()
print("===================================")
print("TARGETS CREATED")
print("===================================")

print()
print(
    "Saved at:"
)

print(
    OUTPUT_FILE
)

print()
print("===================================")