import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, permission }) => {
    const { isAuthenticated, hasPermission, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: '#0f172a',
                color: '#fff',
                fontFamily: 'sans-serif'
            }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#c9a45c', marginBottom: '15px' }}></i>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Verifying Security Policies...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin-login" replace />;
    }

    if (permission && !hasPermission(permission)) {
        return (
            <div className="admin-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="admin-card" style={{ maxWidth: '480px', padding: '40px', textAlign: 'center', border: '1px solid #fee2e2', background: '#fff' }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: '#fef2f2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px auto',
                        color: '#ef4444'
                    }}>
                        <i className="fas fa-shield-alt" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '22px', fontWeight: '700', color: '#991b1b' }}>Access Denied</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: '0 0 25px 0' }}>
                        Your role does not possess the authorization privilege (<strong>{permission}</strong>) required to view or manage this administrative module.
                    </p>
                    <button 
                        onClick={() => window.location.href = '/admin/dashboard'} 
                        className="admin-btn-secondary" 
                        style={{ padding: '10px 20px', fontSize: '13px' }}
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
