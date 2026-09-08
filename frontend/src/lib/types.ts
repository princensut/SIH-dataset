export interface PredictionResult {
  wind_speed_kt: number;
  pressure_mb: number;
  intensity_category: string;
}

export interface InputInformation {
  filename: string;
  file_size_bytes: number;
  tb_variable: string;
  original_shape: number[];
  dimensions: Record<string, number>;
  units?: string | null;
  long_name?: string | null;
}

export interface DataQuality {
  total_pixels: number;
  valid_pixels: number;
  invalid_pixels: number;
  valid_percentage: number;
  minimum_kelvin: number;
  maximum_kelvin: number;
  mean_kelvin: number;
}

export interface ProcessingInformation {
  normalization: string;
  model_input_size: number[];
  processing_time_seconds: number;
}

export interface PrototypeInformation {
  status: string;
  note: string;
}

export interface PredictionResponse {
  success: boolean;
  prediction_id: string;
  created_at: string;
  prediction: PredictionResult;
  input: InputInformation;
  data_quality: DataQuality;
  processing: ProcessingInformation;
  prototype?: PrototypeInformation;
  satellite_image_base64?: string | null;
  satellite_image_gray_base64?: string | null;
}

export interface PredictionHistoryItem {
  prediction_id: string;
  filename: string;
  wind_speed_kt: number;
  pressure_mb: number;
  intensity_category: string;
  tb_variable: string;
  original_shape: string;
  valid_percentage?: number | null;
  minimum_kelvin?: number | null;
  maximum_kelvin?: number | null;
  mean_kelvin?: number | null;
  processing_time_seconds?: number | null;
  created_at: string;
}

export interface PredictionHistoryResponse {
  success: boolean;
  count: number;
  total?: number;
  limit?: number;
  offset?: number;
  predictions: PredictionHistoryItem[];
}

export interface SummaryResponse {
  total_predictions: number;
  average_wind_kt?: number | null;
  average_pressure_mb?: number | null;
  maximum_wind_kt?: number | null;
  minimum_pressure_mb?: number | null;
  category_breakdown?: Record<string, number>;
}

export interface ModelInfoResponse {
  model_loaded: boolean;
  model_file: string;
  input_shape: (number | null)[];
  outputs: string[];
  parameters: number;
  preprocessing?: {
    brightness_temperature_range_kelvin: number[];
    model_image_size: number[];
    channels: number;
  };
  prediction_targets?: string[];
}

export interface HealthResponse {
  name: string;
  version: string;
  status: string;
  model_loaded: boolean;
  endpoints?: Record<string, string>;
}
