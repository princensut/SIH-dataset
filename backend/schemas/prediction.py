from typing import List, Optional
from pydantic import BaseModel


class PredictionResult(BaseModel):
    wind_speed_kt: float
    pressure_mb: float
    intensity_category: str


class InputInformation(BaseModel):
    filename: str
    file_size_bytes: int
    tb_variable: str
    original_shape: List[int]
    dimensions: dict
    units: Optional[str] = None
    long_name: Optional[str] = None
    cyclone_name: Optional[str] = None
    cyclone_id: Optional[str] = None
    cyclone_latitude: Optional[float] = None
    cyclone_longitude: Optional[float] = None
    observation_time: Optional[str] = None


class DataQuality(BaseModel):
    total_pixels: int
    valid_pixels: int
    invalid_pixels: int
    valid_percentage: float
    minimum_kelvin: float
    maximum_kelvin: float
    mean_kelvin: float


class ProcessingInformation(BaseModel):
    normalization: str
    model_input_size: List[int]
    processing_time_seconds: float


class PrototypeInformation(BaseModel):
    status: str
    note: str


class PredictionResponse(BaseModel):
    success: bool
    prediction_id: str
    created_at: str
    prediction: PredictionResult
    input: InputInformation
    data_quality: DataQuality
    processing: ProcessingInformation
    prototype: PrototypeInformation
    satellite_image_base64: Optional[str] = None
    satellite_image_gray_base64: Optional[str] = None


class PredictionHistoryItem(BaseModel):
    prediction_id: str
    filename: str
    wind_speed_kt: float
    pressure_mb: float
    intensity_category: str
    tb_variable: str
    original_shape: str
    valid_percentage: Optional[float] = None
    minimum_kelvin: Optional[float] = None
    maximum_kelvin: Optional[float] = None
    mean_kelvin: Optional[float] = None
    processing_time_seconds: Optional[float] = None
    created_at: str


class PredictionHistoryResponse(BaseModel):
    success: bool
    count: int
    total: int
    limit: int
    offset: int
    predictions: List[PredictionHistoryItem]


class BatchPredictionResponse(BaseModel):
    success: bool
    count: int
    predictions: List[PredictionResponse]