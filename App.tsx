
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import DailyReporter from './components/DailyReporter';
import TaskModal from './components/TaskModal';
import NewTaskModal from './components/NewTaskModal';
import CSDailyChecklist from './components/CSDailyChecklist';
import DailySummaryModal from './components/DailySummaryModal';
import { INITIAL_TASKS, STAFF_LIST, CS_DAILY_TEMPLATES } from './constants';
import { Task, TaskStatus, Role, UpdateLog, DailyTaskTemplate, Staff } from './types';
import { User, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('dtc_workflow_tasks');
    if (savedTasks) {
      try {
        return JSON.parse(savedTasks);
      } catch (e) {
        return INITIAL_TASKS;
      }
    }
    return INITIAL_TASKS;
  });
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [newTaskRole, setNewTaskRole] = useState<Role>(Role.DESIGNER);

  // Persistence
  useEffect(() => {
    localStorage.setItem('dtc_workflow_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Automatic Overdue Checker
  useEffect(() => {
    const checkOverdueTasks = () => {
      const now = new Date();
      setTasks(prevTasks => {
        let hasChanges = false;
        const updatedTasks = prevTasks.map(task => {
          // If deadline is passed AND not DONE AND not already OVERDUE
          if (
            task.status !== TaskStatus.DONE && 
            task.status !== TaskStatus.OVERDUE && 
            new Date(task.deadline) < now
          ) {
            hasChanges = true;
            return {
              ...task,
              status: TaskStatus.OVERDUE,
              history: [
                ...task.history,
                {
                  id: `system-overdue-${Date.now()}-${Math.random()}`,
                  timestamp: now.toISOString(),
                  field: 'Status',
                  oldValue: task.status,
                  newValue: TaskStatus.OVERDUE,
                  details: 'System: Tự động chuyển sang Overdue do quá hạn deadline.'
                }
              ]
            };
          }
          return task;
        });

        return hasChanges ? updatedTasks : prevTasks;
      });
    };

    // Run immediately on mount
    checkOverdueTasks();

    // Check every 60 seconds for real-time status shifts
    const intervalId = setInterval(checkOverdueTasks, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Auth Simulator: On first load, prompt to pick a user
  if (!currentUser) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-8 overflow-y-auto">
        <div className="max-w-4xl w-full space-y-8 animate-in zoom-in-95">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-black italic shadow-2xl shadow-blue-500/20">DTC</div>
            <h1 className="text-3xl font-bold text-white tracking-tight mt-6">Select Your Identity</h1>
            <p className="text-slate-400">Welcome to DTC Teamflow. Please choose your role to enter the dashboard.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {STAFF_LIST.map(staff => (
              <button
                key={staff.id}
                onClick={() => setCurrentUser(staff)}
                className="bg-slate-800 border border-slate-700 p-6 rounded-3xl hover:border-blue-500 hover:bg-slate-750 transition-all group text-left flex items-center gap-4"
              >
                <div className="relative">
                  <img src={staff.avatar} className="w-16 h-16 rounded-full border-2 border-slate-600 group-hover:border-blue-500 transition-colors" />
                  {staff.role === Role.MANAGER && <ShieldCheck className="absolute -bottom-1 -right-1 text-blue-500 bg-slate-900 rounded-full" size={20} />}
                </div>
                <div>
                  <h3 className="text-white font-bold group-hover:text-blue-400 transition-colors">{staff.name}</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{staff.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleUpdateStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const log: UpdateLog = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          field: 'Status',
          oldValue: task.status,
          newValue: newStatus
        };
        return { 
          ...task, 
          status: newStatus, 
          progress: newStatus === TaskStatus.DONE ? 100 : task.progress,
          history: [...task.history, log]
        };
      }
      return task;
    }));
  };

  const handleUpdateTask = (updatedTask: Task, newLogs: UpdateLog[]) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id 
        ? { ...updatedTask, history: [...updatedTask.history, ...newLogs] } 
        : task
    ));
    setSelectedTask(updatedTask);
  };

  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'history'>) => {
    const newTask: Task = {
      ...taskData,
      id: `t${Date.now()}`,
      createdAt: new Date().toISOString(),
      history: [{
        id: 'initial',
        timestamp: new Date().toISOString(),
        field: 'Task',
        oldValue: 'None',
        newValue: 'Created'
      }]
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleActivateDailyTask = (template: DailyTaskTemplate, staffId: string) => {
    const today = new Date();
    const deadline = new Date(today);
    deadline.setHours(23, 59, 59, 999);

    const newTask: Task = {
      id: `daily-${template.id}-${Date.now()}`,
      title: template.title,
      purpose: `Vận hành daily store: ${template.category}`,
      description: `Daily recurring task: ${template.category}`,
      assignedTo: staffId,
      role: Role.CS,
      status: TaskStatus.IN_PROGRESS,
      deadline: deadline.toISOString(),
      createdAt: today.toISOString(),
      priority: 'Medium',
      progress: 0,
      history: [{
        id: 'init',
        timestamp: today.toISOString(),
        field: 'System',
        oldValue: 'Template',
        newValue: `Activated by ${STAFF_LIST.find(s => s.id === staffId)?.name}`
      }]
    };

    setTasks(prev => [...prev, newTask]);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard tasks={tasks} />;
      case 'designer':
        return (
          <TaskBoard 
            role={Role.DESIGNER} 
            tasks={tasks} 
            onUpdateStatus={handleUpdateStatus} 
            staffMembers={STAFF_LIST} 
            onTaskClick={setSelectedTask}
            onNewTaskClick={(role) => {
              if (currentUser.role === Role.MANAGER) {
                setNewTaskRole(role);
                setIsNewTaskModalOpen(true);
              }
            }}
            currentUser={currentUser}
          />
        );
      case 'seller':
        return (
          <TaskBoard 
            role={Role.SELLER} 
            tasks={tasks} 
            onUpdateStatus={handleUpdateStatus} 
            staffMembers={STAFF_LIST} 
            onTaskClick={setSelectedTask}
            onNewTaskClick={(role) => {
              if (currentUser.role === Role.MANAGER) {
                setNewTaskRole(role);
                setIsNewTaskModalOpen(true);
              }
            }}
            currentUser={currentUser}
          />
        );
      case 'cs':
        return (
          <div className="flex flex-col lg:flex-row gap-8 h-full">
            <div className="flex-1 min-w-0">
              <TaskBoard 
                role={Role.CS} 
                tasks={tasks} 
                onUpdateStatus={handleUpdateStatus} 
                staffMembers={STAFF_LIST} 
                onTaskClick={setSelectedTask}
                onNewTaskClick={(role) => {
                  if (currentUser.role === Role.MANAGER) {
                    setNewTaskRole(role);
                    setIsNewTaskModalOpen(true);
                  }
                }}
                currentUser={currentUser}
              />
            </div>
            {currentUser.role === Role.MANAGER && (
              <div className="w-full lg:w-80 shrink-0 h-full">
                <CSDailyChecklist 
                  templates={CS_DAILY_TEMPLATES}
                  tasks={tasks}
                  csStaff={STAFF_LIST.filter(s => s.role === Role.CS)}
                  onActivateTask={handleActivateDailyTask}
                />
              </div>
            )}
          </div>
        );
      case 'staff':
        return currentUser.role === Role.MANAGER ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {STAFF_LIST.map(staff => (
              <div key={staff.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <img src={staff.avatar} className="w-16 h-16 rounded-full border border-slate-100 shadow-sm" />
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{staff.name}</h3>
                  <p className="text-slate-500 text-sm font-medium">{staff.role}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null;
      case 'reports':
        return currentUser.role === Role.MANAGER ? <DailyReporter staffList={STAFF_LIST} tasks={tasks} /> : null;
      default:
        return <Dashboard tasks={tasks} />;
    }
  };

  return (
    <Layout 
      activeView={activeView} 
      setActiveView={setActiveView} 
      onOpenSummary={() => setIsSummaryOpen(true)}
      currentUser={currentUser}
      onUserLogout={() => setCurrentUser(null)}
    >
      <div className="animate-in fade-in duration-500 h-full">
        {renderContent()}
      </div>

      {selectedTask && (
        <TaskModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
          staffMembers={STAFF_LIST}
          currentUser={currentUser}
        />
      )}

      {isNewTaskModalOpen && (
        <NewTaskModal 
          onClose={() => setIsNewTaskModalOpen(false)}
          onAdd={handleAddTask}
          staffMembers={STAFF_LIST}
          initialRole={newTaskRole}
        />
      )}

      {isSummaryOpen && (
        <DailySummaryModal 
          tasks={tasks}
          staffMembers={STAFF_LIST}
          onClose={() => setIsSummaryOpen(false)}
        />
      )}
    </Layout>
  );
};

export default App;
