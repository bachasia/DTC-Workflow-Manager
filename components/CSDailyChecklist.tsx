
import React from 'react';
import { DailyTaskTemplate, Staff, Task, TaskStatus } from '../types';
import { Play, ClipboardList, UserPlus, Info } from 'lucide-react';

interface CSDailyChecklistProps {
  templates: DailyTaskTemplate[];
  tasks: Task[];
  csStaff: Staff[];
  onActivateTask: (template: DailyTaskTemplate, staffId: string) => void;
}

const CSDailyChecklist: React.FC<CSDailyChecklistProps> = ({ templates, tasks, csStaff, onActivateTask }) => {
  const today = new Date().toISOString().split('T')[0];

  // Filter tasks that were created from templates today
  const activeTasksToday = tasks.filter(t =>
    t.createdAt.startsWith(today) &&
    templates.some(temp => temp.title === t.title)
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 bg-slate-50 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <ClipboardList size={20} className="text-blue-500" />
          CS Daily Library
        </h3>
        <p className="text-xs text-slate-500 font-medium">Add daily operations to today's workflow</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {templates.map(template => {
          const isActive = activeTasksToday.some(t => t.title === template.title);
          const activeTask = activeTasksToday.find(t => t.title === template.title);
          const assignedStaff = activeTask ? csStaff.find(s => s.id === activeTask.assignedTo) : null;

          return (
            <div
              key={template.id}
              className={`p-4 rounded-2xl border transition-all ${isActive ? 'bg-blue-50/30 border-blue-100 opacity-60' : 'bg-white border-slate-100'
                }`}
            >
              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{template.category}</span>
                  <h4 className="font-bold text-sm text-slate-700">{template.title}</h4>
                </div>

                {isActive ? (
                  <div className="flex items-center gap-2">
                    <img src={assignedStaff?.avatar} className="w-5 h-5 rounded-full border border-blue-200" />
                    <span className="text-[10px] font-bold text-blue-600">Assigned to {assignedStaff?.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-[10px] font-bold text-slate-400 mr-1 italic">Assign to:</div>
                    {csStaff.map(staff => (
                      <button
                        key={staff.id}
                        onClick={() => onActivateTask(template, staff.id)}
                        className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-bold text-slate-600 transition-all border border-slate-200"
                      >
                        <Play size={10} fill="currentColor" />
                        {staff.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-blue-50/50 border-t border-blue-100 flex items-start gap-2">
        <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-blue-700 leading-tight">
          Click a name to "push" the daily operation into today's workflow board. It will be assigned to that member immediately.
        </p>
      </div>
    </div>
  );
};

export default CSDailyChecklist;
