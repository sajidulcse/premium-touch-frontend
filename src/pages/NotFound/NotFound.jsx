import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO/SEO';
import './NotFound.css';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="notfound-container">
            <SEO 
                title="404 Page Not Found"
                description="The requested page could not be found on Premium Touch Interior Decor Studio."
                noindex={true}
            />
            <div className="notfound-card">
                <div className="notfound-icon-wrapper">
                    <i className="fas fa-compass notfound-icon"></i>
                </div>
                <h1 className="notfound-title">404</h1>
                <h2 className="notfound-subtitle">Lost in Space?</h2>
                <p className="notfound-description">
                    The page you are looking for does not exist or has been moved.
                </p>
                <div className="notfound-actions">
                    <button onClick={() => navigate('/')} className="notfound-btn-primary">
                        <i className="fas fa-home"></i> Go to Home
                    </button>
                    <button onClick={() => navigate(-1)} className="notfound-btn-secondary">
                        <i className="fas fa-arrow-left"></i> Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
