import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import api, { BASE_URL } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user: authUser, logout, hasPermission } = useAuth();
    const admin = authUser || JSON.parse(localStorage.getItem('admin') || sessionStorage.getItem('admin') || 'null');

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
    // About Us submenu toggle
    const [aboutMenuOpen, setAboutMenuOpen] = useState(
        location.pathname.includes('/admin/about')
    );
    // Home Page Setup submenu toggle
    const [homeMenuOpen, setHomeMenuOpen] = useState(
        location.pathname.includes('/admin/home')
    );
    // Cost Estimator submenu toggle
    const [estimatorMenuOpen, setEstimatorMenuOpen] = useState(
        location.pathname.includes('/admin/estimator')
    );

    // System settings submenu toggle
    const [systemMenuOpen, setSystemMenuOpen] = useState(
        location.pathname.includes('/admin/users') || location.pathname.includes('/admin/roles') || location.pathname.includes('/admin/system-settings')
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

    const handleLogout = async () => {
        await logout();
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
                        {hasPermission('dashboard.view') && (
                            <li>
                                <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                                    <i className="fas fa-chart-line"></i>
                                    <span>Dashboard</span>
                                </NavLink>
                            </li>
                        )}

                        {hasPermission('consultations.view') && (
                            <li>
                                <NavLink to="/admin/consultations" className={({ isActive }) => isActive ? 'active' : ''}>
                                    <i className="fas fa-handshake"></i>
                                    <span>Consultation Leads</span>
                                </NavLink>
                            </li>
                        )}

                        {(hasPermission('estimator.leads.view') || hasPermission('estimator.settings.manage')) && (
                            <li className={`has-submenu ${estimatorMenuOpen ? 'open' : ''}`}>
                                <div className="menu-item-toggle" onClick={() => setEstimatorMenuOpen(!estimatorMenuOpen)}>
                                    <i className="fas fa-calculator"></i>
                                    <span>Cost Estimator</span>
                                    <i className={`fas fa-chevron-${estimatorMenuOpen ? 'up' : 'down'} arrow`}></i>
                                </div>

                                {estimatorMenuOpen && (
                                    <ul className="submenu-list">
                                        {hasPermission('estimator.leads.view') && (
                                            <li>
                                                <NavLink to="/admin/estimator/leads" className={({ isActive }) => isActive ? 'active' : ''}>
                                                    <i className="fas fa-clipboard-list"></i>
                                                    <span>Estimator Leads</span>
                                                </NavLink>
                                            </li>
                                        )}
                                        {hasPermission('estimator.settings.manage') && (
                                            <>
                                                <li>
                                                    <NavLink to="/admin/estimator/packages" className={({ isActive }) => isActive ? 'active' : ''}>
                                                        <i className="fas fa-cubes"></i>
                                                        <span>Packages</span>
                                                    </NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/admin/estimator/rooms" className={({ isActive }) => isActive ? 'active' : ''}>
                                                        <i className="fas fa-door-open"></i>
                                                        <span>Rooms</span>
                                                    </NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/admin/estimator/addons" className={({ isActive }) => isActive ? 'active' : ''}>
                                                        <i className="fas fa-puzzle-piece"></i>
                                                        <span>Add-ons</span>
                                                    </NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/admin/estimator/settings" className={({ isActive }) => isActive ? 'active' : ''}>
                                                        <i className="fas fa-file-pdf"></i>
                                                        <span>PDF & Settings</span>
                                                    </NavLink>
                                                </li>
                                            </>
                                        )}
                                        {hasPermission('estimator.leads.view') && (
                                            <li>
                                                <NavLink to="/admin/estimator/reports" className={({ isActive }) => isActive ? 'active' : ''}>
                                                    <i className="fas fa-chart-bar"></i>
                                                    <span>Analytics & Reports</span>
                                                </NavLink>
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </li>
                        )}

                        {hasPermission('projects.view') && (
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
                                        {hasPermission('projects.create') && (
                                            <li>
                                                <NavLink to="/admin/projects/new" className={({ isActive }) => isActive ? 'active' : ''}>
                                                    <i className="fas fa-plus-circle"></i>
                                                    <span>Add New Project</span>
                                                </NavLink>
                                            </li>
                                        )}
                                        <li>
                                            <NavLink to="/admin/project-categories" className={({ isActive }) => isActive ? 'active' : ''}>
                                                <i className="fas fa-tags"></i>
                                                <span>Categories</span>
                                            </NavLink>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        )}

                        {hasPermission('portfolios.view') && (
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
                                        {hasPermission('portfolios.create') && (
                                            <li>
                                                <NavLink to="/admin/portfolios/new" className={({ isActive }) => isActive ? 'active' : ''}>
                                                    <i className="fas fa-plus-circle"></i>
                                                    <span>Add New Portfolio</span>
                                                </NavLink>
                                            </li>
                                        )}
                                        <li>
                                            <NavLink to="/admin/portfolio-categories" className={({ isActive }) => isActive ? 'active' : ''}>
                                                <i className="fas fa-tags"></i>
                                                <span>Categories</span>
                                            </NavLink>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        )}

                        {hasPermission('services.view') && (
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
                                        {hasPermission('services.create') && (
                                            <li>
                                                <NavLink to="/admin/services/new" className={({ isActive }) => isActive ? 'active' : ''}>
                                                    <i className="fas fa-plus-circle"></i>
                                                    <span>Add New Service</span>
                                                </NavLink>
                                            </li>
                                        )}
                                        <li>
                                            <NavLink to="/admin/service-categories" className={({ isActive }) => isActive ? 'active' : ''}>
                                                <i className="fas fa-tags"></i>
                                                <span>Categories</span>
                                            </NavLink>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        )}

                        {hasPermission('blogs.view') && (
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
                                        {hasPermission('blogs.create') && (
                                            <li>
                                                <NavLink to="/admin/blogs/new" className={({ isActive }) => isActive ? 'active' : ''}>
                                                    <i className="fas fa-plus-circle"></i>
                                                    <span>Add New Post</span>
                                                </NavLink>
                                            </li>
                                        )}
                                        <li>
                                            <NavLink to="/admin/blog-categories" className={({ isActive }) => isActive ? 'active' : ''}>
                                                <i className="fas fa-tags"></i>
                                                <span>Categories</span>
                                            </NavLink>
                                        </li>
                                        {hasPermission('comments.view') && (
                                            <li>
                                                <NavLink to="/admin/comments" className={({ isActive }) => isActive ? 'active' : ''}>
                                                    <i className="fas fa-comments"></i>
                                                    <span>Comments</span>
                                                </NavLink>
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </li>
                        )}

                        {hasPermission('gallery.view') && (
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
                        )}

                        {(hasPermission('team.view') || hasPermission('careers.view') || hasPermission('homepage.manage')) && (
                            <li className={`has-submenu ${aboutMenuOpen ? 'open' : ''}`}>
                                <div className="menu-item-toggle" onClick={() => setAboutMenuOpen(!aboutMenuOpen)}>
                                    <i className="fas fa-info-circle"></i>
                                    <span>About Us</span>
                                    <i className={`fas fa-chevron-${aboutMenuOpen ? 'up' : 'down'} arrow`}></i>
                                </div>

                                {aboutMenuOpen && (
                                    <ul className="submenu-list">
                                        {hasPermission('homepage.manage') && (
                                            <li>
                                                <NavLink to="/admin/about/overview" className={({ isActive }) => isActive ? 'active' : ''}>
                                                    <i className="fas fa-eye"></i>
                                                    <span>Overview</span>
                                                </NavLink>
                                            </li>
                                        )}
                                        {hasPermission('team.view') && (
                                            <li>
                                                <NavLink to="/admin/about/team" className={({ isActive }) => isActive ? 'active' : ''}>
                                                    <i className="fas fa-users"></i>
                                                    <span>Our Team</span>
                                                </NavLink>
                                            </li>
                                        )}
                                        {hasPermission('careers.view') && (
                                            <li>
                                                <NavLink to="/admin/about/career" className={({ isActive }) => isActive ? 'active' : ''}>
                                                    <i className="fas fa-briefcase"></i>
                                                    <span>Career</span>
                                                </NavLink>
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </li>
                        )}

                        {hasPermission('categories.view') && (
                            <li>
                                <NavLink to="/admin/categories" className={({ isActive }) => isActive ? 'active' : ''}>
                                    <i className="fas fa-sitemap"></i>
                                    <span>Manage Categories</span>
                                </NavLink>
                            </li>
                        )}

                        <li>
                            <NavLink to="/admin/profile" className={({ isActive }) => isActive ? 'active' : ''}>
                                <i className="fas fa-user-circle"></i>
                                <span>My Profile</span>
                            </NavLink>
                        </li>

                        {hasPermission('settings.view') && (
                            <li>
                                <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'active' : ''}>
                                    <i className="fas fa-cog"></i>
                                    <span>Site Settings</span>
                                </NavLink>
                            </li>
                        )}

                        {hasPermission('homepage.manage') && (
                            <li className={`has-submenu ${homeMenuOpen ? 'open' : ''}`}>
                                <div className="menu-item-toggle" onClick={() => setHomeMenuOpen(!homeMenuOpen)}>
                                    <i className="fas fa-home"></i>
                                    <span>Home Page Setup</span>
                                    <i className={`fas fa-chevron-${homeMenuOpen ? 'up' : 'down'} arrow`}></i>
                                </div>

                                {homeMenuOpen && (
                                    <ul className="submenu-list">
                                        <li>
                                            <NavLink to="/admin/home/hero" className={({ isActive }) => isActive ? 'active' : ''}>
                                                <i className="fas fa-images"></i>
                                                <span>Hero Setup</span>
                                            </NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/admin/home/identity" className={({ isActive }) => isActive ? 'active' : ''}>
                                                <i className="fas fa-id-card"></i>
                                                <span>Our Identity Setup</span>
                                            </NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/admin/home/process" className={({ isActive }) => isActive ? 'active' : ''}>
                                                <i className="fas fa-stream"></i>
                                                <span>Our Creative Process Setup</span>
                                            </NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/admin/home/reviews" className={({ isActive }) => isActive ? 'active' : ''}>
                                                <i className="fas fa-comments"></i>
                                                <span>Our Clients Review</span>
                                            </NavLink>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        )}

                        {(hasPermission('users.view') || hasPermission('roles.view') || hasPermission('settings.view') || hasPermission('settings.security')) && (
                            <>
                                <li className="menu-divider">System & Security</li>

                                <li className={`has-submenu ${systemMenuOpen ? 'open' : ''}`}>
                                    <div className="menu-item-toggle" onClick={() => setSystemMenuOpen(!systemMenuOpen)}>
                                        <i className="fas fa-shield-alt"></i>
                                        <span>System & Security</span>
                                        <i className={`fas fa-chevron-${systemMenuOpen ? 'up' : 'down'} arrow`}></i>
                                    </div>

                                    {systemMenuOpen && (
                                        <ul className="submenu-list">
                                            {hasPermission('users.view') && (
                                                <li>
                                                    <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>
                                                        <i className="fas fa-users-cog"></i>
                                                        <span>User Management</span>
                                                    </NavLink>
                                                </li>
                                            )}
                                            {hasPermission('roles.view') && (
                                                <li>
                                                    <NavLink to="/admin/roles" className={({ isActive }) => isActive ? 'active' : ''}>
                                                        <i className="fas fa-user-shield"></i>
                                                        <span>Role & Permissions</span>
                                                    </NavLink>
                                                </li>
                                            )}
                                            {hasPermission('settings.view') && (
                                                <>
                                                    <li>
                                                        <NavLink 
                                                            to="/admin/system-settings?tab=smtp" 
                                                            className={() => {
                                                                const tab = new URLSearchParams(location.search).get('tab');
                                                                return location.pathname === '/admin/system-settings' && (tab === 'smtp' || !tab) ? 'active' : '';
                                                            }}
                                                        >
                                                            <i className="fas fa-envelope-open-text"></i>
                                                            <span>SMTP Configurations</span>
                                                        </NavLink>
                                                    </li>
                                                    <li>
                                                        <NavLink 
                                                            to="/admin/system-settings?tab=sms" 
                                                            className={() => location.pathname === '/admin/system-settings' && new URLSearchParams(location.search).get('tab') === 'sms' ? 'active' : ''}
                                                        >
                                                            <i className="fas fa-sms"></i>
                                                            <span>SMS Gateway</span>
                                                        </NavLink>
                                                    </li>
                                                    <li>
                                                        <NavLink 
                                                            to="/admin/system-settings?tab=audit" 
                                                            className={() => location.pathname === '/admin/system-settings' && new URLSearchParams(location.search).get('tab') === 'audit' ? 'active' : ''}
                                                        >
                                                            <i className="fas fa-history"></i>
                                                            <span>Login Activities</span>
                                                        </NavLink>
                                                    </li>
                                                    <li>
                                                        <NavLink 
                                                            to="/admin/system-settings?tab=activity" 
                                                            className={() => location.pathname === '/admin/system-settings' && new URLSearchParams(location.search).get('tab') === 'activity' ? 'active' : ''}
                                                        >
                                                            <i className="fas fa-clipboard-list"></i>
                                                            <span>Activity Logs</span>
                                                        </NavLink>
                                                    </li>
                                                </>
                                            )}
                                            {hasPermission('settings.security') && (
                                                <li>
                                                    <NavLink 
                                                        to="/admin/system-settings?tab=security" 
                                                        className={() => location.pathname === '/admin/system-settings' && new URLSearchParams(location.search).get('tab') === 'security' ? 'active' : ''}
                                                    >
                                                        <i className="fas fa-shield-alt"></i>
                                                        <span>Security Insights</span>
                                                    </NavLink>
                                                </li>
                                            )}
                                            {hasPermission('settings.view') && (
                                                <li>
                                                    <NavLink 
                                                        to="/admin/system-settings?tab=marketing" 
                                                        className={() => location.pathname === '/admin/system-settings' && new URLSearchParams(location.search).get('tab') === 'marketing' ? 'active' : ''}
                                                    >
                                                        <i className="fas fa-chart-line"></i>
                                                        <span>Marketing & Analytics</span>
                                                    </NavLink>
                                                </li>
                                            )}
                                        </ul>
                                    )}
                                </li>
                            </>
                        )}

                        <li>
                            <NavLink to="/" target="_blank" rel="noopener noreferrer" className="">
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
                </div>
            </aside>

            <main className="admin-main">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
