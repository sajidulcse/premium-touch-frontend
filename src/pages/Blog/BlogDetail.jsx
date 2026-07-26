import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getStorageUrl } from '../../api/axios';
import './Blog.css';

import { useAuth } from '../../context/AuthContext';

const BlogDetail = () => {
    const { slug } = useParams();
    const { user: authUser } = useAuth();
    const admin = authUser || JSON.parse(localStorage.getItem('admin') || sessionStorage.getItem('admin') || 'null');

    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentData, setCommentData] = useState({ user_name: '', user_email: '', comment: '' });
    const [replyTo, setReplyTo] = useState(null);
    const [replyToComment, setReplyToComment] = useState(null);
    const [message, setMessage] = useState('');

    const [recentPosts, setRecentPosts] = useState([]);
    const [categories, setCategories] = useState([]);

    // 100+ Comments pagination & smart features
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOrder, setSortOrder] = useState('newest');
    const [expandedReplies, setExpandedReplies] = useState({});
    const COMMENTS_PER_PAGE = 6;

    // Local comment ownership & Edit/Delete state
    const [myCommentIds, setMyCommentIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('my_comments') || '[]');
        } catch (e) {
            return [];
        }
    });

    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editText, setEditText] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    const saveMyCommentId = (id) => {
        if (!id) return;
        const updated = [...myCommentIds, id];
        setMyCommentIds(updated);
        localStorage.setItem('my_comments', JSON.stringify(updated));
    };

    const canModify = (item) => !!admin || myCommentIds.includes(item.id);

    const handleStartEdit = (item) => {
        setEditingCommentId(item.id);
        setEditText(item.comment);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditText('');
    };

    const handleSaveEdit = async (commentId) => {
        if (!editText.trim()) return;
        setEditLoading(true);
        try {
            await api.put(`/comments/${commentId}`, { comment: editText });
            setEditingCommentId(null);
            setEditText('');
            // Refresh blog comments
            const response = await api.get(`/blogs/${slug}`);
            setBlog(response.data);
        } catch (error) {
            console.error("Error editing comment:", error);
            alert("Failed to save edit.");
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;

        // Instant Optimistic UI Update: Remove item immediately from state without spinner or reload
        setBlog(prevBlog => {
            if (!prevBlog) return prevBlog;
            return {
                ...prevBlog,
                comments: (prevBlog.comments || [])
                    .filter(c => c.id !== commentId)
                    .map(c => ({
                        ...c,
                        replies: c.replies ? c.replies.filter(r => r.id !== commentId) : []
                    }))
            };
        });

        try {
            await api.delete(`/comments/${commentId}`);
        } catch (error) {
            console.error("Error deleting comment:", error);
            alert("Failed to delete comment.");
            const response = await api.get(`/blogs/${slug}`);
            setBlog(response.data);
        }
    };

    const hasIncrementedView = React.useRef(false);
    const [lastSlug, setLastSlug] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [blogRes, recentRes, catRes] = await Promise.all([
                    api.get(`/blogs/${slug}`),
                    api.get('/recent-blogs'),
                    api.get('/blog-categories')
                ]);
                const blogData = blogRes.data;
                setBlog(blogData);
                setRecentPosts(recentRes.data);
                setCategories(catRes.data);

                // Increment view only once per mount/slug change
                if (!hasIncrementedView.current || lastSlug !== slug) {
                    api.post(`/blogs/${blogData.id}/view`).catch(e => console.error(e));
                    hasIncrementedView.current = true;
                    setLastSlug(slug);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        window.scrollTo(0, 0);
    }, [slug]);

    const handleReaction = async (type) => {
        try {
            await api.post(`/blogs/${blog.id}/react`, { type });
            const response = await api.get(`/blogs/${slug}`);
            setBlog(response.data);
        } catch (error) {
            alert("Already reacted or error occurred");
        }
    };

    useEffect(() => {
        if (admin) {
            setCommentData(prev => ({
                ...prev,
                user_name: admin.name || '',
                user_email: admin.email || ''
            }));
        }
    }, [admin]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                blog_id: blog.id,
                parent_id: replyTo,
                user_name: admin ? admin.name : commentData.user_name,
                user_email: admin ? admin.email : commentData.user_email,
                comment: commentData.comment,
                is_admin_reply: !!admin
            };

            const res = await api.post('/comments', payload);
            if (res.data?.comment?.id) {
                saveMyCommentId(res.data.comment.id);
            }

            setMessage(admin ? "Reply posted successfully as Studio Authority!" : "Thank you! Your comment has been posted.");
            setCommentData(prev => ({
                user_name: admin ? admin.name : '',
                user_email: admin ? admin.email : '',
                comment: ''
            }));
            setReplyTo(null);
            setReplyToComment(null);

            // Fetch updated blog data to show the new comment immediately
            const response = await api.get(`/blogs/${slug}`);
            setBlog(response.data);
            setCurrentPage(1); // Jump to first page to see newest comment
        } catch (error) {
            console.error("Error submitting comment:", error);
        }
    };

    const toggleReplies = (commentId) => {
        setExpandedReplies(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    const scrollToCommentForm = () => {
        const formElem = document.getElementById('comment-form');
        if (formElem) {
            const yOffset = -130; // Gives clearance so navbar doesn't cover "Replying to..." title
            const y = formElem.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const scrollToCommentsSection = () => {
        const commentsElem = document.getElementById('comments');
        if (commentsElem) {
            const yOffset = -100;
            const y = commentsElem.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    // Calculate total comments count including all nested replies
    const totalCommentsCount = useMemo(() => {
        if (!blog?.comments) return 0;
        return blog.comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
    }, [blog?.comments]);

    // Sort top-level comments
    const sortedComments = useMemo(() => {
        if (!blog?.comments) return [];
        const list = [...blog.comments];
        if (sortOrder === 'oldest') {
            return list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }
        return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [blog?.comments, sortOrder]);

    const totalPages = Math.ceil(sortedComments.length / COMMENTS_PER_PAGE);
    const paginatedComments = useMemo(() => {
        const start = (currentPage - 1) * COMMENTS_PER_PAGE;
        return sortedComments.slice(start, start + COMMENTS_PER_PAGE);
    }, [sortedComments, currentPage]);

    if (loading) return (
        <div className="blog-loader-container">
            <div className="spinner-gold"></div>
            <p>Unveiling the story...</p>
        </div>
    );

    if (!blog) return (
        <div className="not-found-screen">
            <div className="not-found-content">
                <div className="error-icon">
                    <i className="fas fa-feather-alt fa-flip-horizontal"></i>
                    <div className="icon-pulse"></div>
                </div>
                <h1>Story Missing From Archives</h1>
                <p>We couldn't find the narrative you're looking for. It may have been relocated or removed from our collection.</p>
                <Link to="/blogs" className="return-btn">
                    <i className="fas fa-arrow-left"></i> Back to Journal
                </Link>
            </div>
        </div>
    );

    const formattedDate = new Date(blog.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const shareUrl = window.location.href;
    const shareTitle = blog.title;

    return (
        <div className="blog-detail-container">
            <div className="blog-detail-wrapper">
                {/* Sidebar Column */}
                <aside className="blog-sidebar">
                    <div className="sidebar-widget">
                        <h4>Recent Stories</h4>
                        <div className="recent-posts-list">
                            {recentPosts.map(post => (
                                <Link to={`/blog/${post.slug}`} key={post.id} className="recent-post-item">
                                    <div className="recent-post-thumb">
                                        {post.images && post.images.length > 0 ? (
                                            <img src={getStorageUrl(post.images[0].image_path)} alt={post.title} />
                                        ) : (
                                            <div className="thumb-placeholder"><i className="fas fa-image"></i></div>
                                        )}
                                    </div>
                                    <div className="recent-post-info">
                                        <h5>{post.title}</h5>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="sidebar-widget">
                        <h4>Explore Categories</h4>
                        <div className="sidebar-categories-list">
                            {categories.map(cat => (
                                <Link
                                    to={`/blogs/category/${cat.slug}`}
                                    key={cat.id}
                                    className="sidebar-cat-item"
                                >
                                    <span className="cat-name">{cat.name}</span>
                                    <span className="cat-count">({cat.blogs_count || 0})</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content Column */}
                <div className="blog-main-column">
                    <article className="blog-article">
                        <header className="article-header redesign">
                            <h1>{blog.title}</h1>

                            <div className="article-meta-modern">
                                <div className="meta-left">
                                    <span className="meta-date"><i className="far fa-calendar-alt"></i> {formattedDate}</span>
                                    <span className="meta-divider"></span>
                                    <Link to={`/blogs/category/${blog.category?.slug}`} className="meta-cat">
                                        <i className="far fa-folder"></i> {blog.category?.name || 'Interior'}
                                    </Link>
                                    {blog.author && (
                                        <>
                                            <span className="meta-divider"></span>
                                            <span className="meta-author"><i className="far fa-user"></i> By {blog.author}</span>
                                        </>
                                    )}
                                </div>
                                <div className="social-shares">
                                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" title="Share on Facebook">
                                        <i className="fab fa-facebook-f"></i>
                                    </a>
                                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`} target="_blank" rel="noopener noreferrer" title="Share on Twitter">
                                        <i className="fab fa-twitter"></i>
                                    </a>
                                    <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer" title="Share on WhatsApp">
                                        <i className="fab fa-whatsapp"></i>
                                    </a>
                                </div>
                            </div>
                        </header>

                        <div className="article-gallery-featured">
                            {blog.images.length > 0 && (
                                <img src={getStorageUrl(blog.images[0].image_path)} alt={blog.title} />
                            )}
                        </div>

                        <div className="article-content" dangerouslySetInnerHTML={{ __html: blog.content }} />

                        {blog.images.length > 1 && (
                            <div className="article-gallery-more">
                                {blog.images.slice(1).map(img => (
                                    <div key={img.id} className="gallery-item">
                                        <img src={getStorageUrl(img.image_path)} alt={blog.title} />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="article-footer">
                            <div className="reactions-wrapper">
                                <span className="reactions-label">Enjoyed the story?</span>
                                <div className="article-reactions">
                                    <button onClick={() => handleReaction('like')} className="reaction-btn like-btn">
                                        <i className="fas fa-heart"></i> {blog.likes?.length > 0 && <span>{blog.likes.length}</span>}
                                    </button>
                                    <button onClick={() => handleReaction('dislike')} className="reaction-btn dislike-btn">
                                        <i className="fas fa-heart-broken"></i> {blog.dislikes?.length > 0 && <span>{blog.dislikes.length}</span>}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* COMMENTS SECTION */}
                        <section className="comments-section" id="comments">
                            
                            {/* 1. COMMENTS FORM BOX (FIRST) */}
                            <div className="comment-form-container" id="comment-form">
                                <div className="comment-form-header">
                                    <h4>
                                        <i className="far fa-edit"></i>{' '}
                                        {replyToComment ? `Replying to ${replyToComment.user_name}` : 'Share your thoughts'}
                                    </h4>
                                    {replyTo && (
                                        <button 
                                            className="cancel-reply-btn" 
                                            onClick={() => { setReplyTo(null); setReplyToComment(null); }}
                                        >
                                            <i className="fas fa-times"></i> Cancel Reply
                                        </button>
                                    )}
                                </div>

                                {message && (
                                    <p className="success-msg">
                                        <i className="fas fa-check-circle"></i> {message}
                                    </p>
                                )}

                                <form onSubmit={handleCommentSubmit} className="comment-form">
                                    <div className="comment-form-grid">
                                        <input
                                            type="text"
                                            placeholder="Full Name *"
                                            value={admin ? (admin.name || '') : commentData.user_name}
                                            onChange={(e) => setCommentData({ ...commentData, user_name: e.target.value })}
                                            disabled={!!admin}
                                            style={admin ? { background: '#e2e8f0', cursor: 'not-allowed', color: '#475569', fontWeight: '600' } : {}}
                                            required
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email Address *"
                                            value={admin ? (admin.email || '') : commentData.user_email}
                                            onChange={(e) => setCommentData({ ...commentData, user_email: e.target.value })}
                                            disabled={!!admin}
                                            style={admin ? { background: '#e2e8f0', cursor: 'not-allowed', color: '#475569', fontWeight: '600' } : {}}
                                            required
                                        />
                                    </div>
                                    {admin && (
                                        <p className="comment-as">
                                            <i className="fas fa-user-shield"></i> Posting as Studio Authority: <strong>{admin.name}</strong>
                                        </p>
                                    )}
                                    <textarea
                                        placeholder={replyToComment ? `Write your reply to ${replyToComment.user_name}...` : "Share your thoughts here..."}
                                        value={commentData.comment}
                                        onChange={(e) => setCommentData({ ...commentData, comment: e.target.value })}
                                        required
                                    ></textarea>
                                    <button type="submit" className="submit-btn">
                                        <i className="fas fa-paper-plane"></i> {replyTo ? 'Post Reply' : 'Publish Comment'}
                                    </button>
                                </form>
                            </div>

                            {/* 2. COMMENTS LIST & HEADER (SECOND) */}
                            <div className="comments-header-bar">
                                <div className="comments-title-wrap">
                                    <h3>
                                        <i className="far fa-comments"></i>{' '}
                                        {totalCommentsCount > 0 ? `Comments (${totalCommentsCount})` : 'Comments'}
                                    </h3>
                                </div>

                                {sortedComments.length > 1 && (
                                    <div className="comments-sort-control">
                                        <label htmlFor="comment-sort">Sort by:</label>
                                        <select 
                                            id="comment-sort"
                                            value={sortOrder} 
                                            onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
                                        >
                                            <option value="newest">Newest First</option>
                                            <option value="oldest">Oldest First</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="comments-list">
                                {sortedComments.length === 0 ? (
                                    <div className="no-comments-placeholder">
                                        <i className="far fa-comment-dots"></i>
                                        <p>Be the first to share your thoughts on this story!</p>
                                    </div>
                                ) : (
                                    paginatedComments.map(comment => {
                                        const hasReplies = comment.replies && comment.replies.length > 0;
                                        const isExpanded = !!expandedReplies[comment.id]; // Hidden by default, expands on click
                                        const isEditing = editingCommentId === comment.id;

                                        return (
                                            <div key={comment.id} className={`comment-item ${comment.is_admin_reply ? 'admin-reply' : ''}`}>
                                                <div className="comment-avatar">
                                                    {comment.is_admin_reply ? <i className="fas fa-user-shield"></i> : <i className="fas fa-user"></i>}
                                                </div>
                                                <div className="comment-body">
                                                    <div className="comment-header">
                                                        <div className="comment-author-info">
                                                            <strong>{comment.user_name}</strong>
                                                            {!!comment.is_admin_reply && <span className="admin-status">Studio Authority</span>}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span className="comment-date">{new Date(comment.created_at).toLocaleDateString()}</span>
                                                            {(!!comment.is_edited || comment.is_edited === '1') && (
                                                                <span className="edited-tag" style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>(edited)</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {isEditing ? (
                                                        <div className="comment-edit-box" style={{ marginTop: '10px', marginBottom: '15px' }}>
                                                            <textarea
                                                                value={editText}
                                                                onChange={(e) => setEditText(e.target.value)}
                                                                rows="3"
                                                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid var(--primary-gold)', fontSize: '0.96rem', outline: 'none', background: '#f8fafc' }}
                                                            ></textarea>
                                                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleSaveEdit(comment.id)} 
                                                                    disabled={editLoading}
                                                                    className="submit-btn" 
                                                                    style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                                                                >
                                                                    <i className="fas fa-check"></i> {editLoading ? 'Saving...' : 'Save Edit'}
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={handleCancelEdit} 
                                                                    className="cancel-reply-btn" 
                                                                    style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="comment-text">{comment.comment}</p>
                                                    )}

                                                    <div className="comment-actions">
                                                        <button
                                                            className="comment-reply-btn"
                                                            onClick={() => {
                                                                setReplyTo(comment.id);
                                                                setReplyToComment(comment);
                                                                scrollToCommentForm();
                                                            }}
                                                        >
                                                            <i className="fas fa-reply"></i> Reply
                                                        </button>

                                                        {canModify(comment) && !isEditing && (
                                                            <>
                                                                <button 
                                                                    className="comment-action-btn edit-action"
                                                                    onClick={() => handleStartEdit(comment)}
                                                                    style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                                >
                                                                    <i className="fas fa-edit"></i> Edit
                                                                </button>
                                                                <button 
                                                                    className="comment-action-btn delete-action"
                                                                    onClick={() => handleDeleteComment(comment.id)}
                                                                    style={{ background: 'none', border: 'none', color: '#e11d48', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                                >
                                                                    <i className="fas fa-trash-alt"></i> Delete
                                                                </button>
                                                            </>
                                                        )}

                                                        {hasReplies && (
                                                            <button 
                                                                className="toggle-replies-btn"
                                                                onClick={() => toggleReplies(comment.id)}
                                                            >
                                                                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                                                                {isExpanded 
                                                                    ? `Hide ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`
                                                                    : `View ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`
                                                                }
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Collapsible Nested Replies */}
                                                    {hasReplies && isExpanded && (
                                                        <div className="replies-container">
                                                            {comment.replies.map(reply => {
                                                                const isReplyEditing = editingCommentId === reply.id;

                                                                return (
                                                                    <div key={reply.id} className={`reply-item ${reply.is_admin_reply ? 'admin-reply' : ''}`}>
                                                                        <div className="reply-avatar">
                                                                            {reply.is_admin_reply ? <i className="fas fa-user-shield"></i> : <i className="fas fa-user"></i>}
                                                                        </div>
                                                                        <div className="reply-body">
                                                                            <div className="comment-header">
                                                                                <div className="comment-author-info">
                                                                                    <strong>{reply.user_name}</strong>
                                                                                    {!!reply.is_admin_reply && <span className="admin-status">Studio Authority</span>}
                                                                                </div>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                    <span className="comment-date">{new Date(reply.created_at).toLocaleDateString()}</span>
                                                                                    {(!!reply.is_edited || reply.is_edited === '1') && (
                                                                                        <span className="edited-tag" style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>(edited)</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {isReplyEditing ? (
                                                                                <div className="comment-edit-box" style={{ marginTop: '8px', marginBottom: '10px' }}>
                                                                                    <textarea
                                                                                        value={editText}
                                                                                        onChange={(e) => setEditText(e.target.value)}
                                                                                        rows="2"
                                                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid var(--primary-gold)', fontSize: '0.9rem', outline: 'none', background: '#fff' }}
                                                                                    ></textarea>
                                                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                                                                        <button 
                                                                                            type="button" 
                                                                                            onClick={() => handleSaveEdit(reply.id)} 
                                                                                            disabled={editLoading}
                                                                                            className="submit-btn" 
                                                                                            style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                                                                                        >
                                                                                            {editLoading ? 'Saving...' : 'Save Edit'}
                                                                                        </button>
                                                                                        <button 
                                                                                            type="button" 
                                                                                            onClick={handleCancelEdit} 
                                                                                            className="cancel-reply-btn" 
                                                                                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                                                                        >
                                                                                            Cancel
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <p className="comment-text">{reply.comment}</p>
                                                                            )}

                                                                            {canModify(reply) && !isReplyEditing && (
                                                                                <div className="reply-actions" style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                                                                                    <button 
                                                                                        className="comment-action-btn edit-action"
                                                                                        onClick={() => handleStartEdit(reply)}
                                                                                        style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                                                    >
                                                                                        <i className="fas fa-edit"></i> Edit
                                                                                    </button>
                                                                                    <button 
                                                                                        className="comment-action-btn delete-action"
                                                                                        onClick={() => handleDeleteComment(reply.id)}
                                                                                        style={{ background: 'none', border: 'none', color: '#e11d48', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                                                    >
                                                                                        <i className="fas fa-trash-alt"></i> Delete
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Pagination Controls for 100+ comments */}
                            {totalPages > 1 && (
                                <div className="comments-pagination">
                                    <button 
                                        className="pagination-btn" 
                                        disabled={currentPage === 1} 
                                        onClick={() => {
                                            setCurrentPage(p => Math.max(p - 1, 1));
                                            scrollToCommentsSection();
                                        }}
                                    >
                                        <i className="fas fa-chevron-left"></i> Previous
                                    </button>

                                    <div className="pagination-pages">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                                            <button
                                                key={pageNum}
                                                className={`page-num-btn ${pageNum === currentPage ? 'active' : ''}`}
                                                onClick={() => {
                                                    setCurrentPage(pageNum);
                                                    scrollToCommentsSection();
                                                }}
                                            >
                                                {pageNum}
                                            </button>
                                        ))}
                                    </div>

                                    <button 
                                        className="pagination-btn" 
                                        disabled={currentPage === totalPages} 
                                        onClick={() => {
                                            setCurrentPage(p => Math.min(p + 1, totalPages));
                                            scrollToCommentsSection();
                                        }}
                                    >
                                        Next <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            )}

                        </section>
                    </article>
                </div>
            </div>
        </div>
    );
};

export default BlogDetail;
