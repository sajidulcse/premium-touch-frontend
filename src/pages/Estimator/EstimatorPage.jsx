import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEstimator, EstimatorProvider } from './EstimatorContext';
import { BASE_URL } from '../../api/axios';
import SEO from '../../components/SEO/SEO';
import { getBreadcrumbSchema } from '../../utils/seoSchemas';
import './EstimatorPage.css';

// Validation Schema using Zod
const leadSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    phone: z.string().min(10, { message: "Please enter a valid phone number (at least 10 digits)" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    location: z.string().min(2, { message: "City or Area location is required" }),
    country_code: z.string().optional()
});

const EstimatorWizard = () => {
    const {
        step,
        setStep,
        config,
        configLoading,
        error,
        setError,
        homeSize,
        setHomeSize,
        flatStatus,
        setFlatStatus,
        roomQuantities,
        updateRoomQuantity,
        addonSelections,
        toggleAddon,
        updateAddonQuantity,
        selectedPackageId,
        setSelectedPackageId,
        submitLoading,
        leadId,
        result,
        submitLead,
        resetEstimator,
        consultationSubmitted,
        consultationLoading,
        requestConsultationApi,
        otpSent,
        setOtpSent,
        otpLoading,
        otpError,
        setOtpError,
        otpCodeForTesting,
        pendingLeadData,
        sendOtpApi
    } = useEstimator();

    // Preset selection tracking
    const [homeSizeError, setHomeSizeError] = useState('');

    // OTP local input and countdown timer
    const [otpInput, setOtpInput] = useState('');
    const [resendTimer, setResendTimer] = useState(0);
    const [resendSuccess, setResendSuccess] = useState(false);

    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [resendTimer]);

    useEffect(() => {
        if (otpSent) {
            setResendTimer(60);
            setOtpInput('');
            setResendSuccess(false);
        }
    }, [otpSent]);

    // React Hook Form for Step 5
    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: zodResolver(leadSchema),
        defaultValues: { name: '', phone: '', email: '', location: '', project_address: '', country_code: '+880' }
    });

    // Reset lead info form when lead state is reset
    useEffect(() => {
        if (step === 1) {
            reset({ name: '', phone: '', email: '', location: '', project_address: '', country_code: '+880' });
        }
    }, [step, reset]);

    // Scroll to the top of the estimator card when the step changes (skipping initial mount)
    const isMounted = React.useRef(false);
    useEffect(() => {
        if (isMounted.current) {
            const container = document.querySelector('.estimator-container');
            if (container) {
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            isMounted.current = true;
        }
    }, [step]);

    const handleHomeSizeChange = (e) => {
        const raw = e.target.value;
        const val = Number(raw);
        if (!raw || raw.trim() === '') {
            setHomeSizeError('Home size is required.');
            setHomeSize(0);
        } else if (isNaN(val) || val <= 0) {
            setHomeSizeError('Please enter a valid size greater than 0.');
            setHomeSize(0);
        } else {
            setHomeSizeError('');
            setHomeSize(val);
        }
    };

    const totalSelectedRoomsCount = Object.values(roomQuantities).reduce((a, b) => a + b, 0);

    // Filter rooms that are currently selected (qty > 0)
    const selectedRoomsWithAddons = config.rooms.filter(room => {
        const qty = roomQuantities[room.id] || 0;
        return qty > 0 && room.addons && room.addons.length > 0;
    });

    const activePackage = config.packages.find(p => p.id === selectedPackageId) || {};

    const handleFormSubmit = async (data) => {
        try {
            // Append country code prefix to phone
            const fullPhone = `${data.country_code}${data.phone}`;
            await sendOtpApi({
                name: data.name,
                phone: fullPhone,
                email: data.email,
                location: data.location,
                project_address: '' // address is optional and empty
            });
        } catch (err) {
            // Error is handled inside context
        }
    };

    const handleOtpVerify = async (e) => {
        e.preventDefault();
        if (!otpInput || otpInput.trim().length !== 4) {
            setOtpError("Please enter a valid 4-digit verification code.");
            return;
        }
        try {
            await submitLead(pendingLeadData, otpInput.trim());
        } catch (err) {
            // Error is handled inside context
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        try {
            setResendSuccess(false);
            await sendOtpApi(pendingLeadData);
            setResendSuccess(true);
            setOtpError(null);
        } catch (err) {
            // Error is handled inside context
        }
    };

    const handleDownloadPdf = () => {
        if (!leadId) return;
        window.open(`${BASE_URL}/estimator/download-pdf/${leadId}`, '_blank');
    };

    if (configLoading) {
        return (
            <div className="estimator-loading-screen">
                <div className="estimator-spinner-wrapper">
                    <div className="estimator-spinner"></div>
                    <div className="spinner-glow"></div>
                </div>
                <h3>Compiling System</h3>
                <p>Fetching dynamic options and catalog rates...</p>
            </div>
        );
    }

    if (error && step !== 6) {
        return (
            <div className="estimator-error-screen animated fadeIn">
                <div className="error-icon"><i className="fas fa-exclamation-triangle"></i></div>
                <h3>Calculation Error</h3>
                <p>{error}</p>
                <button onClick={resetEstimator} className="btn-primary">Try Again</button>
            </div>
        );
    }

    return (
        <div className="estimator-container">
            {/* Header branding info */}
            <div className="estimator-branding-header text-center">
                <span className="branding-tag">{config.site_name || 'Our Interior Studio'}</span>
                <h1 className="branding-title">Calculate Your Dream Space Cost Instantly</h1>
                <p className="branding-subtitle">Get an approximate costing for your home interiors in just 6 simple steps.</p>
            </div>

            {/* Main Compact Card container */}
            <div className="estimator-main-card">
                
                {/* Step Progress Tracker Node Bar */}
                <div className="estimator-progress-bar no-print">
                    {[
                        { number: "1", label: "Welcome" },
                        { number: "2", label: "Size & Rooms" },
                        { number: "3", label: "Add-ons" },
                        { number: "4", label: "Package" },
                        { number: "5", label: "Details" },
                        { number: "✓", label: "Finish" }
                    ].map((sNode, idx) => {
                        const stepNum = idx + 1;
                        const isActive = step === stepNum;
                        const isCompleted = step > stepNum;
                        return (
                            <React.Fragment key={idx}>
                                {idx > 0 && (
                                    <div className={`nqg-progress-line ${step >= stepNum ? 'filled' : ''}`}></div>
                                )}
                                <div className={`nqg-progress-bar-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                    <div className="nqg-step-indicator">{isCompleted ? '✓' : sNode.number}</div>
                                    <div className="nqg-step-label">{sNode.label}</div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* STEP 1: WELCOME SCREEN */}
                {step === 1 && (
                    <div className="estimator-step welcome-step animated fadeIn">
                        <div className="nqg-welcome-card">
                            <div className="welcome-illustration-container">
                                <svg className="welcome-svg" viewBox="0 0 100 100">
                                    <defs>
                                        <linearGradient id="svgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#e85b28" stopOpacity="1" />
                                            <stop offset="100%" stopColor="#c9a45c" stopOpacity="1" />
                                        </linearGradient>
                                    </defs>
                                    <rect x="25" y="45" width="50" height="40" rx="4" fill="none" stroke="url(#svgGrad)" strokeWidth="3" />
                                    <polygon points="50,15 20,48 80,48" fill="none" stroke="url(#svgGrad)" strokeWidth="3" strokeLinejoin="round" />
                                    <line x1="50" y1="45" x2="50" y2="85" stroke="url(#svgGrad)" strokeWidth="2" strokeDasharray="3 3" />
                                    <circle cx="50" cy="65" r="8" fill="none" stroke="url(#svgGrad)" strokeWidth="2" />
                                </svg>
                                <div className="pulsing-circles">
                                    <div className="circle circle-1"></div>
                                    <div className="circle circle-2"></div>
                                </div>
                            </div>
                            <h2 className="welcome-card-heading">Full Home</h2>
                            <p className="welcome-card-desc">
                                Get an approximate costing for your full home interiors in just a few steps.
                            </p>
                            <button 
                                type="button" 
                                onClick={() => setStep(2)} 
                                className="nqg-btn nqg-btn-start start-button"
                            >
                                Get Started <i className="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: HOME DETAILS & ROOM SELECTION */}
                {step === 2 && (
                    <div className="estimator-step size-rooms-step animated fadeIn">
                        <h2 className="step-card-title text-center">Tell us about your home</h2>
                        <p className="step-card-subtitle text-center">Tell us about your home to get a more accurate estimate.</p>

                        <div className="step-card-section">
                            <div className="nqg-sqft-selector">
                                <label className="section-mini-title" htmlFor="nqg-home-size-input">Home Size (in sqft)</label>
                                <div className="nqg-size-input-wrapper">
                                    <input
                                        type="number"
                                        id="nqg-home-size-input"
                                        className={`nqg-size-input ${homeSizeError ? 'input-error' : homeSize > 0 ? 'input-valid' : ''}`}
                                        value={homeSize > 0 ? homeSize : ''}
                                        onChange={handleHomeSizeChange}
                                        placeholder="e.g. 1500"
                                        min="1"
                                        step="1"
                                    />
                                    <span className="nqg-size-unit">sqft</span>
                                </div>
                                {homeSizeError && (
                                    <div className="nqg-size-error">
                                        <i className="fas fa-exclamation-circle"></i> {homeSizeError}
                                    </div>
                                )}
                                {homeSize > 0 && !homeSizeError && (
                                    <div className="nqg-size-hint">
                                        <i className="fas fa-check-circle"></i> {Number(homeSize).toLocaleString()} sqft selected
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="step-card-section">
                            <label className="section-mini-title">Select Flat Status</label>
                            <div className="nqg-choice-buttons">
                                {[
                                    { key: 'New Flat', label: '✅ Ready for Interior', icon: 'fa-key' },
                                    { key: 'Under Construction', label: '🏗️ Under Construction', icon: 'fa-tools' },
                                    { key: 'Renovation', label: '❌ Not Ready', icon: 'fa-paint-roller' }
                                ].map(item => (
                                    <label key={item.key} className={`nqg-choice-card ${flatStatus === item.key ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="ready_flat"
                                            value={item.key}
                                            checked={flatStatus === item.key}
                                            onChange={() => setFlatStatus(item.key)}
                                            className="hidden-radio"
                                        />
                                        <div className="choice-card-content">
                                            <div className="choice-icon-box"><i className={`fas ${item.icon}`}></i></div>
                                            <span className="choice-label">{item.label}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="step-card-section">
                            <label className="section-mini-title">Select Rooms</label>
                            <p className="section-sub-desc">Adjust counters to select how many of each area you wish to design.</p>
                            <div className="rooms-grid-selectors">
                                {config.rooms.map(room => {
                                    const qty = roomQuantities[room.id] || 0;
                                    return (
                                        <div key={room.id} className={`room-selector-card ${qty > 0 ? 'selected' : ''}`}>
                                            <div className="room-card-main">
                                                <span className="room-card-icon">
                                                    {room.icon ? (
                                                        <i className={room.icon}></i>
                                                    ) : (
                                                        <>
                                                            {room.slug.includes('bedroom') && <i className="fas fa-bed"></i>}
                                                            {room.slug.includes('kitchen') && <i className="fas fa-sink"></i>}
                                                            {room.slug.includes('bathroom') && <i className="fas fa-bath"></i>}
                                                            {room.slug.includes('living') && <i className="fas fa-couch"></i>}
                                                            {room.slug.includes('dining') && <i className="fas fa-utensils"></i>}
                                                            {room.slug.includes('balcony') && <i className="fas fa-cloud-sun"></i>}
                                                            {room.slug.includes('study') && <i className="fas fa-book-reader"></i>}
                                                            {(!room.slug.includes('bedroom') && !room.slug.includes('kitchen') && !room.slug.includes('bathroom') && !room.slug.includes('living') && !room.slug.includes('dining') && !room.slug.includes('balcony') && !room.slug.includes('study')) && <i className="fas fa-door-closed"></i>}
                                                        </>
                                                    )}
                                                </span>
                                                <span className="room-card-name">{room.name}</span>
                                            </div>
                                            <div className="nqg-counter">
                                                <button
                                                    type="button"
                                                    onClick={() => updateRoomQuantity(room.id, -1)}
                                                    className="minus"
                                                    disabled={qty === 0}
                                                >
                                                    -
                                                </button>
                                                <span className="count">{qty}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateRoomQuantity(room.id, 1)}
                                                    className="plus"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="nqg-navigation">
                            <button type="button" onClick={() => setStep(1)} className="nqg-btn nqg-btn-back">Back</button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!homeSize || homeSize <= 0) {
                                        setHomeSizeError('Home size is required.');
                                        return;
                                    }
                                    setStep(3);
                                }}
                                className="nqg-btn"
                                disabled={totalSelectedRoomsCount === 0 || homeSize <= 0 || !flatStatus}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: ROOM-BASED ADD-ONS */}
                {step === 3 && (
                    <div className="estimator-step addons-step animated fadeIn">
                        <h2 className="step-card-title text-center">Select Add-on(Design/Work Options)</h2>
                        <p className="step-card-subtitle text-center">Customize your design with our available add-on options.</p>

                        {selectedRoomsWithAddons.length === 0 ? (
                            <div className="no-addons-card text-center">
                                <div className="no-addons-icon"><i className="fas fa-info-circle"></i></div>
                                <h3>No Add-ons Available</h3>
                                <p>The rooms you selected do not have database add-on options configured. You can proceed directly to package selection.</p>
                            </div>
                        ) : (
                            <div className="nqg-room-addons-list">
                                {selectedRoomsWithAddons.map(room => (
                                    <div key={room.id} className="nqg-room-addons-block">
                                        <h4 className="nqg-room-section-title">Add-ons for {room.name}</h4>
                                        <div className="nqg-features-grid">
                                            {room.addons.map(addon => {
                                                const selection = addonSelections[addon.id] || { selected: false, quantity: 1 };
                                                const addonQty = selection.quantity || 1;
                                                return (
                                                    <div key={addon.id} className={`nqg-feature-card ${selection.selected ? 'checked' : ''}`}>
                                                        <label className="feature-checkbox-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={selection.selected}
                                                                onChange={() => toggleAddon(addon.id)}
                                                                className="feature-checkbox"
                                                            />
                                                            <div className="feature-info-content">
                                                                <span className="feature-name">{addon.name}</span>
                                                            </div>
                                                        </label>

                                                        {selection.selected && (
                                                            <div className="feature-counter-row animated scaleIn">
                                                                <span className="qty-label">Qty:</span>
                                                                <div className="nqg-counter mini">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateAddonQuantity(addon.id, -1)}
                                                                        className="minus"
                                                                        disabled={addonQty === 1}
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <span className="count">{addonQty}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateAddonQuantity(addon.id, 1)}
                                                                        className="plus"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="nqg-navigation">
                            <button type="button" onClick={() => setStep(2)} className="nqg-btn nqg-btn-back">Back</button>
                            <button type="button" onClick={() => setStep(4)} className="nqg-btn">Next</button>
                        </div>
                    </div>
                )}

                {/* STEP 4: PACKAGE SELECTION */}
                {step === 4 && (
                    <div className="estimator-step packages-step animated fadeIn">
                        <h2 className="step-card-title text-center">Pick your package</h2>
                        <p className="step-card-subtitle text-center">We have packages for every budget and style preference.</p>

                        <div className="nqg-package-grid">
                            {config.packages.map(pkg => {
                                const isSelected = selectedPackageId === pkg.id;
                                const features = pkg.features ? pkg.features.split('\n').filter(Boolean) : [];
                                return (
                                    <label key={pkg.id} className={`nqg-package-card ${isSelected ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="package"
                                            value={pkg.id}
                                            checked={isSelected}
                                            onChange={() => setSelectedPackageId(pkg.id)}
                                            className="hidden-radio"
                                        />
                                        <div className="nqg-package-content">
                                            {pkg.name.toLowerCase() === 'premium' && <div className="pkg-ribbon">Best Value</div>}
                                            {pkg.name.toLowerCase() === 'luxury' && <div className="pkg-ribbon gold">Luxury</div>}
                                            
                                            <h3 className="pkg-name">{pkg.name}</h3>
                                            <p className="pkg-desc">{pkg.description}</p>
                                            
                                            {pkg.image_url ? (
                                                <img src={pkg.image_url} alt={pkg.name} className="nqg-package-img" />
                                            ) : (
                                                <div className="nqg-package-img-fallback">
                                                    <i className="fas fa-couch"></i>
                                                </div>
                                            )}

                                            <ul className="pkg-features-list">
                                                {features.map((feat, fidx) => (
                                                    <li key={fidx}>
                                                        <span className="check-icon">✓</span> {feat.replace(/^\*\s*/, '')}
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="select-pkg-indicator">
                                                {isSelected ? (
                                                    <span className="selected-text"><i className="fas fa-check-circle"></i> Selected</span>
                                                ) : (
                                                    <span className="select-text">Select Package</span>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>

                        <div className="nqg-navigation">
                            <button type="button" onClick={() => setStep(3)} className="nqg-btn nqg-btn-back">Back</button>
                            <button
                                type="button"
                                onClick={() => setStep(5)}
                                className="nqg-btn"
                                disabled={!selectedPackageId}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 5: LEAD DETAILS & OTP VERIFICATION */}
                {step === 5 && (
                    <div className="estimator-step contact-step animated fadeIn">
                        {!otpSent ? (
                            <>
                                <h2 className="step-card-title text-center">Your Estimate Is Almost Ready</h2>
                                <p className="step-card-subtitle text-center">Provide your contact details to see the final estimate.</p>

                                <form onSubmit={handleSubmit(handleFormSubmit)} className="nqg-card nqg-contact-card">
                                    <div className="form-input-grid">
                                        <div className="form-floating-group">
                                            <input
                                                type="text"
                                                id="name"
                                                {...register('name')}
                                                className={`form-input ${errors.name ? 'is-invalid' : ''}`}
                                                placeholder=" "
                                            />
                                            <label htmlFor="name">Full Name</label>
                                            {errors.name && <span className="error-message">{errors.name.message}</span>}
                                        </div>

                                        <div className="form-floating-group">
                                            <input
                                                type="email"
                                                id="email"
                                                {...register('email')}
                                                className={`form-input ${errors.email ? 'is-invalid' : ''}`}
                                                placeholder=" "
                                            />
                                            <label htmlFor="email">Email ID</label>
                                            {errors.email && <span className="error-message">{errors.email.message}</span>}
                                        </div>

                                        <div className="nqg-phone-field-wrapper">
                                            <div className="country-code-select-container">
                                                <select 
                                                    {...register('country_code')}
                                                    className="nqg-country-code-select nqg-select"
                                                >
                                                    <option value="+880">BD +880</option>
                                                    <option value="+966">SA +966</option>
                                                    <option value="+971">AE +971</option>
                                                    <option value="+968">OM +968</option>
                                                    <option value="+974">QA +974</option>
                                                    <option value="+965">KW +965</option>
                                                    <option value="+60">MY +60</option>
                                                    <option value="+65">SG +65</option>
                                                    <option value="+1">US +1</option>
                                                    <option value="+44">UK +44</option>
                                                    <option value="+39">IT +39</option>
                                                    <option value="+1">CA +1</option>
                                                    <option value="+61">AU +61</option>
                                                    <option value="+91">IN +91</option>
                                                </select>
                                            </div>
                                            <div className="form-floating-group phone-number-input-group">
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    {...register('phone')}
                                                    className={`form-input nqg_phone_numbr ${errors.phone ? 'is-invalid' : ''}`}
                                                    placeholder=" "
                                                />
                                                <label htmlFor="phone">Phone number</label>
                                                {errors.phone && <span className="error-message">{errors.phone.message}</span>}
                                            </div>
                                        </div>

                                        <div className="form-floating-group">
                                            <input
                                                type="text"
                                                id="location"
                                                {...register('location')}
                                                className={`form-input ${errors.location ? 'is-invalid' : ''}`}
                                                placeholder=" "
                                            />
                                            <label htmlFor="location">City / Location</label>
                                            {errors.location && <span className="error-message">{errors.location.message}</span>}
                                        </div>
                                    </div>

                                    {otpError && (
                                        <div className="nqg-otp-alert-error animated fadeIn">
                                            <i className="fas fa-exclamation-circle"></i> {otpError}
                                        </div>
                                    )}

                                    <p className="nqg-phone-notice">We will send a verification code to your phone number.</p>

                                    <button 
                                        type="submit" 
                                        id="nqg-send-sms-btn" 
                                        className="nqg-btn nqg-btn-submit"
                                        disabled={otpLoading}
                                    >
                                        {otpLoading ? (
                                            <>
                                                <span className="spinner-small"></span> Sending Code...
                                            </>
                                        ) : (
                                            <>Send Verification Code</>
                                        )}
                                    </button>
                                </form>
                                <div className="nqg-navigation">
                                    <button type="button" onClick={() => setStep(4)} className="nqg-btn nqg-btn-back">Back</button>
                                </div>
                            </>
                        ) : (
                            <div className="otp-verification-container animated fadeIn">
                                <h2 className="step-card-title text-center" style={{ marginBottom: '4px' }}>Verify Your Number</h2>
                                <p className="step-card-subtitle text-center font-bold" style={{ marginBottom: '15px' }}>
                                    We've sent a 4-digit verification code to <span className="nqg-highlight-phone">{pendingLeadData?.phone}</span>.
                                </p>

                                <form onSubmit={handleOtpVerify} className="nqg-card nqg-contact-card otp-verification-card">
                                    <div className="nqg-otp-input-container">
                                        <label className="section-mini-title text-center" htmlFor="otpCode">Verification Code</label>
                                        <input
                                            type="text"
                                            id="otpCode"
                                            value={otpInput}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                if (val.length <= 4) {
                                                    setOtpInput(val);
                                                    setOtpError(null);
                                                    setError(null);
                                                    setResendSuccess(false);
                                                }
                                            }}
                                            className="nqg-otp-digit-input text-center"
                                            placeholder="e.g. 1234"
                                            maxLength="4"
                                            autoComplete="one-time-code"
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    {resendSuccess && (
                                        <div className="nqg-otp-alert-success animated fadeIn">
                                            <i className="fas fa-check-circle"></i> Verification code resent successfully!
                                        </div>
                                    )}

                                    {error && (
                                        <div className="nqg-otp-alert-error animated fadeIn">
                                            <i className="fas fa-exclamation-circle"></i> {error}
                                        </div>
                                    )}

                                    {otpError && (
                                        <div className="nqg-otp-alert-error animated fadeIn">
                                            <i className="fas fa-exclamation-circle"></i> {otpError}
                                        </div>
                                    )}

                                    <div className="otp-timer-action text-center">
                                        {resendTimer > 0 ? (
                                            <p className="timer-text text-muted">
                                                Resend verification code in <strong>{resendTimer}s</strong>
                                            </p>
                                        ) : (
                                            <button 
                                                type="button" 
                                                onClick={handleResendOtp} 
                                                className="nqg-btn-resend-link"
                                                disabled={otpLoading}
                                            >
                                                {otpLoading ? "Sending..." : "Resend Verification Code"}
                                            </button>
                                        )}
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="nqg-btn nqg-btn-submit"
                                        disabled={submitLoading}
                                    >
                                        {submitLoading ? (
                                            <>
                                                <span className="spinner-small"></span> Verifying & Calculating...
                                            </>
                                        ) : (
                                            <>Verify & Show Final Cost</>
                                        )}
                                    </button>
                                </form>
                                <div className="nqg-navigation justify-center" style={{ marginTop: '10px' }}>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setOtpSent(false);
                                            setOtpError(null);
                                            setError(null);
                                            setResendSuccess(false);
                                        }} 
                                        className="nqg-btn-change-details"
                                    >
                                        <i className="fas fa-edit"></i> Edit Contact Info
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 6: ESTIMATE RESULT */}
                {step === 6 && result && (
                    <div className="estimator-step finish-step animated scaleIn">
                        <h2 className="step-card-title text-center">Your Final Estimate</h2>
                        <p className="step-card-subtitle text-center">Thank you! Here is your personalized estimate.</p>
                        
                        <div className="nqg-summary-card">
                            <div className="nqg-minimal-total-card">
                                <span className="nqg-final-price-label">Total Estimated Cost</span>
                                <strong id="nqg-final-cost">
                                    ৳ {Number(result.total).toLocaleString()}
                                </strong>
                                <div className="price-disclaimer-label">Approx. estimate. Final price confirmed after site measurement, design and material selection.</div>
                            </div>

                            <div className="result-actions-grid no-print">
                                <button onClick={handleDownloadPdf} className="btn-result-action download-pdf-btn">
                                    <i className="fas fa-file-pdf"></i> Download PDF
                                </button>

                                {consultationSubmitted ? (
                                    <div className="consultation-success-badge animated scaleIn">
                                        <i className="fas fa-check-circle"></i> Consultation Requested!
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => requestConsultationApi(leadId)}
                                        className="btn-result-action consultation-btn"
                                        disabled={consultationLoading}
                                    >
                                        {consultationLoading ? (
                                            <>
                                                <span className="spinner-small white"></span> Requesting...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-calendar-check"></i> Request Consultation
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            <div className="nqg-summary-grid">
                                <div className="summary-section-block">
                                    <h4>Flat Specifications</h4>
                                    <ul className="spec-bullets">
                                        <li><span>Exact Size:</span> <strong>{Number(homeSize).toLocaleString()} sqft</strong></li>
                                        <li><span>Status:</span> <strong>{flatStatus}</strong></li>
                                        <li><span>Package:</span> <strong>{activePackage.name}</strong></li>
                                        <li><span>Rate:</span> <strong>৳{Number(activePackage.base_rate || 0).toLocaleString()} / sqft</strong></li>
                                    </ul>
                                </div>

                                <div className="summary-section-block">
                                    <h4>Selected Rooms & Quantities</h4>
                                    <ul className="spec-bullets">
                                        {config.rooms.map(room => {
                                            const qty = roomQuantities[room.id] || 0;
                                            if (qty === 0) return null;
                                            return (
                                                <li key={room.id}><span>{room.name}:</span> <strong>{qty} Room(s)</strong></li>
                                            );
                                        })}
                                    </ul>
                                </div>

                                {Object.values(addonSelections).some(s => s.selected) && (
                                    <div className="summary-section-block full-width">
                                        <h4>Selected Add-ons Detail</h4>
                                        <div className="addons-table-responsive">
                                            <table className="summary-detail-table">
                                                <thead>
                                                    <tr>
                                                        <th>Add-on</th>
                                                        <th>Room Type</th>
                                                        <th className="text-right">Unit Price</th>
                                                        <th className="text-center">Qty</th>
                                                        <th className="text-right">Total Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {config.rooms.map(room => {
                                                        const roomQty = roomQuantities[room.id] || 0;
                                                        if (roomQty === 0 || !room.addons) return null;
                                                        return room.addons.map(addon => {
                                                            const selection = addonSelections[addon.id];
                                                            if (!selection || !selection.selected) return null;
                                                            const packagePriceObj = addon.prices?.find(p => p.package_id === selectedPackageId);
                                                            const unitPrice = packagePriceObj ? Number(packagePriceObj.price) : 0;
                                                            const totalPrice = unitPrice * selection.quantity;
                                                            return (
                                                                <tr key={addon.id}>
                                                                    <td data-label="Add-on">{addon.name}</td>
                                                                    <td data-label="Room Type">{room.name}</td>
                                                                    <td data-label="Unit Price" className="text-right">৳{unitPrice.toLocaleString()}</td>
                                                                    <td data-label="Qty" className="text-center">{selection.quantity}</td>
                                                                    <td data-label="Total Price" className="text-right">
                                                                        ৳{totalPrice.toLocaleString()}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        });
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="nqg-summary-cta no-print">
                                <p className="cta-heading-text">Have questions? Talk to our design expert.</p>
                                <a href="tel:+8801406252685" className="nqg-btn nqg-btn-call">
                                    <i className="fas fa-phone-alt"></i> Call Now (+880 1406-252685)
                                </a>
                            </div>
                        </div>

                        <div className="nqg-navigation no-print">
                            <button type="button" onClick={resetEstimator} className="nqg-btn nqg-btn-back">Calculate Again</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const EstimatorPage = () => {
    return (
        <EstimatorProvider>
            <SEO 
                title="Interior Design Cost Estimator"
                description="Calculate your home interior design and renovation cost instantly with Premium Touch interactive budget calculator."
                canonical="/estimator"
                jsonLd={getBreadcrumbSchema([
                    { name: 'Home', url: '/' },
                    { name: 'Cost Estimator', url: '/estimator' }
                ])}
            />
            <EstimatorWizard />
        </EstimatorProvider>
    );
};

export default EstimatorPage;
