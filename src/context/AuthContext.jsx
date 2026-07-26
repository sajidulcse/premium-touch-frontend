import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const storedUserRaw = localStorage.getItem('admin') || sessionStorage.getItem('admin');
                const storedToken = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');

                let storedUser = null;
                if (storedUserRaw && storedUserRaw !== 'undefined') {
                    try {
                        storedUser = JSON.parse(storedUserRaw);
                    } catch (e) {
                        console.warn("Invalid stored user JSON, clearing:", e);
                    }
                }

                if (storedUser && storedToken) {
                    try {
                        // Fetch fresh profile, roles, and permissions from Laravel
                        const res = await api.get('/profile');
                        setUser(res.data);
                        setRole(res.data.role);
                        setPermissions(res.data.permissions || []);
                        
                        // Sync to both localStorage and sessionStorage for cross-tab availability
                        localStorage.setItem('admin', JSON.stringify(res.data));
                        localStorage.setItem('admin_token', storedToken);
                        sessionStorage.setItem('admin', JSON.stringify(res.data));
                        sessionStorage.setItem('admin_token', storedToken);
                    } catch (err) {
                        console.error("Session verification failed:", err);
                        // Clear stale sessions on verification failure
                        localStorage.removeItem('admin');
                        localStorage.removeItem('admin_token');
                        sessionStorage.removeItem('admin');
                        sessionStorage.removeItem('admin_token');
                        setUser(null);
                        setRole(null);
                        setPermissions([]);
                    }
                } else {
                    setUser(null);
                    setRole(null);
                    setPermissions([]);
                }
            } catch (globalErr) {
                console.error("AuthProvider checkAuth global error:", globalErr);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Reactive listener for cross-tab login/logout events
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'admin' || e.key === 'admin_token') {
                const rawUser = localStorage.getItem('admin') || sessionStorage.getItem('admin');
                if (rawUser) {
                    try {
                        const parsed = JSON.parse(rawUser);
                        setUser(parsed);
                        setRole(parsed.role);
                        setPermissions(parsed.permissions || []);
                    } catch (err) {}
                } else {
                    setUser(null);
                    setRole(null);
                    setPermissions([]);
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const login = (userData, token, roleName, userPermissions, remember = false) => {
        // Save to localStorage so ALL tabs in the browser can detect active admin session
        localStorage.setItem('admin', JSON.stringify(userData));
        localStorage.setItem('admin_token', token);
        sessionStorage.setItem('admin', JSON.stringify(userData));
        sessionStorage.setItem('admin_token', token);

        setUser(userData);
        setRole(roleName);
        setPermissions(userPermissions || []);
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (err) {
            console.warn("Logout request failed:", err);
        } finally {
            localStorage.removeItem('admin');
            localStorage.removeItem('admin_token');
            sessionStorage.removeItem('admin');
            sessionStorage.removeItem('admin_token');
            setUser(null);
            setRole(null);
            setPermissions([]);
        }
    };

    const hasPermission = (permission) => {
        // Super Admin gets unrestricted access to all endpoints & features
        const isSuper = role === 'Super Admin' || 
                        (typeof role === 'object' && role?.name === 'Super Admin') || 
                        (user?.role_name === 'Super Admin') ||
                        (user?.role?.name === 'Super Admin');

        if (isSuper) return true;
        if (!permission) return true;

        // Support OR rules separated by '|' (e.g., "settings.view|settings.security")
        if (permission.includes('|')) {
            const required = permission.split('|');
            return required.some(p => (permissions || []).includes(p.trim()));
        }

        return (permissions || []).includes(permission);
    };

    const value = {
        user,
        role,
        permissions,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        hasPermission
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
