import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const AuthContext = createContext();

// Module-level singleton — never recreated on re-renders or HMR
let _supabaseClient = null;

async function getSupabaseClient() {
    if (_supabaseClient) return _supabaseClient;

    const res = await fetch('/api/config/supabase');
    if (!res.ok) throw new Error('Config error');
    const { url, anonKey } = await res.json();

    _supabaseClient = createClient(url, anonKey, {
        auth: {
            // Disable the Navigator Lock to prevent the timeout error
            // This is safe for single-tab web apps
            lock: async (name, acquireTimeout, fn) => fn(),
            persistSession: true,
            detectSessionInUrl: true,
            autoRefreshToken: true,
        }
    });

    return _supabaseClient;
}

export function AuthProvider({ children }) {
    const [supabase, setSupabase] = useState(null);
    const [session, setSession] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState('user');
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const subscriptionRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        async function initSupabase() {
            try {
                const client = await getSupabaseClient();

                if (cancelled) return;
                setSupabase(client);

                // Get initial session first so the loading flag clears quickly
                const { data: { session: initialSession } } = await client.auth.getSession();

                if (!cancelled) {
                    setSession(initialSession);
                    if (initialSession) {
                        setCurrentUser(initialSession.user);
                        // Fetch role asynchronously without blocking initial render
                        client
                            .from('profiles')
                            .select('role')
                            .eq('id', initialSession.user.id)
                            .single()
                            .then(({ data: profile }) => {
                                if (profile && !cancelled) setUserRole(profile.role);
                            });
                    }
                    setLoading(false);
                }

                // Subscribe to future changes
                const { data } = client.auth.onAuthStateChange(async (event, newSession) => {
                    if (cancelled) return;

                    setSession(newSession);

                    if (newSession) {
                        setCurrentUser(newSession.user);
                        const { data: profile } = await client
                            .from('profiles')
                            .select('role')
                            .eq('id', newSession.user.id)
                            .single();
                        if (!cancelled && profile) setUserRole(profile.role);
                    } else {
                        setCurrentUser(null);
                        setUserRole('user');
                    }
                });

                subscriptionRef.current = data.subscription;
            } catch (err) {
                console.error('Auth init failed', err);
                if (!cancelled) setLoading(false);
            }
        }

        initSupabase();

        return () => {
            cancelled = true;
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
        };
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const closeSidebar = () => setIsSidebarOpen(false);

    const logout = async () => {
        if (supabase) await supabase.auth.signOut();
        setSession(null);
        setCurrentUser(null);
        setUserRole('user');
    };

    const getAuthHeaders = () =>
        session ? { 'Authorization': `Bearer ${session.access_token}` } : {};

    return (
        <AuthContext.Provider value={{
            supabase,
            session,
            currentUser,
            userRole,
            loading,
            isSidebarOpen,
            toggleSidebar,
            closeSidebar,
            logout,
            getAuthHeaders
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
