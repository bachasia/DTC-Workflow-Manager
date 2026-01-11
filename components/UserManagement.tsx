import React, { useState, useEffect } from 'react';
import { Staff, Role } from '../types';
import { api } from '../src/services/api';
import { Users, Edit2, Trash2, Plus, Mail, Shield, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserManagementProps {
    currentUser: Staff;
}

interface EditUserModalProps {
    user: Staff;
    onClose: () => void;
    onSave: (user: Staff) => void;
}

interface DeleteConfirmModalProps {
    user: Staff;
    onClose: () => void;
    onConfirm: () => void;
}

interface CreateUserModalProps {
    onClose: () => void;
    onCreate: (user: Staff) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await api.users.update(user.id, formData);
            toast.success('User updated successfully!');
            onSave(response.user);
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800">Edit User</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            <option value={Role.MANAGER}>Manager</option>
                            <option value={Role.DESIGNER}>Designer</option>
                            <option value={Role.SELLER}>Seller</option>
                            <option value={Role.CS}>CS</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Avatar URL (Optional)</label>
                        <input
                            type="url"
                            value={formData.avatar}
                            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://example.com/avatar.jpg"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose, onCreate }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: Role.DESIGNER,
        password: '',
        avatar: '',
    });
    const [creating, setCreating] = useState(false);

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        const password = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        setFormData({ ...formData, password });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            const response = await api.users.create(formData);
            toast.success('User created successfully!');
            onCreate(response.user);
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create user');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800">Create New User</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="john@company.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Role *</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            <option value={Role.MANAGER}>Manager</option>
                            <option value={Role.DESIGNER}>Designer</option>
                            <option value={Role.SELLER}>Seller</option>
                            <option value={Role.CS}>CS</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Password *</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter password"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={generatePassword}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold text-sm"
                            >
                                Generate
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Avatar URL (Optional)</label>
                        <input
                            type="url"
                            value={formData.avatar}
                            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://example.com/avatar.jpg"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {creating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    Create User
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ user, onClose, onConfirm }) => {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        await onConfirm();
        setDeleting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <Trash2 className="text-red-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Delete User</h2>
                    <p className="text-slate-600 mb-4">
                        Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                        <p className="text-sm text-amber-800">
                            ⚠️ This user will be permanently removed from the system.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={deleting}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {deleting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={18} />
                                    Delete User
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
    const [users, setUsers] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<Staff | null>(null);
    const [deletingUser, setDeletingUser] = useState<Staff | null>(null);
    const [creatingUser, setCreatingUser] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.users.list();
            setUsers(response.users);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = (newUser: Staff) => {
        setUsers(prev => [...prev, newUser]);
    };

    const handleUpdateUser = (updatedUser: Staff) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const handleDeleteUser = async () => {
        if (!deletingUser) return;

        try {
            await api.users.delete(deletingUser.id);
            setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
            toast.success('User deleted successfully!');
            setDeletingUser(null);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete user');
        }
    };

    const getRoleBadgeColor = (role: Role) => {
        switch (role) {
            case Role.MANAGER:
                return 'bg-purple-100 text-purple-700';
            case Role.DESIGNER:
                return 'bg-blue-100 text-blue-700';
            case Role.SELLER:
                return 'bg-green-100 text-green-700';
            case Role.CS:
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Users size={28} />
                        Staff Management
                    </h2>
                    <p className="text-slate-500">Manage team members and their roles</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-600 bg-slate-100 px-4 py-2 rounded-lg">
                        <strong>{users.length}</strong> total users
                    </div>
                    <button
                        onClick={() => setCreatingUser(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-sm transition-all"
                    >
                        <Plus size={18} />
                        Add User
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)]">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">User</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Email</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Role</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Joined</th>
                                <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                                alt={user.name}
                                                className="w-10 h-10 rounded-full border-2 border-slate-100"
                                            />
                                            <div>
                                                <div className="font-semibold text-slate-800">
                                                    {user.role} [{user.name}]
                                                </div>
                                                {user.id === currentUser.id && (
                                                    <span className="text-xs text-blue-600 font-medium">(You)</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Mail size={14} />
                                            <span className="text-sm">{user.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getRoleBadgeColor(user.role)}`}>
                                            <Shield size={12} />
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit user"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeletingUser(user)}
                                                disabled={user.id === currentUser.id}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                title={user.id === currentUser.id ? "Cannot delete yourself" : "Delete user"}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {creatingUser && (
                <CreateUserModal
                    onClose={() => setCreatingUser(false)}
                    onCreate={handleCreateUser}
                />
            )}

            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleUpdateUser}
                />
            )}

            {deletingUser && (
                <DeleteConfirmModal
                    user={deletingUser}
                    onClose={() => setDeletingUser(null)}
                    onConfirm={handleDeleteUser}
                />
            )}
        </div>
    );
};

export default UserManagement;
