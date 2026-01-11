import React, { useState } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { api } from '../src/services/api';
import { X, Mail, Lock, User, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const UserProfile: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Email form state
    const [newEmail, setNewEmail] = useState(user?.email || '');
    const [emailError, setEmailError] = useState('');

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setEmailError('Email is required');
            return false;
        }
        if (!emailRegex.test(email)) {
            setEmailError('Invalid email format');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validatePassword = (): boolean => {
        if (!currentPassword) {
            setPasswordError('Current password is required');
            return false;
        }
        if (!newPassword) {
            setPasswordError('New password is required');
            return false;
        }
        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return false;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEmail(newEmail)) return;
        if (newEmail === user?.email) {
            toast.error('New email is the same as current email');
            return;
        }

        const loadingToast = toast.loading('Updating email...');
        setIsUpdatingEmail(true);

        try {
            const response = await api.auth.updateEmail(newEmail);
            updateUser(response.user);
            toast.success('Email updated successfully!', { id: loadingToast });
            setEmailError('');
        } catch (error: any) {
            console.error('Failed to update email:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to update email';
            setEmailError(errorMsg);
            toast.error(errorMsg, { id: loadingToast });
        } finally {
            setIsUpdatingEmail(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validatePassword()) return;

        const loadingToast = toast.loading('Updating password...');
        setIsUpdatingPassword(true);

        try {
            await api.auth.updatePassword(currentPassword, newPassword);
            toast.success('Password updated successfully!', { id: loadingToast });

            // Clear form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');
        } catch (error: any) {
            console.error('Failed to update password:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to update password';
            setPasswordError(errorMsg);
            toast.error(errorMsg, { id: loadingToast });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <div className="flex items-center gap-6">
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-24 h-24 rounded-full bg-slate-200 object-cover"
                    />
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
                        <p className="text-slate-500 mt-1">{user.email}</p>
                        <div className="mt-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold">
                                <User size={14} />
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Email Update Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Mail className="text-blue-600" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Email Address</h2>
                        <p className="text-sm text-slate-500">Update your email address</p>
                    </div>
                </div>

                <form onSubmit={handleUpdateEmail} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            New Email Address
                        </label>
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => {
                                setNewEmail(e.target.value);
                                setEmailError('');
                            }}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="your.email@example.com"
                        />
                        {emailError && (
                            <p className="mt-2 text-sm text-red-600">{emailError}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isUpdatingEmail || newEmail === user.email}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUpdatingEmail ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Update Email
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Password Update Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                        <Lock className="text-purple-600" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Password</h2>
                        <p className="text-sm text-slate-500">Change your password</p>
                    </div>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Current Password
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => {
                                setCurrentPassword(e.target.value);
                                setPasswordError('');
                            }}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter current password"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                setPasswordError('');
                            }}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter new password (min. 6 characters)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setPasswordError('');
                            }}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Confirm new password"
                        />
                    </div>

                    {passwordError && (
                        <p className="text-sm text-red-600">{passwordError}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUpdatingPassword ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Update Password
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UserProfile;
