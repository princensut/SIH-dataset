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
# FIND SATELLITE FILES
# ============================================================

def get_satellite_files(folder):

    files = {}

    if not os.path.exists(folder):
        return files

    for filename in os.listdir(folder):

        if not filename.endswith(".nc4"):
            continue

        # Example:
        # merg_2023102006_4km-pixel.nc4

        match = re.search(
            r"merg_(\d{10})_4km-pixel\.nc4",
            filename
        )

        if match:

            timestamp = match.group(1)

            files[timestamp] = os.path.join(
                folder,
                filename
            )

    return files


# ============================================================
# PROCESS ONE CYCLONE
# ============================================================

def process_cyclone(csv_file):

    cyclone_name = os.path.splitext(
        os.path.basename(csv_file)
    )[0]

    print("\n===================================")
    print("Processing:", cyclone_name)
    print("===================================")

    # --------------------------------------------------------
    # Satellite folder
    # --------------------------------------------------------

    satellite_folder = os.path.join(
        SATELLITE_DIR,
        cyclone_name
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

    df = pd.read_csv(csv_file)

    # Clean column names
    df.columns = df.columns.str.strip()


    # --------------------------------------------------------
    # Create datetime
    # --------------------------------------------------------

    df["datetime"] = pd.to_datetime(
        df["date"].astype(str)
        + " "
        + df["time_utc"].astype(str),
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
        # Convert timestamp to satellite filename format
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


        # ====================================================
        # OPEN SATELLITE FILE
        # ====================================================

        try:

            ds = xr.open_dataset(
                satellite_file
            )


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


            processed += 1


        # ====================================================
        # ERROR HANDLING
        # ====================================================

        except Exception as e:

            print(
                "ERROR:",
                e
            )

            try:
                ds.close()
            except:
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

        if f.endswith(".csv")

    ]


    print(
        "Cyclone CSV files found:",
        len(csv_files)
    )


    # --------------------------------------------------------
    # Process every cyclone
    # --------------------------------------------------------

    for csv_file in csv_files:

        process_cyclone(
            csv_file
        )


    print("\n===================================")
    print("ALL CYCLONES PROCESSED")
    print("===================================")