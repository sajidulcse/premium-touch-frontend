import React from 'react';

const AboutTeam = () => {
    const teamMembers = [
        {
            name: "Sarah Kabir",
            role: "Principal Interior Architect",
            desc: "Focuses on commercial developments, spatial flows, and custom layout styling.",
            icon: "fa-project-diagram"
        },
        {
            name: "Rakib Hassan",
            role: "Senior 3D Visualizer & Modeler",
            desc: "Expert in photorealistic engine renders, lightning blueprints, and material simulations.",
            icon: "fa-vr-cardboard"
        },
        {
            name: "Maria Ahmed",
            role: "Bespoke Furniture Designer",
            desc: "Curates custom cabinets, wood joinery details, and soft furnishing textures.",
            icon: "fa-chair"
        },
        {
            name: "Tanvir Rahman",
            role: "Lead Site Execution Engineer",
            desc: "Supervises turnkey installations, vendor timelines, and site detailing quality.",
            icon: "fa-hard-hat"
        }
    ];

    return (
        <div className="about-team-wrapper">
            {/* Spotlight Leader Section */}
            <section className="team-spotlight-section">
                <div className="spotlight-content-box">
                    <span className="spotlight-subtitle">CREATIVE DIRECTION</span>
                    <h2 className="spotlight-title">Creative Leadership</h2>
                    <div className="spotlight-line"></div>
                    <p className="spotlight-quote">
                        "Great interior architecture is not just about choosing colors or premium fabrics. It is about understanding the physical rhythm of human lives inside a structure and molding materials to elevate that experience."
                    </p>
                    <div className="spotlight-leader-info">
                        <h4>Tasnim Alam Chowdhury</h4>
                        <p>Founder & Principal Creative Director</p>
                    </div>
                    <p className="spotlight-bio">
                        With over 12 years of experience leading projects across residential, office, and hospitality sectors, Tasnim guides the aesthetic vision and quality standards of Premium Touch Studio. She collaborates closely with clients to shape bespoke narratives.
                    </p>
                </div>
                <div className="spotlight-image-box">
                    <img 
                        src="/photo/about_creator.png" 
                        alt="Tasnim Alam - Creative Director" 
                        className="spotlight-img"
                        loading="lazy"
                    />
                    <div className="spotlight-img-overlay"></div>
                </div>
            </section>

            {/* Design Team Grid */}
            <section className="team-grid-section">
                <div className="section-header-centered">
                    <span className="section-subtitle">THE COLLABORATORS</span>
                    <h2 className="section-title">Our Design Studio Team</h2>
                    <div className="section-line"></div>
                </div>

                <div className="team-cards-grid">
                    {teamMembers.map((member, idx) => (
                        <div key={idx} className="team-card">
                            <div className="team-card-icon-wrap">
                                <i className={`fas ${member.icon}`}></i>
                            </div>
                            <div className="team-card-content">
                                <h4>{member.name}</h4>
                                <span className="team-card-role">{member.role}</span>
                                <p>{member.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default AboutTeam;
