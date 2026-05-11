import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getStorageUrl } from '../../api/axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './Admin.css';

const ServiceEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState({
        description: '',
        status: 'published',
        sub_category_id: ''
    });
    const [categories, setCategories] = useState([]);
    const [images, setImages] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(!!id);
    const [alert, setAlert] = useState(null);
    const [mainCategoryId, setMainCategoryId] = useState('');

    useEffect(() => {
        fetchCategories();
        if (id) {
            fetchServiceDetail();
        }
    }, [id]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
            
            const targetCat = res.data.find(c => c.slug === 'services' || c.name.toLowerCase() === 'services' || c.slug === 'service' || c.name.toLowerCase() === 'service');
            if (targetCat) {
                setMainCategoryId(targetCat.id.toString());
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchServiceDetail = async () => {
        setDataLoading(true);
        try {
            const res = await api.get(`/admin-services/${id}`);
            const data = res.data;
            if (data) {
                setService({
                    description: data.description || '',
                    status: data.status || 'published',
                    sub_category_id: data.sub_category_id ? data.sub_category_id.toString() : ''
                });
                setExistingImages(data.images || []);
                try {
                    setFaqs(data.faqs ? JSON.parse(data.faqs) : []);
                } catch { setFaqs([]); }
            }
        } catch (err) {
            console.error("Error fetching service:", err);
            setAlert({ type: 'error', msg: 'Service not found.' });
        } finally {
            setDataLoading(false);
        }
    };

    // Derived options for sub categories based on main service category
    const subCategoryOptions = useMemo(() => {
        if (!mainCategoryId) return [];
        const mainCat = categories.find(c => c.id.toString() === mainCategoryId);
        return mainCat?.children || [];
    }, [mainCategoryId, categories]);

    const modules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'blockquote'],
            ['clean']
        ]
    }), []);

    const handleAddFaq = () => {
        setFaqs([...faqs, { question: '', answer: '' }]);
    };

    const handleFaqChange = (index, field, value) => {
        const newFaqs = [...faqs];
        newFaqs[index][field] = value;
        setFaqs(newFaqs);
    };

    const handleRemoveFaq = (index) => {
        setFaqs(faqs.filter((_, i) => i !== index));
    };

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
            await api.delete(`/admin-services/images/${imgId}`);
            setExistingImages(existingImages.filter(img => img.id !== imgId));
            setAlert({ type: 'success', msg: 'Image removed from service.' });
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
            await api.post(`/services/${id}`, formData);

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
        Object.keys(service).forEach(key => {
            formData.append(key, service[key]);
        });

        // Append new images
        for (let i = 0; i < images.length; i++) {
            formData.append('images[]', images[i]);
        }
        formData.append('faqs', JSON.stringify(faqs));

        try {
            if (id) {
                formData.append('_method', 'PUT');
                await api.post(`/services/${id}`, formData);
                setAlert({ type: 'success', msg: 'Service updated successfully!' });
                setTimeout(() => navigate('/admin/services'), 1500);
            } else {
                await api.post('/services', formData);
                setAlert({ type: 'success', msg: 'Service created successfully!' });
                setTimeout(() => navigate('/admin/services'), 1500);
            }
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.message || 'Failed to save service.';
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
                    <h1>{id ? 'Edit Service' : 'New Service'}</h1>
                    <p>Create and manage premium services.</p>
                </div>
                <button className="admin-btn-secondary" onClick={() => navigate('/admin/services')}>
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
                    <p>Fetching service details...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="admin-editor-layout">
                    <div className="editor-main-card">
                        <div className="form-group quill-container">
                            <label>Description</label>
                            <ReactQuill
                                theme="snow"
                                value={service.description}
                                onChange={(content) => setService({ ...service, description: content })}
                                modules={modules}
                                placeholder="Describe the service details..."
                            />
                        </div>

                        <div className="form-group" style={{ marginTop: '30px' }}>
                            <label>FAQ Section (Accordions)</label>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>Add frequently asked questions about this service.</p>
                            
                            {faqs.map((faq, index) => (
                                <div key={index} style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '15px', position: 'relative' }}>
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveFaq(index)}
                                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '16px' }}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                    <div className="form-group" style={{ marginBottom: '10px' }}>
                                        <input 
                                            type="text" 
                                            className="admin-input" 
                                            placeholder="Question?" 
                                            value={faq.question} 
                                            onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '0' }}>
                                        <textarea 
                                            className="admin-input" 
                                            rows="3" 
                                            placeholder="Answer..." 
                                            value={faq.answer} 
                                            onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddFaq} className="admin-btn-secondary" style={{ padding: '8px 15px', fontSize: '13px' }}>
                                <i className="fas fa-plus"></i> Add Question
                            </button>
                        </div>

                        <div className="form-group" style={{ marginTop: '40px' }}>
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
                        <h3>Service Classification</h3>

                        <div className="form-group">
                            <label>Sub Category</label>
                            <select
                                className="admin-input"
                                value={service.sub_category_id}
                                onChange={(e) => setService({ ...service, sub_category_id: e.target.value })}
                            >
                                <option value="">Select Sub Category</option>
                                {subCategoryOptions.map(cat => (
                                    <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #eee' }} />

                        <h3>Service Details</h3>

                        <div className="form-group">
                            <label>Status</label>
                            <select
                                className="admin-input"
                                value={service.status}
                                onChange={(e) => setService({ ...service, status: e.target.value })}
                            >
                                <option value="published">Live</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        <button type="submit" className="admin-btn-primary full-width" disabled={loading}>
                            {loading ? 'Saving Service...' : id ? 'Update Service' : 'Publish Service'}
                        </button>
                    </aside>
                </form>
            )}
        </div>
    );
};

export default ServiceEditor;
