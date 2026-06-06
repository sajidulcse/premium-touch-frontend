import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BASE_URL, getSiteInfo } from '../../api/axios';
import './StatsAndCTA.css';

const StatsAndCTA = () => {
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSiteInfo();
                setSettings(data);
            } catch (err) {
                console.error("Error loading stats and cta settings:", err);
            }
        };

        fetchSettings();
    }, []);

    const getCtaBgUrl = () => {
        if (settings?.cta_bg) {
            const root = BASE_URL.replace(/\/api$/, '');
            return `${root}/public/uploads/cta/${settings.cta_bg}`;
        }
        return 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1920&q=80';
    };

    return (
        <div className="global-stats-cta-wrapper">
            {/* Statistics Section */}
            <section className="gl-stats-section">
                <div className="gl-container">
                    <div className="gl-stats-grid">
                        <div className="gl-stat-card">
                            <span className="gl-stat-num">{settings?.stat_1_num || '250+'}</span>
                            <span className="gl-stat-label">{settings?.stat_1_label || 'Luxury Projects Completed'}</span>
                        </div>
                        <div className="gl-stat-card">
                            <span className="gl-stat-num">{settings?.stat_2_num || '15+'}</span>
                            <span className="gl-stat-label">{settings?.stat_2_label || 'Years of Design Experience'}</span>
                        </div>
                        <div className="gl-stat-card">
                            <span className="gl-stat-num">{settings?.stat_3_num || '98%'}</span>
                            <span className="gl-stat-label">{settings?.stat_3_label || 'Client Satisfaction Rate'}</span>
                        </div>
                        <div className="gl-stat-card">
                            <span className="gl-stat-num">{settings?.stat_4_num || '18+'}</span>
                            <span className="gl-stat-label">{settings?.stat_4_label || 'Design & Architecture Awards'}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modern Call to Action */}
            <section className="gl-cta-section">
                <div className="gl-cta-bg" style={{ backgroundImage: `url(${getCtaBgUrl()})` }}></div>
                <div className="gl-cta-overlay"></div>
                <div className="gl-container">
                    <div className="gl-cta-content">
                        <h2>Ready to Build Your Dream Space?</h2>
                        <p>Let's collaborate to bring signature craftsmanship, luxury details, and state-of-the-art aesthetics to your property.</p>
                        <div className="gl-cta-buttons">
                            <Link to="/contact" className="gl-cta-btn-primary">START A PROJECT</Link>
                            <Link to="/portfolio" className="gl-cta-btn-secondary">EXPLORE WORKS</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default StatsAndCTA;
