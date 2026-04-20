import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getStorageUrl } from '../../api/axios';
import './Blog.css';

const BlogDetail = () => {
    const { slug } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentData, setCommentData] = useState({ user_name: '', user_email: '', comment: '' });
    const [replyTo, setReplyTo] = useState(null);
    const [message, setMessage] = useState('');

    const [recentPosts, setRecentPosts] = useState([]);
    const [categories, setCategories] = useState([]);

    const admin = JSON.parse(localStorage.getItem('admin'));

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

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...commentData,
                blog_id: blog.id,
                parent_id: replyTo
            };

            if (admin) {
                payload.user_name = admin.name;
                payload.user_email = admin.email;
                payload.is_admin_reply = true;
            }

            await api.post('/comments', payload);
            setMessage(admin ? "Reply posted successfully!" : "Thank you! Your comment has been posted.");
            setCommentData({ user_name: '', user_email: '', comment: '' });
            setReplyTo(null);

            // Fetch updated blog data to show the new comment immediately
            const response = await api.get(`/blogs/${slug}`);
            setBlog(response.data);
        } catch (error) {
            console.error("Error submitting comment:", error);
        }
    };

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
                {/* Sidebar Column (on the Left) */}
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

                {/* Main Content Column (on the Right) */}
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

                        <section className="comments-section">
                            <h3>{blog.comments?.length > 0 ? `Comments (${blog.comments.length})` : 'Join the Conversation'}</h3>
                            <div className="comments-list">
                                {blog.comments?.map(comment => (
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
                                                <span className="comment-date">{new Date(comment.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="comment-text">{comment.comment}</p>

                                            <div className="comment-actions">
                                                <button
                                                    className="comment-reply-btn"
                                                    onClick={() => {
                                                        setReplyTo(comment.id);
                                                        document.getElementById('comment-form').scrollIntoView({ behavior: 'smooth' });
                                                    }}
                                                >
                                                    <i className="fas fa-reply"></i> Reply
                                                </button>
                                            </div>

                                            {comment.replies?.length > 0 && (
                                                <div className="replies-container">
                                                    {comment.replies.map(reply => (
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
                                                                </div>
                                                                <p className="comment-text">{reply.comment}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="comment-form-container" id="comment-form">
                                <h4>{replyTo ? 'Drafting a Reply' : 'Share your thoughts'}</h4>
                                {replyTo && <button className="cancel-reply" onClick={() => setReplyTo(null)}>Cancel Reply</button>}
                                {message && <p className="success-msg">{message}</p>}
                                <form onSubmit={handleCommentSubmit} className="comment-form">
                                    {!admin && (
                                        <div className="comment-form-grid">
                                            <input
                                                type="text"
                                                placeholder="Full Name"
                                                value={commentData.user_name}
                                                onChange={(e) => setCommentData({ ...commentData, user_name: e.target.value })}
                                                required
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email Address"
                                                value={commentData.user_email}
                                                onChange={(e) => setCommentData({ ...commentData, user_email: e.target.value })}
                                                required
                                            />
                                        </div>
                                    )}
                                    {admin && <p className="comment-as">Posting as Studio Authority: <strong>{admin.name}</strong></p>}
                                    <textarea
                                        placeholder="Share your thoughts here..."
                                        value={commentData.comment}
                                        onChange={(e) => setCommentData({ ...commentData, comment: e.target.value })}
                                        required
                                    ></textarea>
                                    <button type="submit" className="submit-btn">{replyTo ? 'Post Reply' : 'Publish Comment'}</button>
                                </form>
                            </div>
                        </section>
                    </article>
                </div>
            </div>
        </div>
    );
};

export default BlogDetail;
