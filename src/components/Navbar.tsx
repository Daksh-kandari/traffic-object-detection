import React from 'react';
import { 
  Activity, 
  BarChart3, 
  CheckCircle2, 
  Cpu, 
  Download, 
  FileCode2, 
  Layers, 
  Sliders, 
  Video 
} from 'lucide-react';

export type ActiveTab = 'pipeline' | 'analytics' | 'evaluation' | 'training' | 'system';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  fps: number;
  isStreaming: boolean;
  totalDetections: number;
  onExportJSON: () => void;
  onExportCSV: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  fps,
  isStreaming,
  totalDetections,
  onExportJSON,
  onExportCSV,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Project Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">Traffic Detect</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-medium border border-blue-500/30">
                  YOLOv11 + ByteTrack
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Road Object Detection, Localisation, Classification & Tracking
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'pipeline'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Live Pipeline</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('evaluation')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'evaluation'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Evaluation</span>
            </button>

            <button
              onClick={() => setActiveTab('training')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'training'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Config & Train</span>
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'system'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>System Design</span>
            </button>
          </nav>

          {/* Quick Stats & Export dropdown */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-3 text-xs font-mono bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-lg">
              <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-slate-300">{isStreaming ? 'ONLINE' : 'PAUSED'}</span>
              </div>
              <div className="h-3 w-px bg-slate-800" />
              <div className="text-slate-400">
                FPS: <span className="text-blue-400 font-semibold">{fps.toFixed(1)}</span>
              </div>
              <div className="h-3 w-px bg-slate-800" />
              <div className="text-slate-400">
                Objects: <span className="text-emerald-400 font-semibold">{totalDetections}</span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={onExportJSON}
                title="Export metrics.json (matches Python output)"
                className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded flex items-center space-x-1 border border-slate-700 transition"
              >
                <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                <span>JSON</span>
              </button>
              <button
                onClick={onExportCSV}
                title="Export frames.csv (matches Python output)"
                className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded flex items-center space-x-1 border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
