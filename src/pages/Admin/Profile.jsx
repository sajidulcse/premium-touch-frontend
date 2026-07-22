import React, { useState, useEffect } from 'react';
import api, { getStorageUrl } from '../../api/axios';
import './Admin.css';
import { useToast } from '../../context/ToastContext';

const Profile = () => {
    const toast = useToast();
    const [admin, setAdmin] = useState({
        name: '',
        email: '',
        profile_picture: '',
        role: '',
        last_login_at: '',
        created_at: ''
    });

    const [profileData, setProfileData] = useState({ name: '', email: '' });
    const [passwords, setPasswords] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });

    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [imgError, setImgError] = useState(false);
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Password visibility toggle states for main form
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    // Forgot password modal & 2-step OTP flow state
    const [forgotModalOpen, setForgotModalOpen] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Reset
    const [sendingForgot, setSendingForgot] = useState(false);
    const [resettingForgot, setResettingForgot] = useState(false);
    const [forgotData, setForgotData] = useState({
        token: '',
        password: '',
        password_confirmation: ''
    });
    const [showForgotPass, setShowForgotPass] = useState(false);
    const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);

    // Live Countdown Timers
    const [otpTimer, setOtpTimer] = useState(0); // 120 seconds OTP validity countdown
    const [blockTimer, setBlockTimer] = useState(0); // rate limit block countdown (e.g., 180s)

    // OTP Validity Countdown Effect
    useEffect(() => {
        let interval = null;
        if (otpTimer > 0) {
            interval = setInterval(() => {
                setOtpTimer((prev) => prev - 1);
            }, 1000);
        } else if (otpTimer === 0 && interval) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [otpTimer]);

    // Rate Limit Block Timer Countdown Effect
    useEffect(() => {
        let interval = null;
        if (blockTimer > 0) {
            interval = setInterval(() => {
                setBlockTimer((prev) => prev - 1);
            }, 1000);
        } else if (blockTimer === 0 && interval) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [blockTimer]);

    const formatTimer = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/profile');
            setAdmin(res.data);
            setProfileData({
                name: res.data.name || '',
                email: res.data.email || ''
            });
            if (res.data.profile_picture) {
                setPreview(getStorageUrl(res.data.profile_picture));
                setImgError(false);
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            toast.error('Failed to load profile details.');
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image size must be less than 10MB.');
            return;
        }
        setImage(file);
        setPreview(URL.createObjectURL(file));
        setImgError(false);
    };

    // Update Profile Details
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdatingProfile(true);
        try {
            const data = new FormData();
            data.append('name', profileData.name);
            data.append('email', profileData.email);
            if (image) {
                data.append('profile_picture', image);
            }

            const res = await api.post('/profile', data);
            toast.success('Profile details updated successfully!');
            localStorage.setItem('admin', JSON.stringify(res.data.user || res.data));
            fetchProfile();
        } catch (err) {
            console.error('Profile update error:', err);
            toast.error(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setUpdatingProfile(false);
        }
    };

    // Change Password using Current Password
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!passwords.current_password) {
            toast.error('Please enter your current password.');
            return;
        }
        if (passwords.new_password !== passwords.new_password_confirmation) {
            toast.error('New password and confirmation do not match.');
            return;
        }
        if (passwords.new_password.length < 6) {
            toast.error('New password must be at least 6 characters long.');
            return;
        }

        setChangingPassword(true);
        try {
            const res = await api.post('/change-password', {
                current_password: passwords.current_password,
                new_password: passwords.new_password,
                new_password_confirmation: passwords.new_password_confirmation
            });
            toast.success(res.data.message || 'Password changed successfully!');
            setPasswords({
                current_password: '',
                new_password: '',
                new_password_confirmation: ''
            });
        } catch (err) {
            console.error('Password change error:', err);
            toast.error(err.response?.data?.message || 'Failed to change password. Please check your current password.');
        } finally {
            setChangingPassword(false);
        }
    };

    // Step 1: Request Password Reset OTP
    const handleForgotPasswordRequest = async () => {
        if (blockTimer > 0) {
            toast.error(`OTP request blocked. Please try again in ${formatTimer(blockTimer)}.`);
            return;
        }

        setSendingForgot(true);
        try {
            const res = await api.post('/forgot-password', { email: admin.email });
            toast.success(res.data.message || 'Verification code sent. Please check your email inbox.');
            setForgotStep(2);
            setOtpTimer(120); // Start 2-minute OTP validity timer
        } catch (err) {
            console.error('Forgot password error:', err);
            const errData = err.response?.data;
            if (err.response?.status === 429 || errData?.is_blocked) {
                const retryAfter = errData?.retry_after || 180;
                setBlockTimer(retryAfter);
                toast.error(`Too many attempts! OTP request is blocked for ${formatTimer(retryAfter)}.`);
            } else {
                toast.error(errData?.message || 'Failed to send verification code. Please try again.');
            }
        } finally {
            setSendingForgot(false);
        }
    };

    // Step 2: Verify OTP Code & Set New Password
    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        if (otpTimer === 0) {
            toast.error('Verification code has expired. Please click Resend OTP.');
            return;
        }
        if (!forgotData.token) {
            toast.error('Please enter the 6-digit verification code.');
            return;
        }
        if (forgotData.password !== forgotData.password_confirmation) {
            toast.error('Passwords do not match.');
            return;
        }
        if (forgotData.password.length < 6) {
            toast.error('Password must be at least 6 characters long.');
            return;
        }

        setResettingForgot(true);
        try {
            const res = await api.post('/reset-password', {
                email: admin.email,
                token: forgotData.token,
                password: forgotData.password,
                password_confirmation: forgotData.password_confirmation
            });
            toast.success(res.data.message || 'Password has been reset successfully!');
            closeForgotModal();
        } catch (err) {
            console.error('Reset password error:', err);
            toast.error(err.response?.data?.message || 'Failed to reset password. Check verification code.');
        } finally {
            setResettingForgot(false);
        }
    };

    const closeForgotModal = () => {
        setForgotModalOpen(false);
        setForgotStep(1);
        setForgotData({ token: '', password: '', password_confirmation: '' });
    };

    const isSuperAdmin = admin.role === 'Super Admin';

    return (
        <div className="admin-page-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {/* Page Header */}
            <div className="admin-page-header">
                <div>
                    <h1>My Profile</h1>
                    <p>Manage your identity, security credentials, and system role settings.</p>
                </div>
            </div>

            {/* Profile Header Banner */}
            <div className="admin-card" style={{
                padding: '30px',
                marginBottom: '30px',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#fff',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '30px',
                flexWrap: 'wrap'
            }}>
                <div style={{ position: 'relative' }}>
                    <img
                        src={imgError || !preview ? `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name || 'Admin')}&background=c9a45c&color=fff&size=128` : preview}
                        alt="Profile"
                        style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '4px solid var(--admin-gold)',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                        }}
                        onError={() => setImgError(true)}
                    />
                    <label htmlFor="avatar-upload" style={{
                        position: 'absolute',
                        bottom: '4px',
                        right: '4px',
                        background: 'var(--admin-gold)',
                        color: '#fff',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s'
                    }} title="Change Photo">
                        <i className="fas fa-camera" style={{ fontSize: '13px' }}></i>
                    </label>
                    <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                    />
                </div>

                <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#f8fafc' }}>{admin.name || 'Administrator'}</h2>
                        <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            letterSpacing: '0.03em',
                            background: isSuperAdmin ? 'rgba(201, 164, 92, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                            color: isSuperAdmin ? '#f59e0b' : '#38bdf8',
                            border: isSuperAdmin ? '1px solid rgba(201, 164, 92, 0.4)' : '1px solid rgba(56, 189, 248, 0.4)'
                        }}>
                            <i className={isSuperAdmin ? 'fas fa-crown' : 'fas fa-user-shield'} style={{ marginRight: '6px' }}></i>
                            {admin.role || 'Super Admin'}
                        </span>
                    </div>

                    <p style={{ margin: '0 0 12px 0', color: '#94a3b8', fontSize: '0.95rem' }}>
                        <i className="fas fa-envelope" style={{ marginRight: '8px', color: '#64748b' }}></i>
                        {admin.email}
                    </p>

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.85rem', color: '#cbd5e1' }}>
                        <span>
                            <i className="fas fa-clock" style={{ marginRight: '6px', color: '#c9a45c' }}></i>
                            Last Active: {admin.last_login_at ? new Date(admin.last_login_at).toLocaleString() : 'Just now'}
                        </span>
                        <span>
                            <i className="fas fa-check-circle" style={{ marginRight: '6px', color: '#10b981' }}></i>
                            Status: Active
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Profile Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '25px' }}>
                
                {/* Card 1: Personal Details */}
                <div className="admin-card" style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '15px' }}>
                        <i className="fas fa-id-card" style={{ color: 'var(--admin-gold)', fontSize: '1.3rem' }}></i>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Personal Details</h3>
                    </div>

                    <form onSubmit={handleUpdateProfile} autoComplete="off">
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Full Name</label>
                            <input
                                type="text"
                                className="admin-input"
                                required
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Email Address</label>
                            <input
                                type="email"
                                className="admin-input"
                                required
                                value={profileData.email}
                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                placeholder="Enter your email address"
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Assigned Security Role</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={admin.role || 'Super Admin'}
                                disabled
                                style={{ background: 'rgba(255,255,255,0.03)', cursor: 'not-allowed', color: '#94a3b8' }}
                            />
                            <small style={{ color: '#64748b', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                                Security roles can only be updated by a Super Administrator.
                            </small>
                        </div>

                        <button
                            type="submit"
                            className="admin-btn-primary"
                            disabled={updatingProfile}
                            style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            {updatingProfile ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Saving...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i> Save Profile Details
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Card 2: Change Password */}
                <div className="admin-card" style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fas fa-shield-alt" style={{ color: 'var(--admin-gold)', fontSize: '1.3rem' }}></i>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Change Password</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setForgotStep(1);
                                setForgotModalOpen(true);
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#38bdf8',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                textDecoration: 'underline'
                            }}
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <form onSubmit={handleChangePassword} autoComplete="off">
                        {/* Dummy inputs to prevent aggressive autofill */}
                        <input type="text" name="fakeusernameremembered" style={{ display: 'none' }} tabIndex="-1" />
                        <input type="password" name="fakepasswordremembered" style={{ display: 'none' }} tabIndex="-1" />

                        <div className="form-group" style={{ marginBottom: '18px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Current Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showCurrentPass ? "text" : "password"}
                                    className="admin-input"
                                    required
                                    placeholder="Enter your current password"
                                    autoComplete="new-password"
                                    value={passwords.current_password}
                                    onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                                    style={{ paddingRight: '45px', width: '100%', boxSizing: 'border-box' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
                                        padding: '4px', fontSize: '0.95rem'
                                    }}
                                    title={showCurrentPass ? "Hide password" : "Show password"}
                                >
                                    <i className={showCurrentPass ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                </button>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '18px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showNewPass ? "text" : "password"}
                                    className="admin-input"
                                    required
                                    placeholder="Enter new password (min 6 chars)"
                                    autoComplete="new-password"
                                    value={passwords.new_password}
                                    onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                                    style={{ paddingRight: '45px', width: '100%', boxSizing: 'border-box' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPass(!showNewPass)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
                                        padding: '4px', fontSize: '0.95rem'
                                    }}
                                    title={showNewPass ? "Hide password" : "Show password"}
                                >
                                    <i className={showNewPass ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                </button>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Confirm New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPass ? "text" : "password"}
                                    className="admin-input"
                                    required
                                    placeholder="Confirm your new password"
                                    autoComplete="new-password"
                                    value={passwords.new_password_confirmation}
                                    onChange={(e) => setPasswords({ ...passwords, new_password_confirmation: e.target.value })}
                                    style={{ paddingRight: '45px', width: '100%', boxSizing: 'border-box' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
                                        padding: '4px', fontSize: '0.95rem'
                                    }}
                                    title={showConfirmPass ? "Hide password" : "Show password"}
                                >
                                    <i className={showConfirmPass ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="admin-btn-primary"
                            disabled={changingPassword}
                            style={{
                                width: '100%', padding: '12px', background: '#3b82f6', borderColor: '#3b82f6',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            {changingPassword ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Updating Password...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-key"></i> Update Password
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Forgot Password 2-Step OTP Reset Modal */}
            {forgotModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.75)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="admin-card" style={{ width: '100%', maxWidth: '440px', padding: '30px' }}>
                        
                        {/* Rate Limit Block Banner */}
                        {blockTimer > 0 && (
                            <div style={{
                                background: '#fef2f2', border: '1px solid #f87171', borderLeft: '4px solid #ef4444',
                                color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
                                fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '10px'
                            }}>
                                <i className="fas fa-exclamation-triangle" style={{ fontSize: '1.1rem', flexShrink: 0 }}></i>
                                <div>
                                    <strong>Too Many Requests:</strong> OTP sending is blocked. Try again in <strong>{formatTimer(blockTimer)}</strong>.
                                </div>
                            </div>
                        )}

                        {/* Step 1: Send OTP Code */}
                        {forgotStep === 1 ? (
                            <div>
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '50%',
                                        background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8',
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.5rem', marginBottom: '12px'
                                    }}>
                                        <i className="fas fa-envelope-open-text"></i>
                                    </div>
                                    <h3 style={{ margin: '0 0 8px 0' }}>Send Recovery OTP Code</h3>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5 }}>
                                        We will send a 6-digit OTP verification code to <strong>{admin.email}</strong> to reset your password.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '25px' }}>
                                    <button
                                        type="button"
                                        className="admin-btn-secondary"
                                        onClick={closeForgotModal}
                                        style={{ flex: 1, padding: '10px' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-btn-primary"
                                        onClick={handleForgotPasswordRequest}
                                        disabled={sendingForgot || blockTimer > 0}
                                        style={{
                                            flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            opacity: blockTimer > 0 ? 0.6 : 1, cursor: blockTimer > 0 ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {sendingForgot ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i> Sending...
                                            </>
                                        ) : blockTimer > 0 ? (
                                            <>
                                                <i className="fas fa-lock"></i> Blocked
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-paper-plane"></i> Send OTP Code
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Step 2: Verify OTP Code & Set New Password */
                            <form onSubmit={handleResetPasswordSubmit} autoComplete="off">
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '50%',
                                        background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.5rem', marginBottom: '12px'
                                    }}>
                                        <i className="fas fa-shield-alt"></i>
                                    </div>
                                    <h3 style={{ margin: '0 0 8px 0' }}>Enter OTP & New Password</h3>
                                    <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                                        Verification code sent to <strong>{admin.email}</strong>
                                    </p>

                                    {/* Live OTP Validity Countdown Badge */}
                                    {otpTimer > 0 ? (
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                            padding: '4px 12px', borderRadius: '12px', fontSize: '0.82rem',
                                            fontWeight: '600', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399',
                                            border: '1px solid rgba(16, 185, 129, 0.3)'
                                        }}>
                                            <i className="fas fa-stopwatch"></i> OTP expires in {formatTimer(otpTimer)}
                                        </span>
                                    ) : (
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                            padding: '4px 12px', borderRadius: '12px', fontSize: '0.82rem',
                                            fontWeight: '600', background: 'rgba(239, 68, 68, 0.12)', color: '#f87171',
                                            border: '1px solid rgba(239, 68, 68, 0.3)'
                                        }}>
                                            <i className="fas fa-exclamation-circle"></i> OTP Expired! Click Resend OTP below.
                                        </span>
                                    )}
                                </div>

                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem' }}>6-Digit OTP Code</label>
                                    <input
                                        type="text"
                                        className="admin-input"
                                        maxLength={6}
                                        required
                                        placeholder="Enter 6-digit OTP"
                                        value={forgotData.token}
                                        onChange={(e) => setForgotData({ ...forgotData, token: e.target.value })}
                                        style={{ letterSpacing: '4px', fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center' }}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem' }}>New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showForgotPass ? "text" : "password"}
                                            className="admin-input"
                                            required
                                            placeholder="Enter new password (min 6 chars)"
                                            autoComplete="new-password"
                                            value={forgotData.password}
                                            onChange={(e) => setForgotData({ ...forgotData, password: e.target.value })}
                                            style={{ paddingRight: '45px', width: '100%', boxSizing: 'border-box' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotPass(!showForgotPass)}
                                            style={{
                                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                                background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px'
                                            }}
                                        >
                                            <i className={showForgotPass ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem' }}>Confirm New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showForgotConfirmPass ? "text" : "password"}
                                            className="admin-input"
                                            required
                                            placeholder="Confirm new password"
                                            autoComplete="new-password"
                                            value={forgotData.password_confirmation}
                                            onChange={(e) => setForgotData({ ...forgotData, password_confirmation: e.target.value })}
                                            style={{ paddingRight: '45px', width: '100%', boxSizing: 'border-box' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)}
                                            style={{
                                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                                background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px'
                                            }}
                                        >
                                            <i className={showForgotConfirmPass ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className="admin-btn-secondary"
                                        onClick={closeForgotModal}
                                        style={{ flex: 1, padding: '10px' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-btn-secondary"
                                        onClick={handleForgotPasswordRequest}
                                        disabled={sendingForgot || blockTimer > 0}
                                        style={{
                                            padding: '10px 14px',
                                            fontSize: '0.85rem',
                                            opacity: blockTimer > 0 ? 0.5 : 1,
                                            cursor: blockTimer > 0 ? 'not-allowed' : 'pointer'
                                        }}
                                        title={blockTimer > 0 ? "OTP requests are temporarily blocked" : "Request a fresh OTP code"}
                                    >
                                        {sendingForgot ? (
                                            <i className="fas fa-spinner fa-spin"></i>
                                        ) : blockTimer > 0 ? (
                                            <><i className="fas fa-lock"></i> Blocked</>
                                        ) : (
                                            <><i className="fas fa-redo"></i> Resend</>
                                        )}
                                    </button>
                                    <button
                                        type="submit"
                                        className="admin-btn-primary"
                                        disabled={resettingForgot || otpTimer === 0}
                                        style={{
                                            flex: 1.5, padding: '10px', background: '#10b981', borderColor: '#10b981',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            opacity: otpTimer === 0 ? 0.6 : 1, cursor: otpTimer === 0 ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {resettingForgot ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i> Resetting...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-check-circle"></i> Reset Password
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
