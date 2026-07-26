import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import '../Admin.css';
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal';
import { useToast } from '../../../context/ToastContext';

const EstimatorPackages = () => {
    const toast = useToast();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        base_rate: '',
        description: '',
        display_order: 0,
        status: 1
    });

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/estimator/packages');
            setPackages(res.data);
        } catch (err) {
            console.error("Failed to load packages:", err);
            toast.error('Failed to load estimator packages.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (pkg) => {
        setEditingId(pkg.id);
        setFormData({
            name: pkg.name,
            base_rate: pkg.base_rate || '',
            description: pkg.description || '',
            display_order: pkg.display_order || 0,
            status: pkg.status ? 1 : 0
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
            await api.delete(`/admin/estimator/packages/${deleteTargetId}`);
            toast.success('Package removed successfully.');
            fetchPackages();
        } catch (err) {
            console.error("Failed to delete package:", err);
            toast.error('Failed to delete package.');
        } finally {
            setDeleteTargetId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name) {
            toast.error('Package Name is required.');
            return;
        }

        try {
            const payload = {
                ...formData,
                base_rate: Number(formData.base_rate) || 0,
                display_order: Number(formData.display_order),
                status: Boolean(Number(formData.status))
            };

            if (editingId) {
                await api.put(`/admin/estimator/packages/${editingId}`, payload);
                toast.success('Package updated successfully!');
            } else {
                await api.post('/admin/estimator/packages', payload);
                toast.success('Package created successfully!');
            }

            setEditingId(null);
            setFormData({ name: '', base_rate: '', description: '', display_order: 0, status: 1 });
            fetchPackages();
        } catch (err) {
            console.error("Failed to save package:", err);
            toast.error(err.response?.data?.message || 'Failed to save package.');
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Manage Estimation Packages</h1>
                    <p>Configure interior finish quality tiers (e.g. Basic, Premium, Luxury).</p>
                </div>
            </div>

            {/* Package Form Card (Top) */}
            <div className="admin-card" style={{ marginBottom: '28px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className={`fas ${editingId ? 'fa-edit' : 'fa-plus-circle'}`} style={{ color: '#c9a45c' }}></i>
                    {editingId ? 'Edit Package Tier' : 'Add New Package Tier'}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Package Name *</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Premium Finish"
                                style={{ height: '42px', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box', margin: 0 }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Base Rate / Sqft (৳) *</label>
                            <input
                                type="number"
                                className="admin-input"
                                value={formData.base_rate}
                                onChange={(e) => setFormData({ ...formData, base_rate: e.target.value })}
                                placeholder="e.g. 1200"
                                min="0"
                                style={{ height: '42px', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box', margin: 0 }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Description & Specs</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Summary of finish materials, fixtures, and specifications..."
                                style={{ height: '42px', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box', margin: 0 }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Display Order</label>
                            <input
                                type="number"
                                className="admin-input"
                                value={formData.display_order}
                                onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                                style={{ height: '42px', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box', margin: 0 }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Status</label>
                            <select
                                className="admin-select"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                                style={{ height: '42px', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box', margin: 0 }}
                            >
                                <option value={1}>Active</option>
                                <option value={0}>Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="submit" className="admin-btn-primary" style={{ padding: '10px 24px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-save"></i> {editingId ? 'Update Package' : 'Save Package'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                className="admin-btn-secondary"
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({ name: '', base_rate: '', description: '', display_order: 0, status: 1 });
                                }}
                                style={{ padding: '10px 20px', fontSize: '0.88rem' }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Packages Table Card (Bottom) */}
            <div className="admin-card">
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    Registered Packages ({packages.length})
                </h3>
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>Loading packages...</div>
                ) : packages.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>No packages registered.</div>
                ) : (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Package Name</th>
                                    <th>Base Rate</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {packages.map(pkg => (
                                    <tr key={pkg.id}>
                                        <td><strong>#{pkg.display_order}</strong></td>
                                        <td><strong style={{ color: '#1e293b' }}>{pkg.name}</strong></td>
                                        <td>
                                            <strong style={{ color: '#c9a45c' }}>৳{Number(pkg.base_rate).toLocaleString()}</strong> / sqft
                                        </td>
                                        <td style={{ color: '#64748b', fontSize: '0.88rem' }}>{pkg.description || '—'}</td>
                                        <td>
                                            <span className={`status-badge ${pkg.status ? 'published' : 'draft'}`}>
                                                {pkg.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-row">
                                                <button onClick={() => handleEdit(pkg)} className="action-btn edit-btn" title="Edit Package">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button onClick={() => handleDeleteClick(pkg.id)} className="action-btn delete-btn" title="Delete Package">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                title="Delete Package"
                message="Are you sure you want to delete this package option?"
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default EstimatorPackages;
