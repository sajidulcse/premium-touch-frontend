import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { getStorageUrl } from '../../api/axios';
import './Admin.css';

const PortfolioManager = () => {
    const [portfolios, setPortfolios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPortfolios();
    }, []);

    const fetchPortfolios = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin-portfolios');
            setPortfolios(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this portfolio? All associated images will be removed.')) {
            try {
                await api.delete(`/portfolios/${id}`);
                setAlert({ type: 'success', msg: 'Portfolio archived successfully.' });
                fetchPortfolios();
            } catch (err) {
                setAlert({ type: 'error', msg: 'Failed to delete portfolio.' });
            }
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Portfolio Management</h1>
                    <p>Showcase your finest architectural and interior masterpieces.</p>
                </div>
                <button className="admin-btn-primary" onClick={() => navigate('/admin/portfolios/new')}>
                    <i className="fas fa-plus"></i> New Portfolio
                </button>
            </div>

            {alert && (
                <div className={`admin-alert alert-${alert.type}`}>
                    {alert.msg}
                    <button className="close-alert" onClick={() => setAlert(null)}>&times;</button>
                </div>
            )}

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Preview</th>
                            <th>Portfolio Details</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && portfolios.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Analyzing portfolio...</td></tr>
                        ) : portfolios.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No portfolios found. Add your first showcase!</td></tr>
                        ) : (
                            portfolios.map(portfolio => (
                                <tr key={portfolio.id}>
                                    <td width="100">
                                        <div className="table-img-wrap">
                                            {portfolio.thumbnail || portfolio.images?.length > 0 ? (
                                                <img src={getStorageUrl(portfolio.thumbnail?.image_path || portfolio.images[0].image_path)} alt="" />
                                            ) : (
                                                <div className="img-placeholder">PT</div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <Link to={`/admin/portfolios/edit/${portfolio.id}`} className="table-title-link">
                                            <strong>{portfolio.title}</strong>
                                        </Link>
                                        <div className="table-small-info">
                                            {portfolio.category?.name || 'Interior Design'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${portfolio.status}`}>
                                            {portfolio.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-row">
                                            <button onClick={() => navigate(`/admin/portfolios/edit/${portfolio.id}`)} className="action-btn edit-btn" title="Edit">
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button onClick={() => handleDelete(portfolio.id)} className="action-btn delete-btn" title="Delete">
                                                <i className="fas fa-trash-alt"></i>
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
    );
};

export default PortfolioManager;
