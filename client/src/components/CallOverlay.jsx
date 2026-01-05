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

    // ADMIN LOGIC: Show Dashboard for Queue & Monitoring
    const showAdminDashboard = userInfo?.isAdmin && (incomingCalls.length > 0 || allActiveCalls.length > 0);

    // CUSTOMER LOGIC: Show simple Incoming Call Modal
    const showCustomerIncoming = !userInfo?.isAdmin && incomingCalls.length > 0;

    // My personal active call UI (Floating Bottom Right)
    const myActiveCallUI = (callStatus === 'calling' || callStatus === 'connected');

    // Check if I am effectively busy (Active call on server OR local connected state)
    const isLineBusy = myActiveCallUI || activeVoiceCalls.some(c => c.caller.id === userInfo._id || c.receiver.id === userInfo._id);

    return (
        <>
            {/* --- ADMIN VIEW: DASHBOARD FAB & EXPANDED UI --- */}
            {userInfo?.isAdmin && (
                <>
                    {/* FLOATING FAB (When Minimized) */}
                    <AnimatePresence>
                        {!isExpanded && showAdminDashboard && (
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
                        {isExpanded && showAdminDashboard && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md md:p-4"
                            >
                                {/* Modal Container - Full screen mobile, centered card desktop */}
                                <div className="bg-slate-900 md:border border-slate-700 w-full h-full md:h-auto md:max-h-[85vh] md:max-w-2xl md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative text-left">

                                    {/* Close Button */}
                                    {/* Header */}
                                    <div className="p-4 md:p-6 pb-4 border-b border-slate-800 bg-slate-900 z-10 shrink-0 relative">
                                        <button
                                            onClick={() => setIsExpanded(false)}
                                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-50 border border-slate-700 md:border-transparent"
                                            title="Minimize Dashboard"
                                        >
                                            <FiX size={20} />
                                        </button>

                                        <div className="flex items-center gap-3 mb-2 pr-10">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-primary">
                                                <FiHeadphones size={20} />
                                            </div>
                                            <div>
                                                <h2 className="text-lg md:text-xl font-bold text-white leading-tight">
                                                    Support Dashboard
                                                </h2>
                                                <p className="text-slate-400 text-xs">
                                                    Manage call queues and active sessions
                                                </p>
                                            </div>
                                        </div>

                                        {/* Stats Row */}
                                        <div className="flex gap-4 mt-4 text-sm font-medium">
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${incomingCalls.length > 0 ? 'bg-red-500/10 text-red-500' : 'bg-slate-800 text-slate-500'}`}>
                                                <div className={`w-2 h-2 rounded-full ${incomingCalls.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
                                                <span>{incomingCalls.length} Waiting</span>
                                            </div>
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${allActiveCalls.length > 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                                                <div className={`w-2 h-2 rounded-full ${allActiveCalls.length > 0 ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
                                                <span>{allActiveCalls.length} Active</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-y-auto p-4 custom-scrollbar space-y-6">

                                        {/* SECTION 1: INCOMING CALLS */}
                                        {incomingCalls.length > 0 && (
                                            <div className="animate-in slide-in-from-bottom-5 duration-300">
                                                <div className="flex items-center justify-between mb-3 sticky top-0 bg-slate-900/95 backdrop-blur py-2 z-10 border-b border-slate-800/50">
                                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                        Incoming Queue
                                                    </h3>
                                                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">{incomingCalls.length}</span>
                                                </div>

                                                <div className="grid grid-cols-1 gap-3">
                                                    {incomingCalls.map((call) => (
                                                        <div key={call.callLogId} className="bg-slate-800/60 hover:bg-slate-800 transition-colors rounded-xl p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-red-500/10 hover:border-red-500/30 group">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-lg font-bold text-white shrink-0">
                                                                    {call.name.charAt(0)}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <h4 className="text-white font-bold truncate">{call.name}</h4>
                                                                        {call.isAdmin && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded border border-primary/20">ADMIN</span>}
                                                                    </div>
                                                                    <p className="text-xs text-slate-400 truncate">Wait time: <span className="text-slate-300 font-mono">00:00</span></p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 sm:self-center self-end w-full sm:w-auto">
                                                                <button
                                                                    onClick={() => rejectCall(call.callLogId)}
                                                                    className="flex-1 sm:flex-none py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors font-medium text-sm"
                                                                >
                                                                    Skip
                                                                </button>
                                                                <button
                                                                    onClick={() => answerCall(call)}
                                                                    disabled={isLineBusy}
                                                                    className={`flex-1 sm:flex-none py-2.5 px-6 rounded-lg font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all ${isLineBusy
                                                                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                                                        : 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20 active:scale-95'
                                                                        }`}
                                                                >
                                                                    <FiPhone className={isLineBusy ? "" : "animate-pulse"} /> Answer
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* SECTION 2: ACTIVE CALLS (Monitor) - Admin Only */}
                                        {allActiveCalls.length > 0 && (
                                            <div className="animate-in slide-in-from-bottom-5 duration-300 delay-100">
                                                <div className="flex items-center justify-between mb-3 sticky top-0 bg-slate-900/95 backdrop-blur py-2 z-10 border-b border-slate-800/50">
                                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                        Active Sessions
                                                    </h3>
                                                    <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">{allActiveCalls.length}</span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {allActiveCalls.map((call) => {
                                                        const isMySide = call.caller.id === userInfo._id || call.receiver.id === userInfo._id;
                                                        const peerId = call.caller.id === userInfo._id ? call.receiver.id : call.caller.id;

                                                        return (
                                                            <div key={call.callLogId} className={`bg-slate-800/40 rounded-xl p-4 border flex flex-col gap-3 ${isMySide ? 'border-primary/30 bg-primary/5' : 'border-slate-700'}`}>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                                                        <span className="font-bold text-white">{call.caller?.name}</span>
                                                                        <span className="text-slate-600">to</span>
                                                                        <span className="font-bold text-white">{call.receiver?.name}</span>
                                                                    </div>
                                                                    {isMySide && <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">You</span>}
                                                                </div>

                                                                <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-2">
                                                                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                                        {call.startTime ? <CallDuration startTime={call.startTime} /> : 'Connecting...'}
                                                                    </div>

                                                                    {isMySide && (
                                                                        <button
                                                                            onClick={() => leaveCall(peerId)}
                                                                            className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded transition-colors"
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
                                        {incomingCalls.length === 0 && allActiveCalls.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                                                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                                                    <FiHeadphones size={24} />
                                                </div>
                                                <p className="font-medium text-slate-500">All caught up!</p>
                                                <p className="text-sm">No active calls or waiting queue.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer / Status Bar */}
                                    <div className="p-3 bg-slate-900 border-t border-slate-800 text-center text-[10px] text-slate-500">
                                        System Status: <span className="text-green-500">Online</span> • {new Date().toLocaleTimeString()}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}

            {/* --- CUSTOMER VIEW: INCOMING CALL MODAL --- */}
            <AnimatePresence>
                {showCustomerIncoming && incomingCalls.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                    >
                        <div className="bg-slate-900 border border-slate-700 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center p-8 text-center relative">
                            {/* Pulse Effect */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse"></div>

                            {/* Avatar */}
                            <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center mb-6 relative">
                                <FiHeadphones size={40} className="text-primary" />
                                <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20"></div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-1">{incomingCalls[0].name}</h2>
                            <p className={`font-bold text-xs uppercase tracking-widest mb-8 ${incomingCalls[0].isAdmin ? 'text-primary' : 'text-slate-400'}`}>
                                Incoming {incomingCalls[0].isAdmin ? 'Administrator' : 'Customer'} Call
                            </p>

                            <div className="flex items-center gap-6 w-full justify-center">
                                {/* Reject Button */}
                                <button
                                    onClick={() => rejectCall(incomingCalls[0].callLogId)}
                                    className="flex flex-col items-center gap-2 group"
                                >
                                    <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-500 group-hover:bg-red-500 group-hover:text-white flex items-center justify-center transition-all shadow-lg border border-red-500/50">
                                        <FiPhoneOff size={24} />
                                    </div>
                                    <span className="text-xs text-slate-400 group-hover:text-white">Decline</span>
                                </button>

                                {/* Answer Button */}
                                <button
                                    onClick={() => answerCall(incomingCalls[0])}
                                    className="flex flex-col items-center gap-2 group"
                                >
                                    <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center transition-all shadow-lg shadow-green-500/40 animate-bounce-slow border-4 border-green-500/30">
                                        <FiPhone size={28} />
                                    </div>
                                    <span className="text-xs text-white font-bold">Answer</span>
                                </button>
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
                    className="fixed bottom-6 right-6 z-[10000] bg-slate-900 border border-slate-700 rounded-[2rem] shadow-2xl p-6 w-80 overflow-hidden cursor-grab active:cursor-grabbing text-left"
                >
                    {/* Audio Element */}
                    <audio ref={audioRef} className="hidden" autoPlay playsInline />

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 relative">
                            <FiUser className="text-slate-400" />
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm leading-tight text-left">
                                {callStatus === 'calling' ? 'Calling...' : (callData?.name || 'Unknown')}
                            </h3>
                            {callData && (
                                <span className={`text-[9px] font-bold uppercase tracking-wide block mb-0.5 text-left ${callData.isAdmin ? 'text-primary' : 'text-slate-500'}`}>
                                    {callData.isAdmin ? 'Administrator' : 'Customer'}
                                </span>
                            )}
                            <p className="text-xs text-slate-400 font-mono text-left">
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
