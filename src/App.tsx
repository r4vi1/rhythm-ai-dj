import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { Hero } from './components/Hero';
import { AtmosphereBackground } from './components/AtmosphereBackground';
import { SearchBar } from './components/SearchBar';
import { TrackGrid } from './components/TrackGrid';
import { Player } from './components/Player';
import { LoginPage } from './components/LoginPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { authService } from './services/authService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Check if this is a callback URL with code parameter
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('code')) {
        const success = await authService.handleCallback();
        setIsAuthenticated(success);
      } else {
        setIsAuthenticated(authService.isAuthenticated());
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <AtmosphereBackground />
      <Hero />

      <div className="relative z-20 mt-0 md:mt-4">
        <SearchBar />
      </div>

      <TrackGrid />

      <ErrorBoundary>
        <Player />
      </ErrorBoundary>
    </Layout>
  );
}

export default App;
