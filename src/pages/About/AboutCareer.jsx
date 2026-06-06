import React from 'react';

const AboutCareer = () => {
    const openings = [
        {
            title: "Senior Interior Architect",
            type: "Full-Time",
            location: "Dhaka, BD (On-site)",
            exp: "5+ Years",
            desc: "Lead residential and triplex/duplex layout projects. Create material schedules, supervise visualization accuracy, and guide implementation detailing."
        },
        {
            title: "3D Visualizer & Render Specialist",
            type: "Full-Time",
            location: "Dhaka, BD (On-site)",
            exp: "3+ Years",
            desc: "Develop photorealistic renders, walkthrough animations, and lighting simulations using 3ds Max/V-Ray/Lumion for high-end clients."
        },
        {
            title: "Site Execution Supervisor",
            type: "Full-Time",
            location: "Dhaka, BD (Field-based)",
            exp: "2+ Years",
            desc: "Coordinate vendor timelines, audit material delivery quality at sites, monitor wood fabrication/marble fittings, and prepare progress logs."
        }
    ];

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
                
                <div className="career-openings-list">
                    {openings.map((job, idx) => (
                        <div key={idx} className="career-job-row">
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
                            <div className="job-row-body">
                                <p>{job.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Submission CTA Block */}
            <section className="career-apply-card">
                <div className="apply-card-overlay"></div>
                <div className="apply-card-content">
                    <h3>Ready to design with us?</h3>
                    <p>
                        Send your portfolio (PDF, max 15MB) and resume detailing your design values and site experience to our human resources team.
                    </p>
                    <a href="mailto:career@premiumtouchbd.com" className="apply-email-btn">
                        <i className="far fa-envelope"></i> APPLY NOW: career@premiumtouchbd.com
                    </a>
                    <small>Premium Touch is an equal opportunity employer. Selected candidates will be invited for portfolio reviews.</small>
                </div>
            </section>
        </div>
    );
};

export default AboutCareer;
