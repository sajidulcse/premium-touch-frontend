import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getStorageUrl } from '../../api/axios';
import './Admin.css';

const PortfolioEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [portfolio, setPortfolio] = useState({
        title: '',
        description: '',
        status: 'published',
        category_id: '',
        sub_category_id: '',
        child_category_id: ''
    });
    const [categories, setCategories] = useState([]);
    const [images, setImages] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(!!id);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        fetchCategories();
        if (id) {
            fetchPortfolioDetail();
        }
    }, [id]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPortfolioDetail = async () => {
        setDataLoading(true);
        try {
            const res = await api.get(`/admin-portfolios/${id}`);
            const data = res.data;
            if (data) {
                setPortfolio({
                    title: data.title || '',
                    description: data.description || '',
                    status: data.status || 'published',
                    category_id: data.category_id ? data.category_id.toString() : '',
                    sub_category_id: data.sub_category_id ? data.sub_category_id.toString() : '',
                    child_category_id: data.child_category_id ? data.child_category_id.toString() : ''
                });
                setExistingImages(data.images || []);
            }
        } catch (err) {
            console.error("Error fetching portfolio:", err);
            setAlert({ type: 'error', msg: 'Portfolio not found.' });
        } finally {
            setDataLoading(false);
        }
    };

    // Derived options for sub and child categories
    const subCategoryOptions = useMemo(() => {
        if (!portfolio.category_id) return [];
        const mainCat = categories.find(c => c.id.toString() === portfolio.category_id);
        return mainCat?.children || [];
    }, [portfolio.category_id, categories]);

    const childCategoryOptions = useMemo(() => {
        if (!portfolio.sub_category_id) return [];
        const subCat = subCategoryOptions.find(c => c.id.toString() === portfolio.sub_category_id);
        return subCat?.children || [];
    }, [portfolio.sub_category_id, subCategoryOptions]);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const validFiles = selectedFiles.filter(file => {
            if (file.size > 10 * 1024 * 1024) {
                alert(`Image ${file.name} is too large. Maximum size allowed is 10MB.`);
                return false;
            }
            return true;
        });
        setImages([...images, ...validFiles]);
    };

    const handleRemoveNewImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleDeleteExistingImage = async (imgId) => {
        if (!window.confirm("Delete this image permanently?")) return;
        try {
            await api.delete(`/portfolios/images/${imgId}`);
            setExistingImages(existingImages.filter(img => img.id !== imgId));
            setAlert({ type: 'success', msg: 'Image removed from portfolio.' });
        } catch (err) {
            console.error(err);
            setAlert({ type: 'error', msg: 'Failed to delete image.' });
        }
    };

    const handleSetThumbnail = async (imgId) => {
        try {
            const formData = new FormData();
            formData.append('_method', 'PUT');
            formData.append('thumbnail_id', imgId);
            await api.post(`/portfolios/${id}`, formData);

            setExistingImages(existingImages.map(img => ({
                ...img,
                is_thumbnail: img.id === imgId
            })));
            setAlert({ type: 'success', msg: 'Thumbnail updated.' });
        } catch (err) {
            console.error(err);
            setAlert({ type: 'error', msg: 'Failed to update thumbnail.' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        Object.keys(portfolio).forEach(key => {
            formData.append(key, portfolio[key]);
        });

        // Append new images
        for (let i = 0; i < images.length; i++) {
            formData.append('images[]', images[i]);
        }

        try {
            if (id) {
                formData.append('_method', 'PUT');
                await api.post(`/portfolios/${id}`, formData);
                setAlert({ type: 'success', msg: 'Portfolio updated successfully!' });
                setTimeout(() => navigate('/admin/portfolios'), 1500);
            } else {
                await api.post('/portfolios', formData);
                setAlert({ type: 'success', msg: 'Portfolio created successfully!' });
                setTimeout(() => navigate('/admin/portfolios'), 1500);
            }
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.message || 'Failed to save portfolio.';
            const validationErrors = err.response?.data?.errors;
            let finalMsg = errorMsg;

            if (validationErrors) {
                const details = Object.values(validationErrors).flat().join(' ');
                finalMsg += ` ${details}`;
            }

            setAlert({ type: 'error', msg: finalMsg });
        } finally {
            setLoading(false);
            window.scrollTo(0, 0);
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>{id ? 'Edit Portfolio' : 'New Design Portfolio'}</h1>
                    <p>Document your architectural vision and design process.</p>
                </div>
                <button className="admin-btn-secondary" onClick={() => navigate('/admin/portfolios')}>
                    Cancel
                </button>
            </div>

            {alert && (
                <div className={`admin-alert alert-${alert.type}`}>
                    {alert.msg}
                    <button className="close-alert" onClick={() => setAlert(null)}>&times;</button>
                </div>
            )}

            {dataLoading ? (
                <div className="admin-loading-screen">
                    <p>Fetching portfolio details...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="admin-editor-layout">
                    <div className="editor-main-card">
                        <div className="form-group">
                            <label>Portfolio Title</label>
                            <input
                                type="text"
                                className="admin-input-large"
                                placeholder="e.g. Minimalist Urban Loft"
                                value={portfolio.title}
                                onChange={(e) => setPortfolio({ ...portfolio, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                className="admin-input"
                                rows="8"
                                placeholder="Describe the portfolio's vision, materials, and challenges..."
                                value={portfolio.description}
                                onChange={(e) => setPortfolio({ ...portfolio, description: e.target.value })}
                            ></textarea>
                        </div>

                        <div className="form-group" style={{ marginTop: '30px' }}>
                            <label>Gallery Images</label>
                            <div className="multi-image-uploader">
                                <label className="upload-box">
                                    <i className="fas fa-camera"></i>
                                    <span>Upload Photos</span>
                                    <input type="file" multiple onChange={handleFileChange} hidden accept="image/*" />
                                </label>

                                <div className="image-preview-grid">
                                    {existingImages.map(img => (
                                        <div key={img.id} className={`preview-item existing ${img.is_thumbnail ? 'is-thumbnail' : ''}`}>
                                            <img src={getStorageUrl(img.image_path)} alt="" />
                                            <div className="preview-actions">
                                                <button type="button" onClick={() => handleDeleteExistingImage(img.id)} className="remove-btn">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                                {!img.is_thumbnail && (
                                                    <button type="button" onClick={() => handleSetThumbnail(img.id)} className="thumb-btn">
                                                        Set Display
                                                    </button>
                                                )}
                                            </div>
                                            {img.is_thumbnail && <span className="badge thumb">Main Preview</span>}
                                        </div>
                                    ))}
                                    {images.map((img, idx) => (
                                        <div key={idx} className="preview-item new">
                                            <img src={URL.createObjectURL(img)} alt="" />
                                            <button type="button" onClick={() => handleRemoveNewImage(idx)} className="remove-btn">
                                                <i className="fas fa-times"></i>
                                            </button>
                                            <span className="badge">Pending</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="editor-sidebar-card">
                        <h3>Portfolio Classification</h3>

                        <div className="form-group">
                            <label>Main Category</label>
                            <select
                                className="admin-input"
                                value={portfolio.category_id}
                                onChange={(e) => setPortfolio({ ...portfolio, category_id: e.target.value, sub_category_id: '', child_category_id: '' })}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Sub Category</label>
                            <select
                                className="admin-input"
                                value={portfolio.sub_category_id}
                                onChange={(e) => setPortfolio({ ...portfolio, sub_category_id: e.target.value, child_category_id: '' })}
                                disabled={!portfolio.category_id}
                            >
                                <option value="">Select Sub Category</option>
                                {subCategoryOptions.map(cat => (
                                    <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Child Category</label>
                            <select
                                className="admin-input"
                                value={portfolio.child_category_id}
                                onChange={(e) => setPortfolio({ ...portfolio, child_category_id: e.target.value })}
                                disabled={!portfolio.sub_category_id}
                            >
                                <option value="">Select Child Category</option>
                                {childCategoryOptions.map(cat => (
                                    <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #eee' }} />

                        <h3>Portfolio Details</h3>





                        <div className="form-group">
                            <label>Status</label>
                            <select
                                className="admin-input"
                                value={portfolio.status}
                                onChange={(e) => setPortfolio({ ...portfolio, status: e.target.value })}
                            >
                                <option value="published">Live</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        <button type="submit" className="admin-btn-primary full-width" disabled={loading}>
                            {loading ? 'Saving Masterpiece...' : id ? 'Update Portfolio' : 'Publish Portfolio'}
                        </button>
                    </aside>
                </form>
            )}
        </div>
    );
};

export default PortfolioEditor;
