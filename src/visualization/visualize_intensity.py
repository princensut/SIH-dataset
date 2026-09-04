import os
import numpy as np
import matplotlib.pyplot as plt


# ============================================================
# PROJECT PATH
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
# LOAD DATA
# ============================================================

X = np.load(
    os.path.join(
        ARRAY_DIR,
        "X_train_intensity.npy"
    )
)

wind = np.load(
    os.path.join(
        ARRAY_DIR,
        "y_train_wind.npy"
    )
)

pressure = np.load(
    os.path.join(
        ARRAY_DIR,
        "y_train_pressure.npy"
    )
)


# ============================================================
# PRINT INFORMATION
# ============================================================

print("===================================")
print("INTENSITY DATA VISUALIZATION")
print("===================================")

print("X shape:", X.shape)
print("Wind shape:", wind.shape)
print("Pressure shape:", pressure.shape)

print("X minimum:", X.min())
print("X maximum:", X.max())

print()
print("Wind range:")
print(wind.min(), "→", wind.max())

print()
print("Pressure range:")
print(pressure.min(), "→", pressure.max())


# ============================================================
# SHOW 4 IMAGES
# ============================================================

number_of_images = min(4, len(X))

for i in range(number_of_images):

    image = X[i].squeeze()

    plt.figure(figsize=(6, 5))

    plt.imshow(
        image,
        cmap="gray"
    )

    plt.colorbar(
        label="Normalized Brightness Temperature"
    )

    plt.title(
        f"Sample {i+1} | "
        f"Wind: {wind[i]} kt | "
        f"Pressure: {pressure[i]} mb"
    )

    plt.xlabel("Pixel")
    plt.ylabel("Pixel")

    plt.tight_layout()

    plt.show()


print()
print("===================================")
print("VISUALIZATION COMPLETE")
print("===================================")