import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [view, setView] = useState(location.state?.initialView || 'login'); // 'login' | 'forgot' | 'reset' | 'verify-email'
    const [credentials, setCredentials] = useState({ email: location.state?.email || '', password: '' });
    const [siteInfo, setSiteInfo] = useState({ site_name: 'Premium Touch', logo: '' });
    const [remember, setRemember] = useState(false);

    // Fetch site info dynamically on mount
    useEffect(() => {
        const fetchSiteInfo = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/site-info`);
                setSiteInfo(res.data);
            } catch (err) {
                console.error("Failed to fetch site info:", err);
            }
        };
        fetchSiteInfo();
    }, []);
    
    // Recovery / Verification states
    const [email, setEmail] = useState(location.state?.email || '');
    const [token, setToken] = useState('');
    const [emailOtp, setEmailOtp] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [timeLeft, setTimeLeft] = useState(0); // countdown in seconds
    const [otpBlockedTimeLeft, setOtpBlockedTimeLeft] = useState(0); // block countdown
    const [loginBlockedTimeLeft, setLoginBlockedTimeLeft] = useState(0); // login block countdown
    
    // Password visibility states
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { login, isAuthenticated, loading: authLoading } = useAuth();

    // Auto-redirect to dashboard if already logged in
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate('/admin/dashboard', { replace: true });
        }
    }, [isAuthenticated, authLoading, navigate]);

    // Handle timer countdown for reset or verification
    useEffect(() => {
        let interval = null;
        if ((view === 'reset' || view === 'verify-email') && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [view, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Handle OTP blocked countdown timer
    useEffect(() => {
        let blockInterval = null;
        if (otpBlockedTimeLeft > 0) {
            if (view === 'forgot') {
                setError(`Too Many Attempts. ${formatTime(otpBlockedTimeLeft)}`);
            }
            blockInterval = setInterval(() => {
                setOtpBlockedTimeLeft((prev) => {
                    const next = prev - 1;
                    if (next <= 0) {
                        setError('');
                    } else {
                        if (view === 'forgot') {
                            setError(`Too Many Attempts. ${formatTime(next)}`);
                        }
                    }
                    return next;
                });
            }, 1000);
        }
        return () => {
            if (blockInterval) clearInterval(blockInterval);
        };
    }, [otpBlockedTimeLeft, view]);

    // Handle Login blocked countdown timer
    useEffect(() => {
        let blockInterval = null;
        if (loginBlockedTimeLeft > 0) {
            if (view === 'login') {
                setError(`Too Many Attempts. ${formatTime(loginBlockedTimeLeft)}`);
            }
            blockInterval = setInterval(() => {
                setLoginBlockedTimeLeft((prev) => {
                    const next = prev - 1;
                    if (next <= 0) {
                        setError('');
                    } else {
                        if (view === 'login') {
                            setError(`Too Many Attempts. ${formatTime(next)}`);
                        }
                    }
                    return next;
                });
            }, 1000);
        }
        return () => {
            if (blockInterval) clearInterval(blockInterval);
        };
    }, [loginBlockedTimeLeft, view]);

    const changeView = (newView) => {
        setSuccess('');
        setView(newView);
        setShowPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        if (newView !== 'reset' && newView !== 'verify-email') {
            setTimeLeft(0);
        }
        if (otpBlockedTimeLeft > 0 && newView === 'forgot') {
            setError(`Too Many Attempts. ${formatTime(otpBlockedTimeLeft)}`);
        } else if (loginBlockedTimeLeft > 0 && newView === 'login') {
            setError(`Too Many Attempts. ${formatTime(loginBlockedTimeLeft)}`);
        } else {
            setError('');
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);
        try {
            const res = await axios.post(`${BASE_URL}/login`, credentials);
            login(res.data.user, res.data.token, res.data.role, res.data.permissions, remember);
            navigate('/admin/dashboard');
        } catch (err) {
            if (err.response && err.response.status === 429) {
                const retryAfter = err.response.data.retry_after || 60;
                setLoginBlockedTimeLeft(retryAfter);
            } else if (err.response && err.response.status === 403 && err.response.data.requires_verification) {
                setSuccess(err.response.data.message);
                setEmail(err.response.data.email);
                setTimeLeft(600); // 10 minutes verification code expiration
                setView('verify-email');
            } else {
                setError(err.response?.data?.message || 'Invalid email or password.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyEmailSubmit = async (e) => {
        e.preventDefault();
        if (timeLeft === 0) {
            setError('Verification code has expired. Please resend a new code.');
            return;
        }
        setError('');
        setSuccess('');
        setSubmitting(true);
        try {
            const res = await axios.post(`${BASE_URL}/verify-email`, {
                email,
                code: emailOtp
            });
            setSuccess('Email verified successfully!');
            login(res.data.user, res.data.token, res.data.role, res.data.permissions, remember);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResendVerificationCode = async () => {
        if (submitting) return;
        setError('');
        setSuccess('');
        setSubmitting(true);
        try {
            const res = await axios.post(`${BASE_URL}/resend-verification`, { email });
            setSuccess(res.data.message || 'A new verification code has been sent.');
            setTimeLeft(600); // Reset countdown to 10 minutes
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend code.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);
        try {
            const res = await axios.post(`${BASE_URL}/forgot-password`, { email });
            setSuccess(res.data.message || 'Verification code generated successfully.');
            setTimeLeft(120); // Initialize 2-minute countdown
            setView('reset');
        } catch (err) {
            console.error('Forgot password submission failed:', err);
            if (err.response && err.response.status === 429) {
                const retryAfter = err.response.data.retry_after || 180;
                setOtpBlockedTimeLeft(retryAfter);
            } else {
                const errMsg = err.response?.data?.message || 
                               (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : null) || 
                               'Failed to submit recovery request.';
                setError(errMsg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (timeLeft === 0) {
            setError('Verification code has expired. Please request a new code.');
            return;
        }
        setError('');
        setSuccess('');
        setSubmitting(true);
        try {
            const res = await axios.post(`${BASE_URL}/reset-password`, {
                email,
                token,
                password,
                password_confirmation: passwordConfirmation
            });
            setSuccess(res.data.message || 'Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                changeView('login');
                setCredentials({ email, password: '' });
            }, 2000);
        } catch (err) {
            console.error('Password reset verification failed:', err);
            const errMsg = err.response?.data?.message || 
                           (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : null) || 
                           'Failed to reset password.';
            setError(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="login-screen">
            <div className="login-box">
                {view === 'login' && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            {siteInfo.logo ? (
                                <img
                                    src={`${BASE_URL.replace('/api', '')}/uploads/logo/${siteInfo.logo}`}
                                    alt="Logo"
                                    style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                                />
                            ) : (
                                <i className="fas fa-crown" style={{ fontSize: '2.5rem', color: '#c9a45c' }}></i>
                            )}
                            <h2 style={{ marginTop: '10px', marginBottom: '5px' }}>{siteInfo.site_name}</h2>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem' }}>Enter your credentials to manage administrative modules.</p>
                        </div>

                        {error && (
                            <div className="login-error-alert">
                                <i className="fas fa-exclamation-triangle" style={{ fontSize: '14px' }}></i>
                                <span>{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="login-success-alert" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #34d399', borderLeft: '4px solid #10b981', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
                                <span>{success}</span>
                            </div>
                        )}

                        <form onSubmit={handleLoginSubmit}>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    className="admin-input"
                                    placeholder="admin@gmail.com"
                                    value={credentials.email}
                                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                    required
                                    disabled={submitting || loginBlockedTimeLeft > 0}
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>Password</label>
                                <div style={{ position: 'relative', width: '100%', display: 'block' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="admin-input"
                                        placeholder="••••••••"
                                        value={credentials.password}
                                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                        required
                                        disabled={submitting || loginBlockedTimeLeft > 0}
                                        style={{ width: '100%', boxSizing: 'border-box', paddingRight: '45px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            outline: 'none',
                                            cursor: 'pointer',
                                            color: '#64748b',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1rem',
                                            transition: 'color 0.2s ease',
                                            zIndex: 5
                                        }}
                                        tabIndex="-1"
                                    >
                                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} style={{ color: showPassword ? '#c9a45c' : '#64748b' }}></i>
                                    </button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#64748b', fontWeight: '500', userSelect: 'none', opacity: (submitting || loginBlockedTimeLeft > 0) ? 0.6 : 1 }}>
                                        <input
                                            type="checkbox"
                                            checked={remember}
                                            onChange={(e) => setRemember(e.target.checked)}
                                            disabled={submitting || loginBlockedTimeLeft > 0}
                                            style={{ width: '16px', height: '16px', accentColor: '#c9a45c', cursor: 'pointer' }}
                                        />
                                        Remember Me
                                    </label>
                                    <span 
                                        onClick={() => { if (!submitting && loginBlockedTimeLeft === 0) { changeView('forgot'); setEmail(credentials.email); } }} 
                                        style={{ color: '#c9a45c', cursor: (submitting || loginBlockedTimeLeft > 0) ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 600, opacity: (submitting || loginBlockedTimeLeft > 0) ? 0.6 : 1 }}
                                    >
                                        Forgot Password?
                                    </span>
                                </div>
                            </div>
                            <button type="submit" className="admin-btn-primary" style={{ width: '100%', marginTop: '10px', padding: '15px' }} disabled={submitting || loginBlockedTimeLeft > 0}>
                                {submitting ? 'Authenticating...' : 'Sign In'}
                            </button>
                        </form>
                    </>
                )}

                {view === 'forgot' && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            {siteInfo.logo ? (
                                <img
                                    src={`${BASE_URL.replace('/api', '')}/uploads/logo/${siteInfo.logo}`}
                                    alt="Logo"
                                    style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                                />
                            ) : (
                                <i className="fas fa-key" style={{ fontSize: '2.5rem', color: '#c9a45c' }}></i>
                            )}
                            <h2 style={{ marginTop: '10px', marginBottom: '5px' }}>Recover Password</h2>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem' }}>Enter your email to request a reset code.</p>
                        </div>

                        {error && (
                            <div className="login-error-alert">
                                <i className="fas fa-exclamation-triangle" style={{ fontSize: '14px' }}></i>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleForgotSubmit}>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    className="admin-input"
                                    placeholder="admin@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={submitting || otpBlockedTimeLeft > 0}
                                />
                            </div>
                            <button type="submit" className="admin-btn-primary" style={{ width: '100%', marginTop: '10px', padding: '15px' }} disabled={submitting || otpBlockedTimeLeft > 0}>
                                {submitting ? 'Sending Code...' : 'Send Reset Code'}
                            </button>
                            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                <span 
                                    onClick={() => { if (!submitting) changeView('login'); }} 
                                    style={{ color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, opacity: submitting ? 0.6 : 1 }}
                                >
                                    <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>Back to Entrance
                                </span>
                            </div>
                        </form>
                    </>
                )}

                {view === 'reset' && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            {siteInfo.logo ? (
                                <img
                                    src={`${BASE_URL.replace('/api', '')}/uploads/logo/${siteInfo.logo}`}
                                    alt="Logo"
                                    style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                                />
                            ) : (
                                <i className="fas fa-lock" style={{ fontSize: '2.5rem', color: '#c9a45c' }}></i>
                            )}
                            <h2 style={{ marginTop: '10px', marginBottom: '5px' }}>Reset Password</h2>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem' }}>Enter the verification code and set a new password.</p>

                            {/* Countdown Display */}
                            {timeLeft > 0 ? (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', background: 'rgba(201, 164, 92, 0.1)', color: '#c9a45c', padding: '10px 20px', borderRadius: '50px', margin: '15px auto 5px', width: 'fit-content', fontWeight: 'bold', fontSize: '1.1rem', border: '1px solid rgba(201, 164, 92, 0.2)' }}>
                                    <i className="far fa-clock"></i>
                                    <span>{formatTime(timeLeft)}</span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 20px', borderRadius: '50px', margin: '15px auto 5px', width: 'fit-content', fontWeight: 'bold', fontSize: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    <i className="fas fa-exclamation-circle"></i>
                                    <span>Code Expired</span>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="login-error-alert">
                                <i className="fas fa-exclamation-triangle" style={{ fontSize: '14px' }}></i>
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="login-success-alert" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #34d399', borderLeft: '4px solid #10b981', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
                                <span>{success}</span>
                            </div>
                        )}

                        <form onSubmit={handleResetSubmit}>
                            <div className="form-group">
                                <label>Verification Code</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    placeholder="e.g. 123456"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    required
                                    disabled={submitting || timeLeft === 0}
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <div style={{ position: 'relative', width: '100%', display: 'block' }}>
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        className="admin-input"
                                        placeholder="Min 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={submitting || timeLeft === 0}
                                        style={{ width: '100%', boxSizing: 'border-box', paddingRight: '45px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            outline: 'none',
                                            cursor: 'pointer',
                                            color: '#64748b',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1rem',
                                            transition: 'color 0.2s ease',
                                            zIndex: 5
                                        }}
                                        tabIndex="-1"
                                    >
                                        <i className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`} style={{ color: showNewPassword ? '#c9a45c' : '#64748b' }}></i>
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Confirm Password</label>
                                <div style={{ position: 'relative', width: '100%', display: 'block' }}>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className="admin-input"
                                        placeholder="Confirm password"
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        required
                                        disabled={submitting || timeLeft === 0}
                                        style={{ width: '100%', boxSizing: 'border-box', paddingRight: '45px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            outline: 'none',
                                            cursor: 'pointer',
                                            color: '#64748b',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1rem',
                                            transition: 'color 0.2s ease',
                                            zIndex: 5
                                        }}
                                        tabIndex="-1"
                                    >
                                        <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} style={{ color: showConfirmPassword ? '#c9a45c' : '#64748b' }}></i>
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="admin-btn-primary" style={{ width: '100%', marginTop: '10px', padding: '15px' }} disabled={submitting || timeLeft === 0}>
                                {submitting ? 'Updating Password...' : 'Update Password'}
                            </button>
                            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                <span 
                                    onClick={() => { if (!submitting) changeView('forgot'); }} 
                                    style={{ color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, opacity: submitting ? 0.6 : 1 }}
                                >
                                    <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>Request Code Again
                                </span>
                            </div>
                        </form>
                    </>
                )}

                {view === 'verify-email' && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            {siteInfo.logo ? (
                                <img
                                    src={`${BASE_URL.replace('/api', '')}/uploads/logo/${siteInfo.logo}`}
                                    alt="Logo"
                                    style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                                />
                            ) : (
                                <i className="fas fa-envelope-open-text" style={{ fontSize: '2.5rem', color: '#c9a45c' }}></i>
                            )}
                            <h2 style={{ marginTop: '10px', marginBottom: '5px' }}>Verify Your Email</h2>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem' }}>Enter the 6-digit code sent to <strong>{email}</strong></p>

                            {/* Countdown Display */}
                            {timeLeft > 0 ? (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', background: 'rgba(201, 164, 92, 0.1)', color: '#c9a45c', padding: '10px 20px', borderRadius: '50px', margin: '15px auto 5px', width: 'fit-content', fontWeight: 'bold', fontSize: '1.1rem', border: '1px solid rgba(201, 164, 92, 0.2)' }}>
                                    <i className="far fa-clock"></i>
                                    <span>{formatTime(timeLeft)}</span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 20px', borderRadius: '50px', margin: '15px auto 5px', width: 'fit-content', fontWeight: 'bold', fontSize: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    <i className="fas fa-exclamation-circle"></i>
                                    <span>Code Expired</span>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="login-error-alert">
                                <i className="fas fa-exclamation-triangle" style={{ fontSize: '14px' }}></i>
                                <span>{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="login-success-alert" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #34d399', borderLeft: '4px solid #10b981', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
                                <span>{success}</span>
                            </div>
                        )}

                        <form onSubmit={handleVerifyEmailSubmit}>
                            <div className="form-group">
                                <label>Verification Code</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    placeholder="e.g. 123456"
                                    value={emailOtp}
                                    onChange={(e) => setEmailOtp(e.target.value)}
                                    required
                                    disabled={submitting || timeLeft === 0}
                                />
                            </div>
                            <button type="submit" className="admin-btn-primary" style={{ width: '100%', marginTop: '10px', padding: '15px' }} disabled={submitting || timeLeft === 0}>
                                {submitting ? 'Verifying...' : 'Verify Email'}
                            </button>
                        </form>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                            <span 
                                onClick={() => { if (!submitting) changeView('login'); }} 
                                style={{ color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, opacity: submitting ? 0.6 : 1 }}
                            >
                                <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>Back to Entrance
                            </span>
                            
                            <span 
                                onClick={() => { if (!submitting && timeLeft === 0) handleResendVerificationCode(); }} 
                                style={{ color: timeLeft === 0 ? '#c9a45c' : '#94a3b8', cursor: (submitting || timeLeft > 0) ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                            >
                                Resend Code
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;