import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const CacheContext = createContext();

export function CacheProvider({ children }) {
    const [cache, setCache] = useState({
        workTypes: null,
        products: null,
        units: null,
        settings: null,
        employees: null
    });

    const { getAuthHeaders } = useAuth();

    const getCached = async (key, endpoint, forceRefresh = false) => {
        if (!forceRefresh && cache[key]) {
            return cache[key];
        }

        try {
            const res = await fetch(`/api${endpoint}`, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error(res.statusText);
            const data = await res.json();

            setCache(prev => ({ ...prev, [key]: data }));
            return data;
        } catch (err) {
            console.error(`Error fetching ${key}:`, err);
            // Return existing cache or empty array as fallback if failed
            return cache[key] || [];
        }
    };

    const invalidateCache = (key) => {
        setCache(prev => ({ ...prev, [key]: null }));
    };

    return (
        <CacheContext.Provider value={{ cache, getCached, invalidateCache }}>
            {children}
        </CacheContext.Provider>
    );
}

export const useCache = () => useContext(CacheContext);
