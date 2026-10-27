import React, { useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Download, 
  FileText, 
  Gauge, 
  Grid, 
  Sliders, 
  TrendingUp, 
  Zap 
} from 'lucide-react';
import { ClassEvaluationMetric, EvaluationReport } from '../types/traffic';
import { getClassColorHex } from '../utils/colors';

const DEFAULT_EVAL_REPORT: EvaluationReport = {
  map50: 0.8842,
  map50_95: 0.642,
  precision: 0.871,
  recall: 0.8195,
  speed: {
    preprocess_ms: 1.4,
    inference_ms: 14.8,
    postprocess_ms: 1.2,
    total_ms: 17.4,
  },
  classMetrics: [
    { className: 'car', precision: 0.924, recall: 0.891, map50: 0.945, map50_95: 0.728 },
    { className: 'truck', precision: 0.881, recall: 0.842, map50: 0.902, map50_95: 0.684 },
    { className: 'bus', precision: 0.895, recall: 0.864, map50: 0.918, map50_95: 0.701 },
    { className: 'motorcycle', precision: 0.843, recall: 0.792, map50: 0.852, map50_95: 0.589 },
    { className: 'pedestrian', precision: 0.852, recall: 0.774, map50: 0.838, map50_95: 0.542 },
    { className: 'bicycle', precision: 0.828, recall: 0.761, map50: 0.812, map50_95: 0.518 },
    { className: 'traffic_sign', precision: 0.876, recall: 0.815, map50: 0.884, map50_95: 0.672 },
    { className: 'traffic_light', precision: 0.869, recall: 0.817, map50: 0.879, map50_95: 0.658 },
  ],
  confusionMatrix: {
    labels: ['car', 'truck', 'bus', 'moto', 'ped', 'sign'],
    matrix: [
      [0.91, 0.04, 0.02, 0.01, 0.01, 0.01],
      [0.05, 0.86, 0.07, 0.01, 0.00, 0.01],
      [0.03, 0.06, 0.89, 0.01, 0.00, 0.01],
      [0.02, 0.01, 0.01, 0.84, 0.08, 0.04],
      [0.01, 0.00, 0.00, 0.09, 0.86, 0.04],
      [0.01, 0.01, 0.01, 0.03, 0.03, 0.91],
    ],
  },
};

export const EvaluationTab: React.FC = () => {
  const [report, setReport] = useState<EvaluationReport>(DEFAULT_EVAL_REPORT);
  const [split, setSplit] = useState<'val' | 'test'>('val');
  const [activeCurveClass, setActiveCurveClass] = useState<string>('car');

  // Export class_metrics.csv matching evaluate.py
  const handleExportCSV = () => {
    const headers = 'class,precision,recall,mAP50,mAP50-95\n';
    const lines = report.classMetrics.map(
      (m) => `${m.className},${m.precision.toFixed(4)},${m.recall.toFixed(4)},${m.map50.toFixed(4)},${m.map50_95.toFixed(4)}`
    );
    const blob = new Blob([headers + lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'class_metrics.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Model Evaluation Suite</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              python evaluate.py --split {split}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Validation benchmark metrics on the traffic dataset: mAP, precision, recall, latency & confusion matrix
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setSplit('val')}
              className={`px-3 py-1 rounded transition ${
                split === 'val' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              val split
            </button>
            <button
              onClick={() => setSplit('test')}
              className={`px-3 py-1 rounded transition ${
                split === 'test' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              test split
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center space-x-2 shadow transition"
          >
            <Download className="w-4 h-4" />
            <span>class_metrics.csv</span>
          </button>
        </div>
      </div>

      {/* Global Evaluation Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* mAP@50 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>mAP @ 0.50</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {(report.map50 * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Score: {report.map50.toFixed(4)}
          </div>
        </div>

        {/* mAP@50-95 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>mAP @ 0.50:0.95</span>
            <Gauge className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">
            {(report.map50_95 * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            COCO primary benchmark
          </div>
        </div>

        {/* Mean Precision */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Mean Precision (P)</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">
            {(report.precision * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Low false positives
          </div>
        </div>

        {/* Mean Recall */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Mean Recall (R)</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {(report.recall * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Low missed objects
          </div>
        </div>
      </div>

      {/* Latency Speed Profile (from evaluate.py Speed dictionary) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-200 font-mono">
            Speed Profile (ms/img) — Total: {report.speed.total_ms} ms ({(1000 / report.speed.total_ms).toFixed(1)} FPS)
          </h3>
          <span className="text-xs text-slate-500 font-mono">YOLOv11 Inference Benchmarking</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400 mb-1">1. Preprocess</div>
            <div className="text-lg font-bold font-mono text-amber-400">
              {report.speed.preprocess_ms} ms
            </div>
            <div className="text-[10px] text-slate-500">Letterbox, Normalisation, CLAHE</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400 mb-1">2. YOLO Forward Pass</div>
            <div className="text-lg font-bold font-mono text-blue-400">
              {report.speed.inference_ms} ms
            </div>
            <div className="text-[10px] text-slate-500">Backbone + C3k2 + SPPF layers</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400 mb-1">3. Postprocess & NMS</div>
            <div className="text-lg font-bold font-mono text-emerald-400">
              {report.speed.postprocess_ms} ms
            </div>
            <div className="text-[10px] text-slate-500">Decoupled head + Non-Max Suppression</div>
          </div>
        </div>
      </div>

      {/* Per-Class Evaluation Table & Confusion Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Metrics Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Per-Class Accuracy Metrics</h3>
            <span className="text-xs font-mono text-slate-500">class_metrics.csv</span>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">Class</th>
                  <th className="px-3 py-2.5">Precision</th>
                  <th className="px-3 py-2.5">Recall</th>
                  <th className="px-3 py-2.5">mAP@50</th>
                  <th className="px-3 py-2.5">mAP@50-95</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {report.classMetrics.map((m) => (
                  <tr key={m.className} className="hover:bg-slate-800/40 transition">
                    <td className="px-3 py-2 font-semibold text-slate-200 flex items-center space-x-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getClassColorHex(m.className) }}
                      />
                      <span className="capitalize">{m.className.replace('_', ' ')}</span>
                    </td>
                    <td className="px-3 py-2 text-purple-400">{(m.precision * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2 text-amber-400">{(m.recall * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2 text-emerald-400 font-bold">{(m.map50 * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2 text-blue-400 font-bold">{(m.map50_95 * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Normalized Confusion Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Confusion Matrix</h3>
              <p className="text-xs text-slate-400">Predicted classes vs ground truth labels</p>
            </div>
            <span className="text-xs font-mono text-slate-500">Normalized [0 - 1.0]</span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[320px]">
              {/* Matrix Header */}
              <div className="grid grid-cols-7 gap-1 text-[11px] font-mono text-slate-400 text-center mb-1">
                <span className="text-left pl-2 text-slate-500">True \ Pred</span>
                {report.confusionMatrix.labels.map((l) => (
                  <span key={l} className="uppercase font-semibold truncate">{l}</span>
                ))}
              </div>

              {/* Rows */}
              {report.confusionMatrix.matrix.map((row, rIdx) => {
                const rowLabel = report.confusionMatrix.labels[rIdx];
                return (
                  <div key={rowLabel} className="grid grid-cols-7 gap-1 items-center mb-1">
                    <span className="text-[11px] font-mono font-semibold uppercase text-slate-400 truncate pl-2">
                      {rowLabel}
                    </span>
                    {row.map((val, cIdx) => {
                      const isDiagonal = rIdx === cIdx;
                      const intensity = Math.round(val * 100);
                      const bgOpacity = Math.max(0.1, val);
                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          className={`h-9 rounded flex items-center justify-center font-mono text-xs font-semibold border transition ${
                            isDiagonal
                              ? 'border-blue-500/50 text-white'
                              : 'border-slate-800 text-slate-400'
                          }`}
                          style={{
                            backgroundColor: isDiagonal
                              ? `rgba(37, 99, 235, ${bgOpacity})`
                              : `rgba(15, 23, 42, ${bgOpacity})`,
                          }}
                        >
                          {val.toFixed(2)}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-mono text-right">
            High diagonal values indicate robust inter-class discrimination
          </div>
        </div>
      </div>
    </div>
  );
};
