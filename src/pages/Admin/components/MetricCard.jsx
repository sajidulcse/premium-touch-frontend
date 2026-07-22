import React from 'react';
import { Link } from 'react-router-dom';

const MetricCard = ({ icon, title, count, color, link }) => {
  const CardContent = (
    <div className="smart-card-inner">
      <div className="smart-icon-box" style={{ backgroundColor: `${color}15`, color: color }}>
        <i className={icon}></i>
      </div>
      <div className="smart-card-content">
        <span className="smart-card-title">{title}</span>
        <div className="smart-card-count" style={{ color: color }}>
          {count}
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="smart-metric-card" style={{ borderTopColor: color }}>
        {CardContent}
      </Link>
    );
  }

  return (
    <div className="smart-metric-card" style={{ borderTopColor: color }}>
      {CardContent}
    </div>
  );
};

export default MetricCard;
