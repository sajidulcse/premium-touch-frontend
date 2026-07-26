import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './Admin.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { useToast } from '../../context/ToastContext';

const BlogCategoryManager = () => {
    const toast = useToast();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCat, setNewCat] = useState({ name: '' });
    const [editing, setEditing] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/blog-categories');
            setCategories(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/blog-categories/${editing.id}`, newCat);
                toast.success('Category updated!');
            } else {
                await api.post('/blog-categories', newCat);
                toast.success('Category created!');
            }
            setNewCat({ name: '' });
            setEditing(null);
            fetchCategories();
        } catch (err) {
            toast.error('Operation failed.');
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
            await api.delete(`/blog-categories/${deleteTargetId}`);
            toast.success('Category removed.');
            fetchCategories();
        } catch (err) {
            toast.error('Delete failed.');
        } finally {
            setDeleteTargetId(null);
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Blog Categories</h1>
                    <p>Organize your stories by architectural and design styles.</p>
                </div>
            </div>

            <div className="admin-grid-layout">
                <div className="admin-card editor-main-card">
                    <h3>{editing ? 'Edit Category' : 'Create New Category'}</h3>
                    <form onSubmit={handleSubmit} className="admin-form-inline">
                        <div className="form-group">
                            <label>Category Name</label>
                            <input
                                type="text"
                                className="admin-input"
                                placeholder="e.g. Duplex House Design"
                                value={newCat.name}
                                onChange={(e) => setNewCat({ name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="admin-btn-primary">
                                {editing ? 'Update Category' : 'Save Category'}
                            </button>
                            {editing && (
                                <button
                                    type="button"
                                    className="admin-btn-secondary"
                                    onClick={() => { setEditing(null); setNewCat({ name: '' }); }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="admin-card admin-table-container" style={{ marginTop: '30px' }}>
                    <h3>Blog Categories</h3>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Slug</th>
                                <th>Blogs</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Loading categories...</td></tr>
                            ) : categories.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No categories found. Add your first one!</td></tr>
                            ) : (
                                categories.map(cat => (
                                    <tr key={cat.id}>
                                        <td>
                                            <div className="cat-name-cell">
                                                <strong>{cat.name}</strong>
                                            </div>
                                        </td>
                                        <td><code>{cat.slug}</code></td>
                                        <td>{cat.blogs_count ?? 0}</td>
                                        <td>
                                            <div className="action-row">
                                                <button
                                                    className="action-btn edit-btn"
                                                    title="Edit"
                                                    onClick={() => { setEditing(cat); setNewCat({ name: cat.name }); }}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    className="action-btn delete-btn"
                                                    title="Delete"
                                                    onClick={() => handleDeleteClick(cat.id)}
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                title="Delete Blog Category"
                message="Are you sure you want to delete this blog category?"
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default BlogCategoryManager;
