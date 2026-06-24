import React, { useState, useEffect } from 'react';
import './Admin.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import api, { getStorageUrl } from '../../api/axios';

const HeroSetup = () => {
    const [slides, setSlides] = useState([]);
    const [formData, setFormData] = useState({ subtitle: '', title: '', desc: '', image: '' });
    const [imageFile, setImageFile] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [alert, setAlert] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const res = await api.get('/home-hero-slides');
                setSlides(res.data);
            } catch (err) {
                console.error("Failed to fetch slides:", err);
                setAlert({ type: 'error', msg: 'Failed to load slides from database.' });
            }
        };
        fetchSlides();
    }, []);

    const handleEdit = (slide) => {
        setEditingId(slide.id);
        setFormData({
            subtitle: slide.subtitle,
            title: slide.title,
            desc: slide.desc,
            image: slide.image || ''
        });
        setImageFile(null);
        const fileInput = document.getElementById('slide-image-file');
        if (fileInput) fileInput.value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = (id) => {
        setDeleteTargetId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await api.delete(`/home-hero-slides/${deleteTargetId}`);
            setSlides(slides.filter(s => s.id !== deleteTargetId));
            setAlert({ type: 'success', msg: 'Hero slide removed successfully.' });
        } catch (err) {
            console.error("Failed to delete slide:", err);
            setAlert({ type: 'error', msg: 'Failed to remove hero slide.' });
        } finally {
            setConfirmOpen(false);
            setDeleteTargetId(null);
            setFormData({ subtitle: '', title: '', desc: '', image: '' });
            setImageFile(null);
            setEditingId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!imageFile && !formData.image) {
            setAlert({ type: 'error', msg: 'Please select an image file to upload or enter an image URL.' });
            return;
        }

        const submitData = new FormData();
        submitData.append('subtitle', formData.subtitle);
        submitData.append('title', formData.title);
        submitData.append('desc', formData.desc);
        submitData.append('image', formData.image || '');
        if (imageFile) {
            submitData.append('image_file', imageFile);
        }

        try {
            if (editingId) {
                const res = await api.post(`/home-hero-slides/${editingId}`, submitData);
                setSlides(slides.map(s => s.id === editingId ? res.data.slide : s));
                setAlert({ type: 'success', msg: 'Hero slide updated successfully.' });
            } else {
                const res = await api.post('/home-hero-slides', submitData);
                setSlides([...slides, res.data.slide]);
                setAlert({ type: 'success', msg: 'New hero slide added.' });
            }
            setFormData({ subtitle: '', title: '', desc: '', image: '' });
            setImageFile(null);
            const fileInput = document.getElementById('slide-image-file');
            if (fileInput) fileInput.value = '';
            setEditingId(null);
        } catch (err) {
            console.error("Failed to save slide:", err);
            setAlert({ type: 'error', msg: 'Failed to save hero slide.' });
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Hero Setup</h1>
                    <p>Manage home page hero banner slides, imagery, and overlay text content.</p>
                </div>
            </div>

            {alert && (
                <div className={`admin-alert alert-${alert.type}`}>
                    {alert.msg}
                    <button className="close-alert" onClick={() => setAlert(null)}>&times;</button>
                </div>
            )}

            <div className="admin-card editor-main-card">
                    <h3>{editingId ? 'Edit Hero Slide' : 'Add New Hero Slide'}</h3>
                    <form onSubmit={handleSubmit} className="admin-form-inline">
                        <div className="form-group">
                            <label>Subtitle / Category Tag</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={formData.subtitle}
                                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value.toUpperCase() })}
                                required
                                placeholder="e.g. LUXURIOUS RESIDENCES"
                            />
                        </div>

                        <div className="form-group">
                            <label>Slide Title</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="e.g. Curated Living Spaces"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description Paragraph</label>
                            <textarea
                                className="admin-input"
                                style={{ height: '80px', resize: 'vertical' }}
                                value={formData.desc}
                                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                                required
                                placeholder="Enter a brief description explaining this design approach..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Upload Slide Image</label>
                            <span style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '5px' }}>
                                <strong>Recommended:</strong> 1920x1080 px (16:9 aspect ratio)
                            </span>
                            <input
                                id="slide-image-file"
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

                        <div style={{ textAlign: 'center', margin: '10px 0', color: '#aaa', fontWeight: 600, fontSize: '0.9rem' }}>- OR -</div>

                        <div className="form-group">
                            <label>Slide Image URL</label>
                            <input
                                type="url"
                                className="admin-input"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                placeholder="e.g. https://images.unsplash.com/photo-..."
                            />
                        </div>

                        <div className="form-actions" style={{ marginTop: '20px' }}>
                            <button type="submit" className="admin-btn-primary">
                                <i className={editingId ? "fas fa-save" : "fas fa-plus-circle"}></i> {editingId ? 'Update Slide' : 'Add Slide'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    className="admin-btn-secondary"
                                    onClick={() => {
                                        setEditingId(null);
                                        setFormData({ subtitle: '', title: '', desc: '', image: '' });
                                        setImageFile(null);
                                        const fileInput = document.getElementById('slide-image-file');
                                        if (fileInput) fileInput.value = '';
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="admin-card table-card" style={{ marginTop: '30px' }}>
                    <h3>Active Slides List</h3>
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '100px' }}>Preview</th>
                                    <th style={{ width: '250px' }}>Subtitle & Title</th>
                                    <th>Description</th>
                                    <th style={{ width: '100px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slides.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center">No slides found. Click above to add one.</td>
                                    </tr>
                                ) : (
                                    slides.map(slide => (
                                        <tr key={slide.id}>
                                            <td>
                                                <img
                                                    src={getStorageUrl(slide.image)}
                                                    alt="Thumbnail"
                                                    style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                                />
                                            </td>
                                            <td>
                                                <small style={{ color: '#E85D25', fontWeight: 600 }}>{slide.subtitle}</small>
                                                <div style={{ fontWeight: 'bold' }}>{slide.title}</div>
                                            </td>
                                            <td>
                                                <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                                                    {slide.desc}
                                                </p>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="action-btn edit-btn"
                                                        onClick={() => handleEdit(slide)}
                                                        title="Edit slide"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button
                                                        className="action-btn delete-btn"
                                                        onClick={() => handleDeleteClick(slide.id)}
                                                        title="Delete slide"
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
                title="Remove Hero Slide"
                message="Are you sure you want to remove this slide? It will immediately stop appearing on the home page hero slider."
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default HeroSetup;
