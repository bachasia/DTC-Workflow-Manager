
import React, { useState } from 'react';
import { Staff, Task, Role } from '../types';
import { generateAnalyticalReport, AnalyticalReport } from '../services/geminiService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Send, Copy, Sparkles, CheckCircle, Loader2,
  AlertTriangle, FileText, Target, Activity,
  PieChart as PieIcon, BarChart3, TrendingUp,
  Lightbulb, ListTodo
} from 'lucide-react';

interface DailyReporterProps {
  staffList: Staff[];
  tasks: Task[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const DailyReporter: React.FC<DailyReporterProps> = ({ staffList, tasks }) => {
  const [selectedStaff, setSelectedStaff] = useState<Staff>(staffList[1]);
  const [reportData, setReportData] = useState<AnalyticalReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateAnalyticalReport(selectedStaff, tasks);
      setReportData(data);
    } catch (e) {
      alert("Failed to generate analytical report. Please check API settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (reportData?.narrativeSummary) {
      navigator.clipboard.writeText(reportData.narrativeSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const staffTasks = tasks.filter(t => t.assignedTo === selectedStaff.id);
  const hasBlockers = staffTasks.some(t => t.status === 'BLOCKER');

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">AI Operations Analytics</h2>
          <p className="text-slate-500">Metric-driven performance analysis for Team DTC store operations.</p>
        </div>
        <div className="flex gap-2">
          {hasBlockers && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold shadow-sm">
              <AlertTriangle size={16} />
              Blocked Tasks Present
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Sidebar Selection */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <label className="block text-sm font-bold text-slate-700">Select Member</label>
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {staffList.filter(s => s.role !== Role.MANAGER).map(staff => (
                <button
                  key={staff.id}
                  onClick={() => setSelectedStaff(staff)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border ${selectedStaff.id === staff.id
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                    }`}
                >
                  <img src={staff.avatar} className="w-9 h-9 rounded-full border border-white/20" />
                  <div className="text-left overflow-hidden">
                    <p className="text-sm font-bold truncate">{staff.role} [{staff.name}]</p>
                    <p className={`text-[10px] uppercase font-semibold ${selectedStaff.id === staff.id ? 'text-blue-100' : 'text-slate-400'}`}>
                      {staff.role}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              Run Full Analysis
            </button>
          </div>

          {reportData && (
            <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100 animate-in slide-in-from-left-4">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={20} className="text-indigo-200" />
                <h3 className="text-sm font-bold">Management Insight</h3>
              </div>
              <p className="text-xs text-indigo-100 leading-relaxed italic">
                "{reportData.managementInsight}"
              </p>
            </div>
          )}
        </div>

        {/* Analytics Hub */}
        <div className="xl:col-span-3 space-y-8">
          {reportData ? (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              {/* High Level Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">Productivity</p>
                    <Target size={18} className="text-blue-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-bold text-slate-900">{reportData.productivityScore}</h3>
                    <span className="text-slate-400 text-sm">/100</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${reportData.productivityScore}%` }} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">Pending Tasks</p>
                    <ListTodo size={18} className="text-orange-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-bold text-slate-900">{reportData.pendingTasksCount}</h3>
                    <span className="text-slate-400 text-xs font-bold uppercase ml-1">Items</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-4">Active tasks remaining</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">Completion Rate</p>
                    <Activity size={18} className="text-green-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-bold text-slate-900">{reportData.completionRate}%</h3>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-4">Goal attainment today</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">Task Velocity</p>
                    <TrendingUp size={18} className="text-purple-500" />
                  </div>
                  <h3 className="text-4xl font-bold text-slate-900">High</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-4">Output rate efficiency</p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <PieIcon size={18} className="text-indigo-500" />
                    Brand Contribution Analysis
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.brandFocus}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="brand"
                        >
                          {reportData.brandFocus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {reportData.brandFocus.map((entry, index) => (
                      <div key={entry.brand} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase">{entry.brand}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <BarChart3 size={18} className="text-orange-500" />
                    Priority Distribution
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.priorityMix}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="priority" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} hide />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-center text-slate-400 font-bold uppercase mt-4">Tasks by assigned priority level</p>
                </div>
              </div>

              {/* Telegram Preview Side-by-Side */}
              <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
                <div className="px-8 py-5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send size={18} className="text-blue-400" />
                    <span className="text-white text-sm font-bold">Copy-Paste Telegram Summary</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-all flex items-center gap-2"
                  >
                    {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                </div>
                <div className="p-8">
                  <div className="bg-slate-800 p-6 rounded-2xl font-mono text-blue-100 text-xs whitespace-pre-wrap leading-relaxed max-w-2xl mx-auto shadow-inner border border-slate-700">
                    {reportData.narrativeSummary}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[600px] bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
                <BarChart3 size={48} className="text-slate-200" />
              </div>
              <div className="max-w-sm">
                <h3 className="text-lg font-bold text-slate-800">No Analysis Data</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Select a team member and click <strong>"Run Full Analysis"</strong> to generate metric charts and detailed work reports.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyReporter;
