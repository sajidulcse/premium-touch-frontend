import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './Admin.css';

const AboutManager = () => {
    const [settings, setSettings] = useState({
        site_name: '',
        tagline: '',
        short_description: ''
    });
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/site-info');
            const data = res.data;
            setSettings({
                site_name: data.site_name || '',
                tagline: data.tagline || '',
                short_description: data.short_description || ''
            });
        } catch (err) {
            console.error("Error fetching settings:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        data.append('site_name', settings.site_name);
        data.append('tagline', settings.tagline);
        data.append('short_description', settings.short_description);

        try {
            await api.post('/site-info', data);
            setAlert({ type: 'success', msg: 'About details updated successfully!' });
            fetchSettings();
        } catch (err) {
            console.error("Error saving about info:", err);
            setAlert({ type: 'error', msg: 'Failed to update about details.' });
        } finally {
            setLoading(false);
            window.scrollTo(0, 0);
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>About Us Management</h1>
                    <p>Configure the branding statements and profile descriptions displayed on the website.</p>
                </div>
            </div>

            {alert && (
                <div className={`admin-alert alert-${alert.type}`}>
                    {alert.msg}
                    <button className="close-alert" onClick={() => setAlert(null)}>&times;</button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="admin-form-card" style={{ maxWidth: '800px' }}>
                <h3>About the Studio</h3>
                <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
                    These statements represent your primary business profile, professional goals, and intro details.
                </p>

                <div className="form-group">
                    <label>Studio Name</label>
                    <input
                        type="text"
                        className="admin-input"
                        value={settings.site_name}
                        onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Tagline</label>
                    <input
                        type="text"
                        className="admin-input"
                        value={settings.tagline}
                        onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                        required
                        placeholder="e.g. Creating Premium Spaces"
                    />
                </div>

                <div className="form-group">
                    <label>Description / Intro text</label>
                    <textarea
                        className="admin-textarea"
                        rows="8"
                        value={settings.short_description}
                        onChange={(e) => setSettings({ ...settings, short_description: e.target.value })}
                        required
                        placeholder="Write a brief overview of your studio, mission, and achievements..."
                    ></textarea>
                </div>

                <button type="submit" className="admin-btn-primary" disabled={loading} style={{ width: '180px', marginTop: '10px' }}>
                    {loading ? 'Saving...' : 'Save Info'}
                </button>
            </form>
        </div>
    );
};

export default AboutManager;
