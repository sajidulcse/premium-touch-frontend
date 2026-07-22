import React from 'react';

const AnalyticsOverview = ({ monthlyLeads, monthlyConsultations, packageBreakdown, flatStatusBreakdown }) => {
  // Merge monthly leads & monthly consultations into unified 6-month data array
  const monthsMap = {};

  (monthlyLeads || []).forEach((item) => {
    if (!monthsMap[item.month]) monthsMap[item.month] = { month: item.month, leads: 0, consultations: 0 };
    monthsMap[item.month].leads = item.count || 0;
  });

  (monthlyConsultations || []).forEach((item) => {
    if (!monthsMap[item.month]) monthsMap[item.month] = { month: item.month, leads: 0, consultations: 0 };
    monthsMap[item.month].consultations = item.count || 0;
  });

  const chartData = Object.values(monthsMap);
  const maxVal = Math.max(...chartData.map((d) => Math.max(d.leads, d.consultations)), 4);

  const getFlatStatusLabel = (status) => {
    if (!status) return 'Ready for Interior';
    const s = status.toLowerCase();
    if (s.includes('new') || s.includes('ready for interior') || s.includes('ready')) return 'Ready for Interior';
    if (s.includes('construction') || s.includes('under')) return 'Under Construction';
    if (s.includes('renovated') || s.includes('renovation') || s.includes('not ready')) return 'Not Ready';
    return status;
  };

  const maxPackageCount = packageBreakdown && packageBreakdown.length > 0 ? packageBreakdown[0].count : 1;

  const flatCounts = {
    'Ready for Interior': 0,
    'Under Construction': 0,
    'Not Ready': 0,
  };

  (flatStatusBreakdown || []).forEach((flat) => {
    const label = getFlatStatusLabel(flat.flat_status);
    if (flatCounts[label] !== undefined) {
      flatCounts[label] += flat.count || 0;
    } else {
      flatCounts['Ready for Interior'] += flat.count || 0;
    }
  });

  const formattedFlatBreakdown = Object.entries(flatCounts).map(([name, count]) => ({
    name,
    count,
  }));

  const maxFlatCount = Math.max(...formattedFlatBreakdown.map((f) => f.count), 1);

  // SVG dimensions with increased right padding (45px) so the rightmost date is never clipped
  const svgWidth = 620;
  const svgHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 45;
  const paddingTop = 25;
  const paddingBottom = 35;
  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  const points = chartData.map((item, index) => {
    const x = chartData.length > 1
      ? paddingLeft + (index / (chartData.length - 1)) * chartW
      : svgWidth / 2;

    const leadY = paddingTop + chartH - (item.leads / maxVal) * chartH;
    const consultationY = paddingTop + chartH - (item.consultations / maxVal) * chartH;

    return { ...item, x, leadY, consultationY, index };
  });

  const createLinePath = (pointArr, yKey) => {
    if (pointArr.length === 0) return '';
    if (pointArr.length === 1) return `M ${pointArr[0].x} ${pointArr[0][yKey]}`;

    return pointArr.reduce((acc, pt, i, a) => {
      if (i === 0) return `M ${pt.x} ${pt[yKey]}`;
      const prev = a[i - 1];
      const cx = (prev.x + pt.x) / 2;
      return `${acc} C ${cx} ${prev[yKey]}, ${cx} ${pt[yKey]}, ${pt.x} ${pt[yKey]}`;
    }, '');
  };

  const createAreaPath = (pointArr, yKey) => {
    if (pointArr.length === 0) return '';
    const linePath = createLinePath(pointArr, yKey);
    const firstX = pointArr[0].x;
    const lastX = pointArr[pointArr.length - 1].x;
    const bottomY = paddingTop + chartH;

    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const leadsLine = createLinePath(points, 'leadY');
  const leadsArea = createAreaPath(points, 'leadY');
  const consultationsLine = createLinePath(points, 'consultationY');
  const consultationsArea = createAreaPath(points, 'consultationY');

  // Y-axis steps
  const ySteps = [
    { label: `${maxVal}`, y: paddingTop },
    { label: `${Math.round(maxVal * 0.66)}`, y: paddingTop + chartH * 0.34 },
    { label: `${Math.round(maxVal * 0.33)}`, y: paddingTop + chartH * 0.67 },
    { label: '0', y: paddingTop + chartH },
  ];

  return (
    <div className="analytics-graph-section">
      {/* 1. Simple Basic Trend Line Graph Card */}
      <div className="analytics-card graph-card">
        <div className="analytics-card-header">
          <div>
            <h3><i className="fas fa-chart-line text-gold"></i> Leads & Consultations Overview</h3>
            <p>Simple 6-month trend graph comparing Estimator Leads and Consultations</p>
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-dot lead-dot"></span> Estimator Leads</span>
            <span className="legend-item"><span className="legend-dot consultation-dot"></span> Consultations</span>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="svg-trend-chart-wrapper">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="trend-svg"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Gold Gradient for Leads Area */}
                <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c9a45c" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#c9a45c" stopOpacity="0.0" />
                </linearGradient>

                {/* Blue Gradient for Consultations Area */}
                <linearGradient id="consultationsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4A90E2" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4A90E2" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines & Y-Axis Scale Labels */}
              {ySteps.map((step, i) => (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={step.y}
                    x2={svgWidth - paddingRight}
                    y2={step.y}
                    className="grid-line"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={step.y + 4}
                    textAnchor="end"
                    className="axis-label y-axis-label"
                    fontSize="11"
                  >
                    {step.label}
                  </text>
                </g>
              ))}

              {/* Solid Y-Axis Line (Left Vertical) */}
              <line
                x1={paddingLeft}
                y1={paddingTop}
                x2={paddingLeft}
                y2={paddingTop + chartH}
                className="solid-axis-line"
              />

              {/* Solid X-Axis Line (Bottom Horizontal) */}
              <line
                x1={paddingLeft}
                y1={paddingTop + chartH}
                x2={svgWidth - paddingRight}
                y2={paddingTop + chartH}
                className="solid-axis-line"
              />

              {/* Filled Area - Consultations */}
              <path d={consultationsArea} fill="url(#consultationsGradient)" />

              {/* Filled Area - Leads */}
              <path d={leadsArea} fill="url(#leadsGradient)" />

              {/* Trend Line - Consultations (Blue) */}
              <path d={consultationsLine} fill="none" stroke="#4A90E2" strokeWidth="3" className="trend-line" />

              {/* Trend Line - Leads (Gold) */}
              <path d={leadsLine} fill="none" stroke="#c9a45c" strokeWidth="3" className="trend-line" />

              {/* Data Point Dots & X-Axis Month Labels */}
              {points.map((pt, idx) => (
                <g key={idx}>
                  {/* Consultation Point Dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.consultationY}
                    r="4"
                    fill="#4A90E2"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  {/* Lead Point Dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.leadY}
                    r="4"
                    fill="#c9a45c"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  {/* X-Axis Month Label at Bottom with compact font size */}
                  <text
                    x={pt.x}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    className="axis-label x-axis-label"
                    fontSize="11"
                  >
                    {pt.month}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        ) : (
          <div className="analytics-empty-state">
            <i className="fas fa-chart-line"></i>
            <p>No monthly activity recorded yet.</p>
          </div>
        )}
      </div>

      {/* 2. Side Column: Separate Cards for Popular Packages & Flat Type */}
      <div className="analytics-side-cards-column">
        {/* Card 1: Popular Packages */}
        <div className="analytics-card package-side-card">
          <div className="analytics-card-header">
            <div>
              <h3><i className="fas fa-cubes text-gold"></i> Popular Packages</h3>
              <p>Estimator lead package breakdown</p>
            </div>
          </div>
          <div className="breakdown-list">
            {packageBreakdown && packageBreakdown.length > 0 ? (
              packageBreakdown.map((pkg, i) => (
                <div key={i} className="breakdown-item">
                  <div className="breakdown-info">
                    <span className="breakdown-name">{pkg.name || 'Custom Package'}</span>
                    <span className="breakdown-count">{pkg.count} leads</span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(100, (pkg.count / maxPackageCount) * 100)}%`,
                        backgroundColor: i === 0 ? '#c9a45c' : i === 1 ? '#4A90E2' : '#50E3C2',
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted small">No package breakdown available.</p>
            )}
          </div>
        </div>

        {/* Card 2: Flat Type Breakdown */}
        <div className="analytics-card package-side-card">
          <div className="analytics-card-header">
            <div>
              <h3><i className="fas fa-building text-gold"></i> Flat Type Breakdown</h3>
              <p>Property condition distribution</p>
            </div>
          </div>
          <div className="breakdown-list">
            {formattedFlatBreakdown.map((flat, i) => (
              <div key={i} className="breakdown-item">
                <div className="breakdown-info">
                  <span className="breakdown-name">{flat.name}</span>
                  <span className="breakdown-count">{flat.count} leads</span>
                </div>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(100, (flat.count / maxFlatCount) * 100)}%`,
                      backgroundColor: i === 0 ? '#3B82F6' : i === 1 ? '#F5A623' : '#10b981',
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOverview;
