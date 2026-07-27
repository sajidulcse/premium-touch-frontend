import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  const quickLinks = [
    { title: "Projects", url: "/projects" },
    { title: "Portfolio", url: "/portfolios" },
    { title: "Services", url: "/services" },
    { title: "Blog", url: "/blogs" },
    { title: "Gallery", url: "/gallery" },
    { title: "About Us", url: "/about-us" },
    { title: "Contact", url: "/contact" }
  ];

  return (
    <footer className="footer">
      <div className="footer-container">
        <ul className="footer-links">
          {quickLinks.map((link, idx) => (
            <li key={idx}>
              <Link to={link.url}>{link.title}</Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          <span>&copy; {new Date().getFullYear()} Premium Touch Interior Decor Studio. All rights reserved.</span>
          <span className="footer-dev-divider">|</span>
          <span className="footer-dev-credit">
            Developed by{" "}
            <a 
              href="https://facebook.com/sajidrana013" 
              target="_blank" 
              rel="noopener noreferrer"
              className="dev-link"
            >
              Sajid Rana
            </a>
          </span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
