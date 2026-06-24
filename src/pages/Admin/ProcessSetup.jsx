import React, { useState, useEffect } from 'react';
import './Admin.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import api, { getStorageUrl } from '../../api/axios';

const ProcessSetup = () => {
    const [steps, setSteps] = useState([]);
    const [formData, setFormData] = useState({ stepNumber: '', title: '', image: '', description: '' });
    const [imageFile, setImageFile] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);
    const [addingNew, setAddingNew] = useState(false);
    const [alert, setAlert] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const fetchSteps = async () => {
        try {
            const res = await api.get('/process-steps');
            // Sort steps by step_number ascending
            const sorted = res.data.sort((a, b) => a.step_number.localeCompare(b.step_number));
            setSteps(sorted);
        } catch (err) {
            console.error("Failed to fetch process steps:", err);
            setAlert({ type: 'error', msg: 'Failed to load process steps from database.' });
        }
    };

    useEffect(() => {
        fetchSteps();
    }, []);

    const handleEdit = (step, index) => {
        setEditingIndex(index);
        setAddingNew(false);
        setFormData({
            stepNumber: step.stepNumber || step.step_number || '',
            title: step.title,
            image: step.image,
            description: step.description
        });
        setImageFile(null);
        const fileInput = document.getElementById('process-image-file');
        if (fileInput) fileInput.value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddNewClick = () => {
        setEditingIndex(null);
        setAddingNew(true);
        setFormData({
            stepNumber: '',
            title: '',
            image: '',
            description: ''
        });
        setImageFile(null);
        const fileInput = document.getElementById('process-image-file');
        if (fileInput) fileInput.value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = (id) => {
        setDeleteTargetId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await api.delete(`/process-steps/${deleteTargetId}`);
            setSteps(steps.filter(s => s.id !== deleteTargetId));
            setAlert({ type: 'success', msg: 'Process step removed successfully.' });
        } catch (err) {
            console.error("Failed to delete step:", err);
            setAlert({ type: 'error', msg: 'Failed to remove process step.' });
        } finally {
            setConfirmOpen(false);
            setDeleteTargetId(null);
            setFormData({ stepNumber: '', title: '', image: '', description: '' });
            setImageFile(null);
            setEditingIndex(null);
            setAddingNew(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (editingIndex === null && !addingNew) return;

        if (!imageFile && !formData.image) {
            setAlert({ type: 'error', msg: 'Please select an image file to upload or enter an image path/URL.' });
            return;
        }

        const submitData = new FormData();
        submitData.append('title', formData.title);
        submitData.append('description', formData.description);
        submitData.append('image', formData.image || '');
        if (imageFile) {
            submitData.append('image_file', imageFile);
        }

        try {
            if (addingNew) {
                submitData.append('step_number', formData.stepNumber);
                const res = await api.post('/process-steps', submitData);
                const newSteps = [...steps, res.data.step].sort((a, b) => 
                    a.step_number.localeCompare(b.step_number)
                );
                setSteps(newSteps);
                setAlert({ type: 'success', msg: 'New creative process step added.' });
            } else {
                const targetStep = steps[editingIndex];
                const res = await api.post(`/process-steps/${targetStep.id}`, submitData);
                const updated = steps.map((s, idx) => 
                    idx === editingIndex ? res.data.step : s
                );
                setSteps(updated);
                setAlert({ type: 'success', msg: `Process step ${targetStep.stepNumber} updated successfully.` });
            }

            setEditingIndex(null);
            setAddingNew(false);
            setFormData({ stepNumber: '', title: '', image: '', description: '' });
            setImageFile(null);
            const fileInput = document.getElementById('process-image-file');
            if (fileInput) fileInput.value = '';
        } catch (err) {
            console.error("Failed to save process step:", err);
            setAlert({ type: 'error', msg: 'Failed to save process step.' });
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Our Creative Process Setup</h1>
                    <p>Manage the roadmap steps, titles, descriptions, and icon images of the creative design process.</p>
                </div>
                <div>
                    <button className="admin-btn-primary" onClick={handleAddNewClick}>
                        <i className="fas fa-plus-circle"></i> Add New Step
                    </button>
                </div>
            </div>

            {alert && (
                <div className={`admin-alert alert-${alert.type}`}>
                    {alert.msg}
                    <button className="close-alert" onClick={() => setAlert(null)}>&times;</button>
                </div>
            )}

            <div className="admin-grid-layout">
                {(editingIndex !== null || addingNew) && (
                    <div className="admin-card editor-main-card">
                        <h3>{addingNew ? 'Add New Process Step' : `Edit Process Step ${steps[editingIndex].stepNumber}`}</h3>
                        <form onSubmit={handleSubmit} className="admin-form-inline">
                            {addingNew && (
                                <div className="form-group">
                                    <label>Step Number / Identifier</label>
                                    <input
                                        type="text"
                                        className="admin-input"
                                        value={formData.stepNumber}
                                        onChange={(e) => setFormData({ ...formData, stepNumber: e.target.value })}
                                        required
                                        placeholder="e.g. 07"
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>Step Title</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    placeholder="e.g. Custom Furniture Selection"
                                />
                            </div>

                            <div className="form-group">
                                <label>Upload Icon/Image File</label>
                                <span style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '5px' }}>
                                    <strong>Recommended:</strong> 120x120 px (1:1 square, transparent PNG preferred).
                                </span>
                                <input
                                    id="process-image-file"
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
                                <label>Icon/Image Path or URL</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    placeholder="e.g. /photo/process_step1.png"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    className="admin-input"
                                    style={{ height: '100px', resize: 'vertical' }}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                    placeholder="Provide details about what happens in this step..."
                                />
                            </div>

                            <div className="form-actions" style={{ marginTop: '20px' }}>
                                <button type="submit" className="admin-btn-primary">
                                    <i className="fas fa-save"></i> {addingNew ? 'Add Step' : 'Save Step'}
                                </button>
                                <button
                                    type="button"
                                    className="admin-btn-secondary"
                                    onClick={() => {
                                        setEditingIndex(null);
                                        setAddingNew(false);
                                        setFormData({ stepNumber: '', title: '', image: '', description: '' });
                                        setImageFile(null);
                                        const fileInput = document.getElementById('process-image-file');
                                        if (fileInput) fileInput.value = '';
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="admin-card table-card" style={{ marginTop: (editingIndex !== null || addingNew) ? '30px' : '0' }}>
                    <h3>Roadmap Steps</h3>
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '80px' }}>Step</th>
                                    <th style={{ width: '110px' }}>Icon</th>
                                    <th>Title</th>
                                    <th>Description</th>
                                    <th style={{ width: '180px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {steps.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center">No process steps found. Click above to add one.</td>
                                    </tr>
                                ) : (
                                    steps.map((step, index) => (
                                        <tr key={step.id || index} className={editingIndex === index ? 'row-editing' : ''}>
                                            <td style={{ fontWeight: 'bold', color: '#E85D25', fontSize: '1.1rem' }}>
                                                {step.stepNumber}
                                            </td>
                                            <td>
                                                <img
                                                    src={getStorageUrl(step.image)}
                                                    alt="Step icon"
                                                    style={{ width: '80px', height: '80px', objectFit: 'contain', background: '#f8fafc', padding: '4px', borderRadius: '4px' }}
                                                    onError={(e) => {
                                                        e.target.src = "/photo/process_step1.png";
                                                    }}
                                                />
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{step.title}</td>
                                            <td>
                                                <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                                                    {step.description}
                                                </p>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="action-btn edit-btn"
                                                        onClick={() => handleEdit(step, index)}
                                                        title="Edit step"
                                                    >
                                                        <i className="fas fa-edit"></i> Edit
                                                    </button>
                                                    <button
                                                        className="action-btn delete-btn"
                                                        onClick={() => handleDeleteClick(step.id)}
                                                        title="Delete step"
                                                        style={{ marginLeft: '8px' }}
                                                    >
                                                        <i className="fas fa-trash-alt"></i> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                title="Remove Process Step"
                message="Are you sure you want to remove this process step? It will immediately stop appearing on the home page roadmap."
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default ProcessSetup;
