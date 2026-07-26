import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import '../Admin.css';
import { useToast } from '../../../context/ToastContext';

const EstimatorReports = () => {
    const toast = useToast();
    const [reports, setReports] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/estimator/reports');
            setReports(res.data);
        } catch (err) {
            console.error("Failed to load reports:", err);
            toast.error('Failed to fetch analytical reports.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page-container">
                <div style={{ padding: '40px', textAlign: 'center' }}>Loading reports data...</div>
            </div>
        );
    }

    if (!reports) {
        return (
            <div className="admin-page-container">
                <div style={{ padding: '40px', textAlign: 'center' }}>Failed to retrieve data summary. Try refreshing.</div>
            </div>
        );
    }

    // Helpers to calculate percentages for CSS bar graphs
    const getStatusPercentage = (count) => {
        if (reports.total_leads === 0) return 0;
        return Math.round((count / reports.total_leads) * 100);
    };

    const getFlatStatusLabel = (status) => {
        switch(status) {
            case 'New Flat': return 'Ready for Interior';
            case 'Under Construction': return 'Under Construction';
            case 'Renovation': return 'Not Ready';
            default: return status;
        }
    };

    const getPackagePercentage = (count) => {
        if (reports.total_leads === 0) return 0;
        return Math.round((count / reports.total_leads) * 100);
    };

    const maxRoomQty = reports.popular_rooms.length > 0 ? Math.max(...reports.popular_rooms.map(r => Number(r.total_qty))) : 1;
    const getRoomPercentage = (qty) => {
        return Math.round((Number(qty) / maxRoomQty) * 100);
    };

    const maxAddonQty = reports.popular_addons.length > 0 ? Math.max(...reports.popular_addons.map(a => Number(a.total_qty))) : 1;
    const getAddonPercentage = (qty) => {
        return Math.round((Number(qty) / maxAddonQty) * 100);
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Estimator Insights & Reports</h1>
                    <p>Track estimator usage details, popular client decisions, and average project budget projections.</p>
                </div>
                <button onClick={fetchReports} className="btn-admin btn-admin-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-sync-alt"></i> Refresh Data
                </button>
            </div>

            {/* Metrics cards grid */}
            <div className="admin-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div className="metric-card" style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Total Estimations Run</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1e293b', marginTop: '10px' }}>{reports.total_leads}</div>
                    <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '5px' }}><i className="fas fa-arrow-up"></i> Dynamic logs recorded</div>
                </div>
                
                <div className="metric-card" style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Average Project Budget</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c9a45c', marginTop: '10px' }}>৳{Math.round(reports.avg_estimate).toLocaleString()}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '10px' }}>Calculated average estimation budget</div>
                </div>
            </div>

            <div className="admin-reports-grid" style={{ marginBottom: '30px' }}>
                {/* Package Preferences Bar Chart */}
                <div className="admin-card">
                    <h3 className="card-title">Package Preferences</h3>
                    {reports.package_breakdown.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No package data available.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '15px' }}>
                            {reports.package_breakdown.map((pkg, idx) => {
                                const percent = getPackagePercentage(pkg.count);
                                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
                                const color = colors[idx % colors.length];

                                return (
                                    <div key={pkg.name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 600 }}>
                                            <span>{pkg.name} Package</span>
                                            <span>{pkg.count} leads ({percent}%)</span>
                                        </div>
                                        <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                                            <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '6px', transition: 'width 0.5s ease' }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Flat Status breakdown */}
                <div className="admin-card">
                    <h3 className="card-title">Flat Conditions Breakdown</h3>
                    {reports.status_breakdown.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No status data available.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '15px' }}>
                            {reports.status_breakdown.map((status, idx) => {
                                const percent = getStatusPercentage(status.count);
                                const colors = ['#ec4899', '#f97316', '#06b6d4'];
                                const color = colors[idx % colors.length];

                                return (
                                    <div key={status.flat_status}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 600 }}>
                                            <span>{getFlatStatusLabel(status.flat_status)}</span>
                                            <span>{status.count} flats ({percent}%)</span>
                                        </div>
                                        <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                                            <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '6px', transition: 'width 0.5s ease' }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="admin-reports-grid">
                {/* Popular Rooms */}
                <div className="admin-card">
                    <h3 className="card-title">Most Popular Rooms Selected</h3>
                    {reports.popular_rooms.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No room selections recorded yet.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '15px' }}>
                            {reports.popular_rooms.map(room => {
                                const percent = getRoomPercentage(room.total_qty);
                                return (
                                    <div key={room.name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 600 }}>
                                            <span>{room.name}</span>
                                            <span style={{ color: '#64748b' }}>{room.total_qty} units</span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${percent}%`, height: '100%', background: '#c9a45c', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Popular Add-ons */}
                <div className="admin-card">
                    <h3 className="card-title">Most Popular Add-ons Selected</h3>
                    {reports.popular_addons.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No add-on selections recorded yet.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '15px' }}>
                            {reports.popular_addons.map(addon => {
                                const percent = getAddonPercentage(addon.total_qty);
                                return (
                                    <div key={addon.name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 600 }}>
                                            <span>{addon.name}</span>
                                            <span style={{ color: '#64748b' }}>{addon.total_qty} selections</span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${percent}%`, height: '100%', background: '#E85D25', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EstimatorReports;
