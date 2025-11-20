
import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { Hero } from './components/Hero';
import { AtmosphereBackground } from './components/AtmosphereBackground';
import { PlaybackMonitor } from './components/PlaybackMonitor';
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
      const code = urlParams.get('code');

      if (code) {
        console.log('Processing OAuth callback with code:', code.substring(0, 20) + '...');

        // Clean URL immediately to prevent reuse
        const currentPath = window.location.pathname;
        window.history.replaceState({}, document.title, currentPath);

        // Pass the extracted code to handleCallback
        const success = await authService.handleCallbackWithCode(code);
        console.log('Callback result:', success);
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
    <>
      <Layout>
        <Hero />
        <PlaybackMonitor />
        <div className="relative z-10 flex flex-col h-full">
          <SearchBar />
        </div>

        <TrackGrid />
      </Layout>

      <ErrorBoundary>
        <Player />
      </ErrorBoundary>
    </>
  );
}

export default App;
