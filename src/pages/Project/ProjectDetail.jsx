import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getStorageUrl } from '../../api/axios';
import './Project.css';

const ProjectDetail = () => {
    const { slug } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Lightbox State
    const [viewerOpen, setViewerOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await api.get(`/projects/${slug}`);
                setProject(response.data);
            } catch (err) {
                console.error("Error fetching project:", err);
                setError("Project not found");
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
        window.scrollTo(0, 0);
    }, [slug]);

    const openViewer = (index) => {
        setCurrentIndex(index);
        setViewerOpen(true);
        setZoom(1);
        document.body.style.overflow = 'hidden';
    };

    const closeViewer = () => {
        setViewerOpen(false);
        document.body.style.overflow = 'auto';
    };

    const nextImage = useCallback(() => {
        if (!project?.images) return;
        setCurrentIndex((prev) => (prev + 1) % project.images.length);
        setZoom(1);
    }, [project]);

    const prevImage = useCallback(() => {
        if (!project?.images) return;
        setCurrentIndex((prev) => (prev - 1 + project.images.length) % project.images.length);
        setZoom(1);
    }, [project]);

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

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!viewerOpen) return;
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'Escape') closeViewer();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewerOpen, nextImage, prevImage]);

    if (loading) return (
        <div className="loading-state">
            <div className="loader"></div>
            <div className="loader-text">Revealing Project...</div>
        </div>
    );

    if (error || !project) return (
        <div className="error-state" style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2>{error || "Project Missing"}</h2>
            <Link to={project?.category ? (project.category.slug === 'projects' ? '/projects' : `/${project.category.slug}`) : '/projects'} className="back-link">Return to Collections</Link>
        </div>
    );

    const fullHierarchy = [
        project.category?.name,
        project.sub_category?.name,
        project.child_category?.name
    ].filter(Boolean).join(' \u2022 ');

    return (
        <div className="project-detail-page">
            {/* Restored Hero Section */}
            <div className="pd-hero">
                <div className="pd-hero-overlay"></div>
                <img
                    src={getStorageUrl(project.thumbnail?.image_path || project.images[0]?.image_path)}
                    alt={project.title}
                    className="pd-hero-img"
                />
                <div className="pd-hero-content">
                    <div className="pd-breadcrumb">
                        <Link to="/">Home</Link>
                        {project.category && (
                            <>
                                <span className="bc-sep">/</span>
                                <Link to={project.category.slug === 'projects' ? '/projects' : `/${project.category.slug}`} className="bc-current link">
                                    {project.category.name}
                                </Link>
                            </>
                        )}
                        {project.sub_category && (
                            <>
                                <span className="bc-sep">/</span>
                                <Link to={`/${project.sub_category.slug}`} className="bc-current link">
                                    {project.sub_category.name}
                                </Link>
                            </>
                        )}
                        {project.child_category && (
                            <>
                                <span className="bc-sep">/</span>
                                <Link to={`/${project.child_category.slug}`} className="bc-current link">
                                    {project.child_category.name}
                                </Link>
                            </>
                        )}
                        <span className="bc-sep highlight">//</span>
                        <span className="bc-current title">{project.title}</span>
                    </div>
                    <h1 className="pd-title-main">{project.title}</h1>
                </div>
            </div>

            {/* Compact Highlighted Specs Bar */}
            <div className="pd-specs-compact-wrapper">
                <div className="pd-specs-bar-compact">
                    <div className="bar-item">
                        <i className="fas fa-user-tie highlight-icon"></i>
                        <div className="bar-text">
                            <label>Client</label>
                            <span>{project.client_name || 'Private Client'}</span>
                        </div>
                    </div>
                    <div className="bar-item">
                        <i className="fas fa-map-marker-alt highlight-icon"></i>
                        <div className="bar-text">
                            <label>Location</label>
                            <span>{project.location || 'Undisclosed'}</span>
                        </div>
                    </div>
                    <div className="bar-item">
                        <i className="fas fa-calendar-alt highlight-icon"></i>
                        <div className="bar-text">
                            <label>Year</label>
                            <span>{project.completion_date ? new Date(project.completion_date).getFullYear() : '2024'}</span>
                        </div>
                    </div>
                    {project.floor_area && (
                        <div className="bar-item">
                            <i className="fas fa-ruler-combined highlight-icon"></i>
                            <div className="bar-text">
                                <label>Area</label>
                                <span>{project.floor_area}</span>
                            </div>
                        </div>
                    )}
                    {project.duration && (
                        <div className="bar-item">
                            <i className="fas fa-clock highlight-icon"></i>
                            <div className="bar-text">
                                <label>Duration</label>
                                <span>{project.duration}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="pd-main-horizontal-content">
                {/* Clean Narrative Section */}
                <section className="pd-vision-container">
                    <div className="container-inner">
                        <div className="pd-vision-grid">
                            <div className="pd-vision-title-wrap">
                                <span className="pd-section-label">01 / Process</span>
                                <h2 className="pd-section-title">The Design Narrative</h2>
                            </div>
                            <div className="pd-vision-content-wrap">
                                <p className="pd-description-text">{project.description}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Visual Story Section */}
                <section className="pd-gallery-container">
                    <div className="container-inner">
                        <div className="pd-gallery-header">
                            <span className="pd-section-label">02 / Portfolio</span>
                            <h2 className="pd-section-title">Visual Story</h2>
                        </div>

                        <div className="pd-gallery-masonry">
                            {project.images && project.images.length > 0 ? (
                                project.images.map((img, index) => (
                                    <div
                                        key={img.id}
                                        className="pd-masonry-item"
                                        onClick={() => openViewer(index)}
                                    >
                                        <div className="pd-image-inner">
                                            <img src={getStorageUrl(img.image_path)} alt={`${project.title} ${index}`} loading="lazy" />
                                            <div className="pd-img-hover-overlay">
                                                <i className="fas fa-expand-arrows-alt"></i>
                                                <span>View Detail</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-images">Gallery in progress...</div>
                            )}
                        </div>
                    </div>
                </section>

                <footer className="pd-footer-nav">
                    <div className="container-inner">
                        <Link to={project?.category ? (project.category.slug === 'projects' ? '/projects' : `/${project.category.slug}`) : '/projects'} className="pd-explore-btn-v3">
                            <span>Continue the Journey</span>
                            <i className="fas fa-long-arrow-alt-right"></i>
                        </Link>
                    </div>
                </footer>
            </div>

            {/* Professional Image Viewer (Lightbox) */}
            {viewerOpen && project.images && (
                <div className="pd-viewer-overlay">
                    {/* Top Left: Counter */}
                    <div className="viewer-counter">
                        {currentIndex + 1} / {project.images.length}
                    </div>

                    {/* Top Right: Actions */}
                    <div className="viewer-actions-top">
                        <button onClick={() => handleZoom('in')} title="Zoom In"><i className="fas fa-search-plus"></i></button>
                        <button onClick={() => handleZoom('out')} title="Zoom Out"><i className="fas fa-search-minus"></i></button>
                        <button onClick={toggleFullScreen} title="Full Screen"><i className="fas fa-expand"></i></button>
                        <button onClick={() => {/* Share logic */ }} title="Share"><i className="fas fa-share-alt"></i></button>
                        <button onClick={closeViewer} className="close-btn" title="Close"><i className="fas fa-times"></i></button>
                    </div>

                    {/* Navigation Arrows */}
                    <button className="nav-arrow prev" onClick={prevImage}>
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <button className="nav-arrow next" onClick={nextImage}>
                        <i className="fas fa-chevron-right"></i>
                    </button>

                    {/* Image Stage */}
                    <div className="viewer-stage" onClick={(e) => e.target === e.currentTarget && closeViewer()}>
                        <div className="viewer-img-container" style={{ transform: `scale(${zoom})` }}>
                            <img
                                src={getStorageUrl(project.images[currentIndex].image_path)}
                                alt={`Gallery ${currentIndex}`}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetail;
