import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { FavoritesProvider } from './context/FavoritesContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';

// Pages
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { PromptDetailPage } from './pages/PromptDetailPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { CategoryPage } from './pages/CategoryPage';
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
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // 1. Logged in user: Skip welcome and login pages straight to Home
    if (isAuthenticated) {
      if (pathname === '/welcome' || pathname === '/login') {
        navigate('/', { replace: true });
      }
      return;
    }

    // 2. Unauthenticated user: App open hote hi sabse pehle 'Get Started' landing screen open ho
    if (!isAuthenticated && pathname === '/') {
      navigate('/welcome', { replace: true });
    }
  }, [isAuthenticated, loading, pathname, navigate]);

  return null;
};

// Layout Manager with Smooth Slide & Fade Page Transition & Glassmorphism
const AppContent: React.FC = () => {
  const { pathname } = useLocation();
  const isImmersiveScreen = pathname === '/welcome' || pathname === '/login';

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600/30 selection:text-white">
      <OnboardingGateway />

      {/* Top Navbar with Glassmorphism (hidden on full-screen welcome/login screens) */}
      {!isImmersiveScreen && <Navbar />}

      {/* Main Content Viewport with Smooth Page Slide & Fade Transition */}
      <main className={`flex-1 ${isImmersiveScreen ? '' : 'pb-20 md:pb-0'}`}>
        <div key={pathname} className="page-transition">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/prompt/:id" element={<PromptDetailPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
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
    <FavoritesProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </FavoritesProvider>
  );
};

export default App;
