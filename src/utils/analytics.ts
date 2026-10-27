import { AnalyticsSummary, Detection, FrameLog } from '../types/traffic';

export class TrafficAnalyticsTracker {
  public frames_processed = 0;
  public total_inference_ms = 0.0;
  public total_detections = 0;
  public peak_counts: Record<string, number> = {};
  public class_detections: Record<string, number> = {};
  private _unique_ids: Record<string, Set<number>> = {};
  public rows: FrameLog[] = [];
  public last_frame_counts: Record<string, number> = {};

  constructor() {
    this.reset();
  }

  public reset() {
    this.frames_processed = 0;
    this.total_inference_ms = 0.0;
    this.total_detections = 0;
    this.peak_counts = {};
    this.class_detections = {};
    this._unique_ids = {};
    this.rows = [];
    this.last_frame_counts = {};
  }

  public update(frameIdx: number, detections: Detection[], inferenceMs: number): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const d of detections) {
      counts[d.label] = (counts[d.label] || 0) + 1;
    }

    this.frames_processed += 1;
    this.total_inference_ms += inferenceMs;
    this.total_detections += detections.length;

    for (const [label, n] of Object.entries(counts)) {
      this.class_detections[label] = (this.class_detections[label] || 0) + n;
      this.peak_counts[label] = Math.max(this.peak_counts[label] || 0, n);
    }

    for (const d of detections) {
      if (d.track_id !== undefined && d.track_id !== null) {
        if (!this._unique_ids[d.label]) {
          this._unique_ids[d.label] = new Set();
        }
        this._unique_ids[d.label].add(d.track_id);
      }
    }

    this.last_frame_counts = counts;

    const row: FrameLog = {
      frame: frameIdx,
      total: detections.length,
      inference_ms: Math.round(inferenceMs * 100) / 100,
      ...counts,
    };
    this.rows.push(row);

    // Keep memory bounded to 2000 rows max
    if (this.rows.length > 2000) {
      this.rows.shift();
    }

    return counts;
  }

  public get unique_counts(): Record<string, number> {
    const res: Record<string, number> = {};
    for (const [k, v] of Object.entries(this._unique_ids)) {
      res[k] = v.size;
    }
    return res;
  }

  public get avg_inference_ms(): number {
    return this.frames_processed > 0 ? this.total_inference_ms / this.frames_processed : 0.0;
  }

  public get inference_fps(): number {
    const ms = this.avg_inference_ms;
    return ms > 0 ? 1000.0 / ms : 0.0;
  }

  public summary(): AnalyticsSummary {
    return {
      frames_processed: this.frames_processed,
      total_detections: this.total_detections,
      avg_inference_ms: Math.round(this.avg_inference_ms * 100) / 100,
      inference_fps: Math.round(this.inference_fps * 10) / 10,
      detections_per_class: { ...this.class_detections },
      peak_simultaneous_per_class: { ...this.peak_counts },
      unique_tracked_objects_per_class: this.unique_counts,
    };
  }

  public generateCSV(): string {
    if (this.rows.length === 0) {
      return 'frame,total,inference_ms\n';
    }
    const allKeys = new Set<string>();
    this.rows.forEach((r) => Object.keys(r).forEach((k) => allKeys.add(k)));
    allKeys.delete('frame');
    allKeys.delete('total');
    allKeys.delete('inference_ms');
    const classCols = Array.from(allKeys).sort();
    const headers = ['frame', 'total', 'inference_ms', ...classCols];

    const lines = [headers.join(',')];
    for (const row of this.rows) {
      const vals = [
        row.frame,
        row.total,
        row.inference_ms,
        ...classCols.map((c) => row[c] ?? 0),
      ];
      lines.push(vals.join(','));
    }
    return lines.join('\n');
  }

  public generateJSON(): string {
    return JSON.stringify(this.summary(), null, 2);
  }
}
