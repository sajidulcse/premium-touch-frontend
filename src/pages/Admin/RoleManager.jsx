import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';
import { useToast } from '../../context/ToastContext';

const permissionGroups = {
    "Dashboard": ["dashboard.view"],
    "Navbar & Categories": ["categories.view", "categories.create", "categories.edit", "categories.delete"],
    "Settings & Homepage": ["settings.view", "settings.edit", "settings.security", "homepage.manage"],
    "Projects": ["projects.view", "projects.create", "projects.edit", "projects.delete"],
    "Portfolios": ["portfolios.view", "portfolios.create", "portfolios.edit", "portfolios.delete"],
    "Services": ["services.view", "services.create", "services.edit", "services.delete"],
    "Blogs": ["blogs.view", "blogs.create", "blogs.edit", "blogs.delete", "blog_categories.view", "blog_categories.create", "blog_categories.edit", "blog_categories.delete"],
    "Comments": ["comments.view", "comments.reply", "comments.approve", "comments.delete"],
    "Gallery & Media": ["gallery.view", "gallery.create", "gallery.edit", "gallery.delete"],
    "Team Members": ["team.view", "team.create", "team.edit", "team.delete"],
    "Careers": ["careers.view", "careers.create", "careers.edit", "careers.delete"],
    "Consultations & Forms": ["consultations.view", "consultations.delete", "form_fields.manage"],
    "Cost Estimator": ["estimator.view", "estimator.settings.manage", "estimator.leads.view", "estimator.leads.delete"],
    "User Management": ["users.view", "users.create", "users.edit", "users.delete", "users.toggle_status"],
    "Roles & Access Control": ["roles.view", "roles.create", "roles.edit", "roles.delete", "permissions.view"]
};

const RoleManager = () => {
    const toast = useToast();
    const { hasPermission } = useAuth();
    const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'form'
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);


    const [editingId, setEditingId] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    // Form inputs
    const [roleName, setRoleName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState([]);

    useEffect(() => {
        fetchRolesAndPermissions();
    }, []);

    const fetchRolesAndPermissions = async () => {
        setLoading(true);
        try {
            const [rolesRes, permissionsRes] = await Promise.all([
                api.get('/admin/roles'),
                api.get('/admin/permissions')
            ]);
            setRoles(rolesRes.data);
            setPermissions(permissionsRes.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to retrieve role or permission lists.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (role) => {
        setEditingId(role.id);
        setRoleName(role.name);
        setSelectedPermissions(role.permissions.map(p => p.name));
        setActiveTab('form'); // Switch tab to editing form dynamically
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
            await api.delete(`/admin/roles/${deleteTargetId}`);
            toast.success('Role successfully deleted.');
            fetchRolesAndPermissions();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete role.');
        } finally {
            setDeleteTargetId(null);
        }
    };

    const handlePermissionToggle = (permName) => {
        setSelectedPermissions(prev => {
            if (prev.includes(permName)) {
                return prev.filter(p => p !== permName);
            } else {
                return [...prev, permName];
            }
        });
    };

    const handleSelectAllGroup = (groupPerms, selectAll) => {
        setSelectedPermissions(prev => {
            const filtered = prev.filter(p => !groupPerms.includes(p));
            return selectAll ? [...filtered, ...groupPerms] : filtered;
        });
    };

    const handleSelectAllSystem = (selectAll) => {
        setSelectedPermissions(selectAll ? permissions.map(p => p.name) : []);
    };

    const handleCancelForm = () => {
        setEditingId(null);
        setRoleName('');
        setSelectedPermissions([]);
        setActiveTab('directory');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!roleName.trim()) {
            toast.error('Role name cannot be empty.');
            return;
        }

        try {
            const payload = {
                name: roleName.trim(),
                permissions: selectedPermissions
            };

            if (editingId) {
                await api.put(`/admin/roles/${editingId}`, payload);
                toast.success('Role settings updated successfully.');
            } else {
                await api.post('/admin/roles', payload);
                toast.success('New role created successfully.');
            }

            // Reset form and switch tab
            setEditingId(null);
            setRoleName('');
            setSelectedPermissions([]);
            setActiveTab('directory');
            fetchRolesAndPermissions();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save role settings.');
        }
    };

    const protectedRoles = ['Super Admin'];

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Role & Access Management</h1>
                    <p>Configure permission matrices and roles across the organization.</p>
                </div>
            </div>

            {/* Visual Navigation Tabs */}
            <div className="admin-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', marginBottom: '25px', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button 
                        className={`tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
                        onClick={() => setActiveTab('directory')}
                        style={{
                            background: 'none', border: 'none', outline: 'none', padding: '8px 16px', cursor: 'pointer',
                            fontSize: '0.95rem', fontWeight: 600, color: activeTab === 'directory' ? '#c9a45c' : '#64748b',
                            borderBottom: activeTab === 'directory' ? '2px solid #c9a45c' : '2px solid transparent',
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        <i className="fas fa-folder" style={{ marginRight: '8px' }}></i>Role Directory
                    </button>
                    {((!editingId && hasPermission('roles.create')) || (editingId && hasPermission('roles.edit'))) && (
                        <button 
                            className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`}
                            onClick={() => setActiveTab('form')}
                            style={{
                                background: 'none', border: 'none', outline: 'none', padding: '8px 16px', cursor: 'pointer',
                                fontSize: '0.95rem', fontWeight: 600, color: activeTab === 'form' ? '#c9a45c' : '#64748b',
                                borderBottom: activeTab === 'form' ? '2px solid #c9a45c' : '2px solid transparent',
                                transition: 'all 0.2s ease-in-out'
                            }}
                        >
                            <i className="fas fa-user-tag" style={{ marginRight: '8px' }}></i>
                            {editingId ? `Modify Role: ${roleName}` : 'Create New Role'}
                        </button>
                    )}
                </div>

                {activeTab === 'directory' && hasPermission('roles.create') && (
                    <button 
                        className="admin-btn-primary" 
                        onClick={() => {
                            setEditingId(null);
                            setRoleName('');
                            setSelectedPermissions([]);
                            setActiveTab('form');
                        }}
                        style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
                    >
                        <i className="fas fa-plus"></i> Add New Role
                    </button>
                )}
            </div>

            <div className="admin-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
                
                {/* Tab 1: Role Directory */}
                {activeTab === 'directory' && (
                    <div className="admin-card admin-table-container">
                        <h3 style={{ padding: '20px 25px 0 25px', margin: 0 }}>Active Role Directory</h3>
                        <table className="admin-table" style={{ marginTop: '15px' }}>
                            <thead>
                                <tr>
                                    <th>Role Identifier</th>
                                    <th>Permission Scopes Count</th>
                                    <th>Permissions List</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && roles.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Retrieving roles database...</td></tr>
                                ) : roles.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No security roles defined.</td></tr>
                                ) : (
                                    roles.map((role) => (
                                        <tr key={role.id}>
                                            <td style={{ width: '150px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {protectedRoles.includes(role.name) && (
                                                        <i className="fas fa-lock" style={{ color: '#94a3b8', fontSize: '11px' }} title="System Protected"></i>
                                                    )}
                                                    <strong>{role.name}</strong>
                                                </div>
                                            </td>
                                            <td style={{ width: '120px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '20px',
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    background: '#f1f5f9',
                                                    color: '#475569'
                                                }}>
                                                    {role.permissions.length} items
                                                </span>
                                            </td>
                                            <td style={{ maxWidth: '400px' }}>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                    {role.name === 'Super Admin' ? (
                                                        <span style={{ fontSize: '11px', color: '#16a34a', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                                            * (All Access Bypass)
                                                        </span>
                                                    ) : role.permissions.length === 0 ? (
                                                        <span style={{ fontSize: '11px', color: '#ef4444', fontStyle: 'italic' }}>No permission privileges configured</span>
                                                    ) : (
                                                        role.permissions.slice(0, 10).map(p => (
                                                            <span key={p.id} style={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                                                {p.name}
                                                            </span>
                                                        ))
                                                    )}
                                                    {role.name !== 'Super Admin' && role.permissions.length > 10 && (
                                                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center' }}>
                                                            + {role.permissions.length - 10} more
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ width: '120px' }}>
                                                <div className="action-row">
                                                    {!protectedRoles.includes(role.name) && hasPermission('roles.edit') && (
                                                        <button onClick={() => handleEdit(role)} className="action-btn edit-btn" title="Edit Role Permissions">
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                    )}
                                                    {!protectedRoles.includes(role.name) && hasPermission('roles.delete') && (
                                                        <button onClick={() => handleDeleteClick(role.id)} className="action-btn delete-btn" title="Delete Role">
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Tab 2: Create / Edit Role Form */}
                {activeTab === 'form' && ((!editingId && hasPermission('roles.create')) || (editingId && hasPermission('roles.edit'))) && (
                    <div className="admin-card" style={{ padding: '30px' }}>
                        <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
                            {editingId ? `Modify Role: ${roleName}` : 'Create New Security Role'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{ marginBottom: '25px', maxWidth: '400px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Role Identifier</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    placeholder="e.g. Content Writer"
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                    disabled={editingId && protectedRoles.includes(roleName)}
                                    required
                                />
                                {editingId && protectedRoles.includes(roleName) && (
                                    <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                        <i className="fas fa-lock" style={{ marginRight: '4px' }}></i> This is a system-protected role and cannot be renamed.
                                    </span>
                                )}
                            </div>

                            {editingId && protectedRoles.includes(roleName) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', background: '#fffbeb', border: '1px solid #fef3c7', borderLeft: '4px solid #d97706', borderRadius: '8px', color: '#b45309', fontSize: '13px', fontWeight: '500', marginBottom: '20px' }}>
                                    <i className="fas fa-exclamation-triangle" style={{ fontSize: '15px' }}></i>
                                    <span><strong>Warning:</strong> Permissions for the <strong>Super Admin</strong> role are locked to prevent accidental system-wide lockout.</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                                <h4 style={{ margin: 0, fontWeight: '700', fontSize: '15px' }}>Configure Permission Mapping</h4>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        type="button" 
                                        className="admin-btn-secondary" 
                                        onClick={() => handleSelectAllSystem(true)}
                                        disabled={editingId && protectedRoles.includes(roleName)}
                                        style={{ padding: '6px 12px', fontSize: '11px', opacity: (editingId && protectedRoles.includes(roleName)) ? 0.5 : 1, cursor: (editingId && protectedRoles.includes(roleName)) ? 'not-allowed' : 'pointer' }}
                                    >
                                        Select All System
                                    </button>
                                    <button 
                                        type="button" 
                                        className="admin-btn-secondary" 
                                        onClick={() => handleSelectAllSystem(false)}
                                        disabled={editingId && protectedRoles.includes(roleName)}
                                        style={{ padding: '6px 12px', fontSize: '11px', opacity: (editingId && protectedRoles.includes(roleName)) ? 0.5 : 1, cursor: (editingId && protectedRoles.includes(roleName)) ? 'not-allowed' : 'pointer' }}
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>

                            {/* Grouped Permission Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '15px' }}>
                                {Object.entries(permissionGroups).map(([groupName, groupPerms]) => {
                                    const allChecked = groupPerms.every(p => selectedPermissions.includes(p));

                                    return (
                                        <div key={groupName} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px', background: '#f8fafc' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>
                                                <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{groupName}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectAllGroup(groupPerms, !allChecked)}
                                                    disabled={editingId && protectedRoles.includes(roleName)}
                                                    style={{ border: 'none', background: 'none', color: '#c9a45c', cursor: (editingId && protectedRoles.includes(roleName)) ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: '600', opacity: (editingId && protectedRoles.includes(roleName)) ? 0.5 : 1 }}
                                                >
                                                    {allChecked ? 'Deselect Group' : 'Select Group'}
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {groupPerms.map(perm => (
                                                    <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: (editingId && protectedRoles.includes(roleName)) ? 'not-allowed' : 'pointer', fontSize: '12.5px', color: '#334155' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPermissions.includes(perm)}
                                                            onChange={() => handlePermissionToggle(perm)}
                                                            disabled={editingId && protectedRoles.includes(roleName)}
                                                            style={{ width: '16px', height: '16px', accentColor: '#c9a45c', cursor: (editingId && protectedRoles.includes(roleName)) ? 'not-allowed' : 'pointer' }}
                                                        />
                                                        <span style={{ fontFamily: 'monospace' }}>{perm}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                <button
                                    type="button"
                                    className="admin-btn-secondary"
                                    onClick={handleCancelForm}
                                    style={{ padding: '12px 30px' }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="admin-btn-primary" style={{ padding: '12px 30px' }}>
                                    {editingId ? 'Update Role Settings' : 'Create Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            <ConfirmModal 
                isOpen={confirmOpen}
                title="Delete Security Role"
                message="Are you sure you want to delete this role? Any administrator profile currently carrying this role will lose their assigned permission scopes."
                confirmText="Delete Role"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default RoleManager;
