import React from 'react';
import { useOutletContext } from 'react-router-dom';

const AboutOverview = () => {
    // Read cached site settings from the parent layout outlet context
    const { settings } = useOutletContext();

    return (
        <div className="about-overview-wrapper">
            {/* Studio Story Grid */}
            <section className="about-story-section">
                <div className="story-image-box">
                    <img 
                        src="/photo/about_studio.png" 
                        alt="Design Studio Showroom" 
                        className="story-img"
                        loading="eager"
                    />
                    <div className="story-img-tag">ESTABLISHED STUDIO</div>
                </div>
                <div className="story-content-box">
                    <span className="story-subtitle">OUR IDENTITY</span>
                    <h2 className="story-title">{settings?.site_name || "Premium Touch Decor Studio"}</h2>
                    <h3 className="story-tagline">"{settings?.tagline || "Your Personal Touch with Premium Touch"}"</h3>
                    <div className="story-divider"></div>
                    <p className="story-desc">
                        {settings?.short_description || "We are a boutique interior and architectural design studio dedicated to creating elegant, functional, and modern spaces. Our focus is blending luxury aesthetics with daily utility to transform spaces into highly personalized sanctuaries."}
                    </p>
                    <p className="story-desc">
                        Every project we undertake is treated as a unique canvas. From initial concepts and details selection to complete turnkey execution, we bring signature craftsmanship, scale-appropriate layouts, and professional project supervision to residential and commercial properties.
                    </p>
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
                        <div className="timeline-number">01</div>
                        <div className="timeline-content">
                            <h4>Consultation & Concept</h4>
                            <p>We analyze the structural flow, natural lighting, and client preferences to map out the conceptual blueprint and space plans.</p>
                        </div>
                    </div>

                    <div className="timeline-item">
                        <div className="timeline-number">02</div>
                        <div className="timeline-content">
                            <h4>3D Visualization</h4>
                            <p>Generating realistic 3D renderings, material boards, and detailed walkthroughs so you see the finalized design before construction.</p>
                        </div>
                    </div>

                    <div className="timeline-item">
                        <div className="timeline-number">03</div>
                        <div className="timeline-content">
                            <h4>Material Sourcing</h4>
                            <p>Selecting custom veneers, light fittings, fabrics, marbles, and finishes from verified suppliers to ensure premium texture quality.</p>
                        </div>
                    </div>

                    <div className="timeline-item">
                        <div className="timeline-number">04</div>
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
