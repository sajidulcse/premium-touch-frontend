import React, { useState, useEffect, useCallback } from 'react';
import api, { getStorageUrl } from '../../api/axios';
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
            className={`${className} progressive-img ${isLoaded ? 'loaded' : 'loading'}`}
            loading="lazy"
        />
    );
};

const PhotoGalleryPublic = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lightboxIndex, setLightboxIndex] = useState(null);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const res = await api.get('/projects?category=all&area=all');
                const projectList = res.data || [];

                // Extract images with metadata
                const extractedImages = projectList.flatMap(project =>
                    (project.images || []).map(img => ({
                        id: img.id,
                        path: img.image_path,
                        projectName: project.title
                    }))
                );

                setImages(extractedImages);
            } catch (err) {
                console.error("Error fetching photo gallery:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchGallery();
    }, []);

    // Lightbox navigation
    const openLightbox = (index) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);

    const showNext = useCallback(() => {
        if (lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev + 1) % images.length);
        }
    }, [lightboxIndex, images.length]);

    const showPrev = useCallback(() => {
        if (lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
        }
    }, [lightboxIndex, images.length]);

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
        <div className="gallery-container">
            <div className="gallery-header">
                <h1>Our Creations</h1>
                <p>Explore high-resolution captures of premium architectural masterpieces and bespoke interior layouts crafted by our studio.</p>
            </div>

            {loading ? (
                <div className="gallery-loader-container">
                    <div className="gallery-loader"></div>
                    <p style={{ color: '#64748b', fontWeight: 600 }}>Loading high-res collection...</p>
                </div>
            ) : (
                <>
                    {/* Image Cards Grid */}
                    {images.length === 0 ? (
                        <div className="gallery-empty-state" style={{
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
                                            className="progressive-img"
                                        />
                                    </div>
                                    <div className="gallery-card-content">
                                        <h3 className="gallery-card-title">{img.projectName}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Immersive Lightbox Modal */}
            {lightboxIndex !== null && images[lightboxIndex] && (
                <div className="lightbox-backdrop" onClick={closeLightbox}>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={closeLightbox}>&times;</button>

                        <button className="lightbox-arrow prev" onClick={showPrev}>
                            <i className="fas fa-chevron-left"></i>
                        </button>

                        <div className="lightbox-image-wrapper">
                            <img
                                src={getStorageUrl(images[lightboxIndex].path)}
                                alt={images[lightboxIndex].projectName}
                                className="lightbox-img"
                            />
                        </div>

                        <button className="lightbox-arrow next" onClick={showNext}>
                            <i className="fas fa-chevron-right"></i>
                        </button>

                        <div className="lightbox-details">
                            <h3>{images[lightboxIndex].projectName}</h3>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhotoGalleryPublic;
