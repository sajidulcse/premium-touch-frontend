import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { getStorageUrl } from '../../api/axios';
import './Admin.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { useToast } from '../../context/ToastContext';

const BlogManager = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin-blogs');
            setBlogs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteTargetId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        setConfirmOpen(false);
        if (!deleteTargetId) return;
        const targetId = deleteTargetId;
        setDeleteTargetId(null);

        // Instant Optimistic UI Update: Remove blog immediately without page reload or spinner
        setBlogs(prev => prev.filter(b => b.id !== targetId));
        toast.success('Story removed from archives.');

        try {
            await api.delete(`/blogs/${targetId}`);
        } catch (err) {
            toast.error('Could not delete.');
            fetchBlogs(); // Rollback on error
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Story Archives</h1>
                    <p>Manage all your published narratives and drafts.</p>
                </div>
                <button className="admin-btn-primary" onClick={() => navigate('/admin/blogs/new')}>
                    <i className="fas fa-plus"></i> Compose New Story
                </button>
            </div>



            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Cover</th>
                            <th>Narrative Details</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Engagements</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && blogs.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading archives...</td></tr>
                        ) : blogs.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No stories found. Start composing!</td></tr>
                        ) : (
                            blogs.map(blog => (
                                <tr key={blog.id}>
                                    <td width="80">
                                        <div className="table-img-wrap small">
                                            {blog.images[0] ? (
                                                <img src={getStorageUrl(blog.images[0].image_path)} alt="" />
                                            ) : (
                                                <div className="img-placeholder">PT</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="blog-title-cell">
                                        <Link to={`/admin/blogs/edit/${blog.id}`} className="table-title-link">
                                            <strong>{blog.title}</strong>
                                        </Link>
                                        <div className="table-small-info">
                                            {new Date(blog.created_at).toLocaleDateString()} &bull; {blog.author}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="table-cat-badge">{blog.category?.name || 'Uncategorized'}</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${blog.status}`}>
                                            {blog.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="eng-grid">
                                            <span><i className="fas fa-eye" title="Views"></i> {blog.views}</span>
                                            <span><i className="fas fa-comment" title="Comments"></i> {blog.comments_count || 0}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-row">
                                            <button onClick={() => navigate(`/admin/blogs/edit/${blog.id}`)} className="action-btn edit-btn" title="Edit">
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button onClick={() => handleDeleteClick(blog.id)} className="action-btn delete-btn" title="Delete">
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

            <ConfirmModal 
                isOpen={confirmOpen}
                title="Delete Blog Post"
                message="Are you sure you want to delete this blog post? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default BlogManager;
