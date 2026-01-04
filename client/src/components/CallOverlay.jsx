import React, { useEffect, useRef, useState } from 'react';
import { useCallContext } from '../context/CallContext';
import { useSelector } from 'react-redux';
import { FiPhone, FiPhoneOff, FiMic, FiMicOff, FiUser, FiHeadphones, FiActivity, FiX, FiLayers } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const CallDuration = ({ startTime }) => {
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (!startTime) return;
        const start = new Date(startTime).getTime();

        // Update immediately
        setDuration(Math.max(0, Math.floor((Date.now() - start) / 1000)));

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = Math.floor((now - start) / 1000);
            setDuration(Math.max(0, diff));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    const format = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return <span className="font-mono">{format(duration)}</span>;
};

const CallOverlay = () => {
    const {
        callStatus,
        callData,
        incomingCalls,
        activeVoiceCalls,
        answerCall,
        rejectCall,
        leaveCall,
        callDuration,
        remoteStream
    } = useCallContext();

    const { userInfo } = useSelector((state) => state.auth);

    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef();
    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-expand if new incoming call arrives
    useEffect(() => {
        if (incomingCalls.length > 0) {
            setIsExpanded(true);
        }
    }, [incomingCalls.length]);

    useEffect(() => {
        if (remoteStream && audioRef.current) {
            audioRef.current.srcObject = remoteStream;
            audioRef.current.play().catch(e => console.error("Audio play error", e));
        }
    }, [remoteStream]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Filter active calls to show in the dashboard (excluding my own if I am in one, or maybe showing all?)
    // User wants "Active Calls" list.
    const allActiveCalls = activeVoiceCalls;

    const totalActivity = incomingCalls.length + allActiveCalls.length;

    // We only show the Dashboard/MiniFab if there is activity (Incoming or Active)
    // The Dashboard is for Queue & Monitoring.

    const showDashboard = (incomingCalls.length > 0 || (userInfo?.isAdmin && allActiveCalls.length > 0));

    // My personal active call UI (Floating Bottom Right)
    const myActiveCallUI = (callStatus === 'calling' || callStatus === 'connected');

    // Check if I am effectively busy (Active call on server OR local connected state)
    const isLineBusy = myActiveCallUI || activeVoiceCalls.some(c => c.caller.id === userInfo._id || c.receiver.id === userInfo._id);

    return (
        <>
            {/* FLOATING FAB (When Minimized) */}
            <AnimatePresence>
                {!isExpanded && showDashboard && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        onClick={() => setIsExpanded(true)}
                        className="fixed bottom-6 left-6 z-[9990] w-14 h-14 bg-slate-900 border border-slate-700 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform group"
                    >
                        {incomingCalls.length > 0 ? (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-20"></span>
                        ) : null}

                        <div className="relative">
                            <FiLayers size={24} className={incomingCalls.length > 0 ? "text-red-500" : "text-primary"} />
                            {totalActivity > 0 && (
                                <span className={`absolute -top-3 -right-3 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${incomingCalls.length > 0 ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                    {totalActivity}
                                </span>
                            )}
                        </div>
                        {/* Tooltip */}
                        <span className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Call Center ({incomingCalls.length} Waiting)
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* EXPANDED DASHBOARD (Incoming Queue + Active Monitor) */}
            <AnimatePresence>
                {isExpanded && showDashboard && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    >
                        {/* Click outside usually handles close but let's force button usage for clarity */}
                        <div className="bg-slate-900 border border-slate-700 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] relative text-left">

                            {/* Close Button */}
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all z-10"
                            >
                                <FiX size={20} />
                            </button>

                            {/* Header */}
                            <div className="p-6 pb-4 border-b border-slate-800 bg-slate-900/50">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FiHeadphones className="text-primary" />
                                    Support Dashboard
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    {incomingCalls.length} Incoming • {allActiveCalls.length} Active
                                </p>
                            </div>

                            <div className="overflow-y-auto p-4 custom-scrollbar space-y-6">

                                {/* SECTION 1: INCOMING CALLS */}
                                {incomingCalls.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                            Incoming Queue
                                        </h3>
                                        <div className="space-y-3">
                                            {incomingCalls.map((call) => (
                                                <div key={call.callLogId} className="bg-slate-800/80 rounded-xl p-4 flex items-center justify-between border border-red-500/20 shadow-lg shadow-red-900/10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold">
                                                            {call.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-white font-bold">{call.name}</h4>
                                                            <span className="text-xs text-slate-400 block text-left">{call.isAdmin ? 'Admin' : 'Customer'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => answerCall(call)}
                                                            disabled={isLineBusy}
                                                            className={`px-4 py-2 text-white rounded-lg font-bold text-sm shadow-lg transition-all flex items-center gap-2 ${isLineBusy
                                                                ? 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-50'
                                                                : 'bg-green-500 hover:bg-green-600 shadow-green-500/20'
                                                                }`}
                                                            title={isLineBusy ? "Finish current call first" : "Answer Call"}
                                                        >
                                                            <FiPhone size={16} /> Answer
                                                        </button>
                                                        <button
                                                            onClick={() => rejectCall(call.callLogId)}
                                                            className="p-2 bg-slate-700 hover:bg-red-500/80 text-slate-300 hover:text-white rounded-lg transition-all"
                                                            title="Reject"
                                                        >
                                                            <FiPhoneOff size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* SECTION 2: ACTIVE CALLS (Monitor) - Admin Only */}
                                {userInfo?.isAdmin && allActiveCalls.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            Ongoing Calls
                                        </h3>
                                        <div className="space-y-2">
                                            {allActiveCalls.map((call) => {
                                                // Check if this is local user's call to show 'Hangup'
                                                const isMySide = call.caller.id === userInfo._id || call.receiver.id === userInfo._id;
                                                const peerId = call.caller.id === userInfo._id ? call.receiver.id : call.caller.id;

                                                return (
                                                    <div key={call.callLogId} className="bg-slate-800/40 rounded-xl p-3 flex items-center justify-between border border-slate-700">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                                                                <FiActivity size={12} />
                                                            </div>
                                                            <div className="flex flex-col text-left">
                                                                <span className="text-slate-300 text-sm font-medium">
                                                                    <span className="text-white font-bold">{call.caller?.name}</span>
                                                                    <span className="mx-1 text-slate-500">↔</span>
                                                                    <span className="text-white font-bold">{call.receiver?.name}</span>
                                                                </span>
                                                                <span className="text-[10px] text-slate-500 flex items-center gap-2">
                                                                    <span>Connected</span>
                                                                    {isMySide && <span className="text-green-500 font-bold">(Me)</span>}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            {call.startTime && (
                                                                <div className="text-xs font-mono text-slate-400 bg-slate-900/50 px-2 py-1 rounded border border-slate-700 h-8 flex items-center justify-center min-w-[3rem]">
                                                                    <CallDuration startTime={call.startTime} />
                                                                </div>
                                                            )}

                                                            {isMySide && (
                                                                <button
                                                                    onClick={() => leaveCall(peerId)}
                                                                    className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-colors shadow-lg shadow-red-500/10"
                                                                    title="End Call"
                                                                >
                                                                    <FiPhoneOff size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {incomingCalls.length === 0 && (!userInfo?.isAdmin || allActiveCalls.length === 0) && (
                                    <div className="text-center py-10 text-slate-500">
                                        <p>No active call activity.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MY ACTIVE CALL WIDGET (Unchanged) */}
            {myActiveCallUI && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    className="fixed bottom-6 right-6 z-[9999] bg-slate-900 border border-slate-700 rounded-[2rem] shadow-2xl p-6 w-80 overflow-hidden cursor-grab active:cursor-grabbing text-left"
                >
                    {/* Audio Element */}
                    <audio ref={audioRef} className="hidden" />

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 relative">
                            <FiUser className="text-slate-400" />
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm leading-tight">{callData?.name || 'Calling...'}</h3>
                            {callData && (
                                <span className={`text-[9px] font-bold uppercase tracking-wide block mb-0.5 ${callData.isAdmin ? 'text-primary' : 'text-slate-500'}`}>
                                    {callData.isAdmin ? 'Administrator' : 'Customer'}
                                </span>
                            )}
                            <p className="text-xs text-slate-400 font-mono">
                                {callStatus === 'calling' ? 'Connecting...' : formatTime(callDuration)}
                            </p>
                        </div>
                    </div>

                    {/* Visualizer */}
                    {callStatus === 'connected' && (
                        <div className="flex justify-center gap-1 h-8 mb-6 items-center">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="w-1 bg-primary rounded-full animate-wave" style={{ animationDelay: `${i * 0.1}s`, height: '40%' }}></div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-around items-center">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-3 rounded-full ${isMuted ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'} transition-colors`}
                        >
                            {isMuted ? <FiMicOff /> : <FiMic />}
                        </button>
                        <button
                            onClick={() => leaveCall()}
                            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-transform hover:scale-105"
                        >
                            <FiPhoneOff size={24} />
                        </button>
                    </div>
                </motion.div>
            )}
        </>
    );
};

export default CallOverlay;
