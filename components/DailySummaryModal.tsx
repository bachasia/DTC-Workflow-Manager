
import React from 'react';
import { Task, Staff, Role, TaskStatus } from '../types';
import { X, Download, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface DailySummaryModalProps {
  tasks: Task[];
  staffMembers: Staff[];
  onClose: () => void;
}

const DailySummaryModal: React.FC<DailySummaryModalProps> = ({ tasks, staffMembers, onClose }) => {
  const today = new Date().toISOString().split('T')[0];
  const todaysTasks = tasks.filter(t => t.createdAt.startsWith(today) || t.history.some(h => h.timestamp.startsWith(today)));

  const handleExport = () => {
    // Enhanced headers to include Date, Blocker Reason, and Related Person
    const headers = ['Date', 'Task', 'Assignee', 'Status', 'Blocker Reason', 'Related Person', 'Progress', 'Priority'];

    const rows = todaysTasks.map(t => {
      const taskDate = new Date(t.createdAt).toLocaleDateString();
      const assigneeName = staffMembers.find(s => s.id === t.assignedTo)?.name || 'Unknown';

      return [
        `"${taskDate}"`,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${assigneeName.replace(/"/g, '""')}"`,
        t.status,
        `"${(t.blockerReason || '').replace(/"/g, '""')}"`,
        `"${(t.blockerRelatedTo || '').replace(/"/g, '""')}"`,
        `${t.progress}%`,
        t.priority
      ];
    });

    // Added UTF-8 BOM (\uFEFF) to fix Vietnamese characters in Excel
    const csvContent = "\uFEFF" + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DTC_Team_Report_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText size={24} className="text-blue-600" />
              Daily Activity Summary
            </h2>
            <p className="text-sm text-slate-500">Reviewing performance for {today}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-md"
            >
              <Download size={18} />
              Export CSV (Fix VN)
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-8">
            {staffMembers.filter(s => s.role !== Role.MANAGER).map(staff => {
              const staffTasksToday = todaysTasks.filter(t => t.assignedTo === staff.id);
              if (staffTasksToday.length === 0) return null;

              return (
                <div key={staff.id} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                    <img src={staff.avatar} className="w-8 h-8 rounded-full" />
                    <h3 className="font-bold text-slate-800">{staff.role} [{staff.name}]</h3>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold uppercase">{staff.role}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {staffTasksToday.map(task => (
                      <div key={task.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {task.status === TaskStatus.DONE ? (
                                <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                                  <CheckCircle size={10} /> Complete
                                </span>
                              ) : task.status === TaskStatus.OVERDUE ? (
                                <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                                  <AlertCircle size={10} /> Overdue
                                </span>
                              ) : task.status === TaskStatus.BLOCKER ? (
                                <span className="text-[10px] text-orange-600 font-bold flex items-center gap-1">
                                  <AlertCircle size={10} /> Blocked
                                </span>
                              ) : (
                                <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                                  <Clock size={10} /> {task.status.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-slate-900">{task.progress}%</p>
                            <div className="w-16 bg-slate-200 h-1 rounded-full mt-1 ml-auto">
                              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${task.progress}%` }} />
                            </div>
                          </div>
                        </div>

                        {task.status === TaskStatus.BLOCKER && task.blockerReason && (
                          <div className="bg-orange-50 border border-orange-100 p-2.5 rounded-xl">
                            <p className="text-[10px] font-bold text-orange-700 uppercase mb-1">Blocker Reason:</p>
                            <p className="text-xs text-slate-700 italic">"{task.blockerReason}"</p>
                            {task.blockerRelatedTo && (
                              <p className="text-[10px] text-orange-600 mt-1 font-semibold">Related: {task.blockerRelatedTo}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySummaryModal;
