import os
import re

import pandas as pd
import xarray as xr


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

SATELLITE_DIR = os.path.join(
    PROJECT_ROOT,
    "data",
    "raw",
    "satellite"
)

OUTPUT_DIR = os.path.join(
    PROJECT_ROOT,
    "data",
    "processed",
    "images"
)

# Crop size in degrees
LAT_RANGE = 5
LON_RANGE = 5


# ============================================================
# SATELLITE FOLDER ALIASES
# ============================================================

# Some CSV names don't exactly match their satellite folder names.
SATELLITE_FOLDER_ALIASES = {
    "UNNAMED_2024": "unknown",
}


# ============================================================
# FIND SATELLITE FILES
# ============================================================

def get_satellite_files(folder):
    """
    Find all MERG IR satellite files recursively inside a cyclone folder.

    Supports structures such as:

        satellite/JAWAD/*.nc4
        satellite/JAWAD/Jawad_images/*.nc4
        satellite/SITRANG/Sitrang_images/*.nc4

    Also supports duplicate downloaded filenames such as:

        merg_2021120106_4km-pixel.nc4
        merg_2021120106_4km-pixel (1).nc4

    Returns:
        dict mapping YYYYMMDDHH -> full satellite file path
    """

    files = {}

    if not os.path.exists(folder):
        return files

    # Search recursively through all subdirectories
    for root, _, filenames in os.walk(folder):

        for filename in filenames:

            if not filename.lower().endswith(".nc4"):
                continue

            # Normal:
            # merg_2023102006_4km-pixel.nc4
            #
            # Duplicate:
            # merg_2021120106_4km-pixel (1).nc4

            match = re.search(
                r"merg_(\d{10})_4km-pixel(?:\s*\(\d+\))?\.nc4$",
                filename,
                re.IGNORECASE
            )

            if not match:
                continue

            timestamp = match.group(1)

            full_path = os.path.join(
                root,
                filename
            )

            # Keep the first file if duplicate timestamps exist.
            if timestamp not in files:
                files[timestamp] = full_path

    return files


# ============================================================
# PROCESS ONE CYCLONE
# ============================================================

def process_cyclone(csv_file):

    # --------------------------------------------------------
    # Cyclone name from CSV filename
    # --------------------------------------------------------

    cyclone_name = os.path.splitext(
        os.path.basename(csv_file)
    )[0]

    print("\n===================================")
    print("Processing:", cyclone_name)
    print("===================================")

    # --------------------------------------------------------
    # Satellite folder
    # --------------------------------------------------------

    satellite_folder_name = SATELLITE_FOLDER_ALIASES.get(
        cyclone_name,
        cyclone_name
    )

    satellite_folder = os.path.join(
        SATELLITE_DIR,
        satellite_folder_name
    )

    print(
        "Satellite folder:",
        satellite_folder
    )

    satellite_files = get_satellite_files(
        satellite_folder
    )

    print(
        "Satellite files found:",
        len(satellite_files)
    )

    if len(satellite_files) == 0:

        print(
            "WARNING: No satellite files found for",
            cyclone_name
        )

        return

    # --------------------------------------------------------
    # Read cyclone CSV
    # --------------------------------------------------------

    try:

        df = pd.read_csv(
            csv_file
        )

    except Exception as e:

        print(
            "ERROR reading CSV:",
            e
        )

        return

    # --------------------------------------------------------
    # Clean column names
    # --------------------------------------------------------

    df.columns = df.columns.str.strip()

    # --------------------------------------------------------
    # Check required columns
    # --------------------------------------------------------

    required_columns = [
        "cyclone_id",
        "cyclone_name",
        "date",
        "time_utc",
        "latitude",
        "longitude",
        "wind_kt",
        "pressure_mb",
        "satellite_file"
    ]

    missing_columns = [
        col
        for col in required_columns
        if col not in df.columns
    ]

    if missing_columns:

        print(
            "ERROR: Missing columns:",
            missing_columns
        )

        return

    # ========================================================
    # CONVERT NUMERIC COLUMNS
    # ========================================================

    # This is important because some CSV files, such as JAWAD,
    # may cause pandas to interpret numeric values as strings.

    df["latitude"] = pd.to_numeric(
        df["latitude"],
        errors="coerce"
    )

    df["longitude"] = pd.to_numeric(
        df["longitude"],
        errors="coerce"
    )

    df["wind_kt"] = pd.to_numeric(
        df["wind_kt"],
        errors="coerce"
    )

    df["pressure_mb"] = pd.to_numeric(
        df["pressure_mb"],
        errors="coerce"
    )

    # --------------------------------------------------------
    # Create datetime
    # --------------------------------------------------------

    df["datetime"] = pd.to_datetime(
        df["date"].astype(str).str.strip()
        + " "
        + df["time_utc"].astype(str).str.strip(),
        errors="coerce"
    )

    # --------------------------------------------------------
    # Output folder
    # --------------------------------------------------------

    output_folder = os.path.join(
        OUTPUT_DIR,
        cyclone_name
    )

    os.makedirs(
        output_folder,
        exist_ok=True
    )

    processed = 0
    skipped = 0

    # ========================================================
    # PROCESS EACH IBTRACS RECORD
    # ========================================================

    for index, row in df.iterrows():

        timestamp = row["datetime"]

        latitude = row["latitude"]

        longitude = row["longitude"]

        # ----------------------------------------------------
        # Check timestamp
        # ----------------------------------------------------

        if pd.isna(timestamp):

            print(
                "Skipping row",
                index,
                "- invalid timestamp"
            )

            skipped += 1

            continue

        # ----------------------------------------------------
        # Check coordinates
        # ----------------------------------------------------

        if pd.isna(latitude) or pd.isna(longitude):

            print(
                "Skipping row",
                index,
                "- missing coordinates"
            )

            skipped += 1

            continue

        # ----------------------------------------------------
        # Convert timestamp to satellite key
        # ----------------------------------------------------

        satellite_key = timestamp.strftime(
            "%Y%m%d%H"
        )

        # ----------------------------------------------------
        # Find matching satellite file
        # ----------------------------------------------------

        satellite_file = satellite_files.get(
            satellite_key
        )

        if satellite_file is None:

            print(
                "No satellite file for:",
                timestamp
            )

            skipped += 1

            continue

        processed_number = processed + 1

        print(
            f"[{processed_number}]",
            timestamp,
            "→",
            os.path.basename(satellite_file)
        )

        ds = None

        # ====================================================
        # OPEN SATELLITE FILE
        # ====================================================

        try:

            ds = xr.open_dataset(
                satellite_file
            )

            # ------------------------------------------------
            # Check Tb variable
            # ------------------------------------------------

            if "Tb" not in ds:

                print(
                    "ERROR: Tb variable not found in:",
                    satellite_file
                )

                ds.close()

                skipped += 1

                continue

            # ------------------------------------------------
            # Select nearest satellite observation
            # ------------------------------------------------

            image = ds["Tb"].sel(
                time=timestamp,
                method="nearest"
            )

            # =================================================
            # CROP AROUND CYCLONE
            # =================================================

            patch = image.sel(
                lat=slice(
                    latitude - LAT_RANGE,
                    latitude + LAT_RANGE
                ),
                lon=slice(
                    longitude - LON_RANGE,
                    longitude + LON_RANGE
                )
            )

            # =================================================
            # CHECK PATCH
            # =================================================

            if patch.size == 0:

                print(
                    "Empty patch - skipping"
                )

                ds.close()

                skipped += 1

                continue

            # =================================================
            # ADD METADATA
            # =================================================

            patch.attrs["cyclone_id"] = str(
                row["cyclone_id"]
            )

            patch.attrs["cyclone_name"] = (
                cyclone_name
            )

            patch.attrs["cyclone_latitude"] = float(
                latitude
            )

            patch.attrs["cyclone_longitude"] = float(
                longitude
            )

            patch.attrs["ibtracs_time"] = str(
                timestamp
            )

            # ------------------------------------------------
            # Wind
            # ------------------------------------------------

            if pd.isna(row["wind_kt"]):

                patch.attrs["wind_kt"] = float("nan")

            else:

                patch.attrs["wind_kt"] = float(
                    row["wind_kt"]
                )

            # ------------------------------------------------
            # Pressure
            # ------------------------------------------------

            if pd.isna(row["pressure_mb"]):

                patch.attrs["pressure_mb"] = float("nan")

            else:

                patch.attrs["pressure_mb"] = float(
                    row["pressure_mb"]
                )

            # =================================================
            # SAVE PATCH
            # =================================================

            output_filename = (
                f"{cyclone_name}_"
                f"{timestamp.strftime('%Y%m%d_%H%M')}.nc"
            )

            output_path = os.path.join(
                output_folder,
                output_filename
            )

            patch.to_netcdf(
                output_path
            )

            # Close satellite dataset
            ds.close()

            ds = None

            processed += 1

        # ====================================================
        # ERROR HANDLING
        # ====================================================

        except Exception as e:

            print(
                "ERROR:",
                e
            )

            if ds is not None:

                try:

                    ds.close()

                except Exception:

                    pass

            skipped += 1

    # ========================================================
    # SUMMARY
    # ========================================================

    print("\nFinished:", cyclone_name)

    print(
        "Successfully processed:",
        processed
    )

    print(
        "Skipped:",
        skipped
    )


# ============================================================
# PROCESS ALL CSV FILES
# ============================================================

if __name__ == "__main__":

    csv_files = [
        os.path.join(
            LABEL_DIR,
            f
        )
        for f in os.listdir(LABEL_DIR)
        if f.lower().endswith(".csv")
    ]

    print(
        "Cyclone CSV files found:",
        len(csv_files)
    )

    # --------------------------------------------------------
    # Process every cyclone
    # --------------------------------------------------------

    for csv_file in sorted(csv_files):

        process_cyclone(
            csv_file
        )

    print("\n===================================")
    print("ALL CYCLONES PROCESSED")
    print("===================================")