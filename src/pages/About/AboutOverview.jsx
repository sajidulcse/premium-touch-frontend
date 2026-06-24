import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api, { BASE_URL, getStorageUrl } from '../../api/axios';

const AboutOverview = () => {
    // Read cached site settings from the parent layout outlet context
    const { settings } = useOutletContext();
    const [philosophies, setPhilosophies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPhilosophies = async () => {
            try {
                const res = await api.get('/design-philosophies');
                const sorted = res.data.sort((a, b) => a.step_number.localeCompare(b.step_number));
                setPhilosophies(sorted);
            } catch (err) {
                console.error("Failed to fetch design philosophies:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPhilosophies();
    }, []);

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
                    {philosophies.map((philosophy) => (
                        <div key={philosophy.id} className="philosophy-card">
                            <div className="philosophy-card-header">
                                <span className="philosophy-number">{philosophy.stepNumber || philosophy.step_number}</span>
                                <div className="philosophy-image-box">
                                    <img 
                                        src={getStorageUrl(philosophy.image)} 
                                        alt={philosophy.title}
                                        onError={(e) => {
                                            e.target.src = "/photo/values_step1.png";
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="philosophy-card-content">
                                <h3>{philosophy.title}</h3>
                                <p>{philosophy.description}</p>
                            </div>
                        </div>
                    ))}
                    {!loading && philosophies.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#888' }}>
                            No design philosophies found.
                        </div>
                    )}
                </div>
            </section>

            {/* Design Process Section */}
            <section className="about-process-section">
                <div className="section-header-centered">
                    <span className="section-subtitle">THE ROADMAP</span>
                    <h2 className="section-title">Our Creative Process</h2>
                    <div className="section-line"></div>
                </div>

                <div className="process-grid">
                    <div className="process-card">
                        <div className="process-card-header">
                            <span className="process-number">01</span>
                            <div className="process-image-box">
                                <img src="/photo/process_step1.png" alt="Place a phone call" />
                            </div>
                        </div>
                        <div className="process-card-content">
                            <h3>Place a phone call</h3>
                            <p>Our professional customer care team is here to provide all the basic information you need to know.</p>
                        </div>
                    </div>

                    <div className="process-card">
                        <div className="process-card-header">
                            <span className="process-number">02</span>
                            <div className="process-image-box">
                                <img src="/photo/process_step2.png" alt="Visit" />
                            </div>
                        </div>
                        <div className="process-card-content">
                            <h3>Visit</h3>
                            <p>After a successful visit, considering all your requirements along with material we will provide an idea about cost.</p>
                        </div>
                    </div>

                    <div className="process-card">
                        <div className="process-card-header">
                            <span className="process-number">03</span>
                            <div className="process-image-box">
                                <img src="/photo/process_step3.png" alt="Design" />
                            </div>
                        </div>
                        <div className="process-card-content">
                            <h3>Design</h3>
                            <p>For design you can bring your ideas to the table, or can choose from our vast collections. Else our creative designer team can make a complete design for you.</p>
                        </div>
                    </div>

                    <div className="process-card">
                        <div className="process-card-header">
                            <span className="process-number">04</span>
                            <div className="process-image-box">
                                <img src="/photo/process_step4.png" alt="Approval" />
                            </div>
                        </div>
                        <div className="process-card-content">
                            <h3>Approval</h3>
                            <p>After approval of the design we will provide final costing for the project considering your choice of material.</p>
                        </div>
                    </div>

                    <div className="process-card">
                        <div className="process-card-header">
                            <span className="process-number">05</span>
                            <div className="process-image-box">
                                <img src="/photo/process_step5.png" alt="Payment procedure" />
                            </div>
                        </div>
                        <div className="process-card-content">
                            <h3>Payment procedure</h3>
                            <p>If the design and price is being finalized we will come up with a very easy and convenient payment procedure and working schedule.</p>
                        </div>
                    </div>

                    <div className="process-card">
                        <div className="process-card-header">
                            <span className="process-number">06</span>
                            <div className="process-image-box">
                                <img src="/photo/process_step6.png" alt="Agreement" />
                            </div>
                        </div>
                        <div className="process-card-content">
                            <h3>Agreement</h3>
                            <p>Both parties will sign in an agreement. We believe in professionalism and commitment. Our professional architects, workers work simultaneously.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutOverview;
