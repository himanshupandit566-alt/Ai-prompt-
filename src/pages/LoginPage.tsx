import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { saveRuntimeFirebaseConfig } from '../firebase';
import { playClickSound, playPopSound } from '../utils/sound';
import { AppLogo } from '../components/AppLogo';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  X,
  Compass,
  Key
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    continueAsGuest,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPasswordReset,
    loading
  } = useAuth();
  const { showToast } = useFavorites();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Error & Status Messages
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  // Firebase Setup Modal State (shown when Firebase config is missing)
  const [firebaseConfigModal, setFirebaseConfigModal] = useState(false);
  const [cfgApiKey, setCfgApiKey] = useState('');
  const [cfgAuthDomain, setCfgAuthDomain] = useState('');
  const [cfgProjectId, setCfgProjectId] = useState('');
  const [cfgAppId, setCfgAppId] = useState('');

  // Auto-skip Login Screen if user is already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  // Email format validator
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const validateInputs = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setErrorMessage('');

    if (!email.trim()) {
      setEmailError('Kripya ek valid email address enter karein.');
      isValid = false;
    } else if (!isValidEmail(email.trim())) {
      setEmailError('Kripya ek valid email address enter karein.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Kripya password enter karein.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password kam se kam 6 characters ka hona chahiye.');
      isValid = false;
    }

    if (mode === 'signup') {
      if (!displayName.trim()) {
        setErrorMessage('Kripya apna poora naam enter karein.');
        isValid = false;
      } else if (password !== confirmPassword) {
        setErrorMessage('Passwords match nahi ho rahe hain.');
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (!validateInputs()) return;

    if (mode === 'signup') {
      const res = await signUpWithEmail(displayName, email, password);
      if (res.success) {
        showToast(`Account successfully ban gaya! Welcome ${displayName}! 🎉`, 'success');
        navigate('/');
      } else {
        if (res.error === 'FIREBASE_NOT_CONFIGURED') {
          setFirebaseConfigModal(true);
        } else if (res.code === 'auth/operation-not-allowed') {
          setErrorMessage('Email/Password registration Firebase Console me enabled nahi hai. Kripya Firebase Console > Authentication > Sign-in method me jakar "Email/Password" enable karein, ya fir Google se 1-click Sign In karein.');
        } else if (res.code === 'auth/email-already-in-use') {
          setErrorMessage('Is email se pehle se account bana hua hai. Kripya Sign In karein.');
        } else {
          setErrorMessage(res.error || 'Kuch galat hua. Kripya punah prayas karein.');
        }
      }
    } else {
      const res = await signInWithEmail(email, password);
      if (res.success) {
        showToast('Successfully signed in! ✨', 'success');
        navigate('/');
      } else {
        if (res.error === 'FIREBASE_NOT_CONFIGURED') {
          setFirebaseConfigModal(true);
        } else if (res.code === 'auth/operation-not-allowed') {
          setErrorMessage('Email/Password sign-in Firebase Console me enabled nahi hai. Kripya Firebase Console > Authentication > Sign-in method me jakar "Email/Password" enable karein, ya fir Google se 1-click Sign In karein.');
        } else if (res.code === 'auth/user-not-found') {
          setErrorMessage('Account nahi mila, please sign up karein (Sign up please)');
        } else if (res.code === 'auth/wrong-password') {
          setErrorMessage('Galat password ya email!');
        } else if (res.code === 'auth/invalid-credential' || res.code === 'auth/invalid-login-credentials') {
          setErrorMessage('Galat password ya email! Pehle check karein ya Sign Up karein.');
        } else {
          setErrorMessage(
            res.error || 'Kuch galat hua. Kripya punah prayas karein.'
          );
        }
      }
    }
  };

  const handleGoogleSignIn = async () => {
    playClickSound();
    setErrorMessage('');
    setEmailError('');
    setPasswordError('');

    const res = await signInWithGoogle();
    if (res.success) {
      showToast('Google account se real data successfully link ho gaya! 🚀', 'success');
      navigate('/');
    } else {
      if (res.error === 'FIREBASE_NOT_CONFIGURED') {
        setFirebaseConfigModal(true);
      } else {
        setErrorMessage(res.error || 'Google Sign-In failed.');
      }
    }
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfgApiKey.trim() || !cfgProjectId.trim()) {
      showToast('API Key aur Project ID dono required hain', 'error');
      return;
    }

    const saved = saveRuntimeFirebaseConfig({
      apiKey: cfgApiKey.trim(),
      authDomain: cfgAuthDomain.trim() || `${cfgProjectId.trim()}.firebaseapp.com`,
      projectId: cfgProjectId.trim(),
      appId: cfgAppId.trim(),
    });

    if (saved) {
      showToast('Firebase Config saved! Reloading...', 'success');
    }
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!resetEmail.trim() || !isValidEmail(resetEmail.trim())) {
      setResetError('Kripya ek valid email address enter karein.');
      return;
    }

    const res = await sendPasswordReset(resetEmail.trim());
    if (res.success) {
      setResetSuccess(true);
      showToast('Password reset link aapke email par bhej diya gaya hai!', 'info');
      setTimeout(() => {
        setForgotModalOpen(false);
        setResetSuccess(false);
      }, 3000);
    } else {
      if (res.error === 'FIREBASE_NOT_CONFIGURED') {
        setFirebaseConfigModal(true);
      } else {
        setResetError(res.error || 'Password reset link bhejne me asafal.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#07080B] text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Neon Glowing Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-purple-600/15 via-indigo-600/15 to-blue-600/15 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* Brand Logo Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <AppLogo size={46} className="group-hover:scale-105 transition-transform" />
          <span className="font-extrabold text-2xl tracking-tight text-white">
            FX <span className="text-purple-400">Prompty</span>
          </span>
        </Link>
        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {mode === 'login' ? 'Sign In to FX Prompty' : 'Create an Account'}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          {mode === 'login'
            ? 'Sign in to access your saved prompts & favorites.'
            : 'Join thousands of AI prompt creators and enthusiasts.'}
        </p>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#0D0F17]/95 border border-slate-800 backdrop-blur-2xl py-7 px-6 sm:px-8 shadow-2xl rounded-3xl relative">
          {/* Mode Switcher Tabs (Sign In / Sign Up) */}
          <div className="flex bg-[#07080B] p-1.5 rounded-2xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                playPopSound(0.05);
                setMode('login');
                setErrorMessage('');
                setEmailError('');
                setPasswordError('');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                playPopSound(0.05);
                setMode('signup');
                setErrorMessage('');
                setEmailError('');
                setPasswordError('');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Strict Clear Red Alert Box */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex flex-col gap-2.5 modal-spring shadow-lg shadow-rose-950/30">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 flex-1">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="font-medium leading-relaxed">{errorMessage}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage('')}
                  className="text-rose-400 hover:text-rose-200 p-0.5 cursor-pointer shrink-0"
                  title="Close alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action Buttons inside Alert */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-rose-500/20">
                {/* Google Sign In Quick Action if Email/Password is disabled in Firebase */}
                {errorMessage.includes('Firebase Console me enabled nahi hai') && (
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="px-3 py-1.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Continue with Google (1-Tap) →</span>
                  </button>
                )}

                {/* Sign Up switch action */}
                {(mode === 'login' && (errorMessage.includes('Sign up') || errorMessage.includes('sign up') || errorMessage.includes('exist nahi karta'))) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMessage('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/35 text-rose-200 font-semibold text-xs border border-rose-500/35 transition-all cursor-pointer"
                  >
                    Pehle Sign Up Karein →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name (Only in Sign Up mode) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#07080B] border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Email Field with Inline Error Validation */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-[#07080B] border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                    emailError
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                  }`}
                />
              </div>
              {emailError && (
                <p className="mt-1.5 text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetError('');
                      setResetSuccess(false);
                      setForgotModalOpen(true);
                    }}
                    className="text-[11px] font-medium text-purple-400 hover:text-purple-300 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="At least 6 characters"
                  className={`w-full pl-10 pr-10 py-2.5 bg-[#07080B] border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                    passwordError
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1.5 text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            {/* Confirm Password (Only in Sign Up mode) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#07080B] border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm shadow-[0_0_25px_-5px_rgba(139,92,246,0.6)] hover:shadow-[0_0_35px_-5px_rgba(139,92,246,0.8)] transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-[#0D0F17] px-3 text-slate-500 font-bold">
                OR CONTINUE WITH
              </span>
            </div>
          </div>

          {/* Single-Tap Real Google Sign-In Button (Opens Google Native Account Picker) */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#07080B] hover:bg-[#131622] border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-3 active:scale-98 shadow-sm cursor-pointer group"
          >
            {/* Official Google Vector Icon */}
            <svg className="w-4 h-4 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Skip link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                continueAsGuest();
                navigate('/');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-purple-400 transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Continue as Guest without account →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D0F17] border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your registered email address to receive password reset instructions.
            </p>

            {resetError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password reset link sent! Check your email.</span>
              </div>
            ) : (
              <form onSubmit={handleSendReset} className="space-y-3">
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full px-4 py-2.5 bg-[#07080B] border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Firebase Setup Modal (Opens if Firebase keys are missing) */}
      {firebaseConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D0F17] border border-purple-500/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setFirebaseConfigModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center mb-4">
              <Key className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">
              Real Firebase Setup Required
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Real Google Sign-In aur Firestore sync chalane ke liye aapko apne Firebase Project ke credentials link karne honge.
            </p>

            <form onSubmit={handleSaveFirebaseConfig} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Firebase API Key (apiKey)
                </label>
                <input
                  type="text"
                  required
                  value={cfgApiKey}
                  onChange={(e) => setCfgApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2 bg-[#07080B] border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Project ID (projectId)
                </label>
                <input
                  type="text"
                  required
                  value={cfgProjectId}
                  onChange={(e) => setCfgProjectId(e.target.value)}
                  placeholder="e.g. fx-prompty-ai"
                  className="w-full px-3.5 py-2 bg-[#07080B] border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Auth Domain (Optional)
                </label>
                <input
                  type="text"
                  value={cfgAuthDomain}
                  onChange={(e) => setCfgAuthDomain(e.target.value)}
                  placeholder="fx-prompty-ai.firebaseapp.com"
                  className="w-full px-3.5 py-2 bg-[#07080B] border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  App ID (Optional)
                </label>
                <input
                  type="text"
                  value={cfgAppId}
                  onChange={(e) => setCfgAppId(e.target.value)}
                  placeholder="1:123456789:web:abcdef..."
                  className="w-full px-3.5 py-2 bg-[#07080B] border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFirebaseConfigModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#07080B] hover:bg-white/5 border border-slate-800 text-xs font-semibold text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  Save &amp; Connect Real Firebase
                </button>
              </div>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              💡 Ya fir project root me <code>.env</code> file banakar <code>VITE_FIREBASE_API_KEY</code> aur <code>VITE_FIREBASE_PROJECT_ID</code> enter kar dein.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
