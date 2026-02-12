import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Key, X, Save, Mail, User as UserIcon, Shield } from 'lucide-react';
import { AuthService } from '../services/DriveService';
import { useAuth } from '../contexts/AuthContext';
import { User, SESSION_TOKEN_KEY, USER_ROLES, ROLE_LABELS, ROLE_COLORS, UserRole } from '../types';

interface NewUserState {
  username: string;
  password: string;
  email: string;
  role: UserRole;
  chapterId: string;
}

interface UserManagementProps {
  onBack?: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onBack }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [newUser, setNewUser] = useState<NewUserState>({
    username: '',
    password: '',
    email: '',
    role: 'editor',
    chapterId: ''
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!sessionToken) {
      setLoading(false);
      return;
    }

    const result = await AuthService.listUsers(sessionToken);
    if (result.success && result.users) {
      setUsers(result.users);
    }
    setLoading(false);
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.email) {
      alert('Please fill all required fields');
      return;
    }

    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!sessionToken) {
      alert('Session expired. Please login again.');
      return;
    }

    const result = await AuthService.createUser(sessionToken, newUser);
    
    if (result.success) {
      alert('User created successfully!');
      setShowAddUser(false);
      setNewUser({
        username: '',
        password: '',
        email: '',
        role: 'editor',
        chapterId: ''
      });
      loadUsers();
    } else {
      alert('Error creating user: ' + result.error);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!sessionToken) {
      alert('Session expired. Please login again.');
      return;
    }

    const result = await AuthService.deleteUser(sessionToken, userId);
    
    if (result.success) {
      alert('User deleted successfully!');
      loadUsers();
    } else {
      alert('Error deleting user: ' + result.error);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!sessionToken) {
      alert('Session expired. Please login again.');
      return;
    }

    const result = await AuthService.updatePassword(
      sessionToken,
      passwordData.newPassword,
      selectedUser?.username
    );

    if (result.success) {
      alert('Password updated successfully!');
      setShowPasswordModal(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setSelectedUser(null);
    } else {
      alert('Error updating password: ' + result.error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-ocean-deep dark:text-white">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-light via-[#b2dfdb] to-ocean-mint dark:from-ocean-deep dark:via-[#021017] dark:to-ocean-dark pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-lg border border-white/10 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-ocean-deep dark:text-white">User Management</h1>
              <p className="text-ocean-deep/60 dark:text-gray-400 mt-1">
                Manage user accounts and permissions
              </p>
            </div>
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-blue hover:bg-primary-cyan text-white rounded-lg transition-colors"
            >
              <UserPlus size={18} />
              Add User
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-lg border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-ocean-deep dark:text-white uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-ocean-deep dark:text-white uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-ocean-deep dark:text-white uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-ocean-deep dark:text-white uppercase tracking-wider">
                    Chapter
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-ocean-deep dark:text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-cyan/20 flex items-center justify-center">
                          <UserIcon size={20} className="text-primary-cyan" />
                        </div>
                        <div className="font-bold text-ocean-deep dark:text-white">
                          {user.username}
                          {user.id === currentUser?.id && (
                            <span className="ml-2 text-xs text-primary-cyan">(You)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-ocean-deep/70 dark:text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${ROLE_COLORS[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-ocean-deep/70 dark:text-gray-300">
                      {user.chapterId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPasswordModal(true);
                          }}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Change Password"
                        >
                          <Key size={18} className="text-blue-600 dark:text-blue-400" />
                        </button>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-ocean-deep dark:text-white">Add New User</h2>
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={24} className="text-ocean-deep dark:text-white" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                      placeholder="Enter username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">
                      Role *
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                        setNewUser({ ...newUser, role: e.target.value as typeof newUser.role })
                      }
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                    >
                      {USER_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {newUser.role === 'chapter_head' && (
                    <div>
                      <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">
                        Chapter ID
                      </label>
                      <input
                        type="text"
                        value={newUser.chapterId}
                        onChange={(e) => setNewUser({ ...newUser, chapterId: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                        placeholder="e.g., tagum-chapter"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleAddUser}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-blue hover:bg-primary-cyan text-white rounded-lg transition-colors font-bold"
                  >
                    <Save size={18} />
                    Create User
                  </button>
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-white/10 text-ocean-deep dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 transition-colors font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-ocean-deep dark:text-white">
                    Change Password
                  </h2>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({ newPassword: '', confirmPassword: '' });
                      setSelectedUser(null);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={24} className="text-ocean-deep dark:text-white" />
                  </button>
                </div>

                <p className="text-ocean-deep/70 dark:text-gray-300 mb-4">
                  Changing password for: <strong>{selectedUser.username}</strong>
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleChangePassword}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-blue hover:bg-primary-cyan text-white rounded-lg transition-colors font-bold"
                  >
                    <Key size={18} />
                    Update Password
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({ newPassword: '', confirmPassword: '' });
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-white/10 text-ocean-deep dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 transition-colors font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
