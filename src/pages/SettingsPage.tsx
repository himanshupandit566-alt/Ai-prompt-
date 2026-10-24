import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';
import { playClickSound, playPopSound, isSoundEnabled, setSoundEnabled } from '../utils/sound';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushNotificationActive,
  isPushSupported
} from '../utils/pushNotifications';
import {
  Camera,
  Calendar,
  Mail,
  User,
  Bell,
  BellOff,
  Shield,
  FileText,
  LogOut,
  Trash2,
  Check,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  Sparkles,
  HardDrive,
  Copy,
  LogIn,
  KeyRound,
  Sun,
  Moon,
  Laptop,
  Volume2,
  VolumeX,
  ExternalLink,
  Smartphone
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isFirebaseActive, updateUserProfile, changePassword, logOut, deleteAccount, loading } = useAuth();
  const { favorites, allPrompts, showToast } = useFavorites();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Form Fields State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');

  // Preferences State
  const [pushNotifications, setPushNotifications] = useState<boolean>(() => isPushNotificationActive());
  const [pushLoading, setPushLoading] = useState(false);
  const [soundActive, setSoundActive] = useState<boolean>(() => isSoundEnabled());

  // Expandable Form Sections
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Modal Dialogs State
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState<'privacy' | 'terms' | null>(null);

  // Synchronize state with current user
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setDob(user.dob || '');
      setAvatarPreview(
        user.photoURL ||
        `https://api.dicebear.com/7.x/identicon/svg?seed=${user.email || user.uid}`
      );
    } else {
      setDisplayName('');
      setEmail('');
      setDob('');
      setAvatarPreview('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80');
    }
  }, [user]);

  // Disable background scrolling when modal is open
  const isAnyModalOpen = logoutModalOpen || deleteModalOpen || !!policyModalOpen;
  useEffect(() => {
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isAnyModalOpen]);

  // Handle Push Notification Toggle
  const handleTogglePushNotifications = async () => {
    playClickSound();
    if (pushLoading) return;

    if (!isPushSupported()) {
      showToast('Push notifications are not supported on this browser/device.', 'error');
      return;
    }

    setPushLoading(true);

    if (!pushNotifications) {
      // Turn ON: request permission, fetch token, register in Firestore
      const res = await subscribeToPushNotifications({
        isGuest: !isAuthenticated,
        uid: user?.uid || null,
      });

      if (res.success) {
        setPushNotifications(true);
        if (isAuthenticated) {
          updateUserProfile({ pushNotifications: true });
        }
        showToast('Push alerts enabled! You will receive trending prompt updates.', 'success');
      } else {
        setPushNotifications(false);
        showToast(res.error || 'Could not enable notifications.', 'error');
      }
    } else {
      // Turn OFF
      await unsubscribeFromPushNotifications();
      setPushNotifications(false);
      if (isAuthenticated) {
        updateUserProfile({ pushNotifications: false });
      }
      showToast('Push notifications disabled for this device.', 'info');
    }

    setPushLoading(false);
  };

  // Handle Sound Effects Toggle
  const handleToggleSound = () => {
    const nextVal = !soundActive;
    setSoundEnabled(nextVal);
    setSoundActive(nextVal);
    if (nextVal) {
      playPopSound();
    }
    showToast(nextVal ? 'Sound effects enabled 🔊' : 'Sound effects muted 🔇', 'info');
  };

  // Handle Avatar Image Upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be smaller than 5MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarPreview(reader.result);
          showToast('Photo selected! Tap "Save Changes" below to update.', 'info');
          setShowProfileEdit(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (!isAuthenticated) {
      showToast('Please Sign In first to update profile details.', 'error');
      navigate('/login');
      return;
    }

    const res = await updateUserProfile({
      displayName: displayName.trim(),
      email: email.trim(),
      dob,
      pushNotifications,
      photoURL: avatarPreview,
    });

    if (res.success) {
      showToast('Profile details updated successfully! ✨', 'success');
      setShowProfileEdit(false);
    } else {
      showToast(res.error || 'Failed to update profile.', 'error');
    }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    const res = await changePassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast('Password successfully changed!', 'success');
      setTimeout(() => setShowPasswordSection(false), 2000);
    } else {
      setPasswordError(res.error || 'Failed to change password.');
    }
  };

  // Log Out Handler
  const handleConfirmLogout = async () => {
    playClickSound();
    await logOut();
    setLogoutModalOpen(false);
    showToast('Logged out of FX Prompty.', 'info');
    navigate('/welcome');
  };

  // Account Deletion Handler
  const handleConfirmDelete = async () => {
    playClickSound();
    await deleteAccount();
    setDeleteModalOpen(false);
    showToast('Your account and personal data have been permanently erased.', 'info');
    navigate('/welcome');
  };

  // Clear Saved Favorites Cache
  const handleClearFavorites = () => {
    playClickSound();
    if (window.confirm('Are you sure you want to clear all saved favorites on this device?')) {
      if (user?.uid) {
        localStorage.removeItem(`favorites_${user.uid}`);
      }
      localStorage.removeItem('promptverse_favorites_v1');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 transition-colors">
      {/* ========================================================= */}
      {/* PAGE HEADER: TITLE + PROMINENT CREATOR ATTRIBUTION        */}
      {/* ========================================================= */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Settings
            </h1>

            {/* Creator Attribution Badge */}
            <a
              href="https://github.com/himanshupandit566-alt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 hover:opacity-90 text-xs font-semibold shadow-sm transition-all group"
              title="Application engineered and designed by Himanshu Pandey"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-slate-600 dark:text-slate-400">created by</span>
              <strong className="text-purple-700 dark:text-purple-200 group-hover:underline">Himanshu Pandey</strong>
            </a>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage your account, appearance, notifications, and app preferences.
          </p>
        </div>

        {/* Cloud Connection Status */}
        <div className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isFirebaseActive ? 'Cloud Sync Active' : 'Offline / Local Sync'}</span>
        </div>
      </div>

      {/* Guest Mode Banner (if not logged in) */}
      {!isAuthenticated && (
        <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-slate-100 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-[#0D0F17] border border-purple-500/25 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Browsing as Guest</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sign in to save prompts across devices, personalize your profile, and unlock full prompt copying.
              </p>
            </div>
          </div>
          <Link
            to="/login"
            onClick={() => playClickSound()}
            className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Register</span>
          </Link>
        </div>
      )}

      {/* ========================================================= */}
      {/* GEMINI-STYLE PROFILE HERO CARD                            */}
      {/* ========================================================= */}
      <div className="mb-8 bg-white dark:bg-[#0D0F17] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-sm dark:shadow-xl relative overflow-hidden backdrop-blur-md transition-colors">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
          {/* Circular Avatar with Camera button */}
          <div className="relative shrink-0 group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 shadow-md">
              <img
                src={avatarPreview || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                alt={displayName || 'User Avatar'}
                className="w-full h-full rounded-full object-cover bg-slate-100 dark:bg-dark-950"
              />
            </div>

            {/* Tap to change avatar */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                fileInputRef.current?.click();
              }}
              title="Change Profile Photo"
              className="absolute bottom-0 right-0 p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-md border-2 border-white dark:border-[#0D0F17] transition-transform active:scale-95 group-hover:scale-105 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Profile Identity Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/25 text-purple-700 dark:text-purple-300 text-[11px] font-bold">
                <Sparkles className="w-3 h-3" />
                {isAuthenticated ? 'FX Creator' : 'Guest Visitor'}
              </span>
              {isAuthenticated && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Verified Member
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {displayName || (isAuthenticated ? 'AI Creator' : 'Guest Visitor')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
              {email || (isAuthenticated ? 'No email linked' : 'No account linked')}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{isAuthenticated ? `Joined: ${user?.createdAt || 'Active'}` : 'Temporary local session'}</span>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowProfileEdit(!showProfileEdit);
                }}
                className="text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer"
              >
                {showProfileEdit ? 'Hide Details' : 'Edit Profile Info'}
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Edit Profile Form */}
        {showProfileEdit && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#07080B] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#07080B] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Date of Birth (DOB)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#07080B] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowProfileEdit(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ========================================================= */}
      {/* GEMINI-STYLE GROUPED SECTIONS                             */}
      {/* ========================================================= */}
      <div className="space-y-8">

        {/* --------------------------------------------------------- */}
        {/* SECTION 1: PREFERENCES                                    */}
        {/* --------------------------------------------------------- */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2.5">
            Preferences
          </h3>

          <div className="bg-white dark:bg-[#0D0F17] border border-slate-200 dark:border-slate-800/80 rounded-3xl divide-y divide-slate-100 dark:divide-slate-800/60 shadow-sm dark:shadow-xl overflow-hidden transition-colors">
            {/* Tile 1: Theme & Appearance (Segmented control) */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  {resolvedTheme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Appearance / Theme
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Switch between Dark mode, Light mode, or follow your System settings.
                  </p>
                </div>
              </div>

              {/* 3-Way Segmented Theme Switcher */}
              <div className="inline-flex self-start sm:self-auto p-1 rounded-2xl bg-slate-100 dark:bg-[#07080B] border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setTheme('system');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    theme === 'system'
                      ? 'bg-white dark:bg-purple-600 text-purple-700 dark:text-white shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Follow Operating System Theme"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>System</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setTheme('dark');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-purple-600 text-white shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Dark Neon Theme"
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setTheme('light');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-white text-purple-700 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Light Crisp Theme"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
              </div>
            </div>

            {/* Tile 2: Universal Push Notifications (Firestore sync + FCM + local alerts) */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  pushNotifications
                    ? 'bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  {pushNotifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Push Notifications
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Get instant alerts about new trending prompts, styles, and updates.
                  </p>
                </div>
              </div>

              {/* Push Toggle Switch */}
              <button
                type="button"
                onClick={handleTogglePushNotifications}
                disabled={pushLoading}
                aria-label="Toggle Push Notifications"
                className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer shrink-0 ${
                  pushNotifications ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                } ${pushLoading ? 'opacity-50 cursor-wait' : ''}`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    pushNotifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Tile 3: Universal Audio Haptic / Sound Effects */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  soundActive
                    ? 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  {soundActive ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Haptic &amp; UI Audio Feedback
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    High-volume tactile mechanical click &amp; pop sounds on buttons and navigation.
                  </p>
                </div>
              </div>

              {/* Sound Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleSound}
                aria-label="Toggle UI Sound Effects"
                className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer shrink-0 ${
                  soundActive ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    soundActive ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* SECTION 2: ACCOUNT                                        */}
        {/* --------------------------------------------------------- */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2.5">
            Account
          </h3>

          <div className="bg-white dark:bg-[#0D0F17] border border-slate-200 dark:border-slate-800/80 rounded-3xl divide-y divide-slate-100 dark:divide-slate-800/60 shadow-sm dark:shadow-xl overflow-hidden transition-colors">
            {/* Tile 1: Security & Password Update */}
            <div>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowPasswordSection(!showPasswordSection);
                }}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Change Password
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Update your account security credentials with re-authentication.
                    </p>
                  </div>
                </div>

                <div className="text-slate-400 pl-2">
                  {showPasswordSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {/* Expandable Password Form */}
              {showPasswordSection && (
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-slate-800/60 space-y-3 bg-slate-50/50 dark:bg-[#07080B]/60">
                  {passwordError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Password successfully updated!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current password"
                        className="w-full px-3 py-2 bg-white dark:bg-[#0D0F17] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3 py-2 bg-white dark:bg-[#0D0F17] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-3 py-2 bg-white dark:bg-[#0D0F17] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleUpdatePassword}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tile 2: Log Out Session Action */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Log Out
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sign out of your active session on this device.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setLogoutModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-500/40 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-colors cursor-pointer shrink-0"
              >
                Log Out
              </button>
            </div>

            {/* Tile 3: Delete Account (Google Play Compliance) */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Delete Account &amp; Data
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Permanently delete your profile, credentials, and synced favorites.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setDeleteModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-xs border border-rose-500/30 transition-colors cursor-pointer shrink-0"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* SECTION 3: STORAGE & CACHE                                */}
        {/* --------------------------------------------------------- */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2.5">
            Storage &amp; Cache
          </h3>

          <div className="bg-white dark:bg-[#0D0F17] border border-slate-200 dark:border-slate-800/80 rounded-3xl divide-y divide-slate-100 dark:divide-slate-800/60 shadow-sm dark:shadow-xl overflow-hidden transition-colors">
            {/* Tile 1: Saved Favorites Storage */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Saved Favorites Cache
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {favorites.length} prompts bookmarked on this account
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearFavorites}
                disabled={favorites.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-500/30 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Clear Cache</span>
              </button>
            </div>

            {/* Tile 2: Available Offline Library */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Curated Prompt Library
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {allPrompts.length} high-resolution prompts indexed for instant copy
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25 shrink-0">
                Offline Ready
              </span>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* SECTION 4: ABOUT & POLICIES                               */}
        {/* --------------------------------------------------------- */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2.5">
            About &amp; Policies
          </h3>

          <div className="bg-white dark:bg-[#0D0F17] border border-slate-200 dark:border-slate-800/80 rounded-3xl divide-y divide-slate-100 dark:divide-slate-800/60 shadow-sm dark:shadow-xl overflow-hidden transition-colors">
            {/* Tile 1: Creator Attribution Tile */}
            <a
              href="https://github.com/himanshupandit566-alt"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playClickSound()}
              className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Created by Himanshu Pandey
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Engineered &amp; designed for the global AI creative community. Tap to view GitHub profile.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-xs font-semibold pl-2">
                <span>GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>

            {/* Tile 2: Privacy Policy Modal Trigger */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setPolicyModalOpen('privacy');
              }}
              className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02] text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Privacy Policy
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Learn how your profile, storage, and device push preferences are protected.
                  </p>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
            </button>

            {/* Tile 3: Terms of Service Modal Trigger */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setPolicyModalOpen('terms');
              }}
              className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02] text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Terms of Service
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Review prompt usage rights, creative license guidelines, and terms.
                  </p>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
            </button>

            {/* Tile 4: App Version & Build */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    FX Prompty Release
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Progressive Web App • Production Build
                  </p>
                </div>
              </div>

              <span className="font-mono text-purple-700 dark:text-purple-300 font-bold bg-purple-500/10 dark:bg-purple-500/20 px-2.5 py-1 rounded-md border border-purple-500/30 text-xs shrink-0">
                v1.0.0
              </span>
            </div>
          </div>
        </div>

        {/* Footer Creator Attribution in Settings */}
        <div className="pt-4 pb-12 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
          <p>
            FX Prompty • Discover, Copy &amp; Create with AI
          </p>
          <p>
            App designed and engineered by{' '}
            <a
              href="https://github.com/himanshupandit566-alt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
            >
              Himanshu Pandey
            </a>
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CONFIRMATION MODALS (Mounted directly to <body> via Portal) */}
      {/* ========================================================= */}

      {/* Log Out Modal */}
      {logoutModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              playClickSound();
              setLogoutModalOpen(false);
            }
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0D0F17] border border-purple-500/40 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl text-center relative animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setLogoutModalOpen(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <LogOut className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Log Out?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Kya aap sach me FX Prompty se log out karna chahte hain?
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setLogoutModalOpen(false);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-dark-900 hover:bg-slate-200 dark:hover:bg-dark-850 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Account Modal */}
      {deleteModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              playClickSound();
              setDeleteModalOpen(false);
            }
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0D0F17] border border-rose-500/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl text-center relative animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setDeleteModalOpen(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Delete Your Account?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              This request permanently deletes your account and personal data in full compliance with Google Play Store data safety guidelines. This action cannot be undone.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setDeleteModalOpen(false);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-dark-900 hover:bg-slate-200 dark:hover:bg-dark-850 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Keep Account
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Privacy Policy & Terms Modal */}
      {policyModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              playClickSound();
              setPolicyModalOpen(null);
            }
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0D0F17] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setPolicyModalOpen(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {policyModalOpen === 'privacy' ? (
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>Privacy Policy</span>
                </h3>
                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>
                    <strong>1. Overview:</strong> FX Prompty, developed by Himanshu Pandey, values your creative freedom and privacy. We do not sell or monetize personal browsing history.
                  </p>
                  <p>
                    <strong>2. Data We Store:</strong> Your profile data (name, email, avatar, DOB) is stored safely and synchronized via Firebase authentication and Firestore database when connected.
                  </p>
                  <p>
                    <strong>3. Cookies &amp; Storage:</strong> Local storage is strictly used for device theme preferences, push notification subscriber state, and your isolated prompt favorites cache.
                  </p>
                  <p>
                    <strong>4. Account Deletion:</strong> You have the complete right to erase all data at any moment using the Delete Account option in the Account section.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Terms of Service</span>
                </h3>
                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>
                    <strong>1. Usage:</strong> FX Prompty offers curated text prompts for AI models including Midjourney, Flux.1, DALL-E 3, and Stable Diffusion.
                  </p>
                  <p>
                    <strong>2. Open Creative Access:</strong> All prompts are open to copy, refine, and utilize in personal and commercial art projects for authenticated members.
                  </p>
                  <p>
                    <strong>3. Community Standards:</strong> Any custom submissions must comply with responsible generative AI usage standards.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setPolicyModalOpen(null);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
