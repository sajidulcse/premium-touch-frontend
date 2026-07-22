import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';
import { useToast } from '../../context/ToastContext';

const UserManager = () => {
    const toast = useToast();
    const { hasPermission } = useAuth();
    const loggedInAdmin = JSON.parse(localStorage.getItem('admin') || sessionStorage.getItem('admin'));
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [filters, setFilters] = useState({ search: '', status: '', role: '', page: 1 });


    // Modal control
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    // Form states
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: '', is_active: true });
    const [passwordData, setPasswordData] = useState({ password: '', password_confirmation: '' });
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    // Password visibility toggle states
    const [showTempPass, setShowTempPass] = useState(false);
    const [showResetPass, setShowResetPass] = useState(false);
    const [showResetConfirmPass, setShowResetConfirmPass] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [filters.page, filters.status, filters.role]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {
                page: filters.page,
                per_page: 8
            };
            if (filters.search) params.search = filters.search;
            if (filters.status !== '') params.status = filters.status;
            if (filters.role) params.role = filters.role;

            const res = await api.get('/admin/users', { params });
            setUsers(res.data.data);
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total
            });
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch users directory.');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await api.get('/admin/roles');
            setRoles(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, page: 1 }));
        fetchUsers();
    };

    const handleStatusToggle = async (userId) => {
        try {
            const res = await api.post(`/admin/users/${userId}/toggle-status`);
            toast.success(res.data.message);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to toggle account status.');
        }
    };

    const handleOpenCreateModal = () => {
        setCurrentUser(null);
        setFormData({ name: '', email: '', password: '', role: roles[0]?.name || '', is_active: true });
        setUserModalOpen(true);
    };

    const handleOpenEditModal = (user) => {
        setCurrentUser(user);
        setFormData({ name: user.name, email: user.email, password: '', role: user.role, is_active: user.is_active });
        setUserModalOpen(true);
    };

    const handleOpenPasswordModal = (user) => {
        setCurrentUser(user);
        setPasswordData({ password: '', password_confirmation: '' });
        setPasswordModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteTargetId(id);
        setConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        setConfirmDeleteOpen(false);
        if (!deleteTargetId) return;
        try {
            const res = await api.delete(`/admin/users/${deleteTargetId}`);
            toast.success(res.data.message);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete user.');
        } finally {
            setDeleteTargetId(null);
        }
    };

    const handleSubmitUserForm = async (e) => {
        e.preventDefault();
        try {
            if (currentUser) {
                await api.put(`/admin/users/${currentUser.id}`, {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    is_active: formData.is_active
                });
                toast.success('User updated successfully.');
            } else {
                await api.post('/admin/users', formData);
                toast.success('User registered successfully.');
            }
            setUserModalOpen(false);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save user records. Check duplicate emails.');
        }
    };

    const handleSubmitPasswordReset = async (e) => {
        e.preventDefault();
        if (passwordData.password !== passwordData.password_confirmation) {
            toast.error('Password confirmation does not match.');
            return;
        }
        try {
            await api.post(`/admin/users/${currentUser.id}/reset-password`, {
                password: passwordData.password,
                password_confirmation: passwordData.password_confirmation
            });
            toast.success(`Successfully reset password for ${currentUser.name}.`);
            setPasswordModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset user password.');
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>User Management</h1>
                    <p>Register, update roles, or suspend access for administrative users.</p>
                </div>
                {hasPermission('users.create') && (
                    <button className="admin-btn-primary" onClick={handleOpenCreateModal}>
                        <i className="fas fa-user-plus" style={{ marginRight: '8px' }}></i> Add New Admin
                    </button>
                )}
            </div>

            {/* Filters panel */}
            <div className="admin-card" style={{ padding: '20px', marginBottom: '25px' }}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '260px' }}>
                        <input
                            type="text"
                            className="admin-input"
                            placeholder="Search by name or email..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div style={{ width: '170px' }}>
                        <select
                            className="admin-input"
                            value={filters.role}
                            onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
                            style={{ width: '100%', boxSizing: 'border-box' }}
                        >
                            <option value="">All Roles</option>
                            {roles.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ width: '160px' }}>
                        <select
                            className="admin-input"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                            style={{ width: '100%', boxSizing: 'border-box' }}
                        >
                            <option value="">All Statuses</option>
                            <option value="true">Active Only</option>
                            <option value="false">Suspended Only</option>
                        </select>
                    </div>
                    <button type="submit" className="admin-btn-secondary" style={{ padding: '12px 20px' }}>
                        <i className="fas fa-search"></i>
                    </button>
                </form>
            </div>

            {/* Users list table */}
            <div className="admin-card admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Administrative Name</th>
                            <th>Email Address</th>
                            <th style={{ whiteSpace: 'nowrap' }}>Assigned Role</th>
                            <th>Status</th>
                            <th>Last Active</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading administrators...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No administrators matching current filters were found.</td></tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <strong>{user.name || 'N/A'}</strong>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            whiteSpace: 'nowrap',
                                            display: 'inline-block',
                                            background: user.role === 'Super Admin' ? '#fef3c7' : '#e0f2fe',
                                            color: user.role === 'Super Admin' ? '#d97706' : '#0284c7'
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {hasPermission('users.toggle_status') ? (
                                                <button 
                                                    onClick={() => user.id !== loggedInAdmin?.id && handleStatusToggle(user.id)} 
                                                    disabled={user.id === loggedInAdmin?.id}
                                                    style={{
                                                        border: 'none',
                                                        background: 'none',
                                                        cursor: user.id === loggedInAdmin?.id ? 'not-allowed' : 'pointer',
                                                        fontSize: '1.25rem',
                                                        color: user.is_active ? '#10b981' : '#cbd5e1',
                                                        opacity: user.id === loggedInAdmin?.id ? 0.5 : 1,
                                                        transition: 'color 0.2s'
                                                    }}
                                                    title={user.id === loggedInAdmin?.id ? 'You cannot suspend yourself' : (user.is_active ? 'Suspend User' : 'Activate User')}
                                                >
                                                    <i className={`fas ${user.is_active ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                                                </button>
                                            ) : (
                                                <span 
                                                    style={{
                                                        fontSize: '1.25rem',
                                                        color: user.is_active ? '#10b981' : '#cbd5e1',
                                                        marginRight: '8px',
                                                        opacity: 0.7
                                                    }}
                                                >
                                                    <i className={`fas ${user.is_active ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                                                </span>
                                            )}
                                            <span style={{ fontSize: '12px', color: user.is_active ? '#10b981' : '#ef4444', fontWeight: '500' }}>
                                                {user.is_active ? 'Active' : 'Suspended'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ color: '#64748b', fontSize: '13px' }}>
                                        {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never logged in'}
                                    </td>
                                    <td>
                                        <div className="action-row">
                                            {hasPermission('users.edit') && (
                                                <button onClick={() => handleOpenEditModal(user)} className="action-btn edit-btn" title="Edit Profile">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                            )}
                                            {hasPermission('users.edit') && (
                                                <button onClick={() => handleOpenPasswordModal(user)} className="action-btn" style={{ color: '#0f766e', background: '#f0fdfa' }} title="Reset Password">
                                                    <i className="fas fa-key"></i>
                                                </button>
                                            )}
                                            {user.id !== loggedInAdmin?.id && hasPermission('users.delete') && (
                                                <button onClick={() => handleDeleteClick(user.id)} className="action-btn delete-btn" title="Delete User">
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

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '20px' }}>
                        <button
                            className="admin-btn-secondary"
                            disabled={filters.page === 1}
                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                            style={{ padding: '8px 15px', fontSize: '12px' }}
                        >
                            Previous
                        </button>
                        <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#64748b' }}>
                            Page {pagination.current_page} of {pagination.last_page} ({pagination.total} admins)
                        </span>
                        <button
                            className="admin-btn-secondary"
                            disabled={filters.page === pagination.last_page}
                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                            style={{ padding: '8px 15px', fontSize: '12px' }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Create/Edit User Modal */}
            {userModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="admin-card" style={{ width: '100%', maxWidth: '480px', padding: '30px' }}>
                        <h3>{currentUser ? 'Edit Administrator Details' : 'Register New Administrator'}</h3>
                        <form onSubmit={handleSubmitUserForm} style={{ marginTop: '20px' }} autoComplete="off">
                            {/* Dummy hidden inputs to bypass aggressive browser autofill */}
                            <input type="text" name="fakeusernameremembered" style={{ display: 'none' }} tabIndex="-1" />
                            <input type="password" name="fakepasswordremembered" style={{ display: 'none' }} tabIndex="-1" />

                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Full Name</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    required
                                    placeholder="Enter administrator full name"
                                    autoComplete="off"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email Address</label>
                                <input
                                    type="email"
                                    className="admin-input"
                                    required
                                    placeholder="Enter administrator email address"
                                    autoComplete="off"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            {!currentUser && (
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Temporary Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showTempPass ? "text" : "password"}
                                            className="admin-input"
                                            required
                                            placeholder="Enter temporary password (min 6 characters)"
                                            autoComplete="new-password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            style={{ paddingRight: '45px', width: '100%', boxSizing: 'border-box' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowTempPass(!showTempPass)}
                                            style={{
                                                position: 'absolute',
                                                right: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                color: '#94a3b8',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                fontSize: '0.95rem'
                                            }}
                                            title={showTempPass ? "Hide password" : "Show password"}
                                        >
                                            <i className={showTempPass ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                        </button>
                                    </div>
                                </div>
                            )}
                             <div className="form-group" style={{ marginBottom: '15px' }}>
                                 <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Security Role</label>
                                 <select
                                     className="admin-input"
                                     value={formData.role}
                                     onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                     disabled={currentUser && currentUser.id === loggedInAdmin?.id}
                                 >
                                     {roles.map(r => (
                                         <option key={r.id} value={r.name}>{r.name}</option>
                                     ))}
                                 </select>
                                 {currentUser && currentUser.id === loggedInAdmin?.id && (
                                     <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                         You cannot change your own security role.
                                     </span>
                                 )}
                             </div>
                            {(!currentUser || currentUser.id !== loggedInAdmin?.id) && (
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Initial Account Status</label>
                                    <select
                                        className="admin-input"
                                        value={formData.is_active ? '1' : '0'}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.value === '1' })}
                                    >
                                        <option value="1">Active</option>
                                        <option value="0">Suspended / Deactivated</option>
                                    </select>
                                </div>
                            )}
                            <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px' }}>
                                <button type="button" className="admin-btn-secondary" onClick={() => setUserModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="admin-btn-primary">
                                    {currentUser ? 'Save Changes' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {passwordModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="admin-card" style={{ width: '100%', maxWidth: '400px', padding: '30px' }}>
                        <h3>Reset Password for {currentUser?.name}</h3>
                        <form onSubmit={handleSubmitPasswordReset} style={{ marginTop: '20px' }} autoComplete="off">
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showResetPass ? "text" : "password"}
                                        className="admin-input"
                                        required
                                        placeholder="Enter new password (min 6 characters)"
                                        autoComplete="new-password"
                                        value={passwordData.password}
                                        onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                                        style={{ paddingRight: '45px', width: '100%', boxSizing: 'border-box' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowResetPass(!showResetPass)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: '#94a3b8',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            fontSize: '0.95rem'
                                        }}
                                        title={showResetPass ? "Hide password" : "Show password"}
                                    >
                                        <i className={showResetPass ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                    </button>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Confirm Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showResetConfirmPass ? "text" : "password"}
                                        className="admin-input"
                                        required
                                        placeholder="Confirm new password"
                                        autoComplete="new-password"
                                        value={passwordData.password_confirmation}
                                        onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                                        style={{ paddingRight: '45px', width: '100%', boxSizing: 'border-box' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowResetConfirmPass(!showResetConfirmPass)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: '#94a3b8',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            fontSize: '0.95rem'
                                        }}
                                        title={showResetConfirmPass ? "Hide password" : "Show password"}
                                    >
                                        <i className={showResetConfirmPass ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                    </button>
                                </div>
                            </div>
                            <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px' }}>
                                <button type="button" className="admin-btn-secondary" onClick={() => setPasswordModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="admin-btn-primary">
                                    Reset Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmDeleteOpen}
                title="Delete Administrator"
                message="Are you sure you want to delete this administrative profile? This will immediately revoke their access and delete their logs association."
                confirmText="Delete Admin"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDeleteOpen(false)}
            />
        </div>
    );
};

export default UserManager;
