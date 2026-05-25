import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './Admin.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

const ProjectCategoryManager = () => {
    const [projectRoot, setProjectRoot] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', parent_id: '', status: 1, position: 0 });
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/categories');
            let allCats = res.data;
            
            // Find or create "Projects" root category (parent_id = 0)
            let root = allCats.find(c => c.slug === 'projects' || c.name.toLowerCase() === 'projects');
            if (!root) {
                const createRes = await api.post('/admin/categories', {
                    name: 'Projects',
                    parent_id: 0,
                    status: 1,
                    position: 0
                });
                root = createRes.data.category;
                
                // Re-fetch all to get nested structure correctly with the new root
                const refetchRes = await api.get('/admin/categories');
                allCats = refetchRes.data;
                root = allCats.find(c => c.id === root.id);
            }
            
            setProjectRoot(root);
            setCategories(root?.children || []);
            
            // Initialize default parent_id to the Projects root category ID
            if (root) {
                setFormData(prev => ({
                    ...prev,
                    parent_id: root.id.toString()
                }));
            }
        } catch (err) {
            console.error(err);
            setAlert({ type: 'error', msg: 'Failed to fetch project categories.' });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (cat) => {
        setEditingId(cat.id);
        setFormData({
            name: cat.name,
            parent_id: cat.parent_id.toString(),
            status: cat.status,
            position: cat.position || 0
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
            await api.delete(`/admin/categories/${deleteTargetId}`);
            setAlert({ type: 'success', msg: 'Project category removed.' });
            fetchCategories();
        } catch (err) {
            setAlert({ type: 'error', msg: 'Failed to delete category.' });
        } finally {
            setDeleteTargetId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!projectRoot) return;

        try {
            const dataToSubmit = {
                ...formData,
                parent_id: parseInt(formData.parent_id)
            };

            if (editingId) {
                await api.put(`/admin/categories/${editingId}`, dataToSubmit);
                setAlert({ type: 'success', msg: 'Category updated successfully.' });
            } else {
                await api.post('/admin/categories', dataToSubmit);
                setAlert({ type: 'success', msg: 'Project category created successfully.' });
            }
            setEditingId(null);
            setFormData({ name: '', parent_id: projectRoot.id.toString(), status: 1, position: 0 });
            fetchCategories();
        } catch (err) {
            setAlert({ type: 'error', msg: 'Failed to save category.' });
        }
    };

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
                    <h1>Project Categories</h1>
                    <p>Manage categories and subcategories used exclusively for your Design Projects.</p>
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
                                placeholder="e.g. Interior Design or Residential"
                            />
                        </div>

                        <div className="form-group">
                            <label>Parent Category</label>
                            <select
                                className="admin-input"
                                value={formData.parent_id}
                                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                required
                            >
                                {projectRoot && (
                                    <option value={projectRoot.id.toString()}>
                                        Main Category
                                    </option>
                                )}
                                {categories
                                    .filter(c => c.id !== editingId)
                                    .map(cat => (
                                        <option key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
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
                                    onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Visibility</label>
                                <select
                                    className="admin-input"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                                >
                                    <option value="1">Active</option>
                                    <option value="0">Hidden</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="admin-btn-primary">
                                {editingId ? 'Update Category' : 'Create Category'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    className="admin-btn-secondary"
                                    onClick={() => {
                                        setEditingId(null);
                                        setFormData({ name: '', parent_id: projectRoot ? projectRoot.id.toString() : '', status: 1, position: 0 });
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="admin-card admin-table-container" style={{ marginTop: '30px' }}>
                    <h3>Project Category Structure</h3>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Category Name</th>
                                <th>Status</th>
                                <th>Order</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && categories.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Loading categories...</td></tr>
                            ) : categories.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No project categories found. Add your first category!</td></tr>
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

export default ProjectCategoryManager;
