import React, { useState, useEffect } from 'react';
import api, { BASE_URL, clearClientCache } from '../../api/axios';
import './Admin.css';

const SettingsManager = () => {
    const [settings, setSettings] = useState({
        site_name: '',
        tagline: '',
        short_description: '',
        phone: '',
        email: '',
        address: '',
        map_url: '',
        map_embed_url: '',
        facebook_page_url: '',
        logo: '',
        header_bg: '',
        cta_bg: '',
        stat_1_num: '',
        stat_1_label: '',
        stat_2_num: '',
        stat_2_label: '',
        stat_3_num: '',
        stat_3_label: '',
        stat_4_num: '',
        stat_4_label: ''
    });
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [headerBg, setHeaderBg] = useState(null);
    const [headerPreview, setHeaderPreview] = useState(null);
    const [ctaBg, setCtaBg] = useState(null);
    const [ctaBgPreview, setCtaBgPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);

    // Dynamic root for uploads (matches Navbar.jsx logic)
    const getUploadUrl = (type, filename) => {
        if (!filename) return null;
        const root = BASE_URL.replace('/api', '');

        // We try to be robust: check if it's already a full URL or starts with /
        if (filename.startsWith('http') || filename.startsWith('data:')) return filename;

        // Return path based on standard Laravel public uploads
        return `${root}/public/uploads/${type}/${filename}`;
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/site-info');
            const data = res.data;
            setSettings(data);

            if (data.logo) {
                setLogoPreview(getUploadUrl('logo', data.logo));
            }
            if (data.header_bg) {
                setHeaderPreview(getUploadUrl('header', data.header_bg));
            }
            if (data.cta_bg) {
                setCtaBgPreview(getUploadUrl('cta', data.cta_bg));
            }
        } catch (err) {
            console.error("Error fetching settings:", err);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogo(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleHeaderChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setHeaderBg(file);
            setHeaderPreview(URL.createObjectURL(file));
        }
    };

    const handleCtaBgChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCtaBg(file);
            setCtaBgPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();

        // Only append text settings
        Object.keys(settings).forEach(key => {
            if (key !== 'logo' && key !== 'header_bg' && key !== 'cta_bg' && key !== 'updated_at' && key !== 'created_at' && key !== 'id') {
                data.append(key, settings[key] || '');
            }
        });

        if (logo) data.append('logo', logo);
        if (headerBg) data.append('header_bg', headerBg);
        if (ctaBg) data.append('cta_bg', ctaBg);

        try {
            await api.post('/site-info', data);
            clearClientCache();
            setAlert({ type: 'success', msg: 'Global settings updated successfully!' });
            // Clear local file state after success but keep previews until refresh
            setLogo(null);
            setHeaderBg(null);
            setCtaBg(null);
            fetchSettings();
        } catch (err) {
            console.error("Error saving settings:", err);
            setAlert({ type: 'error', msg: 'Failed to update settings.' });
        } finally {
            setLoading(false);
            window.scrollTo(0, 0);
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Site Configuration</h1>
                    <p>Manage global branding, contact details, and technical integrations.</p>
                </div>
            </div>

            {alert && (
                <div className={`admin-alert alert-${alert.type}`}>
                    {alert.msg}
                    <button className="close-alert" onClick={() => setAlert(null)}>&times;</button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="admin-form-card">
                <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    <div className="settings-left">
                        <h3>Branding & Identity</h3>
                        <div className="form-group">
                            <label>Studio Name</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={settings.site_name}
                                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Professional Tagline</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={settings.tagline}
                                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Short Studio Description</label>
                            <textarea
                                className="admin-textarea"
                                rows="3"
                                value={settings.short_description}
                                onChange={(e) => setSettings({ ...settings, short_description: e.target.value })}
                            ></textarea>
                        </div>

                        <div className="form-group" style={{ marginTop: '20px' }}>
                            <label>Studio Logo</label>
                            <div className="logo-edit-preview" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div className="preview-box" style={{ width: '120px', height: '120px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', overflow: 'hidden', padding: '10px' }}>
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                            <i className="fas fa-image" style={{ fontSize: '24px' }}></i>
                                            <p style={{ fontSize: '10px', marginTop: '5px' }}>No Logo</p>
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input type="file" onChange={handleLogoChange} className="admin-input" accept="image/*" />
                                    <small style={{ color: '#64748b', display: 'block', marginTop: '5px' }}>Square logo (e.g. 512x512px) works best.</small>
                                </div>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '30px' }}>
                            <label>All Page Header Background</label>
                            <div className="header-edit-preview">
                                <div className="preview-box" style={{ width: '100%', height: '150px', background: '#f1f5f9', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                    {headerPreview ? (
                                        <img src={headerPreview} alt="Header Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                            <i className="fas fa-image" style={{ fontSize: '24px' }}></i>
                                            <p style={{ fontSize: '12px', marginTop: '5px' }}>No Header Image Uploaded</p>
                                        </div>
                                    )}
                                </div>
                                <input type="file" onChange={handleHeaderChange} className="admin-input" accept="image/*" />
                                <small style={{ color: '#64748b', display: 'block', marginTop: '5px' }}>High resolution landscape image (1920x600px+) suggested.</small>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '30px' }}>
                            <label>Call to Action Background</label>
                            <div className="header-edit-preview">
                                <div className="preview-box" style={{ width: '100%', height: '150px', background: '#f1f5f9', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                    {ctaBgPreview ? (
                                        <img src={ctaBgPreview} alt="CTA Background Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                            <i className="fas fa-image" style={{ fontSize: '24px' }}></i>
                                            <p style={{ fontSize: '12px', marginTop: '5px' }}>No CTA Image Uploaded</p>
                                        </div>
                                    )}
                                </div>
                                <input type="file" onChange={handleCtaBgChange} className="admin-input" accept="image/*" />
                                <small style={{ color: '#64748b', display: 'block', marginTop: '5px' }}>Landscape image (1920x600px+) suggested.</small>
                            </div>
                        </div>
                    </div>

                    <div className="settings-right">
                        <h3>Contact & Social Connectivity</h3>
                        <div className="form-group">
                            <label>Office Phone</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={settings.phone}
                                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Official Email</label>
                            <input
                                type="email"
                                className="admin-input"
                                value={settings.email}
                                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Physical Address</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={settings.address}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                            />
                        </div>

                        <div className="form-group" style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
                            <label style={{ color: '#0f172a', fontWeight: 'bold' }}>Facebook Page Plugin URL</label>
                            <input
                                type="text"
                                className="admin-input"
                                placeholder="https://www.facebook.com/yourpage"
                                value={settings.facebook_page_url}
                                style={{ borderColor: '#3b5998' }}
                                onChange={(e) => setSettings({ ...settings, facebook_page_url: e.target.value })}
                            />
                            <small style={{ color: '#64748b', marginTop: '5px', display: 'block' }}>
                                This URL is used to generate the interactive Like Box in the footer area.
                            </small>
                        </div>
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: '30px' }}>
                    <h3>Maps & Location</h3>
                    <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group">
                            <label>Google Maps Embed URL (iframe src)</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={settings.map_embed_url}
                                onChange={(e) => setSettings({ ...settings, map_embed_url: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>External Maps Link (View on Google Maps)</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={settings.map_url}
                                onChange={(e) => setSettings({ ...settings, map_url: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: '30px', padding: '25px', background: '#f8fafc', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#0f172a' }}>Landing Statistics Counters</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>Manage the counter values for the statistics section.</p>

                    <div className="stats-fields-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                        <div style={{ padding: '15px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>Luxury Projects Completed</h4>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>Value (e.g. 250+)</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={settings.stat_1_num || ''}
                                    placeholder="250+"
                                    onChange={(e) => setSettings({ ...settings, stat_1_num: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ padding: '15px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>Years of Design Experience</h4>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>Value (e.g. 15+)</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={settings.stat_2_num || ''}
                                    placeholder="15+"
                                    onChange={(e) => setSettings({ ...settings, stat_2_num: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ padding: '15px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>Client Satisfaction Rate</h4>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>Value (e.g. 98%)</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={settings.stat_3_num || ''}
                                    placeholder="98%"
                                    onChange={(e) => setSettings({ ...settings, stat_3_num: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ padding: '15px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>Design & Architecture Awards</h4>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>Value (e.g. 18+)</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={settings.stat_4_num || ''}
                                    placeholder="18+"
                                    onChange={(e) => setSettings({ ...settings, stat_4_num: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <button type="submit" className="admin-btn-primary" disabled={loading} style={{ marginTop: '30px', width: '200px' }}>
                    {loading ? 'Saving...' : 'Save Configuration'}
                </button>
            </form>
        </div>
    );
};

export default SettingsManager;
