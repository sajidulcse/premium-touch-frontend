import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getStorageUrl, BASE_URL, getSiteInfo } from '../../api/axios';
import './Contact.css';

const Contact = () => {
    const [siteInfo, setSiteInfo] = useState({
        logo: '',
        site_name: 'Premium Touch',
        phone: '',
        email: '',
        address: 'Dhaka, Bangladesh',
        tagline: '',
        map_embed_url: '',
        map_url: ''
    });
    const [loadingInfo, setLoadingInfo] = useState(true);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
        // Honeypot field for bot spam prevention
        website_spam_check: ''
    });
    
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'

    useEffect(() => {
        fetchSiteInfo();
    }, []);

    useEffect(() => {
        if (window.location.hash === '#contact-form') {
            setTimeout(() => {
                const element = document.getElementById('contact-form');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        } else {
            window.scrollTo(0, 0);
        }
    }, [window.location.hash]);

    const fetchSiteInfo = async () => {
        try {
            const data = await getSiteInfo();
            if (data) {
                setSiteInfo(data);
            }
        } catch (err) {
            console.error("Error fetching site info:", err);
        } finally {
            setLoadingInfo(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Full name is required';
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email address is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^[0-9+\s-]{8,15}$/.test(formData.phone.trim())) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        if (!formData.message.trim()) {
            newErrors.message = 'Please share some details about your project';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 1. Bot spam prevention check (Honeypot)
        if (formData.website_spam_check) {
            console.warn("Spam detected!");
            setSubmitStatus('success'); // Silently pretend success to confuse bots
            return;
        }

        if (!validateForm()) return;

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            // Since there is no dedicated contact resource in the backend API yet,
            // we simulate a secure and fast API submission.
            // When a backend route is ready, this can simply do: await api.post('/contact', formData)
            await new Promise((resolve) => setTimeout(resolve, 800));
            
            setSubmitStatus('success');
            setFormData({
                name: '',
                email: '',
                phone: '',
                message: '',
                website_spam_check: ''
            });
        } catch (err) {
            console.error("Error submitting contact form:", err);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const phoneNumber = siteInfo.phone || '+880 1711-223344';
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const emailAddress = siteInfo.email || 'contact@premiumtouch.com';
    const studioAddress = siteInfo.address || 'House 25, Road 11, Banani, Dhaka, Bangladesh';

    const getHeaderBgUrl = () => {
        if (loadingInfo) {
            return null;
        }
        if (siteInfo?.header_bg) {
            const root = BASE_URL.replace(/\/api$/, '');
            return `${root}/public/uploads/header/${siteInfo.header_bg}`;
        }
        return '/photo/contact_hero.png';
    };

    const headerBgUrl = getHeaderBgUrl();
    const headerStyle = headerBgUrl
        ? { backgroundImage: `url(${headerBgUrl})` }
        : {};

    return (
        <div className="contact-page-wrapper">
            {/* Hero Section */}
            <section className="contact-hero pl-hero">
                <div className="contact-hero-bg pl-hero-bg" style={headerStyle}></div>
                <div className="contact-hero-overlay pl-hero-overlay"></div>
                <div className="contact-hero-content pl-hero-content">
                    <span className="contact-subtitle pl-hero-subtitle">GET IN TOUCH</span>
                    <h1 className="contact-title pl-hero-title">Let's Design Your Vision</h1>
                    <div className="contact-breadcrumb pl-hero-breadcrumb">
                        <Link to="/">Home</Link>
                        <span className="bc-sep">/</span>
                        <span className="current-page">Contact</span>
                    </div>
                </div>
            </section>

            {/* Main Content Area */}
            <div className="contact-container">
                <div className="contact-grid">
                    
                    {/* Left: Studio Info */}
                    <div className="contact-info-section">
                        <div className="contact-info-header">
                            <h2>Our Office</h2>
                            <p>We welcome you to visit our creative space to explore materials, view blueprints, and start your architectural journey.</p>
                        </div>

                        <div className="contact-details-list">
                            <div className="info-item">
                                <div className="info-icon"><i className="fas fa-map-marker-alt"></i></div>
                                <div className="info-content">
                                    <h3>Office Address</h3>
                                    <p>{studioAddress}</p>
                                </div>
                            </div>

                            <a href={`tel:${cleanPhone}`} className="info-item clickable">
                                <div className="info-icon"><i className="fas fa-phone-alt"></i></div>
                                <div className="info-content">
                                    <h3>Call Us</h3>
                                    <p>{phoneNumber}</p>
                                </div>
                            </a>

                            <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noreferrer" className="info-item clickable whatsapp">
                                <div className="info-icon"><i className="fab fa-whatsapp"></i></div>
                                <div className="info-content">
                                    <h3>WhatsApp</h3>
                                    <p>Connect with a expert</p>
                                </div>
                            </a>

                            <a href={`mailto:${emailAddress}`} className="info-item clickable">
                                <div className="info-icon"><i className="far fa-envelope"></i></div>
                                <div className="info-content">
                                    <h3>Email Address</h3>
                                    <p>{emailAddress}</p>
                                </div>
                            </a>

                            <div className="info-item">
                                <div className="info-icon"><i className="far fa-clock"></i></div>
                                <div className="info-content">
                                    <h3>Office Hours</h3>
                                    <p>Saturday – Thursday: 10:00 AM – 8:00 PM</p>
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        {(siteInfo.facebook_page_url || siteInfo.instagram_page_url || siteInfo.linkedin_page_url) && (
                            <div className="contact-socials">
                                <h3>Follow Our Narrative</h3>
                                <div className="social-icons">
                                    {siteInfo.facebook_page_url && (
                                        <a href={siteInfo.facebook_page_url} target="_blank" rel="noreferrer" className="facebook">
                                            <i className="fab fa-facebook-f"></i>
                                        </a>
                                    )}
                                    {siteInfo.instagram_page_url && (
                                        <a href={siteInfo.instagram_page_url} target="_blank" rel="noreferrer" className="instagram">
                                            <i className="fab fa-instagram"></i>
                                        </a>
                                    )}
                                    {siteInfo.linkedin_page_url && (
                                        <a href={siteInfo.linkedin_page_url} target="_blank" rel="noreferrer" className="linkedin">
                                            <i className="fab fa-linkedin-in"></i>
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Luxury Form */}
                    <div className="contact-form-section" id="contact-form">
                        <div className="form-card">
                            <div className="form-header">
                                <h2>Begin Your Journey</h2>
                                <p>Have a question or a project idea in mind? Drop us a line below, and our design team will connect with you shortly.</p>
                            </div>

                            {submitStatus === 'success' ? (
                                <div className="submit-success-state">
                                    <div className="success-icon"><i className="fas fa-envelope-open-text"></i></div>
                                    <h3>Message Received</h3>
                                    <p>Thank you for reaching out to Premium Touch. Our studio design representative will contact you within 24 hours to schedule your free consultation.</p>
                                    <button onClick={() => setSubmitStatus(null)} className="btn-success-reset">Send Another Message</button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="luxury-form" noValidate>
                                    {/* Honeypot hidden input for anti-spam bots */}
                                    <input 
                                        type="text" 
                                        name="website_spam_check" 
                                        value={formData.website_spam_check}
                                        onChange={handleInputChange}
                                        style={{ display: 'none' }}
                                        tabIndex="-1"
                                        autoComplete="off"
                                    />

                                    {submitStatus === 'error' && (
                                        <div className="submit-error-alert">
                                            <i className="fas fa-exclamation-circle"></i>
                                            <span>Failed to submit. Please verify details and try again.</span>
                                        </div>
                                    )}

                                    <div className="form-group-row">
                                        <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
                                            <label htmlFor="name">Full Name</label>
                                            <input 
                                                type="text" 
                                                id="name"
                                                name="name" 
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="e.g. John Doe"
                                                required
                                            />
                                            {errors.name && <span className="error-message">{errors.name}</span>}
                                        </div>

                                        <div className={`form-group ${errors.phone ? 'has-error' : ''}`}>
                                            <label htmlFor="phone">Phone Number</label>
                                            <input 
                                                type="tel" 
                                                id="phone"
                                                name="phone" 
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="e.g. +880 1711000000"
                                                required
                                            />
                                            {errors.phone && <span className="error-message">{errors.phone}</span>}
                                        </div>
                                    </div>

                                    <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
                                        <label htmlFor="email">Email Address</label>
                                        <input 
                                            type="email" 
                                            id="email"
                                            name="email" 
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="e.g. john@example.com"
                                            required
                                        />
                                        {errors.email && <span className="error-message">{errors.email}</span>}
                                    </div>

                                    <div className={`form-group ${errors.message ? 'has-error' : ''}`}>
                                        <label htmlFor="message">Any questions about your project?</label>
                                        <textarea 
                                            id="message"
                                            name="message" 
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            placeholder="Ask us anything! Feel free to share a question, an idea, or describe your vision here..."
                                            rows="5"
                                            required
                                        ></textarea>
                                        {errors.message && <span className="error-message">{errors.message}</span>}
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="form-submit-btn"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner"></span>
                                                <span>Sending Message...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>SUBMIT ENQUIRY</span>
                                                <i className="fas fa-long-arrow-alt-right"></i>
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Monochrome Map Placement */}
            {siteInfo.map_embed_url && (
                <div className="contact-map-section">
                    <div 
                        className="map-overlay" 
                        onClick={() => siteInfo.map_url && window.open(siteInfo.map_url, "_blank")}
                        style={{ cursor: siteInfo.map_url ? 'pointer' : 'default' }}
                    >
                        <div className="map-label">
                            <i className="fas fa-compass"></i>
                            <span>DHAKA OFFICE</span>
                        </div>
                    </div>
                    {/* Dynamic Google Map Embed */}
                    <iframe 
                        title="Studio Map"
                        src={siteInfo.map_embed_url}
                        width="100%" 
                        height="300" 
                        style={{ border: 0 }} 
                        allowFullScreen="" 
                        loading="lazy"
                    ></iframe>
                </div>
            )}
        </div>
    );
};

export default Contact;
