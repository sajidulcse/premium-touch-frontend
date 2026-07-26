import React, { useEffect, useState } from 'react';
import api from '../../../api/axios';
import { useToast } from '../../../context/ToastContext';

const WelcomeBanner = ({ adminName, adminRole }) => {
  const [time, setTime] = useState(new Date());
  const [clearing, setClearing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      const res = await api.post('/admin/settings/clear-cache');
      toast.success(res.data.message || 'System cache cleared successfully!');
    } catch (err) {
      console.error('Clear cache error:', err);
      toast.error(err.response?.data?.message || 'Failed to clear system cache.');
    } finally {
      setClearing(false);
    }
  };

  const formatDate = (d) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (d) => {
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="dark-welcome-banner minimal-slate-banner">
      <div className="welcome-banner-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div className="welcome-banner-text">
          <span className="greeting-small">Good Day,</span>
          <div className="name-role-row">
            <h2>{adminName || 'Admin'}</h2>
            <span className="role-badge">{adminRole || 'Administrator'}</span>
          </div>
          <p className="welcome-subtitle">
            Track customer leads, consultations, and manage interactions from one place.
          </p>
        </div>

        {/* Center: Clear Cache Button between Name & Clock */}
        <div className="welcome-banner-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={handleClearCache}
            disabled={clearing}
            title="Clear System, Config, View & Route Cache"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              padding: '10px 18px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(8px)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: '600',
              cursor: clearing ? 'not-allowed' : 'pointer',
              transition: 'all 0.25s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
            onMouseEnter={(e) => {
              if (!clearing) {
                e.currentTarget.style.background = 'rgba(201, 164, 92, 0.25)';
                e.currentTarget.style.borderColor = '#c9a45c';
              }
            }}
            onMouseLeave={(e) => {
              if (!clearing) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
              }
            }}
          >
            <i className={`fas ${clearing ? 'fa-spinner fa-spin' : 'fa-broom'}`} style={{ color: '#c9a45c', fontSize: '1rem' }}></i>
            <span>{clearing ? 'Clearing Cache...' : 'Clear Cache'}</span>
          </button>
        </div>

        <div className="welcome-banner-clock">
          <div className="digital-clock-box no-icon">
            <div className="time-display">{formatTime(time)}</div>
            <div className="date-display">{formatDate(time)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
