import React, { useState, useEffect } from 'react';
import api, { clearClientCache } from '../../api/axios';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './Admin.css';

const CareerManager = () => {
    const [openings, setOpenings] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        type: 'Full-Time',
        location: 'Dhaka, BD (On-site)',
        exp: '',
        desc: '',
        status: true,
        position: 0
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    // Career settings states
    const [careerEmail, setCareerEmail] = useState('');
    const [settingsLoading, setSettingsLoading] = useState(false);

    // Collapsible descriptions list state
    const [expandedDescs, setExpandedDescs] = useState({});

    const toggleDesc = (id) => {
        setExpandedDescs(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    useEffect(() => {
        fetchOpenings();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/site-info');
            if (res.data && res.data.career_email) {
                setCareerEmail(res.data.career_email);
            }
        } catch (err) {
            console.error("Error fetching site settings:", err);
        }
    };

    const handleSettingsSubmit = async (e) => {
        e.preventDefault();
        setSettingsLoading(true);
        const data = new FormData();
        data.append('career_email', careerEmail);
        try {
            await api.post('/site-info', data);
            setAlert({ type: 'success', msg: 'Application email updated successfully!' });
            clearClientCache();
        } catch (err) {
            console.error("Error saving career settings:", err);
            setAlert({ type: 'error', msg: 'Failed to update application email.' });
        } finally {
            setSettingsLoading(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const fetchOpenings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/career-openings');
            const data = res.data || [];
            setOpenings(data);

            // Pre-fill next position
            const maxPos = data.reduce((max, item) => Math.max(max, item.position || 0), 0);
            setFormData(prev => ({
                ...prev,
                position: maxPos + 1
            }));
        } catch (err) {
            console.error("Failed to fetch openings:", err);
            setAlert({ type: 'error', msg: 'Failed to load career openings from server.' });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (job) => {
        console.log("Edit clicked, job data:", job);
        setEditingId(job.id);
        setFormData({
            title: job.title || '',
            type: job.type || 'Full-Time',
            location: job.location || '',
            exp: job.exp || '',
            desc: job.desc || '',
            status: !!job.status,
            position: job.position || 0
        });
        console.log("Form data updated to:", {
            title: job.title,
            type: job.type,
            location: job.location,
            exp: job.exp,
            desc: job.desc,
            status: !!job.status,
            position: job.position || 0
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = (id) => {
        setDeleteTargetId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        setConfirmOpen(false);
        if (!deleteTargetId) return;
        try {
            await api.delete(`/career-openings/${deleteTargetId}`);
            setAlert({ type: 'success', msg: 'Vacancy deleted successfully.' });
            fetchOpenings();
            if (editingId === deleteTargetId) {
                handleCancelEdit();
            }
        } catch (err) {
            console.error(err);
            setAlert({ type: 'error', msg: 'Failed to delete vacancy.' });
        } finally {
            setDeleteTargetId(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        const maxPos = openings.reduce((max, item) => Math.max(max, item.position || 0), 0);
        setFormData({
            title: '',
            type: 'Full-Time',
            location: 'Dhaka, BD (On-site)',
            exp: '',
            desc: '',
            status: true,
            position: maxPos + 1
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            title: formData.title,
            type: formData.type,
            location: formData.location,
            exp: formData.exp,
            desc: formData.desc,
            status: formData.status ? '1' : '0',
            position: formData.position
        };

        setLoading(true);
        try {
            if (editingId) {
                await api.put(`/career-openings/${editingId}`, payload);
                setAlert({ type: 'success', msg: 'Vacancy updated successfully.' });
            } else {
                await api.post('/career-openings', payload);
                setAlert({ type: 'success', msg: 'Vacancy added successfully.' });
            }
            handleCancelEdit();
            fetchOpenings();
        } catch (err) {
            console.error("Save vacancy error:", err);
            const serverMsg = err.response?.data?.message || 'Failed to save career opening.';
            const validationErrors = err.response?.data?.errors;
            let errorText = serverMsg;
            if (validationErrors) {
                const list = Object.values(validationErrors).flat().join(' ');
                errorText = `${serverMsg} ${list}`;
            }
            setAlert({ type: 'error', msg: errorText });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Career Openings Management</h1>
                    <p>Manage the vacancies advertised on the Careers page. Turn them on/off dynamically.</p>
                </div>
            </div>

            {alert && (
                <div className={`admin-alert alert-${alert.type}`}>
                    {alert.msg}
                    <button className="close-alert" onClick={() => setAlert(null)}>&times;</button>
                </div>
            )}

            {/* Career settings card */}
            <form onSubmit={handleSettingsSubmit} className="admin-card" style={{ maxWidth: '700px', marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Career Application Settings</h3>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 0' }}>
                    This email address is displayed in the "Apply Now" submission card on the public website.
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flexGrow: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>Application Email Address</label>
                        <input
                            type="email"
                            className="admin-input"
                            value={careerEmail}
                            onChange={(e) => setCareerEmail(e.target.value)}
                            required
                            placeholder="career@premiumtouchbd.com"
                        />
                    </div>
                    <button type="submit" className="admin-btn-primary" disabled={settingsLoading} style={{ padding: '0 24px', height: '42px', flexShrink: 0 }}>
                        {settingsLoading ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>

            <div className="admin-grid-layout">
                {/* Form Editor Card */}
                <div className="admin-card editor-main-card">
                    <h3>{editingId ? 'Edit Vacancy' : 'Add New Vacancy'}</h3>
                    <form onSubmit={handleSubmit} className="admin-form-card" style={{ padding: 0, border: 'none', background: 'none' }}>
                        
                        <div className="form-group">
                            <label>Job Title *</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                required
                                placeholder="e.g. Senior Interior Architect"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Job Type *</label>
                                <select
                                    className="admin-input"
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                    required
                                >
                                    <option value="Full-Time">Full-Time</option>
                                    <option value="Part-Time">Part-Time</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Internship">Internship</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Experience Requirement *</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={formData.exp}
                                    onChange={(e) => setFormData(prev => ({ ...prev, exp: e.target.value }))}
                                    required
                                    placeholder="e.g. 3+ Years, 5+ Years"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Location *</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={formData.location}
                                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                    required
                                    placeholder="e.g. Dhaka, BD (On-site) or (Field-based)"
                                />
                            </div>
                            <div className="form-group">
                                <label>Display Position (Ordering)</label>
                                <input
                                    type="number"
                                    className="admin-input"
                                    value={formData.position}
                                    onChange={(e) => setFormData(prev => ({ ...prev, position: parseInt(e.target.value) || 0 }))}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: '10px 0' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.checked }))}
                                    style={{ width: '18px', height: '18px', margin: 0 }}
                                />
                                <span>Active / Visible on website</span>
                            </label>
                        </div>

                        <div className="form-group quill-container" style={{ minHeight: '200px', marginBottom: '20px' }}>
                            <label>Job Description *</label>
                            <ReactQuill
                                theme="snow"
                                value={formData.desc}
                                onChange={(content) => setFormData(prev => ({ ...prev, desc: content }))}
                                placeholder="Describe the responsibilities, daily work, material knowledge required, and how to apply..."
                                modules={{
                                    toolbar: [
                                        [{ 'header': [1, 2, 3, false] }],
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                        ['link', 'blockquote'],
                                        ['clean']
                                    ],
                                    clipboard: {
                                        matchVisual: false
                                    }
                                }}
                            />
                        </div>

                        <div className="form-actions" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button type="submit" className="admin-btn-primary" disabled={loading} style={{ width: '160px' }}>
                                {loading ? 'Saving...' : editingId ? 'Update Vacancy' : 'Add Vacancy'}
                            </button>
                            {editingId && (
                                <button type="button" onClick={handleCancelEdit} className="admin-btn-secondary">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Vacancies List Card */}
                <div className="admin-card list-sidebar-card">
                    <h3>Current Openings ({openings.length})</h3>
                    {loading && openings.length === 0 ? (
                        <p>Loading openings...</p>
                    ) : openings.length === 0 ? (
                        <p>No job openings posted yet.</p>
                    ) : (
                        <div className="admin-list-scrollable" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
                            {openings.map((job) => (
                                <div key={job.id} className="admin-list-item-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '15px', border: '1px solid #f1f5f9', borderRadius: '8px', backgroundColor: '#fcfbfa' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>
                                            {job.title}
                                        </h4>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleEdit(job)} className="edit-btn" style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '2px', fontSize: '13px' }} title="Edit">
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button onClick={() => handleDeleteClick(job.id)} className="delete-btn" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', fontSize: '13px' }} title="Delete">
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                        <span className="job-badge" style={{ fontSize: '9px', padding: '2px 6px' }}>{job.type}</span>
                                        <span className={`job-badge`} style={{ fontSize: '9px', padding: '2px 6px', backgroundColor: job.status ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: job.status ? '#22c55e' : '#ef4444' }}>
                                            {job.status ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '12px' }}>
                                        <span><i className="fas fa-map-marker-alt" style={{ marginRight: '4px', color: '#E85D25' }}></i> {job.location}</span>
                                        <span><i className="fas fa-briefcase" style={{ marginRight: '4px', color: '#E85D25' }}></i> {job.exp}</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Position ordering: {job.position}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => toggleDesc(job.id)} 
                                            style={{ 
                                                background: 'none', 
                                                border: 'none', 
                                                color: '#c9a45c', 
                                                cursor: 'pointer', 
                                                fontSize: '11px', 
                                                fontWeight: '600',
                                                padding: '2px 0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <i className={`fas ${expandedDescs[job.id] ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                                            {expandedDescs[job.id] ? 'Hide Description' : 'View Description'}
                                        </button>
                                    </div>

                                    {expandedDescs[job.id] && (
                                        <div 
                                            className="admin-job-desc-preview ql-editor"
                                            style={{ 
                                                marginTop: '8px', 
                                                padding: '10px 12px', 
                                                background: '#fcfbf9', 
                                                borderRadius: '6px', 
                                                border: '1px dashed #e2e8f0',
                                                maxHeight: '150px',
                                                overflowY: 'auto'
                                            }}
                                            dangerouslySetInnerHTML={{ __html: job.desc }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                title="Delete Vacancy"
                message="Are you sure you want to delete this job vacancy? This action cannot be undone."
                confirmText="Delete Vacancy"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default CareerManager;
