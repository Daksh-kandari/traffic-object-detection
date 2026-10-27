import React, { useState } from 'react';
import { 
  BarChart2, 
  Calendar, 
  Clock, 
  Compass, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Layers, 
  Search, 
  TrendingUp, 
  Zap 
} from 'lucide-react';
import { TrafficAnalyticsTracker } from '../utils/analytics';
import { getClassColorHex } from '../utils/colors';

interface AnalyticsDashboardProps {
  analytics: TrafficAnalyticsTracker;
  onExportJSON: () => void;
  onExportCSV: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analytics,
  onExportJSON,
  onExportCSV,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const summary = analytics.summary();
  const rows = analytics.rows;

  // Calculate unique objects across all classes
  const totalUnique = Object.values(summary.unique_tracked_objects_per_class).reduce((a, b) => a + b, 0);

  // Filter rows for frame log table
  const filteredRows = rows.filter((r) => {
    if (!searchTerm) return true;
    return (
      r.frame.toString().includes(searchTerm) ||
      Object.keys(r).some((k) => k !== 'frame' && k !== 'total' && k !== 'inference_ms' && k.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Recent timeline data (last 40 frames)
  const recentTimeline = rows.slice(-40);
  const maxTimelineTotal = Math.max(1, ...recentTimeline.map((r) => r.total));

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            <span>Traffic Telemetry & Performance Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time counting, classification, and multi-object tracking statistics generated from pipeline frames
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onExportJSON}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg flex items-center space-x-2 shadow transition"
          >
            <FileText className="w-4 h-4" />
            <span>Export &lt;run&gt;_metrics.json</span>
          </button>
          <button
            onClick={onExportCSV}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center space-x-2 shadow transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export &lt;run&gt;_frames.csv</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Frames */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Frames Processed</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {summary.frames_processed.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            All decoded frames
          </div>
        </div>

        {/* Total Detections */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Detections</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {summary.total_detections.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Accumulated instances
          </div>
        </div>

        {/* Unique Tracked Objects */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Unique Tracked IDs</span>
            <Compass className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">
            {totalUnique}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            ByteTrack assigned
          </div>
        </div>

        {/* Average Latency */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Avg Inference</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {summary.avg_inference_ms.toFixed(1)} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            YOLO forward pass
          </div>
        </div>

        {/* Pipeline FPS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Inference Speed</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {summary.inference_fps.toFixed(1)} <span className="text-xs font-normal text-slate-400">FPS</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Real-time throughput
          </div>
        </div>
      </div>

      {/* Traffic Density Timeline & Class Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Traffic Density Timeline</h3>
              <p className="text-xs text-slate-400">Simultaneous detected objects across the last 40 processed frames</p>
            </div>
            <span className="text-xs font-mono text-slate-500">Live Telemetry</span>
          </div>

          <div className="h-44 flex items-end space-x-1.5 pt-4 pb-1 border-b border-slate-800">
            {recentTimeline.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 italic">
                Awaiting frames from pipeline...
              </div>
            ) : (
              recentTimeline.map((r, i) => {
                const heightPct = Math.max(8, (r.total / maxTimelineTotal) * 100);
                return (
                  <div
                    key={r.frame}
                    className="flex-1 flex flex-col items-center group relative h-full justify-end"
                  >
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-blue-600 to-indigo-400 group-hover:from-blue-500 group-hover:to-indigo-300 transition-all duration-150"
                      style={{ height: `${heightPct}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                      <div className="bg-slate-950 text-white text-[10px] font-mono py-1 px-2 rounded border border-slate-700 shadow-xl whitespace-nowrap">
                        <div>Frame #{r.frame}</div>
                        <div>Total Objects: {r.total}</div>
                        <div>Latency: {r.inference_ms}ms</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-500">
            <span>Earlier Frames</span>
            <span>Latest Frame #{recentTimeline[recentTimeline.length - 1]?.frame || 0}</span>
          </div>
        </div>

        {/* Per-Class Counts & Peak Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Class Breakdown</h3>
            <p className="text-xs text-slate-400">Total detections, unique IDs & peak concurrent</p>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {Object.keys(summary.detections_per_class).length === 0 ? (
              <div className="text-xs text-slate-500 italic py-6 text-center">
                No class detections recorded yet
              </div>
            ) : (
              Object.entries(summary.detections_per_class)
                .sort((a, b) => b[1] - a[1])
                .map(([cls, count]) => {
                  const unique = summary.unique_tracked_objects_per_class[cls] || 0;
                  const peak = summary.peak_simultaneous_per_class[cls] || 0;
                  const pct = Math.min(100, Math.round((count / summary.total_detections) * 100));

                  return (
                    <div key={cls} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: getClassColorHex(cls) }}
                          />
                          <span className="font-medium text-slate-200 capitalize">{cls}</span>
                        </div>
                        <div className="font-mono text-slate-300">
                          {count} <span className="text-[10px] text-slate-500">({pct}%)</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: getClassColorHex(cls),
                          }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Unique Tracked: <strong className="text-purple-400">{unique}</strong></span>
                        <span>Peak Concurrent: <strong className="text-amber-400">{peak}</strong></span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Frame-by-Frame Log Table (Matches <name>_frames.csv) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Frame Telemetry Log Table</span>
            </h3>
            <p className="text-xs text-slate-400">Direct tabular view of `{rows.length}` entries written to `&lt;stem&gt;_frames.csv`</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search frame number or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-3 py-2.5">Frame #</th>
                <th className="px-3 py-2.5">Total Objects</th>
                <th className="px-3 py-2.5">Inference (ms)</th>
                <th className="px-3 py-2.5">Car</th>
                <th className="px-3 py-2.5">Truck</th>
                <th className="px-3 py-2.5">Bus</th>
                <th className="px-3 py-2.5">Motorcycle</th>
                <th className="px-3 py-2.5">Person</th>
                <th className="px-3 py-2.5">Traffic Light</th>
                <th className="px-3 py-2.5">Stop Sign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-slate-500 italic">
                    No frames found
                  </td>
                </tr>
              ) : (
                filteredRows.slice(-30).reverse().map((r) => (
                  <tr key={r.frame} className="hover:bg-slate-800/40 transition">
                    <td className="px-3 py-2 text-blue-400 font-semibold">{r.frame}</td>
                    <td className="px-3 py-2 text-slate-100 font-bold">{r.total}</td>
                    <td className="px-3 py-2 text-amber-400">{r.inference_ms.toFixed(1)}</td>
                    <td className="px-3 py-2 text-slate-300">{r.car ?? 0}</td>
                    <td className="px-3 py-2 text-slate-300">{r.truck ?? 0}</td>
                    <td className="px-3 py-2 text-slate-300">{r.bus ?? 0}</td>
                    <td className="px-3 py-2 text-slate-300">{r.motorcycle ?? 0}</td>
                    <td className="px-3 py-2 text-slate-300">{r.person ?? 0}</td>
                    <td className="px-3 py-2 text-slate-300">{r['traffic light'] ?? 0}</td>
                    <td className="px-3 py-2 text-slate-300">{r['stop sign'] ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
