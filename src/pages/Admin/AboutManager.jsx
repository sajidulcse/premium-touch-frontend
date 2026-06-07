import React, { useState, useEffect } from 'react';
import api, { BASE_URL, clearClientCache } from '../../api/axios';
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

const AboutManager = () => {
    const [settings, setSettings] = useState({
        about_page_description: ''
    });
    const [officeImageFile, setOfficeImageFile] = useState(null);
    const [officeImagePreview, setOfficeImagePreview] = useState(null);
    const [clearOfficeImage, setClearOfficeImage] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);

    // Cropping states
    const [imageToCrop, setImageToCrop] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/site-info');
            const data = res.data;
            setSettings({
                about_page_description: data.about_page_description || ''
            });
            if (data.about_page_office_image) {
                const root = BASE_URL.replace(/\/api$/, '');
                setOfficeImagePreview(`${root}/public/uploads/about/${data.about_page_office_image}`);
            } else {
                setOfficeImagePreview(null);
            }
            setOfficeImageFile(null);
            setClearOfficeImage(false);
        } catch (err) {
            console.error("Error fetching settings:", err);
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
        setOfficeImageFile(null);
        setOfficeImagePreview(null);
        setClearOfficeImage(true);
    };

    const handleCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleApplyCrop = async () => {
        try {
            const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
            const croppedFile = new File([croppedBlob], 'cropped_about_office.jpg', { type: 'image/jpeg' });
            
            setOfficeImageFile(croppedFile);
            setOfficeImagePreview(URL.createObjectURL(croppedBlob));
            setClearOfficeImage(false);
            setImageToCrop(null);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        data.append('about_page_description', settings.about_page_description);

        if (officeImageFile) {
            data.append('about_page_office_image', officeImageFile);
        }
        data.append('clear_office_image', clearOfficeImage ? '1' : '0');

        try {
            await api.post('/site-info', data);
            clearClientCache();
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
                    <p>Configure the profile descriptions and design studio imagery displayed on the About page.</p>
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
                    This description and image represent your main design studio profile on the public About page.
                </p>

                <div className="form-group">
                    <label>About Page Description</label>
                    <textarea
                        className="admin-textarea"
                        rows="8"
                        value={settings.about_page_description}
                        onChange={(e) => setSettings(prev => ({ ...prev, about_page_description: e.target.value }))}
                        required
                        placeholder="Write a detailed description for the About page story..."
                    ></textarea>
                </div>

                {/* Design Studio Office Image Block with Cropper */}
                <div className="form-group" style={{ marginTop: '25px' }}>
                    <label>Design Studio Image (Square 1:1 ratio, 1024x1024px recommended)</label>
                    {!officeImagePreview ? (
                        <div 
                            className="file-upload-placeholder" 
                            style={{ 
                                border: '2px dashed #e2e8f0', 
                                borderRadius: '8px', 
                                padding: '30px', 
                                textAlign: 'center', 
                                cursor: 'pointer', 
                                backgroundColor: '#f8fafc' 
                            }} 
                            onClick={() => document.getElementById('office-image-picker').click()}
                        >
                            <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '8px' }}></i>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                                Drag & drop or click to upload 1:1 square showroom/office image (Max 10MB)
                            </p>
                            <input
                                id="office-image-picker"
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
                                    src={officeImagePreview} 
                                    alt="Design Studio Office Preview" 
                                    style={{ 
                                        width: '150px', 
                                        height: '150px', 
                                        objectFit: 'cover', 
                                        borderRadius: '6px',
                                        transition: 'all 0.3s ease'
                                    }} 
                                />
                                <button 
                                    type="button" 
                                    onClick={handleRemoveImage} 
                                    className="remove-img-btn" 
                                    style={{ 
                                        position: 'absolute', 
                                        top: '-10px', 
                                        right: '-10px', 
                                        width: '26px', 
                                        height: '26px', 
                                        borderRadius: '50%', 
                                        border: 'none', 
                                        backgroundColor: '#ef4444', 
                                        color: '#fff', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        cursor: 'pointer', 
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                                    }} 
                                    title="Remove Image"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => document.getElementById('office-image-picker-exchange').click()} 
                                className="admin-btn-secondary" 
                                style={{ width: '158px', fontSize: '12px', padding: '8px 12px' }}
                            >
                                <i className="fas fa-exchange-alt" style={{ marginRight: '6px' }}></i> Change Image
                            </button>
                            <input
                                id="office-image-picker-exchange"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </div>
                    )}
                </div>

                <button type="submit" className="admin-btn-primary" disabled={loading} style={{ width: '180px', marginTop: '20px' }}>
                    {loading ? 'Saving...' : 'Save Info'}
                </button>
            </form>

            {/* Image Cropper Modal */}
            {imageToCrop && (
                <div className="crop-modal-overlay">
                    <div className="crop-modal-container">
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '500' }}>Adjust Office Image</h3>
                        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#94a3b8' }}>
                            Drag the image and use the zoom slider to frame the design studio photo perfectly.
                        </p>
                        
                        <div className="cropper-container-wrapper">
                            <Cropper
                                image={imageToCrop}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
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
        </div>
    );
};

export default AboutManager;
