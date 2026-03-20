import React, { useEffect, useState } from 'react';
import { KeyRound, Mail, Save, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppDialog } from '../contexts/AppDialogContext';
import { AuthService, DataService } from '../services/DriveService';
import { getSessionToken } from '../utils/session';

interface MyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyProfileModal: React.FC<MyProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateCurrentUser } = useAuth();
  const { showAlert } = useAppDialog();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [chapterName, setChapterName] = useState('');

  useEffect(() => {
    if (!isOpen || !user) return;
    setUsername(user.username || '');
    setEmail(user.email || '');
    setNewPassword('');
    setConfirmPassword('');
  }, [isOpen, user]);

  useEffect(() => {
    const resolveChapterName = async () => {
      if (!isOpen || !user?.chapterId) {
        setChapterName('');
        return;
      }

      try {
        const result = await DataService.listChapters();
        if (!result.success || !result.chapters) {
          setChapterName(user.chapterId);
          return;
        }

        const matchedChapter = result.chapters.find((chapter: any) => String(chapter.id) === String(user.chapterId));
        setChapterName(matchedChapter?.name || user.chapterId);
      } catch (error) {
        setChapterName(user.chapterId);
      }
    };

    resolveChapterName();
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSave = async () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername || !trimmedEmail) {
      await showAlert('Username and email are required.');
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        await showAlert('Passwords do not match.');
        return;
      }
      if (newPassword.length < 6) {
        await showAlert('Password must be at least 6 characters long.');
        return;
      }
    }

    const sessionToken = getSessionToken();
    if (!sessionToken) {
      await showAlert('Session expired. Please login again.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await AuthService.updateOwnProfile(sessionToken, {
        username: trimmedUsername,
        email: trimmedEmail,
        newPassword: newPassword || undefined
      });

      if (!result.success || !result.user) {
        await showAlert('Error updating profile: ' + (result.error || 'Unknown error'));
        return;
      }

      updateCurrentUser(result.user);
      await showAlert('Your profile has been updated.', { title: 'Profile Updated' });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 md:p-8 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close profile editor"
        className="absolute inset-0"
        onClick={handleClose}
      />

      <div className="relative my-4 flex w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-white shadow-2xl dark:bg-[#051923] max-h-[calc(100vh-2.5rem)] md:max-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-white/10">
          <div>
            <h2 className="text-2xl font-black text-ocean-deep dark:text-white">My Profile</h2>
            <p className="mt-1 text-sm text-ocean-deep/60 dark:text-gray-400">
              Update your account details and password.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-ocean-deep dark:text-gray-400">
              Username
            </label>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <UserIcon size={18} className="text-primary-cyan" />
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full bg-transparent text-sm text-ocean-deep outline-none dark:text-white"
                placeholder="Your username"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-ocean-deep dark:text-gray-400">
              Email
            </label>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <Mail size={18} className="text-primary-cyan" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent text-sm text-ocean-deep outline-none dark:text-white"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="rounded-xl border border-primary-cyan/20 bg-primary-cyan/5 p-4 dark:border-primary-cyan/15 dark:bg-primary-cyan/10">
            <div className="mb-3 flex items-center gap-2">
              <KeyRound size={16} className="text-primary-cyan" />
              <h3 className="text-sm font-bold text-ocean-deep dark:text-white">Change Password</h3>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-ocean-deep outline-none focus:ring-2 focus:ring-primary-cyan/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
                placeholder="New password"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-ocean-deep outline-none focus:ring-2 focus:ring-primary-cyan/50 dark:border-white/10 dark:bg-black/20 dark:text-white"
                placeholder="Confirm new password"
              />
              <p className="text-xs text-ocean-deep/55 dark:text-gray-400">
                Leave both password fields blank if you do not want to change it.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-bold uppercase tracking-wide text-ocean-deep/60 dark:text-gray-400">
              Account access
            </p>
            <p className="mt-2 text-sm text-ocean-deep dark:text-white">
              Role: <span className="font-bold capitalize">{String(user.role).replace('_', ' ')}</span>
            </p>
            <p className="mt-1 text-sm text-ocean-deep/70 dark:text-gray-300">
              Chapter: <span className={user.chapterId ? 'font-semibold' : 'font-mono'}>{chapterName || user.chapterId || 'Global access'}</span>
            </p>
          </div>
        </div>

        <div className="shrink-0 flex gap-3 border-t border-gray-200 p-6 dark:border-white/10">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-lg bg-gray-200 px-4 py-3 text-sm font-bold text-ocean-deep transition-colors hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-blue px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-cyan disabled:opacity-60"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};
