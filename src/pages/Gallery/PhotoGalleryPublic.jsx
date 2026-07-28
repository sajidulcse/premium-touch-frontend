import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { getStorageUrl, BASE_URL, getSiteInfo } from '../../api/axios';
import './PhotoGalleryPublic.css';

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
            className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
            style={{
                transition: 'filter 0.5s ease, opacity 0.5s ease',
                filter: isLoaded ? 'none' : 'blur(10px)',
                opacity: isLoaded ? 1 : 0.6
            }}
            loading="lazy"
        />
    );
};

const PhotoGalleryPublic = () => {
    const [images, setImages] = useState([]);
    const [catLoading, setCatLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const siteData = await getSiteInfo();
                setSettings(siteData);
            } catch (error) {
                console.error("Error fetching site settings:", error);
            } finally {
                setCatLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const projRes = await api.get('/projects?category=all&area=all');
                const projectList = projRes.data || [];

                // Extract images with metadata
                const extractedImages = projectList.flatMap(project => {
                    const categoryName = (project.child_category || project.childCategory)?.name ||
                                         (project.sub_category || project.subCategory)?.name ||
                                         (project.category)?.name || 
                                         'Interior';
                    return (project.images || []).map(img => ({
                        id: img.id,
                        path: img.image_path,
                        projectName: project.title,
                        categoryName: categoryName
                    }));
                });

                setImages(extractedImages);
            } catch (err) {
                console.error("Error fetching photo gallery:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchGallery();
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
        if (images.length > 0) {
            setLightboxIndex((prev) => (prev + 1) % images.length);
            setZoom(1);
        }
    }, [images.length]);

    const showPrev = useCallback(() => {
        if (images.length > 0) {
            setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
            setZoom(1);
        }
    }, [images.length]);

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
        return '/assets/images/header-bg.jpg';
    };

    if (catLoading) {
        return (
            <div className="pg-loading-state">
                <div className="pg-loader"></div>
                <div className="pg-loader-text">Loading Photo Gallery...</div>
            </div>
        );
    }

    return (
        <div className="pg-public-wrapper">
            {/* Hero Section */}
            <section className="pg-hero">
                <div className="pg-hero-bg" style={{ backgroundImage: `url(${getHeaderBgUrl()})` }}></div>
                <div className="pg-hero-overlay"></div>
                <div className="pg-hero-content">
                    <span className="pg-hero-subtitle">OUR CREATIONS</span>
                    <h1 className="pg-hero-title">Photo Gallery</h1>
                    <div className="gallery-hero-breadcrumb">
                        <Link to="/">Home</Link>
                        <span className="bc-sep">/</span>
                        <span className="current-page">Photo Gallery</span>
                    </div>
                    <p className="pg-hero-desc">
                        Immerse in our curated collection of architectural precision and bespoke interior artistry.
                    </p>
                    <a href="#photos" className="pg-hero-btn">
                        <span>EXPLORE PHOTOGRAPHY</span>
                        <i className="fas fa-chevron-down"></i>
                    </a>
                </div>
            </section>

            <div id="photos" className="gallery-container">
                {/* Image Cards Grid */}
                {loading ? (
                    <div className="gallery-card-skeleton-grid">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div key={n} className="gallery-card-skeleton">
                                <div className="skeleton-img"></div>
                                <div className="skeleton-text-1"></div>
                                <div className="skeleton-text-2"></div>
                            </div>
                        ))}
                    </div>
                ) : images.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 24px',
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
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: '0 0 8px 0' }}>No Showcase Photos Available</h3>
                                <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                                    Our creations photo gallery is currently empty. Please check back soon as we curate and publish captures of our masterpieces and bespoke interior layouts.
                                </p>
                            </div>
                        ) : (
                            <div className="gallery-grid">
                                {images.map((img, index) => (
                                    <div
                                        key={img.id}
                                        className="gallery-card"
                                        onClick={() => openLightbox(index)}
                                    >
                                        <div className="progressive-img-wrapper">
                                            <ProgressiveImage
                                                src={getStorageUrl(img.path)}
                                                alt={img.projectName}
                                                className="gallery-img"
                                            />
                                        </div>
                                        <div className="gallery-card-content">
                                            <span className="gallery-card-tag">{img.categoryName}</span>
                                            <h4 className="gallery-card-title">{img.projectName}</h4>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
            </div>

            {/* Professional Image Viewer (Lightbox) */}
            {lightboxIndex !== null && images.length > 0 && (
                <div className="pd-viewer-overlay">
                    <div className="viewer-counter">
                        {lightboxIndex + 1} / {images.length}
                    </div>

                    <div className="viewer-actions-top">
                        <button onClick={() => handleZoom('in')} title="Zoom In"><i className="fas fa-search-plus"></i></button>
                        <button onClick={() => handleZoom('out')} title="Zoom Out"><i className="fas fa-search-minus"></i></button>
                        <button onClick={toggleFullScreen} title="Full Screen"><i className="fas fa-expand"></i></button>
                        <button onClick={closeLightbox} className="close-btn" title="Close"><i className="fas fa-times"></i></button>
                    </div>

                    {images.length > 1 && (
                        <button className="nav-arrow prev" onClick={showPrev} title="Previous">
                            <i className="fas fa-chevron-left"></i>
                        </button>
                    )}
                    {images.length > 1 && (
                        <button className="nav-arrow next" onClick={showNext} title="Next">
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    )}

                    <div className="viewer-stage" onClick={(e) => e.target === e.currentTarget && closeLightbox()}>
                        <div className="viewer-img-container" style={{ transform: `scale(${zoom})` }}>
                            <img
                                src={getStorageUrl(images[lightboxIndex].path)}
                                alt={images[lightboxIndex].projectName}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhotoGalleryPublic;
