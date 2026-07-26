import React from 'react';
import { NavLink } from 'react-router-dom';

const ContentHubGrid = () => {
  const hubs = [
    {
      title: 'Leads & Estimations',
      icon: 'fas fa-chart-line',
      color: '#4A90E2',
      items: [
        { to: '/admin/consultations', label: 'Consultation Leads', icon: 'fas fa-handshake' },
        { to: '/admin/estimator/leads', label: 'Estimator Leads', icon: 'fas fa-calculator' },
        { to: '/admin/estimator/packages', label: 'Packages Setup', icon: 'fas fa-cubes' },
        { to: '/admin/estimator/rooms', label: 'Room Types', icon: 'fas fa-door-open' },
        { to: '/admin/estimator/addons', label: 'Estimator Add-ons', icon: 'fas fa-puzzle-piece' },
        { to: '/admin/estimator/reports', label: 'Analytics & Reports', icon: 'fas fa-file-invoice-dollar' },
      ],
    },
    {
      title: 'Projects & Showcase',
      icon: 'fas fa-drafting-compass',
      color: '#c9a45c',
      items: [
        { to: '/admin/projects', label: 'All Projects', icon: 'fas fa-list' },
        { to: '/admin/projects/new', label: 'Add New Project', icon: 'fas fa-plus-circle' },
        { to: '/admin/portfolios', label: 'All Portfolios', icon: 'fas fa-camera-retro' },
        { to: '/admin/gallery/photos', label: 'Photo Gallery', icon: 'fas fa-images' },
        { to: '/admin/gallery/videos', label: 'Video Gallery', icon: 'fas fa-video' },
        { to: '/admin/gallery/handover', label: 'Handover Snapshots', icon: 'fas fa-key' },
      ],
    },
    {
      title: 'Content & Articles',
      icon: 'fas fa-pen-nib',
      color: '#50E3C2',
      items: [
        { to: '/admin/blogs', label: 'All Blog Posts', icon: 'fas fa-newspaper' },
        { to: '/admin/blogs/new', label: 'Write New Post', icon: 'fas fa-edit' },
        { to: '/admin/blog-categories', label: 'Blog Categories', icon: 'fas fa-tags' },
        { to: '/admin/comments', label: 'Reader Comments', icon: 'fas fa-comments' },
      ],
    },
    {
      title: 'Website CMS & Setup',
      icon: 'fas fa-laptop-code',
      color: '#9013FE',
      items: [
        { to: '/admin/services', label: 'Manage Services', icon: 'fas fa-concierge-bell' },
        { to: '/admin/home/hero', label: 'Hero Slides', icon: 'fas fa-photo-video' },
        { to: '/admin/home/identity', label: 'Our Identity', icon: 'fas fa-id-card' },
        { to: '/admin/home/process', label: 'Creative Process', icon: 'fas fa-stream' },
        { to: '/admin/home/reviews', label: 'Client Reviews', icon: 'fas fa-star' },
        { to: '/admin/about/team', label: 'Team Members', icon: 'fas fa-users' },
      ],
    },
    {
      title: 'System & Governance',
      icon: 'fas fa-shield-alt',
      color: '#F5A623',
      items: [
        { to: '/admin/users', label: 'User Accounts', icon: 'fas fa-users-cog' },
        { to: '/admin/roles', label: 'Roles & Permissions', icon: 'fas fa-user-shield' },
        { to: '/admin/system-settings?tab=smtp', label: 'SMTP Mail Setup', icon: 'fas fa-envelope-open-text' },
        { to: '/admin/system-settings?tab=sms', label: 'SMS Gateway', icon: 'fas fa-sms' },
        { to: '/admin/system-settings?tab=audit', label: 'Login Activities', icon: 'fas fa-history' },
        { to: '/admin/system-settings?tab=security', label: 'Security Insights', icon: 'fas fa-lock' },
      ],
    },
  ];

  return (
    <div className="content-hub-section">
      <div className="section-header">
        <h2><i className="fas fa-th-large text-gold"></i> Admin Management Hub</h2>
        <p>Direct navigation across all website content, leads, CMS sections, and system settings</p>
      </div>

      <div className="content-hub-grid">
        {hubs.map((hub, idx) => (
          <div key={idx} className="hub-card" style={{ borderTop: `3px solid ${hub.color}` }}>
            <div className="hub-card-header">
              <div className="hub-icon" style={{ backgroundColor: `${hub.color}15`, color: hub.color }}>
                <i className={hub.icon}></i>
              </div>
              <h3>{hub.title}</h3>
            </div>

            <div className="hub-links">
              {hub.items.map((item, i) => (
                <NavLink key={i} to={item.to} className="hub-link-item">
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                  <i className="fas fa-chevron-right arrow"></i>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentHubGrid;
