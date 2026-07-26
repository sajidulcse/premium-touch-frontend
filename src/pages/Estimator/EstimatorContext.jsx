import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { trackEstimateGenerated } from '../../analytics/analyticsService';

const EstimatorContext = createContext();



export const useEstimator = () => {
    const context = useContext(EstimatorContext);
    if (!context) {
        throw new Error('useEstimator must be used within an EstimatorProvider');
    }
    return context;
};

export const EstimatorProvider = ({ children }) => {
    // Step indicator
    const [step, setStep] = useState(1);

    // Database configurations
    const [config, setConfig] = useState({ packages: [], rooms: [], site_name: '' });
    const [configLoading, setConfigLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form inputs state
    const [homeSize, setHomeSize] = useState(0);
    const [flatStatus, setFlatStatus] = useState(null);
    const [roomQuantities, setRoomQuantities] = useState({}); // room_id -> quantity
    const [addonSelections, setAddonSelections] = useState({}); // addon_id -> { selected: boolean, quantity: number }
    const [selectedPackageId, setSelectedPackageId] = useState(null);
    const [leadInfo, setLeadInfo] = useState({ name: '', phone: '', email: '', location: '', project_address: '' });

    // Submission states
    const [submitLoading, setSubmitLoading] = useState(false);
    const [leadId, setLeadId] = useState(null);
    const [result, setResult] = useState(null);
    const [consultationSubmitted, setConsultationSubmitted] = useState(false);
    const [consultationLoading, setConsultationLoading] = useState(false);

    // OTP states
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState(null);
    const [otpCodeForTesting, setOtpCodeForTesting] = useState('');
    const [pendingLeadData, setPendingLeadData] = useState(null);

    // Real-time calculation state
    const [liveEstimate, setLiveEstimate] = useState(0);

    /* -------------------- FETCH CONFIG FROM API -------------------- */
    useEffect(() => {
        const initializeSelections = (data) => {
            if (data.packages && data.packages.length > 0) {
                setSelectedPackageId(data.packages[0].id);
            }
            const initialRooms = {};
            data.rooms.forEach(room => {
                initialRooms[room.id] = 0;
            });
            setRoomQuantities(initialRooms);

            const initialAddons = {};
            data.rooms.forEach(room => {
                if (room.addons && room.addons.length > 0) {
                    room.addons.forEach(addon => {
                        initialAddons[addon.id] = { selected: false, quantity: 1 };
                    });
                }
            });
            setAddonSelections(initialAddons);
        };

        const fetchConfig = async () => {
            try {
                const cachedConfig = sessionStorage.getItem('estimatorConfig_v1');
                if (cachedConfig) {
                    const parsedData = JSON.parse(cachedConfig);
                    setConfig(parsedData);
                    initializeSelections(parsedData);
                    setConfigLoading(false);
                    // Always fetch fresh data from backend and update state + cache
                    api.get('/estimator/config').then(res => {
                        sessionStorage.setItem('estimatorConfig_v1', JSON.stringify(res.data));
                        setConfig(res.data);
                        initializeSelections(res.data);
                    }).catch(e => console.error(e));
                    return;
                }

                setConfigLoading(true);
                const res = await api.get('/estimator/config');
                sessionStorage.setItem('estimatorConfig_v1', JSON.stringify(res.data));
                setConfig(res.data);
                initializeSelections(res.data);
            } catch (err) {
                console.error("Failed to load estimator configs:", err);
                setError("Unable to load cost calculator options. Please try again later.");
            } finally {
                setConfigLoading(false);
            }
        };

        fetchConfig();
    }, []);

    /* -------------------- DYNAMIC REAL-TIME COST CALCULATOR -------------------- */
    useEffect(() => {
        if (!config.packages.length) return;

        const activePackage = config.packages.find(p => p.id === selectedPackageId);
        if (!activePackage) return;

        // 1. Base cost: home size × package base_rate
        const baseCost = (Number(homeSize) || 0) * (Number(activePackage.base_rate) || 0);

        // 2. Add-ons cost: Σ(addon price × qty) for selected add-ons in active rooms
        let addonsTotal = 0;

        config.rooms.forEach(room => {
            const roomQty = roomQuantities[room.id] || 0;
            // Only count add-ons if room quantity > 0
            if (roomQty > 0 && room.addons && room.addons.length > 0) {
                room.addons.forEach(addon => {
                    const selection = addonSelections[addon.id];
                    if (selection && selection.selected) {
                        const qty = selection.quantity || 1;
                        // Find package-specific price
                        const packagePriceObj = addon.prices?.find(p => p.package_id === selectedPackageId);
                        const unitPrice = packagePriceObj ? Number(packagePriceObj.price) : 0;
                        addonsTotal += unitPrice * qty;
                    }
                });
            }
        });

        setLiveEstimate(baseCost + addonsTotal);

    }, [selectedPackageId, homeSize, roomQuantities, addonSelections, config]);

    /* -------------------- ACTION HANDLERS -------------------- */
    const updateRoomQuantity = (roomId, change) => {
        setRoomQuantities(prev => {
            const current = prev[roomId] || 0;
            const next = Math.max(0, current + change);
            return { ...prev, [roomId]: next };
        });
    };

    const toggleAddon = (addonId) => {
        setAddonSelections(prev => {
            const item = prev[addonId] || { selected: false, quantity: 1 };
            return {
                ...prev,
                [addonId]: { ...item, selected: !item.selected }
            };
        });
    };

    const updateAddonQuantity = (addonId, change) => {
        setAddonSelections(prev => {
            const item = prev[addonId] || { selected: false, quantity: 1 };
            const nextQty = Math.max(1, (item.quantity || 1) + change);
            return {
                ...prev,
                [addonId]: { ...item, quantity: nextQty }
            };
        });
    };

    const resetEstimator = () => {
        setStep(1);
        setLeadId(null);
        setResult(null);
        setConsultationSubmitted(false);
        setConsultationLoading(false);
        setLeadInfo({ name: '', phone: '', email: '', location: '', project_address: '' });
        
        setOtpSent(false);
        setOtpLoading(false);
        setOtpError(null);
        setOtpCodeForTesting('');
        setPendingLeadData(null);

        setHomeSize(0);
        setFlatStatus(null);
        
        // Reset room counters
        const initialRooms = {};
        config.rooms.forEach(room => {
            initialRooms[room.id] = 0;
        });
        setRoomQuantities(initialRooms);

        // Reset addon selections
        const initialAddons = {};
        config.rooms.forEach(room => {
            if (room.addons && room.addons.length > 0) {
                room.addons.forEach(addon => {
                    initialAddons[addon.id] = { selected: false, quantity: 1 };
                });
            }
        });
        setAddonSelections(initialAddons);
    };

    /* -------------------- SUBMIT LEAD TO BACKEND -------------------- */
    const sendOtpApi = async (formData) => {
        setOtpLoading(true);
        setOtpError(null);
        try {
            const res = await api.post('/estimator/send-otp', { phone: formData.phone });
            setOtpSent(true);
            setPendingLeadData(formData);
            if (res.data.otp_code) {
                setOtpCodeForTesting(res.data.otp_code);
            } else {
                setOtpCodeForTesting('');
            }
            return res.data;
        } catch (err) {
            console.error("Sending OTP failed:", err);
            setOtpError(err.response?.data?.message || "Failed to send verification code. Please check your phone number.");
            throw err;
        } finally {
            setOtpLoading(false);
        }
    };

    const submitLead = async (formData, otp) => {
        setSubmitLoading(true);
        setError(null);

        // Compile payload
        const roomsPayload = Object.entries(roomQuantities)
            .map(([roomId, qty]) => ({
                room_id: Number(roomId),
                quantity: qty
            }))
            .filter(item => item.quantity > 0);

        const addonsPayload = Object.entries(addonSelections)
            .filter(([_, selection]) => selection.selected)
            .map(([addonId, selection]) => ({
                addon_id: Number(addonId),
                quantity: selection.quantity
            }));

        // Generate event_id and trigger client estimate_generated tracking (GTM & Meta Pixel CustomizeProduct event)
        const activePkg = config.packages?.find(p => p.id === Number(selectedPackageId));
        const eventId = trackEstimateGenerated({
            grand_total: liveEstimate,
            package_name: activePkg?.name || '',
            rooms_count: roomsPayload.length
        });

        const payload = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            location: formData.location,
            project_address: formData.project_address || '',
            home_size: Number(homeSize),
            flat_status: flatStatus,
            package_id: Number(selectedPackageId),
            rooms: roomsPayload,
            addons: addonsPayload,
            otp: otp,
            event_id: eventId
        };

        try {
            const res = await api.post('/estimator/estimate', payload);
            setLeadId(res.data.lead_id);
            setResult({
                total: res.data.total_estimate,
            });
            // Clear pending details on success
            setPendingLeadData(null);
            setOtpSent(false);
            setOtpCodeForTesting('');
            setOtpError(null);
            setStep(6); // Go to results step
            return res.data;
        } catch (err) {

            console.error("Estimation submission failed:", err);
            const errMsg = err.response?.data?.message || "Something went wrong while saving your estimate. Please check your form fields.";
            if (err.response?.status === 422) {
                setOtpError(errMsg);
            } else {
                setError(errMsg);
            }
            throw err;
        } finally {
            setSubmitLoading(false);
        }
    };

    const requestConsultationApi = async (id) => {
        setConsultationLoading(true);
        try {
            await api.post(`/estimator/consultation-request/${id}`);
            setConsultationSubmitted(true);
        } catch (err) {
            console.error("Consultation request failed:", err);
            setError("Unable to submit consultation request. Please try again.");
            throw err;
        } finally {
            setConsultationLoading(false);
        }
    };

    return (
        <EstimatorContext.Provider value={{
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
            setRoomQuantities,
            updateRoomQuantity,
            addonSelections,
            toggleAddon,
            updateAddonQuantity,
            selectedPackageId,
            setSelectedPackageId,
            leadInfo,
            setLeadInfo,
            liveEstimate,
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
            setPendingLeadData,
            sendOtpApi
        }}>
            {children}
        </EstimatorContext.Provider>
    );
};
