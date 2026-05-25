import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import api, { BASE_URL } from '../../api/axios';
import './Admin.css';

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const admin = JSON.parse(localStorage.getItem('admin'));

    // Blog submenu toggle
    const [blogMenuOpen, setBlogMenuOpen] = useState(
        location.pathname.includes('/admin/blog') || location.pathname.includes('/admin/comments')
    );
    // Project submenu toggle
    const [projectMenuOpen, setProjectMenuOpen] = useState(
        location.pathname.includes('/admin/projects') || location.pathname.includes('/admin/project-categories')
    );
    // Portfolio submenu toggle
    const [portfolioMenuOpen, setPortfolioMenuOpen] = useState(
        location.pathname.includes('/admin/portfolios') || location.pathname.includes('/admin/portfolio-categories')
    );
    // Service submenu toggle
    const [serviceMenuOpen, setServiceMenuOpen] = useState(
        location.pathname.includes('/admin/services') || location.pathname.includes('/admin/service-categories')
    );
    // Gallery submenu toggle
    const [galleryMenuOpen, setGalleryMenuOpen] = useState(
        location.pathname.includes('/admin/gallery')
    );
    const [siteInfo, setSiteInfo] = useState({ site_name: 'Premium Touch', logo: '' });

    useEffect(() => {
        const fetchSiteInfo = async () => {
            try {
                const res = await api.get('/site-info');
                setSiteInfo(res.data);
            } catch (err) {
                console.error("Failed to fetch site info:", err);
            }
        };
        fetchSiteInfo();
    }, []);

    useEffect(() => {
        if (!admin && !location.pathname.includes('admin-login')) {
            navigate('/admin-login');
        }
        document.body.classList.add('admin-body');
        return () => document.body.classList.remove('admin-body');
    }, [admin, navigate, location]);

    const handleLogout = () => {
        localStorage.removeItem('admin');
        navigate('/admin-login');
    };

    if (!admin && !location.pathname.includes('admin-login')) {
        return null;
    }

    if (location.pathname.includes('admin-login')) {
        return <div className="admin-body">{children}</div>;
    }

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-logo">
                    {siteInfo.logo ? (
                        <img
                            src={`${BASE_URL.replace('/api', '')}/uploads/logo/${siteInfo.logo}`}
                            alt="Logo"
                            style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                        />
                    ) : (
                        <i className="fas fa-crown" style={{ fontSize: '2.5rem' }}></i>
                    )}
                    <span>{siteInfo.site_name}</span>
                </div>

                <div className="sidebar-scroll">
                    <ul className="sidebar-menu">
                        <li>
                            <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                                <i className="fas fa-chart-line"></i>
                                <span>Dashboard</span>
                            </NavLink>
                        </li>

                        <li className={`has-submenu ${projectMenuOpen ? 'open' : ''}`}>
                            <div className="menu-item-toggle" onClick={() => setProjectMenuOpen(!projectMenuOpen)}>
                                <i className="fas fa-drafting-compass"></i>
                                <span>Manage Projects</span>
                                <i className={`fas fa-chevron-${projectMenuOpen ? 'up' : 'down'} arrow`}></i>
                            </div>

                            {projectMenuOpen && (
                                <ul className="submenu-list">
                                    <li>
                                        <NavLink to="/admin/projects" end className={({ isActive }) => isActive ? 'active' : ''}>
                                            <i className="fas fa-list"></i>
                                            <span>All Projects</span>
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/admin/projects/new" className={({ isActive }) => isActive ? 'active' : ''}>
                                            <i className="fas fa-plus-circle"></i>
                                            <span>Add New Project</span>
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/admin/project-categories" className={({ isActive }) => isActive ? 'active' : ''}>
                                            <i className="fas fa-tags"></i>
                                            <span>Categories</span>
                                        </NavLink>
                                    </li>
                                </ul>
                            )}
                        </li>

                        <li className={`has-submenu ${portfolioMenuOpen ? 'open' : ''}`}>
                            <div className="menu-item-toggle" onClick={() => setPortfolioMenuOpen(!portfolioMenuOpen)}>
                                <i className="fas fa-camera-retro"></i>
                                <span>Manage Portfolios</span>
                                <i className={`fas fa-chevron-${portfolioMenuOpen ? 'up' : 'down'} arrow`}></i>
                            </div>

                            {portfolioMenuOpen && (
                                <ul className="submenu-list">
                                    <li>
                                        <NavLink to="/admin/portfolios" end className={({ isActive }) => isActive ? 'active' : ''}>
                                            <i className="fas fa-list"></i>
                                            <span>All Portfolios</span>
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/admin/portfolios/new" className={({ isActive }) => isActive ? 'active' : ''}>
                                            <i className="fas fa-plus-circle"></i>
                                            <span>Add New Portfolio</span>
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/admin/portfolio-categories" className={({ isActive }) => isActive ? 'active' : ''}>
                                            <i className="fas fa-tags"></i>
                                            <span>Categories</span>
                                        </NavLink>
                                    </li>
                                </ul>
                            )}
                        </li>

                        <li className={`has-submenu ${serviceMenuOpen ? 'open' : ''}`}>
                            <div className="menu-item-toggle" onClick={() => setServiceMenuOpen(!serviceMenuOpen)}>
                                <i className="fas fa-concierge-bell"></i>
                                <span>Manage Services</span>
                                <i className={`fas fa-chevron-${serviceMenuOpen ? 'up' : 'down'} arrow`}></i>
                            </div>

                            {serviceMenuOpen && (
                                <ul className="submenu-list">
                                    <li>
                                        <NavLink to="/admin/services" end className={({ isActive }) => isActive ? 'active' : ''}>
                                            <i className="fas fa-list"></i>
                                            <span>All Services</span>
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/admin/services/new" className={({ isActive }) => isActive ? 'active' : ''}>
                                            <i className="fas fa-plus-circle"></i>
                                            <span>Add New Service</span>
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/admin/service-categories" className={({ isActive }) => isActive ? 'active' : ''}>
                                            <i className="fas fa-tags"></i>
                                            <span>Categories</span>
                                        </NavLink>
                                    </li>
                                </ul>
                            )}
                        </li>

                        <li className={`has-submenu ${blogMenuOpen ? 'open' : ''}`}>
                            <div className="menu-item-toggle" onClick={() => setBlogMenuOpen(!blogMenuOpen)}>
                                <i className="fas fa-pen-nib"></i>
                                <span>Manage Blogs</span>
                                <i className={`fas fa-chevron-${blogMenuOpen ? 'up' : 'down'} arrow`}></i>
                            </div>

                            {blogMenuOpen && (
                                <ul className="submenu-list">
                                    <li>
                                        <NavLink to="/admin/blogs" end className={({ isActive }) => isActive ? 'active' : ''}>
                                            <i className="fas fa-list"></i>
                                            <span>All Posts</span>
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/admin/blogs/new" className={({ isActive }) => isActive ? 'active' : ''}>
                                            <i className="fas fa-plus-circle"></i>
                                            <span>Add New Post</span>
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/admin/blog-categories" className={({ isActive }) => isActive ? 'active' : ''}>
                                            <i className="fas fa-tags"></i>
                                            <span>Categories</span>
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/admin/comments" className={({ isActive }) => isActive ? 'active' : ''}>
                                            <i className="fas fa-comments"></i>
                                            <span>Comments</span>
                                        </NavLink>
                                    </li>
                                </ul>
                            )}
                        </li>

                        <li className={`has-submenu ${galleryMenuOpen ? 'open' : ''}`}>
                            <div className="menu-item-toggle" onClick={() => setGalleryMenuOpen(!galleryMenuOpen)}>
                                <i className="fas fa-images"></i>
                                <span>Manage Gallery</span>
                                <i className={`fas fa-chevron-${galleryMenuOpen ? 'up' : 'down'} arrow`}></i>
                            </div>

                            {galleryMenuOpen && (
                                <ul className="submenu-list">
                                    <li>
                                        <NavLink to="/admin/gallery/photos" className={({ isActive }) => isActive ? 'active' : ''}>
                                            <i className="fas fa-camera"></i>
                                            <span>Photo Gallery</span>
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/admin/gallery/videos" className={({ isActive }) => isActive ? 'active' : ''}>
                                            <i className="fas fa-video"></i>
                                            <span>Video Gallery</span>
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/admin/gallery/handover" className={({ isActive }) => isActive ? 'active' : ''}>
                                            <i className="fas fa-handshake"></i>
                                            <span>Handover Snapshot</span>
                                        </NavLink>
                                    </li>
                                </ul>
                            )}
                        </li>

                        <li>
                            <NavLink to="/admin/about" className={({ isActive }) => isActive ? 'active' : ''}>
                                <i className="fas fa-info-circle"></i>
                                <span>About Us</span>
                            </NavLink>
                        </li>

                        <li>
                            <NavLink to="/admin/categories" className={({ isActive }) => isActive ? 'active' : ''}>
                                <i className="fas fa-sitemap"></i>
                                <span>Manage Categories</span>
                            </NavLink>
                        </li>

                        <li>
                            <NavLink to="/admin/profile" className={({ isActive }) => isActive ? 'active' : ''}>
                                <i className="fas fa-user-circle"></i>
                                <span>My Profile</span>
                            </NavLink>
                        </li>

                        <li>
                            <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'active' : ''}>
                                <i className="fas fa-cog"></i>
                                <span>Site Settings</span>
                            </NavLink>
                        </li>

                        <li className="menu-divider">System</li>

                        <li>
                            <NavLink to="/" className="">
                                <i className="fas fa-external-link-alt"></i>
                                <span>View Site</span>
                            </NavLink>
                        </li>
                    </ul>
                </div>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn-sidebar">
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                    <div className="admin-status">
                        <span className="dot online"></span>
                        {admin?.name}
                    </div>
                </div>
            </aside>

            <main className="admin-main">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
