import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { BASE_URL, getStorageUrl } from '../../api/axios';
import './Blog.css';

const BlogList = () => {
    const [blogs, setBlogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [blogRes, catRes] = await Promise.all([
                    api.get('/blogs'),
                    api.get('/blog-categories')
                ]);
                setBlogs(blogRes.data);
                setCategories(catRes.data);
            } catch (error) {
                console.error("Error fetching blog data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="loading">Loading stories...</div>;

    return (
        <div className="blog-container">
            <header className="blog-header">
                <span className="subtitle">Our Journal</span>
                <h1>Interior Insights & Design <span className="highlight">Inspiration</span></h1>
                <p>Stay updated with the latest trends in premium living and interior design.</p>
            </header>

            <section className="explore-categories">
                <div className="section-title-wrap">
                    <h3>Explore Categories</h3>
                    <div className="title-line"></div>
                </div>
                <div className="categories-chips">
                    <Link to="/blog" className="cat-chip active">
                        All Stories
                    </Link>
                    {categories.map(cat => (
                        <Link
                            to={`/blogs/category/${cat.slug}`}
                            key={cat.id}
                            className="cat-chip"
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
                        <p>Our story is just beginning. Check back soon for design inspiration.</p>
                    </div>
                ) : (
                    blogs.map(blog => (
                        <Link to={`/blog/${blog.slug}`} key={blog.id} className="blog-card">
                            <div className="card-image">
                                {blog.images.length > 0 ? (
                                    <img src={getStorageUrl(blog.images[0].image_path)} alt={blog.title} />
                                ) : (
                                    <div className="placeholder-image">Premium Touch Interior Decor Studio</div>
                                )}
                                <div className="card-overlay">
                                    <span>Read More</span>
                                </div>
                            </div>
                            <div className="card-content">
                                <div className="card-meta">
                                    <span className="category">{blog.category?.name || 'Uncategorized'}</span>
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

export default BlogList;
