import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import './Admin.css';
import '../../components/ConsultationModal/ConsultationModal.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ConsultationManager = () => {
    const toast = useToast();
    const { hasPermission } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialStatus = searchParams.get('status');

    const [allConsultations, setAllConsultations] = useState([]);
    const [metrics, setMetrics] = useState({
        total: 0,
        new: 0,
        contacted: 0,
        qualified: 0,
        closed: 0
    });
    const [activeTab, setActiveTab] = useState(initialStatus || 'All'); // 'All', 'New', 'Contacted', 'Qualified', 'Closed'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [internalNotes, setInternalNotes] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState('');

    useEffect(() => {
        const urlStatus = searchParams.get('status');
        if (urlStatus && urlStatus !== activeTab) {
            setActiveTab(urlStatus);
        } else if (!urlStatus && activeTab !== 'All') {
            // Keep default tab if no status in query
        }
    }, [searchParams]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'All') {
            searchParams.delete('status');
            setSearchParams(searchParams);
        } else {
            setSearchParams({ status: tab });
        }
    };

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formFields, setFormFields] = useState([]);

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        api.get('/admin/form-fields')
            .then(res => setFormFields(res.data))
            .catch(err => console.error("Failed to load form fields mapping:", err));
    }, []);

    const getFieldLabel = (fieldName) => {
        const found = formFields.find(f => f.field_name === fieldName);
        if (found) return found.label;
        return fieldName
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/consultation-requests');
            const allData = res.data || [];
            setAllConsultations(allData);
            setMetrics({
                total: allData.length,
                new: allData.filter(r => r.status === 'New').length,
                contacted: allData.filter(r => r.status === 'Contacted').length,
                qualified: allData.filter(r => r.status === 'Qualified').length,
                closed: allData.filter(r => r.status === 'Closed').length
            });
        } catch (err) {
            console.error("Failed to fetch consultation requests:", err);
            toast.error('Failed to fetch consultation records.');
        } finally {
            setLoading(false);
        }
    };

    // Filter requests in memory based on activeTab and searchTerm for instant results
    const requests = allConsultations.filter(r => {
        const matchesTab = activeTab === 'All' || (r.status || 'New').toLowerCase() === activeTab.toLowerCase();
        if (!matchesTab) return false;
        if (!searchTerm.trim()) return true;

        const term = searchTerm.toLowerCase();
        const nameMatch = (r.full_name || '').toLowerCase().includes(term);
        const phoneMatch = (r.phone || '').toLowerCase().includes(term);
        const emailMatch = (r.email || '').toLowerCase().includes(term);
        const locationMatch = (r.location || '').toLowerCase().includes(term);
        const projectMatch = (r.project_type || '').toLowerCase().includes(term);
        const notesMatch = (r.notes || '').toLowerCase().includes(term);
        const idMatch = `#cr-${String(r.id).padStart(3, '0')}`.toLowerCase().includes(term) || String(r.id).includes(term);

        return nameMatch || phoneMatch || emailMatch || locationMatch || projectMatch || notesMatch || idMatch;
    });

    const handleViewDetails = (req) => {
        setSelectedRequest(req);
        setInternalNotes(req.internal_notes || '');
        setUpdatingStatus(req.status);
    };

    const handleUpdateDetails = async (e) => {
        e.preventDefault();
        if (!selectedRequest) return;

        try {
            await api.put(`/consultation-requests/${selectedRequest.id}`, {
                status: updatingStatus,
                internal_notes: internalNotes
            });
            toast.success('Inquiry details updated successfully!');
            setSelectedRequest(null);
            fetchRequests();
        } catch (err) {
            console.error("Failed to update inquiry details:", err);
            toast.error('Failed to update inquiry details.');
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteTargetId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        setConfirmOpen(false);
        if (!deleteTargetId) return;

        try {
            await api.delete(`/consultation-requests/${deleteTargetId}`);
            toast.success('Consultation request deleted successfully!');
            if (selectedRequest && selectedRequest.id === deleteTargetId) {
                setSelectedRequest(null);
            }
            fetchRequests();
        } catch (err) {
            console.error("Failed to delete request:", err);
            toast.error('Failed to delete request.');
        } finally {
            setDeleteTargetId(null);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'New': return 'badge-new';
            case 'Contacted': return 'badge-contacted';
            case 'Qualified': return 'badge-qualified';
            case 'Closed': return 'badge-closed';
            default: return '';
        }
    };

    const getSourceLabel = (src) => {
        if (src === 'estimator') return 'Cost Estimator';
        return src === 'cta_modal' ? 'CTA Modal' : 'Contact Page';
    };

    const getFlatStatusLabel = (status) => {
        switch (status) {
            case 'New Flat': return 'Ready for Interior';
            case 'Under Construction': return 'Under Construction';
            case 'Renovation': return 'Not Ready';
            default: return status;
        }
    };

    // Parse form_data securely for details modal
    let parsedFormData = {};
    let flatConditionValue = null;
    if (selectedRequest && selectedRequest.form_data) {
        if (typeof selectedRequest.form_data === 'string') {
            try {
                parsedFormData = JSON.parse(selectedRequest.form_data);
            } catch (e) {
                console.error("Failed to parse form_data:", e);
                parsedFormData = {};
            }
        } else if (typeof selectedRequest.form_data === 'object' && selectedRequest.form_data !== null) {
            parsedFormData = selectedRequest.form_data;
        }
        if (parsedFormData && typeof parsedFormData === 'object') {
            flatConditionValue = parsedFormData.ready_flat || parsedFormData.flat_condition || parsedFormData.flat_status;
        } else {
            parsedFormData = {};
        }
    }

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Consultation Requests</h1>
                    <p>Track, qualify, and manage incoming interior design and architecture leads.</p>
                </div>
            </div>

            {/* Metrics cards */}
            <div className="admin-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="metric-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                    <div style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Total Inquiries</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', marginTop: '10px' }}>{metrics.total}</div>
                </div>
                <div className="metric-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                    <div style={{ color: '#3b82f6', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>New</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', marginTop: '10px' }}>{metrics.new}</div>
                </div>
                <div className="metric-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                    <div style={{ color: '#f97316', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Contacted</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', marginTop: '10px' }}>{metrics.contacted}</div>
                </div>
                <div className="metric-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                    <div style={{ color: '#eab308', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Qualified</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', marginTop: '10px' }}>{metrics.qualified}</div>
                </div>
                <div className="metric-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                    <div style={{ color: '#22c55e', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Closed</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', marginTop: '10px' }}>{metrics.closed}</div>
                </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
                <div className="categories-chips" style={{ marginBottom: 0 }}>
                    {['All', 'New', 'Contacted', 'Qualified', 'Closed'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`cat-chip ${activeTab.toLowerCase() === tab.toLowerCase() ? 'active' : ''}`}
                            style={{ cursor: 'pointer', border: '1px solid #e2e8f0', fontFamily: 'inherit' }}
                        >
                            {tab} Requests
                            <span className="chip-count" style={{ marginLeft: '8px' }}>
                                {tab === 'All' ? metrics.total : metrics[tab.toLowerCase()]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Instant Search Bar */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem', pointerEvents: 'none' }}></i>
                    <input
                        type="text"
                        placeholder="Search by Name, Phone, Email, Location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '10px 40px 10px 38px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            color: '#1e293b',
                            outline: 'none',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            transition: 'all 0.2s ease',
                            fontFamily: 'inherit'
                        }}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '0',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                fontSize: '0.85rem',
                                transition: 'color 0.2s ease'
                            }}
                            title="Clear search"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                </div>
            </div>

            {/* Requests Table */}
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Full Name</th>
                            <th>Contact details</th>
                            <th>Project parameters</th>
                            <th>Submission Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Loading inquiries...</td></tr>
                        ) : requests.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No inquiries found in this status.</td></tr>
                        ) : (
                            requests.map(req => (
                                <tr key={req.id}>
                                    <td><strong>#CR-{String(req.id).padStart(3, '0')}</strong></td>
                                    <td>
                                        <div>
                                            <strong style={{ color: '#1f2937' }}>{req.full_name}</strong>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                                                via <span style={{ fontWeight: 600 }}>{getSourceLabel(req.source)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.9rem' }}>
                                            <div><i className="fas fa-phone-alt" style={{ color: '#c5a059', marginRight: '6px', fontSize: '0.8rem' }}></i>{req.phone}</div>
                                            <div style={{ color: '#64748b', marginTop: '4px' }}><i className="far fa-envelope" style={{ color: '#c5a059', marginRight: '6px', fontSize: '0.8rem' }}></i>{req.email}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.9rem' }}>
                                            <span style={{ fontWeight: 600, color: '#475569' }}>{req.project_type}</span>
                                            <div style={{ color: '#64748b', marginTop: '4px', fontSize: '0.8rem' }}>
                                                {req.property_size} Sq Ft | {req.budget_range}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                                            {new Date(req.created_at).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getStatusBadgeClass(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-row">
                                            <button 
                                                onClick={() => handleViewDetails(req)} 
                                                className="action-btn edit-btn" 
                                                title="View Details"
                                                style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' }}
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            {hasPermission('consultations.delete') && (
                                                <button 
                                                    onClick={() => handleDeleteClick(req.id)} 
                                                    className="action-btn delete-btn" 
                                                    title="Delete Inquiry"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Details Modal / Sidebar Drawer */}
            {selectedRequest && (
                <div className="consultation-modal-overlay" onClick={() => setSelectedRequest(null)}>
                    <div 
                        className="consultation-modal-box" 
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '750px', background: '#fff' }}
                    >
                        <button className="consultation-modal-close" onClick={() => setSelectedRequest(null)}>
                            <i className="fas fa-times"></i>
                        </button>

                        <div className="consultation-modal-header" style={{ textAlign: 'left', marginBottom: '25px' }}>
                            <h2 style={{ fontSize: '1.6rem' }}>Inquiry Details #CR-{String(selectedRequest.id).padStart(3, '0')}</h2>
                            <p style={{ margin: '5px 0 0' }}>Received on {new Date(selectedRequest.created_at).toLocaleString()}</p>
                        </div>

                        <form onSubmit={handleUpdateDetails} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Grid specs */}
                            <div className="details-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Full Name</span>
                                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', marginTop: '2px' }}>{selectedRequest.full_name}</div>
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Phone Number</span>
                                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem', marginTop: '2px' }}>{selectedRequest.phone}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Email Address</span>
                                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem', marginTop: '2px' }}>{selectedRequest.email}</div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                        <div>
                                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Project Type</span>
                                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', marginTop: '2px' }}>{selectedRequest.project_type}</div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Property Size</span>
                                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', marginTop: '2px' }}>{selectedRequest.property_size} Sq Ft</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                        <div>
                                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                                                {selectedRequest.source === 'estimator' ? 'Estimated Cost' : 'Budget Range'}
                                            </span>
                                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', marginTop: '2px' }}>{selectedRequest.budget_range}</div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Submission Source</span>
                                            <div style={{ fontWeight: 600, color: '#c5a059', fontSize: '0.9rem', marginTop: '2px' }}>{getSourceLabel(selectedRequest.source)}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Project Location</span>
                                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', marginTop: '2px' }}>
                                                <i className="fas fa-map-marker-alt" style={{ marginRight: '5px', color: '#c5a059' }}></i>{selectedRequest.location}
                                            </div>
                                        </div>
                                        {flatConditionValue && (
                                            <div>
                                                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Flat Condition</span>
                                                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', marginTop: '2px' }}>
                                                    <i className="fas fa-key" style={{ marginRight: '5px', color: '#c5a059' }}></i>{getFlatStatusLabel(flatConditionValue)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {(() => {
                                // Exclude core fields already displayed in main blocks
                                const coreKeys = ['full_name', 'phone', 'email', 'project_type', 'property_size', 'budget_range', 'location', 'notes', 'source', 'ready_flat', 'flat_condition', 'flat_status'];
                                const customFields = Object.entries(parsedFormData).filter(([key]) => !coreKeys.includes(key));

                                if (customFields.length === 0) return null;

                                return (
                                    <div style={{ marginTop: '5px' }}>
                                        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '10px', letterSpacing: '0.5px' }}>
                                            Additional Inquiry Information
                                        </h4>
                                        <div className="custom-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: '#f8fafc', padding: '15px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            {customFields.map(([key, val]) => (
                                                <div key={key}>
                                                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                                                        {getFieldLabel(key)}
                                                    </span>
                                                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', marginTop: '2px' }}>
                                                        {val || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Not Provided</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Client message notes */}
                            <div>
                                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.5px' }}>Tell Us About Your Project</h4>
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', fontSize: '0.95rem', color: '#334155', lineHeight: '1.6', minHeight: '80px', whiteSpace: 'pre-line' }}>
                                    {selectedRequest.notes || 'No project description provided.'}
                                </div>
                            </div>

                            {/* Update Status and Internal Notes */}
                            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px', marginTop: '10px' }}>
                                <div className="form-field-group">
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Lifecycle Status</label>
                                    <select 
                                        value={updatingStatus} 
                                        onChange={(e) => setUpdatingStatus(e.target.value)}
                                        style={{ background: '#fff', border: '2px solid #cbd5e1' }}
                                    >
                                        <option value="New">New</option>
                                        <option value="Contacted">Contacted</option>
                                        <option value="Qualified">Qualified</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Internal Admin Notes</label>
                                    <textarea 
                                        value={internalNotes} 
                                        onChange={(e) => setInternalNotes(e.target.value)}
                                        placeholder="Record call logs, follow-up timelines, client demands, or budget qualification notes..."
                                        rows="3"
                                        style={{ background: '#fff', border: '2px solid #cbd5e1' }}
                                    ></textarea>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '15px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setSelectedRequest(null)} 
                                    className="view-btn action-btn"
                                    style={{ padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 600 }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="admin-btn-primary"
                                    style={{ padding: '12px 30px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                                >
                                    Save Updates
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={confirmOpen}
                title="Delete Consultation Inquiry"
                message="Are you sure you want to permanently delete this consultation request from database archives?"
                confirmText="Delete Permanently"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default ConsultationManager;
