import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { spotifyAuthService } from '../services/authService';

export const CallbackPage: React.FC = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

    useEffect(() => {
        const handleAuth = async () => {
            try {
                const success = await spotifyAuthService.handleCallback();
                if (success) {
                    setStatus('success');
                    setTimeout(() => navigate('/'), 1500);
                } else {
                    setStatus('error');
                }
            } catch (error) {
                console.error('Auth callback error:', error);
                setStatus('error');
            }
        };

        handleAuth();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                {status === 'processing' && (
                    <>
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <h2 className="font-display text-2xl uppercase tracking-tight text-white mb-2">
                            Connecting to Spotify...
                        </h2>
                        <p className="text-white/60">Please wait</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="font-display text-2xl uppercase tracking-tight text-white mb-2">
                            Connected!
                        </h2>
                        <p className="text-white/60">Redirecting...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="font-display text-2xl uppercase tracking-tight text-white mb-2">
                            Connection Failed
                        </h2>
                        <p className="text-white/60 mb-4">Please try again</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-primary text-black font-display uppercase tracking-wider hover:bg-white transition-colors"
                        >
                            Go Back
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
