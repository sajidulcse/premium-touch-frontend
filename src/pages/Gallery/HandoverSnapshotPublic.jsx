import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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

    const [zoom, setZoom] = useState(1);

    // Lightbox navigation
    const openLightbox = (index) => {
        setLightboxIndex(index);
        setZoom(1);
        document.body.style.overflow = 'hidden';
        document.body.classList.add('lightbox-open');
    };
    const closeLightbox = () => {
        setLightboxIndex(null);
        setZoom(1);
        document.body.style.overflow = 'auto';
        document.body.classList.remove('lightbox-open');
    };

    const handleZoom = (type) => {
        setZoom(prev => type === 'in' ? Math.min(prev + 0.5, 3) : Math.max(prev - 0.5, 1));
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    };

    const showNext = useCallback(() => {
        if (lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev + 1) % snapshots.length);
            setZoom(1);
        }
    }, [lightboxIndex, snapshots.length]);

    const showPrev = useCallback(() => {
        if (lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev - 1 + snapshots.length) % snapshots.length);
            setZoom(1);
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
            return getStorageUrl(`uploads/header/${settings.header_bg}`);
        }
        return null;
    };

    if (loading) {
        return (
            <div className="handover-snapshot-page">
                <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: '#666' }}>Loading Handover Snapshots...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="handover-page-wrapper">
            {/* Hero Section */}
            <section className="hs-hero">
                <div className="hs-hero-bg" style={{ backgroundImage: `url(${getHeaderBgUrl() || '/assets/images/header-bg.jpg'})` }}></div>
                <div className="hs-hero-overlay"></div>
                <div className="hs-hero-content">
                    <span className="hs-hero-subtitle">MILESTONES & CELEBRATIONS</span>
                    <h1 className="hs-hero-title">Handover Snapshots</h1>
                    <div className="gallery-hero-breadcrumb">
                        <Link to="/">Home</Link>
                        <span className="bc-sep">/</span>
                        <span className="current-page">Handover Snapshots</span>
                    </div>
                    <p className="hs-hero-desc">
                        Moments of pride and perfection as we deliver completed architectural & interior dreams.
                    </p>
                    <a href="#snapshots" className="hs-hero-btn">
                        <span>EXPLORE MILESTONES</span>
                        <i className="fas fa-chevron-down"></i>
                    </a>
                </div>
            </section>

            {/* Snapshots Grid */}
            <div id="snapshots" className="handover-container">
                {snapshots.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 24px',
                        background: '#ffffff',
                        borderRadius: '24px',
                        border: '1px dashed #e2e8f0',
                        maxWidth: '500px',
                        margin: '40px auto 0 auto',
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
                            <i className="fas fa-handshake" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: '0 0 8px 0' }}>No Handover Snapshots Yet</h3>
                        <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                            We are currently compiling our milestone moment captures. Please check back soon for updates on our recent property handovers.
                        </p>
                    </div>
                ) : (
                    <div className="handover-grid">
                        {snapshots.map((item, index) => (
                            <div
                                key={item.id}
                                className="handover-card"
                                onClick={() => openLightbox(index)}
                            >
                                <div className="handover-img-wrapper">
                                    <ProgressiveImage
                                        src={getStorageUrl(item.image_path)}
                                        alt={item.title}
                                        className="handover-img"
                                    />
                                </div>
                                <div className="handover-card-content">
                                    {item.project_name && <span className="handover-card-tag">{item.project_name}</span>}
                                    <h4 className="handover-card-title">{item.title}</h4>
                                    <div className="handover-card-meta">
                                        <span className="handover-card-client">
                                            Client: <strong>{item.client || 'N/A'}</strong>
                                        </span>
                                        <span className="handover-card-date">
                                            {item.date ? new Date(item.date).toLocaleDateString('en-US', {
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

            {/* Professional Image Viewer (Lightbox) */}
            {lightboxIndex !== null && snapshots.length > 0 && (
                <div className="pd-viewer-overlay">
                    <div className="viewer-counter">
                        {lightboxIndex + 1} / {snapshots.length}
                    </div>

                    <div className="viewer-actions-top">
                        <button onClick={() => handleZoom('in')} title="Zoom In"><i className="fas fa-search-plus"></i></button>
                        <button onClick={() => handleZoom('out')} title="Zoom Out"><i className="fas fa-search-minus"></i></button>
                        <button onClick={toggleFullScreen} title="Full Screen"><i className="fas fa-expand"></i></button>
                        <button onClick={closeLightbox} className="close-btn" title="Close"><i className="fas fa-times"></i></button>
                    </div>

                    {snapshots.length > 1 && (
                        <button className="nav-arrow prev" onClick={showPrev} title="Previous">
                            <i className="fas fa-chevron-left"></i>
                        </button>
                    )}
                    {snapshots.length > 1 && (
                        <button className="nav-arrow next" onClick={showNext} title="Next">
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    )}

                    <div className="viewer-stage" onClick={(e) => e.target === e.currentTarget && closeLightbox()}>
                        <div className="viewer-img-container" style={{ transform: `scale(${zoom})` }}>
                            <img
                                src={getStorageUrl(snapshots[lightboxIndex].image_path)}
                                alt={snapshots[lightboxIndex].title}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HandoverSnapshotPublic;
