import os
import glob
import shutil
import pandas as pd


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

OUTPUT_DIR = os.path.join(
    PROJECT_ROOT,
    "data",
    "processed",
    "dataset"
)


# ============================================================
# CYCLONE-WISE SPLIT
# ============================================================

TRAIN_CYCLONES = [
    "HAMOON",
    "Mandous"
]

VAL_CYCLONES = [
    "Mocha"
]

TEST_CYCLONES = [
    "UNNAMED_2024"
]


# ============================================================
# OUTPUT FOLDERS
# ============================================================

train_dir = os.path.join(OUTPUT_DIR, "train")
val_dir = os.path.join(OUTPUT_DIR, "val")
test_dir = os.path.join(OUTPUT_DIR, "test")


# ============================================================
# CLEAN OLD DATASET
# ============================================================

if os.path.exists(OUTPUT_DIR):

    print("Removing old dataset...")

    shutil.rmtree(OUTPUT_DIR)


os.makedirs(train_dir, exist_ok=True)
os.makedirs(val_dir, exist_ok=True)
os.makedirs(test_dir, exist_ok=True)


# ============================================================
# FIND PATCHES
# ============================================================

all_patches = []

for cyclone_folder in os.listdir(IMAGE_DIR):

    folder_path = os.path.join(
        IMAGE_DIR,
        cyclone_folder
    )

    if not os.path.isdir(folder_path):
        continue

    files = glob.glob(
        os.path.join(folder_path, "*.nc")
    )

    for file in files:

        all_patches.append({
            "file": file,
            "cyclone": cyclone_folder,
            "filename": os.path.basename(file)
        })


print("===================================")
print("CYCLONE-WISE DATASET PREPARATION")
print("===================================")

print(
    "Total patches found:",
    len(all_patches)
)


# ============================================================
# SHOW CYCLONE COUNTS
# ============================================================

print()
print("Patches by cyclone:")

for cyclone in sorted(
    set(item["cyclone"] for item in all_patches)
):

    count = sum(
        1
        for item in all_patches
        if item["cyclone"] == cyclone
    )

    print(
        f"  {cyclone}: {count}"
    )


# ============================================================
# SPLIT FUNCTION
# ============================================================

def get_split(cyclone):

    if cyclone in TRAIN_CYCLONES:
        return "train"

    if cyclone in VAL_CYCLONES:
        return "val"

    if cyclone in TEST_CYCLONES:
        return "test"

    return None


# ============================================================
# COPY PATCHES
# ============================================================

def copy_patches(patches, destination):

    for item in patches:

        source = item["file"]

        cyclone = item["cyclone"]

        cyclone_dir = os.path.join(
            destination,
            cyclone
        )

        os.makedirs(
            cyclone_dir,
            exist_ok=True
        )

        destination_file = os.path.join(
            cyclone_dir,
            item["filename"]
        )

        shutil.copy2(
            source,
            destination_file
        )


# ============================================================
# CREATE SPLITS
# ============================================================

train_patches = []
val_patches = []
test_patches = []

for item in all_patches:

    split = get_split(
        item["cyclone"]
    )

    if split == "train":

        train_patches.append(item)

    elif split == "val":

        val_patches.append(item)

    elif split == "test":

        test_patches.append(item)

    else:

        print(
            "WARNING: Cyclone not assigned to a split:",
            item["cyclone"]
        )


# ============================================================
# PRINT SPLIT INFORMATION
# ============================================================

print()
print("===================================")
print("CYCLONE SPLIT")
print("===================================")

print()
print("TRAIN:")
for cyclone in TRAIN_CYCLONES:
    count = sum(
        1
        for item in train_patches
        if item["cyclone"] == cyclone
    )
    print(
        f"  {cyclone}: {count} patches"
    )

print()
print("VALIDATION:")
for cyclone in VAL_CYCLONES:
    count = sum(
        1
        for item in val_patches
        if item["cyclone"] == cyclone
    )
    print(
        f"  {cyclone}: {count} patches"
    )

print()
print("TEST:")
for cyclone in TEST_CYCLONES:
    count = sum(
        1
        for item in test_patches
        if item["cyclone"] == cyclone
    )
    print(
        f"  {cyclone}: {count} patches"
    )


# ============================================================
# COPY
# ============================================================

print()
print("Copying training patches...")

copy_patches(
    train_patches,
    train_dir
)


print("Copying validation patches...")

copy_patches(
    val_patches,
    val_dir
)


print("Copying test patches...")

copy_patches(
    test_patches,
    test_dir
)


# ============================================================
# CREATE DATASET CSV
# ============================================================

rows = []


for split_name, split_data in [
    ("train", train_patches),
    ("val", val_patches),
    ("test", test_patches)
]:

    for item in split_data:

        rows.append({

            "split": split_name,

            "cyclone_name":
                item["cyclone"],

            "filename":
                item["filename"],

            "source_path":
                item["file"]

        })


dataset_df = pd.DataFrame(rows)


csv_path = os.path.join(
    OUTPUT_DIR,
    "dataset.csv"
)


dataset_df.to_csv(
    csv_path,
    index=False
)


# ============================================================
# FINAL SUMMARY
# ============================================================

print()
print("===================================")
print("DATASET READY")
print("===================================")

print(
    "Total :",
    len(all_patches)
)

print(
    "Train :",
    len(train_patches)
)

print(
    "Val   :",
    len(val_patches)
)

print(
    "Test  :",
    len(test_patches)
)

print()
print("Dataset CSV:")
print(csv_path)

print()
print("Output folder:")
print(OUTPUT_DIR)

print("===================================")