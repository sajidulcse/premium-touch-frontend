import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getSiteInfo, getServices, getStorageUrl, BASE_URL } from '../../api/axios';
import './Home.css';

const Home = () => {
    const [settings, setSettings] = useState(null);
    const [services, setServices] = useState([]);
    const [featuredProjects, setFeaturedProjects] = useState([]);
    const [activeSlide, setActiveSlide] = useState(0);
    const [currentReview, setCurrentReview] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [cardsPerView, setCardsPerView] = useState(3);
    const [disableTransition, setDisableTransition] = useState(false);

    // Hero Slider Data
    const [slides, setSlides] = useState([
        {
            image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1920&q=80",
            subtitle: "PREMIUM TOUCH STUDIO",
            title: "Curated Luxury Interiors",
            desc: "Crafting bespoke residential spaces designed with premium materials, signature millwork, and luxury details."
        },
        {
            image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1920&q=80",
            subtitle: "ARCHITECTURAL PRECISION",
            title: "Sophisticated Sanctuary",
            desc: "Transforming physical layouts into highly personalized environments, blending modern utility with timeless elegance."
        },
        {
            image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1920&q=80",
            subtitle: "BESPOKE CRAFTSMANSHIP",
            title: "Tailored Design Philosophy",
            desc: "No cookie-cutter templates. We select custom marbles, rich veneers, and fine lighting to match your lifestyle."
        }
    ]);

    const [identity, setIdentity] = useState({
        subtitle: 'OUR IDENTITY',
        title: 'Crafting Spaces, Defining Lifestyles',
        description: 'We believe that fine architecture and interior spaces are the physical expressions of personality. Our mission is to blend signature craftsmanship, premium marbles, and elegant warm wood veneers into functional, turnkey layout designs.',
        image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80'
    });

    const [processSteps, setProcessSteps] = useState([
        {
            stepNumber: "01",
            title: "Place a phone call",
            image: "/photo/process_step1.png",
            description: "Our professional customer care team is here to provide all the basic information you need to know."
        },
        {
            stepNumber: "02",
            title: "Visit",
            image: "/photo/process_step2.png",
            description: "After a successful visit, considering all your requirements along with material we will provide an idea about cost."
        },
        {
            stepNumber: "03",
            title: "Design",
            image: "/photo/process_step3.png",
            description: "For design you can bring your ideas to the table, or can choose from our vast collections. Else our creative designer team can make a complete design for you."
        },
        {
            stepNumber: "04",
            title: "Approval",
            image: "/photo/process_step4.png",
            description: "After approval of the design we will provide final costing for the project considering your choice of material."
        },
        {
            stepNumber: "05",
            title: "Payment procedure",
            image: "/photo/process_step5.png",
            description: "If the design and price is being finalized we will come up with a very easy and convenient payment procedure and working schedule."
        },
        {
            stepNumber: "06",
            title: "Agreement",
            image: "/photo/process_step6.png",
            description: "Both parties will sign in an agreement. We believe in professionalism and commitment. Our professional architects, workers work simultaneously."
        }
    ]);

    const [testimonials, setTestimonials] = useState([
        {
            quote: "Premium Touch transformed our penthouse into a work of art. The attention to custom wood trims and marble finishes was absolute perfection.",
            author: "Marcus & Sophia",
            location: "Gulshan Residence"
        },
        {
            quote: "The spatial planning and smart lighting integrations they proposed maximized our room while delivering a world-class luxury feeling.",
            author: "David Chen",
            location: "Lakeside Villa Owner"
        },
        {
            quote: "A design team that truly listens. They took our conceptual brief and delivered a turnkey office that leaves our clients completely wowed.",
            author: "Sarah Rahman",
            location: "CEO, Nexa Studio"
        }
    ]);

    // Load initial settings, services, and portfolios
    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const [settingsData, servicesData] = await Promise.all([
                    getSiteInfo(),
                    getServices()
                ]);
                setSettings(settingsData);
                setServices(servicesData.slice(0, 3)); // show top 3 services
            } catch (err) {
                console.error("Error loading home page settings/services:", err);
            }

            try {
                const projectsRes = await api.get('/portfolios?category=all&area=all');
                setFeaturedProjects(projectsRes.data.slice(0, 3)); // show top 3 projects
            } catch (err) {
                console.error("Error loading featured projects:", err);
            }

            try {
                const [slidesRes, identityRes, processRes, reviewsRes] = await Promise.all([
                    api.get('/home-hero-slides'),
                    api.get('/home-identity'),
                    api.get('/process-steps'),
                    api.get('/client-reviews')
                ]);

                if (slidesRes.data && slidesRes.data.length > 0) {
                    setSlides(slidesRes.data);
                }
                if (identityRes.data) {
                    setIdentity(identityRes.data);
                }
                if (processRes.data && processRes.data.length > 0) {
                    const sorted = processRes.data.sort((a, b) => {
                        const numA = a.stepNumber || a.step_number || '';
                        const numB = b.stepNumber || b.step_number || '';
                        return numA.localeCompare(numB);
                    });
                    setProcessSteps(sorted);
                }
                if (reviewsRes.data && reviewsRes.data.length > 0) {
                    setTestimonials(reviewsRes.data);
                }
            } catch (err) {
                console.error("Error loading homepage setups from DB:", err);
            }
        };

        fetchHomeData();
    }, []);

    // Auto rotate hero slides
    useEffect(() => {
        const slideInterval = setInterval(() => {
            setActiveSlide(prev => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(slideInterval);
    }, [slides.length]);

    // Auto rotate testimonials (slides left to right: index decrements)
    useEffect(() => {
        if (isPaused || isDragging || testimonials.length <= 1) return;
        
        const interval = setInterval(() => {
            setCurrentReview(prev => prev - 1);
        }, 4000);
        
        return () => clearInterval(interval);
    }, [isPaused, isDragging, testimonials.length]);

    // Monitor window width to adjust slide range and dots dynamically
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 640) {
                setCardsPerView(1);
            } else if (window.innerWidth <= 1024) {
                setCardsPerView(2);
            } else {
                setCardsPerView(3);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (disableTransition) {
            let rafId1, rafId2;
            rafId1 = requestAnimationFrame(() => {
                rafId2 = requestAnimationFrame(() => {
                    setDisableTransition(false);
                });
            });
            return () => {
                if (rafId1) cancelAnimationFrame(rafId1);
                if (rafId2) cancelAnimationFrame(rafId2);
            };
        }
    }, [disableTransition]);

    // Reset currentReview to middle set when testimonials change
    useEffect(() => {
        if (testimonials.length > 0) {
            setCurrentReview(testimonials.length * 2);
        }
    }, [testimonials]);

    const handleDragStart = (clientX) => {
        setIsDragging(true);
        setDragStartX(clientX);
        setDragOffset(0);
        setIsPaused(true);
    };

    const handleDragMove = (clientX) => {
        if (!isDragging) return;
        const diff = clientX - dragStartX;
        setDragOffset(diff);
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        
        const N = testimonials.length;
        if (N > 0) {
            const minBound = N;
            const maxBound = N * 4 - 1;
            if (dragOffset > 50) {
                // Dragged right -> Show previous
                setCurrentReview(prev => Math.max(minBound, prev - 1));
            } else if (dragOffset < -50) {
                // Dragged left -> Show next
                setCurrentReview(prev => Math.min(maxBound, prev + 1));
            }
        }
        setDragOffset(0);
        setIsPaused(false);
    };

    const handleTransitionEnd = (e) => {
        // Only handle transitions of the track itself, not bubbled from cards
        if (e.target !== e.currentTarget) return;
        if (e.propertyName !== 'transform') return;

        const N = testimonials.length;
        if (N === 0) return;
        
        const minMiddle = N * 2;
        const maxMiddle = N * 3 - 1;
        
        if (currentReview < minMiddle) {
            setDisableTransition(true);
            setCurrentReview(prev => prev + N);
        } else if (currentReview > maxMiddle) {
            setDisableTransition(true);
            setCurrentReview(prev => prev - N);
        }
    };
    // Fallback Services if none loaded from backend
    const defaultServices = [
        {
            id: 1,
            name: "Residential Design",
            description: "Designing bespoke luxury drawing rooms, modern kitchens, custom wardrobes, and high-fidelity bedrooms tailored to comfort.",
            image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80",
            slug: "residential-design"
        },
        {
            id: 2,
            name: "Commercial Spaces",
            description: "Creating premium boutique offices, luxury retail showrooms, and aesthetic restaurants designed to elevate client experience.",
            image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
            slug: "commercial-spaces"
        },
        {
            id: 3,
            name: "Bespoke Millwork & Trims",
            description: "Implementing custom marble detailing, rich wooden veneers, hidden lighting panels, and brass trims to absolute perfection.",
            image: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80",
            slug: "bespoke-millwork-trims"
        }
    ];

    // Fallback Projects if none loaded from backend
    const defaultProjects = [
        {
            id: 1,
            title: "Minimalist Living Oasis",
            category: { name: "Residential" },
            image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
            slug: "minimalist-living-oasis"
        },
        {
            id: 2,
            title: "Marble Master Bath Sanctuary",
            category: { name: "Bespoke Details" },
            image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=800&q=80",
            slug: "marble-master-bath"
        },
        {
            id: 3,
            title: "Mid-Century Modern Kitchen",
            category: { name: "Kitchen" },
            image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            slug: "mid-century-kitchen"
        }
    ];

    const displayServices = services.length > 0 ? services : defaultServices;
    const displayProjects = featuredProjects.length > 0 ? featuredProjects : defaultProjects;

    const extendedTestimonials = [];
    if (testimonials.length > 0) {
        for (let i = 0; i < 5; i++) {
            extendedTestimonials.push(...testimonials);
        }
    }

    return (
        <div className="home-page-wrapper">
            {/* Immersive Hero Slider */}
            <section className="home-hero-slider">
                {slides.map((slide, idx) => (
                    <div 
                        key={idx} 
                        className={`hero-slide ${idx === activeSlide ? 'active' : ''}`}
                    >
                        <div 
                            className="hero-slide-bg" 
                            style={{ backgroundImage: `url(${getStorageUrl(slide.image)})` }}
                        ></div>
                        <div className="hero-slide-overlay"></div>
                        <div className="hero-slide-content">
                            <span className="hero-slide-subtitle">{slide.subtitle}</span>
                            <h1 className="hero-slide-title">{slide.title}</h1>
                            <p className="hero-slide-desc">{slide.desc}</p>
                            <div className="hero-slide-actions">
                                <Link to="/contact#contact-form" className="hero-btn-primary">START A PROJECT</Link>
                                <Link to="/portfolio" className="hero-btn-secondary">EXPLORE WORKS</Link>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Slider Indicators */}
                <div className="hero-slider-dots">
                    {slides.map((_, idx) => (
                        <button 
                            key={idx}
                            className={`slider-dot ${idx === activeSlide ? 'active' : ''}`}
                            onClick={() => setActiveSlide(idx)}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </section>

            {/* Welcome / Story Intro Section */}
            <section className="home-story-section">
                <div className="home-story-grid">
                    <div className="home-story-image">
                        <img 
                            src={getStorageUrl(identity.image)} 
                            alt="Luxury Showroom Design" 
                            className="story-parallax-img"
                        />
                        <div className="story-image-backdrop"></div>
                    </div>
                    <div className="home-story-content">
                        <span className="home-subtitle">{identity.subtitle}</span>
                        <h2 className="home-title">{identity.title}</h2>
                        <div className="home-divider"></div>
                        <p className="home-desc">
                            {identity.description}
                        </p>

                        <Link to="/about-us/about-overview" className="home-story-link">
                            OUR HISTORY <i className="fas fa-arrow-right"></i>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Design Process Section */}
            <section className="home-process-section">
                <div className="home-section-header">
                    <span className="home-subtitle">THE ROADMAP</span>
                    <h2 className="home-title">Our Creative Process</h2>
                    <div className="home-divider-centered"></div>
                </div>

                <div className="process-grid">
                    {processSteps.map((step, index) => (
                        <div key={index} className="process-card">
                            <div className="process-card-header">
                                <span className="process-number">{step.stepNumber}</span>
                                <div className="process-image-box">
                                    <img src={getStorageUrl(step.image)} alt={step.title} />
                                </div>
                            </div>
                            <div className="process-card-content">
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Core Services / Expertise Highlight */}
            <section className="home-services-section">
                <div className="home-section-header">
                    <span className="home-subtitle">OUR EXPERTISE</span>
                    <h2 className="home-title">Interior & Architecture Services</h2>
                    <div className="home-divider-centered"></div>
                </div>

                <div className="home-services-grid">
                    {displayServices.map((service, index) => {
                        let imageSrc = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80";
                        if (service.thumbnail) {
                            imageSrc = getStorageUrl(service.thumbnail.image_path);
                        } else if (service.images && service.images.length > 0) {
                            imageSrc = getStorageUrl(service.images[0].image_path);
                        } else if (service.image) {
                            imageSrc = service.image;
                        }

                        const serviceName = service.sub_category?.name || service.name || "Interior Service";
                        const serviceSlug = service.sub_category?.slug || service.slug || service.id;

                        return (
                            <div key={service.id || index} className="home-service-card">
                                <Link to={`/services/${serviceSlug}`} className="service-card-image-link">
                                    <div className="service-card-image-wrapper">
                                        <img src={imageSrc} alt={serviceName} />
                                    </div>
                                </Link>
                                <div className="service-card-text-wrapper">
                                    <Link to={`/services/${serviceSlug}`} className="service-card-title-link">
                                        <h3>{serviceName}</h3>
                                    </Link>
                                    <Link to={`/services/${serviceSlug}`} className="service-card-link">
                                        READ DETAIL <i className="fas fa-chevron-right"></i>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="home-services-footer">
                    <Link to="/services" className="home-btn-outline">VIEW ALL SERVICES</Link>
                </div>
            </section>

            {/* Selected Works / Featured Portfolio Showcase */}
            <section className="home-projects-section">
                <div className="home-section-header">
                    <span className="home-subtitle">SELECTED WORK</span>
                    <h2 className="home-title">Featured Design Gallery</h2>
                    <div className="home-divider-centered"></div>
                </div>

                <div className="home-projects-grid">
                    {displayProjects.map((project, index) => {
                        const imageSrc = project.image 
                            ? (project.image.startsWith('http') ? project.image : getStorageUrl(project.image))
                            : (project.cover_image ? `${BASE_URL.replace(/\/api$/, '')}/public/uploads/portfolios/${project.cover_image}` : "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80");
                        
                        return (
                            <Link 
                                to={project.slug ? `/portfolio/view/${project.slug}` : "/portfolio"} 
                                key={project.id || index} 
                                className="home-project-card"
                            >
                                <div className="project-card-image-box">
                                    <img src={imageSrc} alt={project.title} />
                                    <div className="project-card-overlay">
                                        <div className="project-card-meta">
                                            <span className="project-category">{project.category?.name || "Interior"}</span>
                                            <h4>{project.title}</h4>
                                        </div>
                                        <div className="project-card-arrow">
                                            <i className="fas fa-plus"></i>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="home-projects-footer">
                    <Link to="/portfolio" className="home-btn-outline">EXPLORE DYNAMIC PORTFOLIO</Link>
                </div>
            </section>

            {/* Luxurious Client Testimonials Section */}
            {testimonials.length > 0 && (
                <section className="home-testimonials-section">
                    <div className="testimonials-bg-shapes"></div>
                    <div className="home-section-header">
                        <span className="home-subtitle" style={{ color: '#E85D25' }}>CLIENT TRUST</span>
                        <h2 className="home-title" style={{ color: '#ffffff' }}>What Our Clients Say</h2>
                        <div className="home-divider-centered" style={{ backgroundColor: '#E85D25' }}></div>
                    </div>

                    <div className="home-testimonials-slider-container">
                        <div 
                            className="testimonial-slider-viewport"
                            onMouseDown={(e) => handleDragStart(e.clientX)}
                            onMouseMove={(e) => handleDragMove(e.clientX)}
                            onMouseUp={handleDragEnd}
                            onMouseLeave={() => {
                                if (isDragging) handleDragEnd();
                                setIsPaused(false);
                            }}
                            onMouseEnter={() => setIsPaused(true)}
                            onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                            onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
                            onTouchEnd={handleDragEnd}
                            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                        >
                            <div 
                                className={`testimonial-slider-track ${disableTransition ? 'no-transition' : ''}`}
                                onTransitionEnd={handleTransitionEnd}
                                style={{ 
                                    '--current-review': currentReview,
                                    '--cards-per-view': cardsPerView,
                                    '--shift-factor': (cardsPerView - 1) / 2,
                                    '--drag-offset': `${dragOffset}px`,
                                    transform: `translate3d(calc(-1 * (var(--current-review) - var(--shift-factor)) * (100% + var(--gap)) / var(--cards-per-view) + var(--drag-offset)), 0, 0)`,
                                    transition: (isDragging || disableTransition) ? 'none' : 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
                                }}
                            >
                                {extendedTestimonials.map((t, idx) => {
                                    const isHighlighted = idx === currentReview;
                                    return (
                                        <div key={idx} className={`home-testimonial-slide-card ${isHighlighted ? 'highlighted' : ''}`}>
                                            <div className="testimonial-avatar-container">
                                                {t.image ? (
                                                    <img 
                                                        src={getStorageUrl(t.image)} 
                                                        alt={t.author}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentNode.innerHTML = '<div class="avatar-placeholder"><i class="fas fa-user"></i></div>';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="avatar-placeholder">
                                                        <i className="fas fa-user"></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="testimonial-text-container">
                                                <div className="testimonial-stars">
                                                    <i className="fas fa-star"></i>
                                                    <i className="fas fa-star"></i>
                                                    <i className="fas fa-star"></i>
                                                    <i className="fas fa-star"></i>
                                                    <i className="fas fa-star"></i>
                                                </div>
                                                <p className="testimonial-quote">"{t.quote}"</p>
                                                <div className="testimonial-divider"></div>
                                                <h5 className="testimonial-author">{t.author}</h5>
                                                <span className="testimonial-location">{t.location || 'Client'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Testimonial slider pagination dots */}
                        {testimonials.length > 1 && (
                            <div className="testimonial-slider-dots">
                                {testimonials.map((_, idx) => (
                                    <button 
                                        key={idx}
                                        className={`testimonial-dot ${idx === (currentReview % testimonials.length) ? 'active' : ''}`}
                                        onClick={() => {
                                            const N = testimonials.length;
                                            const currentSet = Math.floor(currentReview / N);
                                            setCurrentReview(idx + currentSet * N);
                                        }}
                                        aria-label={`Go to slide ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

        </div>
    );
};

export default Home;
