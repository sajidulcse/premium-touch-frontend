import React, { useState, useEffect } from 'react';
import api, { BASE_URL, getSiteInfo } from '../../api/axios';
import './VideoGalleryPublic.css';

const VideoGalleryPublic = () => {
    const [videos, setVideos] = useState([]);
    const [catLoading, setCatLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState(null);
    const [activeVideo, setActiveVideo] = useState(null);

    const defaultVideos = [
        {
            id: 'vid-1',
            title: 'Bespoke Luxury Villa Walkthrough',
            url: 'https://www.youtube.com/watch?v=yYyKrxp5LwY',
            description: 'A cinematic look into our recently completed architectural marvel, detailing marble works and grand scale living.',
            position: 1
        },
        {
            id: 'vid-2',
            title: 'Modern Minimalist Penthouse Tour',
            url: 'https://www.youtube.com/watch?v=52gT3XyO5Z8',
            description: 'Showcasing the custom lighting designs, premium veneers, and neutral tone palettes in our high-end penthouse layout.',
            position: 2
        },
        {
            id: 'vid-3',
            title: 'Premium Contemporary Kitchen & Studio',
            url: 'https://www.youtube.com/watch?v=T_e4u22G9dI',
            description: 'An elegant walkthrough showcasing smart layouts, concealed storage, and integrated appliances.',
            position: 3
        }
    ];

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
        const fetchInitialData = async () => {
            try {
                // Fetch videos from localStorage (populated via admin)
                const saved = localStorage.getItem('premium_touch_videos');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.length > 0) {
                        setVideos(parsed.sort((a, b) => (a.position || 0) - (b.position || 0)));
                    } else {
                        setVideos(defaultVideos);
                    }
                } else {
                    localStorage.setItem('premium_touch_videos', JSON.stringify(defaultVideos));
                    setVideos(defaultVideos);
                }
            } catch (err) {
                console.error("Error loading video gallery:", err);
                setVideos(defaultVideos);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const getEmbedUrlAndThumbnail = (url) => {
        let embedUrl = '';
        let thumbnailUrl = '';
        
        // YouTube Match
        const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (ytMatch && ytMatch[1]) {
            embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
            thumbnailUrl = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
        } else {
            // Vimeo Match
            const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i);
            if (vimeoMatch && vimeoMatch[1]) {
                embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
                thumbnailUrl = `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
            }
        }
        
        return { embedUrl, thumbnailUrl };
    };

    const getHeaderBgUrl = () => {
        if (settings?.header_bg) {
            const root = BASE_URL.replace(/\/api$/, '');
            return `${root}/public/uploads/header/${settings.header_bg}`;
        }
        return null;
    };

    if (catLoading) {
        return (
            <div className="vg-loading-state">
                <div className="vg-loader"></div>
                <div className="vg-loader-text">Loading Video Gallery...</div>
            </div>
        );
    }

    const headerBgUrl = getHeaderBgUrl();
    const headerBgStyle = headerBgUrl ? { backgroundImage: `url(${headerBgUrl})` } : {};

    return (
        <div className="vg-public-wrapper">
            {/* Hero Section */}
            <section className="vg-hero">
                <div className="vg-hero-bg" style={headerBgStyle}></div>
                <div className="vg-hero-overlay"></div>
                <div className="vg-hero-content">
                    <span className="vg-hero-subtitle">MOTION CAPTURES</span>
                    <h1 className="vg-hero-title">Video Gallery</h1>
                    <p className="vg-hero-desc">
                        Bespoke walkthroughs, design details, and cinematic tours of premium residential and commercial spaces.
                    </p>
                    <a href="#videos" className="vg-hero-btn">
                        <span>EXPLORE SHOWCASES</span>
                        <i className="fas fa-chevron-down"></i>
                    </a>
                </div>
            </section>

            {/* Main Content */}
            <div id="videos" className="vg-container">
                {loading ? (
                    <div className="vg-loading-state" style={{ height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <div className="vg-loader"></div>
                        <div className="vg-loader-text" style={{ marginTop: '15px', color: '#666', fontSize: '14px' }}>Loading Video Gallery...</div>
                    </div>
                ) : (
                    <div className="vg-grid">
                        {videos.map((vid) => {
                            const { embedUrl, thumbnailUrl } = getEmbedUrlAndThumbnail(vid.url);
                            return (
                                <div key={vid.id} className="vg-card" onClick={() => setActiveVideo(embedUrl)}>
                                    <div className="vg-media-wrapper">
                                        {thumbnailUrl ? (
                                            <img 
                                                src={thumbnailUrl} 
                                                alt={vid.title} 
                                                className="vg-thumbnail"
                                                onError={(e) => {
                                                    // Handle cases where maxresdefault doesn't exist
                                                    const fallbackYtMatch = vid.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
                                                    if (fallbackYtMatch && fallbackYtMatch[1]) {
                                                        e.target.src = `https://img.youtube.com/vi/${fallbackYtMatch[1]}/0.jpg`;
                                                    } else {
                                                        e.target.src = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80";
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="vg-thumbnail-fallback">
                                                <i className="fas fa-video fa-2x"></i>
                                            </div>
                                        )}
                                        <div className="vg-play-button-overlay">
                                            <div className="vg-play-icon-glow"></div>
                                            <div className="vg-play-icon">
                                                <i className="fas fa-play"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="vg-info">
                                        <h3>{vid.title}</h3>
                                        {vid.description && <p>{vid.description}</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Cinematic Lightbox Modal */}
            {activeVideo && (
                <div className="vg-lightbox-modal" onClick={() => setActiveVideo(null)}>
                    <div className="vg-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="vg-lightbox-close" onClick={() => setActiveVideo(null)} aria-label="Close video player">
                            <i className="fas fa-times"></i>
                        </button>
                        <div className="vg-iframe-container">
                            <iframe 
                                src={activeVideo} 
                                title="Video Player"
                                allow="autoplay; fullscreen; picture-in-picture" 
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoGalleryPublic;
