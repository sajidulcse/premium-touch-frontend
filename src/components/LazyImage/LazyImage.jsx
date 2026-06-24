import React, { useState, useEffect, useRef } from 'react';
import './LazyImage.css';

const LazyImage = ({ src, alt, className = '' }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsInView(true);
                observer.disconnect();
            }
        });

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Reset states if src changes
    useEffect(() => {
        setIsLoaded(false);
        setHasError(false);
    }, [src]);

    const showPlaceholder = !src || hasError;

    return (
        <div ref={imgRef} className={`lazy-image-container ${className} ${showPlaceholder ? 'has-placeholder' : ''}`}>
            {/* Skeleton Loader */}
            {!isLoaded && !showPlaceholder && <div className="lazy-image-skeleton"></div>}
            
            {isInView && src && !hasError && (
                <img
                    src={src}
                    alt={alt}
                    className={`lazy-image ${isLoaded ? 'loaded' : ''}`}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setHasError(true)}
                />
            )}

            {showPlaceholder && (
                <div className="lazy-image-fallback" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    background: '#f0f0f0',
                    color: '#ccc',
                    fontSize: '24px'
                }}>
                    <i className="fas fa-image"></i>
                </div>
            )}
        </div>
    );
};

export default LazyImage;
