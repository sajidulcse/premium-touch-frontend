import React, { useState, useEffect } from 'react';
import { getSiteInfo } from '../../api/axios';
import './ContactFAB.css';
import { 
    trackWhatsAppClick, 
    trackMessengerClick, 
    trackPhoneClick, 
    trackEmailClick 
} from '../../analytics/analyticsService';

const ContactFAB = () => {
    const [settings, setSettings] = useState(null);
    const [isOpen, setIsOpen] = useState(false);


    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSiteInfo();
                setSettings(data);
            } catch (err) {
                console.error("FAB failed to load site settings:", err);
            }
        };
        fetchSettings();
    }, []);

    if (!settings) return null;

    const cleanPhoneForWhatsApp = (phoneStr) => {
        if (!phoneStr) return '';
        let cleaned = phoneStr.replace(/[^\d+]/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '880' + cleaned.substring(1);
        } else if (cleaned.startsWith('+')) {
            cleaned = cleaned.substring(1);
        }
        return cleaned;
    };

    const getMessengerUrl = (fbUrl) => {
        if (!fbUrl) return '';
        if (fbUrl.includes('m.me')) return fbUrl;
        
        let cleanUrl = fbUrl.trim();
        if (!cleanUrl.includes('facebook.com') && !cleanUrl.includes('http')) {
            return `https://m.me/${cleanUrl}`;
        }
        
        try {
            if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
                cleanUrl = 'https://' + cleanUrl;
            }
            const url = new URL(cleanUrl);
            const path = url.pathname;
            
            if (path === '/profile.php' || path === 'profile.php') {
                const pageId = url.searchParams.get('id');
                if (pageId) return `https://m.me/${pageId}`;
            }
            
            const segments = path.split('/').filter(Boolean);
            if (segments.length > 0) {
                let username = segments[0];
                if ((username === 'pages' || username === 'people' || username === 'company') && segments[1]) {
                    username = segments[1];
                }
                if (segments[2] && /^\d+$/.test(segments[2])) {
                    username = segments[2];
                }
                return `https://m.me/${username}`;
            }
        } catch (e) {
            console.warn("Failed to parse Facebook URL for Messenger:", e);
        }
        return fbUrl;
    };

    const whatsappNumber = cleanPhoneForWhatsApp(settings.phone);
    const messengerUrl = getMessengerUrl(settings.facebook_page_url);

    const contactActions = [
        {
            name: 'WhatsApp',
            icon: 'fab fa-whatsapp',
            color: 'whatsapp-btn',
            link: whatsappNumber ? `https://wa.me/${whatsappNumber}` : null,
            label: 'WhatsApp Us'
        },
        {
            name: 'Messenger',
            icon: 'fab fa-facebook-messenger',
            color: 'messenger-btn',
            link: messengerUrl || null,
            label: 'Messenger Chat'
        },
        {
            name: 'Phone',
            icon: 'fas fa-phone-alt',
            color: 'phone-btn',
            link: settings.phone ? `tel:${settings.phone}` : null,
            label: 'Call Studio'
        },
        {
            name: 'Email',
            icon: 'fas fa-envelope',
            color: 'email-btn',
            link: settings.email ? `mailto:${settings.email}` : null,
            label: 'Email Us'
        }
    ].filter(action => action.link); // Only show if contact option is configured

    if (contactActions.length === 0) return null;

    const handleActionClick = (actionName) => {
        if (actionName === 'WhatsApp') trackWhatsAppClick('floating_fab');
        else if (actionName === 'Messenger') trackMessengerClick('floating_fab');
        else if (actionName === 'Phone') trackPhoneClick('floating_fab', settings.phone);
        else if (actionName === 'Email') trackEmailClick('floating_fab', settings.email);
    };

    return (
        <div className={`contact-fab-container ${isOpen ? 'active' : ''}`}>
            {/* Expanded Action Options */}
            <div className="contact-fab-options">
                {contactActions.map((action, index) => (
                    <a 
                        key={action.name}
                        href={action.link}
                        target={action.name === 'Phone' || action.name === 'Email' ? '_self' : '_blank'}
                        rel="noopener noreferrer"
                        className={`fab-option-btn ${action.color}`}
                        onClick={() => handleActionClick(action.name)}
                        style={{ 
                            transitionDelay: `${index * 50}ms`,
                            transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0) translateY(20px)'
                        }}
                    >
                        <span className="fab-option-label">{action.label}</span>
                        <i className={action.icon}></i>
                    </a>
                ))}
            </div>


            {/* Main Trigger Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="contact-fab-trigger"
                aria-label="Contact social options menu"
            >
                <div className="trigger-icon-wrap">
                    <i className="fas fa-comments trigger-icon-open"></i>
                    <i className="fas fa-times trigger-icon-close"></i>
                </div>
                {/* Micro animation dot if collapsed */}
                {!isOpen && <span className="trigger-notification-dot"></span>}
            </button>
        </div>
    );
};

export default ContactFAB;
