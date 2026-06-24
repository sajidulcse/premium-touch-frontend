import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api, { getStorageUrl, BASE_URL, getSiteInfo, getCategories } from '../../api/axios';
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
    const [catLoading, setCatLoading] = useState(true);

    const [selectedChildCategory, setSelectedChildCategory] = useState(
        (parentSlug && parentSlug !== categorySlug) ? categorySlug : 'all'
    );

    const activeFilter = parentSlug || categorySlug || searchParams.get('category') || 'all';
    const activeArea = searchParams.get('area') || 'all';

    const isMainPortfolioPage = !categorySlug || categorySlug === 'portfolio';

    useEffect(() => {
        if (parentSlug && categorySlug && parentSlug !== categorySlug) {
            setSelectedChildCategory(categorySlug);
        } else {
            setSelectedChildCategory('all');
        }
    }, [parentSlug, categorySlug]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [catsData, siteData] = await Promise.all([
                    getCategories(),
                    getSiteInfo()
                ]);
                setCategories(catsData);
                setSettings(siteData);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            } finally {
                setCatLoading(false);
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

    const resetAllFilters = () => {
        setSearchQuery('');
        if (isMainPortfolioPage) {
            setSearchParams(new URLSearchParams());
        } else {
            navigate('/portfolio');
        }
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

    const categoryPath = findCategoryPath(categorySlug || parentSlug || activeFilter, categories);
    const pageTitle = (activeFilter === 'all' || !categoryPath)
        ? 'Portfolio'
        : `${categoryPath[categoryPath.length - 1].name}`;

    const getHeaderBgUrl = () => {
        if (settings?.header_bg) {
            const root = BASE_URL.replace(/\/api$/, '');
            return `${root}/public/uploads/header/${settings.header_bg}`;
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

    const displayedProjects = filteredProjects.filter(p => {
        if (selectedChildCategory === 'all') return true;
        return p.child_category?.slug === selectedChildCategory || p.childCategory?.slug === selectedChildCategory;
    });



    const portfolioRoot = Array.isArray(categories)
        ? (categories.find(c => c.slug === 'portfolio') || categories.find(c => c.name?.toLowerCase() === 'portfolio'))
        : null;
    const subCategories = portfolioRoot ? (portfolioRoot.children || []) : [];

    const activeSubCategorySlug = parentSlug || categorySlug;
    const currentSubCategory = !isMainPortfolioPage && Array.isArray(subCategories)
        ? subCategories.find(s => s && s.slug === activeSubCategorySlug)
        : null;

    // "Our Core Portfolio" now displays all subcategories under the portfolio root category

    const handleSubFilterChange = (subId, childSlug) => {
        setSubFilters(prev => ({ ...prev, [subId]: childSlug }));
    };

    const isCategoryCheck = () => {
        if (!categorySlug) return true;
        if (categorySlug === 'portfolio') return true;

        const portfolioRoot = Array.isArray(categories)
            ? (categories.find(c => c.slug === 'portfolio') || categories.find(c => c.name?.toLowerCase() === 'portfolio'))
            : null;
        
        if (!portfolioRoot) return false;

        const subCats = portfolioRoot.children || [];

        if (parentSlug) {
            // categorySlug must be a child of parentSlug subcategory
            const parentCat = subCats.find(c => c.slug === parentSlug);
            if (!parentCat || !parentCat.children) return false;
            return parentCat.children.some(c => c.slug === categorySlug);
        } else {
            // categorySlug must be a subcategory (direct child of portfolioRoot)
            return subCats.some(c => c.slug === categorySlug);
        }
    };

    const shouldShowDetailDirectly = 
        !parentSlug && 
        categorySlug && 
        isCategoryCheck() && 
        currentSubCategory && 
        (!currentSubCategory.children || currentSubCategory.children.length === 0) && 
        projects.length === 1;

    if (catLoading) {
        return (
            <div className="loading-state">
                <div className="loader"></div>
                <div className="loader-text">Loading Portfolio...</div>
            </div>
        );
    }

    if (!loading && !isCategoryCheck()) {
        return <PortfolioDetail explicitSlug={categorySlug} />;
    }

    if (!loading && shouldShowDetailDirectly) {
        return <PortfolioDetail explicitSlug={projects[0].slug} />;
    }

    if (loading && !isMainPortfolioPage) {
        return (
            <div className="loading-state">
                <div className="loader"></div>
                <div className="loader-text">Revealing Portfolio...</div>
            </div>
        );
    }

    return (
        <div className="portfolio-page-wrapper">
            {/* Hero Section */}
            <section className="port-hero">
                <div className="port-hero-bg" style={headerStyle}></div>
                <div className="port-hero-overlay"></div>
                <div className="port-hero-content">
                    <span className="port-hero-subtitle">OUR PORTFOLIO</span>
                    <h1 className="port-hero-title">{pageTitle}</h1>
                    <div className="port-hero-breadcrumb">
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
                    <a href="#portfolio-grid" className="port-hero-btn">
                        <span>EXPLORE PORTFOLIO</span>
                        <i className="fas fa-chevron-down"></i>
                    </a>
                </div>
            </section>

            <div id="portfolio-grid" className="port-main-container">
                {isMainPortfolioPage ? (
                    loading ? (
                        <div className="loading-state" style={{ height: '300px', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <div className="loader"></div>
                            <div className="loader-text" style={{ marginTop: '15px', color: '#666', fontSize: '14px' }}>Fetching Portfolio List...</div>
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="port-empty-state" style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            margin: '40px auto'
                        }}>
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 40px',
                                background: '#ffffff',
                                borderRadius: '8px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                                maxWidth: '500px',
                                width: '100%'
                            }}>
                                <div style={{ fontSize: '48px', color: '#c5a880', marginBottom: '20px' }}>
                                    <i className="fas fa-drafting-compass"></i>
                                </div>
                                <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', color: '#1a1a1a', marginBottom: '15px' }}>No Portfolio Found</h2>
                                <p style={{ fontSize: '15px', color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
                                    We couldn't find any portfolio projects matching your selection. Please try another filter or explore all works.
                                </p>
                                <button
                                    onClick={() => navigate('/services')}
                                    style={{
                                        background: '#E85D25',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '14px 28px',
                                        borderRadius: '4px',
                                        fontSize: '13px',
                                        fontFamily: 'inherit',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        cursor: 'pointer',
                                        transition: 'background 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = '#d1501c'}
                                    onMouseLeave={(e) => e.target.style.background = '#E85D25'}
                                >
                                    Explore All Service
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {subCategories.length > 0 && (
                                <div className="port-section-block">
                                    <h2 className="port-section-title">Our Core Portfolio</h2>
                                    <div className="port-premium-grid">
                                        {subCategories.map((sub) => {
                                            // Find a project belonging to this subcategory to use as the thumbnail image
                                            const subProject = Array.isArray(projects)
                                                ? projects.find(p => p && sub && p.sub_category_id === sub.id)
                                                : null;
                                            const imageUrl = subProject?.thumbnail 
                                                ? getStorageUrl(subProject.thumbnail.image_path) 
                                                : subProject?.images?.length > 0 
                                                    ? getStorageUrl(subProject.images[0].image_path) 
                                                    : null;

                                            return (
                                                <Link to={`/portfolio/${sub.slug}`} key={sub.id} className="port-premium-card">
                                                    <div className="port-premium-card-media">
                                                        <LazyImage
                                                            src={imageUrl}
                                                            alt={sub.name}
                                                        />
                                                    </div>
                                                    <div className="port-premium-card-content">
                                                        <h3 className="port-premium-title">{sub.name} <span className="port-premium-arrow">→</span></h3>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 2. Sub Categories Sections */}
                            {Array.isArray(subCategories) && subCategories.map(sub => {
                                if (!sub || !sub.id) return null;
                                // Only show subcategory sections that have child categories
                                if (!sub.children || sub.children.length === 0) return null;
                                const activeChildFilter = subFilters[sub.id] || 'all';
                                const subProjects = Array.isArray(filteredProjects) ? filteredProjects.filter(p => {
                                    if (!p) return false;
                                    if (p.sub_category_id !== sub.id) return false;
                                    if (activeChildFilter !== 'all' && p.child_category?.slug !== activeChildFilter) return false;
                                    return true;
                                }) : [];

                                const totalProjectsInSub = Array.isArray(filteredProjects) ? filteredProjects.filter(p => p && p.sub_category_id === sub.id).length : 0;
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
                                            <div className="port-empty-state" style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                textAlign: 'center',
                                                padding: '60px 40px',
                                                background: '#ffffff',
                                                borderRadius: '8px',
                                                boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                                                maxWidth: '500px',
                                                width: '100%',
                                                margin: '40px auto'
                                            }}>
                                                <div style={{ fontSize: '48px', color: '#c5a880', marginBottom: '20px' }}>
                                                    <i className="fas fa-drafting-compass"></i>
                                                </div>
                                                <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', color: '#1a1a1a', marginBottom: '15px' }}>No Portfolio Found</h2>
                                                <p style={{ fontSize: '15px', color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
                                                    No portfolios available under this selection.
                                                </p>
                                                <button
                                                    onClick={() => handleSubFilterChange(sub.id, 'all')}
                                                    style={{
                                                        background: '#E85D25',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        padding: '14px 28px',
                                                        borderRadius: '4px',
                                                        fontSize: '13px',
                                                        fontFamily: 'inherit',
                                                        fontWeight: '600',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '1px',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.3s ease'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#d1501c'}
                                                    onMouseLeave={(e) => e.target.style.background = '#E85D25'}
                                                >
                                                    Explore All Works
                                                </button>
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
                    )
                ) : (
                    /* Standard Single Grid For Specific Sub/Child Pages */
                    <>
                        {currentSubCategory && currentSubCategory.children && currentSubCategory.children.length > 0 && (filteredProjects.filter(p => p.child_category_id !== null).length > 0 || parentSlug || searchParams.get('area') || loading) && (
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
                            ) : displayedProjects.length === 0 ? (
                                <div className="port-empty-state" style={{
                                    gridColumn: '1 / -1',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: '100%',
                                    margin: '40px auto'
                                }}>
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '60px 40px',
                                        background: '#ffffff',
                                        borderRadius: '8px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                                        maxWidth: '500px',
                                        width: '100%'
                                    }}>
                                        <div style={{ fontSize: '48px', color: '#c5a880', marginBottom: '20px' }}>
                                            <i className="fas fa-drafting-compass"></i>
                                        </div>
                                        <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', color: '#1a1a1a', marginBottom: '15px' }}>No Portfolio Found</h2>
                                        {filteredProjects.length === 0 ? (
                                             <>
                                                 <p style={{ fontSize: '15px', color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
                                                     We couldn't find any portfolio projects matching your selection. Please try exploring our other portfolios instead.
                                                 </p>
                                                 <button
                                                     onClick={() => navigate('/portfolio')}
                                                     style={{
                                                         background: '#E85D25',
                                                         color: '#ffffff',
                                                         border: 'none',
                                                         padding: '14px 28px',
                                                         borderRadius: '4px',
                                                         fontSize: '13px',
                                                         fontFamily: 'inherit',
                                                         fontWeight: '600',
                                                         textTransform: 'uppercase',
                                                         letterSpacing: '1px',
                                                         cursor: 'pointer',
                                                         transition: 'background 0.3s ease'
                                                     }}
                                                     onMouseEnter={(e) => e.target.style.background = '#d1501c'}
                                                     onMouseLeave={(e) => e.target.style.background = '#E85D25'}
                                                 >
                                                     Explore All Portfolio
                                                 </button>
                                             </>
                                         ) : (
                                             <>
                                                 <p style={{ fontSize: '15px', color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
                                                     We couldn't find any portfolio projects matching your selection. Please try another filter or explore all works.
                                                 </p>
                                                 <button
                                                     onClick={() => navigate(parentSlug ? `/portfolio/${parentSlug}` : '/portfolio')}
                                                     style={{
                                                         background: '#E85D25',
                                                         color: '#ffffff',
                                                         border: 'none',
                                                         padding: '14px 28px',
                                                         borderRadius: '4px',
                                                         fontSize: '13px',
                                                         fontFamily: 'inherit',
                                                         fontWeight: '600',
                                                         textTransform: 'uppercase',
                                                         letterSpacing: '1px',
                                                         cursor: 'pointer',
                                                         transition: 'background 0.3s ease'
                                                     }}
                                                     onMouseEnter={(e) => e.target.style.background = '#d1501c'}
                                                     onMouseLeave={(e) => e.target.style.background = '#E85D25'}
                                                 >
                                                     Explore All Works
                                                 </button>
                                             </>
                                         )}
                                    </div>
                                </div>
                            ) : (
                                displayedProjects.map((project) => {
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
