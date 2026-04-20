import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './Admin.css';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', parent_id: 0, status: 1, position: 0 });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/categories');
            setCategories(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (cat) => {
        setEditingId(cat.id);
        setFormData({
            name: cat.name,
            parent_id: cat.parent_id,
            status: cat.status,
            position: cat.position || 0
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this category? Subcategories will also be removed.')) {
            try {
                await api.delete(`/admin/categories/${id}`);
                setAlert({ type: 'success', msg: 'Category removed.' });
                fetchCategories();
            } catch (err) {
                setAlert({ type: 'error', msg: 'Failed to delete.' });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/admin/categories/${editingId}`, formData);
                setAlert({ type: 'success', msg: 'Category updated.' });
            } else {
                await api.post('/admin/categories', formData);
                setAlert({ type: 'success', msg: 'Category added to navbar.' });
            }
            setEditingId(null);
            setFormData({ name: '', parent_id: 0, status: 1, position: 0 });
            fetchCategories();
        } catch (err) {
            setAlert({ type: 'error', msg: 'Failed to save category.' });
        }
    };

    // Helper to get all potential parents (flattened list)
    const getFlattenedCategories = (items, depth = 0) => {
        let flat = [];
        items.forEach(cat => {
            flat.push({ id: cat.id, name: cat.name, depth });
            if (cat.children && cat.children.length > 0) {
                flat = flat.concat(getFlattenedCategories(cat.children, depth + 1));
            }
        });
        return flat;
    };

    const flatCategories = getFlattenedCategories(categories);

    const renderCategoryTree = (items, depth = 0) => {
        return items.map(cat => (
            <React.Fragment key={cat.id}>
                <tr>
                    <td style={{ paddingLeft: `${depth * 30 + 20}px` }}>
                        <div className="cat-name-cell">
                            {depth > 0 && <span className="cat-tree-branch">∟</span>}
                            <strong>{cat.name}</strong>
                            <span className="cat-slug-hint">/{cat.slug}</span>
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
                            <button onClick={() => handleDelete(cat.id)} className="action-btn delete-btn" title="Delete">
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

            {alert && (
                <div className={`admin-alert alert-${alert.type}`}>
                    {alert.msg}
                    <button className="close-alert" onClick={() => setAlert(null)}>&times;</button>
                </div>
            )}

            <div className="admin-grid-layout">
                <div className="admin-card editor-main-card">
                    <h3>{editingId ? 'Edit Category' : 'Create New Category'}</h3>
                    <form onSubmit={handleSubmit} className="admin-form-inline">
                        <div className="form-group">
                            <label>Category Name</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="e.g. Living Room Designs"
                            />
                        </div>

                        <div className="form-group">
                            <label>Parent Item (Navbar Hierarchy)</label>
                            <select
                                className="admin-input"
                                value={formData.parent_id}
                                onChange={(e) => setFormData({ ...formData, parent_id: parseInt(e.target.value) })}
                            >
                                <option value="0">Main Navbar Item (Root)</option>
                                {flatCategories
                                    .filter(c => c.id !== editingId)
                                    .map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {'\u00A0'.repeat(cat.depth * 2)} {cat.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Order Position</label>
                                <input
                                    type="number"
                                    className="admin-input"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Visibility</label>
                                <select
                                    className="admin-input"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                                >
                                    <option value="1">Active In Navbar</option>
                                    <option value="0">Hidden</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="admin-btn-primary">
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
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="admin-card admin-table-container" style={{ marginTop: '30px' }}>
                    <h3>Navigation Structure</h3>
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
        </div>
    );
};

export default CategoryManager;
