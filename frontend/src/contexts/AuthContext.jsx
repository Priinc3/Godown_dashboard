import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const closeSidebar = () => setIsSidebarOpen(false);

    // Stub — auth removed, but pages still call getAuthHeaders()
    const getAuthHeaders = () => ({});

    return (
        <AuthContext.Provider value={{
            isSidebarOpen,
            toggleSidebar,
            closeSidebar,
            getAuthHeaders,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
