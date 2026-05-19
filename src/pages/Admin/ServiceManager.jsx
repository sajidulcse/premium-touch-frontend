import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { getStorageUrl } from '../../api/axios';
import './Admin.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
const ServiceManager = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin-services');
            setServices(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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
            await api.delete(`/services/${deleteTargetId}`);
            setAlert({ type: 'success', msg: 'Service archived successfully.' });
            fetchServices();
        } catch (err) {
            setAlert({ type: 'error', msg: 'Failed to delete service.' });
        } finally {
            setDeleteTargetId(null);
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Service Management</h1>
                    <p>Add, edit, or remove services offered by Premium Touch.</p>
                </div>
                <button className="admin-btn-primary" onClick={() => navigate('/admin/services/new')}>
                    <i className="fas fa-plus"></i> New Service
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
                            <th>Service Details</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && services.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Loading services...</td></tr>
                        ) : services.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No services found. Add your first service!</td></tr>
                        ) : (
                            services.map(service => (
                                <tr key={service.id}>
                                    <td width="100">
                                        <div className="table-img-wrap">
                                            {service.thumbnail ? (
                                                <img src={getStorageUrl(service.thumbnail.image_path)} alt="" />
                                            ) : service.images?.length > 0 ? (
                                                <img src={getStorageUrl(service.images[0].image_path)} alt="" />
                                            ) : (
                                                <div className="img-placeholder">PT</div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <Link to={`/admin/services/edit/${service.sub_category?.slug || service.id}`} className="table-title-link">
                                            <strong>{service.sub_category?.name || 'Uncategorized Service'}</strong>
                                        </Link>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${service.status === 'published' ? 'Active' : 'Draft'}`}>
                                            {service.status === 'published' ? 'Live' : 'Draft'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-row">
                                            <button onClick={() => navigate(`/admin/services/edit/${service.sub_category?.slug || service.id}`)} className="action-btn edit-btn" title="Edit">
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button onClick={() => handleDeleteClick(service.id)} className="action-btn delete-btn" title="Delete">
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

            <ConfirmModal 
                isOpen={confirmOpen}
                title="Delete Service"
                message="Are you sure you want to delete this service? All associated images will be permanently removed."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default ServiceManager;
