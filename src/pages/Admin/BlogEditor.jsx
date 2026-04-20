import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api, { getStorageUrl } from '../../api/axios';
import './Admin.css';

const BlogEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState({
        title: '',
        content: '',
        status: 'published',
        author: 'Admin',
        blog_category_id: ''
    });
    const [categories, setCategories] = useState([]);
    const [images, setImages] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(!!id); // Separate state for data fetching
    const [alert, setAlert] = useState(null);
    const quillRef = React.useRef(null);

    useEffect(() => {
        fetchCategories();
        if (id) {
            fetchBlogDetail();
        }
    }, [id]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/blog-categories');
            setCategories(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBlogDetail = async () => {
        setDataLoading(true);
        try {
            const res = await api.get(`/admin-blogs/${id}`);
            const currentBlog = res.data;
            if (currentBlog) {
                // Set the main blog data
                setBlog({
                    title: currentBlog.title || '',
                    content: currentBlog.content || '',
                    status: currentBlog.status || 'published',
                    author: currentBlog.author || 'Admin',
                    blog_category_id: currentBlog.blog_category_id ? currentBlog.blog_category_id.toString() : ''
                });
                setExistingImages(currentBlog.images || []);
            }
        } catch (err) {
            console.error("Error fetching blog:", err);
            setAlert({ type: 'error', msg: 'Failed to find this story in our archives.' });
        } finally {
            setDataLoading(false);
        }
    };

    // Ensure category is selected once both blog data and categories list are present
    useEffect(() => {
        if (!dataLoading && blog.blog_category_id && categories.length > 0) {
            const catExists = categories.some(c => c.id.toString() === blog.blog_category_id);
            if (catExists) {
                // Force triggering a re-render for the select if needed, though React should handle it
            }
        }
    }, [dataLoading, categories, blog.blog_category_id]);

    // Drag & Drop / Paste Handler for Quill
    useEffect(() => {
        if (quillRef.current) {
            const quill = quillRef.current.getEditor();

            const handleImageUpload = async (file) => {
                const formData = new FormData();
                formData.append('image', file);
                try {
                    const res = await api.post('/blogs/upload-image', formData);
                    const range = quill.getSelection() || { index: quill.getLength() };
                    quill.insertEmbed(range.index, 'image', res.data.url);
                    quill.setSelection(range.index + 1);
                } catch (err) {
                    console.error("Paste upload failed:", err);
                }
            };

            const handlePaste = (e) => {
                const items = (e.clipboardData || e.originalEvent.clipboardData).items;
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        handleImageUpload(file);
                        e.preventDefault();
                    }
                }
            };

            const handleDrop = (e) => {
                const files = (e.dataTransfer || e.originalEvent.dataTransfer).files;
                if (files.length > 0) {
                    for (let i = 0; i < files.length; i++) {
                        if (files[i].type.indexOf('image') !== -1) {
                            handleImageUpload(files[i]);
                            e.preventDefault();
                        }
                    }
                }
            };

            quill.root.addEventListener('paste', handlePaste);
            quill.root.addEventListener('drop', handleDrop);

            return () => {
                quill.root.removeEventListener('paste', handlePaste);
                quill.root.removeEventListener('drop', handleDrop);
            };
        }
    }, [dataLoading]); // Re-attach when data finishes loading

    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            const formData = new FormData();
            formData.append('image', file);

            try {
                const res = await api.post('/blogs/upload-image', formData);
                const quill = quillRef.current.getEditor();
                const range = quill.getSelection();
                quill.insertEmbed(range.index, 'image', res.data.url);
            } catch (err) {
                console.error("Image upload failed:", err);
            }
        };
    };

    const modules = React.useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['image', 'link', 'blockquote', 'code-block'],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        }
    }), []);

    const handleFileChange = (e) => {
        setImages([...images, ...e.target.files]);
    };

    const handleRemoveNewImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleDeleteExistingImage = async (imgId) => {
        if (!window.confirm("Delete this image permanently?")) return;
        try {
            await api.delete(`/blogs/images/${imgId}`); // Fixed: plural 'images'
            setExistingImages(existingImages.filter(img => img.id !== imgId));
            setAlert({ type: 'success', msg: 'Image removed from gallery.' });
        } catch (err) {
            console.error(err);
            setAlert({ type: 'error', msg: 'Failed to delete image.' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        Object.keys(blog).forEach(key => {
            formData.append(key, blog[key]);
        });

        // Append new images
        for (let i = 0; i < images.length; i++) {
            formData.append('images[]', images[i]);
        }

        try {
            if (id) {
                // Check for 'blob:' URLs in content and warn user
                if (blog.content.includes('src="blob:')) {
                    if (!window.confirm("Notice: Some images in your Story Content were added via copy-paste and might not show up for others. Do you want to save anyway? (We recommend re-uploading them using the new Image button)")) {
                        setLoading(false);
                        return;
                    }
                }

                // Laravel Multi-part PUT workaround
                formData.append('_method', 'PUT');
                await api.post(`/blogs/${id}`, formData);
                setAlert({ type: 'success', msg: 'Blog updated successfully!' });
                setTimeout(() => navigate('/admin/blogs'), 1500);
            } else {
                await api.post('/blogs', formData);
                setAlert({ type: 'success', msg: 'Blog created successfully!' });
                setTimeout(() => navigate('/admin/blogs'), 1500);
            }
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.message || 'Failed to save blog post.';
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
                    <h1>{id ? 'Edit Story' : 'Create New Masterpiece'}</h1>
                    <p>Craft beautiful interior design stories for your audience.</p>
                </div>
                <button className="admin-btn-secondary" onClick={() => navigate('/admin/blogs')}>
                    Cancel & Return
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
                    <div className="spinner"></div>
                    <p>Retrieving story details...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="admin-editor-layout">
                    <div className="editor-main-card">
                        <div className="form-group">
                            <label>Headline / Title</label>
                            <input
                                type="text"
                                className="admin-input-large"
                                placeholder="Enticing title for your blog post..."
                                value={blog.title}
                                onChange={(e) => setBlog({ ...blog, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group quill-container">
                            <label>Story Content</label>
                            <ReactQuill
                                ref={quillRef}
                                theme="snow"
                                value={blog.content}
                                onChange={(content) => setBlog({ ...blog, content })}
                                modules={modules}
                                placeholder="Write your beautiful story here..."
                            />
                        </div>

                        <div className="form-group" style={{ marginTop: '30px' }}>
                            <label>Product/Gallery Images</label>
                            <div className="multi-image-uploader">
                                <label className="upload-box">
                                    <i className="fas fa-cloud-upload-alt"></i>
                                    <span>Click to add images</span>
                                    <input type="file" multiple onChange={handleFileChange} hidden accept="image/*" />
                                </label>

                                <div className="image-preview-grid">
                                    {existingImages.map(img => (
                                        <div key={img.id} className="preview-item existing">
                                            <img src={getStorageUrl(img.image_path)} alt="" />
                                            <button type="button" onClick={() => handleDeleteExistingImage(img.id)} className="remove-btn">
                                                <i className="fas fa-times"></i>
                                            </button>
                                            <span className="badge">Saved</span>
                                        </div>
                                    ))}
                                    {images.map((img, idx) => (
                                        <div key={idx} className="preview-item new">
                                            <img src={URL.createObjectURL(img)} alt="" />
                                            <button type="button" onClick={() => handleRemoveNewImage(idx)} className="remove-btn">
                                                <i className="fas fa-times"></i>
                                            </button>
                                            <span className="badge">New</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="editor-sidebar-card">
                        <h3>Publish Settings</h3>

                        <div className="form-group">
                            <label>Category</label>
                            <select
                                className="admin-input"
                                value={blog.blog_category_id}
                                onChange={(e) => setBlog({ ...blog, blog_category_id: e.target.value })}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select
                                className="admin-input"
                                value={blog.status}
                                onChange={(e) => setBlog({ ...blog, status: e.target.value })}
                            >
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Author Display Name</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={blog.author}
                                onChange={(e) => setBlog({ ...blog, author: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="admin-btn-primary full-width" disabled={loading}>
                            {loading ? 'Saving...' : id ? 'Update Post' : 'Publish Post'}
                        </button>
                    </aside>
                </form>
            )}
        </div>
    );
};

export default BlogEditor;
