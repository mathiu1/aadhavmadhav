import React, { useEffect, useRef, useState } from 'react';
import { useCallContext } from '../context/CallContext';
import { FiPhone, FiPhoneOff, FiMic, FiMicOff, FiUser } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const CallOverlay = () => {
    const {
        callStatus,
        callData,
        answerCall,
        rejectCall,
        leaveCall,
        callDuration,
        remoteStream
    } = useCallContext();

    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef();

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

    if (callStatus === 'idle') return null;

    return (
        <AnimatePresence>
            {/* INCOMING CALL MODAL */}
            {callStatus === 'receiving' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md"
                >
                    <div className="bg-slate-900 border border-slate-700 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm text-center relative overflow-hidden">
                        {/* Background Pulse Animation */}
                        <div className="absolute inset-0 flex items-center justify-center -z-10">
                            <div className="w-64 h-64 bg-primary/20 rounded-full animate-ping opacity-75"></div>
                            <div className="absolute w-48 h-48 bg-primary/30 rounded-full animate-pulse"></div>
                        </div>

                        <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-slate-700 shadow-inner">
                            <FiUser className="text-4xl text-slate-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-1">{callData?.name || 'Unknown User'}</h2>
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${callData?.isAdmin ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}>
                            {callData?.isAdmin ? 'Administrator' : 'Customer'}
                        </span>
                        <p className="text-slate-400 font-medium mb-8 animate-pulse text-sm">Incoming Voice Call...</p>

                        <div className="flex justify-center gap-6">
                            <button
                                onClick={rejectCall}
                                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-transform hover:scale-110"
                            >
                                <FiPhoneOff size={24} />
                            </button>
                            <button
                                onClick={answerCall}
                                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30 transition-transform hover:scale-110 animate-bounce"
                            >
                                <FiPhone size={24} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ACTIVE / CALLING UI */}
            {(callStatus === 'calling' || callStatus === 'connected') && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    className="fixed bottom-6 right-6 z-[9999] bg-slate-900 border border-slate-700 rounded-[2rem] shadow-2xl p-6 w-80 overflow-hidden cursor-grab active:cursor-grabbing"
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

                    {/* Waveform Visualization (CSS Fake) */}
                    {callStatus === 'connected' && (
                        <div className="flex justify-center gap-1 h-8 mb-6 items-center">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="w-1 bg-primary rounded-full animate-wave" style={{ animationDelay: `${i * 0.1}s`, height: '40%' }}></div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-around items-center">
                        <button
                            onClick={() => setIsMuted(!isMuted)} // Logic needs to actually mute stream
                            className={`p-3 rounded-full ${isMuted ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'} transition-colors`}
                        >
                            {isMuted ? <FiMicOff /> : <FiMic />}
                        </button>
                        <button
                            onClick={leaveCall}
                            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-transform hover:scale-105"
                        >
                            <FiPhoneOff size={24} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CallOverlay;
