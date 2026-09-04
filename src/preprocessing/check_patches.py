import os
import glob
import xarray as xr
import numpy as np

# ============================================================
# SETTINGS
# ============================================================

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../..")
)

IMAGE_DIR = os.path.join(
    PROJECT_ROOT,
    "data",
    "processed",
    "images"
)

# ============================================================
# CHECK ONE PATCH
# ============================================================

def check_patch(file_path):

    try:
        ds = xr.open_dataset(file_path)

        # ----------------------------------------------------
        # Check Tb
        # ----------------------------------------------------

        if "Tb" not in ds:
            print("    ❌ No Tb variable")
            ds.close()
            return False

        tb = ds["Tb"].values

        # Remove NaN values
        valid = tb[~np.isnan(tb)]

        if valid.size == 0:
            print("    ❌ Image contains only NaN values")
            ds.close()
            return False

        # ----------------------------------------------------
        # Statistics
        # ----------------------------------------------------

        minimum = float(np.min(valid))
        maximum = float(np.max(valid))
        mean = float(np.mean(valid))

        # ----------------------------------------------------
        # Check dimensions
        # ----------------------------------------------------

        shape = tb.shape

        # ----------------------------------------------------
        # Check metadata
        # ----------------------------------------------------

        cyclone = ds.attrs.get(
            "cyclone_name",
            "MISSING"
        )

        latitude = ds.attrs.get(
            "cyclone_latitude",
            "MISSING"
        )

        longitude = ds.attrs.get(
            "cyclone_longitude",
            "MISSING"
        )

        wind = ds.attrs.get(
            "wind_kt",
            "MISSING"
        )

        pressure = ds.attrs.get(
            "pressure_mb",
            "MISSING"
        )

        # ----------------------------------------------------
        # Print information
        # ----------------------------------------------------

        print(f"    Shape       : {shape}")
        print(f"    Tb minimum  : {minimum:.2f} K")
        print(f"    Tb maximum  : {maximum:.2f} K")
        print(f"    Tb mean     : {mean:.2f} K")

        print(
            f"    Cyclone     : {cyclone}"
        )

        print(
            f"    Location    : "
            f"{latitude}, {longitude}"
        )

        print(
            f"    Wind        : {wind} kt"
        )

        print(
            f"    Pressure    : {pressure} mb"
        )

        # ----------------------------------------------------
        # Basic sanity checks
        # ----------------------------------------------------

        problems = []

        if minimum < 150:
            problems.append(
                "Tb unusually low"
            )

        if maximum > 350:
            problems.append(
                "Tb unusually high"
            )

        if shape[-2] < 10 or shape[-1] < 10:
            problems.append(
                "Patch too small"
            )

        if problems:

            print("    ⚠️ WARNINGS:")

            for problem in problems:
                print(
                    f"       - {problem}"
                )

        else:

            print(
                "    ✅ Patch looks valid"
            )

        ds.close()

        return True

    except Exception as e:

        print(
            f"    ❌ ERROR: {e}"
        )

        return False


# ============================================================
# CHECK ALL PATCHES
# ============================================================

def main():

    print()
    print("===================================")
    print("CYCLONE PATCH QUALITY CHECK")
    print("===================================")
    print()

    if not os.path.exists(IMAGE_DIR):

        print(
            "❌ Image directory does not exist:"
        )

        print(IMAGE_DIR)

        return

    cyclone_folders = [
        folder
        for folder in glob.glob(
            os.path.join(
                IMAGE_DIR,
                "*"
            )
        )
        if os.path.isdir(folder)
    ]

    total = 0
    valid = 0

    for cyclone_folder in cyclone_folders:

        cyclone_name = os.path.basename(
            cyclone_folder
        )

        print()
        print("-----------------------------------")
        print(
            f"Cyclone: {cyclone_name}"
        )
        print("-----------------------------------")

        patch_files = glob.glob(
            os.path.join(
                cyclone_folder,
                "*.nc"
            )
        )

        print(
            f"Patches found: {len(patch_files)}"
        )

        # Don't print every patch if there are many
        for file_path in patch_files:

            total += 1

            print()
            print(
                "File:",
                os.path.basename(file_path)
            )

            if check_patch(file_path):
                valid += 1

    # ========================================================
    # FINAL SUMMARY
    # ========================================================

    print()
    print("===================================")
    print("FINAL SUMMARY")
    print("===================================")

    print(
        f"Total patches : {total}"
    )

    print(
        f"Valid patches : {valid}"
    )

    print(
        f"Invalid       : {total - valid}"
    )

    print()

    if total > 0 and valid == total:

        print(
            "🎉 ALL PATCHES PASSED BASIC CHECKS!"
        )

    elif valid > 0:

        print(
            "⚠️ Some patches need attention."
        )

    else:

        print(
            "❌ No valid patches found."
        )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    main()