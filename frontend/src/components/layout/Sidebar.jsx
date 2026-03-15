import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    BarChart2,
    Settings,
    Receipt,
    TrendingUp,
    CreditCard,
    X,
    ChevronRight,
    ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for Tailwind classes
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Sidebar() {
    const { isSidebarOpen, toggleSidebar } = useAuth();

    // State for open folders
    const [openFolders, setOpenFolders] = useState({
        productivity: true,
        expenses: false,
        finance: false,
        sales: false
    });

    const toggleFolder = (folder) => {
        setOpenFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
    };

    const NavItem = ({ to, icon: Icon, children, onClick }) => (
        <NavLink
            to={to}
            onClick={() => {
                if (onClick) onClick();
                // Close sidebar on mobile after navigating
                if (window.innerWidth < 768) toggleSidebar();
            }}
            className={({ isActive }) => cn(
                "flex md:pl-9 pl-8 py-2.5 items-center gap-3 text-sm font-medium transition-all duration-200 rounded-md mx-2",
                isActive
                    ? "bg-blue-50 text-primary-dark"
                    : "text-text-muted hover:bg-gray-50 hover:text-text-main"
            )}
        >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
            {children}
        </NavLink>
    );

    const Folder = ({ title, icon: Icon, folderKey, children }) => {
        const isOpen = openFolders[folderKey];

        return (
            <div className="mb-1">
                <button
                    onClick={() => toggleFolder(folderKey)}
                    className={cn(
                        "w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors duration-200 hover:bg-gray-50",
                        isOpen ? "text-primary" : "text-text-main"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 opacity-80" />
                        {title}
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4 opacity-70" /> : <ChevronRight className="w-4 h-4 opacity-70" />}
                </button>
                <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isOpen ? "max-h-48 opacity-100 mt-1" : "max-h-0 opacity-0"
                )}>
                    {children}
                </div>
            </div>
        );
    };

    const SingleItem = ({ to, icon: Icon, children, className, onClick }) => (
        <div className="mt-1">
            <NavLink
                to={to}
                onClick={(e) => {
                    if (onClick) {
                        e.preventDefault();
                        onClick();
                    }
                    if (window.innerWidth < 768 && !onClick) toggleSidebar();
                }}
                className={({ isActive }) => cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors duration-200 hover:bg-gray-50",
                    isActive && !onClick ? "text-primary bg-blue-50/50" : "text-text-main",
                    className
                )}
            >
                <Icon className={cn("w-5 h-5 opacity-80", onClick ? "text-red-500" : "")} />
                {children}
            </NavLink>
        </div>
    );

    return (
        <>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed md:static inset-y-0 left-0 z-50 w-64 bg-surface border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col h-full",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>

                {/* Header */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-text-main">
                        <span className="text-2xl">📦</span> Joyspoon
                    </div>
                    <button
                        className="md:hidden p-1.5 text-text-muted hover:bg-gray-100 rounded-md transition-colors"
                        onClick={toggleSidebar}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">

                    <Folder title="Production Joyspoon" icon={BarChart2} folderKey="productivity">
                        <NavItem to="/productivity/tracking">Tracking</NavItem>
                        <NavItem to="/productivity/analysis">Analysis</NavItem>
                        <NavItem to="/productivity/settings">Settings</NavItem>
                    </Folder>

                    <Folder title="Expenses" icon={Receipt} folderKey="expenses">
                        <NavItem to="/expenses/transactions">Transactions</NavItem>
                        <NavItem to="/expenses/settings">Settings</NavItem>
                    </Folder>

                    <Folder title="Finance" icon={CreditCard} folderKey="finance">
                        <NavItem to="/finance/invoices">Invoices</NavItem>
                    </Folder>

                    <Folder title="Sales" icon={TrendingUp} folderKey="sales">
                        <NavItem to="/sales/data-sources">Data Sources</NavItem>
                        <NavItem to="/sales/analysis">Analysis</NavItem>
                    </Folder>

                </nav>

                {/* Footer Actions */}
                <div className="p-3 border-t border-gray-100 shrink-0">
                    <SingleItem to="/settings" icon={Settings}>
                        General Settings
                    </SingleItem>
                </div>

            </aside>
        </>
    );
}
