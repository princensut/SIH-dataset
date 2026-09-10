import os
import tempfile

import numpy as np
import xarray as xr  # type: ignore
from PIL import Image


# ============================================================
# MODEL PREPROCESSING CONFIGURATION
# ============================================================

TB_MIN = 180.0
TB_MAX = 330.0

IMAGE_SIZE = (128, 128)

WIND_MEAN = 33.518520
WIND_STD = 13.663606

PRESSURE_MEAN = 998.231506
PRESSURE_STD = 8.444378


# ============================================================
# FIND BRIGHTNESS TEMPERATURE VARIABLE
# ============================================================

def find_tb_variable(ds):
    """
    Find the brightness-temperature variable inside
    a NetCDF dataset.
    """

    preferred_names = [
        "Tb",
        "tb",
        "brightness_temperature",
        "brightness_temp",
        "BT",
        "bt",
    ]

    # First try known names
    for name in preferred_names:

        if name in ds.data_vars:
            return name

    # Then search by variable name
    for name in ds.data_vars:

        lower_name = name.lower()

        if "tb" in lower_name:
            return name

        if "brightness" in lower_name:
            return name

        if "temperature" in lower_name:
            return name

        if lower_name == "bt":
            return name

    # Some satellite products use an instrument-specific variable name and
    # identify the field through CF metadata instead.
    for name, data_var in ds.data_vars.items():
        metadata_text = " ".join(
            str(data_var.attrs.get(key, "")).lower()
            for key in ("standard_name", "long_name", "description", "units")
        )
        if "brightness_temperature" in metadata_text or "brightness temperature" in metadata_text:
            return name

    # Example products can contain only one numeric raster without a useful
    # name. Choose the largest multidimensional numeric field in that case.
    raster_candidates = [
        (name, data_var)
        for name, data_var in ds.data_vars.items()
        if len(data_var.dims) >= 2 and np.issubdtype(data_var.dtype, np.number)
    ]
    if len(raster_candidates) == 1:
        return raster_candidates[0][0]
    if raster_candidates:
        return max(raster_candidates, key=lambda item: item[1].size)[0]

    raise ValueError(
        "Could not find a brightness-temperature variable "
        f"in the uploaded NetCDF. "
        f"Available variables: {list(ds.data_vars)}"
    )


# ============================================================
# LOAD NETCDF
# ============================================================

def load_tb_from_netcdf(file_bytes):
    """
    Load brightness-temperature data and metadata
    from an uploaded NetCDF file.
    """

    try:
        # The NetCDF4 backend cannot reliably identify uploaded file-like
        # objects, so give each upload a real temporary path and select the
        # installed backend explicitly.
        with tempfile.NamedTemporaryFile(suffix=".nc", delete=False) as file:
            file.write(file_bytes)
            temp_path = file.name

        try:
            try:
                dataset = xr.open_dataset(temp_path, engine="netcdf4")
            except Exception as netcdf4_error:
                try:
                    dataset = xr.open_dataset(temp_path, engine="h5netcdf")
                except Exception as h5netcdf_error:
                    raise ValueError(
                        "No installed NetCDF backend could read this file. "
                        f"netcdf4: {netcdf4_error}; h5netcdf: {h5netcdf_error}"
                    ) from h5netcdf_error

            with dataset as ds:

                variable_name = find_tb_variable(ds)

                variable = ds[variable_name]

                tb = variable.values

                # Metadata
                original_shape = list(
                    variable.shape
                )

                dimensions = {
                    str(key): int(value)
                    for key, value in variable.sizes.items()
                }

                units = variable.attrs.get(
                    "units"
                )

                long_name = variable.attrs.get(
                    "long_name"
                )

                # Extract genuine cyclone & observation metadata if present
                cyclone_name = variable.attrs.get("cyclone_name") or ds.attrs.get("cyclone_name")
                cyclone_id = variable.attrs.get("cyclone_id") or ds.attrs.get("cyclone_id")
                cyclone_lat = variable.attrs.get("cyclone_latitude") or ds.attrs.get("cyclone_latitude")
                cyclone_lon = variable.attrs.get("cyclone_longitude") or ds.attrs.get("cyclone_longitude")
                observation_time = variable.attrs.get("ibtracs_time") or ds.attrs.get("time")

                if cyclone_lat is not None:
                    try:
                        cyclone_lat = round(float(cyclone_lat), 2)
                    except Exception:
                        cyclone_lat = None

                if cyclone_lon is not None:
                    try:
                        cyclone_lon = round(float(cyclone_lon), 2)
                    except Exception:
                        cyclone_lon = None

                if observation_time is not None:
                    observation_time = str(observation_time).strip()
        finally:
            os.unlink(temp_path)

    except Exception as e:

        raise ValueError(
            "Could not read the uploaded NetCDF file. "
            f"Details: {str(e)}"
        )

    # Convert to float32
    tb = np.asarray(
        tb,
        dtype=np.float32
    )

    # Remove dimensions of size 1
    tb = np.squeeze(tb)

    # Model expects a 2D satellite image
    if tb.ndim != 2:

        raise ValueError(
            "Brightness-temperature data must be 2D "
            "after removing singleton dimensions. "
            f"Received shape: {tb.shape}"
        )

    metadata = {

        "tb_variable": variable_name,

        "original_shape": original_shape,

        "dimensions": dimensions,

        "units": (
            str(units)
            if units is not None
            else None
        ),

        "long_name": (
            str(long_name)
            if long_name is not None
            else None
        ),

        "cyclone_name": (
            str(cyclone_name)
            if cyclone_name is not None
            else None
        ),

        "cyclone_id": (
            str(cyclone_id)
            if cyclone_id is not None
            else None
        ),

        "cyclone_latitude": cyclone_lat,

        "cyclone_longitude": cyclone_lon,

        "observation_time": observation_time,
    }

    return tb, metadata


# ============================================================
# VALIDATE BRIGHTNESS TEMPERATURE
# ============================================================

def validate_tb(tb):
    """
    Validate the brightness-temperature array.

    Returns statistics used by the API response.
    """

    tb = np.asarray(
        tb,
        dtype=np.float32
    )

    # --------------------------------------------------------
    # Dimension check
    # --------------------------------------------------------

    if tb.ndim != 2:

        raise ValueError(
            "Brightness-temperature data must be a 2D array. "
            f"Received shape: {tb.shape}"
        )

    # --------------------------------------------------------
    # Empty array check
    # --------------------------------------------------------

    if tb.size == 0:

        raise ValueError(
            "The brightness-temperature array is empty."
        )

    # --------------------------------------------------------
    # Finite pixels
    # --------------------------------------------------------

    finite_mask = np.isfinite(tb)

    total_pixels = int(
        tb.size
    )

    valid_pixels = int(
        finite_mask.sum()
    )

    invalid_pixels = (
        total_pixels
        - valid_pixels
    )

    if valid_pixels == 0:

        raise ValueError(
            "The uploaded NetCDF contains no valid "
            "brightness-temperature values."
        )

    valid_values = tb[
        finite_mask
    ]

    # --------------------------------------------------------
    # Physical sanity check
    # --------------------------------------------------------

    minimum_kelvin = float(
        np.min(valid_values)
    )

    maximum_kelvin = float(
        np.max(valid_values)
    )

    mean_kelvin = float(
        np.mean(valid_values)
    )

    # Extremely unrealistic temperature range
    #
    # We intentionally use a wider range than the model's
    # 180-330 K preprocessing range.
    #
    # This catches obviously unrelated NetCDF data without
    # rejecting legitimate satellite observations.

    if (
        maximum_kelvin < 100.0
        or minimum_kelvin > 400.0
    ):

        raise ValueError(
            "The uploaded data does not appear to contain "
            "physical brightness temperatures in Kelvin. "
            f"Detected range: "
            f"{minimum_kelvin:.2f} K to "
            f"{maximum_kelvin:.2f} K."
        )

    # --------------------------------------------------------
    # Percentage of usable pixels
    # --------------------------------------------------------

    valid_percentage = (
        valid_pixels
        / total_pixels
        * 100.0
    )

    # Reject almost completely invalid images
    if valid_percentage < 10.0:

        raise ValueError(
            "Too few valid brightness-temperature pixels "
            f"were found ({valid_percentage:.2f}%)."
        )

    # --------------------------------------------------------
    # Statistics
    # --------------------------------------------------------

    return {

        "total_pixels": total_pixels,

        "valid_pixels": valid_pixels,

        "invalid_pixels": invalid_pixels,

        "valid_percentage": round(
            valid_percentage,
            2
        ),

        "minimum_kelvin": round(
            minimum_kelvin,
            2
        ),

        "maximum_kelvin": round(
            maximum_kelvin,
            2
        ),

        "mean_kelvin": round(
            mean_kelvin,
            2
        ),
    }


# ============================================================
# PREPROCESS FOR CNN
# ============================================================

def preprocess_tb(tb):
    """
    Convert raw brightness temperature into the exact
    format expected by the CNN.
    """

    tb = np.asarray(
        tb,
        dtype=np.float32
    )

    finite_mask = np.isfinite(tb)

    if not finite_mask.any():

        raise ValueError(
            "The uploaded NetCDF contains no valid "
            "brightness-temperature values."
        )

    # --------------------------------------------------------
    # Replace invalid pixels with median
    # --------------------------------------------------------

    median_value = np.median(
        tb[finite_mask]
    )

    tb = np.where(
        finite_mask,
        tb,
        median_value
    )

    # --------------------------------------------------------
    # Physical normalization
    #
    # 180 K → 0
    # 330 K → 1
    # --------------------------------------------------------

    tb = np.clip(
        tb,
        TB_MIN,
        TB_MAX
    )

    tb = (
        tb - TB_MIN
    ) / (
        TB_MAX - TB_MIN
    )

    # --------------------------------------------------------
    # Resize to model input
    # --------------------------------------------------------

    image = Image.fromarray(
        tb.astype(np.float32),
        mode="F"
    )

    image = image.resize(
        IMAGE_SIZE,
        Image.Resampling.BILINEAR
    )

    tb_resized = np.asarray(
        image,
        dtype=np.float32
    )

    # --------------------------------------------------------
    # Add channel dimension
    #
    # (128,128)
    #     ↓
    # (128,128,1)
    #
    # Add batch dimension:
    #
    # (128,128,1)
    #     ↓
    # (1,128,128,1)
    # --------------------------------------------------------

    tb_resized = (
        tb_resized[..., np.newaxis]
    )

    tb_resized = (
        tb_resized[np.newaxis, ...]
    )

    return tb_resized


# ============================================================
# INVERSE TARGET TRANSFORMATION
# ============================================================

def inverse_transform_predictions(
    wind_z,
    pressure_z
):
    """
    Convert model z-score outputs back into
    physical units.
    """

    wind_kt = (
        wind_z * WIND_STD
        + WIND_MEAN
    )

    pressure_mb = (
        pressure_z * PRESSURE_STD
        + PRESSURE_MEAN
    )

    return (
        float(wind_kt),
        float(pressure_mb)
    )