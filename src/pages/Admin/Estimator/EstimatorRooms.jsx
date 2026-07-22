import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import '../Admin.css';
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal';
import { useToast } from '../../../context/ToastContext';

const EstimatorRooms = () => {
    const toast = useToast();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        icon: '',
        status: 1
    });

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/estimator/rooms');
            setRooms(res.data);
        } catch (err) {
            console.error("Failed to load rooms:", err);
            toast.error('Failed to load estimation rooms.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (room) => {
        setEditingId(room.id);
        setFormData({
            name: room.name,
            icon: room.icon || '',
            status: room.status ? 1 : 0
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
            await api.delete(`/admin/estimator/rooms/${deleteTargetId}`);
            toast.success('Room type deleted successfully.');
            fetchRooms();
        } catch (err) {
            console.error("Failed to delete room:", err);
            toast.error('Failed to delete room.');
        } finally {
            setDeleteTargetId(null);
        }
    };

    const handleIconChange = (value) => {
        let parsed = value.trim();
        // If it starts with '<' or contains 'class='
        if (parsed.includes('<') && parsed.includes('class=')) {
            const match = parsed.match(/class\s*=\s*["']([^"']+)["']/i);
            if (match && match[1]) {
                parsed = match[1];
            }
        }
        setFormData({ ...formData, icon: parsed });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error('Room name is required.');
            return;
        }

        try {
            const payload = {
                name: formData.name,
                icon: formData.icon,
                status: Boolean(Number(formData.status))
            };

            if (editingId) {
                await api.put(`/admin/estimator/rooms/${editingId}`, payload);
                toast.success('Room type updated successfully!');
            } else {
                await api.post('/admin/estimator/rooms', payload);
                toast.success('Room type created successfully!');
            }

            setEditingId(null);
            setFormData({ name: '', icon: '', status: 1 });
            fetchRooms();
        } catch (err) {
            console.error("Failed to save room:", err);
            toast.error(err.response?.data?.message || 'Failed to save room.');
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Manage Estimation Rooms</h1>
                    <p>Register room areas (e.g. Kitchen, Master Bedroom) that users can count and select in the wizard.</p>
                </div>
            </div>

            {/* Room Form Card (Top) */}
            <div className="admin-card" style={{ marginBottom: '28px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className={`fas ${editingId ? 'fa-edit' : 'fa-plus-circle'}`} style={{ color: '#c9a45c' }}></i>
                    {editingId ? 'Edit Room Type' : 'Add New Room Type'}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Room Name *</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Master Bedroom"
                                style={{ height: '42px', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box', margin: 0 }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Icon Class (FontAwesome)</label>
                            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={formData.icon}
                                    onChange={(e) => handleIconChange(e.target.value)}
                                    placeholder="e.g. fas fa-bed"
                                    style={{ flex: 1, height: '42px', fontSize: '0.88rem', boxSizing: 'border-box', margin: 0 }}
                                />
                                <div style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc', color: '#c9a45c', fontSize: '1.1rem', flexShrink: 0 }}>
                                    <i className={formData.icon || 'fas fa-door-open'}></i>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Wizard Status</label>
                            <select
                                className="admin-select"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                                style={{ height: '42px', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box', margin: 0 }}
                            >
                                <option value={1}>Active (Visible)</option>
                                <option value={0}>Inactive (Hidden)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="submit" className="admin-btn-primary" style={{ padding: '10px 24px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-save"></i> {editingId ? 'Update Room' : 'Save Room'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                className="admin-btn-secondary"
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({ name: '', icon: '', status: 1 });
                                }}
                                style={{ padding: '10px 20px', fontSize: '0.88rem' }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Rooms List Table Card (Bottom) */}
            <div className="admin-card">
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    Registered Rooms ({rooms.length})
                </h3>
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>Loading rooms...</div>
                ) : rooms.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>No rooms registered.</div>
                ) : (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Icon</th>
                                    <th>Room Name</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rooms.map(room => (
                                    <tr key={room.id}>
                                        <td style={{ fontSize: '1.2rem', textAlign: 'center', width: '50px', color: '#c9a45c' }}>
                                            {room.icon ? <i className={room.icon}></i> : <i className="fas fa-door-closed" style={{ opacity: 0.3 }}></i>}
                                        </td>
                                        <td>
                                            <div>
                                                <strong style={{ color: '#1e293b' }}>{room.name}</strong>
                                                {room.slug && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}><code>{room.slug}</code></div>}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${room.status ? 'published' : 'draft'}`}>
                                                {room.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-row">
                                                <button onClick={() => handleEdit(room)} className="action-btn edit-btn" title="Edit Room">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button onClick={() => handleDeleteClick(room.id)} className="action-btn delete-btn" title="Delete Room">
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
                title="Delete Room Type"
                message="Are you sure you want to delete this room type?"
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default EstimatorRooms;
