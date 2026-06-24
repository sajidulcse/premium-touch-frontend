import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { BASE_URL, getCategories, getSiteInfo } from "../../api/axios";
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [categories, setCategories] = useState([]);
  const [openMenus, setOpenMenus] = useState({});
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const [siteInfo, setSiteInfo] = useState({ logo: "", name: "" });
  const location = useLocation();

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
    setOpenMenus({});
  }, [location]);

  /* -------------------- RESPONSIVE -------------------- */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* -------------------- FETCH CATEGORIES -------------------- */
  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data))
      .catch(console.error);
  }, []);

  /* -------------------- FETCH SITE INFO -------------------- */
  useEffect(() => {
    getSiteInfo()
      .then((data) => setSiteInfo(data))
      .catch(console.error);
  }, []);

  const toggleMenu = (id) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getSubLink = (rootSlug, slug1, slug2 = null) => {
    if (rootSlug === 'portfolio') {
      if (slug2) return `/portfolio/${slug1}/${slug2}`;
      return `/portfolio/${slug1}`;
    }
    if (rootSlug === 'projects' || rootSlug === 'project') {
      if (slug2) return `/projects/${slug1}/${slug2}`;
      return `/projects/${slug1}`;
    }
    if (rootSlug === 'services') {
      return `/services/${slug2 || slug1}`;
    }
    if (rootSlug === 'blogs' || rootSlug === 'blog') return `/blogs/category/${slug2 || slug1}`;
    if (rootSlug === 'about-us' || rootSlug === 'about') {
      return `/about-us/${slug2 || slug1}`;
    }
    return `/${slug2 || slug1}`;
  };

  /* -------------------- DESKTOP LEVEL 3 -------------------- */
  const renderChildMenu = (children, rootSlug, parentSlug) => {
    if (!children?.length) return null;

    return (
      <div className="child-category-box">
        <ul className="child-category-list">
          {children.map((child) => (
            <li key={child.id}>
              <Link to={getSubLink(rootSlug, parentSlug, child.slug)} className="menu-text">
                {child.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  /* -------------------- DESKTOP LEVEL 2 -------------------- */
  const renderSubMenu = (items, rootSlug) => {
    if (!items?.length) return null;

    const activeItem = items.find((i) => i.id === activeSubMenu);
    const activeChildren = activeItem?.children || [];

    return (
      <div
        className={`mega-dropdown-content ${activeChildren.length ? "has-child-box" : ""
          }`}
      >
        <ul className="sub-category-list">
          {items.map((item) => {
            const hasChildren = item.children?.length > 0;
            const isActive = item.id === activeSubMenu;

            return (
              <li
                key={item.id}
                className={isActive ? "active" : ""}
                onMouseEnter={() => !isMobile && setActiveSubMenu(item.id)}
              >
                <div className="menu-item-row">
                  <Link to={getSubLink(rootSlug, item.slug)} className="menu-text">
                    {item.name}
                  </Link>
                  {hasChildren && (
                    <span className="submenu-mark">
                      <i className="fa-solid fa-chevron-right"></i>
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {!isMobile && activeChildren.length > 0 && renderChildMenu(activeChildren, rootSlug, activeItem?.slug)}
      </div>
    );
  };

  /* -------------------- MAIN MENU -------------------- */
  const renderMenu = (items) => (
    <ul className={isMobile ? "nav-menu-mobile" : "nav-menu"}>
      {items.map((item) => {
        const hasChildren = item.children?.length > 0;
        const isOpen = openMenus[item.id];

        return (
          <li key={item.id} className={hasChildren ? "dropdown-main" : ""}>
            <div className="menu-item-row">
              <Link to={`/${item.slug}`} className="menu-text">
                {item.name}
              </Link>

              {hasChildren && (
                <span
                  className="submenu-mark"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMenu(item.id);
                  }}
                >
                  {isMobile ? (
                    isOpen ? <i className="fa-solid fa-chevron-up"></i> : <i className="fa-solid fa-chevron-down"></i>
                  ) : (
                    <i className="fa-solid fa-chevron-down"></i>
                  )}
                </span>
              )}
            </div>

            {!isMobile && hasChildren && (
              <div
                className="mega-dropdown"
                onMouseLeave={() => setActiveSubMenu(null)}
              >
                {renderSubMenu(item.children, item.slug)}
              </div>
            )}

            {isMobile && hasChildren && isOpen && (
              <ul className="mobile-sub-list">
                {item.children.map((sub) => {
                  const subHasChildren = sub.children?.length > 0;
                  const subIsOpen = openMenus[sub.id];

                  return (
                    <li key={sub.id}>
                      <div className="menu-item-row">
                        <Link to={getSubLink(item.slug, sub.slug)} className="menu-text">
                          {sub.name}
                        </Link>

                        {subHasChildren && (
                          <span
                            className="submenu-mark"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleMenu(sub.id);
                            }}
                          >
                            {subIsOpen ? <i className="fa-solid fa-chevron-up"></i> : <i className="fa-solid fa-chevron-down"></i>}
                          </span>
                        )}
                      </div>

                      {subHasChildren && subIsOpen && (
                        <ul className="mobile-child-list">
                          {sub.children.map((child) => (
                            <li key={child.id}>
                              <Link to={getSubLink(item.slug, sub.slug, child.slug)} className="menu-text">
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );

  /* -------------------- JSX -------------------- */
  return (
    <nav className="navbar">
      <div className="logo-title">
        <Link to="/" className="logo-link">
          <img
            src={
              siteInfo.logo
                ? `${BASE_URL.replace('/api', '')}/uploads/logo/${siteInfo.logo}`
                : '/default-logo.jpg'
            }
            alt="Logo"
            className="logo"
          />
          <div className="site-text">
            <h3>
              {siteInfo.site_name
                ? siteInfo.site_name.split("\n").map((line, idx) => (
                  <React.Fragment key={idx}>
                    {line}
                    <br />
                  </React.Fragment>
                ))
                : "Premium Touch\nInterior Decor Studio"}
            </h3>
            <p className="tagline">
              {siteInfo.tagline}
            </p>
          </div>
        </Link>
      </div>


      <div
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>

      <div className={`nav-wrapper ${menuOpen && isMobile ? "active" : ""}`}>
        {renderMenu(categories)}
      </div>
    </nav>
  );
};

export default Navbar;
