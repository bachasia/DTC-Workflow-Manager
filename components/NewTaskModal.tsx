
import React, { useState, useEffect } from 'react';
import { Role, Staff, Task, TaskStatus } from '../types';
import { X, Calendar, User, AlignLeft, Flag, Target } from 'lucide-react';

interface NewTaskModalProps {
  onClose: () => void;
  onAdd: (task: Omit<Task, 'id' | 'createdAt' | 'history'>) => void;
  staffMembers: Staff[];
  initialRole?: Role;
}

const NewTaskModal: React.FC<NewTaskModalProps> = ({ onClose, onAdd, staffMembers, initialRole }) => {
  const [role, setRole] = useState<Role>(initialRole || Role.DESIGNER);
  // Filter valid staff for the selected role
  const filteredStaff = staffMembers.filter(s => s.role === role);

  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState(filteredStaff[0]?.id || '');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);

  // FIX: Reset assignee when role changes to prevent ID mismatch (Bug fix for CS Đào -> Designer Tư)
  useEffect(() => {
    const validStaffForRole = staffMembers.filter(s => s.role === role);
    if (validStaffForRole.length > 0) {
      setAssignedTo(validStaffForRole[0].id);
    } else {
      setAssignedTo('');
    }
  }, [role, staffMembers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert date-only string to ISO datetime with end of day time
    const deadlineDate = new Date(deadline + 'T23:59:59');

    onAdd({
      title,
      purpose,
      description,
      assignedTo,
      role,
      status: TaskStatus.TODO,
      priority,
      deadline: deadlineDate.toISOString(),
      progress: 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900">Create New Task</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-5 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Task Title</label>
            <input
              required
              autoComplete="off"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 placeholder-slate-400"
              placeholder="e.g. Design 10 shirts for Kozmozcyber"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Target size={14} className="text-blue-500" />
              Mục đích (Purpose)
            </label>
            <input
              required
              autoComplete="off"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 placeholder-slate-400"
              placeholder="Mục đích chính của công việc này là gì?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 text-slate-900 placeholder-slate-400"
              placeholder="Detailed instructions..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              >
                {Object.values(Role).filter(r => r !== Role.MANAGER).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Assign To</label>
              <select
                required
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              >
                {filteredStaff.length > 0 ? (
                  filteredStaff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))
                ) : (
                  <option value="">No staff available</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Deadline</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all text-sm">Cancel</button>
          <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-sm">Create Task</button>
        </div>
      </form>
    </div>
  );
};

export default NewTaskModal;
