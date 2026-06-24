import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getStorageUrl, BASE_URL, getSiteInfo } from '../../api/axios';
import './ServiceDetail.css';

const ServiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [siteInfo, setSiteInfo] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeFaq, setActiveFaq] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchServiceData();
    }, [id]);

    const fetchServiceData = async () => {
        setLoading(true);
        try {
            // Fetch site info first (non-blocking)
            try {
                const siteData = await getSiteInfo();
                if (siteData) {
                    setSiteInfo(siteData);
                }
            } catch (siteErr) {
                console.error("Error fetching site info:", siteErr);
            }

            // Fetch service details
            const serviceRes = await api.get(`/services/${id}`);
            if (serviceRes.data) {
                const data = serviceRes.data;
                try {
                    data.faqs = data.faqs ? JSON.parse(data.faqs) : [];
                } catch (e) {
                    data.faqs = [];
                }
                setService(data);
            } else {
                setService(null);
            }
        } catch (err) {
            console.error("Error fetching service data:", err);
            setService(null);
        } finally {
            setLoading(false);
        }
    };

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    if (loading) return (
        <div className="loading-state">
            <div className="loader"></div>
            <div className="loader-text">Loading Services...</div>
        </div>
    );

    if (!service) {
        return (
            <div className="sd-page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '40px 20px' }}>
                <div style={{ 
                    textAlign: 'center', 
                    padding: '60px 40px', 
                    background: '#ffffff', 
                    borderRadius: '8px', 
                    boxShadow: '0 10px 40px rgba(0,0,0,0.04)', 
                    maxWidth: '500px', 
                    width: '100%'
                }}>
                    <div style={{ fontSize: '48px', color: '#c5a880', marginBottom: '20px' }}>
                        <i className="fas fa-drafting-compass"></i>
                    </div>
                    <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', color: '#1a1a1a', marginBottom: '15px' }}>No Services Found</h2>
                    <p style={{ fontSize: '15px', color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
                        This service page currently has no published content. Please check back later or explore our other services.
                    </p>
                    <button 
                        onClick={() => navigate('/services')} 
                        style={{
                            background: '#E85D25',
                            color: '#ffffff',
                            border: 'none',
                            padding: '14px 28px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            transition: 'background 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#d1501c'}
                        onMouseLeave={(e) => e.target.style.background = '#E85D25'}
                    >
                        Explore All Services
                    </button>
                </div>
            </div>
        );
    }

    const phoneNumber = siteInfo.phone || '+1234567890';
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const emailAddress = siteInfo.email || 'contact@premiumtouch.com';

    return (
        <div className="sd-page-wrapper">
            
            <div className="sd-main-container">
                
                {/* Desktop Fixed Left Sidebar */}
                <aside className="sd-fixed-sidebar">
                    <div className="sd-sidebar-inner">
                        <div className="sd-brand-header">
                            <span className="sd-brand-logo">
                                {siteInfo.logo ? (
                                    <img src={`${BASE_URL.replace('/api', '')}/uploads/logo/${siteInfo.logo}`} alt="Logo" style={{ maxHeight: '40px' }} />
                                ) : 'PT.'}
                            </span>
                            <span className="sd-brand-name">{siteInfo.site_name || 'Premium Touch'}</span>
                        </div>

                        <div className="sd-contact-blocks">
                            <p className="sd-lead-text">Ready to transform your space?</p>
                            
                            <a href={`tel:${cleanPhone}`} className="sd-contact-card">
                                <div className="icon-wrapper"><i className="fas fa-phone-alt"></i></div>
                                <div className="contact-details">
                                    <span className="label">Call Us</span>
                                    <span className="value">{phoneNumber}</span>
                                </div>
                            </a>

                            <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noreferrer" className="sd-contact-card whatsapp">
                                <div className="icon-wrapper"><i className="fab fa-whatsapp"></i></div>
                                <div className="contact-details">
                                    <span className="label">WhatsApp</span>
                                    <span className="value">Chat with an expert</span>
                                </div>
                            </a>

                            <a href={`mailto:${emailAddress}`} className="sd-contact-card">
                                <div className="icon-wrapper"><i className="far fa-envelope"></i></div>
                                <div className="contact-details">
                                    <span className="label">Email</span>
                                    <span className="value">{emailAddress}</span>
                                </div>
                            </a>
                        </div>

                        <button className="sd-primary-cta">
                            Book Free Consultation
                        </button>
                    </div>
                </aside>

                {/* Right Side: Scrollable Service Content */}
                <main className="sd-document-area">
                    <div className="sd-document-paper">
                        
                        <header className="sd-doc-header">
                            <span className="sd-service-label">Service Overview</span>
                            <h1 className="sd-doc-title">{service.sub_category?.name || 'Interior Service'}</h1>
                        </header>

                        {service.thumbnail && (
                            <div className="sd-doc-cover">
                                <img src={getStorageUrl(service.thumbnail.image_path)} alt={service.sub_category?.name} />
                            </div>
                        )}

                        <article className="sd-doc-content ql-editor-content">
                            {service.description && (
                                <div 
                                    className="sd-block-paragraph" 
                                    style={{ textAlign: 'justify' }}
                                    dangerouslySetInnerHTML={{ __html: service.description }}
                                />
                            )}
                            
                            {service.faqs && service.faqs.length > 0 && (
                                <div className="sd-service-faqs" style={{ marginTop: '50px' }}>
                                    <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '24px', marginBottom: '20px' }}>Frequently Asked Questions</h3>
                                    <div className="faq-accordion">
                                        {service.faqs.map((faq, index) => (
                                            <div key={index} className={`faq-item ${activeFaq === index ? 'active' : ''}`}>
                                                <button 
                                                    className="faq-question" 
                                                    onClick={() => toggleFaq(index)}
                                                >
                                                    {faq.question}
                                                    <i className={`fas fa-chevron-${activeFaq === index ? 'up' : 'down'}`}></i>
                                                </button>
                                                {activeFaq === index && (
                                                    <div className="faq-answer">
                                                        {faq.answer}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {service.images && service.images.filter(img => !img.is_thumbnail).length > 0 && (
                                <div className="sd-service-gallery" style={{ marginTop: '50px' }}>
                                    <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '24px', marginBottom: '20px' }}>Visual Portfolio</h3>
                                    <div className="sd-gallery-grid">
                                        {service.images.filter(img => !img.is_thumbnail).map((img, idx) => (
                                            <figure key={idx} className="sd-block-image">
                                                <img src={getStorageUrl(img.image_path)} alt="Service detail" loading="lazy" />
                                            </figure>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </article>

                        <div className="sd-doc-footer">
                            <div className="sd-conclusion">
                                <h3>Let's build something extraordinary.</h3>
                                <p>Our team is ready to discuss the possibilities.</p>
                            </div>
                            
                            {/* Mobile Contact Bar */}
                            <div className="sd-mobile-contact-bar">
                                <div className="sd-mobile-actions">
                                    <a href={`tel:${cleanPhone}`} className="m-icon-btn"><i className="fas fa-phone-alt"></i></a>
                                    <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noreferrer" className="m-icon-btn whatsapp"><i className="fab fa-whatsapp"></i></a>
                                    <a href={`mailto:${emailAddress}`} className="m-icon-btn"><i className="far fa-envelope"></i></a>
                                </div>
                                <button className="sd-m-cta-btn">Free Consultation</button>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default ServiceDetail;
