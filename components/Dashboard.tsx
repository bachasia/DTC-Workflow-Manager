
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Task, TaskStatus, Role, Staff } from '../types';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ClipboardCheck,
  ShieldAlert,
  ChevronRight,
  Target,
  BarChart3,
  Calendar
} from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  staffList: Staff[];
}

type FilterType = 'all' | TaskStatus.DONE | TaskStatus.IN_PROGRESS | TaskStatus.OVERDUE;

const Dashboard: React.FC<DashboardProps> = ({ tasks, staffList }) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterType | null>(null);

  const stats = [
    { id: 'all', label: 'Total Tasks', value: tasks.length, icon: ClipboardCheck, color: 'blue' },
    { id: TaskStatus.DONE, label: 'Completed', value: tasks.filter(t => t.status === TaskStatus.DONE).length, icon: CheckCircle2, color: 'green' },
    { id: TaskStatus.IN_PROGRESS, label: 'In Progress', value: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, icon: TrendingUp, color: 'orange' },
    { id: TaskStatus.OVERDUE, label: 'Overdue', value: tasks.filter(t => t.status === TaskStatus.OVERDUE).length, icon: AlertCircle, color: 'red' },
  ];

  const avgProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (!selectedFilter) return [];
    if (selectedFilter === 'all') return tasks;
    return tasks.filter(t => t.status === selectedFilter);
  }, [tasks, selectedFilter]);

  // Prepare chart data
  const roleData = [
    { name: 'Designer', value: tasks.filter(t => t.role === Role.DESIGNER).length },
    { name: 'Seller', value: tasks.filter(t => t.role === Role.SELLER).length },
    { name: 'CS', value: tasks.filter(t => t.role === Role.CS).length },
  ];

  const getStatColorClass = (color: string, isActive: boolean) => {
    if (!isActive) {
      switch (color) {
        case 'blue': return 'bg-blue-50 text-blue-600';
        case 'green': return 'bg-green-50 text-green-600';
        case 'orange': return 'bg-orange-50 text-orange-600';
        case 'red': return 'bg-red-50 text-red-600';
        default: return 'bg-slate-50 text-slate-600';
      }
    }
    switch (color) {
      case 'blue': return 'bg-blue-600 text-white';
      case 'green': return 'bg-green-600 text-white';
      case 'orange': return 'bg-orange-600 text-white';
      case 'red': return 'bg-red-600 text-white';
      default: return 'bg-slate-900 text-white';
    }
  };

  const getPriorityCount = (p: string) => tasks.filter(t => t.priority === p).length;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Team DTC Performance</h1>
          <p className="text-slate-500">Real-time overview of current campaigns and store operations.</p>
        </div>

        <div className="flex items-center gap-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Target size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Avg. Progress</p>
              <p className="text-lg font-bold text-slate-900">{avgProgress}%</p>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-100"></div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded">High: {getPriorityCount('High')}</span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">Med: {getPriorityCount('Medium')}</span>
            <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded">Low: {getPriorityCount('Low')}</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const isActive = selectedFilter === stat.id;
          return (
            <button
              key={stat.id}
              onClick={() => setSelectedFilter(isActive ? null : stat.id as FilterType)}
              className={`bg-white p-6 rounded-2xl border transition-all flex items-center justify-between text-left group ${isActive
                ? 'border-blue-500 shadow-lg shadow-blue-100 ring-2 ring-blue-500/20'
                : 'border-slate-200 shadow-sm hover:border-slate-300 hover:translate-y-[-2px]'
                }`}
            >
              <div>
                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                  <ChevronRight size={14} className={`transition-transform ${isActive ? 'rotate-90 text-blue-500' : 'text-slate-300'}`} />
                </div>
              </div>
              <div className={`p-3 rounded-xl transition-colors ${getStatColorClass(stat.color, isActive)}`}>
                <stat.icon size={24} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Conditional Detail List Section */}
      {selectedFilter && (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-xl shadow-blue-50 overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2">
              <BarChart3 size={16} />
              Detailed Breakdown: {stats.find(s => s.id === selectedFilter)?.label}
            </h3>
            <button
              onClick={() => setSelectedFilter(null)}
              className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase"
            >
              Close Details
            </button>
          </div>
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic">No tasks found in this category.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <th className="px-6 py-3">Task Details</th>
                    <th className="px-6 py-3">Assignee</th>
                    <th className="px-6 py-3">Deadline</th>
                    <th className="px-6 py-3 text-right">Status & Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTasks.map(task => {
                    const staff = staffList.find(s => s.id === task.assignedTo);
                    return (
                      <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{task.title}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-medium">{task.role}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <img src={staff?.avatar} className="w-6 h-6 rounded-full" />
                            <span className="text-xs font-semibold text-slate-600">{staff?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Calendar size={12} />
                            <span className="text-xs">{new Date(task.deadline).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex flex-col items-end">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase mb-1.5 ${task.status === TaskStatus.DONE ? 'bg-green-100 text-green-700' :
                              task.status === TaskStatus.BLOCKER ? 'bg-orange-100 text-orange-700' :
                                task.status === TaskStatus.OVERDUE ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                              {task.status.replace('_', ' ')}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-slate-100 h-1 rounded-full">
                                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${task.progress}%` }}></div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-700">{task.progress}%</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task Distribution */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            Task Load by Department
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Members Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-500" />
            Staff Performance
          </h3>
          <div className="space-y-5 flex-1 overflow-y-auto custom-scrollbar pr-1">
            {staffList.filter(s => s.role !== Role.MANAGER).map(staff => {
              const staffTasks = tasks.filter(t => t.assignedTo === staff.id);
              const done = staffTasks.filter(t => t.status === TaskStatus.DONE).length;
              const progress = staffTasks.length ? (done / staffTasks.length) * 100 : 0;

              return (
                <div key={staff.id} className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <img src={staff.avatar} className="w-8 h-8 rounded-full border border-slate-100 shadow-sm" alt={staff.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800 truncate">{staff.name}</p>
                        <span className="text-[10px] font-bold text-slate-400">{done}/{staffTasks.length} tasks</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-50">
            <p className="text-[10px] text-slate-400 font-bold uppercase text-center">Data updates automatically</p>
          </div>
        </div>
      </div>

      {/* Recent Activity / Urgent Tasks */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800">Priority Tasks & Issues</h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active High Priority</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="pb-4 font-bold">Task</th>
                <th className="pb-4 font-bold">Owner</th>
                <th className="pb-4 font-bold">Status</th>
                <th className="pb-4 font-bold">Deadline</th>
                <th className="pb-4 font-bold text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tasks.filter(t => (t.priority === 'High' || t.status === TaskStatus.BLOCKER) && t.status !== TaskStatus.DONE).slice(0, 5).map(task => {
                const staff = staffList.find(s => s.id === task.assignedTo);
                return (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-4 font-medium text-slate-800">
                      <div className="flex flex-col">
                        <span className="font-bold">{task.title}</span>
                        {task.status === TaskStatus.BLOCKER && (
                          <span className="text-[10px] text-orange-600 font-bold uppercase flex items-center gap-1 mt-0.5">
                            <ShieldAlert size={10} /> Blocked: {task.blockerReason || 'Unspecified'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <img src={staff?.avatar} className="w-6 h-6 rounded-full" />
                        <span className="text-xs font-medium text-slate-600">{staff?.name}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase ${task.status === TaskStatus.BLOCKER ? 'bg-orange-100 text-orange-600' : 'bg-red-50 text-red-600'
                        }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-xs text-slate-500">
                      {new Date(task.deadline).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      <span className={`text-sm font-bold ${task.status === TaskStatus.BLOCKER ? 'text-orange-500' : 'text-blue-600'}`}>{task.progress}%</span>
                    </td>
                  </tr>
                );
              })}
              {tasks.filter(t => (t.priority === 'High' || t.status === TaskStatus.BLOCKER) && t.status !== TaskStatus.DONE).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 italic">No urgent issues at the moment. Good job!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
