import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { FavoritesProvider } from './context/FavoritesContext';
import { AuthProvider } from './context/AuthContext';
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

// Layout Manager that hides standard header/footer on full-screen screens
const AppContent: React.FC = () => {
  const { pathname } = useLocation();
  const isImmersiveScreen = pathname === '/welcome' || pathname === '/login';

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600/30 selection:text-white">
      {/* Top Navbar (hidden on full-screen welcome/login screens) */}
      {!isImmersiveScreen && <Navbar />}

      {/* Main Content Viewport */}
      <main className={`flex-1 ${isImmersiveScreen ? '' : 'pb-16 md:pb-0'}`}>
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
      </main>

      {/* Sleek Footer (hidden on full-screen welcome/login screens) */}
      {!isImmersiveScreen && <Footer />}

      {/* Fixed Mobile Bottom Nav (hidden on full-screen welcome/login screens) */}
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
