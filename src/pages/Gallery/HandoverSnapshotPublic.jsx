import React, { useState, useEffect, useCallback } from 'react';
import api, { getStorageUrl } from '../../api/axios';
import './HandoverSnapshotPublic.css';

// Progressive Image Component for smooth loading
const ProgressiveImage = ({ src, alt, className }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3C/svg%3E"
    );

    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            setCurrentSrc(src);
            setIsLoaded(true);
        };
    }, [src]);

    return (
        <img
            src={currentSrc}
            alt={alt}
            className={`${className} handover-img ${isLoaded ? 'loaded' : 'loading'}`}
            loading="lazy"
        />
    );
};

const HandoverSnapshotPublic = () => {
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lightboxIndex, setLightboxIndex] = useState(null);

    useEffect(() => {
        const fetchSnapshots = async () => {
            try {
                const res = await api.get('/handover-snapshots');
                setSnapshots(res.data || []);
            } catch (err) {
                console.error("Error fetching handover snapshots:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSnapshots();
    }, []);

    // Lightbox navigation
    const openLightbox = (index) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);

    const showNext = useCallback(() => {
        if (lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev + 1) % snapshots.length);
        }
    }, [lightboxIndex, snapshots.length]);

    const showPrev = useCallback(() => {
        if (lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev - 1 + snapshots.length) % snapshots.length);
        }
    }, [lightboxIndex, snapshots.length]);

    // Handle arrow keys & esc key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (lightboxIndex === null) return;
            if (e.key === 'ArrowRight') showNext();
            if (e.key === 'ArrowLeft') showPrev();
            if (e.key === 'Escape') closeLightbox();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, showNext, showPrev]);

    return (
        <div className="handover-container">
            <div className="handover-header">
                <h1>Handover Snapshots</h1>
                <p>Moments of milestone completions and keys handover ceremonies, celebrating client satisfaction and space transformations.</p>
            </div>

            {loading ? (
                <div className="handover-loader-container">
                    <div className="handover-loader"></div>
                    <p style={{ color: '#64748b', fontWeight: 600 }}>Loading milestone moments...</p>
                </div>
            ) : snapshots.length === 0 ? (
                <div className="handover-empty-state" style={{
                    textAlign: 'center',
                    padding: '80px 24px',
                    background: '#ffffff',
                    borderRadius: '24px',
                    border: '1px dashed #e2e8f0',
                    maxWidth: '500px',
                    margin: '40px auto 0 auto',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.01)',
                    animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px auto',
                        color: '#94a3b8'
                    }}>
                        <i className="fas fa-images" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: '0 0 8px 0' }}>No Snapshots Available</h3>
                    <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                        Our handover milestone moments collection is currently empty. Please check back soon as we document and celebrate new client satisfactions and spaces completions.
                    </p>
                </div>
            ) : (
                <div className="handover-grid">
                    {snapshots.map((snap, index) => (
                        <div 
                            key={snap.id} 
                            className="handover-card"
                            onClick={() => openLightbox(index)}
                        >
                            <div className="handover-img-wrapper">
                                <ProgressiveImage
                                    src={getStorageUrl(snap.image_path)}
                                    alt={snap.title}
                                    className="handover-img"
                                />
                            </div>
                            <div className="handover-card-content">
                                <h3 className="handover-card-title">{snap.title}</h3>
                                <div className="handover-card-meta">
                                    <span className="handover-card-client">
                                        Client: <strong>{snap.client}</strong>
                                    </span>
                                    {snap.date && (
                                        <span className="handover-card-date">
                                            {new Date(snap.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Immersive Lightbox Modal */}
            {lightboxIndex !== null && snapshots[lightboxIndex] && (
                <div className="handover-lightbox-backdrop" onClick={closeLightbox}>
                    <div className="handover-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="handover-lightbox-close" onClick={closeLightbox}>&times;</button>
                        
                        <button className="handover-lightbox-arrow prev" onClick={showPrev}>
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        
                        <div className="handover-lightbox-image-wrapper">
                            <img
                                src={getStorageUrl(snapshots[lightboxIndex].image_path)}
                                alt={snapshots[lightboxIndex].title}
                                className="handover-lightbox-img"
                            />
                        </div>

                        <button className="handover-lightbox-arrow next" onClick={showNext}>
                            <i className="fas fa-chevron-right"></i>
                        </button>

                        <div className="handover-lightbox-details">
                            <h3>{snapshots[lightboxIndex].title}</h3>
                            <p>Client: {snapshots[lightboxIndex].client}</p>
                            {snapshots[lightboxIndex].date && (
                                <span>Date: {new Date(snapshots[lightboxIndex].date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HandoverSnapshotPublic;
