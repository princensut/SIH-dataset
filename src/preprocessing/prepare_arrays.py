import os
import glob
import numpy as np
import xarray as xr
from PIL import Image


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

OUTPUT_DIR = os.path.join(
    PROJECT_ROOT,
    "data",
    "processed",
    "arrays"
)

# CNN input size
IMAGE_SIZE = (128, 128)


# ============================================================
# CREATE OUTPUT FOLDER
# ============================================================

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)


# ============================================================
# PROCESS ONE .NC FILE
# ============================================================

def process_file(file_path):

    ds = xr.open_dataset(file_path)

    try:

        # ----------------------------------------------------
        # Read brightness temperature
        # ----------------------------------------------------

        tb = ds["Tb"]

        # If there is a time dimension, select first image
        if "time" in tb.dims:
            tb = tb.isel(time=0)

        data = tb.values.astype(np.float32)

        # ----------------------------------------------------
        # Handle NaN values
        # ----------------------------------------------------

        valid = np.isfinite(data)

        if not np.any(valid):
            print("WARNING: No valid pixels:", file_path)
            return None

        # Replace NaN with mean of valid pixels
        mean_value = np.nanmean(data)

        data = np.nan_to_num(
            data,
            nan=mean_value,
            posinf=mean_value,
            neginf=mean_value
        )

        # ----------------------------------------------------
        # Normalize Tb
        #
        # Approximate useful IR range:
        # 180 K → 330 K
        #
        # Result:
        # 0 → 1
        # ----------------------------------------------------

        data = np.clip(
            data,
            180,
            330
        )

        data = (
            data - 180
        ) / (
            330 - 180
        )

        # ----------------------------------------------------
        # Resize to 128 × 128
        # ----------------------------------------------------

        image = Image.fromarray(
            data,
            mode="F"
        )

        image = image.resize(
            IMAGE_SIZE,
            Image.Resampling.BILINEAR
        )

        data = np.array(
            image,
            dtype=np.float32
        )

        # ----------------------------------------------------
        # Add channel dimension
        #
        # (128,128)
        #       ↓
        # (128,128,1)
        # ----------------------------------------------------

        data = np.expand_dims(
            data,
            axis=-1
        )

        return data

    finally:

        ds.close()


# ============================================================
# PROCESS TRAIN / VAL / TEST
# ============================================================

def process_split(split_name):

    split_dir = os.path.join(
        DATASET_DIR,
        split_name
    )

    X = []
    y = []
    filenames = []

    print()
    print("===================================")
    print("Processing:", split_name)
    print("===================================")

    if not os.path.exists(split_dir):

        print(
            "ERROR: Folder does not exist:",
            split_dir
        )

        return

    # --------------------------------------------------------
    # Each cyclone folder becomes a class
    # --------------------------------------------------------

    cyclone_folders = sorted(
        [
            folder
            for folder in os.listdir(split_dir)
            if os.path.isdir(
                os.path.join(
                    split_dir,
                    folder
                )
            )
        ]
    )

    print(
        "Cyclones found:",
        cyclone_folders
    )

    # --------------------------------------------------------
    # Process every cyclone
    # --------------------------------------------------------

    for cyclone in cyclone_folders:

        cyclone_dir = os.path.join(
            split_dir,
            cyclone
        )

        files = sorted(
            glob.glob(
                os.path.join(
                    cyclone_dir,
                    "*.nc"
                )
            )
        )

        print(
            cyclone,
            "→",
            len(files),
            "patches"
        )

        for file_path in files:

            try:

                data = process_file(
                    file_path
                )

                if data is None:
                    continue

                X.append(data)

                y.append(cyclone)

                filenames.append(
                    os.path.basename(
                        file_path
                    )
                )

            except Exception as e:

                print(
                    "ERROR:",
                    os.path.basename(file_path),
                    "→",
                    e
                )

    # --------------------------------------------------------
    # Convert to NumPy
    # --------------------------------------------------------

    if len(X) == 0:

        print(
            "ERROR: No valid data found!"
        )

        return

    X = np.array(
        X,
        dtype=np.float32
    )

    y = np.array(
        y
    )

    filenames = np.array(
        filenames
    )

    # --------------------------------------------------------
    # Save
    # --------------------------------------------------------

    np.save(
        os.path.join(
            OUTPUT_DIR,
            f"X_{split_name}.npy"
        ),
        X
    )

    np.save(
        os.path.join(
            OUTPUT_DIR,
            f"y_{split_name}.npy"
        ),
        y
    )

    np.save(
        os.path.join(
            OUTPUT_DIR,
            f"filenames_{split_name}.npy"
        ),
        filenames
    )

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    print()
    print(
        "X shape:",
        X.shape
    )

    print(
        "y shape:",
        y.shape
    )

    print(
        "Minimum:",
        np.min(X)
    )

    print(
        "Maximum:",
        np.max(X)
    )

    print(
        "Mean:",
        np.mean(X)
    )

    print(
        "Saved successfully."
    )


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print("===================================")
    print("ARRAY PREPARATION")
    print("===================================")

    process_split("train")

    process_split("val")

    process_split("test")

    print()
    print("===================================")
    print("ALL ARRAYS CREATED")
    print("===================================")

    print()
    print("Output:")
    print(OUTPUT_DIR)