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

  useEffect(() => {
    // Check for OAuth callback
    const isCallback = authService.handleCallback();
    if (isCallback) {
      // Clear hash is handled in service, just update state
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(authService.isAuthenticated());
    }
  }, []);

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
