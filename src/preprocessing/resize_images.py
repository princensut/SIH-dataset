import os
import numpy as np
import pandas as pd
import xarray as xr

# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../..")
)

PATCH_DIR = os.path.join(
    PROJECT_ROOT,
    "data",
    "processed",
    "images"
)

OUTPUT_DIR = os.path.join(
    PROJECT_ROOT,
    "data",
    "processed",
    "dataset"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ============================================================
# SETTINGS
# ============================================================

TARGET_SIZE = 275

# ============================================================
# STORAGE
# ============================================================

images = []
metadata = []

# ============================================================
# PROCESS PATCHES
# ============================================================

print("===================================")
print("PREPARING ML DATASET")
print("===================================")

for cyclone_name in sorted(os.listdir(PATCH_DIR)):

    cyclone_folder = os.path.join(
        PATCH_DIR,
        cyclone_name
    )

    if not os.path.isdir(cyclone_folder):
        continue

    patch_files = sorted([
        f for f in os.listdir(cyclone_folder)
        if f.endswith(".nc")
    ])

    print("\nCyclone:", cyclone_name)
    print("Patches:", len(patch_files))

    for filename in patch_files:

        file_path = os.path.join(
            cyclone_folder,
            filename
        )

        try:

            # ------------------------------------------------
            # OPEN PATCH
            # ------------------------------------------------

            ds = xr.open_dataset(file_path)

            tb = ds["Tb"]

            # ------------------------------------------------
            # CONVERT TO NUMPY
            # ------------------------------------------------

            image = tb.values.astype(np.float32)

            # ------------------------------------------------
            # REMOVE TIME DIMENSION IF PRESENT
            # ------------------------------------------------

            if image.ndim == 3:
                image = image[0]

            # ------------------------------------------------
            # CHECK SIZE
            # ------------------------------------------------

            height, width = image.shape

            # ------------------------------------------------
            # CREATE 275 x 275 IMAGE
            # ------------------------------------------------

            padded = np.full(
                (TARGET_SIZE, TARGET_SIZE),
                np.nan,
                dtype=np.float32
            )

            copy_height = min(
                height,
                TARGET_SIZE
            )

            copy_width = min(
                width,
                TARGET_SIZE
            )

            padded[
                :copy_height,
                :copy_width
            ] = image[
                :copy_height,
                :copy_width
            ]

            image = padded

            # ------------------------------------------------
            # HANDLE NaN VALUES
            # ------------------------------------------------

            # Use the mean Tb of valid pixels
            # to replace missing pixels.

            valid_pixels = image[
                np.isfinite(image)
            ]

            if len(valid_pixels) == 0:

                print(
                    "Skipping:",
                    filename,
                    "- no valid pixels"
                )

                ds.close()
                continue

            mean_tb = np.mean(valid_pixels)

            image = np.nan_to_num(
                image,
                nan=mean_tb
            )

            # ------------------------------------------------
            # NORMALIZATION
            # ------------------------------------------------

            # Brightness temperature roughly ranges
            # from 180 K to 330 K in this dataset.
            #
            # Convert to approximately 0-1.

            image = (
                image - 180.0
            ) / (
                330.0 - 180.0
            )

            image = np.clip(
                image,
                0.0,
                1.0
            )

            # ------------------------------------------------
            # ADD CHANNEL DIMENSION
            # ------------------------------------------------

            # Shape becomes:
            #
            # (275, 275, 1)

            image = image[..., np.newaxis]

            images.append(image)

            # ------------------------------------------------
            # READ METADATA
            # ------------------------------------------------

            metadata.append({

                "filename": filename,

                "cyclone_id":
                    ds.attrs.get(
                        "cyclone_id",
                        ""
                    ),

                "cyclone_name":
                    ds.attrs.get(
                        "cyclone_name",
                        cyclone_name
                    ),

                "latitude":
                    ds.attrs.get(
                        "cyclone_latitude",
                        np.nan
                    ),

                "longitude":
                    ds.attrs.get(
                        "cyclone_longitude",
                        np.nan
                    ),

                "wind_kt":
                    ds.attrs.get(
                        "wind_kt",
                        np.nan
                    ),

                "pressure_mb":
                    ds.attrs.get(
                        "pressure_mb",
                        np.nan
                    ),

                "ibtracs_time":
                    ds.attrs.get(
                        "ibtracs_time",
                        ""
                    )

            })

            ds.close()

            print(
                "Processed:",
                filename
            )

        except Exception as e:

            print(
                "ERROR:",
                filename,
                "→",
                e
            )


# ============================================================
# CONVERT TO NUMPY ARRAY
# ============================================================

X = np.array(
    images,
    dtype=np.float32
)

# ============================================================
# SAVE X
# ============================================================

X_PATH = os.path.join(
    OUTPUT_DIR,
    "X.npy"
)

np.save(
    X_PATH,
    X
)

# ============================================================
# SAVE METADATA
# ============================================================

metadata_df = pd.DataFrame(
    metadata
)

METADATA_PATH = os.path.join(
    OUTPUT_DIR,
    "metadata.csv"
)

metadata_df.to_csv(
    METADATA_PATH,
    index=False
)

# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n===================================")
print("DATASET CREATED")
print("===================================")

print(
    "Number of samples:",
    len(X)
)

print(
    "X shape:",
    X.shape
)

print(
    "X dtype:",
    X.dtype
)

print(
    "\nSaved X to:"
)

print(X_PATH)

print(
    "\nSaved metadata to:"
)

print(METADATA_PATH)

print("===================================")