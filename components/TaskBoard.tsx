import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatus, Role, Staff } from '../types';
import { MoreVertical, Plus, Calendar, AlertCircle, GripVertical, FileText } from 'lucide-react';
import FilterBar from './FilterBar';

interface TaskBoardProps {
  role: Role;
  tasks: Task[];
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  staffMembers: Staff[];
  onTaskClick: (task: Task) => void;
  onNewTaskClick: (role: Role) => void;
  onReportClick: () => void;
  currentUser: Staff;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ role, tasks, onUpdateStatus, staffMembers, onTaskClick, onNewTaskClick, onReportClick, currentUser }) => {
  const isManager = currentUser.role === Role.MANAGER;
  const [draggedTaskId, setDraggedTaskId] = React.useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<TaskStatus | null>(null);

  // Filter states
  const [searchInput, setSearchInput] = useState(''); // Immediate input value
  const [searchQuery, setSearchQuery] = useState(''); // Debounced search value
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchInput]);

  const columns = [
    { title: 'To Do', status: TaskStatus.TODO, color: 'slate' },
    { title: 'In Progress', status: TaskStatus.IN_PROGRESS, color: 'blue' },
    { title: 'Overdue', status: TaskStatus.OVERDUE, color: 'red' },
    { title: 'Blocked', status: TaskStatus.BLOCKER, color: 'orange' },
    { title: 'Completed', status: TaskStatus.DONE, color: 'green' },
  ];

  // Filter tasks by role and filters
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(t => t.role === role);

    // Search filter (using debounced value)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.purpose.toLowerCase().includes(query)
      );
    }

    // Assignee filter
    if (selectedAssignee) {
      filtered = filtered.filter(t => t.assignedTo === selectedAssignee);
    }

    // Priority filter
    if (selectedPriority) {
      filtered = filtered.filter(t => t.priority === selectedPriority);
    }

    return filtered;
  }, [tasks, role, searchQuery, selectedAssignee, selectedPriority]);

  const roleTasks = filteredTasks;

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'orange': return 'bg-orange-500';
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  // Native HTML5 Drag Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    console.log('🎯 Drag started:', taskId);
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);

    // Make dragged element semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('🎯 Drag ended');
    setDraggedTaskId(null);
    setDragOverColumn(null);

    // Restore opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent, columnStatus: TaskStatus) => {
    e.preventDefault(); // Required to allow drop
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnStatus);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');

    console.log('✅ Dropped task:', taskId, 'to', targetStatus);

    if (taskId && draggedTaskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== targetStatus) {
        console.log('📝 Updating status:', task.status, '->', targetStatus);
        onUpdateStatus(taskId, targetStatus);
      }
    }

    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setSelectedAssignee(null);
    setSelectedPriority(null);
  };

  const activeFilterCount = [searchInput, selectedAssignee, selectedPriority].filter(Boolean).length;

  // Filter staff members by role
  const roleStaffMembers = staffMembers.filter(s => s.role === role);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{role} Workflow</h2>
          <p className="text-slate-500">Manage tasks and track production pipeline for {role} team.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onReportClick}
            className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-700 transition-colors shadow-lg shadow-slate-200"
          >
            <FileText size={20} />
            Report
          </button>
          {isManager && (
            <button
              onClick={() => onNewTaskClick(role)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              <Plus size={20} />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        selectedAssignee={selectedAssignee}
        onAssigneeChange={setSelectedAssignee}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        staffMembers={roleStaffMembers}
        onClearFilters={handleClearFilters}
        activeFilterCount={activeFilterCount}
      />

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {columns.map(column => {
          const columnTasks = roleTasks.filter(t => t.status === column.status);
          const isDropTarget = dragOverColumn === column.status;

          return (
            <div
              key={column.status}
              className="w-80 shrink-0 flex flex-col gap-4"
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(column.color)}`}></div>
                  <h3 className="font-bold text-slate-700">{column.title}</h3>
                  <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
                    {columnTasks.length}
                  </span>
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                  <MoreVertical size={18} />
                </button>
              </div>

              <div
                className={`flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1 min-h-[200px] p-2 rounded-xl transition-all ${isDropTarget ? 'bg-blue-50 ring-2 ring-blue-300' : ''
                  }`}
              >
                {columnTasks.map(task => {
                  const staff = staffMembers.find(s => s.id === task.assignedTo);
                  const canQuickChangeStatus = isManager || currentUser.id === task.assignedTo;
                  const isDragging = draggedTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group hover:shadow-md cursor-move ${isDragging ? 'opacity-50' : ''
                        }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-wrap gap-2 flex-1 min-w-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${task.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                            {task.priority}
                          </span>
                          {task.status === TaskStatus.BLOCKER && (
                            <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[10px] font-bold uppercase flex items-center gap-1 whitespace-nowrap">
                              <AlertCircle size={10} />
                              Blocked
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2 shrink-0">
                          <div className="p-1.5 text-slate-400 cursor-move" title="Drag to move">
                            <GripVertical size={16} />
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <select
                              disabled={!canQuickChangeStatus}
                              className="text-[10px] bg-slate-100 border border-slate-300 rounded p-1.5 outline-none font-bold text-slate-900 cursor-pointer hover:bg-slate-200 transition-colors shadow-sm disabled:opacity-50"
                              value={task.status}
                              onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                            >
                              {Object.values(TaskStatus).map(s => (
                                <option key={s} value={s}>{s.replace('_', ' ')}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div onClick={() => onTaskClick(task)} className="cursor-pointer">
                        <h4 className="font-bold text-slate-800 leading-tight mb-2 group-hover:text-blue-600 transition-colors">{task.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4">{task.description}</p>

                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center -space-x-2">
                            <img
                              src={staff?.avatar}
                              className="w-7 h-7 rounded-full border-2 border-white ring-1 ring-slate-100 shadow-sm"
                              title={staff?.name}
                              alt={staff?.name}
                            />
                          </div>
                          <div className="text-[10px] font-bold text-slate-600 uppercase">{staff?.name}</div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Calendar size={12} className={task.status === TaskStatus.OVERDUE ? 'text-red-500' : ''} />
                            <span className="text-[9px] font-bold">
                              {new Date(task.deadline).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1">
                              <div className={`h-1 rounded-full ${task.status === TaskStatus.BLOCKER ? 'bg-orange-400' :
                                task.status === TaskStatus.OVERDUE ? 'bg-red-500' : 'bg-blue-500'
                                }`} style={{ width: `${task.progress}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">{task.progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskBoard;
