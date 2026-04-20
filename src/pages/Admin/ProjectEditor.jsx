import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getStorageUrl } from '../../api/axios';
import './Admin.css';

const ProjectEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState({
        title: '',
        description: '',
        location: '',
        client_name: '',
        completion_date: '',
        duration: '',
        floor_area: '',
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
            fetchProjectDetail();
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

    const fetchProjectDetail = async () => {
        setDataLoading(true);
        try {
            const res = await api.get(`/admin-projects/${id}`);
            const data = res.data;
            if (data) {
                setProject({
                    title: data.title || '',
                    description: data.description || '',
                    location: data.location || '',
                    client_name: data.client_name || '',
                    completion_date: data.completion_date || '',
                    duration: data.duration || '',
                    floor_area: data.floor_area || '',
                    status: data.status || 'published',
                    category_id: data.category_id ? data.category_id.toString() : '',
                    sub_category_id: data.sub_category_id ? data.sub_category_id.toString() : '',
                    child_category_id: data.child_category_id ? data.child_category_id.toString() : ''
                });
                setExistingImages(data.images || []);
            }
        } catch (err) {
            console.error("Error fetching project:", err);
            setAlert({ type: 'error', msg: 'Project not found.' });
        } finally {
            setDataLoading(false);
        }
    };

    // Derived options for sub and child categories
    const subCategoryOptions = useMemo(() => {
        if (!project.category_id) return [];
        const mainCat = categories.find(c => c.id.toString() === project.category_id);
        return mainCat?.children || [];
    }, [project.category_id, categories]);

    const childCategoryOptions = useMemo(() => {
        if (!project.sub_category_id) return [];
        const subCat = subCategoryOptions.find(c => c.id.toString() === project.sub_category_id);
        return subCat?.children || [];
    }, [project.sub_category_id, subCategoryOptions]);

    const handleFileChange = (e) => {
        setImages([...images, ...e.target.files]);
    };

    const handleRemoveNewImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleDeleteExistingImage = async (imgId) => {
        if (!window.confirm("Delete this image permanently?")) return;
        try {
            await api.delete(`/projects/images/${imgId}`);
            setExistingImages(existingImages.filter(img => img.id !== imgId));
            setAlert({ type: 'success', msg: 'Image removed from project.' });
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
            await api.post(`/projects/${id}`, formData);

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
        Object.keys(project).forEach(key => {
            formData.append(key, project[key]);
        });

        // Append new images
        for (let i = 0; i < images.length; i++) {
            formData.append('images[]', images[i]);
        }

        try {
            if (id) {
                formData.append('_method', 'PUT');
                await api.post(`/projects/${id}`, formData);
                setAlert({ type: 'success', msg: 'Project updated successfully!' });
                setTimeout(() => navigate('/admin/projects'), 1500);
            } else {
                await api.post('/projects', formData);
                setAlert({ type: 'success', msg: 'Project created successfully!' });
                setTimeout(() => navigate('/admin/projects'), 1500);
            }
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.message || 'Failed to save project.';
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
                    <h1>{id ? 'Edit Project' : 'New Design Project'}</h1>
                    <p>Document your architectural vision and design process.</p>
                </div>
                <button className="admin-btn-secondary" onClick={() => navigate('/admin/projects')}>
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
                    <p>Fetching project details...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="admin-editor-layout">
                    <div className="editor-main-card">
                        <div className="form-group">
                            <label>Project Title</label>
                            <input
                                type="text"
                                className="admin-input-large"
                                placeholder="e.g. Minimalist Urban Loft"
                                value={project.title}
                                onChange={(e) => setProject({ ...project, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                className="admin-input"
                                rows="8"
                                placeholder="Describe the project's vision, materials, and challenges..."
                                value={project.description}
                                onChange={(e) => setProject({ ...project, description: e.target.value })}
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
                        <h3>Project Classification</h3>

                        <div className="form-group">
                            <label>Main Category</label>
                            <select
                                className="admin-input"
                                value={project.category_id}
                                onChange={(e) => setProject({ ...project, category_id: e.target.value, sub_category_id: '', child_category_id: '' })}
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
                                value={project.sub_category_id}
                                onChange={(e) => setProject({ ...project, sub_category_id: e.target.value, child_category_id: '' })}
                                disabled={!project.category_id}
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
                                value={project.child_category_id}
                                onChange={(e) => setProject({ ...project, child_category_id: e.target.value })}
                                disabled={!project.sub_category_id}
                            >
                                <option value="">Select Child Category</option>
                                {childCategoryOptions.map(cat => (
                                    <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #eee' }} />

                        <h3>Project Details</h3>

                        <div className="form-group">
                            <label>Location</label>
                            <input
                                type="text"
                                className="admin-input"
                                placeholder="City, Country"
                                value={project.location}
                                onChange={(e) => setProject({ ...project, location: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Client Name</label>
                            <input
                                type="text"
                                className="admin-input"
                                placeholder="Optional"
                                value={project.client_name}
                                onChange={(e) => setProject({ ...project, client_name: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Completion Date</label>
                            <input
                                type="date"
                                className="admin-input"
                                value={project.completion_date}
                                onChange={(e) => setProject({ ...project, completion_date: e.target.value })}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Duration</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    placeholder="e.g. 2 months"
                                    value={project.duration}
                                    onChange={(e) => setProject({ ...project, duration: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Floor Area</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    placeholder="e.g. 1200 sq. ft."
                                    value={project.floor_area}
                                    onChange={(e) => setProject({ ...project, floor_area: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select
                                className="admin-input"
                                value={project.status}
                                onChange={(e) => setProject({ ...project, status: e.target.value })}
                            >
                                <option value="published">Live</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        <button type="submit" className="admin-btn-primary full-width" disabled={loading}>
                            {loading ? 'Saving Masterpiece...' : id ? 'Update Project' : 'Publish Project'}
                        </button>
                    </aside>
                </form>
            )}
        </div>
    );
};

export default ProjectEditor;
