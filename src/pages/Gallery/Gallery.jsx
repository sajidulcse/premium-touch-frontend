import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getStorageUrl, BASE_URL } from '../../api/axios';
import './Gallery.css';

const Gallery = () => {
    const [loading, setLoading] = useState(true);
    const [featuredProjects, setFeaturedProjects] = useState([]);
    const [settings, setSettings] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [handoverPreview, setHandoverPreview] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projRes, handRes, siteRes] = await Promise.all([
                    api.get('/projects?category=all&area=all'),
                    api.get('/handover-snapshots'),
                    api.get('/site-info')
                ]);

                // 1. Featured projects list (first 6 with images)
                const allProjects = projRes.data || [];
                const withImages = allProjects.filter(p => p.images && p.images.length > 0);
                setFeaturedProjects(withImages.slice(0, 6));

                // 2. Photo gallery preview image: Pick first image path from all project images
                const allExtractedImages = allProjects.flatMap(project =>
                    (project.images || []).map(img => img.image_path)
                );
                if (allExtractedImages.length > 0) {
                    setPhotoPreview(getStorageUrl(allExtractedImages[0]));
                } else {
                    setPhotoPreview("https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80");
                }

                // 3. Handover snapshot preview image: Pick first image from snapshots
                const snapshots = handRes.data || [];
                if (snapshots.length > 0 && snapshots[0].image_path) {
                    setHandoverPreview(getStorageUrl(snapshots[0].image_path));
                } else {
                    setHandoverPreview("https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80");
                }

                // 4. Site Settings
                setSettings(siteRes.data);

                // 5. Video Preview
                let vidPrev = null;
                const savedVideos = localStorage.getItem('premium_touch_videos');
                if (savedVideos) {
                    try {
                        const list = JSON.parse(savedVideos);
                        if (list.length > 0) {
                            const firstUrl = list[0].url;
                            const ytMatch = firstUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
                            if (ytMatch && ytMatch[1]) {
                                vidPrev = `https://img.youtube.com/vi/${ytMatch[1]}/0.jpg`;
                            } else {
                                const vimeoMatch = firstUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i);
                                if (vimeoMatch && vimeoMatch[1]) {
                                    vidPrev = `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing videos from local storage", e);
                    }
                }
                setVideoPreview(vidPrev || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80");

            } catch (err) {
                console.error("Error loading gallery landing data:", err);
            } finally {
                // Keep the Loading Gallery loader active for a subtle beat to guarantee visual feedback
                setTimeout(() => {
                    setLoading(false);
                }, 800);
            }
        };

        fetchData();
    }, []);

    const getHeaderBgUrl = () => {
        if (settings?.header_bg) {
            const root = BASE_URL.replace(/\/api$/, '');
            return `${root}/public/uploads/header/${settings.header_bg}`;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="loading-state">
                <div className="loader"></div>
                <div className="loader-text">Loading Gallery...</div>
            </div>
        );
    }

    const headerBgUrl = getHeaderBgUrl();
    const heroBgStyle = headerBgUrl ? { backgroundImage: `url(${headerBgUrl})` } : {};

    return (
        <div className="gallery-landing-wrapper">
            {/* Hero Section */}
            <section className="gl-hero">
                <div className="gl-hero-bg" style={heroBgStyle}></div>
                <div className="gl-hero-overlay"></div>
                <div className="gl-hero-content">
                    <span className="gl-hero-subtitle">CURATED VISUAL NARRATIVES</span>
                    <h1 className="gl-hero-title">Where Space <br />Meets Artistry</h1>
                    <p className="gl-hero-desc">
                        Explore our design collections, motion captures, and real-life handover moments that define contemporary living.
                    </p>
                    <a href="#categories" className="gl-hero-btn">
                        <span>EXPLORE COLLECTIONS</span>
                        <i className="fas fa-chevron-down"></i>
                    </a>
                </div>
            </section>

            {/* Categories Section */}
            <section id="categories" className="gl-categories-section">
                <div className="gl-container">
                    <div className="gl-section-header">
                        <span className="gl-section-subtitle">OUR ARCHIVES</span>
                        <h2 className="gl-section-title">Explore Gallery Categories</h2>
                        <div className="gl-section-line"></div>
                    </div>

                    <div className="gl-categories-grid">
                        {/* Card 1: Photo Gallery */}
                        <div className="gl-category-card">
                            <Link to="/photo-gallery" className="gl-card-link-wrapper">
                                <div className="gl-card-image-wrap">
                                    <img
                                        src={photoPreview || "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80"}
                                        alt="Photo Gallery Preview"
                                        className="gl-card-image"
                                    />
                                    <div className="gl-card-overlay"></div>
                                </div>
                            </Link>
                            <div className="gl-card-content">
                                <Link to="/photo-gallery" className="gl-card-title-link">
                                    <h3 className="gl-card-title">Photo Gallery</h3>
                                </Link>
                                <p className="gl-card-desc">Curated high-resolution perspectives of our finest interior designs and layouts.</p>
                                <Link to="/photo-gallery" className="gl-card-btn">
                                    <span>VIEW PHOTOS</span>
                                    <i className="fas fa-arrow-right"></i>
                                </Link>
                            </div>
                        </div>

                        {/* Card 2: Video Gallery */}
                        <div className="gl-category-card">
                            <Link to="/video-gallery" className="gl-card-link-wrapper">
                                <div className="gl-card-image-wrap">
                                    <img
                                        src={videoPreview || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"}
                                        alt="Video Gallery Preview"
                                        className="gl-card-image"
                                    />
                                    <div className="gl-card-overlay"></div>
                                </div>
                            </Link>
                            <div className="gl-card-content">
                                <Link to="/video-gallery" className="gl-card-title-link">
                                    <h3 className="gl-card-title">Video Gallery</h3>
                                </Link>
                                <p className="gl-card-desc">Cinematic architectural walkthroughs detailing materials, textures, and scales.</p>
                                <Link to="/video-gallery" className="gl-card-btn">
                                    <span>WATCH VIDEOS</span>
                                    <i className="fas fa-play"></i>
                                </Link>
                            </div>
                        </div>

                        {/* Card 3: Handover Snapshot */}
                        <div className="gl-category-card">
                            <Link to="/handover-snapshot" className="gl-card-link-wrapper">
                                <div className="gl-card-image-wrap">
                                    <img
                                        src={handoverPreview || "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80"}
                                        alt="Handover Snapshot Preview"
                                        className="gl-card-image"
                                    />
                                    <div className="gl-card-overlay"></div>
                                </div>
                            </Link>
                            <div className="gl-card-content">
                                <Link to="/handover-snapshot" className="gl-card-title-link">
                                    <h3 className="gl-card-title">Handover Snapshot</h3>
                                </Link>
                                <p className="gl-card-desc">Authentic raw snapshots capturing the keys handover and completed project milestones.</p>
                                <Link to="/handover-snapshot" className="gl-card-btn">
                                    <span>VIEW SNAPSHOTS</span>
                                    <i className="fas fa-key"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Projects Grid */}
            {featuredProjects.length > 0 && (
                <section className="gl-featured-section">
                    <div className="gl-container">
                        <div className="gl-section-header">
                            <span className="gl-section-subtitle">VISUAL HIGHLIGHTS</span>
                            <h2 className="gl-section-title">Featured Project Perspectives</h2>
                            <div className="gl-section-line"></div>
                        </div>

                        <div className="gl-featured-grid">
                            {featuredProjects.map(proj => (
                                <div key={proj.id} className="gl-featured-item">
                                    <div className="gl-featured-media">
                                        <img
                                            src={getStorageUrl(proj.images[0].image_path)}
                                            alt={proj.title}
                                            loading="lazy"
                                        />
                                        <div className="gl-featured-overlay">
                                            <div className="gl-featured-overlay-content">
                                                <h4>{proj.title}</h4>
                                                <p>{proj.sub_category?.name || proj.category?.name || 'Architectural Design'}</p>
                                                <Link to={`/projects/${proj.slug}`} className="gl-featured-link">
                                                    <span>View Detail</span>
                                                    <i className="fas fa-long-arrow-alt-right"></i>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

        </div>
    );
};

export default Gallery;
