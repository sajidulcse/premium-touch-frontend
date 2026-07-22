import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { BASE_URL } from '../../../api/axios';

const RecentActivityTables = ({ recentConsultations: initialConsultations, recentLeads }) => {
  const [consultations, setConsultations] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  // Modals state
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  const [selectedLead, setSelectedLead] = useState(null);
  const [leadDetails, setLeadDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    if (initialConsultations) {
      setConsultations(initialConsultations);
    }
  }, [initialConsultations]);

  useEffect(() => {
    if (selectedConsultation) {
      setInternalNotes(selectedConsultation.internal_notes || '');
      setNoteSaved(false);
    }
  }, [selectedConsultation]);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      try {
        await api.put(`/admin/consultations/${id}`, { status: newStatus });
      } catch (e1) {
        await api.put(`/consultation-requests/${id}`, { status: newStatus });
      }
      setConsultations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
      if (selectedConsultation && selectedConsultation.id === id) {
        setSelectedConsultation((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update consultation status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveInternalNotes = async () => {
    if (!selectedConsultation) return;
    setUpdatingId(selectedConsultation.id);
    try {
      try {
        await api.put(`/admin/consultations/${selectedConsultation.id}`, {
          status: selectedConsultation.status || 'New',
          internal_notes: internalNotes,
        });
      } catch (e1) {
        await api.put(`/consultation-requests/${selectedConsultation.id}`, {
          status: selectedConsultation.status || 'New',
          internal_notes: internalNotes,
        });
      }
      setConsultations((prev) =>
        prev.map((c) => (c.id === selectedConsultation.id ? { ...c, internal_notes: internalNotes } : c))
      );
      setSelectedConsultation((prev) => ({ ...prev, internal_notes: internalNotes }));
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save internal notes:', err);
      alert('Failed to save admin note.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewLeadDetails = async (lead) => {
    setSelectedLead(lead);
    setLeadDetails(null);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/admin/estimator/leads/${lead.id}`);
      setLeadDetails(res.data);
    } catch (err) {
      console.error('Failed to fetch lead details:', err);
      setLeadDetails(lead);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDownloadPdf = (id) => {
    window.open(`${BASE_URL}/estimator/download-pdf/${id}`, '_blank');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0,
    }).format(val || 0).replace('BDT', '৳');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getClientName = (item) => {
    if (item.full_name && item.full_name.trim() !== '') return item.full_name;
    if (item.name && item.name.trim() !== '') return item.name;
    if (item.form_data && item.form_data.full_name && item.form_data.full_name.trim() !== '') return item.form_data.full_name;
    if (item.phone) return `Client (${item.phone})`;
    if (item.email) return item.email.split('@')[0];
    return 'Customer';
  };

  const getFlatStatusLabel = (status) => {
    if (!status) return 'Ready for Interior';
    const s = status.toLowerCase();
    if (s.includes('new') || s.includes('ready for interior') || s.includes('ready')) return 'Ready for Interior';
    if (s.includes('construction') || s.includes('under')) return 'Under Construction';
    if (s.includes('renovated') || s.includes('renovation') || s.includes('not ready')) return 'Not Ready';
    return status;
  };

  return (
    <div className="recent-activity-stacked">
      {/* 1. Recent Consultation Requests Table */}
      <div className="admin-card activity-card">
        <div className="activity-card-header">
          <div>
            <h3><i className="fas fa-handshake text-gold"></i> Recent Consultations</h3>
            <p className="card-subtitle">Latest customer appointment requests and live status management</p>
          </div>
          <Link to="/admin/consultations" className="view-all-link">
            View All <i className="fas fa-arrow-right"></i>
          </Link>
        </div>

        {consultations && consultations.length > 0 ? (
          <div className="table-responsive">
            <table className="mini-admin-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Contact Info</th>
                  <th>Project / Location</th>
                  <th>Status (Change Live)</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map((item) => {
                  const clientName = getClientName(item);
                  const currentStatus = item.status || 'New';

                  return (
                    <tr key={item.id}>
                      <td>
                        <span className="client-name">{clientName}</span>
                      </td>
                      <td>
                        <div className="contact-cell">
                          {item.phone && <div><i className="fas fa-phone-alt small text-muted me-1"></i>{item.phone}</div>}
                          {item.email && <div className="small text-muted">{item.email}</div>}
                          {!item.phone && !item.email && <span>N/A</span>}
                        </div>
                      </td>
                      <td>
                        <span className="package-tag">{item.project_type || item.location || 'General'}</span>
                      </td>
                      <td>
                        <div className="status-select-wrap">
                          <select
                            className={`status-select ${currentStatus.toLowerCase()}`}
                            value={currentStatus}
                            disabled={updatingId === item.id}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Closed">Closed</option>
                          </select>
                          {updatingId === item.id && <span className="updating-spinner"><i className="fas fa-spinner fa-spin"></i></span>}
                        </div>
                      </td>
                      <td className="date-cell">{formatDate(item.created_at)}</td>
                      <td>
                        <button
                          type="button"
                          className="mini-action-btn"
                          title="View Inquiry Details"
                          onClick={() => setSelectedConsultation(item)}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-table-placeholder">
            <i className="fas fa-inbox"></i>
            <p>No recent consultation leads found.</p>
          </div>
        )}
      </div>

      {/* 2. Recent Cost Estimator Leads Table */}
      <div className="admin-card activity-card">
        <div className="activity-card-header">
          <div>
            <h3><i className="fas fa-calculator text-gold"></i> Recent Estimator Leads</h3>
            <p className="card-subtitle">Calculated interior design quotes and property details</p>
          </div>
          <Link to="/admin/estimator/leads" className="view-all-link">
            View All <i className="fas fa-arrow-right"></i>
          </Link>
        </div>

        {recentLeads && recentLeads.length > 0 ? (
          <div className="table-responsive">
            <table className="mini-admin-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Phone / Contact</th>
                  <th>Package Selected</th>
                  <th>Estimate Value</th>
                  <th>Flat Type</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => {
                  const leadName = lead.name || lead.full_name || (lead.phone ? `Lead (${lead.phone})` : 'Lead');

                  return (
                    <tr key={lead.id}>
                      <td>
                        <span className="client-name">{leadName}</span>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <span>{lead.phone || lead.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="package-tag">{lead.package?.name || lead.flat_type || 'Custom'}</span>
                      </td>
                      <td className="estimate-cell">{formatCurrency(lead.total_estimate)}</td>
                      <td>
                        <span className="flat-badge">{getFlatStatusLabel(lead.flat_status)}</span>
                      </td>
                      <td className="date-cell">{formatDate(lead.created_at)}</td>
                      <td>
                        <button
                          type="button"
                          className="mini-action-btn"
                          title="View Estimate Details"
                          onClick={() => handleViewLeadDetails(lead)}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-table-placeholder">
            <i className="fas fa-calculator"></i>
            <p>No recent estimator leads found.</p>
          </div>
        )}
      </div>

      {/* ==========================================
          INQUIRY DETAILS MODAL (Consultation Request)
         ========================================== */}
      {selectedConsultation && (
        <div className="modal-backdrop-custom" onClick={() => setSelectedConsultation(null)}>
          <div className="modal-content-custom" style={{ maxWidth: '680px', maxHeight: '88vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div className="modal-title-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <i className="fas fa-file-alt text-gold"></i>
                <h4 style={{ margin: 0 }}>Inquiry Details</h4>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, marginLeft: '4px' }}>
                  - {formatDateTime(selectedConsultation.created_at)}
                </span>
              </div>
              <button className="close-btn-custom" onClick={() => setSelectedConsultation(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body-custom" style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
              {/* Specs Grid */}
              <div className="details-specs-grid">
                <div className="spec-card">
                  <span className="spec-card-label">Client Name</span>
                  <strong className="spec-card-val">{getClientName(selectedConsultation)}</strong>
                </div>

                <div className="spec-card">
                  <span className="spec-card-label">Phone Number</span>
                  <strong className="spec-card-val">{selectedConsultation.phone || 'N/A'}</strong>
                </div>

                <div className="spec-card">
                  <span className="spec-card-label">Email Address</span>
                  <strong className="spec-card-val">{selectedConsultation.email || 'N/A'}</strong>
                </div>

                <div className="spec-card">
                  <span className="spec-card-label">Project Location</span>
                  <strong className="spec-card-val">{selectedConsultation.location || 'N/A'}</strong>
                </div>

                <div className="spec-card">
                  <span className="spec-card-label">Project Type</span>
                  <strong className="spec-card-val">{selectedConsultation.project_type || 'Residential'}</strong>
                </div>

                <div className="spec-card">
                  <span className="spec-card-label">Property Size</span>
                  <strong className="spec-card-val">{selectedConsultation.property_size || 'N/A'}</strong>
                </div>

                <div className="spec-card">
                  <span className="spec-card-label">Budget Range</span>
                  <strong className="spec-card-val text-gold">{selectedConsultation.budget_range || 'N/A'}</strong>
                </div>

                <div className="spec-card">
                  <span className="spec-card-label">Source</span>
                  <strong className="spec-card-val">{selectedConsultation.source || 'Website'}</strong>
                </div>
              </div>

              {/* Customer Notes */}
              {selectedConsultation.notes && (
                <div className="notes-box-custom mt-3">
                  <span className="notes-label"><i className="fas fa-comment-alt text-gold"></i> Client Notes:</span>
                  <p>{selectedConsultation.notes}</p>
                </div>
              )}

              {/* Status & Admin Internal Note Section (at bottom) */}
              <div style={{ marginTop: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                    <i className="fas fa-tasks text-gold me-1"></i> Update Inquiry Status:
                  </label>
                  <div className="status-select-wrap">
                    <select
                      className={`status-select ${selectedConsultation.status ? selectedConsultation.status.toLowerCase() : 'new'}`}
                      value={selectedConsultation.status || 'New'}
                      disabled={updatingId === selectedConsultation.id}
                      onChange={(e) => handleStatusChange(selectedConsultation.id, e.target.value)}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', margin: 0 }}>
                      <i className="fas fa-user-shield text-gold me-1"></i> Admin Internal Note:
                    </label>
                    {noteSaved && (
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                        <i className="fas fa-check-circle me-1"></i> Note Saved!
                      </span>
                    )}
                  </div>
                  <textarea
                    rows="3"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Write internal notes about client conversations or project status..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      fontFamily: 'inherit',
                      color: '#1e293b',
                      background: '#ffffff',
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={handleSaveInternalNotes}
                      disabled={updatingId === selectedConsultation.id}
                      style={{
                        background: '#1e293b',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {updatingId === selectedConsultation.id ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save"></i> Save Admin Note
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-custom" style={{ flexShrink: 0, padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Link to="/admin/consultations" className="btn-primary-gold">
                Manage in Consultations <i className="fas fa-external-link-alt ms-1"></i>
              </Link>
              <button className="btn-secondary-custom" onClick={() => setSelectedConsultation(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ESTIMATE DETAILS MODAL (Cost Estimator Lead)
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
              ) : (leadDetails || selectedLead) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* 1. Total Estimate Highlight Banner */}
                  <div className="estimate-highlight-banner">
                    <div>
                      <span className="highlight-label">Total Calculated Estimate</span>
                      <div className="highlight-value">{formatCurrency((leadDetails || selectedLead).total_estimate)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="highlight-date text-muted">
                        Calculated On: {formatDateTime((leadDetails || selectedLead).created_at)}
                      </div>
                    </div>
                  </div>

                  {/* 2. Customer & Project Specs Grid */}
                  <div className="details-specs-grid">
                    <div className="spec-card">
                      <span className="spec-card-label">Customer Name</span>
                      <strong className="spec-card-val">{(leadDetails || selectedLead).name || (leadDetails || selectedLead).full_name || 'Client'}</strong>
                    </div>

                    <div className="spec-card">
                      <span className="spec-card-label">Phone Number</span>
                      <strong className="spec-card-val">{(leadDetails || selectedLead).phone || 'N/A'}</strong>
                    </div>

                    <div className="spec-card">
                      <span className="spec-card-label">Email Address</span>
                      <strong className="spec-card-val">{(leadDetails || selectedLead).email || 'N/A'}</strong>
                    </div>

                    <div className="spec-card">
                      <span className="spec-card-label">Project Location</span>
                      <strong className="spec-card-val">{(leadDetails || selectedLead).location || 'N/A'}</strong>
                    </div>

                    <div className="spec-card">
                      <span className="spec-card-label">Selected Package</span>
                      <strong className="spec-card-val text-gold">
                        {(leadDetails || selectedLead).package?.name || (leadDetails || selectedLead).flat_type || 'Custom Package'}
                      </strong>
                    </div>

                    <div className="spec-card">
                      <span className="spec-card-label">Property Size</span>
                      <strong className="spec-card-val">
                        {Number((leadDetails || selectedLead).home_size || (leadDetails || selectedLead).property_size || 0).toLocaleString()} sqft
                      </strong>
                    </div>

                    <div className="spec-card">
                      <span className="spec-card-label">Flat Type / Condition</span>
                      <strong className="spec-card-val">{getFlatStatusLabel((leadDetails || selectedLead).flat_status)}</strong>
                    </div>

                    {(leadDetails || selectedLead).project_address && (
                      <div className="spec-card" style={{ gridColumn: '1 / -1' }}>
                        <span className="spec-card-label">Project Address</span>
                        <strong className="spec-card-val">{(leadDetails || selectedLead).project_address}</strong>
                      </div>
                    )}
                  </div>

                  {/* 3. Room Quantities Section */}
                  {leadDetails?.room_items && leadDetails.room_items.length > 0 && (
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
                  {leadDetails && (
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
                  )}

                </div>
              ) : null}
            </div>

            <div className="modal-footer-custom" style={{ flexShrink: 0, padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {(leadDetails || selectedLead) && (
                <button
                  type="button"
                  onClick={() => handleDownloadPdf((leadDetails || selectedLead).id)}
                  className="btn-primary-gold"
                  style={{ background: '#10b981' }}
                >
                  <i className="fas fa-file-pdf me-1"></i> Download PDF
                </button>
              )}
              <Link to="/admin/estimator/leads" className="btn-primary-gold">
                View in Leads Hub <i className="fas fa-external-link-alt ms-1"></i>
              </Link>
              <button
                type="button"
                className="btn-secondary-custom"
                onClick={() => { setSelectedLead(null); setLeadDetails(null); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentActivityTables;
