import React, { useState, useEffect } from 'react';
import api, { BASE_URL, getStorageUrl } from '../../api/axios';
import './Admin.css';

const Profile = () => {
    const [admin, setAdmin] = useState({ name: '', email: '', profile_picture: '' });
    const [passwords, setPasswords] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [alert, setAlert] = useState(null);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/profile');
            setAdmin(res.data);
            if (res.data.profile_picture) {
                setPreview(getStorageUrl(res.data.profile_picture));
                setImgError(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImage(file);
        setPreview(URL.createObjectURL(file));
        setImgError(false);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('name', admin.name);
        data.append('email', admin.email);
        if (image) data.append('profile_picture', image);
        if (passwords.new_password) {
            data.append('password', passwords.new_password);
            data.append('password_confirmation', passwords.new_password_confirmation);
        }

        try {
            const res = await api.post('/profile', data);
            setAlert({ type: 'success', msg: 'Profile updated successfully!' });
            localStorage.setItem('admin', JSON.stringify(res.data.user));
            setPasswords({ current_password: '', new_password: '', new_password_confirmation: '' });
            fetchProfile();
        } catch (err) {
            setAlert({ type: 'error', msg: err.response?.data?.message || 'Update failed.' });
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <h1>Profile Settings</h1>
                <p>Manage your account credentials and public identity.</p>
            </div>

            {alert && <div className={`admin-alert alert-${alert.type}`}>{alert.msg}</div>}

            <div className="profile-section">
                <div className="profile-avatar-card">
                    <img
                        src={imgError || !preview ? `https://ui-avatars.com/api/?name=${admin.name || 'Admin'}&background=c9a45c&color=fff` : preview}
                        alt="Profile"
                        className="profile-image-circle"
                        onError={() => setImgError(true)}
                    />
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label>Change Photo</label>
                        <input type="file" onChange={handleImageChange} className="admin-input" />
                    </div>
                </div>

                <div className="profile-form-area">
                    <form onSubmit={handleUpdate} className="admin-form-card">
                        <h3>Personal Information</h3>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={admin.name}
                                onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                className="admin-input"
                                value={admin.email}
                                onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
                            />
                        </div>

                        <h3 style={{ marginTop: '40px' }}>Security</h3>
                        <div className="form-group">
                            <label>New Password (Optional)</label>
                            <input
                                type="password"
                                className="admin-input"
                                placeholder="Leave blank to keep current"
                                value={passwords.new_password}
                                onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                className="admin-input"
                                value={passwords.new_password_confirmation}
                                onChange={(e) => setPasswords({ ...passwords, new_password_confirmation: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="admin-btn-primary" style={{ marginTop: '20px' }}>
                            Update Profile
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
