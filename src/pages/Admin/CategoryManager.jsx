import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './Admin.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { useToast } from '../../context/ToastContext';

const CategoryManager = () => {
    const toast = useToast();
    const [categories, setCategories] = useState([]);
    const [flatCategories, setFlatCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        parent_id: 0,
        status: 1,
        position: 0
    });

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    // Helper to flatten nested categories tree for select dropdown
    const flattenTree = (nodes, depth = 0) => {
        let list = [];
        if (!Array.isArray(nodes)) return list;
        nodes.forEach(node => {
            list.push({ ...node, depth });
            if (node.children && node.children.length > 0) {
                list = list.concat(flattenTree(node.children, depth + 1));
            }
        });
        return list;
    };

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/categories');
            const treeData = Array.isArray(res.data) ? res.data : (res.data.tree || []);
            setCategories(treeData);
            setFlatCategories(flattenTree(treeData));
        } catch (err) {
            console.error('Fetch categories error:', err);
            toast.error('Failed to load categories.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/admin/categories/${editingId}`, formData);
                toast.success('Category updated successfully!');
            } else {
                await api.post('/admin/categories', formData);
                toast.success('Category created successfully!');
            }
            
            // Reset form
            setFormData({ name: '', parent_id: 0, status: 1, position: 0 });
            setEditingId(null);
            fetchCategories();
        } catch (err) {
            console.error('Save category error:', err);
            toast.error(err.response?.data?.message || 'Failed to save category.');
        }
    };

    const handleEdit = (cat) => {
        setEditingId(cat.id);
        setFormData({
            name: cat.name,
            parent_id: cat.parent_id || 0,
            status: cat.status ? 1 : 0,
            position: cat.position || 0
        });
    };

    const handleDeleteClick = (id) => {
        setDeleteTargetId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        setConfirmOpen(false);
        if (!deleteTargetId) return;
        try {
            await api.delete(`/admin/categories/${deleteTargetId}`);
            toast.success('Category deleted successfully.');
            fetchCategories();
        } catch (err) {
            console.error('Delete category error:', err);
            toast.error(err.response?.data?.message || 'Failed to delete category.');
        } finally {
            setDeleteTargetId(null);
        }
    };

    // Recursive render helper for category tree table
    const renderCategoryTree = (nodes, depth = 0) => {
        if (!Array.isArray(nodes)) return null;
        return nodes.map(cat => (
            <React.Fragment key={cat.id}>
                <tr>
                    <td>
                        <div style={{ paddingLeft: `${depth * 25}px`, display: 'flex', alignItems: 'center' }}>
                            {depth > 0 && <i className="fas fa-level-up-alt fa-rotate-90" style={{ marginRight: '8px', color: '#94a3b8' }}></i>}
                            <strong>{cat.name}</strong>
                            <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '10px' }}>({cat.slug})</span>
                        </div>
                    </td>
                    <td>
                        <span className={`status-badge ${cat.status ? 'published' : 'draft'}`}>
                            {cat.status ? 'Active' : 'Hidden'}
                        </span>
                    </td>
                    <td>{cat.position}</td>
                    <td>
                        <div className="action-row">
                            <button onClick={() => handleEdit(cat)} className="action-btn edit-btn" title="Edit">
                                <i className="fas fa-edit"></i>
                            </button>
                            <button onClick={() => handleDeleteClick(cat.id)} className="action-btn delete-btn" title="Delete">
                                <i className="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
                {cat.children && cat.children.length > 0 && renderCategoryTree(cat.children, depth + 1)}
            </React.Fragment>
        ));
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Navbar & Categories</h1>
                    <p>Manage the architectural structure of your website's navigation.</p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Minimal & Compact Form Card */}
                <div className="admin-card" style={{ padding: '20px' }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>
                        {editingId ? 'Edit Category' : 'Create New Category'}
                    </h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                        <div style={{ width: '240px', flexShrink: 0 }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Category Name</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="e.g. Living Room Designs"
                                style={{ padding: '8px 12px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ width: '240px', flexShrink: 0 }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Parent Item (Hierarchy)</label>
                            <select
                                className="admin-input"
                                value={formData.parent_id}
                                onChange={(e) => setFormData({ ...formData, parent_id: parseInt(e.target.value) })}
                                style={{ padding: '8px 12px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                            >
                                <option value="0">Main Navbar Item (Root)</option>
                                {flatCategories
                                    .filter(c => c.id !== editingId)
                                    .map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {'\u00A0'.repeat((cat.depth || 0) * 2)} {cat.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div style={{ width: '90px', flexShrink: 0 }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Order</label>
                            <input
                                type="number"
                                className="admin-input"
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                                style={{ padding: '8px 12px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ width: '150px', flexShrink: 0 }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Visibility</label>
                            <select
                                className="admin-input"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                                style={{ padding: '8px 12px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                            >
                                <option value="1">Active In Navbar</option>
                                <option value="0">Hidden</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button type="submit" className="admin-btn-primary" style={{ padding: '9px 20px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                {editingId ? 'Update Item' : 'Add to Navbar'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    className="admin-btn-secondary"
                                    onClick={() => {
                                        setEditingId(null);
                                        setFormData({ name: '', parent_id: 0, status: 1, position: 0 });
                                    }}
                                    style={{ padding: '9px 16px', fontSize: '0.9rem' }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Tree Table Card */}
                <div className="admin-card admin-table-container">
                    <h3 style={{ marginBottom: '15px', fontSize: '1.1rem' }}>Navigation Structure</h3>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Menu Item</th>
                                <th>Status</th>
                                <th>Order</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && categories.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Building navigation tree...</td></tr>
                            ) : categories.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Your navbar is empty. Add your first item!</td></tr>
                            ) : (
                                renderCategoryTree(categories)
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal 
                isOpen={confirmOpen}
                title="Delete Category"
                message="Are you sure you want to delete this category? Subcategories will also be removed."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default CategoryManager;
