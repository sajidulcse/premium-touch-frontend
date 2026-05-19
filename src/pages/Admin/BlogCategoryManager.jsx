import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './Admin.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

const BlogCategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCat, setNewCat] = useState({ name: '' });
    const [editing, setEditing] = useState(null);
    const [alert, setAlert] = useState(null);
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
                setAlert({ type: 'success', msg: 'Category updated!' });
            } else {
                await api.post('/blog-categories', newCat);
                setAlert({ type: 'success', msg: 'Category created!' });
            }
            setNewCat({ name: '' });
            setEditing(null);
            fetchCategories();
        } catch (err) {
            setAlert({ type: 'error', msg: 'Operation failed.' });
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
            setAlert({ type: 'success', msg: 'Category removed.' });
            fetchCategories();
        } catch (err) {
            setAlert({ type: 'error', msg: 'Delete failed.' });
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

            {alert && (
                <div className={`admin-alert alert-${alert.type}`}>
                    {alert.msg}
                    <button className="close-alert" onClick={() => setAlert(null)}>&times;</button>
                </div>
            )}

            <div className="admin-content-split">
                <form onSubmit={handleSubmit} className="admin-form-card" style={{ flex: 1 }}>
                    <h3>{editing ? 'Edit Category' : 'Create New Category'}</h3>
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
                            <button type="button" className="admin-btn-secondary" onClick={() => { setEditing(null); setNewCat({ name: '' }); }}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                <div className="admin-table-card" style={{ flex: 2 }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Slug</th>
                                <th>Blogs</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(cat => (
                                <tr key={cat.id}>
                                    <td><strong>{cat.name}</strong></td>
                                    <td><code>{cat.slug}</code></td>
                                    <td><span className="count-badge">{cat.blogs_count}</span></td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="action-btn edit" onClick={() => { setEditing(cat); setNewCat({ name: cat.name }); }}>
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button className="action-btn delete" onClick={() => handleDeleteClick(cat.id)}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
