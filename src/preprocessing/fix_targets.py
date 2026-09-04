import os
import pandas as pd


# ============================================================
# SETTINGS
# ============================================================

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../..")
)

LABEL_DIR = os.path.join(
    PROJECT_ROOT,
    "data",
    "processed",
    "labels"
)

TARGET_FILE = os.path.join(
    PROJECT_ROOT,
    "data",
    "processed",
    "arrays",
    "targets.csv"
)


# ============================================================
# HEADER
# ============================================================

print("===================================")
print("CHECKING AND FIXING TARGETS")
print("===================================")


# ============================================================
# LOAD TARGETS
# ============================================================

targets = pd.read_csv(TARGET_FILE)

print("Target records:", len(targets))


# ============================================================
# LOAD ALL LABEL CSV FILES
# ============================================================

label_files = [
    os.path.join(LABEL_DIR, f)
    for f in os.listdir(LABEL_DIR)
    if f.endswith(".csv")
]

print("Label CSV files:", len(label_files))


# ============================================================
# COMBINE ALL LABEL DATA
# ============================================================

all_labels = []

for file in label_files:

    print("Reading:", os.path.basename(file))

    df = pd.read_csv(file)

    df.columns = df.columns.str.strip()

    # Create datetime
    df["datetime"] = pd.to_datetime(
        df["date"].astype(str)
        + " "
        + df["time_utc"].astype(str),
        errors="coerce"
    )

    all_labels.append(df)


labels = pd.concat(
    all_labels,
    ignore_index=True
)


# ============================================================
# MAKE DATETIME MATCH
# ============================================================

targets["datetime"] = pd.to_datetime(
    targets["datetime"],
    errors="coerce"
)


# ============================================================
# MATCH TARGETS
# ============================================================

print()
print("Matching cyclone + datetime...")


for index, row in targets.iterrows():

    cyclone = row["cyclone_name"]
    timestamp = row["datetime"]

    match = labels[
        (labels["cyclone_name"].astype(str).str.upper()
         == str(cyclone).upper())
        &
        (labels["datetime"] == timestamp)
    ]

    if len(match) == 0:
        continue

    matched = match.iloc[0]

    # Wind
    if pd.isna(targets.at[index, "wind_kt"]):

        if not pd.isna(matched["wind_kt"]):

            targets.at[index, "wind_kt"] = float(
                matched["wind_kt"]
            )

    # Pressure
    if pd.isna(targets.at[index, "pressure_mb"]):

        if not pd.isna(matched["pressure_mb"]):

            targets.at[index, "pressure_mb"] = float(
                matched["pressure_mb"]
            )


# ============================================================
# SUMMARY
# ============================================================

print()
print("===================================")
print("RESULT")
print("===================================")

print("Total patches:", len(targets))

print(
    "Missing wind:",
    targets["wind_kt"].isna().sum()
)

print(
    "Missing pressure:",
    targets["pressure_mb"].isna().sum()
)


# ============================================================
# SAVE
# ============================================================

targets.to_csv(
    TARGET_FILE,
    index=False
)

print()
print("Targets saved:")
print(TARGET_FILE)

print()
print("===================================")
print("DONE")
print("===================================")