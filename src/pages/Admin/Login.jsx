import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../../api/axios';
import './Admin.css';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${BASE_URL}/login`, credentials);
            localStorage.setItem('admin', JSON.stringify(res.data.user));
            navigate('/admin/dashboard');
        } catch (err) {
            setError('Invalid email or password.');
        }
    };

    return (
        <div className="login-screen">
            <div className="login-box">
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <i className="fas fa-crown" style={{ fontSize: '3rem', color: '#c9a45c' }}></i>
                    <h2 style={{ marginTop: '15px' }}>Admin Entrance</h2>
                    <p style={{ color: '#64748b' }}>Enter your credentials to manage Premium Touch.</p>
                </div>

                {error && <div className="admin-alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            className="admin-input"
                            placeholder="admin@gmail.com"
                            value={credentials.email}
                            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="admin-input"
                            placeholder="••••••••"
                            value={credentials.password}
                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            required
                        />
                    </div>
                    <button type="submit" className="admin-btn-primary" style={{ width: '100%', marginTop: '10px', padding: '15px' }}>
                        Sign In
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '30px', fontSize: '0.85rem', color: '#94a3b8' }}>
                    &copy; {new Date().getFullYear()} Premium Touch Interior Decor Studio.
                </p>
            </div>
        </div>
    );
};

export default Login;
