import React, { useState, useEffect } from 'react';
import api, { BASE_URL } from '../../../api/axios';
import '../Admin.css';
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

const EstimatorLeads = () => {
    const toast = useToast();
    const { hasPermission } = useAuth();
    const [leads, setLeads] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPackageFilter, setSelectedPackageFilter] = useState('');
    const [selectedFlatStatusFilter, setSelectedFlatStatusFilter] = useState('');
    
    // Detailed view modal state
    const [selectedLead, setSelectedLead] = useState(null);
    const [leadDetails, setLeadDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Delete confirmation state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    useEffect(() => {
        fetchLeads();
        fetchPackages();
    }, [searchTerm, selectedPackageFilter, selectedFlatStatusFilter]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/estimator/leads', {
                params: {
                    search: searchTerm,
                    package_id: selectedPackageFilter,
                    flat_status: selectedFlatStatusFilter
                }
            });
            setLeads(res.data);
        } catch (err) {
            console.error("Failed to fetch leads:", err);
            toast.error('Failed to fetch lead records.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPackages = async () => {
        try {
            const res = await api.get('/admin/estimator/packages');
            setPackages(res.data);
        } catch (err) {
            console.error("Failed to load packages:", err);
        }
    };

    const handleViewDetails = async (lead) => {
        setSelectedLead(lead);
        setDetailsLoading(true);
        try {
            const res = await api.get(`/admin/estimator/leads/${lead.id}`);
            setLeadDetails(res.data);
        } catch (err) {
            console.error("Failed to fetch lead details:", err);
            toast.error('Failed to retrieve detailed selections for this lead.');
            setSelectedLead(null);
        } finally {
            setDetailsLoading(false);
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
            await api.delete(`/admin/estimator/leads/${deleteTargetId}`);
            toast.success('Lead entry deleted successfully.');
            if (selectedLead && selectedLead.id === deleteTargetId) {
                setSelectedLead(null);
                setLeadDetails(null);
            }
            fetchLeads();
        } catch (err) {
            console.error("Failed to delete lead:", err);
            toast.error('Failed to delete lead entry.');
        } finally {
            setDeleteTargetId(null);
        }
    };

    const handleDownloadPdf = (id) => {
        window.open(`${BASE_URL}/estimator/download-pdf/${id}`, '_blank');
    };

    const getFlatStatusLabel = (status) => {
        if (!status) return 'Ready for Interior';
        const s = status.toLowerCase();
        if (s.includes('new') || s.includes('ready')) return 'Ready for Interior';
        if (s.includes('construction') || s.includes('under')) return 'Under Construction';
        if (s.includes('renovated') || s.includes('renovation') || s.includes('not ready')) return 'Not Ready';
        return status;
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            maximumFractionDigits: 0,
        }).format(val || 0).replace('BDT', '৳');
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Cost Calculator Leads</h1>
                    <p>Track customer cost calculations, details of selected add-ons, and download generated estimate PDFs.</p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="admin-card" style={{ marginBottom: '30px', padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' }}>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    
                    {/* Search Field */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '280px', minWidth: '240px', gap: '8px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <i className="fas fa-search" style={{ color: '#c9a45c' }}></i> Search Leads
                        </label>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <input
                                type="text"
                                className="admin-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Name, Phone, or Ref #..."
                                style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    paddingLeft: '38px',
                                    paddingRight: searchTerm ? '35px' : '15px',
                                    height: '42px',
                                    fontSize: '0.88rem',
                                    borderRadius: '10px',
                                    border: '1px solid #cbd5e1',
                                    background: '#f8fafc',
                                    color: '#1e293b',
                                    margin: 0
                                }}
                            />
                            <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}></i>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        padding: '4px'
                                    }}
                                    title="Clear search"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Flat Condition Filter */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '210px', minWidth: '180px', gap: '8px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <i className="fas fa-building" style={{ color: '#c9a45c' }}></i> Flat Condition
                        </label>
                        <select
                            className="admin-select"
                            value={selectedFlatStatusFilter}
                            onChange={(e) => setSelectedFlatStatusFilter(e.target.value)}
                            style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                height: '42px',
                                fontSize: '0.88rem',
                                borderRadius: '10px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                color: '#1e293b',
                                cursor: 'pointer',
                                margin: 0
                            }}
                        >
                            <option value="">All Conditions</option>
                            <option value="New Flat">Ready for Interior</option>
                            <option value="Under Construction">Under Construction</option>
                            <option value="Renovation">Not Ready</option>
                        </select>
                    </div>

                    {/* Package Filter */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '210px', minWidth: '180px', gap: '8px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <i className="fas fa-cubes" style={{ color: '#c9a45c' }}></i> Package
                        </label>
                        <select
                            className="admin-select"
                            value={selectedPackageFilter}
                            onChange={(e) => setSelectedPackageFilter(e.target.value)}
                            style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                height: '42px',
                                fontSize: '0.88rem',
                                borderRadius: '10px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                color: '#1e293b',
                                cursor: 'pointer',
                                margin: 0
                            }}
                        >
                            <option value="">All Packages</option>
                            {packages.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Reset Filters Button */}
                    {(searchTerm || selectedFlatStatusFilter || selectedPackageFilter) && (
                        <div style={{ height: '42px', display: 'flex', alignItems: 'center' }}>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedFlatStatusFilter('');
                                    setSelectedPackageFilter('');
                                }}
                                className="admin-btn-secondary"
                                style={{
                                    height: '42px',
                                    padding: '0 18px',
                                    fontSize: '0.82rem',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    margin: 0
                                }}
                            >
                                <i className="fas fa-undo" style={{ marginRight: '6px' }}></i> Reset
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* Leads Table */}
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Customer Details</th>
                            <th>Size & Status</th>
                            <th>Selected Package</th>
                            <th>Estimated Budget</th>
                            <th>Calculated On</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Loading leads list...</td></tr>
                        ) : leads.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No calculator leads logged matching search filters.</td></tr>
                        ) : (
                            leads.map(lead => (
                                <tr key={lead.id}>
                                    <td><strong>#EST-{String(lead.id).padStart(5, '0')}</strong></td>
                                    <td>
                                        <div>
                                            <strong style={{ color: '#1e293b' }}>{lead.name}</strong>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                                                <i className="fas fa-phone" style={{ color: '#c9a45c', marginRight: '6px', fontSize: '0.8rem' }}></i>{lead.phone}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                                                <i className="far fa-envelope" style={{ color: '#c9a45c', marginRight: '6px', fontSize: '0.8rem' }}></i>{lead.email}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                                                <i className="fas fa-map-marker-alt" style={{ color: '#c9a45c', marginRight: '6px', fontSize: '0.8rem' }}></i>{lead.location}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div><strong>{Number(lead.home_size).toLocaleString()}</strong> sqft</div>
                                        <span className="badge badge-contacted" style={{ marginTop: '4px', display: 'inline-block' }}>{getFlatStatusLabel(lead.flat_status)}</span>
                                    </td>
                                    <td>
                                        <span className="badge badge-new">{lead.package?.name}</span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 800, color: '#c9a45c' }}>
                                            ৳{Number(lead.total_estimate).toLocaleString()}
                                        </div>
                                    </td>
                                    <td>
                                        {new Date(lead.created_at).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => handleViewDetails(lead)}
                                                className="btn-action-admin btn-edit-admin"
                                                title="View Selections"
                                                style={{ background: 'rgba(201, 164, 92, 0.1)', color: '#c9a45c', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '32px', height: '32px' }}
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDownloadPdf(lead.id)}
                                                className="btn-action-admin"
                                                title="Download Estimate PDF"
                                                style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '32px', height: '32px' }}
                                            >
                                                <i className="fas fa-file-pdf"></i>
                                            </button>
                                            {hasPermission('estimator.leads.delete') && (
                                                <button
                                                    onClick={() => handleDeleteClick(lead.id)}
                                                    className="btn-action-admin btn-delete-admin"
                                                    title="Delete Entry"
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '32px', height: '32px' }}
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

            {/* ==========================================
                ULTRA PREMIUM ESTIMATE DETAILS MODAL
               ========================================== */}
            {selectedLead && (
                <div className="modal-backdrop-custom" onClick={() => { setSelectedLead(null); setLeadDetails(null); }}>
                    <div className="modal-content-custom" style={{ maxWidth: '780px', maxHeight: '88vh' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom">
                            <div className="modal-title-row">
                                <i className="fas fa-calculator text-gold" style={{ fontSize: '1.25rem' }}></i>
                                <h4>Estimate Details #EST-{String(selectedLead.id).padStart(5, '0')}</h4>
                            </div>
                            <button className="close-btn-custom" onClick={() => { setSelectedLead(null); setLeadDetails(null); }}>
                                &times;
                            </button>
                        </div>

                        <div className="modal-body-custom" style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
                            {detailsLoading ? (
                                <div style={{ padding: '50px 20px', textAlign: 'center', color: '#64748b' }}>
                                    <i className="fas fa-circle-notch fa-spin text-gold" style={{ fontSize: '2rem', marginBottom: '15px', display: 'block' }}></i>
                                    Fetching detailed lead selections from database...
                                </div>
                            ) : leadDetails ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    
                                    {/* 1. Total Estimate Highlight Banner */}
                                    <div className="estimate-highlight-banner">
                                        <div>
                                            <span className="highlight-label">Total Calculated Estimate</span>
                                            <div className="highlight-value">{formatCurrency(leadDetails.total_estimate)}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div className="highlight-date text-muted">
                                                Calculated On: {new Date(leadDetails.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Customer & Project Specs Grid */}
                                    <div className="details-specs-grid">
                                        <div className="spec-card">
                                            <span className="spec-card-label">Customer Name</span>
                                            <strong className="spec-card-val">{leadDetails.name}</strong>
                                        </div>

                                        <div className="spec-card">
                                            <span className="spec-card-label">Phone Number</span>
                                            <strong className="spec-card-val">{leadDetails.phone || 'N/A'}</strong>
                                        </div>

                                        <div className="spec-card">
                                            <span className="spec-card-label">Email Address</span>
                                            <strong className="spec-card-val">{leadDetails.email || 'N/A'}</strong>
                                        </div>

                                        <div className="spec-card">
                                            <span className="spec-card-label">Project Location</span>
                                            <strong className="spec-card-val">{leadDetails.location || 'N/A'}</strong>
                                        </div>

                                        <div className="spec-card">
                                            <span className="spec-card-label">Selected Package</span>
                                            <strong className="spec-card-val text-gold">{leadDetails.package?.name || leadDetails.flat_type || 'Custom Package'}</strong>
                                        </div>

                                        <div className="spec-card">
                                            <span className="spec-card-label">Property Size</span>
                                            <strong className="spec-card-val">{Number(leadDetails.home_size).toLocaleString()} sqft</strong>
                                        </div>

                                        <div className="spec-card">
                                            <span className="spec-card-label">Flat Type / Condition</span>
                                            <strong className="spec-card-val">{getFlatStatusLabel(leadDetails.flat_status)}</strong>
                                        </div>

                                        {leadDetails.project_address && (
                                            <div className="spec-card" style={{ gridColumn: '1 / -1' }}>
                                                <span className="spec-card-label">Project Address</span>
                                                <strong className="spec-card-val">{leadDetails.project_address}</strong>
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. Room Quantities Section */}
                                    {leadDetails.room_items && leadDetails.room_items.length > 0 && (
                                        <div className="breakdown-preview-section">
                                            <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.92rem', color: '#1e293b' }}>
                                                <i className="fas fa-door-open text-gold"></i> Room Configurations ({leadDetails.room_items.length})
                                            </h5>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                                                {leadDetails.room_items.map((item) => (
                                                    <div key={item.id} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>{item.room?.name}</span>
                                                        <span style={{ background: '#c9a45c', color: '#ffffff', borderRadius: '20px', padding: '2px 9px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            {item.quantity} {item.quantity === 1 ? 'room' : 'rooms'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. Selected Add-ons Section */}
                                    <div className="breakdown-preview-section">
                                        <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.92rem', color: '#1e293b' }}>
                                            <i className="fas fa-plus-circle text-gold"></i> Selected Add-ons ({leadDetails.addon_items?.length || 0})
                                        </h5>

                                        {!leadDetails.addon_items || leadDetails.addon_items.length === 0 ? (
                                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', border: '1px solid #e2e8f0' }}>
                                                No add-ons were selected for this estimate.
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="mini-admin-table" style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                                    <thead>
                                                        <tr>
                                                            <th>Add-on Name</th>
                                                            <th>Room Section</th>
                                                            <th style={{ textAlign: 'right' }}>Unit Price</th>
                                                            <th style={{ textAlign: 'center' }}>Qty</th>
                                                            <th style={{ textAlign: 'right' }}>Subtotal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {leadDetails.addon_items.map((item) => {
                                                            const priceRecord = item.addon?.prices?.find((p) => p.package_id === leadDetails.package_id);
                                                            const unitPrice = priceRecord ? Number(priceRecord.price) : 0;
                                                            const totalPrice = unitPrice * item.quantity;
                                                            return (
                                                                <tr key={item.id}>
                                                                    <td><strong style={{ color: '#1e293b' }}>{item.addon?.name}</strong></td>
                                                                    <td><span className="package-tag">{item.addon?.room?.name}</span></td>
                                                                    <td style={{ textAlign: 'right', color: '#64748b' }}>{formatCurrency(unitPrice)}</td>
                                                                    <td style={{ textAlign: 'center' }}><strong>{item.quantity}</strong></td>
                                                                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                                                                        {formatCurrency(totalPrice)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            ) : null}
                        </div>

                        <div className="modal-footer-custom" style={{ flexShrink: 0, padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            {leadDetails && (
                                <button
                                    type="button"
                                    onClick={() => handleDownloadPdf(leadDetails.id)}
                                    className="btn-primary-gold"
                                    style={{ background: '#10b981' }}
                                >
                                    <i className="fas fa-file-pdf me-1"></i> Download PDF
                                </button>
                            )}
                            <button
                                type="button"
                                className="btn-secondary-custom"
                                onClick={() => { setSelectedLead(null); setLeadDetails(null); }}
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Lead Entry"
                message="Are you sure you want to delete this lead entry? This will permanently remove customer records and items from the database."
            />
        </div>
    );
};

export default EstimatorLeads;
