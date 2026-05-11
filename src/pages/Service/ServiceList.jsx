import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api, { getStorageUrl, BASE_URL } from '../../api/axios';
import './Service.css'; // Reusing the project list grid styling

const ServiceList = () => {
    const { categorySlug } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    const activeFilter = categorySlug || searchParams.get('category') || 'all';

    const isMainServicesPage = !categorySlug || categorySlug === 'services';

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [catRes, setRes] = await Promise.all([
                    api.get('/categories'),
                    api.get('/site-info')
                ]);
                setCategories(catRes.data);
                setSettings(setRes.data);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/services?category=${activeFilter}`);
                setServices(res.data);
            } catch (error) {
                console.error("Error fetching services:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, [activeFilter]);

    const handleFilterClick = (slug) => {
        const newParams = new URLSearchParams(searchParams);

        if (isMainServicesPage) {
            if (slug === 'all' || slug === 'services') {
                newParams.delete('category');
            } else {
                newParams.set('category', slug);
            }
            setSearchParams(newParams);
        } else {
            if (slug === 'all' || slug === 'services') {
                navigate('/services');
            } else {
                navigate(`/services/${slug}`);
            }
        }
    };

    // Helper to flatten categories
    const getAllCategories = (cats) => {
        let flat = [];
        cats.forEach(cat => {
            flat.push({ id: cat.id, name: cat.name, slug: cat.slug });
            if (cat.children && cat.children.length > 0) {
                flat = [...flat, ...getAllCategories(cat.children)];
            }
        });
        return flat;
    };

    const serviceCategory = categories.find(c => c.slug === 'services');
    const displayCategories = serviceCategory ? getAllCategories(serviceCategory.children) : [];

    const findCategoryPath = (slug, cats, path = []) => {
        for (const cat of cats) {
            const currentPath = [...path, { name: cat.name, slug: cat.slug }];
            if (cat.slug === slug) return currentPath;

            if (cat.children && cat.children.length > 0) {
                const childPath = findCategoryPath(slug, cat.children, currentPath);
                if (childPath) return childPath;
            }
        }
        return null;
    };

    const categoryPath = findCategoryPath(activeFilter, categories);
    const pageTitle = (activeFilter === 'all' || !categoryPath)
        ? 'Premium Touch Services'
        : `${categoryPath[categoryPath.length - 1].name}`;

    const getHeaderBgUrl = () => {
        if (settings?.project_header_bg) {
            const root = BASE_URL.replace(/\/api$/, '');
            return `${root}/public/uploads/header/${settings.project_header_bg}`;
        }
        return null;
    };

    const headerBgUrl = getHeaderBgUrl();
    const headerStyle = headerBgUrl
        ? { backgroundImage: `url(${headerBgUrl})` }
        : {};

    const showCategoryFilter = isMainServicesPage && displayCategories.length > 0;

    return (
        <div className="projects-page-wrapper">
            <header className="pl-header" style={headerStyle}>
                <div className="pl-header-overlay"></div>
                <div className="pl-header-content">
                    <h1 className="pl-title">{pageTitle}</h1>
                    <div className="pl-header-breadcrumb">
                        <Link to="/">Home</Link>
                        {activeFilter === 'all' ? (
                            <>
                                <span className="bc-sep">/</span>
                                <span className="current-page">Services</span>
                            </>
                        ) : categoryPath ? (
                            categoryPath.map((item, index, path) => (
                                <React.Fragment key={item.slug}>
                                    <span className="bc-sep">/</span>
                                    {index === path.length - 1 ? (
                                        <span className="current-page">{item.name}</span>
                                    ) : (
                                        <Link to={`/services/${item.slug === 'services' ? '' : item.slug}`} className="bc-link-btn">{item.name}</Link>
                                    )}
                                </React.Fragment>
                            ))
                        ) : null}
                    </div>
                </div>
                <div className="pl-header-bg"></div>
            </header>

            <div className="pl-main-container">
                {showCategoryFilter && (
                    <div className="pl-filters-section compact">
                        <div className="pl-filter-row">
                            <div className="pl-filters-inner">
                                <button
                                    className={`pl-filter-item ${activeFilter === 'all' || activeFilter === 'services' ? 'active' : ''}`}
                                    onClick={() => handleFilterClick('all')}
                                >
                                    All Services
                                </button>
                                {displayCategories.map(cat => (
                                    <button
                                        key={cat.id}
                                        className={`pl-filter-item ${activeFilter === cat.slug ? 'active' : ''}`}
                                        onClick={() => handleFilterClick(cat.slug)}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="pl-small-projects-grid">
                    {loading && services.length === 0 ? (
                        <div className="loading-state" style={{ height: '300px', gridColumn: '1 / -1' }}>
                            <div className="loader"></div>
                            <div className="loader-text">Loading Services...</div>
                        </div>
                    ) : services.length === 0 ? (
                        <div className="pl-empty-state">
                            <div className="empty-icon">
                                <i className="fas fa-drafting-compass"></i>
                            </div>
                            <h3>No Services Found</h3>
                            <p>We couldn't find any services matching your selection.</p>
                            <button onClick={() => {
                                handleFilterClick('all');
                            }} className="pl-btn-return">Explore All Services</button>
                        </div>
                    ) : (
                        services.map((service) => (
                            <Link
                                to={`/services/${service.sub_category?.slug || service.id}`}
                                key={service.id}
                                className="pl-small-card"
                            >
                                <div className="pl-small-card-media">
                                    {service.thumbnail ? (
                                        <img src={getStorageUrl(service.thumbnail.image_path)} alt={service.sub_category?.name} loading="lazy" />
                                    ) : service.images?.length > 0 ? (
                                        <img src={getStorageUrl(service.images[0].image_path)} alt={service.sub_category?.name} loading="lazy" />
                                    ) : (
                                        <div className="pl-placeholder">Premium Service</div>
                                    )}

                                    <div className="pl-small-overlay">
                                        <div className="pl-small-overlay-content">
                                            <h3 className="pl-small-title">{service.sub_category?.name || 'Interior Service'}</h3>
                                            <div className="pl-small-footer">
                                                <i className="fas fa-long-arrow-alt-right pl-arrow"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiceList;
