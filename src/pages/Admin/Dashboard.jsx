import React from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

const Dashboard = () => {
    const admin = JSON.parse(localStorage.getItem('admin'));

    if (!admin) return null;

    return (
        <div className="dashboard-content">
            <div className="welcome-banner">
                <span>Welcome Back,</span>
                <h2>{admin.name}</h2>
                <p>Track your blog performance and manage interactions from one place.</p>
            </div>

            <div className="admin-nav-grid">
                <Link to="/admin/blogs" className="admin-nav-card">
                    <i className="fas fa-edit"></i>
                    <h3>Blog Posts</h3>
                    <p>Create, edit and manage your interior design stories.</p>
                </Link>
                <Link to="/admin/comments" className="admin-nav-card">
                    <i className="fas fa-comment-dots"></i>
                    <h3>Moderation</h3>
                    <p>Approve or delete comments from your readers.</p>
                </Link>
                <Link to="/admin/profile" className="admin-nav-card">
                    <i className="fas fa-id-card"></i>
                    <h3>Profile Info</h3>
                    <p>Update your credentials and account settings.</p>
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
