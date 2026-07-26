import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';
import { useToast } from '../../context/ToastContext';

// Parse raw User-Agent into a friendly browser/device name + icon
const parseUserAgent = (ua) => {
    if (!ua) return { name: 'Unknown Client', icon: 'fa-question-circle' };
    const u = ua.toLowerCase();
    if (u.includes('iphone') || u.includes('ipad')) return { name: 'iOS Device', icon: 'fa-mobile-alt' };
    if (u.includes('android')) return { name: 'Android Device', icon: 'fa-mobile-alt' };
    if (u.includes('postman')) return { name: 'Postman Client', icon: 'fa-code' };
    if (u.includes('insomnia')) return { name: 'Insomnia Client', icon: 'fa-code' };
    if (u.includes('curl')) return { name: 'cURL Client', icon: 'fa-terminal' };
    if (u.includes('edg/') || u.includes('edga/')) return { name: 'Microsoft Edge', icon: 'fa-globe' };
    if (u.includes('opr/') || u.includes('opera')) return { name: 'Opera Browser', icon: 'fa-globe' };
    if (u.includes('firefox')) return { name: 'Firefox Browser', icon: 'fa-globe' };
    if (u.includes('chrome') || u.includes('chromium')) return { name: 'Chrome Browser', icon: 'fa-globe' };
    if (u.includes('safari')) return { name: 'Safari Browser', icon: 'fa-globe' };
    if (u.includes('mozilla')) return { name: 'Web Browser', icon: 'fa-globe' };
    return { name: 'Unknown Client', icon: 'fa-question-circle' };
};

const SystemSettings = () => {
    const toast = useToast();
    const { hasPermission } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const queryTab = searchParams.get('tab') || 'smtp';
    const [activeTab, setActiveTab] = useState(queryTab);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Sync activeTab when URL search params change
    useEffect(() => {
        if (queryTab && queryTab !== activeTab) {
            setActiveTab(queryTab);
        }
    }, [queryTab]);

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        setSearchParams({ tab: tabName });
    };


    // Tab 1: SMTP Config States
    const [mailData, setMailData] = useState({
        mail_host: '127.0.0.1',
        mail_port: '2525',
        mail_username: '',
        mail_password: '',
        mail_encryption: 'tls',
        mail_from_address: 'hello@example.com',
        mail_from_name: 'Premium Touch'
    });

    // Tab 2: Audit Logs States
    const [auditLogs, setAuditLogs] = useState([]);
    const [logPagination, setLogPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [logFilters, setLogFilters] = useState({ search: '', status: 'all', page: 1 });

    // Tab 4: Activity Logs States
    const [activityLogs, setActivityLogs] = useState([]);
    const [activityPagination, setActivityPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [activityFilters, setActivityFilters] = useState({ search: '', action: 'all', page: 1 });
    const [expandedLogId, setExpandedLogId] = useState(null);
    const [selectedLogModal, setSelectedLogModal] = useState(null);

    const renderFormattedProperties = (props, emptyMsg = "No properties recorded.") => {
        if (!props) return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>{emptyMsg}</span>;
        let parsed = props;
        if (typeof props === 'string') {
            try {
                parsed = JSON.parse(props);
            } catch (e) {
                return <pre style={{ margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{props}</pre>;
            }
        }
        return <pre style={{ margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(parsed, null, 2)}</pre>;
    };

    // Tab 3: Security Insights States
    const [securityStats, setSecurityStats] = useState({ active_sessions_count: 0, failed_logins_24h: 0 });
    const [sessions, setSessions] = useState([]);
    const [sessionToRevoke, setSessionToRevoke] = useState(null);
    const [confirmRevokeOpen, setConfirmRevokeOpen] = useState(false);

    // Tab 5: SMS Config States
    const [smsData, setSmsData] = useState({
        sms_enabled: '0',
        sms_gateway_url: '',
        sms_api_key: '',
        sms_sender_id: '',
        sms_template_otp: '',
        sms_template_lead: '',
        balance: '',
        sent_today: 0,
        sent_this_week: 0,
        sent_this_month: 0
    });
    const [testSms, setTestSms] = useState({ phone: '', message: '' });
    const [sendingTest, setSendingTest] = useState(false);
    const [revealApiKey, setRevealApiKey] = useState(false);

    // SMS Sent logs history states
    const [smsLogs, setSmsLogs] = useState([]);
    const [smsPagination, setSmsPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [smsFilters, setSmsFilters] = useState({ search: '', status: 'all', page: 1 });
    const [searchInput, setSearchInput] = useState('');

    // Debounce SMS keyword search-as-you-type filter
    useEffect(() => {
        const handler = setTimeout(() => {
            setSmsFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
        }, 400);
        return () => clearTimeout(handler);
    }, [searchInput]);

    // Tab 6: Marketing & Analytics States
    const [marketingData, setMarketingData] = useState({
        analytics_enabled: '1',
        gtm_id: '',
        meta_pixel_id: '',
        meta_capi_access_token: '',
        meta_capi_test_event_code: '',
        meta_capi_api_version: 'v19.0'
    });
    const [revealCapiToken, setRevealCapiToken] = useState(false);
    const [marketingSubmitting, setMarketingSubmitting] = useState(false);

    useEffect(() => {
        if (activeTab === 'smtp' && hasPermission('settings.view')) {
            fetchMailSettings();
        } else if (activeTab === 'audit' && hasPermission('settings.view')) {
            fetchAuditLogs();
        } else if (activeTab === 'activity' && hasPermission('settings.view')) {
            fetchActivityLogs();
        } else if (activeTab === 'security' && hasPermission('settings.security')) {
            fetchSecurityInsights();
        } else if (activeTab === 'sms' && hasPermission('settings.view')) {
            fetchSmsSettings();
        } else if (activeTab === 'marketing' && hasPermission('settings.view')) {
            fetchMarketingSettings();
        }
    }, [activeTab, logFilters.page, logFilters.status, activityFilters.page, activityFilters.action]);

    // Fetch SMS History logs on search, page, or status changes seamlessly without full page load spinner
    useEffect(() => {
        if (activeTab === 'sms' && hasPermission('settings.view')) {
            fetchSmsHistory();
        }
    }, [activeTab, smsFilters.page, smsFilters.status, smsFilters.search]);

    // --- Tab 1 API Calls ---
    const fetchMailSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/settings/mail');
            setMailData(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to retrieve SMTP settings.');
        } finally {
            setLoading(false);
        }
    };

    const handleMailSubmit = async (e) => {
        e.preventDefault();
        if (!hasPermission('settings.edit')) {
            toast.error('Unauthorized to change SMTP credentials.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await api.post('/admin/settings/mail', mailData);
            toast.success(res.data.message);
            fetchMailSettings();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to update SMTP configurations.');
        } finally {
            setSubmitting(false);
        }
    };

    // --- Tab 2 API Calls ---
    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            const params = {
                page: logFilters.page,
                status: logFilters.status
            };
            if (logFilters.search) params.search = logFilters.search;

            const res = await api.get('/admin/settings/audit-logs', { params });
            setAuditLogs(res.data.data);
            setLogPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total
            });
        } catch (err) {
            console.error(err);
            toast.error('Failed to retrieve login audit logs.');
        } finally {
            setLoading(false);
        }
    };

    const fetchActivityLogs = async (overrideFilters = null) => {
        setLoading(true);
        try {
            const filters = overrideFilters || activityFilters;
            const params = {
                page: filters.page
            };
            if (filters.action && filters.action !== 'all') {
                params.action = filters.action;
            }
            if (filters.search) params.search = filters.search;

            const res = await api.get('/admin/settings/activity-logs', { params });
            setActivityLogs(res.data.data);
            setActivityPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total
            });
        } catch (err) {
            console.error(err);
            toast.error('Failed to retrieve activity logs.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchActivity = (e) => {
        e.preventDefault();
        setActivityFilters(prev => ({ ...prev, page: 1 }));
        fetchActivityLogs();
    };

    const handleSearchLogs = (e) => {
        e.preventDefault();
        setLogFilters(prev => ({ ...prev, page: 1 }));
        fetchAuditLogs();
    };

    // --- Tab 3 API Calls ---
    const fetchSecurityInsights = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/settings/security-insights');
            setSecurityStats(res.data.stats);
            setSessions(res.data.sessions);
        } catch (err) {
            console.error(err);
            toast.error('Failed to retrieve security insights.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenRevokeModal = (session) => {
        setSessionToRevoke(session);
        setConfirmRevokeOpen(true);
    };

    const handleConfirmRevoke = async () => {
        if (!sessionToRevoke) return;
        setSubmitting(true);
        try {
            const res = await api.post(`/admin/settings/revoke-token/${sessionToRevoke.id}`);
            toast.success(res.data.message);
            fetchSecurityInsights();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to revoke device session.');
        } finally {
            setSubmitting(false);
            setConfirmRevokeOpen(false);
            setSessionToRevoke(null);
        }
    };

    // --- Tab 5 API Calls ---
    const fetchSmsSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/settings/sms');
            setSmsData(res.data);
            setTestSms(prev => ({ 
                ...prev, 
                message: prev.message || 'This is a test SMS from Premium Touch Portal.' 
            }));
        } catch (err) {
            console.error(err);
            toast.error('Failed to retrieve SMS settings.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSmsHistory = async (overrideFilters = null) => {
        try {
            const filters = overrideFilters || smsFilters;
            const params = {
                page: filters.page,
                status: filters.status
            };
            if (filters.search) params.search = filters.search;

            const res = await api.get('/admin/settings/sms/history', { params });
            setSmsLogs(res.data.data);
            setSmsPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleSearchSms = (e) => {
        e.preventDefault();
        setSmsFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
    };

    const handleSmsSubmit = async (e) => {
        e.preventDefault();
        if (!hasPermission('settings.edit')) {
            toast.error('Unauthorized to update settings.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await api.post('/admin/settings/sms', smsData);
            toast.success(res.data.message);
            fetchSmsSettings();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to save SMS configurations.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendTestSms = async (e) => {
        e.preventDefault();
        if (!testSms.phone || !testSms.message) {
            toast.error('Please provide phone and message payload.');
            return;
        }
        setSendingTest(true);
        try {
            const res = await api.post('/admin/settings/sms/test', testSms);
            toast.success('Message sent successfully!');
            setTestSms({ phone: '', message: '' });
            fetchSmsSettings();
            fetchSmsHistory();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Manual SMS delivery failed.');
        } finally {
            setSendingTest(false);
        }
    };

    // --- Tab 6: Marketing & Analytics API Calls ---
    const fetchMarketingSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/settings/marketing');
            setMarketingData(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to retrieve marketing settings.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarketingSubmit = async () => {
        if (!hasPermission('settings.edit')) {
            toast.error('Unauthorized to update marketing settings.');
            return;
        }
        setMarketingSubmitting(true);
        try {
            const res = await api.post('/admin/settings/marketing', marketingData);
            toast.success(res.data.message || 'Marketing settings saved successfully.');
            fetchMarketingSettings();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to save marketing settings.');
        } finally {
            setMarketingSubmitting(false);
        }
    };

    return (
        <div className="admin-container">

            <div className="admin-header">
                <div>
                    <h1>System Settings & Security</h1>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
                        Configure dynamic server credentials, monitor login audit trails, and manage active device sessions.
                    </p>
                </div>
            </div>

            {/* Custom Tab Headings */}
            <div className="admin-tabs" style={{ display: 'flex', gap: '15px', borderBottom: '1px solid #e2e8f0', marginBottom: '25px', paddingBottom: '10px' }}>
                {hasPermission('settings.view') && (
                    <button 
                        className={`tab-btn ${activeTab === 'smtp' ? 'active' : ''}`}
                        onClick={() => handleTabChange('smtp')}
                        style={{
                            background: 'none', border: 'none', outline: 'none', padding: '8px 16px', cursor: 'pointer',
                            fontSize: '0.95rem', fontWeight: 600, color: activeTab === 'smtp' ? '#c9a45c' : '#64748b',
                            borderBottom: activeTab === 'smtp' ? '2px solid #c9a45c' : '2px solid transparent',
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        <i className="fas fa-envelope-open-text" style={{ marginRight: '8px' }}></i>SMTP Configurations
                    </button>
                )}
                {hasPermission('settings.view') && (
                    <button 
                        className={`tab-btn ${activeTab === 'sms' ? 'active' : ''}`}
                        onClick={() => handleTabChange('sms')}
                        style={{
                            background: 'none', border: 'none', outline: 'none', padding: '8px 16px', cursor: 'pointer',
                            fontSize: '0.95rem', fontWeight: 600, color: activeTab === 'sms' ? '#c9a45c' : '#64748b',
                            borderBottom: activeTab === 'sms' ? '2px solid #c9a45c' : '2px solid transparent',
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        <i className="fas fa-sms" style={{ marginRight: '8px' }}></i>SMS Gateway
                    </button>
                )}
                {hasPermission('settings.view') && (
                    <button 
                        className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
                        onClick={() => handleTabChange('audit')}
                        style={{
                            background: 'none', border: 'none', outline: 'none', padding: '8px 16px', cursor: 'pointer',
                            fontSize: '0.95rem', fontWeight: 600, color: activeTab === 'audit' ? '#c9a45c' : '#64748b',
                            borderBottom: activeTab === 'audit' ? '2px solid #c9a45c' : '2px solid transparent',
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        <i className="fas fa-history" style={{ marginRight: '8px' }}></i>Login Activities
                    </button>
                )}
                {hasPermission('settings.view') && (
                    <button 
                        className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                        onClick={() => handleTabChange('activity')}
                        style={{
                            background: 'none', border: 'none', outline: 'none', padding: '8px 16px', cursor: 'pointer',
                            fontSize: '0.95rem', fontWeight: 600, color: activeTab === 'activity' ? '#c9a45c' : '#64748b',
                            borderBottom: activeTab === 'activity' ? '2px solid #c9a45c' : '2px solid transparent',
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        <i className="fas fa-clipboard-list" style={{ marginRight: '8px' }}></i>Activity Logs
                    </button>
                )}
                {hasPermission('settings.security') && (
                    <button 
                        className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => handleTabChange('security')}
                        style={{
                            background: 'none', border: 'none', outline: 'none', padding: '8px 16px', cursor: 'pointer',
                            fontSize: '0.95rem', fontWeight: 600, color: activeTab === 'security' ? '#c9a45c' : '#64748b',
                            borderBottom: activeTab === 'security' ? '2px solid #c9a45c' : '2px solid transparent',
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        <i className="fas fa-shield-alt" style={{ marginRight: '8px' }}></i>Security Insights
                    </button>
                )}
                {hasPermission('settings.view') && (
                    <button 
                        className={`tab-btn ${activeTab === 'marketing' ? 'active' : ''}`}
                        onClick={() => handleTabChange('marketing')}
                        style={{
                            background: 'none', border: 'none', outline: 'none', padding: '8px 16px', cursor: 'pointer',
                            fontSize: '0.95rem', fontWeight: 600, color: activeTab === 'marketing' ? '#c9a45c' : '#64748b',
                            borderBottom: activeTab === 'marketing' ? '2px solid #c9a45c' : '2px solid transparent',
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        <i className="fas fa-chart-line" style={{ marginRight: '8px' }}></i>Marketing & Analytics
                    </button>
                )}
            </div>

            {loading && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#c9a45c' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
                    <p style={{ marginTop: '10px', color: '#64748b' }}>Retrieving data payload...</p>
                </div>
            )}

            {!loading && (
                <>
                    {/* Tab 1: SMTP Config */}
                    {activeTab === 'smtp' && hasPermission('settings.view') && (
                        <div className="admin-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
                            <div className="card-header" style={{ marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>Mail Server Parameters</h3>
                                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>These parameters override config files on email dispatch triggers.</p>
                            </div>
                            <form onSubmit={handleMailSubmit}>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>SMTP Host</label>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            value={mailData.mail_host}
                                            onChange={(e) => setMailData({ ...mailData, mail_host: e.target.value })}
                                            required
                                            disabled={submitting || !hasPermission('settings.edit')}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>SMTP Port</label>
                                        <input
                                            type="number"
                                            className="admin-input"
                                            value={mailData.mail_port}
                                            onChange={(e) => setMailData({ ...mailData, mail_port: e.target.value })}
                                            required
                                            disabled={submitting || !hasPermission('settings.edit')}
                                        />
                                    </div>
                                </div>

                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Encryption Protocol</label>
                                        <select
                                            className="admin-input"
                                            value={mailData.mail_encryption}
                                            onChange={(e) => setMailData({ ...mailData, mail_encryption: e.target.value })}
                                            required
                                            disabled={submitting || !hasPermission('settings.edit')}
                                        >
                                            <option value="none">None</option>
                                            <option value="ssl">SSL</option>
                                            <option value="tls">TLS (Recommended)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Sender (From Name)</label>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            value={mailData.mail_from_name}
                                            onChange={(e) => setMailData({ ...mailData, mail_from_name: e.target.value })}
                                            required
                                            disabled={submitting || !hasPermission('settings.edit')}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Sender Address (From Email)</label>
                                    <input
                                        type="email"
                                        className="admin-input"
                                        value={mailData.mail_from_address}
                                        onChange={(e) => setMailData({ ...mailData, mail_from_address: e.target.value })}
                                        required
                                        disabled={submitting || !hasPermission('settings.edit')}
                                    />
                                </div>

                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>SMTP Username</label>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            value={mailData.mail_username || ''}
                                            onChange={(e) => setMailData({ ...mailData, mail_username: e.target.value })}
                                            disabled={submitting || !hasPermission('settings.edit')}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>SMTP Password</label>
                                        <input
                                            type="password"
                                            className="admin-input"
                                            placeholder="Enter password (stays masked if not changing)"
                                            value={mailData.mail_password || ''}
                                            onChange={(e) => setMailData({ ...mailData, mail_password: e.target.value })}
                                            disabled={submitting || !hasPermission('settings.edit')}
                                        />
                                    </div>
                                </div>

                                {hasPermission('settings.edit') && (
                                    <button 
                                        type="submit" 
                                        className="admin-btn-primary" 
                                        style={{ marginTop: '10px', padding: '12px 24px' }}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Applying Parameters...' : 'Save Configuration'}
                                    </button>
                                )}
                            </form>
                        </div>
                    )}

                    {/* Tab 2: Audit Logs */}
                    {activeTab === 'audit' && hasPermission('settings.view') && (
                        <div className="admin-card">
                            <div className="card-filters" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                                <form onSubmit={handleSearchLogs} className="search-bar" style={{ flex: '1', maxWidth: '400px', display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        className="admin-input"
                                        placeholder="Search by Email, IP Address or Browser..."
                                        value={logFilters.search}
                                        onChange={(e) => setLogFilters({ ...logFilters, search: e.target.value })}
                                    />
                                    <button type="submit" className="admin-btn-primary" style={{ padding: '0 18px' }}>
                                        <i className="fas fa-search"></i>
                                    </button>
                                </form>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select
                                        className="admin-input"
                                        value={logFilters.status}
                                        onChange={(e) => setLogFilters({ ...logFilters, status: e.target.value, page: 1 })}
                                        style={{ width: '150px' }}
                                    >
                                        <option value="all">All Logs</option>
                                        <option value="success">Successful Logins</option>
                                        <option value="failed">Failed Attempts</option>
                                    </select>
                                </div>
                            </div>

                            <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Email Address</th>
                                            <th>Associated User</th>
                                            <th>IP Address</th>
                                            <th>Browser / Client Details</th>
                                            <th>Status</th>
                                            <th>Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {auditLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                                    No audit trail matches the selected filters.
                                                </td>
                                            </tr>
                                        ) : (
                                            auditLogs.map((log) => (
                                                <tr key={log.id}>
                                                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.email}>{log.email}</td>
                                                    <td>{log.user ? log.user.name : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Guest Attempt</span>}</td>
                                                    <td><code>{log.ip_address || 'Unknown IP'}</code></td>
                                                    <td title={log.user_agent}>
                                                        {(() => {
                                                            const { name, icon } = parseUserAgent(log.user_agent);
                                                            return (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <i className={`fas ${icon}`} style={{ color: '#94a3b8', fontSize: '0.85rem' }}></i>
                                                                    <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 500 }}>{name}</span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${log.status === 'success' ? 'active' : 'inactive'}`} style={{
                                                            background: log.status === 'success' ? '#ecfdf5' : '#fef2f2',
                                                            color: log.status === 'success' ? '#065f46' : '#991b1b',
                                                            padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                                                            whiteSpace: 'nowrap', display: 'inline-block'
                                                        }}>
                                                            {log.status === 'success' ? 'SUCCESS' : 'FAILED'}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {logPagination.last_page > 1 && (
                                <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                                    <button
                                        className="admin-btn-secondary"
                                        disabled={logFilters.page === 1}
                                        onClick={() => setLogFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                        style={{ padding: '8px 16px' }}
                                    >
                                        <i className="fas fa-chevron-left" style={{ marginRight: '6px' }}></i>Previous
                                    </button>
                                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                        Page <strong>{logFilters.page}</strong> of <strong>{logPagination.last_page}</strong> ({logPagination.total} logs)
                                    </span>
                                    <button
                                        className="admin-btn-secondary"
                                        disabled={logFilters.page === logPagination.last_page}
                                        onClick={() => setLogFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                        style={{ padding: '8px 16px' }}
                                    >
                                        Next<i className="fas fa-chevron-right" style={{ marginLeft: '6px' }}></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 4: Activity Logs */}
                    {activeTab === 'activity' && hasPermission('settings.view') && (
                        <div>
                            {/* Filter Bar */}
                            <div className="admin-card" style={{ marginBottom: '20px', padding: '20px' }}>
                                <form onSubmit={handleSearchActivity} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div style={{ width: '260px', flexShrink: 0 }}>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            placeholder="Search description..."
                                            value={activityFilters.search}
                                            onChange={(e) => setActivityFilters(prev => ({ ...prev, search: e.target.value }))}
                                            style={{ width: '100%', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div style={{ width: '170px', flexShrink: 0 }}>
                                        <select
                                            className="admin-input"
                                            value={activityFilters.action}
                                            onChange={(e) => setActivityFilters(prev => ({ ...prev, action: e.target.value, page: 1 }))}
                                            style={{ width: '100%', boxSizing: 'border-box' }}
                                        >
                                            <option value="all">All Actions</option>
                                            <option value="created">Created</option>
                                            <option value="updated">Updated</option>
                                            <option value="deleted">Deleted</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="admin-btn-primary" style={{ padding: '10px 24px' }}>
                                        <i className="fas fa-search" style={{ marginRight: '6px' }}></i>Search
                                    </button>
                                    <button 
                                        type="button" 
                                        className="admin-btn-secondary" 
                                        onClick={() => {
                                            const cleared = { search: '', action: 'all', page: 1 };
                                            setActivityFilters(cleared);
                                            fetchActivityLogs(cleared);
                                        }}
                                        style={{ padding: '10px 24px' }}
                                    >
                                        Reset
                                    </button>
                                </form>
                            </div>

                            {/* Table */}
                            <div className="admin-card">
                                <div className="table-responsive">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th>Action</th>
                                                <th>Description</th>
                                                <th>IP Address</th>
                                                <th>Date & Time</th>
                                                <th>Details</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activityLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                                        No activity logs matches the selected filters.
                                                    </td>
                                                </tr>
                                            ) : (
                                                activityLogs.map((log) => {
                                                    const isExpanded = expandedLogId === log.id;
                                                    let badgeColor = '#475569';
                                                    let badgeBg = '#f1f5f9';
                                                    if (log.action === 'created') {
                                                        badgeColor = '#065f46';
                                                        badgeBg = '#ecfdf5';
                                                    } else if (log.action === 'updated') {
                                                        badgeColor = '#854d0e';
                                                        badgeBg = '#fef9c3';
                                                    } else if (log.action === 'deleted') {
                                                        badgeColor = '#991b1b';
                                                        badgeBg = '#fef2f2';
                                                    }

                                                    return (
                                                        <tr key={log.id}>
                                                            <td>
                                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                    <span style={{ fontWeight: 600 }}>{log.user ? log.user.name : 'System'}</span>
                                                                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{log.user ? log.user.email : ''}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span style={{
                                                                    color: badgeColor,
                                                                    background: badgeBg,
                                                                    padding: '4px 10px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.78rem',
                                                                    fontWeight: 'bold',
                                                                    textTransform: 'uppercase'
                                                                }}>
                                                                    {log.action}
                                                                </span>
                                                            </td>
                                                            <td style={{ fontWeight: 500, color: '#334155' }}>{log.description}</td>
                                                            <td><code>{log.ip_address || 'N/A'}</code></td>
                                                            <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                                                            <td>
                                                                <button 
                                                                    className="admin-btn-secondary"
                                                                    style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', borderRadius: '6px' }}
                                                                    onClick={() => setSelectedLogModal(log)}
                                                                >
                                                                    <i className="fas fa-eye" style={{ color: 'var(--admin-gold)' }}></i>
                                                                    Changes
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                </div>

                                {/* Pagination Controls */}
                                {activityPagination.last_page > 1 && (
                                    <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                                        <button
                                            className="admin-btn-secondary"
                                            disabled={activityFilters.page === 1}
                                            onClick={() => setActivityFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                            style={{ padding: '8px 16px' }}
                                        >
                                            <i className="fas fa-chevron-left" style={{ marginRight: '6px' }}></i>Previous
                                        </button>
                                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                            Page <strong>{activityFilters.page}</strong> of <strong>{activityPagination.last_page}</strong> ({activityPagination.total} entries)
                                        </span>
                                        <button
                                            className="admin-btn-secondary"
                                            disabled={activityFilters.page === activityPagination.last_page}
                                            onClick={() => setActivityFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                            style={{ padding: '8px 16px' }}
                                        >
                                            Next<i className="fas fa-chevron-right" style={{ marginLeft: '6px' }}></i>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Security Insights */}
                    {activeTab === 'security' && hasPermission('settings.security') && (
                        <div>
                            {/* Security KPI Summary Cards */}
                            <div className="grid-2" style={{ marginBottom: '25px', gap: '20px' }}>
                                <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '25px', borderLeft: '5px solid #c9a45c' }}>
                                    <div style={{ background: 'rgba(201, 164, 92, 0.1)', color: '#c9a45c', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem' }}>
                                        <i className="fas fa-key"></i>
                                    </div>
                                    <div>
                                        <span style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Authentication Sessions</span>
                                        <h2 style={{ fontSize: '2rem', color: '#0f172a', margin: '4px 0 0' }}>{securityStats.active_sessions_count}</h2>
                                    </div>
                                </div>
                                <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '25px', borderLeft: '5px solid #ef4444' }}>
                                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem' }}>
                                        <i className="fas fa-user-shield"></i>
                                    </div>
                                    <div>
                                        <span style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>24h Anomalies & Failed Attempts</span>
                                        <h2 style={{ fontSize: '2rem', color: '#ef4444', margin: '4px 0 0' }}>{securityStats.failed_logins_24h}</h2>
                                    </div>
                                </div>
                            </div>

                            {/* Active Devices Session List */}
                            <div className="admin-card">
                                <div className="card-header" style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>Active Device Sessions</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Below are the devices currently authenticated with this API. Revoke any unrecognized sessions to force logout.</p>
                                </div>
                                <div className="table-responsive">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Authenticated User</th>
                                                <th>Session Identifier</th>
                                                <th>Issued Date</th>
                                                <th>Last Active</th>
                                                <th>Session Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sessions.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                                        No active login sessions found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                sessions.map((sess) => (
                                                    <tr key={sess.id}>
                                                        <td>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <strong style={{ color: '#0f172a' }}>{sess.user_name}</strong>
                                                                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{sess.user_email}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <i className="fas fa-laptop" style={{ color: '#64748b' }}></i>
                                                                    <code>{sess.device_name || 'Admin-token'}</code>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <i className="fas fa-network-wired" style={{ color: '#94a3b8', fontSize: '0.75rem' }}></i>
                                                                    <span style={{ color: '#64748b', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                                                                        {sess.ip_address || 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ fontSize: '0.85rem' }}>{sess.created_at ? new Date(sess.created_at).toLocaleString() : 'N/A'}</td>
                                                        <td style={{ fontSize: '0.85rem' }}>{sess.last_used_at ? new Date(sess.last_used_at).toLocaleString() : 'Just now'}</td>
                                                        <td>
                                                            {sess.is_current ? (
                                                                <span style={{ background: '#ecfdf5', color: '#065f46', padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid #34d399', whiteSpace: 'nowrap', display: 'inline-block' }}>
                                                                    This Device (Active)
                                                                </span>
                                                            ) : (
                                                                <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'semibold', whiteSpace: 'nowrap', display: 'inline-block' }}>
                                                                    Remote Session
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {!sess.is_current ? (
                                                                <button 
                                                                    className="admin-btn-secondary"
                                                                    style={{ color: '#ef4444', borderColor: '#fca5a5', padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                                    onClick={() => handleOpenRevokeModal(sess)}
                                                                >
                                                                    <i className="fas fa-sign-out-alt"></i>Revoke Device
                                                                </button>
                                                            ) : (
                                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>Protected</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 5: SMS Gateway Settings */}
                    {activeTab === 'sms' && hasPermission('settings.view') && (
                        <div>
                            {/* Dynamic SMS balance banner */}
                            {/* Dynamic SMS balance & stats cards */}
                            <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '25px', gap: '20px' }}>
                                <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', borderLeft: '5px solid #10b981' }}>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.3rem' }}>
                                        <i className="fas fa-wallet"></i>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gateway Balance</span>
                                        <h2 style={{ fontSize: '1.4rem', color: '#0f172a', margin: '2px 0 0', fontWeight: 'bold' }}>{smsData.balance || 'Loading...'}</h2>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="admin-btn-secondary" 
                                        onClick={fetchSmsSettings}
                                        style={{ padding: '6px 10px', height: 'fit-content' }}
                                        title="Refresh balance"
                                    >
                                        <i className="fas fa-sync"></i>
                                    </button>
                                </div>

                                <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', borderLeft: '5px solid #eab308' }}>
                                    <div style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.3rem' }}>
                                        <i className="fas fa-paper-plane"></i>
                                    </div>
                                    <div>
                                        <span style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sent Today</span>
                                        <h2 style={{ fontSize: '1.4rem', color: '#0f172a', margin: '2px 0 0', fontWeight: 'bold' }}>{smsData.sent_today} SMS</h2>
                                    </div>
                                </div>

                                <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', borderLeft: '5px solid #3b82f6' }}>
                                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.3rem' }}>
                                        <i className="fas fa-calendar-week"></i>
                                    </div>
                                    <div>
                                        <span style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sent This Week</span>
                                        <h2 style={{ fontSize: '1.4rem', color: '#0f172a', margin: '2px 0 0', fontWeight: 'bold' }}>{smsData.sent_this_week} SMS</h2>
                                    </div>
                                </div>

                                <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', borderLeft: '5px solid #8b5cf6' }}>
                                    <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.3rem' }}>
                                        <i className="fas fa-chart-line"></i>
                                    </div>
                                    <div>
                                        <span style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sent This Month</span>
                                        <h2 style={{ fontSize: '1.4rem', color: '#0f172a', margin: '2px 0 0', fontWeight: 'bold' }}>{smsData.sent_this_month} SMS</h2>
                                    </div>
                                </div>
                            </div>

                            <div className="grid-2" style={{ gap: '25px', alignItems: 'start' }}>
                                {/* Left Side: Configurations form */}
                                <div className="admin-card" style={{ padding: '30px' }}>
                                    <h3 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                        <i className="fas fa-sliders-h" style={{ marginRight: '10px', color: '#c9a45c' }}></i>Gateway Configurations
                                    </h3>

                                    <form onSubmit={handleSmsSubmit}>
                                        <div className="form-group" style={{ marginBottom: '20px' }}>
                                            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Global SMS Toggle</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                                                    <input 
                                                        type="checkbox"
                                                        checked={smsData.sms_enabled === '1' || smsData.sms_enabled === 1 || smsData.sms_enabled === 'true'}
                                                        onChange={(e) => setSmsData({ ...smsData, sms_enabled: e.target.checked ? '1' : '0' })}
                                                        style={{ opacity: 0, width: 0, height: 0 }}
                                                    />
                                                    <span className="slider round" style={{
                                                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                                        background: (smsData.sms_enabled === '1' || smsData.sms_enabled === 1 || smsData.sms_enabled === 'true') ? '#c9a45c' : '#ccc',
                                                        transition: '.4s', borderRadius: '34px'
                                                    }}>
                                                        <span style={{
                                                            position: 'absolute', content: '""', height: '18px', width: '18px', left: '4px', bottom: '4px',
                                                            background: 'white', transition: '.4s', borderRadius: '50%',
                                                            transform: (smsData.sms_enabled === '1' || smsData.sms_enabled === 1 || smsData.sms_enabled === 'true') ? 'translateX(24px)' : 'none'
                                                        }}></span>
                                                    </span>
                                                </label>
                                                <span style={{ color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>
                                                    {(smsData.sms_enabled === '1' || smsData.sms_enabled === 1 || smsData.sms_enabled === 'true') ? 'Send SMS alerts for OTP and Leads' : 'Mute all SMS outgoing alerts'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '20px' }}>
                                            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Gateway API Endpoint URL</label>
                                            <input 
                                                type="url"
                                                className="admin-input"
                                                value={smsData.sms_gateway_url || ''}
                                                onChange={(e) => setSmsData({ ...smsData, sms_gateway_url: e.target.value })}
                                                placeholder="https://api.greenweb.com.bd/api.php"
                                                required
                                            />
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '20px' }}>
                                            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Gateway API Key / Token</label>
                                            <div style={{ position: 'relative' }}>
                                                <input 
                                                    type={revealApiKey ? 'text' : 'password'}
                                                    className="admin-input"
                                                    value={smsData.sms_api_key || ''}
                                                    onChange={(e) => setSmsData({ ...smsData, sms_api_key: e.target.value })}
                                                    placeholder="Enter SMS provider token/key"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setRevealApiKey(!revealApiKey)}
                                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                                                >
                                                    <i className={`fas ${revealApiKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '25px' }}>
                                            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Sender ID / Masking</label>
                                            <input 
                                                type="text"
                                                className="admin-input"
                                                value={smsData.sms_sender_id || ''}
                                                onChange={(e) => setSmsData({ ...smsData, sms_sender_id: e.target.value })}
                                                placeholder="Approved Sender ID or Caller mask"
                                            />
                                        </div>

                                        {hasPermission('settings.edit') && (
                                            <button 
                                                type="submit" 
                                                className="admin-btn-primary" 
                                                disabled={submitting}
                                            >
                                                {submitting ? 'Saving Configurations...' : 'Save SMS Configuration'}
                                            </button>
                                        )}
                                    </form>
                                </div>

                                {/* Right Side: Templates & Testing Console */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                    
                                    {/* Templates Form */}
                                    <div className="admin-card" style={{ padding: '30px' }}>
                                        <h3 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                            <i className="fas fa-file-alt" style={{ marginRight: '10px', color: '#c9a45c' }}></i>SMS Templates
                                        </h3>
                                        <form onSubmit={handleSmsSubmit}>
                                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>OTP / Verification SMS Template</label>
                                                <textarea 
                                                    rows="3"
                                                    className="admin-input"
                                                    value={smsData.sms_template_otp || ''}
                                                    onChange={(e) => setSmsData({ ...smsData, sms_template_otp: e.target.value })}
                                                    required
                                                />
                                                <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                                                    Use <code>{'{code}'}</code> placeholder to inject the generated 4-digit authentication OTP.
                                                </small>
                                            </div>

                                            <div className="form-group" style={{ marginBottom: '25px' }}>
                                                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Cost Estimate Notification Template</label>
                                                <textarea 
                                                    rows="3"
                                                    className="admin-input"
                                                    value={smsData.sms_template_lead || ''}
                                                    onChange={(e) => setSmsData({ ...smsData, sms_template_lead: e.target.value })}
                                                    required
                                                />
                                                <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                                                    Use <code>{'{name}'}</code> and <code>{'{cost}'}</code> placeholders to inject dynamic project variables.
                                                </small>
                                            </div>

                                            {hasPermission('settings.edit') && (
                                                <button 
                                                    type="submit" 
                                                    className="admin-btn-primary" 
                                                    disabled={submitting}
                                                >
                                                    {submitting ? 'Saving Templates...' : 'Update Templates'}
                                                </button>
                                            )}
                                        </form>
                                    </div>

                                    {/* Manual SMS Sender Console */}
                                    <div className="admin-card" style={{ padding: '30px', border: '1px dashed #c9a45c', background: 'rgba(201, 164, 92, 0.02)' }}>
                                        <h3 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '15px' }}>
                                            <i className="fas fa-paper-plane" style={{ marginRight: '10px', color: '#c9a45c' }}></i>Manual SMS Console
                                        </h3>
                                        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>
                                            Send a message directly to any phone number using your SMS gateway.
                                        </p>
                                        <form onSubmit={handleSendTestSms} autoComplete="off">
                                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '6px', fontSize: '0.9rem' }}>Recipient Phone Number</label>
                                                <input 
                                                    type="text"
                                                    className="admin-input"
                                                    value={testSms.phone || ''}
                                                    onChange={(e) => setTestSms({ ...testSms, phone: e.target.value })}
                                                    placeholder="e.g. 01700000000"
                                                    name="direct_recipient_num_rand"
                                                    id="direct_recipient_num_rand"
                                                    autoComplete="off"
                                                    required
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '6px', fontSize: '0.9rem' }}>SMS Content</label>
                                                <textarea 
                                                    rows="2"
                                                    className="admin-input"
                                                    value={testSms.message || ''}
                                                    onChange={(e) => setTestSms({ ...testSms, message: e.target.value })}
                                                    placeholder="Type your message here..."
                                                    name="direct_msg_body_rand"
                                                    id="direct_msg_body_rand"
                                                    autoComplete="off"
                                                    required
                                                />
                                            </div>
                                            <button 
                                                type="submit" 
                                                className="admin-btn-primary" 
                                                style={{ background: '#0f172a', borderColor: '#0f172a' }}
                                                disabled={sendingTest}
                                            >
                                                {sendingTest ? (
                                                    <>
                                                        <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i>Send Message
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </div>

                                </div>
                            </div>

                            {/* SMS SENT HISTORY LOGS DASHBOARD */}
                            <div className="admin-card" style={{ marginTop: '25px', padding: '30px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                    <h3 style={{ fontSize: '1.2rem', color: '#0f172a', margin: 0 }}>
                                        <i className="fas fa-list-alt" style={{ marginRight: '10px', color: '#c9a45c' }}></i>SMS Sent Log History
                                    </h3>
                                    <button 
                                        type="button" 
                                        className="admin-btn-secondary" 
                                        onClick={() => fetchSmsHistory()}
                                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                    >
                                        <i className="fas fa-sync"></i> Refresh History
                                    </button>
                                </div>

                                <div className="card-filters" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                                    <form onSubmit={handleSearchSms} className="search-bar" style={{ flex: '1', maxWidth: '400px', display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            placeholder="Search by phone, message, or gateway..."
                                            value={searchInput}
                                            onChange={(e) => setSearchInput(e.target.value)}
                                        />
                                        <button type="submit" className="admin-btn-primary" style={{ padding: '0 18px' }}>
                                            <i className="fas fa-search"></i>
                                        </button>
                                    </form>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <select
                                            className="admin-input"
                                            value={smsFilters.status}
                                            onChange={(e) => setSmsFilters({ ...smsFilters, status: e.target.value, page: 1 })}
                                            style={{ width: '150px' }}
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="SUCCESS">Success Only</option>
                                            <option value="FAILED">Failed Only</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Recipient Phone</th>
                                                <th>Gateway</th>
                                                <th>Message</th>
                                                <th>Status</th>
                                                <th>Sent Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {smsLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                                        No SMS logs found matching the filters.
                                                    </td>
                                                </tr>
                                            ) : (
                                                smsLogs.map((log) => (
                                                    <tr key={log.id}>
                                                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{log.to}</td>
                                                        <td>
                                                            <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
                                                                {log.gateway}
                                                            </span>
                                                        </td>
                                                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem' }} title={log.message}>
                                                            {log.message}
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <span className={`status-badge ${log.status === 'SUCCESS' ? 'active' : 'inactive'}`} style={{
                                                                    background: log.status === 'SUCCESS' ? '#ecfdf5' : '#fef2f2',
                                                                    color: log.status === 'SUCCESS' ? '#065f46' : '#991b1b',
                                                                    padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                                                                    whiteSpace: 'nowrap', display: 'inline-block', textAlign: 'center'
                                                                }}>
                                                                    {log.status}
                                                                </span>
                                                                {log.status === 'FAILED' && log.error_message && (
                                                                    <span style={{ fontSize: '0.75rem', color: '#dc2626', maxWidth: '180px' }}>
                                                                        {log.error_message}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                            {new Date(log.created_at).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* SMS History Pagination */}
                                {smsPagination.last_page > 1 && (
                                    <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                                        <button
                                            type="button"
                                            className="admin-btn-secondary"
                                            disabled={smsFilters.page === 1}
                                            onClick={() => setSmsFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                            style={{ padding: '8px 16px' }}
                                        >
                                            <i className="fas fa-chevron-left" style={{ marginRight: '6px' }}></i>Previous
                                        </button>
                                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                            Page <strong>{smsFilters.page}</strong> of <strong>{smsPagination.last_page}</strong> ({smsPagination.total} logs)
                                        </span>
                                        <button
                                            type="button"
                                            className="admin-btn-secondary"
                                            disabled={smsFilters.page === smsPagination.last_page}
                                            onClick={() => setSmsFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                            style={{ padding: '8px 16px' }}
                                        >
                                            Next<i className="fas fa-chevron-right" style={{ marginLeft: '6px' }}></i>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* FLOATING MODAL POPUP FOR ACTIVITY LOG CHANGES */}
            {selectedLogModal && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 1100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                    onClick={() => setSelectedLogModal(null)}
                >
                    <div 
                        style={{
                            background: '#ffffff',
                            width: '100%',
                            maxWidth: '850px',
                            borderRadius: '16px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            maxHeight: '90vh'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* MODAL HEADER */}
                        <div style={{ padding: '20px 24px', background: '#1e293b', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <i className="fas fa-history" style={{ color: 'var(--admin-gold)' }}></i>
                                    Activity Log #{selectedLogModal.id} Details
                                </h3>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                                    {selectedLogModal.description} • By <strong>{selectedLogModal.user ? selectedLogModal.user.name : 'System'}</strong> ({new Date(selectedLogModal.created_at).toLocaleString()})
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedLogModal(null)}
                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}
                                title="Close Popup"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* MODAL BODY */}
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                            
                            {/* METADATA SUMMARY BAR */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: '#fff', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '0.84rem' }}>
                                <div>
                                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Action Type:</span>
                                    <span style={{ fontWeight: 'bold', textTransform: 'uppercase', color: selectedLogModal.action === 'created' ? '#047857' : selectedLogModal.action === 'deleted' ? '#b91c1c' : '#b45309' }}>
                                        {selectedLogModal.action}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>IP Address:</span>
                                    <strong><code>{selectedLogModal.ip_address || 'N/A'}</code></strong>
                                </div>
                                <div>
                                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>User Email:</span>
                                    <strong>{selectedLogModal.user ? selectedLogModal.user.email : 'System Log'}</strong>
                                </div>
                            </div>

                            {/* SIDE-BY-SIDE PROPERTY DIFF COMPARISON */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                                <div>
                                    <strong style={{ color: '#475569', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                        <i className="fas fa-history" style={{ color: '#38bdf8' }}></i> Before Update (Old Properties)
                                    </strong>
                                    <div style={{ background: '#0f172a', color: '#38bdf8', padding: '16px', borderRadius: '10px', fontSize: '0.8rem', overflowX: 'auto', minHeight: '160px', border: '1px solid #1e293b' }}>
                                        {renderFormattedProperties(selectedLogModal.old_properties, "No prior properties (Item created)")}
                                    </div>
                                </div>

                                <div>
                                    <strong style={{ color: '#475569', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                        <i className="fas fa-plus-circle" style={{ color: '#10b981' }}></i> After Update (New Properties)
                                    </strong>
                                    <div style={{ background: '#0f172a', color: '#10b981', padding: '16px', borderRadius: '10px', fontSize: '0.8rem', overflowX: 'auto', minHeight: '160px', border: '1px solid #1e293b' }}>
                                        {renderFormattedProperties(selectedLogModal.new_properties, "No new properties (Item deleted)")}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MODAL FOOTER */}
                        <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setSelectedLogModal(null)}
                                className="admin-btn-primary"
                                style={{ padding: '10px 24px', fontSize: '0.9rem', borderRadius: '8px', background: '#334155', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                            >
                                <i className="fas fa-arrow-left"></i> Back to Activity List
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 6: Marketing & Analytics */}
            {activeTab === 'marketing' && hasPermission('settings.view') && (
                <div>
                    {/* Header Status Row */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '180px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '12px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', border: '1px solid #334155' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(201,164,92,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-tag" style={{ color: '#c9a45c', fontSize: '1.2rem' }}></i>
                            </div>
                            <div>
                                <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>GTM Container</p>
                                <p style={{ color: marketingData.gtm_id ? '#c9a45c' : '#64748b', fontWeight: 700, margin: '3px 0 0', fontSize: '0.95rem', fontFamily: 'monospace' }}>{marketingData.gtm_id || 'Not configured'}</p>
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '180px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '12px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', border: '1px solid #334155' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(30,144,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fab fa-meta" style={{ color: '#1877f2', fontSize: '1.2rem' }}></i>
                            </div>
                            <div>
                                <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Meta Pixel</p>
                                <p style={{ color: marketingData.meta_pixel_id ? '#c9a45c' : '#64748b', fontWeight: 700, margin: '3px 0 0', fontSize: '0.95rem', fontFamily: 'monospace' }}>{marketingData.meta_pixel_id || 'Not configured'}</p>
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '180px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '12px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', border: '1px solid #334155' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: (marketingData.analytics_enabled === '1' || marketingData.analytics_enabled === 1 || marketingData.analytics_enabled === 'true' || marketingData.analytics_enabled === true) ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-broadcast-tower" style={{ color: (marketingData.analytics_enabled === '1' || marketingData.analytics_enabled === 1 || marketingData.analytics_enabled === 'true' || marketingData.analytics_enabled === true) ? '#10b981' : '#ef4444', fontSize: '1.2rem' }}></i>
                            </div>
                            <div>
                                <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tracking Status</p>
                                <p style={{ color: (marketingData.analytics_enabled === '1' || marketingData.analytics_enabled === 1 || marketingData.analytics_enabled === 'true' || marketingData.analytics_enabled === true) ? '#10b981' : '#ef4444', fontWeight: 700, margin: '3px 0 0', fontSize: '0.95rem' }}>
                                    {(marketingData.analytics_enabled === '1' || marketingData.analytics_enabled === 1 || marketingData.analytics_enabled === 'true' || marketingData.analytics_enabled === true) ? '✓ Tracking Enabled' : '✗ Tracking Disabled'}
                                </p>
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '180px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '12px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', border: '1px solid #334155' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-server" style={{ color: '#8b5cf6', fontSize: '1.2rem' }}></i>
                            </div>
                            <div>
                                <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CAPI Server-Side</p>
                                <p style={{ color: marketingData.meta_capi_access_token && marketingData.meta_capi_access_token !== '' ? '#10b981' : '#64748b', fontWeight: 700, margin: '3px 0 0', fontSize: '0.95rem' }}>{marketingData.meta_capi_access_token && marketingData.meta_capi_access_token !== '' ? '✓ Configured' : 'Not configured'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Master Switch */}
                    <div className="admin-card" style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 4px' }}>
                                    <i className="fas fa-broadcast-tower" style={{ marginRight: '10px', color: '#c9a45c' }}></i>Master Analytics Switch
                                </h3>
                                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Globally enable or disable all client-side tracking (GTM, GA4, Meta Pixel) and server-side CAPI events.</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{(marketingData.analytics_enabled === '1' || marketingData.analytics_enabled === 1 || marketingData.analytics_enabled === 'true' || marketingData.analytics_enabled === true) ? 'Enabled' : 'Disabled'}</span>
                                <div
                                    onClick={() => hasPermission('settings.edit') && setMarketingData(prev => ({ ...prev, analytics_enabled: (prev.analytics_enabled === '1' || prev.analytics_enabled === 1 || prev.analytics_enabled === 'true' || prev.analytics_enabled === true) ? '0' : '1' }))}
                                    style={{
                                        width: '52px', height: '28px', borderRadius: '14px', cursor: hasPermission('settings.edit') ? 'pointer' : 'not-allowed',
                                        background: (marketingData.analytics_enabled === '1' || marketingData.analytics_enabled === 1 || marketingData.analytics_enabled === 'true' || marketingData.analytics_enabled === true) ? '#c9a45c' : '#cbd5e1',
                                        transition: 'background 0.3s ease', position: 'relative', flexShrink: 0
                                    }}
                                >
                                    <div style={{
                                        width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
                                        position: 'absolute', top: '3px',
                                        left: (marketingData.analytics_enabled === '1' || marketingData.analytics_enabled === 1 || marketingData.analytics_enabled === 'true' || marketingData.analytics_enabled === true) ? '27px' : '3px',
                                        transition: 'left 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* GTM & GA4 Section */}
                    <div className="admin-card" style={{ marginBottom: '20px' }}>
                        <div className="card-header" style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 4px' }}>
                                <i className="fas fa-tag" style={{ marginRight: '10px', color: '#c9a45c' }}></i>Google Tag Manager (GTM) & GA4
                            </h3>
                            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Enter your GTM Container ID. GA4 is managed through GTM — set up a GA4 tag inside your GTM workspace.</p>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>GTM Container ID</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={marketingData.gtm_id || ''}
                                onChange={(e) => setMarketingData({ ...marketingData, gtm_id: e.target.value })}
                                placeholder="GTM-XXXXXXX"
                                disabled={!hasPermission('settings.edit')}
                                style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                            />
                            <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '6px', margin: '6px 0 0' }}>
                                <i className="fas fa-info-circle" style={{ marginRight: '5px' }}></i>
                                Found in <strong>GTM → Admin → Container Settings</strong>. Format: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>GTM-XXXXXXX</code>
                            </p>
                        </div>
                    </div>

                    {/* Meta Pixel Section */}
                    <div className="admin-card" style={{ marginBottom: '20px' }}>
                        <div className="card-header" style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 4px' }}>
                                <i className="fab fa-meta" style={{ marginRight: '10px', color: '#1877f2' }}></i>Meta Pixel (Browser-Side)
                            </h3>
                            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Your Meta Pixel ID for browser-side event tracking. Works alongside the server-side CAPI for full coverage.</p>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Meta Pixel ID</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={marketingData.meta_pixel_id || ''}
                                onChange={(e) => setMarketingData({ ...marketingData, meta_pixel_id: e.target.value })}
                                placeholder="123456789012345"
                                disabled={!hasPermission('settings.edit')}
                                style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                            />
                            <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '6px', margin: '6px 0 0' }}>
                                <i className="fas fa-info-circle" style={{ marginRight: '5px' }}></i>
                                Found in <strong>Meta Business Suite → Events Manager → Your Pixel</strong>.
                            </p>
                        </div>
                    </div>

                    {/* Meta Conversions API Section */}
                    <div className="admin-card" style={{ marginBottom: '24px' }}>
                        <div className="card-header" style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 4px' }}>
                                <i className="fas fa-server" style={{ marginRight: '10px', color: '#8b5cf6' }}></i>Meta Conversions API (Server-Side / CAPI)
                            </h3>
                            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Server-side events sent directly from Laravel backend. Provides reliable tracking even when ad blockers are active.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>CAPI Access Token</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={revealCapiToken ? 'text' : 'password'}
                                        className="admin-input"
                                        value={marketingData.meta_capi_access_token || ''}
                                        onChange={(e) => setMarketingData({ ...marketingData, meta_capi_access_token: e.target.value })}
                                        placeholder="Enter your CAPI Access Token"
                                        disabled={!hasPermission('settings.edit')}
                                        style={{ fontFamily: 'monospace', paddingRight: '44px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setRevealCapiToken(prev => !prev)}
                                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                                    >
                                        <i className={`fas ${revealCapiToken ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                                <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '6px 0 0' }}>
                                    <i className="fas fa-info-circle" style={{ marginRight: '5px' }}></i>
                                    Found in <strong>Events Manager → Your Pixel → Settings → Conversions API</strong>. Kept masked for security.
                                </p>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>CAPI API Version</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={marketingData.meta_capi_api_version || 'v19.0'}
                                    onChange={(e) => setMarketingData({ ...marketingData, meta_capi_api_version: e.target.value })}
                                    placeholder="v19.0"
                                    disabled={!hasPermission('settings.edit')}
                                    style={{ fontFamily: 'monospace' }}
                                />
                                <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '6px 0 0' }}>Default: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>v19.0</code></p>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Test Event Code <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span></label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={marketingData.meta_capi_test_event_code || ''}
                                    onChange={(e) => setMarketingData({ ...marketingData, meta_capi_test_event_code: e.target.value })}
                                    placeholder="TEST12345"
                                    disabled={!hasPermission('settings.edit')}
                                    style={{ fontFamily: 'monospace' }}
                                />
                                <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '6px 0 0' }}>
                                    <i className="fas fa-flask" style={{ marginRight: '5px' }}></i>
                                    Use this during testing from <strong>Events Manager → Test Events</strong>. Remove for production.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* How It Works Info Box */}
                    <div style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', border: '1px solid #bae6fd', borderRadius: '12px', padding: '18px 22px', marginBottom: '24px' }}>
                        <h4 style={{ color: '#0369a1', fontSize: '0.95rem', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-lightbulb"></i> How it works
                        </h4>
                        <ul style={{ color: '#0369a1', fontSize: '0.85rem', margin: 0, paddingLeft: '18px', lineHeight: '1.8' }}>
                            <li><strong>GTM Container ID</strong> — Loads Google Tag Manager on the website. Configure GA4 tags inside GTM.</li>
                            <li><strong>Meta Pixel ID</strong> — Fires browser-side events (PageView, Lead, Purchase) for audience targeting.</li>
                            <li><strong>Meta CAPI Access Token</strong> — Sends events server-side from Laravel for ad blocker–proof tracking.</li>
                            <li><strong>Deduplication</strong> — Browser pixel and server events share the same <code style={{ background: '#bae6fd', padding: '1px 5px', borderRadius: '3px' }}>event_id</code> to prevent double-counting.</li>
                        </ul>
                    </div>

                    {/* Save Button */}
                    {hasPermission('settings.edit') && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleMarketingSubmit}
                                disabled={marketingSubmitting}
                                className="admin-btn-primary"
                                style={{ padding: '12px 28px', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '8px', background: marketingSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #c9a45c, #e8c47a)', border: 'none', color: '#0f172a', fontWeight: 700, cursor: marketingSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(201,164,92,0.35)', transition: 'all 0.2s ease' }}
                            >
                                {marketingSubmitting
                                    ? <><i className="fas fa-spinner fa-spin"></i> Saving Settings...</>
                                    : <><i className="fas fa-save"></i> Save Marketing Settings</>}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Confirm Force Logout Session Modal */}
            <ConfirmModal
                isOpen={confirmRevokeOpen}
                onClose={() => { setConfirmRevokeOpen(false); setSessionToRevoke(null); }}
                onConfirm={handleConfirmRevoke}
                title="Revoke Device Session"
                message={`Are you sure you want to revoke the session for ${sessionToRevoke?.user_name} (${sessionToRevoke?.user_email})? This action will immediately log out the device.`}
                confirmText={submitting ? 'Revoking...' : 'Yes, Revoke Session'}
                cancelText="Cancel"
            />
        </div>
    );
};

export default SystemSettings;
