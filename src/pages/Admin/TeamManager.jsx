import React, { useState, useEffect } from 'react';
import api, { getStorageUrl } from '../../api/axios';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import Cropper from 'react-easy-crop';
import './Admin.css';

const getCroppedImg = (imageSrc, pixelCrop) => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = imageSrc;
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('No 2d context'));
                return;
            }

            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;

            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, 'image/jpeg', 0.95);
        };
        image.onerror = (err) => {
            reject(err);
        };
    });
};

const TeamManager = () => {
    const [members, setMembers] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        desc: '',
        quote: '',
        linkedin: '',
        instagram: '',
        facebook: '',
        email: '',
        website: '',
        is_executive: false,
        position: 0
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [clearImage, setClearImage] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    // Cropping states
    const [imageToCrop, setImageToCrop] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/team-members');
            const data = res.data || [];
            setMembers(data);

            // Pre-fill next position
            const maxPos = data.reduce((max, item) => Math.max(max, item.position || 0), 0);
            setFormData(prev => ({
                ...prev,
                position: maxPos + 1
            }));
        } catch (err) {
            console.error("Failed to fetch team members:", err);
            setAlert({ type: 'error', msg: 'Failed to load team members from server.' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setAlert({ type: 'error', msg: 'Image exceeds the 10MB limit.' });
            return;
        }

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImageToCrop(reader.result);
        });
        reader.readAsDataURL(file);
        setAlert(null);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (editingId) {
            setClearImage(true);
        }
    };

    const handleCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleApplyCrop = async () => {
        try {
            const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
            const croppedFile = new File([croppedBlob], 'cropped_member_portrait.jpg', { type: 'image/jpeg' });
            
            setImageFile(croppedFile);
            setImagePreview(URL.createObjectURL(croppedBlob));
            setClearImage(false);
            setImageToCrop(null); // Close modal
            setZoom(1);
            setCrop({ x: 0, y: 0 });
        } catch (err) {
            console.error("Failed to crop image:", err);
            setAlert({ type: 'error', msg: 'Failed to process image cropping.' });
            setImageToCrop(null);
        }
    };

    const handleCancelCrop = () => {
        setImageToCrop(null);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
    };

    const handleEdit = (member) => {
        setEditingId(member.id);
        setFormData({
            name: member.name,
            role: member.role,
            desc: member.desc,
            quote: member.quote || '',
            linkedin: member.linkedin || '',
            instagram: member.instagram || '',
            facebook: member.facebook || '',
            email: member.email || '',
            website: member.website || '',
            is_executive: !!member.is_executive,
            position: member.position || 0
        });
        setImagePreview(member.image ? getStorageUrl(member.image) : null);
        setImageFile(null);
        setClearImage(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = (id) => {
        setDeleteTargetId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        setConfirmOpen(false);
        if (!deleteTargetId) return;
        try {
            await api.delete(`/team-members/${deleteTargetId}`);
            setAlert({ type: 'success', msg: 'Team member deleted successfully.' });
            fetchMembers();
            if (editingId === deleteTargetId) {
                handleCancelEdit();
            }
        } catch (err) {
            console.error(err);
            setAlert({ type: 'error', msg: 'Failed to delete team member.' });
        } finally {
            setDeleteTargetId(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        const maxPos = members.reduce((max, item) => Math.max(max, item.position || 0), 0);
        setFormData({
            name: '',
            role: '',
            desc: '',
            quote: '',
            linkedin: '',
            instagram: '',
            facebook: '',
            email: '',
            website: '',
            is_executive: false,
            position: maxPos + 1
        });
        setImageFile(null);
        setImagePreview(null);
        setClearImage(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const submitData = new FormData();
        submitData.append('name', formData.name);
        submitData.append('role', formData.role);
        submitData.append('desc', formData.desc);
        submitData.append('quote', formData.quote || '');
        submitData.append('linkedin', formData.linkedin || '');
        submitData.append('instagram', formData.instagram || '');
        submitData.append('facebook', formData.facebook || '');
        submitData.append('email', formData.email || '');
        submitData.append('website', formData.website || '');
        submitData.append('is_executive', formData.is_executive ? '1' : '0');
        submitData.append('position', formData.position);

        if (imageFile) {
            submitData.append('image', imageFile);
        }
        if (editingId) {
            submitData.append('clear_image', clearImage ? '1' : '0');
        }

        setLoading(true);
        try {
            if (editingId) {
                await api.post(`/team-members/${editingId}`, submitData);
                setAlert({ type: 'success', msg: 'Team member updated successfully.' });
            } else {
                await api.post('/team-members', submitData);
                setAlert({ type: 'success', msg: 'Team member added successfully.' });
            }
            handleCancelEdit();
            fetchMembers();
        } catch (err) {
            console.error("Save team member error:", err);
            const serverMsg = err.response?.data?.message || 'Failed to save team member.';
            const validationErrors = err.response?.data?.errors;
            let errorText = serverMsg;
            if (validationErrors) {
                const list = Object.values(validationErrors).flat().join(' ');
                errorText = `${serverMsg} ${list}`;
            }
            setAlert({ type: 'error', msg: errorText });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Our Team Management</h1>
                    <p>Manage the profile cards for Executive Leadership and the Design Studio Collaborators.</p>
                </div>
            </div>

            {alert && (
                <div className={`admin-alert alert-${alert.type}`}>
                    {alert.msg}
                    <button className="close-alert" onClick={() => setAlert(null)}>&times;</button>
                </div>
            )}

            <div className="admin-grid-layout">
                {/* Form Editor Card */}
                <div className="admin-card editor-main-card">
                    <h3>{editingId ? 'Edit Team Member' : 'Add New Member'}</h3>
                    <form onSubmit={handleSubmit} className="admin-form-card" style={{ padding: 0, border: 'none', background: 'none' }}>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g. Tasnim Alam Chowdhury"
                                />
                            </div>
                            <div className="form-group">
                                <label>Role / Designation *</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    required
                                    placeholder="e.g. Principal Interior Architect"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_executive}
                                        onChange={(e) => setFormData({ ...formData, is_executive: e.target.checked })}
                                        style={{ width: '18px', height: '18px', margin: 0 }}
                                    />
                                    <span>Is Executive (CEO, MD)?</span>
                                </label>
                            </div>
                            <div className="form-group">
                                <label>Display Position (Ordering)</label>
                                <input
                                    type="number"
                                    className="admin-input"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
                                    min="0"
                                />
                            </div>
                        </div>

                        {formData.is_executive && (
                            <div className="form-group">
                                <label>Executive Quote * (Will display in spotlight section)</label>
                                <textarea
                                    className="admin-textarea"
                                    rows="3"
                                    value={formData.quote}
                                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                                    placeholder="e.g. Bespoke spaces require a perfect harmony between bold creative vision..."
                                    required={formData.is_executive}
                                ></textarea>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Biography / Description *</label>
                            <textarea
                                className="admin-textarea"
                                rows="4"
                                value={formData.desc}
                                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                                placeholder="Describe their experience, specialties, and role at the studio..."
                                required
                            ></textarea>
                        </div>

                        {/* Image Upload Block */}
                        <div className="form-group">
                            <label>
                                {formData.is_executive 
                                    ? 'Spotlight Image * (Landscape 16:9 ratio recommended)' 
                                    : 'Portrait Image * (1:1 ratio recommended)'}
                            </label>
                            {!imagePreview ? (
                                <div className="file-upload-placeholder" style={{ border: '2px dashed #e2e8f0', borderRadius: '8px', padding: '30px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f8fafc' }} onClick={() => document.getElementById('team-image-picker').click()}>
                                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '8px' }}></i>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                                        {formData.is_executive 
                                            ? 'Drag & drop or click to upload landscape spotlight image (Max 10MB)' 
                                            : 'Drag & drop or click to upload 1:1 portrait image (Max 10MB)'}
                                    </p>
                                    <input
                                        id="team-image-picker"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div className="image-preview-wrapper" style={{ position: 'relative', display: 'inline-block', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px', backgroundColor: '#fff', width: 'fit-content' }}>
                                        <img 
                                            src={imagePreview} 
                                            alt="Preview" 
                                            style={{ 
                                                width: formData.is_executive ? '266px' : '150px', 
                                                height: '150px', 
                                                objectFit: 'cover', 
                                                borderRadius: '6px',
                                                transition: 'all 0.3s ease'
                                            }} 
                                        />
                                        <button type="button" onClick={handleRemoveImage} className="remove-img-btn" style={{ position: 'absolute', top: '-10px', right: '-10px', width: '26px', height: '26px', borderRadius: '50%', border: 'none', backgroundColor: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title="Remove Image">
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => document.getElementById('team-image-picker-exchange').click()} 
                                        className="admin-btn-secondary" 
                                        style={{ width: '158px', fontSize: '12px', padding: '8px 12px' }}
                                    >
                                        <i className="fas fa-exchange-alt" style={{ marginRight: '6px' }}></i> Change Image
                                    </button>
                                    <input
                                        id="team-image-picker-exchange"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Social Links Block (Only show for executives) */}
                        {formData.is_executive && (
                            <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                                <h4>Social Media & Contacts</h4>
                                <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '15px' }}>Links are optional, email and website will automatically show icons if provided.</p>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label><i className="fab fa-linkedin-in" style={{ color: '#0a66c2', marginRight: '6px' }}></i> LinkedIn URL</label>
                                        <input
                                            type="url"
                                            className="admin-input"
                                            value={formData.linkedin}
                                            onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                            placeholder="https://linkedin.com/in/username"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label><i className="fab fa-instagram" style={{ color: '#e1306c', marginRight: '6px' }}></i> Instagram URL</label>
                                        <input
                                            type="url"
                                            className="admin-input"
                                            value={formData.instagram}
                                            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                            placeholder="https://instagram.com/username"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label><i className="fab fa-facebook-f" style={{ color: '#1877f2', marginRight: '6px' }}></i> Facebook URL</label>
                                        <input
                                            type="url"
                                            className="admin-input"
                                            value={formData.facebook}
                                            onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                            placeholder="https://facebook.com/username"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label><i className="fas fa-envelope" style={{ color: '#64748b', marginRight: '6px' }}></i> Email Address</label>
                                        <input
                                            type="email"
                                            className="admin-input"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="email@premiumtouchbd.com"
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ maxWidth: '50%' }}>
                                    <label><i className="fas fa-globe" style={{ color: '#64748b', marginRight: '6px' }}></i> Portfolio Website URL</label>
                                    <input
                                        type="url"
                                        className="admin-input"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="https://personalportfolio.com"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="form-actions" style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
                            <button type="submit" className="admin-btn-primary" disabled={loading} style={{ width: '160px' }}>
                                {loading ? 'Saving...' : editingId ? 'Update Member' : 'Add Member'}
                            </button>
                            {editingId && (
                                <button type="button" onClick={handleCancelEdit} className="admin-btn-secondary">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Team Members List Card */}
                <div className="admin-card list-sidebar-card">
                    <h3>Current Members ({members.length})</h3>
                    {loading && members.length === 0 ? (
                        <p>Loading members...</p>
                    ) : members.length === 0 ? (
                        <p>No team members listed yet.</p>
                    ) : (
                        <div className="admin-list-scrollable" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '700px', overflowY: 'auto' }}>
                            {members.map((member) => (
                                <div key={member.id} className="admin-list-item-card" style={{ display: 'flex', gap: '12px', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px', backgroundColor: '#fcfbfa' }}>
                                    <div className="item-img-wrap" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {member.image ? (
                                            <img 
                                                src={getStorageUrl(member.image)} 
                                                alt={member.name} 
                                                style={{ 
                                                    width: member.is_executive ? '80px' : '55px', 
                                                    height: member.is_executive ? '45px' : '55px', 
                                                    borderRadius: member.is_executive ? '4px' : '6px', 
                                                    objectFit: 'cover',
                                                    border: member.is_executive ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid #e2e8f0'
                                                }} 
                                            />
                                        ) : (
                                            <div 
                                                style={{ 
                                                    width: member.is_executive ? '80px' : '55px', 
                                                    height: member.is_executive ? '45px' : '55px', 
                                                    borderRadius: member.is_executive ? '4px' : '6px', 
                                                    backgroundColor: '#f1f5f9', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    color: '#64748b' 
                                                }}
                                            >
                                                <i className="fas fa-user-tie" style={{ fontSize: member.is_executive ? '1.1rem' : '1rem' }}></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="item-details" style={{ flexGrow: 1, minWidth: 0 }}>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {member.name}
                                        </h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '12px', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                {member.role}
                                            </span>
                                            <span className={`job-badge`} style={{ fontSize: '9px', padding: '2px 6px', display: 'inline-block', backgroundColor: member.is_executive ? 'rgba(212, 175, 55, 0.1)' : 'rgba(100, 116, 139, 0.1)', color: member.is_executive ? '#d4af37' : '#64748b' }}>
                                                {member.is_executive ? 'Executive' : 'Collaborator'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                            Pos: {member.position}
                                        </div>
                                    </div>
                                    <div className="item-actions" style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                                        <button onClick={() => handleEdit(member)} className="edit-btn" style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px', fontSize: '13px' }} title="Edit">
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button onClick={() => handleDeleteClick(member.id)} className="delete-btn" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', fontSize: '13px' }} title="Delete">
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Image Cropper Modal */}
            {imageToCrop && (
                <div className="crop-modal-overlay">
                    <div className="crop-modal-container">
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '500' }}>Adjust Profile Picture</h3>
                        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#94a3b8' }}>
                            Drag/move the image and use the zoom slider to frame the team portrait perfectly.
                        </p>
                        
                        <div className="cropper-container-wrapper">
                            <Cropper
                                image={imageToCrop}
                                crop={crop}
                                zoom={zoom}
                                aspect={formData.is_executive ? 16 / 9 : 1}
                                cropShape="rect"
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={handleCropComplete}
                            />
                        </div>

                        <div className="crop-modal-controls">
                            <div className="zoom-slider-group">
                                <span>Zoom</span>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.05}
                                    value={zoom}
                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                    className="zoom-range-input"
                                />
                                <span>{Math.round(zoom * 100)}%</span>
                            </div>
                        </div>

                        <div className="crop-modal-actions">
                            <button type="button" onClick={handleCancelCrop} className="admin-btn-secondary" style={{ padding: '10px 20px' }}>
                                Cancel
                            </button>
                            <button type="button" onClick={handleApplyCrop} className="admin-btn-primary" style={{ padding: '10px 24px', backgroundColor: '#d4af37', border: '1px solid #d4af37' }}>
                                Apply Crop
                            </button>
                        </div>
                    </div>
                    
                    <style>{`
                        .crop-modal-overlay {
                            position: fixed;
                            inset: 0;
                            background-color: rgba(0, 0, 0, 0.85);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 9999;
                            backdrop-filter: blur(10px);
                        }
                        .crop-modal-container {
                            background-color: #1a1a1a;
                            border: 1px solid #d4af37;
                            border-radius: 12px;
                            width: 90%;
                            max-width: 500px;
                            padding: 24px;
                            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
                            color: #fff;
                        }
                        .cropper-container-wrapper {
                            position: relative;
                            width: 100%;
                            height: 300px;
                            background-color: #111;
                            border-radius: 8px;
                            overflow: hidden;
                            margin-bottom: 20px;
                            border: 1px solid #333;
                        }
                        .crop-modal-controls {
                            margin-bottom: 20px;
                        }
                        .zoom-slider-group {
                            display: flex;
                            align-items: center;
                            gap: 12px;
                        }
                        .zoom-slider-group span {
                            font-size: 13px;
                            color: #94a3b8;
                            min-width: 45px;
                        }
                        .zoom-range-input {
                            flex-grow: 1;
                            accent-color: #d4af37;
                            cursor: pointer;
                            height: 6px;
                            border-radius: 3px;
                            background-color: #333;
                            outline: none;
                        }
                        .crop-modal-actions {
                            display: flex;
                            justify-content: flex-end;
                            gap: 12px;
                        }
                    `}</style>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmOpen}
                title="Delete Team Member"
                message="Are you sure you want to delete this team member? This action is permanent and will delete their portrait image."
                confirmText="Delete Member"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default TeamManager;
