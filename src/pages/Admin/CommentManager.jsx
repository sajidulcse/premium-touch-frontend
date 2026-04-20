import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './Admin.css';

const CommentManager = () => {
    const [comments, setComments] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        try {
            const res = await api.get('/comments');
            setComments(res.data);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    const handleApprove = async (id) => {
        try {
            await api.put(`/comments/${id}/approve`);
            setAlert({ type: 'success', msg: 'Comment approved!' });
            fetchComments();
        } catch (err) {
            setAlert({ type: 'error', msg: 'Failed to approve.' });
        }
    };

    const handleDisapprove = async (id) => {
        try {
            await api.put(`/comments/${id}/disapprove`);
            setAlert({ type: 'success', msg: 'Comment hidden from public view.' });
            fetchComments();
        } catch (err) {
            setAlert({ type: 'error', msg: 'Failed to hide comment.' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this comment permanently?')) {
            try {
                await api.delete(`/comments/${id}`);
                setAlert({ type: 'success', msg: 'Comment deleted!' });
                fetchComments();
            } catch (err) {
                setAlert({ type: 'error', msg: 'Failed to delete.' });
            }
        }
    };

    const handleReply = async (comment) => {
        if (!replyContent) return;
        const admin = JSON.parse(localStorage.getItem('admin'));
        try {
            await api.post('/comments', {
                blog_id: comment.blog_id,
                parent_id: comment.id,
                comment: replyContent, // Changed from 'content' to matching backend 'comment'
                user_name: admin ? admin.name : 'Admin', // Changed from 'name' to 'user_name'
                user_email: admin ? admin.email : 'admin@gmail.com', // Added missing user_email
                is_admin_reply: true
            });
            setReplyContent('');
            setReplyingTo(null);
            setAlert({ type: 'success', msg: 'Reply sent and auto-approved!' });
            fetchComments();
        } catch (err) {
            setAlert({ type: 'error', msg: 'Failed to send reply.' });
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div>
                    <h1>Reader Interactions</h1>
                    <p>Manage and respond to community discussions.</p>
                </div>
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
                            <th>Author</th>
                            <th>Comment & Discussion</th>
                            <th>Post Context</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comments.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No comments found.</td></tr>
                        ) : (
                            comments.map(comment => (
                                <tr key={comment.id}>
                                    <td>
                                        <div className="author-cell">
                                            <strong>{comment.user_name}</strong>
                                            {!!comment.is_admin_reply && <span className="admin-badge">Admin</span>}
                                            <div className="author-email">{comment.user_email}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="comment-content-cell">
                                            <p className="main-comment-text">{comment.comment}</p>

                                            {comment.replies?.length > 0 && (
                                                <div className="admin-replies-list">
                                                    {comment.replies.map(reply => (
                                                        <div key={reply.id} className="admin-reply-item">
                                                            <div className="reply-meta">
                                                                <strong>{reply.user_name}</strong>
                                                                {!!reply.is_admin_reply && <span className="mini-admin-badge">Admin</span>}
                                                            </div>
                                                            <p>{reply.comment}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="blog-ref">
                                            <div className="post-title-small">{comment.blog?.title || 'Deleted Post'}</div>
                                            {comment.blog?.slug && (
                                                <a
                                                    href={`/blog/${comment.blog.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="view-post-link"
                                                >
                                                    <i className="fas fa-external-link-alt"></i> View Live Post
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-row">
                                            <button onClick={() => setReplyingTo(comment.id)} className="action-btn edit-btn" title="Reply">
                                                <i className="fas fa-reply"></i>
                                            </button>
                                            <button onClick={() => handleDelete(comment.id)} className="action-btn delete-btn" title="Delete">
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>

                                        {replyingTo === comment.id && (
                                            <div className="inline-reply-box">
                                                <textarea
                                                    className="admin-textarea"
                                                    placeholder="Write your response..."
                                                    value={replyContent}
                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                    autoFocus
                                                ></textarea>
                                                <div className="reply-actions">
                                                    <button onClick={() => handleReply(comment)} className="admin-btn-primary">Post Reply</button>
                                                    <button onClick={() => setReplyingTo(null)} className="view-btn action-btn">Cancel</button>
                                                </div>
                                            </div>
                                        )}
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

export default CommentManager;
