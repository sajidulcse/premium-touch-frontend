import React, { useEffect, useState } from "react";
import { BASE_URL, getSiteInfo, getServices } from "../../api/axios";
import "./ContactCTA.css";


const ContactCTA = () => {
  const [siteInfo, setSiteInfo] = useState({});
  const [services, setServices] = useState([]);

  useEffect(() => {
    getSiteInfo().then(data => setSiteInfo(data)).catch(console.error);
    getServices().then(data => setServices(data)).catch(console.error);
  }, []);

  return (
    <>
      <div className="contact-cta">
        {/* 1. Logo + Name + Tagline + Short Description */}
        <div className="cta-section site-info">
          <img
            src={siteInfo.logo ? `${BASE_URL.replace("/api", "")}/uploads/logo/${siteInfo.logo}` : "/default-logo.jpg"}
            alt="Logo"
            className="logo"
          />
          <div className="site-text">
            <h3>{siteInfo.site_name}</h3>
            <p className="tagline">{siteInfo.tagline}</p>
            <p className="short-desc">{siteInfo.short_description || "Your trusted interior design studio."}</p>
          </div>
        </div>

        {/* 2. Services */}
        <div className="cta-section services">
          <h4>Our Services</h4>
          <ul>
            {services.map(s => (
              <li key={s.id}><a href={`/${s.slug}`}>{s.title}</a></li>
            ))}
          </ul>
        </div>

        {/* 3. Social Links */}
        <div className="cta-section social-links">
          <h4>Connect With Us</h4>
          <div className="social-icons">
            {siteInfo.facebook_page_url && (
              <a href={siteInfo.facebook_page_url} target="_blank" rel="noopener noreferrer">
                <i className="fab fa-facebook-f"></i>
              </a>
            )}
            {siteInfo.instagram_page_url && (
              <a href={siteInfo.instagram_page_url} target="_blank" rel="noopener noreferrer">
                <i className="fab fa-instagram"></i>
              </a>
            )}
            {siteInfo.linkedin_page_url && (
              <a href={siteInfo.linkedin_page_url} target="_blank" rel="noopener noreferrer">
                <i className="fab fa-linkedin-in"></i>
              </a>
            )}
          </div>

          {/* Facebook Page Plugin */}
          {siteInfo.facebook_page_url && (
            <div className="facebook-page-plugin" style={{ marginTop: '25px', overflow: 'hidden', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <iframe
                src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(siteInfo.facebook_page_url)}&tabs=timeline&width=300&height=130&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`}
                width="100%"
                height="130"
                style={{ border: 'none', overflow: 'hidden' }}
                scrolling="no"
                frameBorder="0"
                allowFullScreen={true}
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              ></iframe>
            </div>
          )}
        </div>

        {/* 4. Contact Info */}
        <div className="contact-info">
          <h4>Contact Us</h4>
          <p>Phone: <a href={`tel:${siteInfo.phone}`}>{siteInfo.phone}</a></p>
          <p>Email: <a href={`mailto:${siteInfo.email}`}>{siteInfo.email}</a></p>
          <p>Address: {siteInfo.address}</p>

          <div
            className="map-preview"
            title="Open in Google Maps"
            onClick={() => window.open(siteInfo.map_url, "_blank")}
            style={{ cursor: "pointer" }}
          >
            <iframe
              src={siteInfo.map_embed_url}
              width="100%"
              height="180"
              style={{ border: 0 }}
              loading="lazy"
              title="Map Preview"
            />
            <div className="map-overlay">
              <span>📍 View on Google Maps</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactCTA;
