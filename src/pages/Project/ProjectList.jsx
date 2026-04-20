import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api, { getStorageUrl, BASE_URL } from '../../api/axios';
import './Project.css';

const ProjectList = () => {
    const { categorySlug } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [projects, setProjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    // Get filters from searchParams or URL Params
    const activeFilter = categorySlug || searchParams.get('category') || 'all';
    const activeArea = searchParams.get('area') || 'all';

    const isMainProjectsPage = !categorySlug || categorySlug === 'projects';
    const isResidentialPage = categorySlug === 'residential';

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
                const res = await api.get(`/projects?category=${activeFilter}&area=${activeArea}`);
                setProjects(res.data);
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [activeFilter, activeArea]);

    const handleFilterClick = (slug) => {
        // Reset Area filter when choosing a category to ensure "single filter" behavior
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('area');

        if (isMainProjectsPage) {
            if (slug === 'all' || slug === 'projects') {
                newParams.delete('category');
            } else {
                newParams.set('category', slug);
            }
            setSearchParams(newParams);
        } else {
            if (slug === 'all' || slug === 'projects') {
                navigate('/projects');
            } else {
                navigate(`/${slug}`);
            }
        }
    };

    const handleAreaClick = (range) => {
        const newParams = new URLSearchParams(searchParams);

        // If on the main projects page, reset category when choosing an area
        if (isMainProjectsPage) {
            newParams.delete('category');
        }

        if (range === 'all') {
            newParams.delete('area');
        } else {
            newParams.set('area', range);
        }
        setSearchParams(newParams);
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

    const projectCategory = categories.find(c => c.slug === 'projects');
    const displayCategories = projectCategory ? getAllCategories(projectCategory.children) : [];

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
        ? 'Premium Touch Project'
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

    const areaRanges = [
        { label: '1000-1500 sft', value: '1000-1500' },
        { label: '1501-2000 sft', value: '1501-2000' },
        { label: '2001-2500 sft', value: '2001-2500' },
        { label: '2500+ sft', value: '2500-500000' },
    ];

    const showCategoryFilter = isMainProjectsPage;
    const showAreaFilter = isMainProjectsPage || isResidentialPage;

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
                                <span className="current-page">Projects</span>
                            </>
                        ) : categoryPath ? (
                            categoryPath.map((item, index, path) => (
                                <React.Fragment key={item.slug}>
                                    <span className="bc-sep">/</span>
                                    {index === path.length - 1 ? (
                                        <span className="current-page">{item.name}</span>
                                    ) : (
                                        <Link to={`/${item.slug === 'projects' ? 'projects' : item.slug}`} className="bc-link-btn">{item.name}</Link>
                                    )}
                                </React.Fragment>
                            ))
                        ) : null}
                    </div>
                </div>
                <div className="pl-header-bg"></div>
            </header>

            <div className="pl-main-container">
                {(showCategoryFilter || showAreaFilter) && (
                    <div className="pl-filters-section compact">
                        {showCategoryFilter && (
                            <div className="pl-filter-row">
                                <div className="pl-filters-inner">
                                    <button
                                        className={`pl-filter-item ${activeFilter === 'all' || activeFilter === 'projects' ? 'active' : ''}`}
                                        onClick={() => handleFilterClick('all')}
                                    >
                                        All Works
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
                        )}

                        {showAreaFilter && (
                            <div className="pl-filter-row secondary">
                                <div className="pl-filters-inner area-filters">
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
                            <div className="loader-text">Filtering Narrative...</div>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="pl-empty-state">
                            <div className="empty-icon">
                                <i className="fas fa-drafting-compass"></i>
                            </div>
                            <h3>No Projects Found</h3>
                            <p>We couldn't find any projects matching your selection. Please try another filter or explore all works.</p>
                            <button onClick={() => {
                                handleFilterClick('all');
                                handleAreaClick('all');
                            }} className="pl-btn-return">Explore All Works</button>
                        </div>
                    ) : (
                        projects.map((project) => (
                            <Link
                                to={`/projects/${project.slug}`}
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
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectList;
