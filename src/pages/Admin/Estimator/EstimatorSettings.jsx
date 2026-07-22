import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import '../Admin.css';
import { useToast } from '../../../context/ToastContext';

const EstimatorSettings = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState({
        pdf_title: 'Home Interior Cost Estimate',
        pdf_footer_text: '',
        pdf_terms_conditions: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/estimator/settings');
            if (res.data) {
                setSettings({
                    pdf_title: res.data.pdf_title || 'Home Interior Cost Estimate',
                    pdf_footer_text: res.data.pdf_footer_text || '',
                    pdf_terms_conditions: res.data.pdf_terms_conditions || ''
                });
            }
        } catch (err) {
            console.error("Failed to load PDF settings:", err);
            toast.error('Failed to load PDF template settings.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        if (!settings.pdf_title.trim()) {
            toast.error('PDF Title is required.');
            setSaving(false);
            return;
        }

        try {
            const formDataObj = new FormData();
            formDataObj.append('pdf_title', settings.pdf_title);
            formDataObj.append('pdf_footer_text', settings.pdf_footer_text || '');
            formDataObj.append('pdf_terms_conditions', settings.pdf_terms_conditions || '');

            const res = await api.post('/admin/estimator/settings', formDataObj, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('PDF template settings saved successfully.');
            if (res.data?.settings) {
                setSettings(prev => ({ ...prev, ...res.data.settings }));
            }
        } catch (err) {
            console.error("Failed to update PDF settings:", err);
            toast.error(err.response?.data?.message || 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-page-container">
            {/* Page Header */}
            <div className="admin-page-header" style={{ marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <i className="fas fa-file-pdf" style={{ color: 'var(--admin-gold)' }}></i>
                        PDF Invoice & Template Settings
                    </h1>
                    <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
                        Customize the output formatting of client-downloadable interior cost estimates (PDF Title, Footer note, and Terms & Conditions).
                    </p>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <i className="fas fa-spinner fa-spin fa-2x mb-3" style={{ color: 'var(--admin-gold)' }}></i>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Loading PDF configurations...</p>
                </div>
            ) : (
                <div className="admin-card" style={{ maxWidth: '900px', background: '#ffffff', borderRadius: '16px', padding: '36px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderTop: '5px solid var(--admin-gold)' }}>
                    
                    {/* Card Title Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', marginBottom: '24px', borderBottom: '2px solid #f1f5f9' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fas fa-sliders-h" style={{ color: 'var(--admin-gold)' }}></i> Configure PDF Template Options
                            </h3>
                        </div>
                        <span style={{ background: '#fef3c7', color: '#b45309', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fas fa-check-circle"></i> Active Template Engine
                        </span>
                    </div>

                    {/* Site Settings Auto-Sync Info Banner */}
                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 18px', border: '1px solid #e2e8f0', borderLeft: '4px solid #0284c7', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <i className="fas fa-sync-alt" style={{ color: '#0284c7', fontSize: '1.1rem' }}></i>
                        <p style={{ margin: 0, fontSize: '0.86rem', color: '#334155', lineHeight: '1.5' }}>
                            <strong>Auto-Synced Branding:</strong> Company Name, Office Address, Hotline Phone, and Brand Logo automatically pull from main <strong>Site Settings</strong>.
                        </p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="admin-form">
                        
                        {/* Section 1: PDF Title / Header */}
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b', fontSize: '0.92rem' }}>
                                PDF Title / Document Heading <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                className="admin-input"
                                value={settings.pdf_title}
                                onChange={(e) => setSettings({ ...settings, pdf_title: e.target.value })}
                                placeholder="e.g. Home Interior Cost Estimate"
                                required
                                style={{ width: '100%', padding: '13px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.95rem', color: '#0f172a', boxSizing: 'border-box' }}
                            />
                        </div>

                        {/* Section 2: Footer Text */}
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b', fontSize: '0.92rem' }}>
                                PDF Footer Message / Thank You Text
                            </label>
                            <input
                                type="text"
                                className="admin-input"
                                value={settings.pdf_footer_text}
                                onChange={(e) => setSettings({ ...settings, pdf_footer_text: e.target.value })}
                                placeholder="e.g. Thank you for choosing Premium Touch. We transform houses into premium homes."
                                style={{ width: '100%', padding: '13px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.95rem', color: '#0f172a', boxSizing: 'border-box' }}
                            />
                        </div>

                        {/* Section 3: Terms & Conditions */}
                        <div className="form-group" style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b', fontSize: '0.92rem' }}>
                                Terms & Conditions (Printed at the bottom of the estimate)
                            </label>
                            <textarea
                                className="admin-textarea"
                                value={settings.pdf_terms_conditions}
                                onChange={(e) => setSettings({ ...settings, pdf_terms_conditions: e.target.value })}
                                placeholder="List standard disclaimers, validity limits, or item inclusions line-by-line..."
                                rows="6"
                                style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.92rem', color: '#0f172a', lineHeight: '1.6', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                            ></textarea>
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <i className="fas fa-info-circle" style={{ color: 'var(--admin-gold)' }}></i> Tip: Enter each disclaimer point on a new line to render clean bullet points on the printed PDF.
                            </p>
                        </div>

                        {/* Form Actions */}
                        <div style={{ paddingTop: '20px', borderTop: '2px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                type="submit" 
                                className="admin-btn-primary" 
                                disabled={saving}
                                style={{ padding: '12px 36px', fontSize: '0.96rem', borderRadius: '10px', background: 'linear-gradient(135deg, #c9a45c, #b6934d)', color: '#fff', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(201, 164, 92, 0.3)' }}
                            >
                                {saving ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i> Saving Settings...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-save"></i> Save PDF Template Settings
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default EstimatorSettings;
