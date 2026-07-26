import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './Admin.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { useToast } from '../../context/ToastContext';

const FormManager = () => {
    const toast = useToast();
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    
    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingField, setEditingField] = useState(null);
    
    // Form field states
    const [label, setLabel] = useState('');
    const [type, setType] = useState('text');
    const [placeholder, setPlaceholder] = useState('');
    const [isRequired, setIsRequired] = useState(false);
    const [isEnabled, setIsEnabled] = useState(true);
    const [options, setOptions] = useState([]);
    const [newOption, setNewOption] = useState('');
    
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchFields();
    }, []);

    const fetchFields = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/form-fields');
            setFields(res.data);
        } catch (err) {
            console.error("Failed to fetch form fields:", err);
            toast.error('Failed to load form fields from database.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingField(null);
        setLabel('');
        setType('text');
        setPlaceholder('');
        setIsRequired(false);
        setIsEnabled(true);
        setOptions([]);
        setNewOption('');
        setFormErrors({});
        setModalOpen(true);
    };

    const handleOpenEdit = (field) => {
        setEditingField(field);
        setLabel(field.label);
        setType(field.type);
        setPlaceholder(field.placeholder || '');
        setIsRequired(!!field.is_required);
        setIsEnabled(!!field.is_enabled);
        setOptions(field.options || []);
        setNewOption('');
        setFormErrors({});
        setModalOpen(true);
    };

    const handleAddOption = (e) => {
        e.preventDefault();
        const trimmed = newOption.trim();
        if (!trimmed) return;
        if (options.includes(trimmed)) {
            setFormErrors(prev => ({ ...prev, options: 'Option already exists' }));
            return;
        }
        setOptions([...options, trimmed]);
        setNewOption('');
        setFormErrors(prev => ({ ...prev, options: null }));
    };

    const handleRemoveOption = (indexToRemove) => {
        setOptions(options.filter((_, idx) => idx !== indexToRemove));
    };

    const handleSaveField = async (e) => {
        e.preventDefault();
        
        // Validation
        const errors = {};
        if (!label.trim()) errors.label = 'Label is required';
        if (type === 'select' && options.length === 0) {
            errors.options = 'At least one option is required for select field type';
        }
        
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const isCore = editingField && isCoreField(editingField);

        const payload = {
            label: label.trim(),
            placeholder: placeholder.trim() || null,
            is_required: isCore ? true : isRequired,
            is_enabled: isCore ? true : isEnabled,
            options: type === 'select' ? options : null
        };

        // For non-core fields we also pass type
        if (!isCore) {
            payload.type = type;
        }

        try {
            if (editingField) {
                await api.put(`/admin/form-fields/${editingField.id}`, payload);
                toast.success('Field updated successfully!');
            } else {
                // Calculate next order value
                const maxOrder = fields.length > 0 ? Math.max(...fields.map(f => f.order || 0)) : 0;
                payload.order = maxOrder + 1;
                payload.type = type; // needed on create
                
                await api.post('/admin/form-fields', payload);
                toast.success('Custom field created successfully!');
            }
            setModalOpen(false);
            fetchFields();
        } catch (err) {
            console.error("Failed to save form field:", err);
            const msg = err.response?.data?.message || 'Failed to save form field.';
            toast.error(msg);
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteTargetId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        setConfirmOpen(false);
        if (!deleteTargetId) return;

        try {
            await api.delete(`/admin/form-fields/${deleteTargetId}`);
            toast.success('Custom field deleted successfully!');
            fetchFields();
        } catch (err) {
            console.error("Failed to delete form field:", err);
            const msg = err.response?.data?.message || 'Failed to delete form field.';
            toast.error(msg);
        } finally {
            setDeleteTargetId(null);
        }
    };

    const handleMove = async (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === fields.length - 1) return;
        
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const list = [...fields];
        
        const fieldA = { ...list[index] };
        const fieldB = { ...list[targetIndex] };
        
        const tempOrder = fieldA.order;
        fieldA.order = fieldB.order;
        fieldB.order = tempOrder;
        
        try {
            // Update order of both fields
            await Promise.all([
                api.put(`/admin/form-fields/${fieldA.id}`, fieldA),
                api.put(`/admin/form-fields/${fieldB.id}`, fieldB)
            ]);
            fetchFields();
        } catch (err) {
            console.error("Failed to reorder fields:", err);
            toast.error('Failed to save field reordering.');
        }
    };

    const toggleFieldStatus = async (field) => {
        if (isCoreField(field)) return;
        const updated = { ...field, is_enabled: !field.is_enabled };
        try {
            await api.put(`/admin/form-fields/${field.id}`, updated);
            toast.success(`Field ${updated.is_enabled ? 'enabled' : 'disabled'} successfully.`);
            fetchFields();
        } catch (err) {
            console.error("Failed to toggle field status:", err);
            toast.error('Failed to update field status.');
        }
    };

    const toggleFieldRequirement = async (field) => {
        if (isCoreField(field)) return;
        const updated = { ...field, is_required: !field.is_required };
        try {
            await api.put(`/admin/form-fields/${field.id}`, updated);
            toast.success(`Field requirements updated successfully.`);
            fetchFields();
        } catch (err) {
            console.error("Failed to toggle field requirement:", err);
            toast.error('Failed to update field validation requirement.');
        }
    };

    const isCoreField = (field) => {
        return ['full_name', 'phone', 'email'].includes(field.field_name);
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Form Management</h1>
                    <p>Customize the inquiries and contact forms with custom dynamic fields.</p>
                </div>
                <button className="admin-btn-primary" onClick={handleOpenCreate}>
                    <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
                    Add Custom Field
                </button>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ width: '80px', textAlign: 'center' }}>Sort</th>
                            <th>Label / Identifier</th>
                            <th>Input Type</th>
                            <th style={{ width: '130px' }}>Required</th>
                            <th style={{ width: '130px' }}>Status</th>
                            <th style={{ width: '150px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading form fields...</td>
                            </tr>
                        ) : fields.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No form fields found.</td>
                            </tr>
                        ) : (
                            fields.map((field, index) => {
                                const isCore = isCoreField(field);
                                return (
                                    <tr key={field.id}>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                                <button
                                                    onClick={() => handleMove(index, 'up')}
                                                    disabled={index === 0}
                                                    style={{ border: 'none', background: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', color: index === 0 ? '#cbd5e1' : '#c9a45c' }}
                                                    title="Move Up"
                                                >
                                                    <i className="fas fa-chevron-up"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleMove(index, 'down')}
                                                    disabled={index === fields.length - 1}
                                                    style={{ border: 'none', background: 'none', cursor: index === fields.length - 1 ? 'not-allowed' : 'pointer', color: index === fields.length - 1 ? '#cbd5e1' : '#c9a45c' }}
                                                    title="Move Down"
                                                >
                                                    <i className="fas fa-chevron-down"></i>
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <strong style={{ color: '#1e293b', fontSize: '1rem' }}>{field.label}</strong>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>
                                                    {field.field_name} {isCore && <span style={{ color: '#c9a45c', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginLeft: '5px' }}>(Core Field)</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ textTransform: 'capitalize', fontSize: '0.9rem', padding: '4px 8px', background: '#f1f5f9', borderRadius: '6px', color: '#475569', fontWeight: 500 }}>
                                                {field.type}
                                            </span>
                                            {field.type === 'select' && field.options && (
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '5px' }}>
                                                    Options: {field.options.slice(0, 3).join(', ')}{field.options.length > 3 ? '...' : ''}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => toggleFieldRequirement(field)}
                                                disabled={isCore}
                                                style={{ border: 'none', background: 'none', padding: 0, cursor: isCore ? 'default' : 'pointer' }}
                                            >
                                                <span className={`status-badge ${field.is_required ? 'published' : 'draft'}`}>
                                                    {field.is_required ? 'Required' : 'Optional'}
                                                </span>
                                            </button>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => toggleFieldStatus(field)}
                                                disabled={isCore}
                                                style={{ border: 'none', background: 'none', padding: 0, cursor: isCore ? 'default' : 'pointer' }}
                                            >
                                                <span className={`status-badge ${field.is_enabled ? 'published' : 'draft'}`}>
                                                    {field.is_enabled ? 'Active' : 'Disabled'}
                                                </span>
                                            </button>
                                        </td>
                                        <td>
                                            <div className="action-row" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleOpenEdit(field)}
                                                    className="action-btn edit-btn"
                                                    title="Edit Field Configuration"
                                                    style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' }}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(field.id)}
                                                    className="action-btn delete-btn"
                                                    disabled={isCore}
                                                    style={{ opacity: isCore ? 0.4 : 1, cursor: isCore ? 'not-allowed' : 'pointer' }}
                                                    title={isCore ? 'Core fields cannot be deleted' : 'Delete Field'}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal Overlay */}
            {modalOpen && (
                <div className="consultation-modal-overlay" onClick={() => setModalOpen(false)}>
                    <div 
                        className="consultation-modal-box" 
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '600px', background: '#fff', padding: '30px' }}
                    >
                        <button className="consultation-modal-close" onClick={() => setModalOpen(false)}>
                            <i className="fas fa-times"></i>
                        </button>

                        <div className="consultation-modal-header" style={{ textAlign: 'left', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                            <h2 style={{ fontSize: '1.5rem', color: 'var(--admin-primary)', margin: 0 }}>
                                {editingField ? `Configure Field: ${editingField.label}` : 'Add Custom Field'}
                            </h2>
                            <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: '#64748b' }}>
                                {editingField ? 'Modify validations, label text, select options or status' : 'Introduce a new parameter to lead queries.'}
                            </p>
                        </div>

                        <form onSubmit={handleSaveField} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Field Label</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    placeholder="e.g. Preferred Contact Time"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    required
                                />
                                {formErrors.label && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '5px' }}>{formErrors.label}</div>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Input Type</label>
                                    <select
                                        className="admin-select"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        disabled={editingField && isCoreField(editingField)}
                                    >
                                        <option value="text">Text Input (Short)</option>
                                        <option value="email">Email Address</option>
                                        <option value="tel">Telephone / Phone</option>
                                        <option value="number">Numeric Input</option>
                                        <option value="select">Dropdown Menu (Select)</option>
                                        <option value="textarea">Paragraph Text (Textarea)</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Placeholder text</label>
                                    <input
                                        type="text"
                                        className="admin-input"
                                        placeholder="e.g. Select options..."
                                        value={placeholder}
                                        onChange={(e) => setPlaceholder(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Select Option Manager */}
                            {type === 'select' && (
                                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '10px' }}>
                                        Dropdown Options
                                    </label>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            style={{ background: '#fff' }}
                                            placeholder="Enter option value..."
                                            value={newOption}
                                            onChange={(e) => setNewOption(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddOption(e);
                                                }
                                            }}
                                        />
                                        <button 
                                            type="button" 
                                            className="admin-btn-primary" 
                                            onClick={handleAddOption}
                                            style={{ padding: '0 20px', flexShrink: 0 }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                    {formErrors.options && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '10px' }}>{formErrors.options}</div>}

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {options.length === 0 ? (
                                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No options defined yet. Add at least one option.</span>
                                        ) : (
                                            options.map((opt, i) => (
                                                <div 
                                                    key={i} 
                                                    style={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        background: '#fff', 
                                                        border: '1px solid #cbd5e1', 
                                                        padding: '4px 10px', 
                                                        borderRadius: '20px', 
                                                        fontSize: '0.85rem',
                                                        color: '#334155',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    <span>{opt}</span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleRemoveOption(i)}
                                                        style={{ 
                                                            border: 'none', 
                                                            background: 'none', 
                                                            marginLeft: '8px', 
                                                            cursor: 'pointer', 
                                                            color: '#ef4444', 
                                                            padding: 0,
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <i className="fas fa-times-circle"></i>
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Checks */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '5px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: (editingField && isCoreField(editingField)) ? 'not-allowed' : 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={isRequired}
                                        onChange={(e) => setIsRequired(e.target.checked)}
                                        disabled={editingField && isCoreField(editingField)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>Validation Required</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Make this field compulsory to submit.</div>
                                    </div>
                                </label>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: (editingField && isCoreField(editingField)) ? 'not-allowed' : 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={isEnabled}
                                        onChange={(e) => setIsEnabled(e.target.checked)}
                                        disabled={editingField && isCoreField(editingField)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>Field Enabled</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Active fields show up in public forms.</div>
                                    </div>
                                </label>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '15px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setModalOpen(false)} 
                                    className="admin-btn-secondary"
                                    style={{ padding: '12px 25px' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="admin-btn-primary"
                                    style={{ padding: '12px 30px' }}
                                >
                                    Save Field
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={confirmOpen}
                title="Delete Custom Field"
                message="Are you sure you want to permanently delete this custom form field? This action cannot be undone, and existing submissions for this field will remain in database archives under serial values."
                confirmText="Delete Field"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default FormManager;
