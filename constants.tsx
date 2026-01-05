
import { Role, Staff, Task, TaskStatus, DailyTaskTemplate } from './types';

export const STAFF_LIST: Staff[] = [
  { id: '1', name: 'DTC Manager', role: Role.MANAGER, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager' },
  { id: '2', name: 'Designer [Tư]', role: Role.DESIGNER, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tu' },
  { id: '3', name: 'Seller 1 [Huyền]', role: Role.SELLER, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huyen' },
  { id: '4', name: 'Seller 2 [Tâm]', role: Role.SELLER, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tam' },
  { id: 'cs-dao', name: 'CS [Đào]', role: Role.CS, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dao' },
  { id: 'cs-thao', name: 'CS [Thảo]', role: Role.CS, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=thao' },
];

export const CS_DAILY_TEMPLATES: DailyTaskTemplate[] = [
  { id: 'dt1', title: 'Fulfill đơn hàng mới', category: 'Fulfillment' },
  { id: 'dt2', title: 'Check Telegram/Larksuite với Vendor', category: 'Communication' },
  { id: 'dt3', title: 'Reply Email Support (All stores)', category: 'Support' },
  { id: 'dt4', title: 'Check Live Chat & Fanpage', category: 'Support' },
  { id: 'dt5', title: 'Listing sản phẩm mới', category: 'Operation' },
  { id: 'dt6', title: 'Submit Review cho Store', category: 'Operation' },
  { id: 'dt7', title: 'Xử lý Case Dispute (Paypal/Stripe)', category: 'Risk Management' },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Check file Fulfillment [Ưu Tiên]',
    // Added purpose property as required by Task interface
    purpose: 'Đảm bảo tiến độ fulfillment hàng ngày và xử lý các yêu cầu thiết kế khẩn cấp.',
    description: 'Check file ưu tiên để fulfill (Clone file, redesign, chỉnh sửa file, scale temp, thiết kế theo yêu cầu của khách)',
    assignedTo: '2',
    role: Role.DESIGNER,
    status: TaskStatus.IN_PROGRESS,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    priority: 'High',
    progress: 40,
    history: []
  },
  {
    id: 't2',
    title: 'Research trending và triển khai',
    // Added purpose property as required by Task interface
    purpose: 'Tìm kiếm nhân vật và đặc điểm đạt hot topic trending để mở rộng danh mục sản phẩm.',
    description: 'Phân tích nhân vật đặc điểm đạt hot topic trending (movie, cartoon, anime)',
    assignedTo: '3',
    role: Role.SELLER,
    status: TaskStatus.TODO,
    deadline: new Date(Date.now() + 172800000).toISOString(),
    createdAt: new Date().toISOString(),
    priority: 'Medium',
    progress: 0,
    history: []
  }
];
