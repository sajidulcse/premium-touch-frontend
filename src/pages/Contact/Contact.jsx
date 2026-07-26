import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getSiteInfo, BASE_URL, getStorageUrl } from '../../api/axios';
import SEO from '../../components/SEO/SEO';
import { getLocalBusinessSchema, getBreadcrumbSchema } from '../../utils/seoSchemas';
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
    const [fields, setFields] = useState([]);
    const [formData, setFormData] = useState({ website_spam_check: '' });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'
    const [loadingFields, setLoadingFields] = useState(true);

    useEffect(() => {
        fetchSiteInfo();
        fetchActiveFields();
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

    const fetchActiveFields = async () => {
        try {
            const res = await api.get('/form-fields/active');
            setFields(res.data);
            const initialForm = { website_spam_check: '' };
            res.data.forEach(field => {
                initialForm[field.field_name] = '';
            });
            setFormData(initialForm);
        } catch (err) {
            console.error("Failed to load active form fields:", err);
        } finally {
            setLoadingFields(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        fields.forEach(field => {
            const val = String(formData[field.field_name] || '').trim();
            if (field.is_required && !val) {
                newErrors[field.field_name] = `${field.label} is required`;
            } else if (field.type === 'email' && val && !/\S+@\S+\.\S+/.test(val)) {
                newErrors[field.field_name] = 'Please enter a valid email address';
            } else if (field.type === 'tel' && val && !/^[0-9+\s-]{8,15}$/.test(val)) {
                newErrors[field.field_name] = 'Please enter a valid phone number';
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Honeypot spam check
        if (formData.website_spam_check) {
            console.warn("Spam detected!");
            setSubmitStatus('success');
            return;
        }

        if (!validateForm()) return;

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            await api.post('/consultation-requests', {
                ...formData,
                source: 'contact_page'
            });
            
            setSubmitStatus('success');
            const cleared = { website_spam_check: '' };
            fields.forEach(field => {
                cleared[field.field_name] = '';
            });
            setFormData(cleared);
        } catch (err) {
            console.error("Error submitting contact form:", err);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderField = (field) => {
        const hasErr = errors[field.field_name];
        return (
            <div className={`form-group ${hasErr ? 'has-error' : ''}`} key={field.id}>
                <label htmlFor={`field-${field.field_name}`}>
                    {field.label} {field.is_required && '*'}
                </label>
                {field.type === 'select' ? (
                    <select
                        id={`field-${field.field_name}`}
                        name={field.field_name}
                        value={formData[field.field_name] || ''}
                        onChange={handleInputChange}
                        required={field.is_required}
                    >
                        <option value="">-- Select {field.label} --</option>
                        {field.options?.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                        ))}
                    </select>
                ) : field.type === 'textarea' ? (
                    <textarea
                        id={`field-${field.field_name}`}
                        name={field.field_name}
                        value={formData[field.field_name] || ''}
                        onChange={handleInputChange}
                        placeholder={field.placeholder || ''}
                        rows="5"
                        required={field.is_required}
                    ></textarea>
                ) : (
                    <input
                        id={`field-${field.field_name}`}
                        type={field.type}
                        name={field.field_name}
                        value={formData[field.field_name] || ''}
                        onChange={handleInputChange}
                        placeholder={field.placeholder || ''}
                        required={field.is_required}
                    />
                )}
                {hasErr && <span className="error-message">{hasErr}</span>}
            </div>
        );
    };

    const renderDynamicFields = () => {
        const elements = [];
        let i = 0;
        while (i < fields.length) {
            const field = fields[i];
            if (field.type === 'textarea') {
                elements.push(renderField(field));
                i++;
            } else {
                const nextField = fields[i + 1];
                if (nextField && nextField.type !== 'textarea') {
                    elements.push(
                        <div className="form-group-row" key={`group-${field.id}-${nextField.id}`}>
                            {renderField(field)}
                            {renderField(nextField)}
                        </div>
                    );
                    i += 2;
                } else {
                    elements.push(renderField(field));
                    i++;
                }
            }
        }
        return elements;
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
            return getStorageUrl(`uploads/header/${siteInfo.header_bg}`);
        }
        return '/photo/contact_hero.png';
    };

    const headerBgUrl = getHeaderBgUrl();
    const headerStyle = headerBgUrl
        ? { backgroundImage: `url(${headerBgUrl})` }
        : {};

    return (
        <div className="contact-page-wrapper">
            <SEO 
                title="Contact Us & Book Free Consultation"
                description="Get in touch with Premium Touch Interior Decor Studio. Visit our Banani office, call our design team, or schedule your complimentary interior design consultation."
                canonical="/contact"
                jsonLd={[
                    getLocalBusinessSchema(),
                    getBreadcrumbSchema([
                        { name: 'Home', url: '/' },
                        { name: 'Contact', url: '/contact' }
                    ])
                ]}
            />
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
                            ) : loadingFields ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '10px' }}>
                                    <span className="spinner" style={{ width: '30px', height: '30px', border: '3px solid rgba(197, 160, 89, 0.1)', borderTopColor: '#c5a059', animation: 'spin 1s linear infinite', borderRadius: '50%' }}></span>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>Initializing consultation form...</p>
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
                                        <div className="submit-error-alert" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fef2f2', border: '1px solid #fee2e2', padding: '12px 15px', borderRadius: '8px', color: '#b91c1c', marginBottom: '20px', fontSize: '0.88rem' }}>
                                            <i className="fas fa-exclamation-circle"></i>
                                            <span>Failed to submit. Please verify details and try again.</span>
                                        </div>
                                    )}

                                    {renderDynamicFields()}

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
