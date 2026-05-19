import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { getStorageUrl } from '../../api/axios';
import './Admin.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

const ProjectManager = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin-projects');
            setProjects(res.data);
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
            await api.delete(`/projects/${deleteTargetId}`);
            setAlert({ type: 'success', msg: 'Project archived successfully.' });
            fetchProjects();
        } catch (err) {
            setAlert({ type: 'error', msg: 'Failed to delete project.' });
        } finally {
            setDeleteTargetId(null);
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Portfolio Management</h1>
                    <p>Showcase your finest architectural and interior masterpieces.</p>
                </div>
                <button className="admin-btn-primary" onClick={() => navigate('/admin/projects/new')}>
                    <i className="fas fa-plus"></i> New Project
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
                            <th>Project Details</th>
                            <th>Location</th>
                            <th>Client</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && projects.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Analyzing portfolio...</td></tr>
                        ) : projects.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No projects found. Add your first showcase!</td></tr>
                        ) : (
                            projects.map(project => (
                                <tr key={project.id}>
                                    <td width="100">
                                        <div className="table-img-wrap">
                                            {project.thumbnail || project.images?.length > 0 ? (
                                                <img src={getStorageUrl(project.thumbnail?.image_path || project.images[0].image_path)} alt="" />
                                            ) : (
                                                <div className="img-placeholder">PT</div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <Link to={`/admin/projects/edit/${project.id}`} className="table-title-link">
                                            <strong>{project.title}</strong>
                                        </Link>
                                        <div className="table-small-info">
                                            {project.category?.name || 'Interior Design'}
                                        </div>
                                    </td>
                                    <td>{project.location || '-'}</td>
                                    <td>{project.client_name || '-'}</td>
                                    <td>
                                        <span className={`status-badge ${project.status}`}>
                                            {project.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-row">
                                            <button onClick={() => navigate(`/admin/projects/edit/${project.id}`)} className="action-btn edit-btn" title="Edit">
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button onClick={() => handleDeleteClick(project.id)} className="action-btn delete-btn" title="Delete">
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
                title="Delete Project"
                message="Are you sure you want to delete this project? All associated images will be permanently removed."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default ProjectManager;
