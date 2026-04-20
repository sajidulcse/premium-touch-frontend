import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import api, { getStorageUrl } from '../../api/axios';
import LazyImage from '../../components/LazyImage/LazyImage';
import './Portfolio.css';

const PortfolioDetail = ({ explicitSlug }) => {
    const { slug } = useParams();
    const location = useLocation();
    const projectSlug = explicitSlug || slug;
    
    // Check if we received the full project directly from PortfolioList to skip API fetch waiting!
    const [project, setProject] = useState(location.state?.initialProject || null);
    const [loading, setLoading] = useState(!location.state?.initialProject);
    const [error, setError] = useState(null);

    // Lightbox State
    const [viewerOpen, setViewerOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        if (project && project.slug === projectSlug && location.state?.initialProject) {
            window.scrollTo(0, 0);
            return; // We already have the pre-fetched data, skip loading entirely!
        }

        const fetchProject = async () => {
            try {
                const response = await api.get(`/portfolios/${projectSlug}`);
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
    }, [projectSlug]);

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
            <div className="loader-text">Revealing Portfolio...</div>
        </div>
    );

    if (error || !project) return (
        <div className="error-state" style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2>{error || "Portfolio Item Missing"}</h2>
            <Link to={project?.category ? (project.category.slug === 'portfolio' ? '/portfolio' : `/portfolio/category/${project.category.slug}`) : '/portfolio'} className="back-link">Return to Collections</Link>
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
                                <Link to={project.category.slug === 'portfolio' ? '/portfolio' : `/portfolio/${project.category.slug}`} className="bc-current link">
                                    {project.category.name}
                                </Link>
                            </>
                        )}
                        {project.sub_category && (
                            <>
                                <span className="bc-sep">/</span>
                                <Link to={`/portfolio/${project.sub_category.slug}`} className="bc-current link">
                                    {project.sub_category.name}
                                </Link>
                            </>
                        )}
                        {project.child_category && (
                            <>
                                <span className="bc-sep">/</span>
                                <Link to={`/portfolio/${project.sub_category?.slug || project.category?.slug}/${project.child_category.slug}`} className="bc-current link">
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



            <div className="pd-main-horizontal-content">
                <section className="pf-gallery-container" style={{ paddingTop: '30px', paddingBottom: '20px' }}>
                    <div className="container-inner">
                        <div className="pf-gallery-masonry">
                            {project.images && project.images.length > 0 ? (
                                project.images.map((img, index) => (
                                    <div
                                        key={img.id}
                                        className="pf-masonry-item"
                                        onClick={() => openViewer(index)}
                                    >
                                        <div className="pf-image-inner">
                                            <LazyImage
                                                src={getStorageUrl(img.image_path)}
                                                alt={img.alt_text || `${project.title} perspective ${index + 1}`}
                                                className="img-fluid"
                                            />
                                            <div className="pf-img-hover-overlay">
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

                {project.description && (
                    <section className="pd-vision-container" style={{ paddingBottom: '30px', paddingTop: '0' }}>
                        <div className="container-inner">
                            <div className="pd-vision-content-wrap">
                                <p className="pd-description-text" style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>{project.description}</p>
                            </div>
                        </div>
                    </section>
                )}

                <footer className="pd-footer-nav">
                    <div className="container-inner">
                        <Link to={project?.category ? (project.category.slug === 'portfolio' ? '/portfolio' : `/portfolio/${project.category.slug}`) : '/portfolio'} className="pd-explore-btn-v3">
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
                                alt={project.images[currentIndex].alt_text || `${project.title} perspective ${currentIndex + 1}`}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioDetail;
