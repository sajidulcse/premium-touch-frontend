import React, { useEffect, useState } from 'react';

const WelcomeBanner = ({ adminName, adminRole }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      <div className="welcome-banner-content">
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
