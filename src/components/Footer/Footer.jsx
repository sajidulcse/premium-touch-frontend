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

  return (
    <footer className="footer">
      <div className="footer-container">
        {sections.map((section) => (
          <div key={section.id} className="footer-section">
            <h4 className="footer-section-title">{section.section_title}</h4>

            {section.section_type === "text" && (
              <p className="footer-text">{section.content}</p>
            )}

            {section.section_type === "links" && (
              <ul className="footer-links">
                {section.content?.map((link, idx) => {
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
                {section.content?.map((social, idx) => (
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
        ))}
      </div>

      <div className="footer-bottom">
        &copy; {new Date().getFullYear()}{" "}
        {siteSettings?.site_name || "Your Company"}. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
