import React, { useState, useEffect } from 'react';
import api, { getStorageUrl } from '../../api/axios';
import './Admin.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

const HandoverSnapshot = () => {
    const [snapshots, setSnapshots] = useState([]);
    const [formData, setFormData] = useState({ title: '', client: '', date: '', position: 0 });
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreview, setImagePreview] = useState(null);
    const [existingImageDeleted, setExistingImageDeleted] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    useEffect(() => {
        fetchSnapshots();
    }, []);

    const fetchSnapshots = async () => {
        setLoading(true);
        try {
            const res = await api.get('/handover-snapshots');
            const data = res.data || [];
            setSnapshots(data);

            // Pre-fill with the next available position
            const maxPos = data.reduce((max, item) => Math.max(max, item.position || 0), 0);
            setFormData(prev => ({
                ...prev,
                position: maxPos + 1
            }));
        } catch (err) {
            console.error("Failed to fetch handover snapshots:", err);
            setAlert({ type: 'error', msg: 'Failed to load snapshots from server.' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // 10MB Limit Validation per file
        const validFiles = [];
        for (const file of files) {
            if (file.size > 10 * 1024 * 1024) {
                setAlert({ type: 'error', msg: `Image "${file.name}" exceeds the 10MB limit.` });
                return;
            }
            validFiles.push(file);
        }

        setImageFiles([...imageFiles, ...validFiles]);
        setAlert(null); // Clear any size warning
    };

    const handleRemoveNewImage = (index) => {
        setImageFiles(imageFiles.filter((_, i) => i !== index));
    };

    const handleEdit = (snap) => {
        setEditingId(snap.id);
        setFormData({
            title: snap.title,
            client: snap.client,
            date: snap.date || '',
            position: snap.position || 0
        });
        setImagePreview(getStorageUrl(snap.image_path));
        setImageFiles([]);
        setExistingImageDeleted(false);
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
            await api.delete(`/handover-snapshots/${deleteTargetId}`);
            setAlert({ type: 'success', msg: 'Handover Snapshot deleted.' });
            fetchSnapshots();
        } catch (err) {
            console.error(err);
            setAlert({ type: 'error', msg: 'Failed to delete snapshot.' });
        } finally {
            setDeleteTargetId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!editingId && imageFiles.length === 0) {
            setAlert({ type: 'error', msg: 'Please select at least one image to upload.' });
            return;
        }

        if (editingId && existingImageDeleted && imageFiles.length === 0) {
            setAlert({ type: 'error', msg: 'Cannot save snapshot without an image. Please upload a replacement image.' });
            return;
        }

        const submitData = new FormData();
        submitData.append('title', formData.title);
        submitData.append('client', formData.client);
        submitData.append('date', formData.date || '');
        submitData.append('position', formData.position);

        if (editingId) {
            submitData.append('existing_image_deleted', existingImageDeleted ? 'true' : 'false');
            for (let i = 0; i < imageFiles.length; i++) {
                submitData.append('images[]', imageFiles[i]);
            }
        } else {
            // Append all selected files to images[] array
            for (let i = 0; i < imageFiles.length; i++) {
                submitData.append('images[]', imageFiles[i]);
            }
        }

        setLoading(true);
        try {
            if (editingId) {
                await api.post(`/handover-snapshots/${editingId}`, submitData);
                setAlert({ type: 'success', msg: 'Snapshot updated successfully.' });
            } else {
                await api.post('/handover-snapshots', submitData);
                setAlert({ type: 'success', msg: imageFiles.length > 1 ? 'Snapshots added successfully.' : 'Snapshot added successfully.' });
            }
            // Clear form
            setEditingId(null);
            const maxPos = snapshots.reduce((max, item) => Math.max(max, item.position || 0), 0);
            setFormData({ title: '', client: '', date: '', position: maxPos + 1 });
            setImageFiles([]);
            setImagePreview(null);
            setExistingImageDeleted(false);
            fetchSnapshots();
        } catch (err) {
            console.error("Save snapshot error:", err);
            const serverMsg = err.response?.data?.message || 'Failed to save Handover Snapshot.';
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
                    <h1>Handover Snapshot</h1>
                    <p>Manage and upload photos of completed project handovers.</p>
                </div>
            </div>

            {alert && (
                <div className={`admin-alert alert-${alert.type}`}>
                    {alert.msg}
                    <button className="close-alert" onClick={() => setAlert(null)}>&times;</button>
                </div>
            )}

            <div className="admin-grid-layout">
                <div className="admin-card editor-main-card">
                    <h3>{editingId ? 'Edit Snapshot' : 'Add New Snapshot'}</h3>
                    <form onSubmit={handleSubmit} className="admin-form-inline">
                        <div className="form-group">
                            <label>Snapshot Title</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="e.g. Banani Villa Complete Handover"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Client Name</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={formData.client}
                                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                    required
                                    placeholder="e.g. Mr. S. A. Khan"
                                />
                            </div>
                            <div className="form-group">
                                <label>Handover Date</label>
                                <input
                                    type="date"
                                    className="admin-input"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '15px' }}>
                            <label>Gallery Images <span style={{ color: '#ef4444' }}>{!editingId && '*'}</span></label>
                            <div className="multi-image-uploader">
                                <label className="upload-box" style={{ padding: '20px 15px' }}>
                                    <i className="fas fa-camera" style={{ fontSize: '1.5rem', marginBottom: '6px' }}></i>
                                    <span style={{ fontSize: '13px' }}>Upload Photos</span>
                                    <input key={imageFiles.length === 0 ? 'empty' : 'loaded'} type="file" multiple onChange={handleFileChange} hidden accept="image/*" />
                                </label>

                                {((editingId && !existingImageDeleted) || imageFiles.length > 0) && (
                                    <div className="image-preview-grid" style={{ gap: '10px', marginTop: '10px' }}>
                                        {editingId && !existingImageDeleted && (
                                            <div className="preview-item">
                                                <img src={imagePreview} alt="Current" />
                                                <button type="button" onClick={() => setExistingImageDeleted(true)} className="remove-btn">
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                                <span className="badge">Current</span>
                                            </div>
                                        )}
                                        {imageFiles.map((file, idx) => (
                                            <div key={idx} className="preview-item new">
                                                <img src={URL.createObjectURL(file)} alt="" />
                                                <button type="button" onClick={() => handleRemoveNewImage(idx)} className="remove-btn">
                                                    <i className="fas fa-times"></i>
                                                </button>
                                                <span className="badge">Pending</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <small style={{ color: '#64748b', display: 'block', marginTop: '6px', fontSize: '11px' }}>
                                Limit: 10MB per image. Formats: JPG, PNG, GIF, SVG. You can select multiple files at once.
                            </small>
                        </div>


                        <div className="form-actions">
                            <button type="submit" className="admin-btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : editingId ? 'Update Snapshot' : 'Add Snapshot'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    className="admin-btn-secondary"
                                    onClick={() => {
                                        setEditingId(null);
                                        const maxPos = snapshots.reduce((max, item) => Math.max(max, item.position || 0), 0);
                                        setFormData({ title: '', client: '', date: '', position: maxPos + 1 });
                                        setImageFiles([]);
                                        setImagePreview(null);
                                        setExistingImageDeleted(false);
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="admin-card" style={{ marginTop: '30px', padding: '25px' }}>
                    <h3>Handover Snapshots</h3>
                    {loading && snapshots.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>Loading snapshots...</div>
                    ) : snapshots.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            background: '#f8fafc',
                            borderRadius: '12px',
                            border: '2px dashed #e2e8f0',
                            color: '#64748b',
                            marginTop: '20px'
                        }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                background: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px auto',
                                color: '#cbd5e1',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                            }}>
                                <i className="fas fa-camera-retro" style={{ fontSize: '1.5rem' }}></i>
                            </div>
                            <h4 style={{ margin: '0 0 6px 0', color: '#0f172a', fontWeight: 600 }}>No Handover Snapshots Found</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Get started by uploading your first handover ceremony photo!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
                            {snapshots.map((snap) => (
                                <div key={snap.id} style={{ borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                                    <img src={getStorageUrl(snap.image_path)} alt={snap.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                                    <div style={{ padding: '15px' }}>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#0f172a', fontWeight: 'bold' }}>{snap.title}</h4>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                                            <strong>Client:</strong> {snap.client}
                                        </div>
                                        {snap.date && (
                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '15px' }}>
                                                <i className="far fa-calendar-alt"></i> {snap.date}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleEdit(snap)} className="action-btn edit-btn" style={{ padding: '6px 10px', fontSize: '12px' }}>
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button onClick={() => handleDeleteClick(snap.id)} className="action-btn delete-btn" style={{ padding: '6px 10px', fontSize: '12px' }}>
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                title="Delete Snapshot"
                message="Are you sure you want to delete this handover snapshot?"
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default HandoverSnapshot;
