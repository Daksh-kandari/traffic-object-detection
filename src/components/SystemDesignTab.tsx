import React from 'react';
import { 
  BookOpen, 
  CheckCircle, 
  Cpu, 
  ExternalLink, 
  FileText, 
  Layers, 
  Maximize2, 
  Network, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

export const SystemDesignTab: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Slide Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-medium">
            <span>B.Tech Final Year Engineering Project</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Traffic Object Detection, Localisation & Multi-Object Tracking
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            Real-time vision pipeline for autonomous driving telemetry, intersection safety monitoring, and automated road user classification using state-of-the-art YOLO architectures, CLAHE enhancement, and ByteTrack data association.
          </p>
        </div>
      </div>

      {/* Architecture Breakdown Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <span>System Design Modules (System Architecture Slide)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Module 1: Input */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-blue-400">1. Input Module</span>
              <span className="text-[10px] font-mono text-slate-500">src/traffic_detect/input_module.py</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Provides an abstraction over diverse visual media sources: video files (MP4, AVI, MOV), image directories, static imagery, or direct hardware webcam feeds via <code className="text-blue-300 font-mono">FrameSource</code> with auto-fps recovery and lazy reader initialisation.
            </p>
          </div>

          {/* Module 2: Preprocessing */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-amber-400">2. Preprocessing Module</span>
              <span className="text-[10px] font-mono text-slate-500">src/traffic_detect/preprocess.py</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Maintains aspect ratio with downscaling to max side dimension (1280px), frame stride decimation for high-speed edge processing, and Contrast Limited Adaptive Histogram Equalization (CLAHE) applied exclusively to the luminance channel for challenging nocturnal or adverse weather footage.
            </p>
          </div>

          {/* Module 3: Detection & Tracking */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-emerald-400">3. Detection & Tracking Module</span>
              <span className="text-[10px] font-mono text-slate-500">src/traffic_detect/detector.py</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Executes YOLOv11 deep convolutional inference over anchor-free decoupled detection heads. Seamlessly integrates ByteTrack Kalman filtering to preserve track IDs across frame occlusions, preventing ID switching on high-density roads.
            </p>
          </div>

          {/* Module 4: Analytics */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-indigo-400">4. Analytics Engine</span>
              <span className="text-[10px] font-mono text-slate-500">src/traffic_detect/analytics.py</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Continuous accumulation of per-frame detections, peak concurrent density, class-specific instance counting, and unique tracked road user sets. Generates frame-by-frame telemetry logs for export.
            </p>
          </div>
        </div>
      </div>

      {/* Mathematical Formulations */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span>Core Algorithms & Mathematical Foundations</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
          {/* IoU & mAP Formulation */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-sm text-slate-200">Intersection over Union (IoU) & mAP</div>
            <p className="text-slate-400 leading-relaxed">
              Object localisation evaluates predicted bounding boxes against ground truth boxes:
            </p>
            <div className="p-2.5 rounded bg-slate-900 font-mono text-[11px] text-blue-300 text-center border border-slate-800">
              IoU = Area(B_pred ∩ B_gt) / Area(B_pred ∪ B_gt)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Mean Average Precision (mAP) averages the interpolated precision values across recall levels [0, 0.1, ..., 1.0] across all C classes:
            </p>
            <div className="p-2.5 rounded bg-slate-900 font-mono text-[11px] text-emerald-300 text-center border border-slate-800">
              mAP = (1 / C) * Σ AP_c, where AP = ∫ P(R) dR
            </div>
          </div>

          {/* CLAHE Formulation */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-sm text-slate-200">CLAHE (Contrast Enhancement)</div>
            <p className="text-slate-400 leading-relaxed">
              Prevents over-amplification of noise in homogeneous regions (e.g. night asphalt or headlights) by clipping the histogram at normalized threshold β:
            </p>
            <div className="p-2.5 rounded bg-slate-900 font-mono text-[11px] text-amber-300 text-center border border-slate-800">
              ClipLimit = (M * N / L) * (1 + (α / 100) * (S_max - 1))
            </div>
            <p className="text-slate-400 leading-relaxed">
              Excess pixels above the clip limit are uniformly redistributed across all histogram bins before applying bilinear interpolation across contextual grid tiles.
            </p>
          </div>
        </div>
      </div>

      {/* References & Academic Literature */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <span>Academic References (References Slide)</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">B.Tech Project Bibliography</span>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="font-semibold text-slate-200">
              1. You Only Look Once: Unified, Real-Time Object Detection
            </div>
            <div className="text-slate-400 mt-0.5">
              Redmon, J., Divvala, S., Girshick, R., & Farhadi, A. (2016). <em>IEEE Conference on Computer Vision and Pattern Recognition (CVPR)</em>, 779–788.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="font-semibold text-slate-200">
              2. Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks
            </div>
            <div className="text-slate-400 mt-0.5">
              Ren, S., He, K., Girshick, R., & Sun, J. (2015). <em>Advances in Neural Information Processing Systems (NeurIPS)</em>, 28, 91–99.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="font-semibold text-slate-200">
              3. SSD: Single Shot MultiBox Detector
            </div>
            <div className="text-slate-400 mt-0.5">
              Liu, W., Anguelov, D., Erhan, D., Szegedy, C., Reed, S., Fu, C. Y., & Berg, A. C. (2016). <em>European Conference on Computer Vision (ECCV)</em>, 21–37.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="font-semibold text-slate-200">
              4. ByteTrack: Multi-Object Tracking by Associating Every Detection Box
            </div>
            <div className="text-slate-400 mt-0.5">
              Zhang, Y., Sun, P., Jiang, Y., Yu, D., Weng, F., Yuan, Z., Luo, P., Liu, W., & Wang, X. (2022). <em>European Conference on Computer Vision (ECCV)</em>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
