import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api, { getStorageUrl, BASE_URL, getSiteInfo, getCategories } from '../../api/axios';
import ProjectDetail from './ProjectDetail';
import './Project.css';

const ProjectList = () => {
    const { parentSlug, categorySlug } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [projects, setProjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [catLoading, setCatLoading] = useState(true);

    const [selectedChildCategory, setSelectedChildCategory] = useState(
        (parentSlug && parentSlug !== categorySlug) ? categorySlug : 'all'
    );

    // Get filters from searchParams or URL Params
    const activeFilter = parentSlug || categorySlug || searchParams.get('category') || 'all';
    const activeChildFilter = searchParams.get('category') || 'all';
    const activeArea = searchParams.get('area') || 'all';

    const isMainProjectsPage = !categorySlug || categorySlug === 'projects';
    const isResidentialPage = (parentSlug || categorySlug) === 'residential';

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
                const targetCat = activeFilter && activeFilter !== 'projects' ? activeFilter : 'all';
                const res = await api.get(`/projects?category=${targetCat}&area=all`);
                setProjects(res.data);
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [activeFilter]);

    const isResidentialOrChild = (slug) => {
        if (!slug) return false;
        if (slug === 'residential') return true;
        const resCat = categories.find(c => c.slug === 'residential');
        if (resCat && resCat.children) {
            return resCat.children.some(child => child.slug === slug);
        }
        return false;
    };

    const handleFilterClick = (slug) => {
        const newParams = new URLSearchParams(searchParams);

        if (slug === 'all' || slug === 'projects' || slug === categorySlug) {
            newParams.delete('category');
            newParams.delete('area');
        } else {
            newParams.set('category', slug);
            if (!isResidentialOrChild(slug)) {
                newParams.delete('area');
            }
        }
        setSearchParams(newParams);
    };

    const handleAreaClick = (range) => {
        const newParams = new URLSearchParams(searchParams);

        if (range === 'all') {
            newParams.delete('area');
        } else {
            newParams.set('area', range);
        }
        setSearchParams(newParams);
    };

    const resetAllFilters = () => {
        if (isMainProjectsPage) {
            setSearchParams(new URLSearchParams());
        } else {
            navigate('/projects');
        }
    };

    // Helper to find a category node in the tree
    const findCategoryNode = (slug, cats) => {
        if (!slug || !cats) return null;
        for (const cat of cats) {
            if (cat.slug === slug) return cat;
            if (cat.children && cat.children.length > 0) {
                const found = findCategoryNode(slug, cat.children);
                if (found) return found;
            }
        }
        return null;
    };

    const projectCategory = categories.find(c => c.slug === 'projects') || categories.find(c => c.name?.toLowerCase() === 'projects');
    const subCategories = projectCategory ? (projectCategory.children || []) : [];

    const activeSubCategorySlug = parentSlug || categorySlug;
    const currentSubCategory = !isMainProjectsPage && Array.isArray(subCategories)
        ? subCategories.find(s => s && s.slug === activeSubCategorySlug)
        : null;

    const currentCategoryNode = categorySlug ? findCategoryNode(categorySlug, categories) : null;
    const displayCategories = currentCategoryNode 
        ? (currentCategoryNode.children || []) 
        : subCategories;

    const showAreaFilter = true;

    const displayedProjects = projects.filter(project => {
        // 1. Category Filter
        if (selectedChildCategory !== 'all') {
            const matchesCategory = 
                project.category?.slug === selectedChildCategory ||
                project.sub_category?.slug === selectedChildCategory ||
                project.subCategory?.slug === selectedChildCategory ||
                project.child_category?.slug === selectedChildCategory ||
                project.childCategory?.slug === selectedChildCategory;
            if (!matchesCategory) return false;
        }

        // 2. Area Filter
        if (showAreaFilter && activeArea !== 'all') {
            const floorArea = project.floor_area;
            if (!floorArea) return false;

            // Extract all digits from floor_area string (e.g. "1,500 sft" -> 1500)
            const numericArea = parseInt(floorArea.replace(/[^0-9]/g, ''), 10);
            if (isNaN(numericArea) || numericArea === 0) return false;

            const isPlus = activeArea.includes('+') || activeArea.includes('500000');
            if (isPlus) {
                const min = parseInt(activeArea.replace(/[^\d]/g, ''), 10);
                return numericArea >= min;
            } else {
                const parts = activeArea.split('-');
                if (parts.length === 2) {
                    const min = parseInt(parts[0], 10);
                    const max = parseInt(parts[1], 10);
                    return numericArea >= min && numericArea <= max;
                }
            }
        }

        return true;
    });

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
        ? 'Projects'
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

    const areaRanges = [
        { label: '1000-1500 sft', value: '1000-1500' },
        { label: '1501-2000 sft', value: '1501-2000' },
        { label: '2001-2500 sft', value: '2001-2500' },
        { label: '2500+ sft', value: '2500-500000' },
    ];

    const showCategoryFilter = isMainProjectsPage || (currentSubCategory && currentSubCategory.children && currentSubCategory.children.length > 0);

    const isCategoryCheck = () => {
        if (!categorySlug) return true;
        if (categorySlug === 'projects') return true;

        const projectsRoot = Array.isArray(categories)
            ? (categories.find(c => c.slug === 'projects') || categories.find(c => c.name?.toLowerCase() === 'projects'))
            : null;
        
        if (!projectsRoot) return false;

        const subCats = projectsRoot.children || [];

        if (parentSlug) {
            // categorySlug must be a child of parentSlug subcategory
            const parentCat = subCats.find(c => c.slug === parentSlug);
            if (!parentCat || !parentCat.children) return false;
            return parentCat.children.some(c => c.slug === categorySlug);
        } else {
            // categorySlug must be a subcategory (direct child of projectsRoot)
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
                <div className="loader-text">Loading Project...</div>
            </div>
        );
    }

    if (!catLoading && !isCategoryCheck()) {
        return <ProjectDetail explicitSlug={categorySlug} />;
    }

    if (!loading && shouldShowDetailDirectly) {
        return <ProjectDetail explicitSlug={projects[0].slug} />;
    }

    if (loading && !isMainProjectsPage) {
        return (
            <div className="loading-state">
                <div className="loader"></div>
                <div className="loader-text">Loading Project...</div>
            </div>
        );
    }

    return (
        <div className="projects-page-wrapper">
            {/* Hero Section */}
            <section className="pl-hero">
                <div className="pl-hero-bg" style={headerStyle}></div>
                <div className="pl-hero-overlay"></div>
                <div className="pl-hero-content">
                    <h1 className="pl-hero-title">{pageTitle}</h1>
                    <div className="pl-hero-breadcrumb">
                        <Link to="/">Home</Link>
                        {activeFilter === 'all' ? (
                            <>
                                <span className="bc-sep">/</span>
                                <span className="current-page">Projects</span>
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
                                                index === 0 ? '/projects' :
                                                    index === 1 ? `/projects/${item.slug}` :
                                                        `/projects/${path[1].slug}/${item.slug}`
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
                    <a href="#projects-grid" className="pl-hero-btn">
                        <span>EXPLORE PROJECTS</span>
                        <i className="fas fa-chevron-down"></i>
                    </a>
                </div>
            </section>

            <div id="projects-grid" className="pl-main-container">
                {projects.length > 0 && (showCategoryFilter || showAreaFilter) && (
                    <div className="pl-filters-section compact">
                        {showCategoryFilter && (
                            <div className="pl-filter-row">
                                <div className="pl-filters-inner">
                                    {isMainProjectsPage ? (
                                        <>
                                            <Link
                                                to="/projects"
                                                className={`pl-filter-item ${activeFilter === 'all' || activeFilter === 'projects' ? 'active' : ''}`}
                                            >
                                                All Works
                                            </Link>
                                            {displayCategories.map(cat => (
                                                <Link
                                                    key={cat.id}
                                                    to={`/projects/${cat.slug}`}
                                                    className={`pl-filter-item ${activeFilter === cat.slug ? 'active' : ''}`}
                                                >
                                                    {cat.name}
                                                </Link>
                                            ))}
                                        </>
                                    ) : (
                                        currentSubCategory && (
                                            <>
                                                <Link
                                                    to={`/projects/${currentSubCategory.slug}`}
                                                    className={`pl-filter-item ${!parentSlug ? 'active' : ''}`}
                                                >
                                                    All
                                                </Link>
                                                {currentSubCategory.children && currentSubCategory.children.map(child => (
                                                    <Link
                                                        key={child.id}
                                                        to={`/projects/${currentSubCategory.slug}/${child.slug}`}
                                                        className={`pl-filter-item ${categorySlug === child.slug ? 'active' : ''}`}
                                                    >
                                                        {child.name}
                                                    </Link>
                                                ))}
                                            </>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {showAreaFilter && (
                            <div className="pl-filter-row secondary">
                                <div className="pl-filters-inner area-filters">
                                    {!showCategoryFilter && (
                                        <button
                                            className={`pl-filter-item mini ${activeArea === 'all' ? 'active' : ''}`}
                                            onClick={() => handleAreaClick('all')}
                                        >
                                            All
                                        </button>
                                    )}
                                    {areaRanges.map(range => (
                                        <button
                                            key={range.value}
                                            className={`pl-filter-item mini ${activeArea === range.value ? 'active' : ''}`}
                                            onClick={() => handleAreaClick(range.value)}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}



                <div className="pl-small-projects-grid">
                    {loading && projects.length === 0 ? (
                        <div className="loading-state" style={{ height: '300px', gridColumn: '1 / -1' }}>
                            <div className="loader"></div>
                            <div className="loader-text">Loading Project...</div>
                        </div>
                    ) : displayedProjects.length === 0 ? (
                        <div className="pl-empty-state" style={{ 
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
                                <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', color: '#1a1a1a', marginBottom: '15px' }}>No Projects Found</h2>
                                {projects.length === 0 ? (
                                    <>
                                        <p style={{ fontSize: '15px', color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
                                            We couldn't find any projects matching your selection. Please try exploring our portfolio instead.
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
                                            We couldn't find any projects matching your selection. Please try another filter or explore all works.
                                        </p>
                                        <button 
                                            onClick={() => setSearchParams(new URLSearchParams())}
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
                            const subSlug = project.sub_category?.slug || project.subCategory?.slug;
                            const childSlug = project.child_category?.slug || project.childCategory?.slug;
                            const url = (subSlug && childSlug)
                                ? `/projects/${subSlug}/${childSlug}/${project.slug}`
                                : `/projects/view/${project.slug}`;

                            return (
                                <Link
                                    to={url}
                                    key={project.id}
                                    className="pl-small-card"
                                >
                                    <div className="pl-small-card-media">
                                        {project.thumbnail ? (
                                            <img src={getStorageUrl(project.thumbnail.image_path)} alt={project.title} loading="lazy" />
                                        ) : project.images?.length > 0 ? (
                                            <img src={getStorageUrl(project.images[0].image_path)} alt={project.title} loading="lazy" />
                                        ) : (
                                            <div className="pl-placeholder">Premium Design</div>
                                        )}

                                        <div className="pl-small-overlay">
                                            <div className="pl-small-overlay-content">
                                                <span className="pl-small-cat">{project.child_category?.name || project.sub_category?.name || project.category?.name}</span>
                                                <h3 className="pl-small-title">{project.title}</h3>
                                                <div className="pl-small-footer">
                                                    <span className="pl-small-loc"><i className="fas fa-map-marker-alt"></i> {project.location || 'Boutique'}</span>
                                                    <span className="pl-small-area">{project.floor_area || 'Custom'}</span>
                                                    <i className="fas fa-long-arrow-alt-right pl-arrow"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectList;
