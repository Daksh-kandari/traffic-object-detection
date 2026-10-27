import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  AlertCircle, 
  Camera, 
  Check, 
  ChevronRight, 
  Crosshair, 
  FastForward, 
  Maximize2, 
  Moon, 
  Pause, 
  Play, 
  RotateCcw, 
  Sliders, 
  Sparkles, 
  Sun, 
  Upload, 
  Video 
} from 'lucide-react';
import { Detection, PipelineConfig, TrafficClass } from '../types/traffic';
import { PRESET_SCENARIOS, TrafficSimulationEngine } from '../utils/trafficSimulator';
import { ByteTracker } from '../utils/bytetrack';
import { TrafficAnalyticsTracker } from '../utils/analytics';
import { applyCLAHE } from '../utils/clahe';
import { getClassColorHex, getClassColorRGBA } from '../utils/colors';

const ALL_CLASSES: TrafficClass[] = [
  'car',
  'motorcycle',
  'bus',
  'truck',
  'person',
  'bicycle',
  'stop sign',
  'traffic light',
  'traffic sign',
];

interface PipelineViewerProps {
  config: PipelineConfig;
  onConfigChange: (newConfig: PipelineConfig) => void;
  analytics: TrafficAnalyticsTracker;
  onAnalyticsUpdate: () => void;
}

export const PipelineViewer: React.FC<PipelineViewerProps> = ({
  config,
  onConfigChange,
  analytics,
  onAnalyticsUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Source selection: 'preset' | 'video' | 'image' | 'webcam'
  const [sourceType, setSourceType] = useState<'preset' | 'video' | 'image' | 'webcam'>('preset');
  const [selectedScenario, setSelectedScenario] = useState<string>('highway');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showTrajectories, setShowTrajectories] = useState<boolean>(true);
  const [showHUD, setShowHUD] = useState<boolean>(true);
  const [currentDetections, setCurrentDetections] = useState<Detection[]>([]);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [webcamError, setWebcamError] = useState<string>('');

  // Engine refs
  const simEngineRef = useRef<TrafficSimulationEngine>(new TrafficSimulationEngine('highway'));
  const trackerRef = useRef<ByteTracker>(new ByteTracker());
  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const frameAccumulatorRef = useRef<number>(0);

  // Initialize scenario
  useEffect(() => {
    if (sourceType === 'preset') {
      simEngineRef.current.setScenario(selectedScenario);
      trackerRef.current.reset();
      const currentScenarioObj = PRESET_SCENARIOS.find((s) => s.id === selectedScenario);
      if (currentScenarioObj?.isLowLight && !config.preprocess.low_light_enhance) {
        // Automatically enable CLAHE suggestion for low light
        onConfigChange({
          ...config,
          preprocess: { ...config.preprocess, low_light_enhance: true },
        });
      }
    }
  }, [selectedScenario, sourceType]);

  // Clean up webcam on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [webcamStream]);

  // Switch to Webcam
  const handleStartWebcam = async () => {
    try {
      setWebcamError('');
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setWebcamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setSourceType('webcam');
      trackerRef.current.reset();
    } catch (err: any) {
      setWebcamError(err.message || 'Unable to access camera');
    }
  };

  // Handle Video/Image File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const url = URL.createObjectURL(file);
    trackerRef.current.reset();

    if (file.type.startsWith('video/')) {
      setSourceType('video');
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
        videoRef.current.loop = true;
        videoRef.current.play();
      }
    } else if (file.type.startsWith('image/')) {
      setSourceType('image');
      const img = new Image();
      img.onload = () => {
        renderImageFrame(img);
      };
      img.src = url;
    }
  };

  // Render single image frame
  const renderImageFrame = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 854;
    canvas.height = 480;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Apply CLAHE if enabled
    if (config.preprocess.low_light_enhance) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const enhanced = applyCLAHE(imgData, 2.0, 8);
      ctx.putImageData(enhanced, 0, 0);
    }

    // Generate representative detections
    const dets: Detection[] = [
      { label: 'car', conf: 0.93, xyxy: [120, 240, 280, 360], track_id: 1 },
      { label: 'car', conf: 0.88, xyxy: [420, 260, 560, 370], track_id: 2 },
      { label: 'truck', conf: 0.85, xyxy: [620, 200, 810, 380], track_id: 3 },
      { label: 'traffic light', conf: 0.91, xyxy: [580, 90, 625, 180] },
    ];
    const filtered = dets.filter(
      (d) => d.conf >= config.model.conf && config.model.classes.includes(d.label)
    );

    const t0 = performance.now();
    analytics.update(1, filtered, 14.5);
    onAnalyticsUpdate();

    renderOverlay(ctx, filtered, canvas.width, canvas.height, 42.0);
    setCurrentDetections(filtered);
  };

  // Render HUD Overlay matching output.py: annotate()
  const renderOverlay = (
    ctx: CanvasRenderingContext2D,
    detections: Detection[],
    w: number,
    h: number,
    fps: number
  ) => {
    // 1. Draw trajectories if tracking enabled
    if (config.tracking.enabled && showTrajectories) {
      for (const d of detections) {
        if (d.trajectory && d.trajectory.length > 1) {
          const colorHex = getClassColorHex(d.label);
          ctx.strokeStyle = colorHex;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(d.trajectory[0][0], d.trajectory[0][1]);
          for (let i = 1; i < d.trajectory.length; i++) {
            ctx.lineTo(d.trajectory[i][0], d.trajectory[i][1]);
          }
          ctx.stroke();

          // Motion dot at current position
          const lastPoint = d.trajectory[d.trajectory.length - 1];
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(lastPoint[0], lastPoint[1], 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Draw Bounding Boxes with tags
    for (const d of detections) {
      const [x1, y1, x2, y2] = d.xyxy;
      const boxW = x2 - x1;
      const boxH = y2 - y1;
      const colorHex = getClassColorHex(d.label);

      // Bounding Box
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x1, y1, boxW, boxH);

      // Subtle fill
      ctx.fillStyle = getClassColorRGBA(d.label, 0.12);
      ctx.fillRect(x1, y1, boxW, boxH);

      // Tag: label + conf + optional track_id + speed
      let tag = `${d.label} ${d.conf.toFixed(2)}`;
      if (config.tracking.enabled && d.track_id !== undefined && d.track_id !== null) {
        tag += ` #${d.track_id}`;
      }
      if (d.speedKmh) {
        tag += ` ${d.speedKmh}km/h`;
      }

      ctx.font = 'bold 11px monospace';
      const textMetrics = ctx.measureText(tag);
      const tagW = textMetrics.width + 8;
      const tagH = 16;
      const tagY = Math.max(0, y1 - tagH - 2);

      ctx.fillStyle = colorHex;
      ctx.fillRect(x1, tagY, tagW, tagH);

      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(tag, x1 + 4, tagY + tagH / 2);
    }

    // 3. HUD Overlay (top-left black semi-transparent panel matching output.py)
    if (showHUD) {
      const counts: Record<string, number> = {};
      for (const d of detections) {
        counts[d.label] = (counts[d.label] || 0) + 1;
      }
      const totalObjects = detections.length;

      const lines = [`FPS: ${fps.toFixed(1)}   Objects: ${totalObjects}`];
      const sortedClasses = Object.keys(counts).sort();
      for (const cls of sortedClasses) {
        lines.push(`${cls}: ${counts[cls]}`);
      }

      const panelH = 12 + 20 * lines.length;
      const panelW = 210;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(8, 8, panelW, panelH);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, 8, panelW, panelH);

      ctx.font = '12px monospace';
      lines.forEach((line, i) => {
        ctx.fillStyle = i === 0 ? '#38bdf8' : '#f1f5f9';
        ctx.fillText(line, 16, 26 + 20 * i);
      });
    }
  };

  // Main animation / inference loop
  const processFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const t0 = performance.now();
    let currentFps = analytics.inference_fps || 30.0;

    // Check frame stride
    const shouldProcess = frameIndex % config.preprocess.frame_stride === 0;

    if (sourceType === 'preset') {
      const { frameCanvas, detections: rawDets } = simEngineRef.current.step(
        frameIndex,
        config.model.conf,
        config.model.classes
      );

      canvas.width = frameCanvas.width;
      canvas.height = frameCanvas.height;

      // Draw original frame
      ctx.drawImage(frameCanvas, 0, 0);

      // Preprocessing: Low-Light CLAHE enhancement
      if (config.preprocess.low_light_enhance) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const enhanced = applyCLAHE(imgData, 2.0, 8);
        ctx.putImageData(enhanced, 0, 0);
      }

      // Detection & Tracking
      let processedDets = rawDets;
      if (config.tracking.enabled && shouldProcess) {
        processedDets = trackerRef.current.update(rawDets);
      }

      const inferenceMs = performance.now() - t0;
      if (shouldProcess) {
        analytics.update(frameIndex, processedDets, inferenceMs);
        onAnalyticsUpdate();
        setCurrentDetections(processedDets);
      }

      // Annotate frame with boxes & HUD
      renderOverlay(ctx, processedDets, canvas.width, canvas.height, analytics.inference_fps || 30.0);
    } else if (sourceType === 'video' || sourceType === 'webcam') {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        canvas.width = video.videoWidth || 854;
        canvas.height = video.videoHeight || 480;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Preprocessing: CLAHE if enabled
        if (config.preprocess.low_light_enhance) {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const enhanced = applyCLAHE(imgData, 2.0, 8);
          ctx.putImageData(enhanced, 0, 0);
        }

        // Generate synthetic road detection over video/webcam feed with tracking
        const centerW = canvas.width / 2;
        const centerH = canvas.height / 2;
        const pseudoDets: Detection[] = [
          {
            label: 'car',
            conf: 0.89,
            xyxy: [
              centerW - 140 + Math.sin(frameIndex * 0.05) * 40,
              centerH + 40,
              centerW + 60 + Math.sin(frameIndex * 0.05) * 40,
              centerH + 180,
            ],
          },
          {
            label: 'traffic light',
            conf: 0.92,
            xyxy: [canvas.width - 120, 60, canvas.width - 70, 160],
          },
        ];

        const filtered = pseudoDets.filter(
          (d) => d.conf >= config.model.conf && config.model.classes.includes(d.label)
        );

        let finalDets = filtered;
        if (config.tracking.enabled) {
          finalDets = trackerRef.current.update(filtered);
        }

        const inferenceMs = performance.now() - t0;
        analytics.update(frameIndex, finalDets, inferenceMs);
        onAnalyticsUpdate();
        setCurrentDetections(finalDets);

        renderOverlay(ctx, finalDets, canvas.width, canvas.height, analytics.inference_fps || 30.0);
      }
    }
  }, [
    sourceType,
    frameIndex,
    config,
    showTrajectories,
    showHUD,
    analytics,
    onAnalyticsUpdate,
  ]);

  // Main animation frame driver
  useEffect(() => {
    if (!isPlaying) return;

    let mounted = true;
    const loop = (timestamp: number) => {
      if (!mounted) return;
      const elapsed = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Adjust for playback speed
      frameAccumulatorRef.current += elapsed * (playbackSpeed / 33.33);
      if (frameAccumulatorRef.current >= 1) {
        const advanceFrames = Math.floor(frameAccumulatorRef.current);
        frameAccumulatorRef.current -= advanceFrames;
        setFrameIndex((prev) => prev + advanceFrames);
        processFrame();
      }

      animationFrameId.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      mounted = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, playbackSpeed, processFrame]);

  // Take Snapshot of annotated frame
  const handleSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `traffic_frame_${frameIndex}_detected.jpg`;
    a.href = canvas.toDataURL('image/jpeg', 0.95);
    a.click();
  };

  // Toggle class filter
  const toggleClass = (cls: TrafficClass) => {
    const current = config.model.classes;
    const exists = current.includes(cls);
    const updated = exists ? current.filter((c) => c !== cls) : [...current, cls];
    onConfigChange({
      ...config,
      model: { ...config.model, classes: updated },
    });
  };

  return (
    <div className="space-y-6">
      {/* Hidden media elements */}
      <video ref={videoRef} playsInline muted className="hidden" crossOrigin="anonymous" />
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Control Bar: Source Selector & Quick Presets */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        {/* Source Switcher */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => {
              setSourceType('preset');
              trackerRef.current.reset();
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              sourceType === 'preset'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Traffic Scenarios
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center space-x-1.5 transition ${
              sourceType === 'video' || sourceType === 'image'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            onClick={handleStartWebcam}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center space-x-1.5 transition ${
              sourceType === 'webcam'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>
        </div>

        {/* Preset scenario selection if preset active */}
        {sourceType === 'preset' && (
          <div className="flex items-center space-x-2 overflow-x-auto py-1">
            {PRESET_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition whitespace-nowrap flex items-center space-x-1.5 ${
                  selectedScenario === sc.id
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 font-semibold'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {sc.isLowLight ? <Moon className="w-3.5 h-3.5 text-amber-400" /> : <Sun className="w-3.5 h-3.5 text-blue-400" />}
                <span>{sc.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Uploaded file info or webcam banner */}
        {(sourceType === 'video' || sourceType === 'image') && uploadedFileName && (
          <div className="text-xs text-slate-300 font-mono bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-2">
            <span className="text-slate-500">Source:</span>
            <span className="text-blue-400 font-medium truncate max-w-xs">{uploadedFileName}</span>
          </div>
        )}

        {webcamError && (
          <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>{webcamError}</span>
          </div>
        )}

        {/* Snapshot button */}
        <button
          onClick={handleSnapshot}
          className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center space-x-1.5 transition ml-auto"
        >
          <Camera className="w-3.5 h-3.5 text-blue-400" />
          <span>Save Frame (cv2.imwrite)</span>
        </button>
      </div>

      {/* Main Viewport & Live Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left/Center: Video Canvas Viewport */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl aspect-[16/9] flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain"
              width={854}
              height={480}
            />

            {/* Quick Status Pill Top-Right */}
            <div className="absolute top-3 right-3 flex items-center space-x-2 font-mono text-[11px] bg-black/70 backdrop-blur px-2.5 py-1 rounded-md border border-white/10 text-white">
              <span className="text-slate-400">MODEL:</span>
              <span className="text-blue-400 font-semibold">{config.model.weights}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">FRAME:</span>
              <span className="text-emerald-400 font-semibold">{frameIndex}</span>
            </div>

            {/* CLAHE Active Badge */}
            {config.preprocess.low_light_enhance && (
              <div className="absolute bottom-3 left-3 bg-amber-500/90 text-slate-950 font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow">
                CLAHE ENHANCEMENT ACTIVE
              </div>
            )}
          </div>

          {/* Video Playback & Interaction Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            {/* Play/Pause/Step */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow transition"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setFrameIndex((prev) => prev + 1);
                  processFrame();
                }}
                title="Step frame forward"
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-700 transition"
              >
                <FastForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setFrameIndex(0);
                  trackerRef.current.reset();
                  analytics.reset();
                  onAnalyticsUpdate();
                  if (videoRef.current) videoRef.current.currentTime = 0;
                }}
                title="Restart stream"
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-700 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Speed Multiplier */}
              <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5 text-xs font-mono ml-2">
                {[0.5, 1, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s)}
                    className={`px-2 py-1 rounded transition ${
                      playbackSpeed === s ? 'bg-slate-800 text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Overlays Toggle */}
            <div className="flex items-center space-x-3 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={showHUD}
                  onChange={(e) => setShowHUD(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                />
                <span>HUD Overlay</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={showTrajectories}
                  onChange={(e) => setShowTrajectories(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                />
                <span>Trajectories</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={config.tracking.enabled}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      tracking: { ...config.tracking, enabled: e.target.checked },
                    })
                  }
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                />
                <span>ByteTrack ID</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Pipeline Parameters & Live Detection List */}
        <div className="space-y-6">
          {/* Preprocessing & Inference Tuning Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Pipeline Tuning
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">config.yaml</span>
            </div>

            {/* CLAHE Low-Light Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-xs font-medium text-slate-200 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>CLAHE Low-Light</span>
                </div>
                <div className="text-[11px] text-slate-400">Contrast limited equalization</div>
              </div>
              <button
                onClick={() =>
                  onConfigChange({
                    ...config,
                    preprocess: {
                      ...config.preprocess,
                      low_light_enhance: !config.preprocess.low_light_enhance,
                    },
                  })
                }
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  config.preprocess.low_light_enhance ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    config.preprocess.low_light_enhance ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Frame Stride Selector */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Frame Stride</span>
                <span className="font-mono text-blue-400 font-semibold">1 / {config.preprocess.frame_stride}</span>
              </div>
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {[1, 2, 3, 5].map((st) => (
                  <button
                    key={st}
                    onClick={() =>
                      onConfigChange({
                        ...config,
                        preprocess: { ...config.preprocess, frame_stride: st },
                      })
                    }
                    className={`flex-1 py-1 text-xs font-mono rounded transition ${
                      config.preprocess.frame_stride === st
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Confidence Threshold */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Confidence Threshold</span>
                <span className="font-mono text-blue-400 font-semibold">{config.model.conf.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.90"
                step="0.05"
                value={config.model.conf}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    model: { ...config.model, conf: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* IoU NMS Threshold */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">NMS IoU Threshold</span>
                <span className="font-mono text-blue-400 font-semibold">{config.model.iou.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.80"
                step="0.05"
                value={config.model.iou}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    model: { ...config.model, iou: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Allowed Classes Checklist */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Target Classes
              </span>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {ALL_CLASSES.map((cls) => {
                  const isChecked = config.model.classes.includes(cls);
                  return (
                    <button
                      key={cls}
                      onClick={() => toggleClass(cls)}
                      className={`text-[11px] px-2 py-1 rounded flex items-center justify-between border transition ${
                        isChecked
                          ? 'bg-slate-800 text-slate-200 border-slate-700'
                          : 'bg-slate-950/40 text-slate-500 border-slate-800/80 line-through'
                      }`}
                    >
                      <span className="truncate">{cls}</span>
                      <span
                        className="w-2 h-2 rounded-full ml-1"
                        style={{ backgroundColor: getClassColorHex(cls) }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Current Frame Detections List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Crosshair className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Current Detections ({currentDetections.length})
                </span>
              </div>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {currentDetections.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4 italic">
                  No objects detected matching criteria
                </div>
              ) : (
                currentDetections.map((d, i) => (
                  <div
                    key={`${d.label}-${d.track_id || i}`}
                    className="p-2 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: getClassColorHex(d.label) }}
                      />
                      <div>
                        <span className="font-semibold text-slate-200 capitalize">{d.label}</span>
                        {d.track_id && (
                          <span className="text-[10px] text-slate-400 ml-1 font-mono">
                            #{d.track_id}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right font-mono text-[11px]">
                      <div className="text-emerald-400">{(d.conf * 100).toFixed(0)}%</div>
                      {d.speedKmh && (
                        <div className="text-slate-400 text-[10px]">{d.speedKmh} km/h</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
