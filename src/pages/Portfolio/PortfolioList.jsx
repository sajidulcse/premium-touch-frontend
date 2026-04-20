import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api, { getStorageUrl, BASE_URL } from '../../api/axios';
import LazyImage from '../../components/LazyImage/LazyImage';
import PortfolioDetail from './PortfolioDetail';
import './Portfolio.css';

const PortfolioList = () => {
    const { parentSlug, categorySlug } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [projects, setProjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [settings, setSettings] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [subFilters, setSubFilters] = useState({});

    const activeFilter = categorySlug || searchParams.get('category') || 'all';
    const activeArea = searchParams.get('area') || 'all';

    const isMainPortfolioPage = !categorySlug || categorySlug === 'portfolio';

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
        const fetchProjects = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/portfolios?category=${activeFilter}&area=${activeArea}`);
                setProjects(res.data);
            } catch (error) {
                console.error("Error fetching portfolio projects:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [activeFilter, activeArea]);

    const handleFilterClick = (slug) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('area');

        if (isMainPortfolioPage) {
            if (slug === 'all' || slug === 'portfolio') {
                newParams.delete('category');
            } else {
                newParams.set('category', slug);
            }
            setSearchParams(newParams);
        } else {
            if (slug === 'all' || slug === 'portfolio') {
                navigate('/portfolio');
            } else {
                navigate(`/portfolio/category/${slug}`); // separate routing pattern just in case
            }
        }
    };

    const handleAreaClick = (range) => {
        const newParams = new URLSearchParams(searchParams);

        if (isMainPortfolioPage) {
            newParams.delete('category');
        }

        if (range === 'all') {
            newParams.delete('area');
        } else {
            newParams.set('area', range);
        }
        setSearchParams(newParams);
    };

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

    // For portfolio, we might just want to list the root categories if there is no distinct 'portfolio' category in the backend
    const displayCategories = categories;

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
        ? 'Portfolio'
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

    const filteredProjects = projects.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (!loading && !isMainPortfolioPage && filteredProjects.length > 0) {
            if (filteredProjects.length === 1) {
                let redirPath = `/portfolio/view/${filteredProjects[0].slug}`;
                if (parentSlug && categorySlug) {
                    redirPath = `/portfolio/${parentSlug}/${categorySlug}/${filteredProjects[0].slug}`;
                }
                navigate(redirPath, { replace: true, state: { initialProject: filteredProjects[0] } });
                return;
            }

            const childProjects = filteredProjects.filter(p => p.child_category_id !== null);
            if (childProjects.length === 0) {
                navigate(`/portfolio/view/${filteredProjects[0].slug}`, { replace: true });
            }
        }
    }, [loading, isMainPortfolioPage, filteredProjects, navigate]);

    const portfolioRoot = categories.find(c => c.slug === 'portfolio') || categories.find(c => c.name?.toLowerCase() === 'portfolio');
    const subCategories = portfolioRoot ? (portfolioRoot.children || []) : [];

    const activeSubCategorySlug = parentSlug || categorySlug;
    const currentSubCategory = !isMainPortfolioPage ? subCategories.find(s => s.slug === activeSubCategorySlug) : null;

    // "Our Core Portfolio" contains items that have NO child category (e.g. generic Residence, Restaurant items)
    const coreProjects = filteredProjects.filter(p => !p.child_category_id);

    const handleSubFilterChange = (subId, childSlug) => {
        setSubFilters(prev => ({ ...prev, [subId]: childSlug }));
    };

    const isCategoryCheck = () => {
        if (!categorySlug) return true;

        const checkTree = (cats) => {
            for (let c of cats) {
                if (c.slug === categorySlug) return true;
                if (c.children && checkTree(c.children)) return true;
            }
            return false;
        };
        return checkTree(categories);
    };

    if (!loading && !isCategoryCheck()) {
        return <PortfolioDetail explicitSlug={categorySlug} />;
    }

    if ((loading || (filteredProjects.length === 1 && !searchQuery)) && !isMainPortfolioPage) {
        return (
            <div className="loading-state">
                <div className="loader"></div>
                <div className="loader-text">Revealing Portfolio...</div>
            </div>
        );
    }

    return (
        <div className="portfolio-page-wrapper">
            <header className="port-header" style={headerStyle}>
                <div className="port-header-overlay"></div>
                <div className="port-header-content">
                    <h1 className="port-title">{pageTitle}</h1>
                    <div className="port-header-breadcrumb">
                        <Link to="/">Home</Link>
                        {activeFilter === 'all' ? (
                            <>
                                <span className="bc-sep">/</span>
                                <span className="current-page">Portfolio</span>
                            </>
                        ) : categoryPath ? (
                            categoryPath.map((item, index, path) => (
                                <React.Fragment key={item.slug}>
                                    <span className="bc-sep">/</span>
                                    {index === path.length - 1 ? (
                                        <span className="current-page">{item.name}</span>
                                    ) : (
                                        <Link
                                            to={
                                                index === 0 ? '/portfolio' :
                                                    index === 1 ? `/portfolio/${item.slug}` :
                                                        `/portfolio/${path[1].slug}/${item.slug}`
                                            }
                                            className="bc-link-btn"
                                        >
                                            {item.name}
                                        </Link>
                                    )}
                                </React.Fragment>
                            ))
                        ) : null}
                    </div>
                </div>
                <div className="port-header-bg"></div>
            </header>

            <div className="port-main-container">
                {isMainPortfolioPage ? (
                    <>
                        {/* 1. Core Portfolio Section */}
                        <div className="port-section-block">
                            <h2 className="port-section-title">Our Core Portfolio</h2>
                            {coreProjects.length > 0 && (
                                <div className="port-premium-grid">
                                    {coreProjects.map((project) => (
                                        <Link to={`/portfolio/${project.sub_category?.slug || project.category?.slug}`} key={project.id} className="port-premium-card">
                                            <div className="port-premium-card-media">
                                                <LazyImage
                                                    src={project.thumbnail ? getStorageUrl(project.thumbnail.image_path) : project.images?.length > 0 ? getStorageUrl(project.images[0].image_path) : '/placeholder-image.jpg'}
                                                    alt={project.title}
                                                />
                                            </div>
                                            <div className="port-premium-card-content">
                                                <h3 className="port-premium-title">{project.title} <span className="port-premium-arrow">→</span></h3>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Sub Categories Sections */}
                        {subCategories.map(sub => {
                            const activeChildFilter = subFilters[sub.id] || 'all';
                            const subProjects = filteredProjects.filter(p => {
                                if (p.sub_category_id !== sub.id) return false;
                                // Exclude items with no child category from sub category sections to avoid recurrence
                                if (!p.child_category_id) return false;
                                if (activeChildFilter !== 'all' && p.child_category?.slug !== activeChildFilter) return false;
                                return true;
                            });

                            const totalProjectsInSub = filteredProjects.filter(p => p.sub_category_id === sub.id && p.child_category_id !== null).length;
                            if (totalProjectsInSub === 0) return null;

                            return (
                                <div key={sub.id} className="port-section-block">
                                    <h2 className="port-section-title">Portfolio Under "{sub.name}"</h2>

                                    {sub.children && sub.children.length > 0 && (
                                        <div className="port-filters-section compact">
                                            <div className="port-filter-row">
                                                <div className="port-filters-inner">
                                                    <button
                                                        className={`port-filter-item ${activeChildFilter === 'all' ? 'active' : ''}`}
                                                        onClick={() => handleSubFilterChange(sub.id, 'all')}
                                                    >
                                                        All
                                                    </button>
                                                    {sub.children.map(child => (
                                                        <button
                                                            key={child.id}
                                                            className={`port-filter-item ${activeChildFilter === child.slug ? 'active' : ''}`}
                                                            onClick={() => handleSubFilterChange(sub.id, child.slug)}
                                                        >
                                                            {child.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {subProjects.length === 0 ? (
                                        <div className="port-empty-state">
                                            <p>No portfolios available under this selection.</p>
                                        </div>
                                    ) : (
                                        <div className="port-premium-grid">
                                            {subProjects.map((project) => {
                                                const url = (project.sub_category?.slug && project.child_category?.slug) 
                                                    ? `/portfolio/${project.sub_category.slug}/${project.child_category.slug}/${project.slug}`
                                                    : `/portfolio/${project.sub_category?.slug || 'view'}/${project.slug}`;
                                                
                                                return (
                                                <Link to={url} key={project.id} className="port-premium-card">
                                                    <div className="port-premium-card-media">
                                                        <LazyImage
                                                            src={project.thumbnail ? getStorageUrl(project.thumbnail.image_path) : project.images?.length > 0 ? getStorageUrl(project.images[0].image_path) : '/placeholder-image.jpg'}
                                                            alt={project.title}
                                                        />
                                                    </div>
                                                    <div className="port-premium-card-content">
                                                        <h3 className="port-premium-title">{project.title} <span className="port-premium-arrow">→</span></h3>
                                                    </div>
                                                </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                ) : (
                    /* Standard Single Grid For Specific Sub/Child Pages */
                    <>
                        {currentSubCategory && currentSubCategory.children && currentSubCategory.children.length > 0 && (
                            <div className="port-filters-section compact" style={{ marginBottom: '40px' }}>
                                <div className="port-filter-row">
                                    <div className="port-filters-inner">
                                        <Link
                                            to={`/portfolio/${currentSubCategory.slug}`}
                                            className={`port-filter-item ${!parentSlug ? 'active' : ''}`}
                                        >
                                            All
                                        </Link>
                                        {currentSubCategory.children.map(child => (
                                            <Link
                                                key={child.id}
                                                to={`/portfolio/${currentSubCategory.slug}/${child.slug}`}
                                                className={`port-filter-item ${categorySlug === child.slug ? 'active' : ''}`}
                                            >
                                                {child.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="port-premium-grid">
                            {loading && projects.length === 0 ? (
                                <div className="loading-state" style={{ height: '300px', gridColumn: '1 / -1' }}>
                                    <div className="loader"></div>
                                    <div className="loader-text">Structuring Visuals...</div>
                                </div>
                            ) : filteredProjects.filter(p => p.child_category_id !== null).length === 0 ? (
                                <div className="port-empty-state">
                                    <div className="empty-icon">
                                        <i className="fas fa-drafting-compass"></i>
                                    </div>
                                    <h3>No Child Portfolio Projects Found</h3>
                                    <button onClick={() => { handleFilterClick('all'); setSearchQuery(''); }} className="port-btn-return">Explore All Works</button>
                                </div>
                            ) : (
                                filteredProjects.filter(p => p.child_category_id !== null).map((project) => {
                                    const url = (project.sub_category?.slug && project.child_category?.slug) 
                                        ? `/portfolio/${project.sub_category.slug}/${project.child_category.slug}/${project.slug}`
                                        : `/portfolio/${project.sub_category?.slug || 'view'}/${project.slug}`;
                                    
                                    return (
                                    <Link to={url} key={project.id} className="port-premium-card">
                                        <div className="port-premium-card-media">
                                            <LazyImage
                                                src={project.thumbnail ? getStorageUrl(project.thumbnail.image_path) : project.images?.length > 0 ? getStorageUrl(project.images[0].image_path) : '/placeholder-image.jpg'}
                                                alt={project.title}
                                            />
                                        </div>
                                        <div className="port-premium-card-content">
                                            <h3 className="port-premium-title">{project.title} <span className="port-premium-arrow">→</span></h3>
                                        </div>
                                    </Link>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </div>
        </div >
    );
};

export default PortfolioList;
