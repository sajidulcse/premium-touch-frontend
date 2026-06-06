import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BASE_URL, getCategories, getSiteInfo } from '../../api/axios';
import './AboutUs.css';

const AboutLayout = () => {
    const [subCategories, setSubCategories] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    // Default fallback tabs if API fails
    const defaultTabs = [
        { name: 'Overview', slug: 'about-overview' },
        { name: 'Our Team', slug: 'about-our-team' },
        { name: 'Career', slug: 'about-career' }
    ];

    useEffect(() => {
        const fetchLayoutData = async () => {
            try {
                // Fetch site info and categories concurrently
                const [siteData, categoriesData] = await Promise.all([
                    getSiteInfo(),
                    getCategories()
                ]);

                setSettings(siteData);

                // Find About Us category and extract its children
                const aboutCategory = categoriesData.find(
                    cat => cat.slug === 'about-us' || cat.name?.toLowerCase() === 'about us'
                );

                if (aboutCategory && aboutCategory.children && aboutCategory.children.length > 0) {
                    // Sort children by position
                    const sortedChildren = [...aboutCategory.children].sort(
                        (a, b) => (a.position || 0) - (b.position || 0)
                    );
                    setSubCategories(sortedChildren);
                } else {
                    setSubCategories(defaultTabs);
                }
            } catch (err) {
                console.error("Error loading About Layout details:", err);
                setSubCategories(defaultTabs);
            } finally {
                setLoading(false);
            }
        };

        fetchLayoutData();
    }, []);

    const getHeaderBgUrl = () => {
        if (settings?.header_bg) {
            const root = BASE_URL.replace(/\/api$/, '');
            return `${root}/public/uploads/header/${settings.header_bg}`;
        }
        return null;
    };

    const headerBgUrl = getHeaderBgUrl();
    const headerStyle = headerBgUrl ? { backgroundImage: `url(${headerBgUrl})` } : {};

    // Determine currently active subcategory slug from path
    const pathParts = location.pathname.split('/');
    const currentActiveSlug = pathParts[pathParts.length - 1] === 'about-us' 
        ? (subCategories[0]?.slug || 'about-overview') 
        : pathParts[pathParts.length - 1];

    const activeSubCat = subCategories.find(sub => sub.slug === currentActiveSlug);

    // Handle mobile dropdown tab changes
    const handleMobileTabChange = (e) => {
        const selectedSlug = e.target.value;
        if (selectedSlug === 'about-overview') {
            navigate('/about-us');
        } else {
            navigate(`/about-us/${selectedSlug}`);
        }
    };

    if (loading) {
        return (
            <div className="about-loading-wrapper">
                <div className="about-loader"></div>
                <p>Loading About Us...</p>
            </div>
        );
    }

    return (
        <div className="about-layout-wrapper">
            {/* Hero Header Section */}
            <section className="about-hero">
                <div className="about-hero-bg" style={headerStyle}></div>
                <div className="about-hero-overlay"></div>
                <div className="about-hero-content">
                    <span className="about-hero-subtitle">OUR STORIES</span>
                    <h1 className="about-hero-title">About Us</h1>
                    <div className="about-hero-breadcrumb">
                        <Link to="/">Home</Link>
                        <span className="bc-sep">/</span>
                        {activeSubCat && activeSubCat.slug !== 'about-overview' && activeSubCat.slug !== 'overview' ? (
                            <>
                                <Link to="/about-us" className="bc-link-btn">About Us</Link>
                                <span className="bc-sep">/</span>
                                <span className="current-page">{activeSubCat.name}</span>
                            </>
                        ) : (
                            <span className="current-page">About Us</span>
                        )}
                    </div>
                    <p className="about-hero-desc">
                        Discover the philosophy, creative minds, and career milestones that drive our boutique design studio.
                    </p>
                    <a href="#about-content" className="about-hero-btn">
                        <span>EXPLORE ABOUT</span>
                        <i className="fas fa-chevron-down"></i>
                    </a>
                </div>
            </section>

            {/* Dynamic Tab Navigation */}
            <div id="about-content" className="about-tabs-container">
                <div className="about-tabs-inner">
                    <div className="about-tabs-list">
                        {subCategories.map((sub, index) => {
                            // First child category is the index route
                            const isIndex = index === 0;
                            const path = isIndex ? '/about-us' : `/about-us/${sub.slug}`;
                            
                            return (
                                <NavLink 
                                    key={sub.slug}
                                    to={path}
                                    end={isIndex}
                                    className={({ isActive }) => 
                                        `about-tab-btn ${isActive || (isIndex && currentActiveSlug === sub.slug) ? 'active' : ''}`
                                    }
                                >
                                    {sub.name}
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Subpage Outlet rendering child routes */}
            <main className="about-outlet-container">
                <div className="about-outlet-inner">
                    <Outlet context={{ settings }} />
                </div>
            </main>
        </div>
    );
};

export default AboutLayout;
