import React, { useState, useEffect } from 'react';
import api, { getSiteInfo } from '../../api/axios';
import './ConsultationModal.css';
import { trackConsultationSubmit, trackWhatsAppClick } from '../../analytics/analyticsService';

const ConsultationModal = ({ isOpen, onClose }) => {
    const [fields, setFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [siteInfo, setSiteInfo] = useState(null);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const [loadingFields, setLoadingFields] = useState(true);

    // Fetch fields dynamically from database on mount to eliminate modal launch lag

    useEffect(() => {
        api.get('/form-fields/active')
            .then(res => {
                setFields(res.data);
                // Initialize dynamic form values
                const initialForm = {};
                res.data.forEach(field => {
                    initialForm[field.field_name] = '';
                });
                setFormData(initialForm);
                setLoadingFields(false);
            })
            .catch(err => {
                console.error("Failed to load active form fields:", err);
                setSubmitError('Failed to initialize consultation form.');
                setLoadingFields(false);
            });

        getSiteInfo().then(data => setSiteInfo(data)).catch(console.error);
    }, []);

    // Reset form errors and responses when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setSuccess(false);
            setSubmitError('');
            setErrors({});
            setFormData(prev => {
                const cleared = {};
                fields.forEach(field => {
                    cleared[field.field_name] = '';
                });
                return cleared;
            });
        }
    }, [isOpen, fields]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

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
        if (!validateForm()) return;

        setIsSubmitting(true);
        setSubmitError('');

        // Track consultation submit on client (GTM & Meta Pixel Lead event) & generate eventId for CAPI deduplication
        const eventId = trackConsultationSubmit(formData);

        try {
            await api.post('/consultation-requests', {
                ...formData,
                source: 'cta_modal',
                event_id: eventId
            });
            setSuccess(true);
            // Reset dynamic fields
            const resetForm = {};
            fields.forEach(field => {
                resetForm[field.field_name] = '';
            });
            setFormData(resetForm);
        } catch (err) {
            console.error("Consultation submit error:", err);
            setSubmitError(err.response?.data?.message || 'Failed to submit inquiry. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };


    const renderField = (field, className) => {
        const hasErr = errors[field.field_name];
        return (
            <div className={`${className} ${hasErr ? 'has-error' : ''}`} key={field.id}>
                <label htmlFor={`modal-field-${field.field_name}`}>{field.label} {field.is_required && '*'}</label>
                {field.type === 'select' ? (
                    <select
                        id={`modal-field-${field.field_name}`}
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
                        id={`modal-field-${field.field_name}`}
                        name={field.field_name}
                        value={formData[field.field_name] || ''}
                        onChange={handleInputChange}
                        placeholder={field.placeholder || ''}
                        rows="2"
                        required={field.is_required}
                    ></textarea>
                ) : (
                    <input
                        id={`modal-field-${field.field_name}`}
                        type={field.type}
                        name={field.field_name}
                        value={formData[field.field_name] || ''}
                        onChange={handleInputChange}
                        placeholder={field.placeholder || ''}
                        required={field.is_required}
                    />
                )}
                {hasErr && <span className="error-text">{hasErr}</span>}
            </div>
        );
    };

    const renderDynamicFields = () => {
        const elements = [];
        let i = 0;
        while (i < fields.length) {
            const field = fields[i];
            if (field.type === 'textarea') {
                elements.push(renderField(field, 'form-field-group textarea-full-width'));
                i++;
            } else {
                const nextField = fields[i + 1];
                if (nextField && nextField.type !== 'textarea') {
                    elements.push(
                        <div className="form-double-col" key={`group-${field.id}-${nextField.id}`}>
                            {renderField(field, 'form-field-group')}
                            {renderField(nextField, 'form-field-group')}
                        </div>
                    );
                    i += 2;
                } else {
                    elements.push(renderField(field, 'form-field-group'));
                    i++;
                }
            }
        }
        return elements;
    };

    const phoneNumber = siteInfo?.phone || '+880 1711-223344';
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');

    return (
        <div className="consultation-modal-overlay" onClick={onClose}>
            <div className="consultation-modal-box" onClick={(e) => e.stopPropagation()}>
                <button className="consultation-modal-close" onClick={onClose} aria-label="Close modal">
                    <i className="fas fa-times"></i>
                </button>

                {success ? (
                    <div className="consultation-success-state">
                        <div className="success-icon-wrap">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <h3>Inquiry Received</h3>
                        <p className="success-message-text">
                            Thank you! Your consultation request has been submitted successfully. Our team will contact you soon.
                        </p>
                        <button onClick={onClose} className="modal-close-btn">Close Window</button>
                    </div>
                ) : loadingFields ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '250px', gap: '15px' }}>
                        <span className="modal-spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(197, 160, 89, 0.1)', borderTopColor: '#c5a059' }}></span>
                        <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem' }}>Initializing premium consultation desk...</p>
                    </div>
                ) : (
                    fields.length === 0 ? (
                        <div className="consultation-success-state">
                            <div className="success-icon-wrap" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                                <i className="fas fa-info-circle" style={{ color: '#ef4444' }}></i>
                            </div>
                            <h3>Booking Offline</h3>
                            <p className="success-message-text">
                                Our online consultation booking is currently offline. Please reach out to us directly via Phone or WhatsApp.
                            </p>
                            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer" className="modal-whatsapp-link" style={{ padding: '10px 20px', textDecoration: 'none' }}>
                                    <i className="fab fa-whatsapp"></i> WhatsApp Us
                                </a>
                                <button onClick={onClose} className="modal-close-btn" style={{ marginTop: 0 }}>Close</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="consultation-modal-header">
                                <span className="modal-badge-free">FREE CONSULTATION</span>
                                <h2>Start Your Signature Project</h2>
                                <p>Collaborate with Premium Touch to bring signature craftsmanship and luxury design details to your property.</p>
                            </div>

                            {submitError && (
                                <div className="consultation-error-alert">
                                    <i className="fas fa-exclamation-circle"></i>
                                    <span>{submitError}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="consultation-form-element">
                                
                                {renderDynamicFields()}

                                <div className="consultation-modal-actions">
                                    <button type="submit" className="consultation-submit-button" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <span className="modal-spinner"></span>
                                                <span>Submitting Inquiry...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>SEND INQUIRY</span>
                                                <i className="fas fa-long-arrow-alt-right"></i>
                                            </>
                                        )}
                                    </button>
                                    <div className="modal-whatsapp-separator">
                                        <span>Or reach us directly on</span>
                                        <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer" className="modal-whatsapp-link" onClick={() => trackWhatsAppClick('consultation_modal')}>
                                            <i className="fab fa-whatsapp"></i> WhatsApp Us
                                        </a>
                                    </div>
                                </div>
                            </form>
                        </>
                    )
                )}
            </div>
        </div>
    );
};

export default ConsultationModal;
