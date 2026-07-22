import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import './Admin.css';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { useToast } from '../../context/ToastContext';

const CommentManager = () => {
    const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilter = searchParams.get('filter');

  const [activeFilter, setActiveFilter] = useState(urlFilter || 'all'); // 'all', 'unreplied', 'replied'
  const [comments, setComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, []);

  useEffect(() => {
    const f = searchParams.get('filter');
    if (f && f !== activeFilter) {
      setActiveFilter(f);
    }
  }, [searchParams]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/comments');
      setComments(res.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to fetch comments.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
    if (filterType === 'all') {
      searchParams.delete('filter');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ filter: filterType });
    }
  };

  const isUnreplied = (comment) => {
    const isAdmin = comment.is_admin_reply == 1 || comment.is_admin_reply === true || comment.is_admin_reply === '1';
    if (isAdmin) return false;

    const hasAdminReply = comment.replies && comment.replies.some(
      (r) => r.is_admin_reply == 1 || r.is_admin_reply === true || r.is_admin_reply === '1'
    );
    return !hasAdminReply;
  };

  const filteredComments = comments.filter((c) => {
    if (activeFilter === 'unreplied') {
      return isUnreplied(c);
    }
    if (activeFilter === 'replied') {
      const isAdmin = c.is_admin_reply == 1 || c.is_admin_reply === true || c.is_admin_reply === '1';
      return !isAdmin && c.replies && c.replies.some((r) => r.is_admin_reply == 1 || r.is_admin_reply === true || r.is_admin_reply === '1');
    }
    return true;
  });

  const unrepliedCount = comments.filter((c) => isUnreplied(c)).length;
  const repliedCount = comments.filter((c) => {
    const isAdmin = c.is_admin_reply == 1 || c.is_admin_reply === true || c.is_admin_reply === '1';
    return !isAdmin && c.replies && c.replies.some((r) => r.is_admin_reply == 1 || r.is_admin_reply === true || r.is_admin_reply === '1');
  }).length;

  const handleApprove = async (id) => {
    try {
      await api.put(`/comments/${id}/approve`);
      toast.success('Comment approved!');
      fetchComments();
    } catch (err) {
      toast.error('Failed to approve.');
    }
  };

  const handleDisapprove = async (id) => {
    try {
      await api.put(`/comments/${id}/disapprove`);
      toast.success('Comment hidden from public view.');
      fetchComments();
    } catch (err) {
      toast.error('Failed to hide comment.');
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setConfirmOpen(false);
    if (!deleteTargetId) return;
    const targetId = deleteTargetId;
    setDeleteTargetId(null);

    // Instant Optimistic UI Update: Remove comment or reply immediately from UI
    setComments(prevComments =>
      prevComments
        .filter(c => c.id !== targetId)
        .map(c => ({
          ...c,
          replies: c.replies ? c.replies.filter(r => r.id !== targetId) : []
        }))
    );
    toast.success('Deleted successfully!');

    try {
      await api.delete(`/comments/${targetId}`);
    } catch (err) {
      toast.error('Failed to delete.');
      fetchComments(); // Rollback on error
    }
  };

  const handleReply = async (comment) => {
    if (!replyContent || !replyContent.trim()) return;
    const admin = JSON.parse(localStorage.getItem('admin') || sessionStorage.getItem('admin') || 'null');
    try {
      await api.post('/comments', {
        blog_id: comment.blog_id,
        parent_id: comment.id,
        comment: replyContent,
        user_name: admin ? admin.name : 'Admin',
        user_email: admin ? admin.email : 'admin@gmail.com',
        is_admin_reply: true,
      });
      setReplyContent('');
      setReplyingTo(null);
      toast.success('Reply sent and published!');
      fetchComments();
    } catch (err) {
      toast.error('Failed to send reply.');
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1>Blog Comments & Interactions</h1>
          <p>Moderate user comments and respond to community discussions.</p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="categories-chips" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => handleFilterChange('all')}
          className={`cat-chip ${activeFilter === 'all' ? 'active' : ''}`}
          style={{ cursor: 'pointer', border: '1px solid #e2e8f0', fontFamily: 'inherit' }}
        >
          All Comments
          <span className="chip-count" style={{ marginLeft: '8px' }}>{comments.length}</span>
        </button>

        <button
          onClick={() => handleFilterChange('unreplied')}
          className={`cat-chip ${activeFilter === 'unreplied' ? 'active' : ''}`}
          style={{ cursor: 'pointer', border: '1px solid #e2e8f0', fontFamily: 'inherit' }}
        >
          <i className="fas fa-clock text-warning me-1"></i> Needs Reply
          <span className="chip-count" style={{ marginLeft: '8px', background: '#f59e0b', color: '#fff' }}>{unrepliedCount}</span>
        </button>

        <button
          onClick={() => handleFilterChange('replied')}
          className={`cat-chip ${activeFilter === 'replied' ? 'active' : ''}`}
          style={{ cursor: 'pointer', border: '1px solid #e2e8f0', fontFamily: 'inherit' }}
        >
          <i className="fas fa-check-circle text-success me-1"></i> Replied
          <span className="chip-count" style={{ marginLeft: '8px' }}>{repliedCount}</span>
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Author</th>
              <th>Comment & Discussion</th>
              <th>Status</th>
              <th>Post Context</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <i className="fas fa-spinner fa-spin me-2"></i> Loading comments...
                </td>
              </tr>
            ) : filteredComments.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No comments found matching the active filter.
                </td>
              </tr>
            ) : (
              filteredComments.map((comment) => {
                const needsReply = isUnreplied(comment);

                return (
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
                          <div className="admin-replies-list" style={{ marginTop: '10px', paddingLeft: '12px', borderLeft: '2px solid #cbd5e1' }}>
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="admin-reply-item" style={{ marginBottom: '8px', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div className="reply-meta" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <strong style={{ fontSize: '0.82rem', color: '#1e293b' }}>{reply.user_name}</strong>
                                    {!!reply.is_admin_reply && <span className="mini-admin-badge" style={{ background: '#c9a45c', color: '#fff', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Admin</span>}
                                    {!!reply.is_edited && <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>(edited)</span>}
                                  </div>
                                  <p style={{ margin: '2px 0 0 0', fontSize: '0.83rem', color: '#475569' }}>{reply.comment}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteClick(reply.id)}
                                  className="action-btn delete-btn"
                                  title="Delete this individual reply"
                                  style={{ width: '26px', height: '26px', padding: 0, fontSize: '11px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: '10px' }}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      {needsReply ? (
                        <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fas fa-exclamation-circle"></i> Needs Reply
                        </span>
                      ) : comment.is_admin_reply ? (
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                          Admin Post
                        </span>
                      ) : (
                        <span style={{ background: '#d1fae5', color: '#047857', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fas fa-check"></i> Replied
                        </span>
                      )}
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
                        <button onClick={() => setReplyingTo(comment.id)} className="action-btn edit-btn" title="Reply to Reader">
                          <i className="fas fa-reply"></i>
                        </button>
                        <button onClick={() => handleDeleteClick(comment.id)} className="action-btn delete-btn" title="Delete Comment">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>

                      {replyingTo === comment.id && (
                        <div className="inline-reply-box" style={{ marginTop: '10px' }}>
                          <textarea
                            className="admin-textarea"
                            placeholder="Write your response to this reader..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            autoFocus
                            rows="3"
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                          ></textarea>
                          <div className="reply-actions" style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                            <button onClick={() => handleReply(comment)} className="admin-btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Post Reply</button>
                            <button onClick={() => setReplyingTo(null)} className="view-btn action-btn" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Comment"
        message="Are you sure you want to permanently delete this comment?"
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default CommentManager;
