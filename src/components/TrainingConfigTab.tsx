import React, { useEffect, useState } from 'react';
import { 
  Check, 
  Cpu, 
  Download, 
  FileCode, 
  HardDrive, 
  Layers, 
  Play, 
  RotateCcw, 
  Sliders, 
  Terminal, 
  TrendingDown, 
  TrendingUp, 
  Zap 
} from 'lucide-react';
import { PipelineConfig } from '../types/traffic';

interface TrainingConfigTabProps {
  config: PipelineConfig;
  onConfigChange: (cfg: PipelineConfig) => void;
}

export const TrainingConfigTab: React.FC<TrainingConfigTabProps> = ({
  config,
  onConfigChange,
}) => {
  // Training simulator state
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [maxEpochs, setMaxEpochs] = useState<number>(50);
  const [batchSize, setBatchSize] = useState<number>(16);
  const [selectedWeights, setSelectedWeights] = useState<string>('yolo11n.pt');
  const [selectedDevice, setSelectedDevice] = useState<string>('CUDA GPU 0 (Auto)');

  // Dynamic training loss curves
  const [epochLogs, setEpochLogs] = useState<
    Array<{ epoch: number; boxLoss: number; clsLoss: number; dflLoss: number; mAP50: number }>
  >([]);

  // Simulation loop
  useEffect(() => {
    let timer: any = null;
    if (isTraining && currentEpoch < maxEpochs) {
      timer = setTimeout(() => {
        const next = currentEpoch + 1;
        setCurrentEpoch(next);

        // Loss decays realistically
        const progress = next / maxEpochs;
        const box = Math.max(0.35, 1.6 - 1.2 * Math.sqrt(progress) + (Math.random() * 0.04 - 0.02));
        const cls = Math.max(0.22, 2.2 - 1.9 * Math.sqrt(progress) + (Math.random() * 0.05 - 0.025));
        const dfl = Math.max(0.58, 1.3 - 0.68 * Math.sqrt(progress) + (Math.random() * 0.03 - 0.015));
        const map = Math.min(0.92, 0.35 + 0.54 * (1 - Math.exp(-progress * 4.2)) + (Math.random() * 0.02 - 0.01));

        setEpochLogs((prev) => [
          ...prev,
          {
            epoch: next,
            boxLoss: parseFloat(box.toFixed(3)),
            clsLoss: parseFloat(cls.toFixed(3)),
            dflLoss: parseFloat(dfl.toFixed(3)),
            mAP50: parseFloat(map.toFixed(3)),
          },
        ]);
      }, 350);
    } else if (currentEpoch >= maxEpochs) {
      setIsTraining(false);
    }
    return () => clearTimeout(timer);
  }, [isTraining, currentEpoch, maxEpochs]);

  // Restart training
  const handleResetTraining = () => {
    setIsTraining(false);
    setCurrentEpoch(0);
    setEpochLogs([]);
  };

  // Generate synthetic config.yaml string
  const configYamlStr = `# Model configuration (Appendix: Model Configuration)
model:
  weights: ${selectedWeights}
  imgsz: ${config.model.imgsz}
  conf: ${config.model.conf.toFixed(2)}
  iou: ${config.model.iou.toFixed(2)}
  device: ${selectedDevice === 'CPU' ? '"cpu"' : 'null'}
  classes: [${config.model.classes.join(', ')}]

tracking:
  enabled: ${config.tracking.enabled}
  tracker: ${config.tracking.tracker}

preprocess:
  max_side: ${config.preprocess.max_side}
  frame_stride: ${config.preprocess.frame_stride}
  low_light_enhance: ${config.preprocess.low_light_enhance}

output:
  save_video: true
  show_window: false
  out_dir: outputs

# Training configuration (Appendix: dataset, epochs, batch size)
train:
  data: data/data.yaml
  epochs: ${maxEpochs}
  batch: ${batchSize}
  imgsz: 640
`;

  // Download config.yaml
  const handleDownloadConfig = () => {
    const blob = new Blob([configYamlStr], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.yaml';
    a.click();
  };

  const latestLog = epochLogs[epochLogs.length - 1];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Model Training & YAML Configuration</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Hyperparameter tuning, dataset mapping (data/data.yaml), and fine-tuning simulator (train.py)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadConfig}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center space-x-1.5 border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Download config.yaml</span>
          </button>
        </div>
      </div>

      {/* Grid: Hyperparameters & Training Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Hyperparameters form (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Training Hyperparameters</span>
          </h3>

          <div className="space-y-3 text-xs">
            {/* Weights */}
            <div>
              <label className="text-slate-400 block mb-1">Pretrained Weights</label>
              <select
                value={selectedWeights}
                onChange={(e) => setSelectedWeights(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="yolo11n.pt">yolo11n.pt (Nano - 2.6M params, Fast)</option>
                <option value="yolo11s.pt">yolo11s.pt (Small - 9.4M params)</option>
                <option value="yolo11m.pt">yolo11m.pt (Medium - 20.1M params)</option>
                <option value="best.pt">runs/detect/train/weights/best.pt</option>
              </select>
            </div>

            {/* Epochs */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Epochs</span>
                <span className="font-mono text-blue-400 font-semibold">{maxEpochs}</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={maxEpochs}
                onChange={(e) => setMaxEpochs(parseInt(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>

            {/* Batch Size */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Batch Size</span>
                <span className="font-mono text-blue-400 font-semibold">{batchSize}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[8, 16, 32, 64].map((b) => (
                  <button
                    key={b}
                    onClick={() => setBatchSize(b)}
                    className={`py-1.5 rounded font-mono border transition ${
                      batchSize === b
                        ? 'bg-blue-600 text-white border-blue-500 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Device */}
            <div>
              <label className="text-slate-400 block mb-1">Compute Device</label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="CUDA GPU 0 (Auto)">Auto (CUDA GPU 0 if available)</option>
                <option value="CPU">CPU Only</option>
                <option value="MPS">Apple Silicon MPS</option>
              </select>
            </div>

            {/* Tracker */}
            <div>
              <label className="text-slate-400 block mb-1">Tracking Algorithm</label>
              <select
                value={config.tracking.tracker}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    tracking: { ...config.tracking, tracker: e.target.value as any },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="bytetrack.yaml">ByteTrack (bytetrack.yaml)</option>
                <option value="botsort.yaml">BoT-SORT (botsort.yaml)</option>
              </select>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex items-center space-x-2">
            <button
              onClick={() => setIsTraining(!isTraining)}
              className={`flex-1 py-2 rounded-lg font-medium text-xs flex items-center justify-center space-x-1.5 shadow transition ${
                isTraining
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isTraining ? (
                <>
                  <span>Pause Training</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>{currentEpoch > 0 ? 'Resume' : 'Start Fine-Tuning (train.py)'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetTraining}
              title="Reset training"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Live Training Telemetry & Loss Curves (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Ultralytics Training Telemetry</h3>
              <p className="text-xs text-slate-400">
                Live epoch loss convergence: CIoU box loss, classification loss, DFL loss & mAP@50
              </p>
            </div>
            <div className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
              Epoch {currentEpoch} / {maxEpochs}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${(currentEpoch / maxEpochs) * 100}%` }}
            />
          </div>

          {/* Latest Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">box_loss (CIoU)</span>
              <span className="text-amber-400 font-bold text-sm">
                {latestLog ? latestLog.boxLoss.toFixed(3) : '1.600'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">cls_loss (BCE)</span>
              <span className="text-purple-400 font-bold text-sm">
                {latestLog ? latestLog.clsLoss.toFixed(3) : '2.150'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">dfl_loss</span>
              <span className="text-blue-400 font-bold text-sm">
                {latestLog ? latestLog.dflLoss.toFixed(3) : '1.280'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">val/mAP50</span>
              <span className="text-emerald-400 font-bold text-sm">
                {latestLog ? `${(latestLog.mAP50 * 100).toFixed(1)}%` : '35.0%'}
              </span>
            </div>
          </div>

          {/* Simulated Epoch Curves Visualizer */}
          <div className="h-44 bg-slate-950 rounded-lg p-3 border border-slate-800 relative flex items-end">
            {epochLogs.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-500 italic">
                <span>Click "Start Fine-Tuning" to simulate YOLO training across epochs</span>
                <span className="text-[11px] text-slate-600 mt-1 font-mono">
                  python train.py --epochs {maxEpochs} --batch {batchSize}
                </span>
              </div>
            ) : (
              <div className="w-full h-full flex items-end space-x-1">
                {epochLogs.map((log) => {
                  const mapHeightPct = Math.max(8, log.mAP50 * 95);
                  return (
                    <div key={log.epoch} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      <div
                        className="w-full rounded-t bg-emerald-500 group-hover:bg-emerald-400 transition"
                        style={{ height: `${mapHeightPct}%` }}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                        <div className="bg-slate-950 text-white text-[10px] font-mono py-1 px-2 rounded border border-slate-700 shadow-xl whitespace-nowrap">
                          <div>Epoch: {log.epoch}</div>
                          <div className="text-emerald-400">mAP50: {(log.mAP50 * 100).toFixed(1)}%</div>
                          <div className="text-amber-400">Box Loss: {log.boxLoss}</div>
                          <div className="text-purple-400">Cls Loss: {log.clsLoss}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-500">
            <span>Epoch 1 (Pretrained Base)</span>
            <span className="text-emerald-400">Green Bars: Validation mAP@50 Convergence</span>
            <span>Epoch {maxEpochs} (Converged)</span>
          </div>
        </div>
      </div>

      {/* Dataset & Config Files Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* config.yaml */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-200 font-mono">config.yaml</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Appendix: Configuration</span>
          </div>
          <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-64">
            {configYamlStr}
          </pre>
        </div>

        {/* data/data.yaml */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200 font-mono">data/data.yaml</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Dataset Specification</span>
          </div>
          <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-64">
{`# Dataset template for custom training (Appendix: Dataset)
path: data/traffic          # dataset root
train: images/train
val: images/val
test: images/test

names:
  0: car
  1: motorcycle
  2: bus
  3: truck
  4: pedestrian
  5: traffic_sign
`}
          </pre>
        </div>
      </div>
    </div>
  );
};
