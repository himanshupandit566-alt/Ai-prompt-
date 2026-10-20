import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
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
  X,
  Sparkles,
  HardDrive,
  Copy,
  LogIn,
  KeyRound
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isFirebaseActive, updateUserProfile, changePassword, logOut, deleteAccount, loading } = useAuth();
  const { favorites, allPrompts, showToast } = useFavorites();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Form Fields State (strictly initialized from currently logged-in user, never hardcoded)
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [pushNotifications, setPushNotifications] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Keep state synchronized with current user
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setDob(user.dob || '');
      setPushNotifications(user.pushNotifications ?? true);
      setAvatarPreview(
        user.photoURL ||
        `https://api.dicebear.com/7.x/identicon/svg?seed=${user.email || user.uid}`
      );
    } else {
      setDisplayName('');
      setEmail('');
      setDob('');
      setPushNotifications(true);
      setAvatarPreview('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80');
    }
  }, [user]);

  // Change Password Section Expandable State
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Modal Dialogs State
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState<'privacy' | 'terms' | null>(null);

  // Handle Avatar Image Upload from Device Gallery
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size 5MB se chhota hona chahiye.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarPreview(reader.result);
          showToast('Photo select ho gayi! Niche "Save Changes" dabakar save karein.', 'info');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Kripya pehle Sign In karein taaki profile save ho sake.', 'error');
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
      showToast('Profile details Firestore & Storage me save ho gayi! ✨', 'success');
    } else {
      showToast(res.error || 'Profile update karne me samasya aayi.', 'error');
    }
  };

  // Handle Password Update with Re-authentication
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Kripya current password enter karein.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Naya password kam se kam 6 characters ka hona chahiye.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Naye passwords match nahi ho rahe hain.');
      return;
    }

    const res = await changePassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast('Password successfully change ho gaya!', 'success');
      setTimeout(() => setShowPasswordSection(false), 2000);
    } else {
      setPasswordError(res.error || 'Password badalne me asafal.');
    }
  };

  // Handle Log Out Confirmation & Redirect to Welcome
  const handleConfirmLogout = async () => {
    await logOut();
    setLogoutModalOpen(false);
    showToast('FX Prompty se log out ho gaye.', 'info');
    navigate('/welcome');
  };

  // Handle Account Deletion conforming to Google Play Store guidelines
  const handleConfirmDelete = async () => {
    await deleteAccount();
    setDeleteModalOpen(false);
    showToast('Aapka account aur personal data permanently delete kar diya gaya hai.', 'info');
    navigate('/welcome');
  };

  // Clear Saved Favorites Cache
  const handleClearFavorites = () => {
    if (window.confirm('Kya aap sabhi saved favorites clear karna chahte hain?')) {
      localStorage.removeItem('promptverse_favorites_v1');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-slate-100 font-sans">
      {/* Page Title & Cloud Status */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Settings &amp; Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your personal profile, credentials, and app preferences.
          </p>
        </div>

        {/* Dynamic Firebase / Local indicator */}
        <div className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{isFirebaseActive ? 'Firebase Auth Connected' : 'Local Auth Sync Active'}</span>
        </div>
      </div>

      {/* Guest Warning / Sign-In Promotion Banner if not authenticated */}
      {!isAuthenticated && (
        <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-[#0D0F17] border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">You are browsing as Guest</p>
              <p className="text-xs text-slate-400">
                Sign in or create an account to customize your profile, sync favorites across devices, and manage settings.
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Register</span>
          </Link>
        </div>
      )}

      <div className="space-y-6">
        {/* ========================================================= */}
        {/* 1. PROFILE HEADER SECTION (Avatar + Camera Icon + Dynamic Info) */}
        {/* ========================================================= */}
        <div className="bg-[#0D0F17] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-0" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Circular Avatar with Camera / Edit Button */}
            <div className="relative shrink-0 group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 shadow-[0_0_30px_-5px_rgba(139,92,246,0.6)]">
                <img
                  src={avatarPreview || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                  alt={displayName || 'User Avatar'}
                  className="w-full h-full rounded-full object-cover bg-dark-950"
                />
              </div>

              {/* Camera Icon Button (Tap to select photo from gallery) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Change Profile Photo"
                className="absolute bottom-1 right-1 p-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg border-2 border-[#0D0F17] transition-transform active:scale-95 group-hover:scale-105 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Display Name & Email (Dynamically rendered) */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3 h-3" /> FX Creator
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {displayName || (isAuthenticated ? 'New Creator' : 'Guest Visitor')}
              </h2>
              <p className="text-sm text-slate-400 font-mono mt-0.5">
                {email || (isAuthenticated ? 'No email linked' : 'Not signed in')}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {isAuthenticated ? (
                  <>Member since {user?.createdAt || 'Today'} • Firestore Sync</>
                ) : (
                  <>Local guest session • Data saved locally</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. ACCOUNT DETAILS & EDIT SECTION */}
        {/* ========================================================= */}
        <form onSubmit={handleSaveProfile} className="bg-[#0D0F17] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4">
            <User className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Account Details &amp; Personal Info
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Display Name Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#07080B] border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Email Address Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#07080B] border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Date of Birth (DOB) Field with Native Calendar Picker Dialogue */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Date of Birth (DOB)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#07080B] border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all [color-scheme:dark]"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Tap to open calendar picker dialogue
              </p>
            </div>

            {/* User ID & Role Badge */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                User ID &amp; Cloud Status
              </label>
              <div className="px-4 py-2.5 bg-[#07080B] border border-slate-800 rounded-xl text-sm text-slate-400 flex items-center justify-between">
                <span className="font-mono text-xs text-purple-300 truncate max-w-[170px]">
                  {user?.uid || 'guest-session'}
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                  {isAuthenticated ? 'Authenticated' : 'Guest'}
                </span>
              </div>
            </div>
          </div>

          {/* Change Password Expandable Section */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-[#07080B]/60">
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-purple-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">Change Password</p>
                  <p className="text-xs text-slate-500">Update your account credentials with re-authentication</p>
                </div>
              </div>
              {showPasswordSection ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showPasswordSection && (
              <div className="p-4 pt-2 border-t border-slate-800/80 space-y-3 bg-[#07080B]">
                {passwordError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Password successfully update ho gaya!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current password"
                      className="w-full px-3 py-2 bg-[#0D0F17] border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 bg-[#0D0F17] border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3 py-2 bg-[#0D0F17] border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
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

          {/* Neon Purple Gradient 'Save Changes' Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm shadow-[0_0_25px_-5px_rgba(139,92,246,0.6)] hover:shadow-[0_0_35px_-5px_rgba(139,92,246,0.8)] transition-all active:scale-98 flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>

        {/* ========================================================= */}
        {/* 3. PREFERENCES & APP SETTINGS SECTION */}
        {/* ========================================================= */}
        <div className="bg-[#0D0F17] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4">
            <Bell className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Preferences &amp; Policies
            </h3>
          </div>

          <div className="space-y-4">
            {/* Push Notifications Toggle Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#07080B] border border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${pushNotifications ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                  {pushNotifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Push Notifications</p>
                  <p className="text-xs text-slate-500">
                    Get notifications about trending AI prompts and new weekly styles.
                  </p>
                </div>
              </div>

              {/* Modern Switch */}
              <button
                type="button"
                onClick={() => {
                  const nextVal = !pushNotifications;
                  setPushNotifications(nextVal);
                  if (isAuthenticated) {
                    updateUserProfile({ pushNotifications: nextVal });
                  }
                  showToast(nextVal ? 'Push notifications enabled' : 'Push notifications disabled', 'info');
                }}
                className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                  pushNotifications ? 'bg-purple-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    pushNotifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Quick Policy & Terms Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPolicyModalOpen('privacy')}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#07080B] hover:bg-white/5 border border-slate-800 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">Privacy Policy</span>
                </div>
                <span className="text-purple-400 text-[11px]">Read →</span>
              </button>

              <button
                type="button"
                onClick={() => setPolicyModalOpen('terms')}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#07080B] hover:bg-white/5 border border-slate-800 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold">Terms of Service</span>
                </div>
                <span className="text-purple-400 text-[11px]">Read →</span>
              </button>
            </div>

            {/* App Version Display */}
            <div className="flex items-center justify-between py-2 text-xs text-slate-500 border-t border-slate-800/60 mt-4">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> FX Prompty Production Release
              </span>
              <span className="font-mono text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                v1.0.0
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. STORAGE & FAVORITES CACHE */}
        {/* ========================================================= */}
        <div className="bg-[#0D0F17] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4 mb-4">
            <HardDrive className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Library Storage &amp; Cache
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-[#07080B] rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-500">Saved Favorites</span>
              <p className="text-xl font-bold text-rose-400 mt-0.5">{favorites.length}</p>
            </div>
            <div className="p-3 bg-[#07080B] rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-500">Available Prompts</span>
              <p className="text-xl font-bold text-purple-400 mt-0.5">{allPrompts.length}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearFavorites}
            disabled={favorites.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-850 hover:bg-rose-950/30 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Clear Saved Favorites</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* 5. DANGER ZONE & SESSION MANAGEMENT */}
        {/* ========================================================= */}
        <div className="bg-[#0D0F17] border border-rose-950/40 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-rose-950/40 pb-4">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Danger Zone &amp; Session Management
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Manage your active session or submit an account deletion request adhering to Google Play Store data safety guidelines.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Sleek Log Out Button */}
            <button
              type="button"
              onClick={() => setLogoutModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-rose-500/50 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 font-semibold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>

            {/* Delete Account Request Button */}
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 border border-rose-600/40 text-rose-400 font-semibold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CONFIRMATION MODALS */}
      {/* ========================================================= */}

      {/* Log Out Confirmation Dialog */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D0F17] border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Are you sure you want to log out?</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Confirm karne par aapka active session clear ho jayega aur aap Welcome screen par redirect ho jayenge.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#07080B] hover:bg-white/5 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Dialog */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D0F17] border border-rose-900/60 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delete Your Account?</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              This request permanently deletes your account and personal data in full compliance with Google Play Store data safety guidelines. This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#07080B] border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Keep Account
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/40 cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy & Terms Modal */}
      {policyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D0F17] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setPolicyModalOpen(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {policyModalOpen === 'privacy' ? (
              <div>
                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span>Privacy Policy</span>
                </h3>
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <p>
                    <strong>1. Overview:</strong> FX Prompty respects your privacy. We do not sell your personal data or prompt history to any advertising third parties.
                  </p>
                  <p>
                    <strong>2. Data We Store:</strong> Your profile data (name, email, avatar, DOB) is stored locally on your device and synchronized through standard Firebase authentication and Firestore database when configured.
                  </p>
                  <p>
                    <strong>3. Cookies &amp; Storage:</strong> We use local storage purely to remember your saved prompt favorites and application theme preferences.
                  </p>
                  <p>
                    <strong>4. Account Deletion:</strong> Users retain full control over their data and can request instantaneous data deletion at any time in the Danger Zone section.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span>Terms of Service</span>
                </h3>
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <p>
                    <strong>1. Usage:</strong> FX Prompty provides curated text prompts for AI image generation systems (Midjourney, Flux, DALL-E 3, SDXL).
                  </p>
                  <p>
                    <strong>2. Free &amp; Open Access:</strong> Prompts are free to browse, copy, and modify for both personal and commercial creative projects.
                  </p>
                  <p>
                    <strong>3. Community Guidelines:</strong> Users generating or contributing custom prompts must refrain from illegal or abusive prompt formulations.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setPolicyModalOpen(null)}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
