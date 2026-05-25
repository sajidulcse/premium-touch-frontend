import React, { useState, useEffect } from 'react';
import api, { getStorageUrl } from '../../api/axios';
import './Admin.css';

const GalleryManager = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllImages = async () => {
            try {
                const [projectsRes, portfoliosRes, servicesRes] = await Promise.all([
                    api.get('/admin-projects'),
                    api.get('/admin-portfolios'),
                    api.get('/admin-services')
                ]);

                const projectImages = (projectsRes.data || []).flatMap(p => 
                    (p.images || []).map(img => ({
                        id: `proj-${img.id}`,
                        path: img.image_path,
                        source: 'Project',
                        sourceTitle: p.title
                    }))
                );

                const portfolioImages = (portfoliosRes.data || []).flatMap(p => 
                    (p.images || []).map(img => ({
                        id: `port-${img.id}`,
                        path: img.image_path,
                        source: 'Portfolio',
                        sourceTitle: p.title
                    }))
                );

                const serviceImages = (servicesRes.data || []).flatMap(s => 
                    (s.images || []).map(img => ({
                        id: `serv-${img.id}`,
                        path: img.image_path,
                        source: 'Service',
                        sourceTitle: s.title || 'Service Title'
                    }))
                );

                setImages([...projectImages, ...portfolioImages, ...serviceImages]);
            } catch (err) {
                console.error("Failed to load gallery images:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllImages();
    }, []);

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Media Gallery</h1>
                    <p>View all media assets uploaded across your Projects, Portfolios, and Services.</p>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading media files...</div>
            ) : images.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>No media uploads found.</div>
            ) : (
                <div className="admin-card" style={{ padding: '25px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                        {images.map((img) => (
                            <div key={img.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}>
                                <img 
                                    src={getStorageUrl(img.path)} 
                                    alt="" 
                                    style={{ width: '100%', height: '160px', objectFit: 'cover' }} 
                                />
                                <div style={{ padding: '12px' }}>
                                    <span className="status-badge published" style={{ fontSize: '10px', padding: '3px 8px', display: 'inline-block', marginBottom: '6px', background: '#e0f2fe', color: '#0369a1', fontWeight: '600' }}>
                                        {img.source}
                                    </span>
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '13px', color: '#1e293b' }} title={img.sourceTitle}>
                                        {img.sourceTitle}
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

export default GalleryManager;
