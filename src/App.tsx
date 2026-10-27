import React, { useCallback, useRef, useState } from 'react';
import { ActiveTab, Navbar } from './components/Navbar';
import { PipelineViewer } from './components/PipelineViewer';
import { SystemDiagram } from './components/SystemDiagram';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { EvaluationTab } from './components/EvaluationTab';
import { TrainingConfigTab } from './components/TrainingConfigTab';
import { SystemDesignTab } from './components/SystemDesignTab';
import { PipelineConfig } from './types/traffic';
import { TrafficAnalyticsTracker } from './utils/analytics';

const INITIAL_CONFIG: PipelineConfig = {
  model: {
    weights: 'yolo11n.pt',
    imgsz: 640,
    conf: 0.35,
    iou: 0.45,
    device: 'auto',
    classes: [
      'car',
      'motorcycle',
      'bus',
      'truck',
      'person',
      'bicycle',
      'stop sign',
      'traffic light',
    ],
  },
  tracking: {
    enabled: true,
    tracker: 'bytetrack.yaml',
  },
  preprocess: {
    max_side: 1280,
    frame_stride: 1,
    low_light_enhance: false,
  },
  output: {
    save_video: true,
    show_window: false,
    out_dir: 'outputs',
  },
  train: {
    data: 'data/data.yaml',
    epochs: 50,
    batch: 16,
    imgsz: 640,
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pipeline');
  const [config, setConfig] = useState<PipelineConfig>(INITIAL_CONFIG);

  // Analytics tracker singleton ref
  const analyticsRef = useRef<TrafficAnalyticsTracker>(new TrafficAnalyticsTracker());
  const [, setTick] = useState<number>(0);

  const handleAnalyticsUpdate = useCallback(() => {
    // Light rerender trigger for dashboard/navbar metrics
    setTick((t) => (t + 1) % 1000);
  }, []);

  // Export JSON metrics
  const handleExportJSON = () => {
    const jsonStr = analyticsRef.current.generateJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'run_metrics.json';
    a.click();
  };

  // Export CSV frames
  const handleExportCSV = () => {
    const csvStr = analyticsRef.current.generateCSV();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'run_frames.csv';
    a.click();
  };

  const summary = analyticsRef.current.summary();
  const trackedUnique = Object.values(summary.unique_tracked_objects_per_class).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        fps={summary.inference_fps || 32.4}
        isStreaming={true}
        totalDetections={summary.total_detections}
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Render Tab Views */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <SystemDiagram
              currentStage="detector"
              claheEnabled={config.preprocess.low_light_enhance}
              stride={config.preprocess.frame_stride}
              confThreshold={config.model.conf}
              trackingEnabled={config.tracking.enabled}
              fps={summary.inference_fps || 32.4}
              trackedCount={trackedUnique}
            />

            <PipelineViewer
              config={config}
              onConfigChange={setConfig}
              analytics={analyticsRef.current}
              onAnalyticsUpdate={handleAnalyticsUpdate}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            analytics={analyticsRef.current}
            onExportJSON={handleExportJSON}
            onExportCSV={handleExportCSV}
          />
        )}

        {activeTab === 'evaluation' && <EvaluationTab />}

        {activeTab === 'training' && (
          <TrainingConfigTab config={config} onConfigChange={setConfig} />
        )}

        {activeTab === 'system' && <SystemDesignTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-xs text-slate-500 text-center font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Traffic Object Detection • B.Tech Final Year Project • Ultralytics YOLO & ByteTrack</span>
          <span>OpenCV · PyTorch · CLAHE · WebGL Engine</span>
        </div>
      </footer>
    </div>
  );
}
