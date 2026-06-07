import React, { useEffect, useState } from 'react';
import api, { getSiteInfo } from '../../api/axios';

const AboutCareer = () => {
    const [openings, setOpenings] = useState([]);
    const [careerEmail, setCareerEmail] = useState('career@premiumtouchbd.com');
    const [loading, setLoading] = useState(true);
    const [expandedJobs, setExpandedJobs] = useState({});

    const toggleJobDesc = (id) => {
        setExpandedJobs(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    useEffect(() => {
        const fetchCareerData = async () => {
            try {
                const openingsRes = await api.get('/career-openings?active_only=true');
                setOpenings(openingsRes.data);

                const settings = await getSiteInfo();
                if (settings && settings.career_email) {
                    setCareerEmail(settings.career_email);
                }
            } catch (err) {
                console.error("Error fetching career page data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCareerData();
    }, []);

    return (
        <div className="about-career-wrapper">
            {/* Intro Career banner */}
            <section className="career-intro-section">
                <div className="career-intro-content">
                    <span className="career-subtitle">JOIN OUR TEAM</span>
                    <h2 className="career-title">Craft the Future of Spaces</h2>
                    <div className="career-line"></div>
                    <p className="career-desc">
                        At Premium Touch Studio, we believe architecture is a collaborative art form. We are always looking for passionate architects, creative 3D visualizers, detail-oriented site engineers, and texture designers who strive for uncompromising design quality.
                    </p>
                </div>
            </section>

            {/* Open Positions List */}
            <section className="career-list-section">
                <h3 className="career-list-heading">Current Vacancies</h3>
                
                {loading ? (
                    <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="admin-loading-spinner" style={{ border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #d4af37', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
                        <style>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                ) : (
                    <div className="career-openings-list">
                        {openings.length > 0 ? (
                            openings.map((job) => {
                                const plainText = job.desc ? job.desc.replace(/<[^>]*>/g, '') : '';
                                const isLong = plainText.length > 250;
                                const isExpanded = !!expandedJobs[job.id];

                                return (
                                    <div key={job.id} className="career-job-row">
                                        <div className="job-row-header">
                                            <div className="job-title-group">
                                                <h4>{job.title}</h4>
                                                <span className="job-badge">{job.type}</span>
                                            </div>
                                            <div className="job-meta-group">
                                                <span><i className="fas fa-map-marker-alt"></i> {job.location}</span>
                                                <span><i className="fas fa-briefcase"></i> {job.exp}</span>
                                            </div>
                                        </div>
                                        <div 
                                            className={`job-row-body ${isLong && !isExpanded ? 'collapsed' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: job.desc }}
                                        />
                                        {isLong && (
                                            <button 
                                                type="button" 
                                                onClick={() => toggleJobDesc(job.id)} 
                                                className="read-more-btn"
                                            >
                                                {isExpanded ? 'Read Less' : 'Read More'}
                                                <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <p style={{ textAlign: 'center', color: '#666', fontSize: '15px' }}>Currently, there are no open vacancies. Check back later!</p>
                        )}
                    </div>
                )}
            </section>

            {/* Submission CTA Block */}
            <section className="career-apply-card">
                <div className="apply-card-overlay"></div>
                <div className="apply-card-content">
                    <h3>Ready to design with us?</h3>
                    <p>
                        Send your portfolio (PDF, max 15MB) and resume detailing your design values and site experience to our human resources team.
                    </p>
                    <div className="email-subject-notice">
                        <i className="fas fa-info-circle"></i>
                        <span>
                            Please send email with the subject: <strong>"Application for [Position Name] – [Your Full Name]"</strong>.
                        </span>
                    </div>
                    <a href={`mailto:${careerEmail}?subject=Application%20for%20[Position%20Name]%20%E2%80%93%20[Your%20Full%20Name]`} className="apply-email-btn">
                        <i className="far fa-envelope"></i> APPLY NOW: {careerEmail}
                    </a>
                    <small>Premium Touch is an equal opportunity employer. Selected candidates will be invited for portfolio reviews.</small>
                </div>
            </section>
        </div>
    );
};

export default AboutCareer;

