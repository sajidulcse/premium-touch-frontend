import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BASE_URL, getSiteInfo } from '../../api/axios';
import './StatsAndCTA.css';

// Helper to extract numbers and prefixes/suffixes (e.g. "250+" -> target: 250, suffix: "+")
const parseStatValue = (val) => {
    if (!val) return { target: 0, prefix: '', suffix: '' };
    const str = String(val);
    const cleanStr = str.replace(/,/g, '');
    const numMatch = cleanStr.match(/(\d+(?:\.\d+)?)/);
    if (!numMatch) return { target: 0, prefix: '', suffix: str };
    
    const targetNum = parseFloat(numMatch[0]);
    const numberIndex = str.indexOf(numMatch[0]);
    const prefix = str.substring(0, numberIndex);
    const suffix = str.substring(numberIndex + numMatch[0].length);
    
    return { target: targetNum, prefix, suffix };
};

// CountUp component using Intersection Observer for viewport triggering
const CountUpNumber = ({ value }) => {
    const [displayVal, setDisplayVal] = useState('0');
    const ref = useRef(null);
    
    useEffect(() => {
        const { target, prefix, suffix } = parseStatValue(value);
        if (target === 0) {
            setDisplayVal(value);
            return;
        }
        
        let animated = false;
        
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !animated) {
                    animated = true;
                    let start = 0;
                    const duration = 1500; // 1.5 seconds animation duration
                    const startTime = performance.now();
                    
                    const animate = (currentTime) => {
                        const elapsedTime = currentTime - startTime;
                        if (elapsedTime >= duration) {
                            setDisplayVal(value);
                            return;
                        }
                        
                        const progress = elapsedTime / duration;
                        const easeProgress = progress * (2 - progress); // Ease Out Quad
                        
                        const isFloat = value.includes('.');
                        let currentNum;
                        if (isFloat) {
                            currentNum = (start + easeProgress * target).toFixed(1);
                        } else {
                            currentNum = Math.floor(start + easeProgress * target);
                        }
                        
                        const formattedNum = value.includes(',') 
                            ? Math.floor(currentNum).toLocaleString() 
                            : currentNum;
                            
                        setDisplayVal(`${prefix}${formattedNum}${suffix}`);
                        requestAnimationFrame(animate);
                    };
                    
                    requestAnimationFrame(animate);
                }
            },
            { threshold: 0.1 }
        );
        
        if (ref.current) {
            observer.observe(ref.current);
        }
        
        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [value]);
    
    return <span ref={ref}>{displayVal}</span>;
};

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
                            <span className="gl-stat-num">
                                <CountUpNumber value={settings?.stat_1_num || '250+'} />
                            </span>
                            <span className="gl-stat-label">{settings?.stat_1_label || 'Luxury Projects Completed'}</span>
                        </div>
                        <div className="gl-stat-card">
                            <span className="gl-stat-num">
                                <CountUpNumber value={settings?.stat_2_num || '15+'} />
                            </span>
                            <span className="gl-stat-label">{settings?.stat_2_label || 'Years of Design Experience'}</span>
                        </div>
                        <div className="gl-stat-card">
                            <span className="gl-stat-num">
                                <CountUpNumber value={settings?.stat_3_num || '98%'} />
                            </span>
                            <span className="gl-stat-label">{settings?.stat_3_label || 'Client Satisfaction Rate'}</span>
                        </div>
                        <div className="gl-stat-card">
                            <span className="gl-stat-num">
                                <CountUpNumber value={settings?.stat_4_num || '18+'} />
                            </span>
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
                            <Link to="/contact#contact-form" className="gl-cta-btn-primary">START A PROJECT</Link>
                            <Link to="/portfolio" className="gl-cta-btn-secondary">EXPLORE WORKS</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default StatsAndCTA;
