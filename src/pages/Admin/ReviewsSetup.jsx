import React, { useState, useEffect } from 'react';
import './Admin.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import api, { getStorageUrl } from '../../api/axios';

const ReviewsSetup = () => {
    const [reviews, setReviews] = useState([]);
    const [formData, setFormData] = useState({ quote: '', author: '', location: '', image: '' });
    const [imageFile, setImageFile] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [alert, setAlert] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await api.get('/client-reviews');
                setReviews(res.data);
            } catch (err) {
                console.error("Failed to fetch reviews:", err);
                setAlert({ type: 'error', msg: 'Failed to load reviews from database.' });
            }
        };
        fetchReviews();
    }, []);

    const handleEdit = (rev) => {
        setEditingId(rev.id);
        setFormData({
            quote: rev.quote,
            author: rev.author,
            location: rev.location || '',
            image: rev.image || ''
        });
        setImageFile(null);
        const fileInput = document.getElementById('review-image-file');
        if (fileInput) fileInput.value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = (id) => {
        setDeleteTargetId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await api.delete(`/client-reviews/${deleteTargetId}`);
            setReviews(reviews.filter(r => r.id !== deleteTargetId));
            setAlert({ type: 'success', msg: 'Client review removed successfully.' });
        } catch (err) {
            console.error("Failed to delete review:", err);
            setAlert({ type: 'error', msg: 'Failed to delete client review.' });
        } finally {
            setConfirmOpen(false);
            setDeleteTargetId(null);
            setFormData({ quote: '', author: '', location: '', image: '' });
            setImageFile(null);
            setEditingId(null);
            const fileInput = document.getElementById('review-image-file');
            if (fileInput) fileInput.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const submitData = new FormData();
        submitData.append('quote', formData.quote);
        submitData.append('author', formData.author);
        submitData.append('location', formData.location || '');
        submitData.append('image', formData.image || '');
        if (imageFile) {
            submitData.append('image_file', imageFile);
        }

        try {
            if (editingId) {
                const res = await api.post(`/client-reviews/${editingId}`, submitData);
                setReviews(reviews.map(r => r.id === editingId ? res.data.review : r));
                setAlert({ type: 'success', msg: 'Client review updated successfully.' });
            } else {
                const res = await api.post('/client-reviews', submitData);
                setReviews([...reviews, res.data.review]);
                setAlert({ type: 'success', msg: 'New client review added.' });
            }
            setFormData({ quote: '', author: '', location: '', image: '' });
            setImageFile(null);
            const fileInput = document.getElementById('review-image-file');
            if (fileInput) fileInput.value = '';
            setEditingId(null);
        } catch (err) {
            console.error("Failed to save client review:", err);
            setAlert({ type: 'error', msg: 'Failed to save client review.' });
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Our Clients Review Setup</h1>
                    <p>Manage testimonials, quotes, client names, and project locations shown on the home page slider.</p>
                </div>
            </div>

            {alert && (
                <div className={`admin-alert alert-${alert.type}`}>
                    {alert.msg}
                    <button className="close-alert" onClick={() => setAlert(null)}>&times;</button>
                </div>
            )}

            <div className="admin-card editor-main-card">
                    <h3>{editingId ? 'Edit Client Review' : 'Add New Client Review'}</h3>
                    <form onSubmit={handleSubmit} className="admin-form-inline">
                        <div className="form-group">
                            <label>Client Quote / Testimonial</label>
                            <textarea
                                className="admin-input"
                                style={{ height: '100px', resize: 'vertical' }}
                                value={formData.quote}
                                onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                                required
                                placeholder="Enter what the client said about your work..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Client Author Name</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={formData.author}
                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                required
                                placeholder="e.g. Marcus & Sophia"
                            />
                        </div>

                        <div className="form-group">
                            <label>Project Location / Client Designation</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g. Gulshan Residence / CEO, Nexa Studio"
                            />
                        </div>
                        <div className="form-group">
                            <label>Upload Client Image</label>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '5px' }}>
                                <strong>Recommended:</strong> 120x120 px (1:1 square, transparent PNG or JPG preferred).
                            </span>
                            <input
                                id="review-image-file"
                                type="file"
                                accept="image/*"
                                className="admin-input"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setImageFile(e.target.files[0]);
                                    }
                                }}
                            />
                        </div>

                        <div style={{ textAlign: 'center', margin: '15px 0', color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>- OR -</div>

                        <div className="form-group">
                            <label>Client Image Path or URL</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                placeholder="e.g. /photo/default_avatar.png"
                            />
                        </div>

                        <div className="form-actions" style={{ marginTop: '20px' }}>
                            <button type="submit" className="admin-btn-primary">
                                <i className={editingId ? "fas fa-save" : "fas fa-plus-circle"}></i> {editingId ? 'Update Review' : 'Add Review'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    className="admin-btn-secondary"
                                    onClick={() => {
                                        setEditingId(null);
                                        setFormData({ quote: '', author: '', location: '' });
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="admin-card table-card" style={{ marginTop: '30px' }}>
                    <h3>Active Client Reviews</h3>
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '80px' }}>Avatar</th>
                                    <th>Client Quote</th>
                                    <th style={{ width: '150px' }}>Author Name</th>
                                    <th style={{ width: '150px' }}>Location</th>
                                    <th style={{ width: '100px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center">No reviews found. Click above to add one.</td>
                                    </tr>
                                ) : (
                                    reviews.map(rev => (
                                        <tr key={rev.id}>
                                            <td>
                                                <div className="table-avatar-wrap">
                                                    {rev.image ? (
                                                        <img
                                                            src={getStorageUrl(rev.image)}
                                                            alt={rev.author}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.parentNode.innerHTML = '<i class="fas fa-user"></i>';
                                                            }}
                                                        />
                                                    ) : (
                                                        <i className="fas fa-user"></i>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: '#555', margin: 0 }}>
                                                    "{rev.quote}"
                                                </p>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{rev.author}</td>
                                            <td>{rev.location || 'N/A'}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="action-btn edit-btn"
                                                        onClick={() => handleEdit(rev)}
                                                        title="Edit review"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button
                                                        className="action-btn delete-btn"
                                                        onClick={() => handleDeleteClick(rev.id)}
                                                        title="Delete review"
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
                title="Remove Client Review"
                message="Are you sure you want to remove this client review? It will immediately stop appearing on the home page testimonials slider."
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default ReviewsSetup;
