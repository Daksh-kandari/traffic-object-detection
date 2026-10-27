export type TrafficClass = 
  | 'car'
  | 'motorcycle'
  | 'bus'
  | 'truck'
  | 'person'
  | 'bicycle'
  | 'stop sign'
  | 'traffic light'
  | 'traffic sign';

export interface Detection {
  label: TrafficClass;
  conf: number;
  xyxy: [number, number, number, number]; // [x1, y1, x2, y2]
  track_id?: number | null;
  speedKmh?: number;
  trajectory?: [number, number][]; // history of center points
}

export interface FrameLog {
  frame: number;
  total: number;
  inference_ms: number;
  car?: number;
  motorcycle?: number;
  bus?: number;
  truck?: number;
  person?: number;
  bicycle?: number;
  'stop sign'?: number;
  'traffic light'?: number;
  [key: string]: number | undefined;
}

export interface AnalyticsSummary {
  frames_processed: number;
  total_detections: number;
  avg_inference_ms: number;
  inference_fps: number;
  detections_per_class: Record<string, number>;
  peak_simultaneous_per_class: Record<string, number>;
  unique_tracked_objects_per_class: Record<string, number>;
}

export interface PipelineConfig {
  model: {
    weights: string;
    imgsz: number;
    conf: number;
    iou: number;
    device: string;
    classes: TrafficClass[];
  };
  tracking: {
    enabled: boolean;
    tracker: 'bytetrack.yaml' | 'botsort.yaml';
  };
  preprocess: {
    max_side: number;
    frame_stride: number;
    low_light_enhance: boolean;
  };
  output: {
    save_video: boolean;
    show_window: boolean;
    out_dir: string;
  };
  train: {
    data: string;
    epochs: number;
    batch: number;
    imgsz: number;
  };
}

export interface ClassEvaluationMetric {
  className: string;
  precision: number;
  recall: number;
  map50: number;
  map50_95: number;
}

export interface EvaluationReport {
  map50: number;
  map50_95: number;
  precision: number;
  recall: number;
  speed: {
    preprocess_ms: number;
    inference_ms: number;
    postprocess_ms: number;
    total_ms: number;
  };
  classMetrics: ClassEvaluationMetric[];
  confusionMatrix: {
    labels: string[];
    matrix: number[][]; // normalized or raw counts
  };
}
