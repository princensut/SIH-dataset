import os
import xarray as xr
from collections import Counter

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../..")
)

PATCH_DIR = os.path.join(
    PROJECT_ROOT,
    "data",
    "processed",
    "images"
)

sizes = []

for cyclone_name in sorted(os.listdir(PATCH_DIR)):

    cyclone_folder = os.path.join(
        PATCH_DIR,
        cyclone_name
    )

    if not os.path.isdir(cyclone_folder):
        continue

    for filename in sorted(os.listdir(cyclone_folder)):

        if not filename.endswith(".nc"):
            continue

        path = os.path.join(
            cyclone_folder,
            filename
        )

        ds = xr.open_dataset(path)

        shape = ds["Tb"].shape

        sizes.append(shape)

        print(
            cyclone_name,
            filename,
            "→",
            shape
        )

        ds.close()


print("\n===================================")
print("PATCH SIZE SUMMARY")
print("===================================")

counts = Counter(sizes)

for size, count in counts.items():

    print(
        size,
        "→",
        count,
        "patches"
    )

print("===================================")