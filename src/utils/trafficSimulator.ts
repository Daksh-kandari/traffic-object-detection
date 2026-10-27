import { Detection, TrafficClass } from '../types/traffic';

export interface TrafficScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  isLowLight: boolean;
  durationFrames: number;
}

export const PRESET_SCENARIOS: TrafficScenario[] = [
  {
    id: 'highway',
    name: 'Multilane Express Highway',
    category: 'High-Speed Flow',
    description: '3-lane highway with cars, long-haul freight trucks, and express buses.',
    isLowLight: false,
    durationFrames: 600,
  },
  {
    id: 'urban',
    name: 'Urban Intersection & Crosswalk',
    category: 'Mixed Traffic',
    description: 'Signalized downtown junction with pedestrians, bicycles, turning cars, and traffic lights.',
    isLowLight: false,
    durationFrames: 600,
  },
  {
    id: 'night',
    name: 'Low-Light Dusk / Rain Corridor',
    category: 'Challenging Lighting',
    description: 'Dim evening conditions with wet road reflections—demonstrates CLAHE contrast boost.',
    isLowLight: true,
    durationFrames: 600,
  },
  {
    id: 'roundabout',
    name: 'Junction & Two-Wheelers',
    category: 'Complex Navigation',
    description: 'Dense traffic hub with high concentration of motorcycles, scooters, and cyclists.',
    isLowLight: false,
    durationFrames: 600,
  },
];

interface SimEntity {
  id: number;
  label: TrafficClass;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  lane: number;
  baseConf: number;
  color: string;
}

export class TrafficSimulationEngine {
  private scenarioId = 'highway';
  private entities: SimEntity[] = [];
  private trafficLightState: 'green' | 'yellow' | 'red' = 'green';
  private lightTimer = 0;
  private width = 854;
  private height = 480;

  constructor(scenarioId = 'highway') {
    this.scenarioId = scenarioId;
    this.initScenario(scenarioId);
  }

  public setScenario(scenarioId: string) {
    this.scenarioId = scenarioId;
    this.initScenario(scenarioId);
  }

  public initScenario(id: string) {
    this.scenarioId = id;
    this.entities = [];
    this.lightTimer = 0;
    this.trafficLightState = 'green';

    if (id === 'highway') {
      const types: TrafficClass[] = ['car', 'car', 'truck', 'bus', 'car', 'motorcycle'];
      for (let i = 0; i < 9; i++) {
        const lane = i % 3;
        const laneY = 160 + lane * 90;
        const type = types[i % types.length];
        const w = type === 'truck' ? 140 : type === 'bus' ? 130 : type === 'motorcycle' ? 45 : 80;
        const h = type === 'truck' || type === 'bus' ? 55 : type === 'motorcycle' ? 30 : 42;
        this.entities.push({
          id: i + 1,
          label: type,
          x: (i * 210) % 900 - 100,
          y: laneY + (Math.random() * 10 - 5),
          w,
          h,
          vx: 3.5 + Math.random() * 2.5 + (lane === 0 ? 1.5 : 0),
          vy: 0,
          lane,
          baseConf: 0.84 + Math.random() * 0.14,
          color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#ec4899'][i % 6],
        });
      }
    } else if (id === 'urban') {
      // Urban mix: cars, pedestrians, bicycle, stop sign, traffic light
      this.entities.push(
        { id: 1, label: 'car', x: 120, y: 220, w: 85, h: 45, vx: 2.2, vy: 0, lane: 0, baseConf: 0.92, color: '#3b82f6' },
        { id: 2, label: 'car', x: 480, y: 310, w: 85, h: 45, vx: -2.0, vy: 0, lane: 1, baseConf: 0.89, color: '#f59e0b' },
        { id: 3, label: 'bus', x: -80, y: 215, w: 135, h: 52, vx: 1.8, vy: 0, lane: 0, baseConf: 0.94, color: '#eab308' },
        { id: 4, label: 'person', x: 380, y: 110, w: 22, h: 48, vx: 0, vy: 0.9, lane: 0, baseConf: 0.88, color: '#22c55e' },
        { id: 5, label: 'person', x: 415, y: 390, w: 22, h: 48, vx: 0, vy: -0.85, lane: 0, baseConf: 0.86, color: '#22c55e' },
        { id: 6, label: 'bicycle', x: 50, y: 175, w: 42, h: 36, vx: 1.2, vy: 0, lane: 0, baseConf: 0.83, color: '#14b8a6' },
        { id: 7, label: 'motorcycle', x: 260, y: 315, w: 48, h: 32, vx: -2.4, vy: 0, lane: 1, baseConf: 0.87, color: '#ea580c' },
      );
    } else if (id === 'night') {
      // Low light rain corridor
      const types: TrafficClass[] = ['car', 'car', 'truck', 'motorcycle', 'car'];
      for (let i = 0; i < 7; i++) {
        const lane = i % 2;
        const laneY = 190 + lane * 110;
        const type = types[i % types.length];
        this.entities.push({
          id: i + 1,
          label: type,
          x: (i * 260) % 950 - 100,
          y: laneY + (Math.random() * 8 - 4),
          w: type === 'truck' ? 145 : type === 'motorcycle' ? 44 : 85,
          h: type === 'truck' ? 56 : type === 'motorcycle' ? 30 : 44,
          vx: lane === 0 ? 3.2 + Math.random() * 1.5 : -3.0 - Math.random() * 1.5,
          vy: 0,
          lane,
          baseConf: 0.76 + Math.random() * 0.16,
          color: ['#94a3b8', '#38bdf8', '#f43f5e', '#a855f7'][i % 4],
        });
      }
    } else {
      // Roundabout
      const types: TrafficClass[] = ['car', 'motorcycle', 'bicycle', 'car', 'motorcycle', 'bus'];
      for (let i = 0; i < 8; i++) {
        const type = types[i % types.length];
        this.entities.push({
          id: i + 1,
          label: type,
          x: (i * 180) % 900 - 80,
          y: 180 + (i % 3) * 80,
          w: type === 'bus' ? 130 : type === 'car' ? 82 : type === 'motorcycle' ? 45 : 38,
          h: type === 'bus' ? 52 : type === 'car' ? 42 : type === 'motorcycle' ? 30 : 34,
          vx: 2.0 + Math.random() * 1.8,
          vy: 0,
          lane: i % 3,
          baseConf: 0.85 + Math.random() * 0.12,
          color: '#3b82f6',
        });
      }
    }
  }

  public step(frameIndex: number, confThreshold = 0.35, allowedClasses?: string[]): { frameCanvas: HTMLCanvasElement; detections: Detection[] } {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d')!;

    // 1. Draw Road / Environment
    this.drawEnvironment(ctx, frameIndex);

    // 2. Update entities & Draw them
    const detections: Detection[] = [];
    this.updateEntities(frameIndex);

    // Static scene items (e.g. traffic light & stop signs)
    if (this.scenarioId === 'urban') {
      // Draw traffic light post
      this.drawTrafficLight(ctx, 680, 80, this.trafficLightState);
      const tlDet: Detection = {
        label: 'traffic light',
        conf: 0.94,
        xyxy: [670, 70, 715, 175],
      };
      if (!allowedClasses || allowedClasses.includes('traffic light')) {
        if (tlDet.conf >= confThreshold) detections.push(tlDet);
      }

      // Draw stop sign
      this.drawStopSign(ctx, 140, 100);
      const ssDet: Detection = {
        label: 'stop sign',
        conf: 0.91,
        xyxy: [125, 90, 170, 160],
      };
      if (!allowedClasses || allowedClasses.includes('stop sign')) {
        if (ssDet.conf >= confThreshold) detections.push(ssDet);
      }
    }

    // Dynamic entities
    for (const ent of this.entities) {
      this.drawEntity(ctx, ent);

      // Check if entity is within viewable frame
      if (ent.x + ent.w > 0 && ent.x < this.width) {
        const noiseConf = (Math.sin(frameIndex * 0.1 + ent.id) * 0.05);
        const finalConf = Math.min(0.99, Math.max(0.2, ent.baseConf + noiseConf));

        if (finalConf >= confThreshold) {
          if (!allowedClasses || allowedClasses.includes(ent.label)) {
            detections.push({
              label: ent.label,
              conf: Math.round(finalConf * 100) / 100,
              xyxy: [
                Math.round(ent.x),
                Math.round(ent.y),
                Math.round(ent.x + ent.w),
                Math.round(ent.y + ent.h),
              ],
            });
          }
        }
      }
    }

    return { frameCanvas: canvas, detections };
  }

  private updateEntities(frameIndex: number) {
    this.lightTimer++;
    if (this.lightTimer > 180) {
      this.lightTimer = 0;
      this.trafficLightState = this.trafficLightState === 'green' ? 'yellow' : this.trafficLightState === 'yellow' ? 'red' : 'green';
    }

    const isRed = this.scenarioId === 'urban' && this.trafficLightState === 'red';

    for (const ent of this.entities) {
      let speed = ent.vx;
      if (isRed && ent.vx > 0 && ent.x > 320 && ent.x < 420) {
        speed = 0.2; // slow down at red light
      }

      ent.x += speed;
      ent.y += ent.vy;

      // Wrap around screen
      if (ent.vx > 0 && ent.x > this.width + 60) {
        ent.x = -ent.w - 40;
      } else if (ent.vx < 0 && ent.x < -ent.w - 60) {
        ent.x = this.width + 40;
      }

      // Vertical bounce for pedestrians
      if (ent.vy !== 0) {
        if (ent.y > 380) {
          ent.vy = -Math.abs(ent.vy);
        } else if (ent.y < 120) {
          ent.vy = Math.abs(ent.vy);
        }
      }
    }
  }

  private drawEnvironment(ctx: CanvasRenderingContext2D, frameIndex: number) {
    const isNight = this.scenarioId === 'night';

    // Sky / Background
    if (isNight) {
      const grad = ctx.createLinearGradient(0, 0, 0, 160);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, 160);
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = grad;
    }
    ctx.fillRect(0, 0, this.width, 150);

    // Horizon line / greenery
    ctx.fillStyle = isNight ? '#064e3b' : '#15803d';
    ctx.fillRect(0, 130, this.width, 30);

    // Road surface
    ctx.fillStyle = isNight ? '#0b0f19' : '#1e293b';
    ctx.fillRect(0, 160, this.width, 300);

    // Lane markings
    ctx.strokeStyle = isNight ? '#475569' : '#f8fafc';
    ctx.lineWidth = 3;
    ctx.setLineDash([25, 20]);
    const offset = -(frameIndex * 4) % 45;
    ctx.lineDashOffset = offset;

    const laneYPositions = this.scenarioId === 'highway' ? [250, 340] : [310];
    for (const ly of laneYPositions) {
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(this.width, ly);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Curbs & Shoulders
    ctx.fillStyle = isNight ? '#1e293b' : '#cbd5e1';
    ctx.fillRect(0, 155, this.width, 6);
    ctx.fillRect(0, 455, this.width, 12);

    // Crosswalk for Urban scenario
    if (this.scenarioId === 'urban') {
      ctx.fillStyle = '#ffffff';
      for (let y = 165; y < 450; y += 32) {
        ctx.fillRect(370, y, 55, 18);
      }
    }

    // Rain effect for night
    if (isNight) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 40; i++) {
        const rx = ((i * 47 + frameIndex * 19) % this.width);
        const ry = ((i * 31 + frameIndex * 27) % this.height);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 4, ry + 16);
        ctx.stroke();
      }
    }
  }

  private drawEntity(ctx: CanvasRenderingContext2D, ent: SimEntity) {
    const isNight = this.scenarioId === 'night';
    ctx.save();

    if (ent.label === 'person') {
      // Draw pedestrian silhouette
      ctx.fillStyle = '#f87171';
      // Head
      ctx.beginPath();
      ctx.arc(ent.x + ent.w / 2, ent.y + 7, 6, 0, Math.PI * 2);
      ctx.fill();
      // Body
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(ent.x + 3, ent.y + 14, ent.w - 6, 18);
      // Legs
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(ent.x + 4, ent.y + 32, 5, 14);
      ctx.fillRect(ent.x + ent.w - 9, ent.y + 32, 5, 14);
    } else if (ent.label === 'bicycle' || ent.label === 'motorcycle') {
      // 2-wheeler
      ctx.fillStyle = ent.color;
      ctx.fillRect(ent.x + 4, ent.y + 8, ent.w - 8, ent.h - 14);
      // Wheels
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(ent.x + 9, ent.y + ent.h - 6, 7, 0, Math.PI * 2);
      ctx.arc(ent.x + ent.w - 9, ent.y + ent.h - 6, 7, 0, Math.PI * 2);
      ctx.fill();
      // Rider
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.arc(ent.x + ent.w / 2, ent.y + 3, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Vehicle (car, truck, bus)
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(ent.x + 2, ent.y + ent.h - 4, ent.w, 6);

      // Chassis
      ctx.fillStyle = ent.color;
      ctx.beginPath();
      ctx.roundRect(ent.x, ent.y + (ent.h * 0.25), ent.w, ent.h * 0.7, 6);
      ctx.fill();

      // Cabin / Roof
      ctx.fillStyle = ent.label === 'truck' ? '#94a3b8' : ent.label === 'bus' ? ent.color : 'rgba(255,255,255,0.85)';
      const roofMargin = ent.w * 0.22;
      ctx.beginPath();
      ctx.roundRect(ent.x + (ent.vx >= 0 ? roofMargin : ent.w * 0.1), ent.y, ent.w * 0.65, ent.h * 0.5, 4);
      ctx.fill();

      // Windshield & windows
      ctx.fillStyle = '#0284c7';
      if (ent.vx >= 0) {
        ctx.fillRect(ent.x + ent.w * 0.6, ent.y + 4, ent.w * 0.2, ent.h * 0.4);
      } else {
        ctx.fillRect(ent.x + ent.w * 0.15, ent.y + 4, ent.w * 0.2, ent.h * 0.4);
      }

      // Wheels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ent.x + 10, ent.y + ent.h - 5, 16, 6);
      ctx.fillRect(ent.x + ent.w - 26, ent.y + ent.h - 5, 16, 6);

      // Headlights / taillights
      if (ent.vx >= 0) {
        // Front right
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(ent.x + ent.w - 3, ent.y + ent.h * 0.45, 4, 8);
        // Headlight beam at night
        if (isNight) {
          ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
          ctx.beginPath();
          ctx.moveTo(ent.x + ent.w, ent.y + ent.h * 0.4);
          ctx.lineTo(ent.x + ent.w + 140, ent.y - 10);
          ctx.lineTo(ent.x + ent.w + 140, ent.y + ent.h + 20);
          ctx.closePath();
          ctx.fill();
        }
        // Rear left taillight
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(ent.x - 2, ent.y + ent.h * 0.45, 3, 7);
      } else {
        // Front left
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(ent.x - 2, ent.y + ent.h * 0.45, 3, 8);
        if (isNight) {
          ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
          ctx.beginPath();
          ctx.moveTo(ent.x, ent.y + ent.h * 0.4);
          ctx.lineTo(ent.x - 140, ent.y - 10);
          ctx.lineTo(ent.x - 140, ent.y + ent.h + 20);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(ent.x + ent.w - 1, ent.y + ent.h * 0.45, 3, 7);
      }
    }

    ctx.restore();
  }

  private drawTrafficLight(ctx: CanvasRenderingContext2D, x: number, y: number, state: 'green' | 'yellow' | 'red') {
    // Pole
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x + 18, y + 80, 8, 90);

    // Box
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(x, y, 44, 90, 8);
    ctx.fill();

    // Red
    ctx.fillStyle = state === 'red' ? '#ef4444' : '#450a0a';
    ctx.beginPath();
    ctx.arc(x + 22, y + 20, 10, 0, Math.PI * 2);
    ctx.fill();

    // Yellow
    ctx.fillStyle = state === 'yellow' ? '#f59e0b' : '#451a03';
    ctx.beginPath();
    ctx.arc(x + 22, y + 46, 10, 0, Math.PI * 2);
    ctx.fill();

    // Green
    ctx.fillStyle = state === 'green' ? '#10b981' : '#022c22';
    ctx.beginPath();
    ctx.arc(x + 22, y + 72, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawStopSign(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // Pole
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 18, y + 40, 6, 60);

    // Octagon
    ctx.save();
    ctx.translate(x + 21, y + 21);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    const r = 20;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 + Math.PI / 8;
      const px = r * Math.cos(angle);
      const py = r * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('STOP', 0, 1);
    ctx.restore();
  }
}
