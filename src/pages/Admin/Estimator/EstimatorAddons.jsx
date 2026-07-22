import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import '../Admin.css';
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal';
import { useToast } from '../../../context/ToastContext';

const EstimatorAddons = () => {
    const toast = useToast();
    const [addons, setAddons] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const [formData, setFormData] = useState({
        room_id: '',
        name: '',
        status: 1,
        prices: {} // package_id -> price
    });

    useEffect(() => {
        fetchAddons();
        fetchRooms();
        fetchPackages();
    }, []);

    const fetchAddons = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/estimator/addons');
            setAddons(res.data);
        } catch (err) {
            console.error("Failed to load addons:", err);
            toast.error('Failed to load estimation add-ons.');
        } finally {
            setLoading(false);
        }
    };

    const fetchRooms = async () => {
        try {
            const res = await api.get('/admin/estimator/rooms');
            setRooms(res.data.filter(r => r.status));
        } catch (err) {
            console.error("Failed to load rooms:", err);
        }
    };

    const fetchPackages = async () => {
        try {
            const res = await api.get('/admin/estimator/packages');
            setPackages(res.data.filter(p => p.status));
        } catch (err) {
            console.error("Failed to load packages:", err);
        }
    };

    const handleEdit = (addon) => {
        setEditingId(addon.id);

        const priceMap = {};
        addon.prices?.forEach(p => {
            priceMap[p.package_id] = p.price;
        });

        setFormData({
            room_id: addon.room_id,
            name: addon.name,
            status: addon.status ? 1 : 0,
            prices: priceMap
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
            await api.delete(`/admin/estimator/addons/${deleteTargetId}`);
            toast.success('Add-on deleted successfully.');
            fetchAddons();
        } catch (err) {
            console.error("Failed to delete addon:", err);
            toast.error('Failed to delete add-on.');
        } finally {
            setDeleteTargetId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.room_id || !formData.name) {
            toast.error('Room mapping and Add-on Title are required.');
            return;
        }

        // Validate package prices
        for (const pkg of packages) {
            const price = formData.prices[pkg.id];
            if (price === undefined || price === '' || Number(price) < 0) {
                toast.error(`Price for "${pkg.name}" is required and must be a positive number.`);
                return;
            }
        }

        try {
            const pricesPayload = Object.entries(formData.prices).map(([pkgId, price]) => ({
                package_id: Number(pkgId),
                price: Number(price)
            }));

            const payload = {
                room_id: Number(formData.room_id),
                name: formData.name,
                status: Boolean(Number(formData.status)),
                prices: pricesPayload
            };

            if (editingId) {
                await api.put(`/admin/estimator/addons/${editingId}`, payload);
                toast.success('Add-on updated successfully!');
            } else {
                await api.post('/admin/estimator/addons', payload);
                toast.success('Add-on created successfully!');
            }

            setEditingId(null);
            setFormData({ room_id: '', name: '', status: 1, prices: {} });
            fetchAddons();
        } catch (err) {
            console.error("Failed to save addon:", err);
            toast.error(err.response?.data?.message || 'Failed to save add-on.');
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Manage Room Add-ons</h1>
                    <p>Map modular fixtures (e.g. modular wardrobes, false ceilings) to room categories and assign package-specific prices.</p>
                </div>
            </div>

            {/* Addon Form Card (Top) */}
            <div className="admin-card" style={{ marginBottom: '28px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className={`fas ${editingId ? 'fa-edit' : 'fa-plus-circle'}`} style={{ color: '#c9a45c' }}></i>
                    {editingId ? 'Edit Add-on Option' : 'Add New Add-on Option'}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Add-on Title *</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Sliding Wardrobe"
                                style={{ height: '42px', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box', margin: 0 }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Room Category *</label>
                            <select
                                className="admin-select"
                                value={formData.room_id}
                                onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                                style={{ height: '42px', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box', margin: 0 }}
                            >
                                <option value="">-- Choose Room Type --</option>
                                {rooms.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
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

                    <h4 style={{ margin: '18px 0 12px 0', color: '#475569', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fas fa-tags" style={{ color: '#c9a45c' }}></i> Package Specific Prices (৳)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        {packages.map(pkg => (
                            <div key={pkg.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', margin: 0 }}>{pkg.name} Price (৳) *</label>
                                <input
                                    type="number"
                                    className="admin-input"
                                    value={formData.prices[pkg.id] ?? ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        prices: {
                                            ...formData.prices,
                                            [pkg.id]: e.target.value
                                        }
                                    })}
                                    placeholder={`Price for ${pkg.name}`}
                                    style={{ height: '40px', fontSize: '0.88rem', background: '#fff', width: '100%', boxSizing: 'border-box', margin: 0 }}
                                />
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="submit" className="admin-btn-primary" style={{ padding: '10px 24px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-save"></i> {editingId ? 'Update Add-on' : 'Save Add-on'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                className="admin-btn-secondary"
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({ room_id: '', name: '', status: 1, prices: {} });
                                }}
                                style={{ padding: '10px 20px', fontSize: '0.88rem' }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Add-on Table Card (Bottom) */}
            <div className="admin-card">
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    Configured Add-on Options ({addons.length})
                </h3>
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>Loading add-ons...</div>
                ) : addons.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>No add-ons registered.</div>
                ) : (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Add-on Name</th>
                                    <th>Room Section</th>
                                    <th>Prices</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {addons.map(addon => (
                                    <tr key={addon.id}>
                                        <td><strong style={{ color: '#1e293b' }}>{addon.name}</strong></td>
                                        <td>
                                            <span className="table-cat-badge">{addon.room?.name || 'Unassigned'}</span>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.82rem', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                                                {packages.map(pkg => {
                                                    const priceRecord = addon.prices?.find(p => p.package_id === pkg.id);
                                                    const priceVal = priceRecord ? Number(priceRecord.price) : 0;
                                                    return (
                                                        <div key={pkg.id}>
                                                            <span style={{ color: '#64748b' }}>{pkg.name}:</span> <strong style={{ color: '#c9a45c' }}>৳{priceVal.toLocaleString()}</strong>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${addon.status ? 'published' : 'draft'}`}>
                                                {addon.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-row">
                                                <button onClick={() => handleEdit(addon)} className="action-btn edit-btn" title="Edit Add-on">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button onClick={() => handleDeleteClick(addon.id)} className="action-btn delete-btn" title="Delete Add-on">
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
                title="Delete Add-on"
                message="Are you sure you want to delete this add-on option?"
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default EstimatorAddons;
