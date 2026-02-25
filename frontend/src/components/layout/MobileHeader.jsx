import { Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function MobileHeader() {
    const { toggleSidebar } = useAuth(); // We'll manage mobile sidebar state in AuthContext for convenience or a separate UI context

    return (
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-gray-200">
            <button
                onClick={toggleSidebar}
                className="p-2 -ml-2 text-text-muted hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
                aria-label="Toggle Menu"
            >
                <Menu className="w-6 h-6" />
            </button>
            <div className="font-semibold text-lg text-text-main flex items-center gap-2">
                <span className="text-xl">📦</span> Joyspoon
            </div>
            <div className="w-8"></div> {/* Spacer for centering */}
        </header>
    );
}
