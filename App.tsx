import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import Login from './src/components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import DailyReporter from './components/DailyReporter';
import TaskModal from './components/TaskModal';
import NewTaskModal from './components/NewTaskModal';
import WeeklyReportModal from './components/WeeklyReportModal';
import CSDailyChecklist from './components/CSDailyChecklist';
import UserManagement from './components/UserManagement';
import UserProfile from './components/UserProfile';
import DailySummaryModal from './components/DailySummaryModal';
import SkeletonLoader from './components/SkeletonLoader';
import { CS_DAILY_TEMPLATES } from './constants';
import { Task, TaskStatus, Role, UpdateLog, Staff } from './types';
import { api } from './src/services/api';
import { Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const AppContent: React.FC = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [newTaskRole, setNewTaskRole] = useState<Role>(Role.DESIGNER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Handle URL query parameters for direct task links from notifications
  useEffect(() => {
    if (!user || tasks.length === 0) return;

    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('taskId');
    const role = urlParams.get('role');

    if (taskId) {
      // Find the task in the current tasks list
      const task = tasks.find(t => t.id === taskId);

      if (task) {
        // Navigate to the appropriate board based on role
        const targetRole = role || task.role;
        if (targetRole === Role.DESIGNER) {
          setActiveView('designer');
        } else if (targetRole === Role.SELLER) {
          setActiveView('seller');
        } else if (targetRole === Role.CS) {
          setActiveView('cs');
        }

        // Open the task modal after a short delay to ensure board is rendered
        setTimeout(() => {
          setSelectedTask(task);
        }, 100);

        // Clear the URL parameters
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        // Task not found, try to fetch it directly
        api.tasks.get(taskId)
          .then(response => {
            const fetchedTask = response.task;

            // Navigate to the appropriate board
            const targetRole = role || fetchedTask.role;
            if (targetRole === Role.DESIGNER) {
              setActiveView('designer');
            } else if (targetRole === Role.SELLER) {
              setActiveView('seller');
            } else if (targetRole === Role.CS) {
              setActiveView('cs');
            }

            // Open the task modal
            setTimeout(() => {
              setSelectedTask(fetchedTask);
            }, 100);

            // Clear the URL parameters
            window.history.replaceState({}, '', window.location.pathname);
          })
          .catch(err => {
            console.error('Failed to fetch task from URL parameter:', err);
            toast.error('Task not found');
            // Clear the URL parameters even on error
            window.history.replaceState({}, '', window.location.pathname);
          });
      }
    }
  }, [user, tasks]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tasks and users in parallel
      const [tasksResponse, usersResponse] = await Promise.all([
        api.tasks.list(),
        api.users.list(),
      ]);

      setTasks(tasksResponse.tasks || []);
      setStaffList(usersResponse.users || []);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    const loadingToast = toast.loading('Updating task status...');
    try {
      const response = await api.tasks.updateStatus(taskId, newStatus);

      // Update local state
      setTasks(prev => prev.map(task =>
        task.id === taskId ? response.task : task
      ));

      // Update selected task if it's the one being updated
      if (selectedTask?.id === taskId) {
        setSelectedTask(response.task);
      }

      toast.success('Status updated successfully!', { id: loadingToast });
    } catch (err: any) {
      console.error('Failed to update task status:', err);
      toast.error(err.response?.data?.error || 'Failed to update task status', { id: loadingToast });
    }
  };

  const handleUpdateTask = async (updatedTask: Task, newLogs: UpdateLog[]) => {
    const loadingToast = toast.loading('Saving changes...');
    try {
      // Prepare payload with all required fields
      const payload = {
        title: updatedTask.title,
        purpose: updatedTask.purpose,
        description: updatedTask.description,
        assignedToId: updatedTask.assignedTo,
        status: updatedTask.status,
        priority: updatedTask.priority,
        progress: Number(updatedTask.progress), // Ensure it's a number
        deadline: updatedTask.deadline,
        blockerReason: updatedTask.blockerReason || undefined,
        blockerRelatedTo: updatedTask.blockerRelatedTo || undefined,
      };

      console.log('Updating task with payload:', payload);

      // 1. Update main task fields
      const updateResponse = await api.tasks.update(updatedTask.id, payload);
      let finalTask = updateResponse.task;

      // 2. Handle generic logs (specifically Comments which aren't handled by the main update)
      const commentLogs = newLogs.filter(log => log.field === 'Comment');

      if (commentLogs.length > 0) {
        // Send comments sequentially to ensure order
        for (const log of commentLogs) {
          await api.tasks.addLog(updatedTask.id, {
            field: log.field, // Should be 'Comment'
            oldValue: log.oldValue,
            newValue: log.newValue,
            details: log.details
          });
        }

        // Refetch task to get the latest history including the new comments
        // (since api.tasks.update won't return the logs added via api.tasks.addLog)
        const fetchResponse = await api.tasks.get(updatedTask.id);
        finalTask = fetchResponse.task;
      }

      // Update local state
      setTasks(prev => prev.map(task =>
        task.id === updatedTask.id ? finalTask : task
      ));

      setSelectedTask(finalTask);
      toast.success('Task updated successfully!', { id: loadingToast });
    } catch (err: any) {
      console.error('Failed to update task:', err);
      toast.error(err.message || 'Failed to update task', { id: loadingToast });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const loadingToast = toast.loading('Deleting task...');
    try {
      await api.tasks.delete(taskId);

      // Remove from local state
      setTasks(prev => prev.filter(task => task.id !== taskId));
      setSelectedTask(null);

      toast.success('Task deleted successfully!', { id: loadingToast });
    } catch (err: any) {
      console.error('Failed to delete task:', err);
      toast.error(err.message || 'Failed to delete task', { id: loadingToast });
      throw err; // Re-throw so TaskModal can handle it
    }
  };

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'history'>) => {
    const loadingToast = toast.loading('Creating task...');
    try {
      // Build payload with explicit fields
      const apiPayload = {
        title: taskData.title,
        purpose: taskData.purpose,
        description: taskData.description || '',
        assignedToId: taskData.assignedTo,
        role: taskData.role,
        priority: taskData.priority.toUpperCase(), // Convert to uppercase for backend enum
        deadline: taskData.deadline,
      };

      console.log('Creating task with payload:', apiPayload);
      const response = await api.tasks.create(apiPayload);

      // Add to local state
      setTasks(prev => [...prev, response.task]);
      setIsNewTaskModalOpen(false);
      toast.success('Task created successfully!', { id: loadingToast });
    } catch (err: any) {
      console.error('Failed to create task:', err);
      console.error('Error details:', err.response?.data);
      console.error('Validation errors:', err.response?.data?.details);

      const errorMsg = err.response?.data?.details
        ? `Validation errors: ${JSON.stringify(err.response.data.details, null, 2)}`
        : err.message;

      toast.error(`Failed to create task: ${errorMsg}`, { id: loadingToast });
    }
  };

  const handleActivateDailyTask = async (template: any, staffId: string) => {
    const today = new Date();
    const deadline = new Date(today);
    deadline.setHours(23, 59, 59, 999);

    const taskData = {
      title: template.title,
      purpose: `Vận hành daily store: ${template.category}`,
      description: `Daily recurring task: ${template.category}`,
      assignedTo: staffId,
      assignedToId: staffId,
      role: Role.CS,
      status: TaskStatus.IN_PROGRESS,
      deadline: deadline.toISOString(),
      priority: 'Medium' as const,
      progress: 0,
    };

    await handleAddTask(taskData);
  };

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <Login />;
  }

  // Show loading screen while fetching data
  if (loading) {
    return (
      <Layout
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenSummary={() => setIsSummaryOpen(true)}
        currentUser={user}
        onUserLogout={logout}
      >
        <div className="p-8">
          <SkeletonLoader variant="card" count={6} />
        </div>
      </Layout>
    );
  }

  // Show error if data fetch failed
  if (error) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-200 shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error Loading Data</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard tasks={tasks} staffList={staffList} />;
      case 'designer':
        return (
          <TaskBoard
            role={Role.DESIGNER}
            tasks={tasks}
            onUpdateStatus={handleUpdateStatus}
            staffMembers={staffList}
            onTaskClick={setSelectedTask}
            onNewTaskClick={(role) => {
              if (user.role === Role.MANAGER) {
                setNewTaskRole(role);
                setIsNewTaskModalOpen(true);
              }
            }}
            onReportClick={() => setIsReportModalOpen(true)}
            currentUser={user}
          />
        );
      case 'seller':
        return (
          <TaskBoard
            role={Role.SELLER}
            tasks={tasks}
            onUpdateStatus={handleUpdateStatus}
            staffMembers={staffList}
            onTaskClick={setSelectedTask}
            onNewTaskClick={(role) => {
              if (user.role === Role.MANAGER) {
                setNewTaskRole(role);
                setIsNewTaskModalOpen(true);
              }
            }}
            onReportClick={() => setIsReportModalOpen(true)}
            currentUser={user}
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
                staffMembers={staffList}
                onTaskClick={setSelectedTask}
                onNewTaskClick={(role) => {
                  if (user.role === Role.MANAGER) {
                    setNewTaskRole(role);
                    setIsNewTaskModalOpen(true);
                  }
                }}
                onReportClick={() => setIsReportModalOpen(true)}
                currentUser={user}
              />
            </div>
            {user.role === Role.MANAGER && (
              <div className="w-full lg:w-80 shrink-0 h-full">
                <CSDailyChecklist
                  templates={CS_DAILY_TEMPLATES}
                  tasks={tasks}
                  csStaff={staffList.filter(s => s.role === Role.CS)}
                  onActivateTask={handleActivateDailyTask}
                />
              </div>
            )}
          </div>
        );
      case 'users':
        return user.role === Role.MANAGER ? <UserManagement currentUser={user} /> : null;
      case 'reports':
        return user.role === Role.MANAGER ? <DailyReporter staffList={staffList} tasks={tasks} /> : null;
      case 'profile':
        return <UserProfile />;
      default:
        return <Dashboard tasks={tasks} staffList={staffList} />;
    }
  };

  return (
    <Layout
      activeView={activeView}
      setActiveView={setActiveView}
      onOpenSummary={() => setIsSummaryOpen(true)}
      currentUser={user}
      onUserLogout={logout}
    >
      <div className="animate-in fade-in duration-500 h-full">
        {renderContent()}
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          staffMembers={staffList}
          currentUser={user}
        />
      )}

      {isNewTaskModalOpen && (
        <NewTaskModal
          onClose={() => setIsNewTaskModalOpen(false)}
          onAdd={handleAddTask}
          staffMembers={staffList}
          initialRole={newTaskRole}
        />
      )}

      {isReportModalOpen && (
        <WeeklyReportModal
          onClose={() => setIsReportModalOpen(false)}
          currentUser={user}
          staffMembers={staffList}
        />
      )}

      {isSummaryOpen && (
        <DailySummaryModal
          tasks={tasks}
          staffMembers={staffList}
          onClose={() => setIsSummaryOpen(false)}
        />
      )}

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
