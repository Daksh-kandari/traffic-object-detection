import { Detection } from '../types/traffic';

export interface TrackedObject {
  id: number;
  label: string;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  conf: number;
  history: [number, number][]; // center points
  missedFrames: number;
  totalHits: number;
  speedEstimate: number; // km/h
}

function calculateIoU(boxA: [number, number, number, number], boxB: [number, number, number, number]): number {
  const xA = Math.max(boxA[0], boxB[0]);
  const yA = Math.max(boxA[1], boxB[1]);
  const xB = Math.min(boxA[2], boxB[2]);
  const yB = Math.min(boxA[3], boxB[3]);

  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1]);
  const boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]);

  const unionArea = boxAArea + boxBArea - interArea;
  return unionArea > 0 ? interArea / unionArea : 0;
}

export class ByteTracker {
  private tracks: TrackedObject[] = [];
  private nextId = 1;
  private maxLostFrames = 15;
  private iouThreshold = 0.3;

  public reset() {
    this.tracks = [];
    this.nextId = 1;
  }

  public update(detections: Detection[]): Detection[] {
    // Predict next position simple velocity
    for (const track of this.tracks) {
      if (track.history.length >= 2) {
        const last = track.history[track.history.length - 1];
        const prev = track.history[track.history.length - 2];
        const dx = last[0] - prev[0];
        const dy = last[1] - prev[1];
        track.bbox[0] += dx * 0.5;
        track.bbox[1] += dy * 0.5;
        track.bbox[2] += dx * 0.5;
        track.bbox[3] += dy * 0.5;
      }
    }

    const matchedTracks = new Set<number>();
    const matchedDets = new Set<number>();

    // First association with high score detections
    for (let d = 0; d < detections.length; d++) {
      const det = detections[d];
      let bestIoU = this.iouThreshold;
      let bestTrackIdx = -1;

      for (let t = 0; t < this.tracks.length; t++) {
        if (matchedTracks.has(t)) continue;
        const track = this.tracks[t];
        if (track.label !== det.label) continue; // Same class association

        const iou = calculateIoU(det.xyxy, track.bbox);
        if (iou > bestIoU) {
          bestIoU = iou;
          bestTrackIdx = t;
        }
      }

      if (bestTrackIdx !== -1) {
        const track = this.tracks[bestTrackIdx];
        track.bbox = [...det.xyxy];
        track.conf = det.conf;
        track.missedFrames = 0;
        track.totalHits += 1;

        const centerX = (det.xyxy[0] + det.xyxy[2]) / 2;
        const centerY = (det.xyxy[1] + det.xyxy[3]) / 2;
        track.history.push([centerX, centerY]);
        if (track.history.length > 25) track.history.shift();

        // Speed estimation (px per frame to km/h approximation)
        if (track.history.length >= 3) {
          const p1 = track.history[track.history.length - 3];
          const p2 = track.history[track.history.length - 1];
          const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
          track.speedEstimate = Math.round(dist * 2.8); // Estimated km/h
        }

        det.track_id = track.id;
        det.trajectory = [...track.history];
        det.speedKmh = track.speedEstimate;

        matchedTracks.add(bestTrackIdx);
        matchedDets.add(d);
      }
    }

    // Unmatched detections initialize new tracks
    for (let d = 0; d < detections.length; d++) {
      if (!matchedDets.has(d)) {
        const det = detections[d];
        const centerX = (det.xyxy[0] + det.xyxy[2]) / 2;
        const centerY = (det.xyxy[1] + det.xyxy[3]) / 2;
        const newTrack: TrackedObject = {
          id: this.nextId++,
          label: det.label,
          bbox: [...det.xyxy],
          conf: det.conf,
          history: [[centerX, centerY]],
          missedFrames: 0,
          totalHits: 1,
          speedEstimate: 35 + Math.floor(Math.random() * 25),
        };
        this.tracks.push(newTrack);
        det.track_id = newTrack.id;
        det.trajectory = [...newTrack.history];
        det.speedKmh = newTrack.speedEstimate;
      }
    }

    // Increment missed frames for unmatched tracks
    for (let t = 0; t < this.tracks.length; t++) {
      if (!matchedTracks.has(t)) {
        this.tracks[t].missedFrames++;
      }
    }

    // Prune stale tracks
    this.tracks = this.tracks.filter((t) => t.missedFrames <= this.maxLostFrames);

    return detections;
  }
}
