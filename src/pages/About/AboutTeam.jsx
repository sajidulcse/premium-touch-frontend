import React, { useEffect, useState } from 'react';
import api, { getStorageUrl } from '../../api/axios';

const AboutTeam = () => {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/team-members')
            .then(res => {
                setTeam(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching team members:", err);
                setLoading(false);
            });
    }, []);

    const executives = team.filter(member => member.is_executive);
    const collaborators = team.filter(member => !member.is_executive);

    if (loading) {
        return (
            <div className="about-team-wrapper" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="admin-loading-spinner" style={{ border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #d4af37', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="about-team-wrapper">
            {/* Spotlight Leader Section - Two Equal Positions */}
            {executives.length > 0 && (
                <section className="leadership-section">
                    <div className="section-header-centered">
                        <span className="section-subtitle">EXECUTIVE DIRECTION</span>
                        <h2 className="section-title">Creative & Executive Leadership</h2>
                        <div className="section-line"></div>
                    </div>

                    <div className="leadership-grid">
                        {executives.map((leader) => (
                            <div key={leader.id} className="leader-profile-card">
                                <div className="leader-image-box">
                                    <img 
                                        src={getStorageUrl(leader.image)} 
                                        alt={`${leader.name} - ${leader.role}`} 
                                        className="leader-img"
                                        loading="lazy"
                                    />
                                    <div className="leader-img-overlay"></div>
                                </div>
                                <div className="leader-info-box">
                                    <span className="leader-role-badge">{leader.role}</span>
                                    <h3 className="leader-name">{leader.name}</h3>
                                    <div className="leader-divider"></div>
                                    {leader.quote && (
                                        <p className="leader-quote">
                                            "{leader.quote}"
                                        </p>
                                    )}
                                    <p className="leader-bio">
                                        {leader.desc}
                                    </p>
                                    <div className="leader-socials">
                                        {leader.linkedin && <a href={leader.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn"><i className="fab fa-linkedin-in"></i></a>}
                                        {leader.instagram && <a href={leader.instagram} target="_blank" rel="noopener noreferrer" title="Instagram"><i className="fab fa-instagram"></i></a>}
                                        {leader.facebook && <a href={leader.facebook} target="_blank" rel="noopener noreferrer" title="Facebook"><i className="fab fa-facebook-f"></i></a>}
                                        {leader.email && <a href={`mailto:${leader.email}`} title="Email"><i className="fas fa-envelope"></i></a>}
                                        {leader.website && <a href={leader.website} target="_blank" rel="noopener noreferrer" title="Portfolio"><i className="fas fa-globe"></i></a>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Design Team Grid */}
            <section className="team-grid-section">
                <div className="section-header-centered">
                    <span className="section-subtitle">THE COLLABORATORS</span>
                    <h2 className="section-title">Our Design Studio Team</h2>
                    <div className="section-line"></div>
                </div>

                <div className="team-cards-grid">
                    {collaborators.length > 0 ? (
                        collaborators.map((member) => (
                            <div key={member.id} className="team-card">
                                <div className="team-card-image-wrap">
                                    {member.image ? (
                                        <img src={getStorageUrl(member.image)} alt={member.name} className="team-card-img" loading="lazy" />
                                    ) : (
                                        <div className="team-card-img-placeholder" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', color: '#666' }}>
                                            <i className="fas fa-user-tie" style={{ fontSize: '3rem' }}></i>
                                        </div>
                                    )}
                                </div>
                                <div className="team-card-content">
                                    <h4>{member.name}</h4>
                                    <span className="team-card-role">{member.role}</span>
                                    <p>{member.desc}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-members-text" style={{ textAlign: 'center', width: '100%', color: '#999', gridColumn: '1 / -1' }}>No collaborators added yet.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default AboutTeam;

