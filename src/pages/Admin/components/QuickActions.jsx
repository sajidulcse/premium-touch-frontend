import React from 'react';
import { NavLink } from 'react-router-dom';

const QuickActions = () => {
  const actions = [
    { to: '/admin/projects/new', icon: 'fas fa-plus-circle', label: 'New Project', color: '#c9a45c' },
    { to: '/admin/estimator/leads', icon: 'fas fa-calculator', label: 'Estimator Leads', color: '#50E3C2' },
    { to: '/admin/blogs/new', icon: 'fas fa-pen-fancy', label: 'Create Post', color: '#4A90E2' },
    { to: '/admin/services/new', icon: 'fas fa-concierge-bell', label: 'Add Service', color: '#9013FE' },
    { to: '/admin/consultations', icon: 'fas fa-handshake', label: 'Consultations', color: '#F5A623' },
    { to: '/admin/system-settings', icon: 'fas fa-sliders-h', label: 'Settings', color: '#64748b' },
  ];

  return (
    <div className="quick-actions-wrapper">
      <div className="quick-actions-header">
        <h4><i className="fas fa-bolt text-gold"></i> Quick Operations</h4>
      </div>
      <div className="quick-actions">
        {actions.map((a, i) => (
          <NavLink key={i} to={a.to} className="quick-action-card">
            <div className="qa-icon" style={{ backgroundColor: `${a.color}15`, color: a.color }}>
              <i className={a.icon}></i>
            </div>
            <span>{a.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
