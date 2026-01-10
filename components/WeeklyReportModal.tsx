import React, { useState, useEffect } from 'react';
import { X, Download, Printer, Calendar, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Staff } from '../types';
import { api } from '../src/services/api';

interface WeeklyReportModalProps {
    onClose: () => void;
    currentUser: Staff;
    staffMembers: Staff[];
}

interface ReportData {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    period: {
        start: string;
        end: string;
    };
    generatedAt: string;
    statistics: {
        totalTasks: number;
        completedCount: number;
        inProgressCount: number;
        overdueCount: number;
        blockedCount: number;
        avgProgress: number;
        completionRate: number;
    };
    tasks: {
        completed: any[];
        inProgress: any[];
        overdue: any[];
        blocked: any[];
    };
    recentUpdates: any[];
}

const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({ onClose, currentUser, staffMembers }) => {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<ReportData | null>(null);
    const [selectedUserId, setSelectedUserId] = useState(currentUser.id);
    const [startDate, setStartDate] = useState(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const isManager = currentUser.role === 'MANAGER';

    const fetchReport = async () => {
        setLoading(true);
        try {
            const filters: any = {
                startDate,
                endDate,
            };

            if (isManager && selectedUserId !== currentUser.id) {
                filters.userId = selectedUserId;
            }

            const response = await api.reports.weekly(filters);
            setReport(response.report);
        } catch (error) {
            console.error('Failed to fetch report:', error);
            alert('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        if (!report) return;

        const htmlContent = document.getElementById('report-content')?.innerHTML || '';
        const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Weekly Report - ${report.user.name}</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
              padding: 40px; 
              max-width: 1200px; 
              margin: 0 auto;
              background: #ffffff;
              color: #1e293b;
              line-height: 1.6;
            }
            h1 { 
              color: #0f172a; 
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            h2 { 
              color: #334155; 
              font-size: 20px;
              font-weight: 700;
              margin-top: 32px;
              margin-bottom: 16px;
            }
            h3 {
              color: #0f172a;
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            
            /* Header Info */
            .flex { display: flex; }
            .items-center { align-items: center; }
            .gap-2 { gap: 8px; }
            .gap-4 { gap: 16px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .mb-8 { margin-bottom: 32px; }
            .text-sm { font-size: 14px; }
            .text-xs { font-size: 12px; }
            .text-slate-600 { color: #475569; }
            .text-slate-500 { color: #64748b; }
            
            /* Statistics Grid */
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .gap-4 { gap: 16px; }
            
            @media (min-width: 768px) {
              .md\\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
            }
            
            .p-4 { padding: 16px; }
            .rounded-2xl { border-radius: 16px; }
            .border { border-width: 1px; border-style: solid; }
            
            .bg-blue-50 { background-color: #eff6ff; }
            .border-blue-100 { border-color: #dbeafe; }
            .text-blue-600 { color: #2563eb; }
            
            .bg-green-50 { background-color: #f0fdf4; }
            .border-green-100 { border-color: #dcfce7; }
            .text-green-600 { color: #16a34a; }
            
            .bg-orange-50 { background-color: #fff7ed; }
            .border-orange-100 { border-color: #ffedd5; }
            .border-orange-200 { border-color: #fed7aa; }
            .text-orange-600 { color: #ea580c; }
            
            .bg-red-50 { background-color: #fef2f2; }
            .border-red-100 { border-color: #fee2e2; }
            .text-red-600 { color: #dc2626; }
            
            .text-3xl { font-size: 30px; line-height: 1; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .text-slate-900 { color: #0f172a; }
            .text-slate-800 { color: #1e293b; }
            .text-slate-700 { color: #334155; }
            .uppercase { text-transform: uppercase; }
            
            /* Tables */
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 16px 0; 
            }
            th, td { 
              padding: 12px; 
              text-align: left; 
              border-bottom: 1px solid #e2e8f0; 
            }
            th { 
              background: #f8fafc; 
              font-weight: 600; 
              color: #475569;
              font-size: 12px;
              text-transform: uppercase;
            }
            td {
              color: #334155;
            }
            .py-3 { padding-top: 12px; padding-bottom: 12px; }
            .border-t { border-top: 1px solid; }
            .border-slate-100 { border-color: #f1f5f9; }
            
            /* Progress Bar */
            .w-20 { width: 80px; }
            .bg-slate-100 { background-color: #f1f5f9; }
            .rounded-full { border-radius: 9999px; }
            .h-2 { height: 8px; }
            .bg-blue-600 { background-color: #2563eb; }
            
            /* Blocked Tasks */
            .space-y-3 > * + * { margin-top: 12px; }
            .rounded-xl { border-radius: 12px; }
            
            /* Icons - hide in export */
            svg { display: none; }
            
            @media print { 
              body { padding: 20px; } 
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `], { type: 'text/html' });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `weekly-report-${report.user.name}-${new Date().toISOString().split('T')[0]}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Weekly Progress Report</h2>
                        <p className="text-sm text-slate-500">Generate and export weekly task summary</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Controls */}
                <div className="px-8 py-4 border-b border-slate-100 bg-white print:hidden">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {isManager && (
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Team Member</label>
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                >
                                    {staffMembers.map((staff) => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.name} ({staff.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                onClick={fetchReport}
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                            >
                                {loading ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Report Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-slate-500">Generating report...</p>
                            </div>
                        </div>
                    ) : report ? (
                        <div id="report-content">
                            {/* Report Header */}
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">Weekly Progress Report</h1>
                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        <span>
                                            {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span>•</span>
                                    <span>{report.user.name} ({report.user.role})</span>
                                    <span>•</span>
                                    <span>Generated: {new Date(report.generatedAt).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Statistics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp size={20} className="text-blue-600" />
                                        <span className="text-xs font-bold text-blue-600 uppercase">Total Tasks</span>
                                    </div>
                                    <p className="text-3xl font-bold text-slate-900">{report.statistics.totalTasks}</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 size={20} className="text-green-600" />
                                        <span className="text-xs font-bold text-green-600 uppercase">Completed</span>
                                    </div>
                                    <p className="text-3xl font-bold text-slate-900">{report.statistics.completedCount}</p>
                                    <p className="text-xs text-green-600 font-semibold">{report.statistics.completionRate}% rate</p>
                                </div>
                                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock size={20} className="text-orange-600" />
                                        <span className="text-xs font-bold text-orange-600 uppercase">In Progress</span>
                                    </div>
                                    <p className="text-3xl font-bold text-slate-900">{report.statistics.inProgressCount}</p>
                                </div>
                                <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle size={20} className="text-red-600" />
                                        <span className="text-xs font-bold text-red-600 uppercase">Issues</span>
                                    </div>
                                    <p className="text-3xl font-bold text-slate-900">{report.statistics.overdueCount + report.statistics.blockedCount}</p>
                                </div>
                            </div>

                            {/* Completed Tasks */}
                            {report.tasks.completed.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-slate-900 mb-4">✅ Completed Tasks ({report.tasks.completed.length})</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="text-left text-xs font-bold text-slate-500 uppercase">
                                                    <th className="pb-3">Task</th>
                                                    <th className="pb-3">Purpose</th>
                                                    <th className="pb-3">Priority</th>
                                                    <th className="pb-3">Deadline</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.tasks.completed.map((task) => (
                                                    <tr key={task.id} className="border-t border-slate-100">
                                                        <td className="py-3 font-semibold text-slate-800">{task.title}</td>
                                                        <td className="py-3 text-sm text-slate-600">{task.purpose}</td>
                                                        <td className="py-3">
                                                            <span className={`text-sm font-bold ${task.priority === 'HIGH' ? 'text-red-600' :
                                                                task.priority === 'MEDIUM' ? 'text-blue-600' : 'text-slate-500'
                                                                }`}>
                                                                {task.priority}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-sm text-slate-600">{new Date(task.deadline).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* In Progress Tasks */}
                            {report.tasks.inProgress.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-slate-900 mb-4">🔄 In Progress ({report.tasks.inProgress.length})</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="text-left text-xs font-bold text-slate-500 uppercase">
                                                    <th className="pb-3">Task</th>
                                                    <th className="pb-3">Purpose</th>
                                                    <th className="pb-3">Progress</th>
                                                    <th className="pb-3">Deadline</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.tasks.inProgress.map((task) => (
                                                    <tr key={task.id} className="border-t border-slate-100">
                                                        <td className="py-3 font-semibold text-slate-800">{task.title}</td>
                                                        <td className="py-3 text-sm text-slate-600">{task.purpose}</td>
                                                        <td className="py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-20 bg-slate-100 rounded-full h-2">
                                                                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${task.progress}%` }}></div>
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-700">{task.progress}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 text-sm text-slate-600">{new Date(task.deadline).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Blocked Tasks */}
                            {report.tasks.blocked.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-slate-900 mb-4">🚫 Blocked Tasks ({report.tasks.blocked.length})</h2>
                                    <div className="space-y-3">
                                        {report.tasks.blocked.map((task) => (
                                            <div key={task.id} className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                                <h3 className="font-bold text-slate-900 mb-2">{task.title}</h3>
                                                <p className="text-sm text-slate-600 mb-2"><strong>Reason:</strong> {task.blockerReason || 'Not specified'}</p>
                                                {task.blockerRelatedTo && (
                                                    <p className="text-sm text-slate-600"><strong>Related to:</strong> {task.blockerRelatedTo}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-400">
                            <p>Click "Generate" to create a report</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {report && (
                    <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/30 print:hidden">
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-all text-sm"
                        >
                            <Download size={18} />
                            Download HTML
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-sm"
                        >
                            <Printer size={18} />
                            Print Report
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeeklyReportModal;
