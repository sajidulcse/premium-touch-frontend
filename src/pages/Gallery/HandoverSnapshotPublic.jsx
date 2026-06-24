import React, { useState, useEffect, useCallback } from 'react';
import api, { getStorageUrl, BASE_URL, getSiteInfo } from '../../api/axios';
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
    const [catLoading, setCatLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const siteData = await getSiteInfo();
                setSettings(siteData);
            } catch (error) {
                console.error("Error loading site settings:", error);
            } finally {
                setCatLoading(false);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const fetchSnapshots = async () => {
            try {
                const snapRes = await api.get('/handover-snapshots');
                setSnapshots(snapRes.data || []);
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

    const getHeaderBgUrl = () => {
        if (settings?.header_bg) {
            const root = BASE_URL.replace(/\/api$/, '');
            return `${root}/public/uploads/header/${settings.header_bg}`;
        }
        return null;
    };

    const headerBgUrl = getHeaderBgUrl();
    const headerBgStyle = headerBgUrl ? { backgroundImage: `url(${headerBgUrl})` } : {};

    if (catLoading) {
        return (
            <div className="hs-loading-state">
                <div className="hs-loader"></div>
                <div className="hs-loader-text">Loading Handover Snapshots...</div>
            </div>
        );
    }

    return (
        <div className="handover-page-wrapper">
            {/* Hero Section */}
            <section className="hs-hero">
                <div className="hs-hero-bg" style={headerBgStyle}></div>
                <div className="hs-hero-overlay"></div>
                <div className="hs-hero-content">
                    <span className="hs-hero-subtitle">MILESTONES & CELEBRATIONS</span>
                    <h1 className="hs-hero-title">Handover Snapshots</h1>
                    <p className="hs-hero-desc">
                        Moments of milestone completions and keys handover ceremonies, celebrating client satisfaction and space transformations.
                    </p>
                    <a href="#snapshots" className="hs-hero-btn">
                        <span>EXPLORE MILESTONES</span>
                        <i className="fas fa-chevron-down"></i>
                    </a>
                </div>
            </section>

            <div id="snapshots" className="handover-container">
                {loading ? (
                    <div className="hs-loading-state" style={{ height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <div className="hs-loader"></div>
                        <div className="hs-loader-text" style={{ marginTop: '15px', color: '#666', fontSize: '14px' }}>Loading Handover Snapshots...</div>
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
                            <i className="fas fa-camera" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: '0 0 8px 0' }}>No Handover Snapshots</h3>
                        <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                            We haven't uploaded handover ceremony photos yet. Please check back soon to celebrate with our satisfied clients!
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
                                    />
                                </div>
                                <div className="handover-card-content">
                                    {snap.project_name && <span className="handover-card-tag">{snap.project_name}</span>}
                                    <h4 className="handover-card-title">{snap.title}</h4>
                                    <div className="handover-card-meta">
                                        <span className="handover-card-client">
                                            Client: <strong>{snap.client || 'N/A'}</strong>
                                        </span>
                                        <span className="handover-card-date">
                                            {snap.date ? new Date(snap.date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long'
                                            }) : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            {lightboxIndex !== null && (
                <div
                    className="handover-lightbox-backdrop"
                    onClick={closeLightbox}
                >
                    <div
                        className="handover-lightbox-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="handover-lightbox-close"
                            onClick={closeLightbox}
                            aria-label="Close lightbox"
                        >
                            &times;
                        </button>

                        {snapshots.length > 1 && (
                            <button
                                className="handover-lightbox-arrow prev"
                                onClick={showPrev}
                                aria-label="Previous image"
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>
                        )}

                        <div className="handover-lightbox-image-wrapper">
                            <img
                                src={getStorageUrl(snapshots[lightboxIndex].image_path)}
                                alt={snapshots[lightboxIndex].title}
                                className="handover-lightbox-img"
                            />
                        </div>

                        <div className="handover-lightbox-details">
                            <h3>{snapshots[lightboxIndex].title}</h3>
                            {snapshots[lightboxIndex].project_name && <p>Project: {snapshots[lightboxIndex].project_name}</p>}
                            {snapshots[lightboxIndex].client && (
                                <p>Client: {snapshots[lightboxIndex].client}</p>
                            )}
                            {snapshots[lightboxIndex].date && (
                                <span>
                                    Handover Date:{' '}
                                    {new Date(snapshots[lightboxIndex].date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            )}
                        </div>

                        {snapshots.length > 1 && (
                            <button
                                className="handover-lightbox-arrow next"
                                onClick={showNext}
                                aria-label="Next image"
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HandoverSnapshotPublic;
