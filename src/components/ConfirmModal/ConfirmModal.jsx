import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ 
    isOpen, 
    title = 'Confirm Action', 
    message = 'Are you sure you want to proceed?', 
    confirmText = 'Delete', 
    cancelText = 'Cancel', 
    onConfirm, 
    onCancel,
    type = 'danger' // 'danger', 'warning', 'info'
}) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-container">
                <div className="confirm-modal-icon-wrap">
                    {type === 'danger' && (
                        <div className="confirm-modal-icon danger">
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                    )}
                    {type === 'warning' && (
                        <div className="confirm-modal-icon warning">
                            <i className="fas fa-exclamation-circle"></i>
                        </div>
                    )}
                    {type === 'info' && (
                        <div className="confirm-modal-icon info">
                            <i className="fas fa-info-circle"></i>
                        </div>
                    )}
                </div>
                
                <h3 className="confirm-modal-title">{title}</h3>
                <p className="confirm-modal-message">{message}</p>
                
                <div className="confirm-modal-actions">
                    <button className="confirm-modal-btn cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className={`confirm-modal-btn confirm ${type}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
