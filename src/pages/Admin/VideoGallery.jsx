import React, { useState, useEffect } from 'react';
import './Admin.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

const VideoGallery = () => {
    const [videos, setVideos] = useState([]);
    const [formData, setFormData] = useState({ title: '', url: '', description: '', position: 1 });
    const [editingId, setEditingId] = useState(null);
    const [activeVideo, setActiveVideo] = useState(null);
    const [alert, setAlert] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    // Initial mock data if empty
    const defaultVideos = [
        {
            id: 'vid-1',
            title: 'Modern Living Room Walkthrough',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            description: 'A cinematic look into our recently completed duplex living area in Gulshan.',
            position: 1
        },
        {
            id: 'vid-2',
            title: 'Premium Penthouse Interior Tour',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            description: 'Showcasing the custom lighting designs and marble selections.',
            position: 2
        }
    ];

    const calculateNextPosition = (videoList) => {
        if (!videoList || videoList.length === 0) return 1;
        const positions = videoList.map(v => parseInt(v.position) || 0);
        return Math.max(...positions) + 1;
    };

    const resetForm = (videoList) => {
        const nextPos = calculateNextPosition(videoList);
        setFormData({ title: '', url: '', description: '', position: nextPos });
        setEditingId(null);
    };

    useEffect(() => {
        const saved = localStorage.getItem('premium_touch_videos');
        let currentVideos = [];
        if (saved) {
            currentVideos = JSON.parse(saved);
        } else {
            localStorage.setItem('premium_touch_videos', JSON.stringify(defaultVideos));
            currentVideos = defaultVideos;
        }
        setVideos(currentVideos);
        
        // Auto set initial position
        const nextPos = calculateNextPosition(currentVideos);
        setFormData(prev => ({ ...prev, position: nextPos }));
    }, []);

    const getEmbedUrlAndThumbnail = (url) => {
        let embedUrl = '';
        let thumbnailUrl = '';
        
        // YouTube
        const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (ytMatch && ytMatch[1]) {
            embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
            thumbnailUrl = `https://img.youtube.com/vi/${ytMatch[1]}/0.jpg`;
        } else {
            // Vimeo fallback match
            const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i);
            if (vimeoMatch && vimeoMatch[1]) {
                embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
                thumbnailUrl = `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
            }
        }
        
        return { embedUrl, thumbnailUrl };
    };

    const saveToLocalStorage = (updatedList) => {
        localStorage.setItem('premium_touch_videos', JSON.stringify(updatedList));
        setVideos(updatedList);
    };

    const handleEdit = (vid) => {
        setEditingId(vid.id);
        setFormData({
            title: vid.title,
            url: vid.url,
            description: vid.description || '',
            position: vid.position || 0
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = (id) => {
        setDeleteTargetId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        const filtered = videos.filter(v => v.id !== deleteTargetId);
        saveToLocalStorage(filtered);
        setConfirmOpen(false);
        setDeleteTargetId(null);
        setAlert({ type: 'success', msg: 'Video removed from gallery.' });
        resetForm(filtered);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const { embedUrl } = getEmbedUrlAndThumbnail(formData.url);
        if (!embedUrl) {
            setAlert({ type: 'error', msg: 'Please provide a valid YouTube or Vimeo URL.' });
            return;
        }

        let updated = [];
        if (editingId) {
            updated = videos.map(v => v.id === editingId ? { ...v, ...formData } : v);
            saveToLocalStorage(updated);
            setAlert({ type: 'success', msg: 'Video link updated successfully.' });
        } else {
            const newVideo = {
                id: `vid-${Date.now()}`,
                ...formData
            };
            updated = [...videos, newVideo];
            saveToLocalStorage(updated);
            setAlert({ type: 'success', msg: 'New video added to gallery.' });
        }

        resetForm(updated);
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Video Gallery</h1>
                    <p>Manage walkthrough and design tour video assets.</p>
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
                    <h3>{editingId ? 'Edit Video Link' : 'Add New Video Link'}</h3>
                    <form onSubmit={handleSubmit} className="admin-form-inline">
                        <div className="form-group">
                            <label>Video Title</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="e.g. Duplex Living Room walkthrough"
                            />
                        </div>

                        <div className="form-group">
                            <label>Video URL (YouTube or Vimeo)</label>
                            <input
                                type="url"
                                className="admin-input"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                required
                                placeholder="e.g. https://www.youtube.com/watch?v=..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Description / Caption</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Short context about the video..."
                            />
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
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="admin-btn-primary">
                                {editingId ? 'Update Video' : 'Add Video'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    className="admin-btn-secondary"
                                    onClick={() => {
                                        resetForm(videos);
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="admin-card" style={{ marginTop: '30px', padding: '25px' }}>
                    <h3>Active Videos</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
                        {videos.map((vid) => {
                            const { thumbnailUrl, embedUrl } = getEmbedUrlAndThumbnail(vid.url);
                            return (
                                <div key={vid.id} style={{ borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                                    <div style={{ position: 'relative', height: '160px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setActiveVideo(embedUrl)}>
                                        {thumbnailUrl ? (
                                            <img src={thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                                        ) : (
                                            <div style={{ color: '#fff' }}><i className="fas fa-video fa-2x"></i></div>
                                        )}
                                        <div style={{ position: 'absolute', background: 'rgba(0,0,0,0.6)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                            <i className="fas fa-play" style={{ marginLeft: '4px' }}></i>
                                        </div>
                                    </div>
                                    <div style={{ padding: '15px' }}>
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#0f172a', fontWeight: 'bold' }}>{vid.title}</h4>
                                        <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#64748b', minHeight: '36px' }}>{vid.description}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Order: {vid.position}</span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleEdit(vid)} className="action-btn edit-btn" style={{ padding: '6px 10px', fontSize: '12px' }}>
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button onClick={() => handleDeleteClick(vid.id)} className="action-btn delete-btn" style={{ padding: '6px 10px', fontSize: '12px' }}>
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {activeVideo && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setActiveVideo(null)}>
                    <div style={{ position: 'relative', width: '90%', maxWidth: '800px', aspectRatio: '16/9' }} onClick={e => e.stopPropagation()}>
                        <iframe 
                            src={activeVideo} 
                            style={{ width: '100%', height: '100%', borderRadius: '12px', border: 'none' }} 
                            allowFullScreen
                            title="Video Player"
                        ></iframe>
                        <button onClick={() => setActiveVideo(null)} style={{ position: 'absolute', top: '-40px', right: '0', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>
                            &times;
                        </button>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={confirmOpen}
                title="Delete Video link"
                message="Are you sure you want to remove this video link from your gallery?"
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default VideoGallery;
