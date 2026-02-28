import React, { createContext, useContext, useState, useEffect } from 'react';

const FinanceAuthContext = createContext();

const STORAGE_KEY = 'joyspoon_finance_auth';

export function FinanceAuthProvider({ children }) {
    const [financeUser, setFinanceUser] = useState(null);
    const [financeToken, setFinanceToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check localStorage for existing session
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const { token, user } = JSON.parse(stored);
                // Verify token hasn't expired
                const decoded = JSON.parse(atob(token));
                if (decoded.exp && decoded.exp > Date.now()) {
                    setFinanceToken(token);
                    setFinanceUser(user);
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
        }
        setLoading(false);
    }, []);

    const financeLogin = async (username, password) => {
        const res = await fetch('/api/finance/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        setFinanceToken(data.token);
        setFinanceUser(data.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: data.token, user: data.user }));

        return data;
    };

    const financeLogout = () => {
        setFinanceToken(null);
        setFinanceUser(null);
        localStorage.removeItem(STORAGE_KEY);
    };

    const getFinanceHeaders = () => {
        return financeToken ? { 'x-finance-token': financeToken } : {};
    };

    const isFinanceLoggedIn = !!financeUser && !!financeToken;

    return (
        <FinanceAuthContext.Provider value={{
            financeUser,
            financeToken,
            financeLogin,
            financeLogout,
            getFinanceHeaders,
            isFinanceLoggedIn,
            loading
        }}>
            {children}
        </FinanceAuthContext.Provider>
    );
}

export const useFinanceAuth = () => useContext(FinanceAuthContext);
