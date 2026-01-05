
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKER = 'BLOCKER',
  DONE = 'DONE',
  OVERDUE = 'OVERDUE'
}

export enum Role {
  MANAGER = 'Manager',
  CS = 'Customer Service',
  SELLER = 'Seller',
  DESIGNER = 'Designer'
}

export interface Staff {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
}

export interface UpdateLog {
  id: string;
  timestamp: string;
  field: string;
  oldValue: string;
  newValue: string;
  details?: string;
}

export interface Task {
  id: string;
  title: string;
  purpose: string; // New field: Mục đích
  description: string;
  assignedTo: string; // Staff ID
  role: Role;
  status: TaskStatus;
  deadline: string; // ISO string
  createdAt: string;
  priority: 'High' | 'Medium' | 'Low';
  progress: number; // 0 to 100
  history: UpdateLog[];
  blockerReason?: string;
  blockerRelatedTo?: string;
}

export interface DailyTaskLog {
  id: string;
  date: string; // YYYY-MM-DD
  taskTemplateId: string;
  completedBy: string; // Staff ID
  timestamp: string;
}

export interface DailyTaskTemplate {
  id: string;
  title: string;
  category: string;
}

export interface DailyReport {
  id: string;
  date: string;
  staffId: string;
  content: string;
  completedTasks: string[];
}
