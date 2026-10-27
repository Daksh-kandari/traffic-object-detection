import React from 'react';
import { ArrowRight, Camera, Cpu, Eye, FileSpreadsheet, Sparkles } from 'lucide-react';

interface SystemDiagramProps {
  currentStage: 'input' | 'preprocess' | 'detector' | 'analytics' | 'output';
  claheEnabled: boolean;
  stride: number;
  confThreshold: number;
  trackingEnabled: boolean;
  fps: number;
  trackedCount: number;
}

export const SystemDiagram: React.FC<SystemDiagramProps> = ({
  currentStage,
  claheEnabled,
  stride,
  confThreshold,
  trackingEnabled,
  fps,
  trackedCount,
}) => {
  const stages = [
    {
      id: 'input',
      title: 'Input Module',
      sub: 'src/traffic_detect/input_module.py',
      desc: 'Image / Video / Folder / Webcam (OpenCV FrameSource)',
      badge: 'Capture & Decode',
      icon: Camera,
      color: 'blue',
    },
    {
      id: 'preprocess',
      title: 'Preprocessing',
      sub: 'src/traffic_detect/preprocess.py',
      desc: `Max side 1280px • Stride 1/${stride} • CLAHE L-channel: ${claheEnabled ? 'ON' : 'OFF'}`,
      badge: claheEnabled ? 'CLAHE Active' : 'Normalised',
      icon: Sparkles,
      color: 'amber',
    },
    {
      id: 'detector',
      title: 'YOLO + ByteTrack',
      sub: 'src/traffic_detect/detector.py',
      desc: `YOLOv11n • conf ≥ ${confThreshold.toFixed(2)} • IoU 0.45 • ${trackingEnabled ? 'Tracking' : 'Detect Only'}`,
      badge: trackingEnabled ? 'ByteTrack' : 'Static BBoxes',
      icon: Cpu,
      color: 'emerald',
    },
    {
      id: 'analytics',
      title: 'Analytics Engine',
      sub: 'src/traffic_detect/analytics.py',
      desc: `Count, classify, peak simultaneous, ${trackedCount} unique IDs • ${fps.toFixed(1)} FPS`,
      badge: 'Telemetry Update',
      icon: Eye,
      color: 'indigo',
    },
    {
      id: 'output',
      title: 'Output Sink',
      sub: 'src/traffic_detect/output.py',
      desc: 'HUD overlay • VideoSink MP4 • metrics.json • frames.csv',
      badge: 'Annotated Visuals',
      icon: FileSpreadsheet,
      color: 'purple',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase font-mono">
            System Design Pipeline
          </span>
          <span className="text-xs text-slate-500 font-mono">(Matches B.Tech Final Year Architecture Slide)</span>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Throughput: <span className="text-emerald-400 font-semibold">{fps.toFixed(1)} fps</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 relative">
        {stages.map((st, idx) => {
          const Icon = st.icon;
          const isActive = currentStage === st.id;
          return (
            <div key={st.id} className="relative flex items-center">
              <div
                className={`w-full p-3 rounded-lg border transition-all duration-300 relative ${
                  isActive
                    ? 'bg-slate-800/90 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <div
                      className={`p-1.5 rounded-md ${
                        st.color === 'blue'
                          ? 'bg-blue-500/10 text-blue-400'
                          : st.color === 'amber'
                          ? 'bg-amber-500/10 text-amber-400'
                          : st.color === 'emerald'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : st.color === 'indigo'
                          ? 'bg-indigo-500/10 text-indigo-400'
                          : 'bg-purple-500/10 text-purple-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">{st.title}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {st.badge}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 mb-1 truncate">{st.sub}</div>
                <div className="text-[11px] text-slate-300 leading-tight line-clamp-2">{st.desc}</div>
              </div>

              {idx < stages.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
