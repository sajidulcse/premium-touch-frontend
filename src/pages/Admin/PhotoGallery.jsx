import React, { useState, useEffect } from 'react';
import api, { getStorageUrl } from '../../api/axios';
import './Admin.css';

const PhotoGallery = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjectImages = async () => {
            try {
                const res = await api.get('/admin-projects');
                const projectImages = (res.data || []).flatMap(p =>
                    (p.images || []).map(img => ({
                        id: img.id,
                        path: img.image_path,
                        projectName: p.title
                    }))
                );
                setImages(projectImages);
            } catch (err) {
                console.error("Failed to load project gallery:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProjectImages();
    }, []);

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Photo Gallery</h1>
                    <p>View all project images uploaded across your projects.</p>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading photos...</div>
            ) : images.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '2px dashed #e2e8f0',
                    color: '#64748b',
                    marginTop: '20px'
                }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px auto',
                        color: '#cbd5e1',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}>
                        <i className="fas fa-images" style={{ fontSize: '1.5rem' }}></i>
                    </div>
                    <h4 style={{ margin: '0 0 6px 0', color: '#0f172a', fontWeight: 600 }}>No Project Photos Found</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Images uploaded inside your project profiles will show up here automatically.</p>
                </div>
            ) : (
                <div className="admin-card" style={{ padding: '25px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                        {images.map((img) => (
                            <div key={img.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                                <img
                                    src={getStorageUrl(img.path)}
                                    alt={img.projectName}
                                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                                />
                                <div style={{ padding: '12px', background: '#fafafa', borderTop: '1px solid #eee' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '2px' }}>
                                        Project Name
                                    </span>
                                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={img.projectName}>
                                        {img.projectName}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhotoGallery;
