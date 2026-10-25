import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';
import { SplashScreen } from './components/SplashScreen';

// Pages
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { PromptDetailPage } from './pages/PromptDetailPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Scroll to top on navigation
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Initial Onboarding Gateway:
// - Agar user logged-in nahi hai, to app open hote hi pehle 'Get Started' landing (/welcome) open hoti hai.
// - Jab login ho jata hai, session persist rehta hai aur app direct Home Screen kholti hai.
const OnboardingGateway: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isGuest, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // 1. Logged in user: Skip welcome and login pages straight to Home
    if (isAuthenticated) {
      if (pathname === '/welcome' || pathname === '/login') {
        navigate('/', { replace: true });
      }
      return;
    }

    // 2. Guest session: Allow navigating anywhere without forcing back to welcome screen
    if (isGuest) {
      if (pathname === '/welcome') {
        navigate('/', { replace: true });
      }
      return;
    }

    // 3. Unauthenticated first-time user: App open hote hi sabse pehle 'Get Started' landing screen open ho
    if (!isAuthenticated && !isGuest && pathname === '/') {
      navigate('/welcome', { replace: true });
    }
  }, [isAuthenticated, isGuest, loading, pathname, navigate]);

  return null;
};

// Layout Manager with Smooth Slide & Fade Page Transition & Glassmorphism
const AppContent: React.FC = () => {
  const { pathname } = useLocation();
  const { loading, isAuthenticated, isGuest } = useAuth();

  // 1. Splash Screen: When authentication status is being checked (loading === true),
  // show high-tech dark-neon splash screen. This eliminates the flash of Home Screen before Welcome Screen.
  if (loading) {
    return <SplashScreen />;
  }

  const isImmersiveScreen = pathname === '/welcome' || pathname === '/login';

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-purple-600/30 selection:text-white transition-colors duration-200">
      <OnboardingGateway />

      {/* Top Navbar with Glassmorphism (hidden on full-screen welcome/login screens) */}
      {!isImmersiveScreen && <Navbar />}

      {/* Main Content Viewport with Smooth Page Slide & Fade Transition */}
      <main className={`flex-1 ${isImmersiveScreen ? '' : 'pb-20 md:pb-0'}`}>
        <div key={pathname} className="page-transition">
          <Routes>
            <Route
              path="/"
              element={
                !isAuthenticated && !isGuest ? <WelcomePage /> : <HomePage />
              }
            />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/prompt/:id" element={<PromptDetailPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/category/:slug" element={<Navigate to="/explore" replace />} />
            <Route path="/category" element={<Navigate to="/explore" replace />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>

      {/* Sleek Footer (hidden on full-screen welcome/login screens) */}
      {!isImmersiveScreen && <Footer />}

      {/* Fixed Mobile Bottom Nav with Glassmorphism (hidden on full-screen welcome/login screens) */}
      {!isImmersiveScreen && <BottomNav />}

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FavoritesProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AppContent />
          </BrowserRouter>
        </FavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
