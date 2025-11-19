import React from 'react';
import { Menu } from 'lucide-react';
import { MagneticButton } from './MagneticButton';
import { Logo } from './Logo';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-background text-white font-sans selection:bg-primary selection:text-black noise-bg">
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between mix-blend-difference">
                <Logo />

                <MagneticButton className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Menu className="w-6 h-6" />
                </MagneticButton>
            </header>

            {/* Main Content */}
            <main className="relative z-10 pt-20 pb-32 px-4 md:px-8 max-w-[1920px] mx-auto">
                {children}
            </main>

            {/* Decorative Grid Lines */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-10">
                <div className="absolute left-8 top-0 bottom-0 w-px bg-white" />
                <div className="absolute right-8 top-0 bottom-0 w-px bg-white" />
                <div className="absolute left-1/4 top-0 bottom-0 w-px bg-white hidden md:block" />
                <div className="absolute right-1/4 top-0 bottom-0 w-px bg-white hidden md:block" />
            </div>
        </div>
    );
};
