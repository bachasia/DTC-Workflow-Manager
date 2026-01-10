const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper function to make authenticated requests
const makeRequest = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('accessToken');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && !url.includes('/auth/refresh')) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });

                if (refreshResponse.ok) {
                    const { accessToken } = await refreshResponse.json();
                    localStorage.setItem('accessToken', accessToken);

                    // Retry original request with new token
                    headers['Authorization'] = `Bearer ${accessToken}`;
                    const retryResponse = await fetch(`${API_URL}${url}`, {
                        ...options,
                        headers,
                    });
                    return retryResponse;
                }
            } catch (error) {
                // Refresh failed, logout user
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/';
                throw error;
            }
        }
    }

    return response;
};

// Helper to handle response
const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        const error: any = new Error(errorData.error || `HTTP ${response.status}`);
        error.response = { data: errorData }; // Attach full error data
        throw error;
    }
    return response.json();
};

// API methods
export const api = {
    // Auth
    auth: {
        login: async (email: string, password: string) => {
            const response = await makeRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            return handleResponse(response);
        },
        register: async (data: {
            email: string;
            password: string;
            name: string;
            role: string;
            avatar?: string;
        }) => {
            const response = await makeRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        me: async () => {
            const response = await makeRequest('/auth/me');
            return handleResponse(response);
        },
        logout: () => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        },
    },

    // Tasks
    tasks: {
        list: async (filters?: { role?: string; status?: string; assignedTo?: string }) => {
            const params = new URLSearchParams();
            if (filters?.role) params.append('role', filters.role);
            if (filters?.status) params.append('status', filters.status);
            if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);

            const queryString = params.toString();
            const response = await makeRequest(`/tasks${queryString ? `?${queryString}` : ''}`);
            const data = await handleResponse(response);

            // Transform backend data to frontend format
            const tasks = data.tasks?.map((task: any) => ({
                ...task,
                history: task.updateLogs || [],
                assignedTo: task.assignedToId,
            })) || [];

            return { tasks };
        },
        get: async (id: string) => {
            const response = await makeRequest(`/tasks/${id}`);
            const data = await handleResponse(response);
            return {
                task: {
                    ...data.task,
                    history: data.task.updateLogs || [],
                    assignedTo: data.task.assignedToId,
                },
            };
        },
        create: async (taskData: any) => {
            const response = await makeRequest('/tasks', {
                method: 'POST',
                body: JSON.stringify(taskData),
            });
            const data = await handleResponse(response);
            return {
                task: {
                    ...data.task,
                    history: data.task.updateLogs || [],
                    assignedTo: data.task.assignedToId,
                },
            };
        },
        update: async (id: string, updates: any) => {
            const response = await makeRequest(`/tasks/${id}`, {
                method: 'PUT',
                body: JSON.stringify(updates),
            });
            const data = await handleResponse(response);
            return {
                task: {
                    ...data.task,
                    history: data.task.updateLogs || [],
                    assignedTo: data.task.assignedToId,
                },
            };
        },
        updateStatus: async (id: string, status: string, blockerReason?: string) => {
            const response = await makeRequest(`/tasks/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status, blockerReason }),
            });
            const data = await handleResponse(response);
            return {
                task: {
                    ...data.task,
                    history: data.task.updateLogs || [],
                    assignedTo: data.task.assignedToId,
                },
            };
        },
        delete: async (id: string) => {
            const response = await makeRequest(`/tasks/${id}`, {
                method: 'DELETE',
            });
            return handleResponse(response);
        },
        addLog: async (id: string, log: any) => {
            const response = await makeRequest(`/tasks/${id}/logs`, {
                method: 'POST',
                body: JSON.stringify(log),
            });
            return handleResponse(response);
        },
    },

    // Users
    users: {
        list: async () => {
            const response = await makeRequest('/users');
            return handleResponse(response);
        },
        get: async (id: string) => {
            const response = await makeRequest(`/users/${id}`);
            return handleResponse(response);
        },
        getTasks: async (id: string) => {
            const response = await makeRequest(`/users/${id}/tasks`);
            return handleResponse(response);
        },
        create: async (data: { name: string; email: string; password: string; role: string; avatar?: string }) => {
            const response = await makeRequest('/users', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        update: async (id: string, data: { name: string; email: string; role: string; avatar?: string }) => {
            const response = await makeRequest(`/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        delete: async (id: string) => {
            const response = await makeRequest(`/users/${id}`, {
                method: 'DELETE',
            });
            return handleResponse(response);
        },
    },

    // Reports
    reports: {
        submit: async (data: {
            date: string;
            content: string;
            completedTasks: string[];
            analytics?: any;
        }) => {
            const response = await makeRequest('/reports', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        list: async (filters?: { userId?: string; startDate?: string; endDate?: string }) => {
            const params = new URLSearchParams();
            if (filters?.userId) params.append('userId', filters.userId);
            if (filters?.startDate) params.append('startDate', filters.startDate);
            if (filters?.endDate) params.append('endDate', filters.endDate);

            const queryString = params.toString();
            const response = await makeRequest(`/reports${queryString ? `?${queryString}` : ''}`);
            return handleResponse(response);
        },
        analytics: async () => {
            const response = await makeRequest('/reports/analytics');
            return handleResponse(response);
        },
    },

    // Dashboard
    dashboard: {
        getStats: async () => {
            const response = await makeRequest('/dashboard/stats');
            return handleResponse(response);
        },
    },
};

export default api;
