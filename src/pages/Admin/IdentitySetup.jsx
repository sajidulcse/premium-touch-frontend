import React, { useState, useEffect } from 'react';
import './Admin.css';
import api, { getStorageUrl } from '../../api/axios';

const IdentitySetup = () => {
    const [identity, setIdentity] = useState({
        subtitle: 'OUR IDENTITY',
        title: 'Crafting Spaces, Defining Lifestyles',
        description: 'We believe that fine architecture and interior spaces are the physical expressions of personality. Our mission is to blend signature craftsmanship, premium marbles, and elegant warm wood veneers into functional, turnkey layout designs.',
        image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80'
    });
    const [imageFile, setImageFile] = useState(null);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        const fetchIdentity = async () => {
            try {
                const res = await api.get('/home-identity');
                setIdentity(res.data);
            } catch (err) {
                console.error("Failed to fetch identity info:", err);
            }
        };
        fetchIdentity();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!imageFile && !identity.image) {
            setAlert({ type: 'error', msg: 'Please select an image file to upload or enter an image URL.' });
            return;
        }

        const submitData = new FormData();
        submitData.append('subtitle', identity.subtitle);
        submitData.append('title', identity.title);
        submitData.append('description', identity.description);
        submitData.append('image', identity.image || '');
        if (imageFile) {
            submitData.append('image_file', imageFile);
        }

        try {
            const res = await api.post('/home-identity', submitData);
            setIdentity(res.data.identity);
            setImageFile(null);
            const fileInput = document.getElementById('identity-image-file');
            if (fileInput) fileInput.value = '';
            setAlert({ type: 'success', msg: 'Our Identity section updated successfully.' });
        } catch (err) {
            console.error("Failed to save identity info:", err);
            setAlert({ type: 'error', msg: 'Failed to update identity section.' });
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Our Identity Setup</h1>
                    <p>Manage the intro stories, slogan texts, and parallax branding image for the home page welcome section.</p>
                </div>
            </div>

            {alert && (
                <div className={`admin-alert alert-${alert.type}`}>
                    {alert.msg}
                    <button className="close-alert" onClick={() => setAlert(null)}>&times;</button>
                </div>
            )}

            <div className="admin-card editor-main-card" style={{ maxWidth: '800px' }}>
                <h3>Configure Identity Section</h3>
                <form onSubmit={handleSubmit} className="admin-form-inline">
                    <div className="form-group">
                        <label>Section Subtitle</label>
                        <input
                            type="text"
                            className="admin-input"
                            value={identity.subtitle}
                            onChange={(e) => setIdentity({ ...identity, subtitle: e.target.value.toUpperCase() })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Section Slogan Title</label>
                        <input
                            type="text"
                            className="admin-input"
                            value={identity.title}
                            onChange={(e) => setIdentity({ ...identity, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Introductory Paragraph Description</label>
                        <textarea
                            className="admin-input"
                            style={{ height: '140px', resize: 'vertical' }}
                            value={identity.description}
                            onChange={(e) => setIdentity({ ...identity, description: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Upload Side Image</label>
                        <span style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '5px' }}>
                            <strong>Recommended:</strong> 800x1000 px (Aspect ratio 4:5) for parallax side presentation.
                        </span>
                        <input
                            id="identity-image-file"
                            type="file"
                            accept="image/*"
                            className="admin-input"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setImageFile(e.target.files[0]);
                                }
                            }}
                        />
                    </div>

                    <div style={{ textAlign: 'center', margin: '10px 0', color: '#aaa', fontWeight: 600, fontSize: '0.9rem' }}>- OR -</div>

                    <div className="form-group">
                        <label>Parallax Side Image URL</label>
                        <input
                            type="url"
                            className="admin-input"
                            value={identity.image}
                            onChange={(e) => setIdentity({ ...identity, image: e.target.value })}
                            placeholder="e.g. https://images.unsplash.com/photo-..."
                        />
                    </div>

                    {(imageFile || identity.image) && (
                        <div className="form-group">
                            <label>Image Preview</label>
                            <img
                                src={imageFile ? URL.createObjectURL(imageFile) : getStorageUrl(identity.image)}
                                alt="Identity Preview"
                                style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    <div className="form-actions" style={{ marginTop: '20px' }}>
                        <button type="submit" className="admin-btn-primary">
                            <i className="fas fa-save"></i> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IdentitySetup;
