import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BASE_URL } from '../../api/axios';

const AboutOverview = () => {
    // Read cached site settings from the parent layout outlet context
    const { settings } = useOutletContext();

    return (
        <div className="about-overview-wrapper">
            {/* Studio Story Grid */}
            <section className="about-story-section">
                <div className="story-image-box">
                    <img 
                        src={settings?.about_page_office_image ? `${BASE_URL.replace(/\/api$/, '')}/public/uploads/about/${settings.about_page_office_image}` : "/photo/about_studio.png"} 
                        alt="Design Studio Showroom" 
                        className="story-img"
                        loading="eager"
                    />
                </div>
                <div className="story-content-box">
                    <span className="story-subtitle">OUR IDENTITY</span>
                    <h2 className="story-title">{settings?.site_name || "Premium Touch Decor Studio"}</h2>
                    <div className="story-divider"></div>
                    <p className="story-desc" style={{ whiteSpace: 'pre-line' }}>
                        {settings?.about_page_description || "We are a boutique interior and architectural design studio dedicated to creating elegant, functional, and modern spaces. Our focus is blending luxury aesthetics with daily utility to transform spaces into highly personalized sanctuaries."}
                    </p>
                    {(settings?.facebook_page_url || settings?.instagram_page_url || settings?.linkedin_page_url) && (
                        <div className="story-socials">
                            {settings.facebook_page_url && (
                                <a
                                    href={settings.facebook_page_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Facebook"
                                    className="story-social-link"
                                >
                                    <i className="fab fa-facebook-f"></i>
                                </a>
                            )}
                            {settings.instagram_page_url && (
                                <a
                                    href={settings.instagram_page_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Instagram"
                                    className="story-social-link"
                                >
                                    <i className="fab fa-instagram"></i>
                                </a>
                            )}
                            {settings.linkedin_page_url && (
                                <a
                                    href={settings.linkedin_page_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="LinkedIn"
                                    className="story-social-link"
                                >
                                    <i className="fab fa-linkedin-in"></i>
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Core Philosophy Section */}
            <section className="about-philosophy-section">
                <div className="section-header-centered">
                    <span className="section-subtitle">OUR VALUES</span>
                    <h2 className="section-title">Design Philosophy</h2>
                    <div className="section-line"></div>
                </div>

                <div className="philosophy-grid">
                    <div className="philosophy-card">
                        <div className="card-icon-box">
                            <i className="fas fa-drafting-compass"></i>
                        </div>
                        <h4>Signature Craftsmanship</h4>
                        <p>We implement custom millwork, detailed marble trims, and veneers to ensure every corner reflects luxury standards and tailored quality.</p>
                    </div>

                    <div className="philosophy-card">
                        <div className="card-icon-box">
                            <i className="fas fa-seedling"></i>
                        </div>
                        <h4>Sustainable Elegance</h4>
                        <p>Balancing premium visual styling with energy-efficient systems, eco-friendly materials, and smart automation for future-ready living.</p>
                    </div>

                    <div className="philosophy-card">
                        <div className="card-icon-box">
                            <i className="fas fa-couch"></i>
                        </div>
                        <h4>Bespoke Customization</h4>
                        <p>No cookie-cutter templates. We design custom furniture layouts, curate bespoke palettes, and select art pieces to complement your tastes.</p>
                    </div>
                </div>
            </section>

            {/* Design Process Section */}
            <section className="about-process-section">
                <div className="section-header-centered">
                    <span className="section-subtitle">THE ROADMAP</span>
                    <h2 className="section-title">Our Creative Process</h2>
                    <div className="section-line"></div>
                </div>

                <div className="timeline-wrapper">
                    <div className="timeline-item">
                        <div className="timeline-card-header">
                            <div className="timeline-icon-box">
                                <i className="fas fa-comments"></i>
                            </div>
                            <span className="timeline-step-label">STEP 01</span>
                        </div>
                        <div className="timeline-content">
                            <h4>Consultation & Concept</h4>
                            <p>We analyze the structural flow, natural lighting, and client preferences to map out the conceptual blueprint and space plans.</p>
                        </div>
                    </div>

                    <div className="timeline-item">
                        <div className="timeline-card-header">
                            <div className="timeline-icon-box">
                                <i className="fas fa-cube"></i>
                            </div>
                            <span className="timeline-step-label">STEP 02</span>
                        </div>
                        <div className="timeline-content">
                            <h4>3D Visualization</h4>
                            <p>Generating realistic 3D renderings, material boards, and detailed walkthroughs so you see the finalized design before construction.</p>
                        </div>
                    </div>

                    <div className="timeline-item">
                        <div className="timeline-card-header">
                            <div className="timeline-icon-box">
                                <i className="fas fa-palette"></i>
                            </div>
                            <span className="timeline-step-label">STEP 03</span>
                        </div>
                        <div className="timeline-content">
                            <h4>Material Sourcing</h4>
                            <p>Selecting custom veneers, light fittings, fabrics, marbles, and finishes from verified suppliers to ensure premium texture quality.</p>
                        </div>
                    </div>

                    <div className="timeline-item">
                        <div className="timeline-card-header">
                            <div className="timeline-icon-box">
                                <i className="fas fa-key"></i>
                            </div>
                            <span className="timeline-step-label">STEP 04</span>
                        </div>
                        <div className="timeline-content">
                            <h4>Supervision & Handover</h4>
                            <p>Our engineers supervise the turnkey installation, ensuring high-fidelity assembly, final detailing, and clean ceremony keys handover.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutOverview;
