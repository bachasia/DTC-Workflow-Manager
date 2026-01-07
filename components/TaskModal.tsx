
import React, { useState } from 'react';
import { Task, TaskStatus, Staff, UpdateLog, Role } from '../types';
import { X, Calendar, User, AlignLeft, BarChart2, AlertCircle, History, Clock, UserPlus, MessageSquareWarning, MessageSquareText, Target, UserCheck } from 'lucide-react';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onUpdateTask: (updatedTask: Task, logs: UpdateLog[]) => void;
  staffMembers: Staff[];
  currentUser: Staff;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onUpdateTask, staffMembers, currentUser }) => {
  const [localTask, setLocalTask] = useState<Task>(task);
  const [logs, setLogs] = useState<UpdateLog[]>([]);
  const [currentDetails, setCurrentDetails] = useState<string>('');

  const isManager = currentUser.role === Role.MANAGER;
  const isAssignedToCurrent = currentUser.id === localTask.assignedTo;
  const canEditMainFields = isManager;
  const canUpdateProgress = isManager || isAssignedToCurrent;

  const staff = staffMembers.find(s => s.id === localTask.assignedTo);
  const potentialAssignees = staffMembers.filter(s => s.role === localTask.role);

  const addLog = (field: string, oldVal: string, newVal: string, details?: string) => {
    const newLog: UpdateLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      field,
      oldValue: oldVal,
      newValue: newVal,
      details: details || currentDetails || undefined
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    addLog('Status', localTask.status, newStatus);
    setLocalTask(prev => ({
      ...prev,
      status: newStatus,
      progress: newStatus === TaskStatus.DONE ? 100 : prev.progress,
    }));
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStaffId = e.target.value;
    const oldStaffName = staff?.name || 'Unknown';
    const newStaffName = staffMembers.find(s => s.id === newStaffId)?.name || 'Unknown';

    addLog('Assigned To', oldStaffName, newStaffName);
    setLocalTask(prev => ({
      ...prev,
      assignedTo: newStaffId
    }));
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const progress = parseInt(e.target.value);
    setLocalTask(prev => ({ ...prev, progress }));
  };

  const handleDeadlineExtension = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDeadline = new Date(e.target.value).toISOString();
    addLog('Deadline', localTask.deadline, newDeadline);
    setLocalTask(prev => ({ ...prev, deadline: newDeadline, status: prev.status === TaskStatus.OVERDUE ? TaskStatus.IN_PROGRESS : prev.status }));
  };

  const handleBlockerUpdate = (field: 'blockerReason' | 'blockerRelatedTo', value: string) => {
    setLocalTask(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const finalLogs = [...logs];

    if (localTask.progress !== task.progress) {
      finalLogs.push({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        field: 'Progress',
        oldValue: task.progress.toString(),
        newValue: localTask.progress.toString(),
        details: currentDetails || undefined
      });
    } else if (currentDetails) {
      finalLogs.push({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        field: 'Comment',
        oldValue: '-',
        newValue: 'Note Added',
        details: currentDetails
      });
    }

    try {
      await onUpdateTask(localTask, finalLogs);
      // Only close if update succeeds
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      // Modal stays open so user can see the error and retry
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${localTask.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
              {localTask.priority} Priority
            </span>
            {localTask.status === TaskStatus.BLOCKER && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700">
                <AlertCircle size={12} />
                Blocked
              </span>
            )}
            {localTask.status === TaskStatus.OVERDUE && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-600 text-white animate-pulse">
                <Clock size={12} />
                Overdue
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{localTask.title}</h2>
                <div className="flex flex-wrap items-center gap-4 text-slate-500 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>Created {new Date(localTask.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 bg-red-50 rounded text-red-600 font-bold">
                    <Clock size={14} />
                    <span>DL: {new Date(localTask.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              </section>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Target size={16} className="text-blue-500 flex-shrink-0" />
                  Mục đích (Purpose)
                </label>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-sm text-blue-900 font-medium leading-relaxed">
                  {localTask.purpose || "Chưa xác định mục đích cụ thể."}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <User size={16} className="text-slate-400 flex-shrink-0" />
                    Assigned To
                  </label>

                  {isManager ? (
                    <div className="relative group">
                      <select
                        value={localTask.assignedTo}
                        onChange={handleAssigneeChange}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none hover:border-blue-300 focus:ring-2 focus:ring-blue-500 appearance-none transition-all shadow-sm"
                      >
                        {potentialAssignees.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500 group-hover:scale-110 transition-transform">
                        <UserCheck size={18} />
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 px-1">Manager can reassign</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                      <img src={staff?.avatar} className="w-10 h-10 rounded-full ring-2 ring-white" alt={staff?.name} />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{staff?.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{staff?.role}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <AlertCircle size={16} className="text-slate-400 flex-shrink-0" />
                    Status
                  </label>
                  <select
                    disabled={!canUpdateProgress}
                    value={localTask.status}
                    onChange={handleStatusChange}
                    className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 outline-none transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    {Object.values(TaskStatus).map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {localTask.status === TaskStatus.BLOCKER && (
                <div className="p-5 bg-orange-50 border border-orange-200 rounded-2xl space-y-4 animate-in slide-in-from-top-2">
                  <h3 className="text-sm font-bold text-orange-800 flex items-center gap-2">
                    <MessageSquareWarning size={18} />
                    Blocker Details (Lý do Block)
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-orange-600 uppercase">Reason for blocker</label>
                      <textarea
                        disabled={!canUpdateProgress}
                        value={localTask.blockerReason || ''}
                        onChange={(e) => handleBlockerUpdate('blockerReason', e.target.value)}
                        placeholder="Why is this task stuck?"
                        className="w-full p-3 bg-white border border-orange-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-orange-400 min-h-[80px] disabled:bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-orange-600 uppercase flex items-center gap-1">
                        <UserPlus size={12} /> Related Person (Người liên quan)
                      </label>
                      <input
                        disabled={!canUpdateProgress}
                        type="text"
                        value={localTask.blockerRelatedTo || ''}
                        onChange={(e) => handleBlockerUpdate('blockerRelatedTo', e.target.value)}
                        placeholder="Name of the person involved..."
                        className="w-full p-3 bg-white border border-orange-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <AlignLeft size={16} className="text-slate-400 flex-shrink-0" />
                  Description
                </label>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                  "{localTask.description}"
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Calendar size={16} className="text-slate-400" />
                    Extend Deadline (Gia hạn)
                  </label>
                  <input
                    disabled={!canEditMainFields}
                    type="date"
                    value={localTask.deadline.split('T')[0]}
                    onChange={handleDeadlineExtension}
                    className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <BarChart2 size={16} className="text-slate-400" />
                      Progress
                    </label>
                    <span className="text-sm font-bold text-blue-600">{localTask.progress}%</span>
                  </div>
                  <input
                    disabled={!canUpdateProgress}
                    type="range"
                    min="0"
                    max="100"
                    value={localTask.progress}
                    onChange={handleProgressChange}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-3 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <MessageSquareText size={16} className="text-blue-500" />
                  Chi tiết tiến độ / Khó khăn (Progress Details / Difficulties)
                </label>
                <textarea
                  disabled={!canUpdateProgress}
                  value={currentDetails}
                  onChange={(e) => setCurrentDetails(e.target.value)}
                  placeholder="Cập nhật chi tiết những gì đã làm hoặc khó khăn đang gặp phải..."
                  className="w-full p-4 bg-blue-50/30 border border-blue-100 rounded-2xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-400 min-h-[120px] shadow-inner transition-all placeholder:text-slate-400 disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* History Col */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-6 border border-slate-200 flex flex-col h-full min-h-[400px] shadow-sm">
              <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-5 text-sm pb-3 border-b border-slate-200">
                <History size={16} className="text-blue-500" />
                Update History
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-2" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 transparent'
              }}>
                {(localTask.history || []).length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <History size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No update history yet</p>
                  </div>
                ) : (
                  [...(localTask.history || [])].reverse().map((log, index) => (
                    <div key={log.id} className="relative pl-4 border-l-2 border-slate-300 pb-3 last:pb-0 hover:border-blue-400 transition-colors group">
                      <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white shadow-sm group-hover:scale-125 transition-transform"></div>
                      <p className="text-[10px] text-slate-400 mb-1.5 font-medium">{new Date(log.timestamp).toLocaleString()}</p>
                      <p className="text-xs font-bold text-slate-800 mb-1">{log.field === 'Comment' ? '💬 Note Added' : `📝 Changed ${log.field}`}</p>
                      <div className="text-[11px] text-slate-600 mb-2 font-medium">
                        <span className="text-red-600">{log.oldValue}</span> → <span className="text-green-600">{log.newValue}</span>
                      </div>
                      {log.details && (
                        <div className="mt-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                          <p className="text-[11px] text-slate-700 leading-relaxed">"{log.details}"</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/30">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-all text-sm">Cancel</button>
          {canUpdateProgress && (
            <button onClick={handleSave} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-sm">
              Save & Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
