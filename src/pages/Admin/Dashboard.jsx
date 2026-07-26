import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './components/DashboardComponents.css';

import WelcomeBanner from './components/WelcomeBanner';
import MetricCard from './components/MetricCard';
import QuickActions from './components/QuickActions';
import AnalyticsOverview from './components/AnalyticsOverview';
import RecentActivityTables from './components/RecentActivityTables';

const Dashboard = () => {
  const { user: authUser } = useAuth();
  const admin = authUser || JSON.parse(localStorage.getItem('admin') || sessionStorage.getItem('admin') || 'null');

  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        let res;
        try {
          res = await api.get('/admin/dashboard-stats');
        } catch (e) {
          res = await api.get('/admin/dashboard');
        }

        if (res.data && (res.data.success || res.data.counts)) {
          setStatsData(res.data);
        }
      } catch (err) {
        console.error('Dashboard stats fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (!admin) return null;

  const counts = statsData?.counts || {};
  const leadsStats = statsData?.leads_stats || {};
  const consultationsBreakdown = statsData?.consultations_status_breakdown || [];

  const getConsultationStatusCount = (statusName) => {
    const item = consultationsBreakdown.find(
      (b) => b.status && b.status.toLowerCase() === statusName.toLowerCase()
    );
    return item ? item.count : 0;
  };

  const allRequests = counts.consultations || 0;
  const newRequests = counts.pending_consultations ?? getConsultationStatusCount('New');
  const contactedRequests = getConsultationStatusCount('Contacted');
  const qualifiedRequests = getConsultationStatusCount('Qualified') || getConsultationStatusCount('In Progress');
  const closedRequests = getConsultationStatusCount('Closed');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0,
    }).format(val || 0).replace('BDT', '৳');
  };

  const adminRoleName = admin?.role_name || admin?.role?.name || (typeof admin?.role === 'string' ? admin.role : 'Super Admin');

  return (
    <div className="dashboard-content">
      {/* 1. Minimal Clean Black Welcome Banner */}
      <WelcomeBanner
        adminName={admin.name}
        adminRole={adminRoleName}
      />

      {/* 2. All Metric Cards in Serial Order */}
      {loading ? (
        <div className="metrics-grid smart-metrics-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="smart-metric-card skeleton-card">
              <div className="smart-card-inner">
                <div className="skeleton-icon"></div>
                <div className="smart-card-content">
                  <div className="skeleton-text"></div>
                  <div className="skeleton-count"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="metrics-grid smart-metrics-grid">
          {/* 1. Total Consultation */}
          <MetricCard
            icon="fas fa-handshake"
            title="Total Consultation"
            count={allRequests}
            color="#4A90E2"
            link="/admin/consultations"
          />

          {/* 2. New */}
          <MetricCard
            icon="fas fa-clock"
            title="New"
            count={newRequests}
            color="#F5A623"
            link="/admin/consultations?status=New"
          />

          {/* 3. Contacted */}
          <MetricCard
            icon="fas fa-phone-alt"
            title="Contacted"
            count={contactedRequests}
            color="#9013FE"
            link="/admin/consultations?status=Contacted"
          />

          {/* 4. Qualified */}
          <MetricCard
            icon="fas fa-user-check"
            title="Qualified"
            count={qualifiedRequests}
            color="#50E3C2"
            link="/admin/consultations?status=Qualified"
          />

          {/* 5. Closed */}
          <MetricCard
            icon="fas fa-check-double"
            title="Closed"
            count={closedRequests}
            color="#10b981"
            link="/admin/consultations?status=Closed"
          />

          {/* 6. Estimator Leads */}
          <MetricCard
            icon="fas fa-calculator"
            title="Estimator Leads"
            count={counts.leads || 0}
            color="#3B82F6"
            link="/admin/estimator/leads"
          />

          {/* 7. Average Estimate Value */}
          <MetricCard
            icon="fas fa-calculator"
            title="Average Estimate Value"
            count={formatCurrency(leadsStats.avg_estimate)}
            color="#c9a45c"
            link="/admin/estimator/leads"
          />

          {/* 8. Projects & Showcase */}
          <MetricCard
            icon="fas fa-drafting-compass"
            title="Projects & Showcase"
            count={counts.projects || 0}
            color="#8B5CF6"
            link="/admin/projects"
          />

          {/* 9. Unreplied Comments */}
          <MetricCard
            icon="fas fa-comment-dots"
            title="Unreplied Comments"
            count={counts.unreplied_comments ?? counts.comments ?? 0}
            color="#EC4899"
            link="/admin/comments?filter=unreplied"
          />
        </div>
      )}

      {/* 3. Quick Operations Cart */}
      <QuickActions />

      {/* 4. Lead and Consultation Monthly Graph & Side Breakdowns */}
      <AnalyticsOverview
        monthlyLeads={statsData?.monthly_leads}
        monthlyConsultations={statsData?.monthly_consultations}
        packageBreakdown={statsData?.package_breakdown}
        flatStatusBreakdown={statsData?.flat_status_breakdown}
      />

      {/* 5. Recent Activity Tables (Consultations & Estimator Leads) */}
      <RecentActivityTables
        recentConsultations={statsData?.recent_consultations}
        recentLeads={statsData?.recent_leads}
      />
    </div>
  );
};

export default Dashboard;
