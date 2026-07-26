import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFooter, getSiteInfo } from "../../api/axios";
import "./Footer.css";

const Footer = () => {
  const [sections, setSections] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    // Fetch footer sections
    const fetchFooterData = async () => {
      try {
        const data = await getFooter();
        setSections(data);
      } catch (error) {
        console.error("Error fetching footer sections:", error);
      }
    };

    // Fetch site settings
    const fetchSiteSettingsData = async () => {
      try {
        const data = await getSiteInfo();
        setSiteSettings(data);
      } catch (error) {
        console.error("Error fetching site settings:", error);
      }
    };

    fetchFooterData();
    fetchSiteSettingsData();
  }, []);

  const getNormalizedUrl = (url) => {
    if (!url) return "#";
    // Replace hardcoded dev ports with relative paths
    let cleanUrl = url.replace(/^http:\/\/localhost:517[34]/, "");
    return cleanUrl || "/";
  };

  const defaultSections = [
    {
      id: "def-1",
      section_title: siteSettings?.site_name || "Premium Touch",
      section_type: "text",
      content: "Bespoke Interior & Architectural Solutions crafting timeless luxury environments across Bangladesh."
    },
    {
      id: "def-2",
      section_title: "Quick Links",
      section_type: "links",
      content: [
        { title: "Projects", url: "/projects" },
        { title: "Portfolio", url: "/portfolios" },
        { title: "Services", url: "/services" },
        { title: "Blog", url: "/blogs" },
        { title: "Gallery", url: "/gallery" },
        { title: "About Us", url: "/about-us" },
        { title: "Contact", url: "/contact" }
      ]
    },
    {
      id: "def-3",
      section_title: "Contact Info",
      section_type: "text",
      content: `${siteSettings?.address || "House 25, Road 11, Banani, Dhaka"} | ${siteSettings?.phone || "+880 1700-000000"}`
    }
  ];

  const parseContent = (content) => {
    if (Array.isArray(content)) return content;
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const displaySections = (Array.isArray(sections) && sections.length > 0) ? sections : defaultSections;

  return (
    <footer className="footer">
      <div className="footer-container">
        {displaySections.map((section) => {
          const linksList = section.section_type === "links" ? parseContent(section.content) : [];
          const socialList = section.section_type === "social" ? parseContent(section.content) : [];

          return (
            <div key={section.id} className="footer-section">
              <h4 className="footer-section-title">{section.section_title}</h4>

              {section.section_type === "text" && (
                <p className="footer-text">{typeof section.content === 'string' ? section.content : ''}</p>
              )}

              {section.section_type === "links" && (
                <ul className="footer-links">
                  {linksList.map((link, idx) => {
                    const normalizedUrl = getNormalizedUrl(link.url);
                    const isInternal = normalizedUrl.startsWith("/");

                    return (
                      <li key={idx}>
                        {isInternal ? (
                          <Link to={normalizedUrl}>{link.title}</Link>
                        ) : (
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            {link.title}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {section.section_type === "social" && (
                <div className="footer-social">
                  {socialList.map((social, idx) => (
                    <a
                      key={idx}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                    >
                      <i className={social.icon}></i>
                    </a>
                  ))}
                </div>
              )}

              {section.section_type === "newsletter" && (
                <form className="footer-newsletter">
                  <input
                    type="email"
                    placeholder="Your email"
                    required
                    className="newsletter-input"
                  />
                  <button type="submit" className="newsletter-btn">
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      <div className="footer-bottom">
        <p style={{ margin: 0 }}>
          &copy; {new Date().getFullYear()}{" "}
          {siteSettings?.site_name || "Your Company"}. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
