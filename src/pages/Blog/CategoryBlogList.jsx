import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getStorageUrl } from '../../api/axios';
import './Blog.css';

const CategoryBlogList = () => {
    const { slug } = useParams();
    const [blogs, setBlogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlogs = async () => {
            setLoading(true);
            try {
                const [blogRes, catRes] = await Promise.all([
                    api.get(`/category-blogs/${slug}`),
                    api.get('/blog-categories')
                ]);
                setBlogs(blogRes.data);
                setCategories(catRes.data);

                const currentCat = catRes.data.find(c => c.slug === slug);
                if (currentCat) {
                    setCategoryName(currentCat.name);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBlogs();
        window.scrollTo(0, 0);
    }, [slug]);

    if (loading) return <div className="loading">Gathering stories for you...</div>;

    return (
        <div className="blog-container">
            <header className="blog-header">
                <span className="subtitle">Category Archive</span>
                <h1>Exploring <span className="highlight">{categoryName || 'Design'}</span></h1>
                <p>Browsing all stories curated under the {categoryName?.toLowerCase() || 'design'} collection.</p>
            </header>

            <section className="explore-categories">
                <div className="section-title-wrap">
                    <h3>Explore Categories</h3>
                    <div className="title-line"></div>
                </div>
                <div className="categories-chips">
                    <Link to="/blog" className="cat-chip">
                        All Stories
                    </Link>
                    {categories.map(cat => (
                        <Link
                            to={`/blogs/category/${cat.slug}`}
                            key={cat.id}
                            className={`cat-chip ${cat.slug === slug ? 'active' : ''}`}
                        >
                            {cat.name}
                            <span className="chip-count">{cat.blogs_count}</span>
                        </Link>
                    ))}
                </div>
            </section>

            <div className="blog-grid">
                {blogs.length === 0 ? (
                    <div className="no-blogs">
                        <i className="fas fa-feather-alt"></i>
                        <p>Our collection in "{categoryName}" is coming soon. Stay tuned!</p>
                        <Link to="/blogs" className="back-link" style={{ marginTop: '20px', display: 'inline-block', color: 'var(--primary-gold)' }}>Explore All Stories</Link>
                    </div>
                ) : (
                    blogs.map(blog => (
                        <Link to={`/blog/${blog.slug}`} key={blog.id} className="blog-card">
                            <div className="card-image">
                                {blog.images && blog.images[0] ? (
                                    <img src={getStorageUrl(blog.images[0].image_path)} alt={blog.title} />
                                ) : (
                                    <div className="placeholder-image">Premium Touch</div>
                                )}
                                <div className="card-overlay">
                                    <span>Read Story</span>
                                </div>
                            </div>
                            <div className="card-content">
                                <div className="card-meta">
                                    <span className="category">{blog.category?.name || categoryName || 'Uncategorized'}</span>
                                    <span className="date">{new Date(blog.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3>{blog.title}</h3>
                                <p>{blog.content.replace(/<[^>]*>?/gm, '').substring(0, 120)}...</p>
                                <div className="card-footer">
                                    <span className="stat"><i className="far fa-eye"></i> {blog.views}</span>
                                    <span className="stat"><i className="far fa-heart"></i> {blog.likes_count || 0}</span>
                                    <span className="stat"><i className="far fa-comment"></i> {blog.comments_count || 0}</span>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

export default CategoryBlogList;
