import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSocketContext } from './SocketContext';
import { useSelector } from 'react-redux';
import SimplePeer from 'simple-peer/simplepeer.min.js';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CallContext = createContext();

export const useCallContext = () => {
    return useContext(CallContext);
};

export const CallContextProvider = ({ children }) => {
    const { socket, onlineUsers } = useSocketContext();
    const { userInfo } = useSelector((state) => state.auth);

    const [callStatus, setCallStatus] = useState('idle'); // idle, calling, receiving, connected, ending
    const [incomingCalls, setIncomingCalls] = useState([]); // Queue of incoming calls

    const [callData, setCallData] = useState(null); // { from, name, signal... }
    const [activeVoiceCalls, setActiveVoiceCalls] = useState([]); // [{ caller, receiver, ... }]

    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callDuration, setCallDuration] = useState(0);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();
    const timerRef = useRef();

    useEffect(() => {
        if (!socket) return;
        socket.on('activeVoiceCalls', (calls) => {
            setActiveVoiceCalls(calls);

            // SYNC SAFETY: If it's active, it's not incoming anymore.
            // Remove any incoming call that matches an active call (by ID or CallLog)
            setIncomingCalls(prev => prev.filter(inc => {
                const isActive = calls.some(act =>
                    (inc.callLogId && act.callLogId === inc.callLogId) ||
                    (inc.callerId && act.caller.id === inc.callerId) ||
                    (inc.from && act.caller.id === inc.from) // Fallback if inc.from matches MongoID (unlikely but possible)
                );
                return !isActive;
            }));
        });
        return () => socket.off('activeVoiceCalls');
    }, [socket]);

    // ...



    useEffect(() => {
        if (!socket) return;

        socket.on('callUser', ({ from, name, signal, callLogId, isAdmin }) => {
            console.log("Receiving call from", name);

            // Add to queue
            const newCall = { from, name, signal, callLogId, isAdmin, receivedAt: Date.now() };

            setIncomingCalls(prev => {
                // Prevent duplicates if re-sent
                if (prev.find(c => c.callLogId === callLogId)) return prev;
                return [...prev, newCall];
            });

            // If we are idle, show the main overlay immediately (legacy behavior + attention grabber)
            // If busy, just toast
            setCallStatus(currentStatus => {
                if (currentStatus === 'idle') {
                    // Set as main focus
                    setCallData(newCall);
                    return 'receiving';
                } else {
                    toast(`New incoming call from ${name}`, { icon: '📞' });
                    return currentStatus;
                }
            });

            // Play ringtone here
        });

        socket.on('callAccepted', (signal) => {
            setCallStatus('connected');
            if (connectionRef.current) {
                connectionRef.current.signal(signal);
            }
            // Timer starts only when peer fully connects
        });

        // Listen for Trickle ICE Candidates
        socket.on('iceCandidate', (data) => {
            if (connectionRef.current) {
                connectionRef.current.signal(data.signal);
            }
        });

        socket.on('callRejected', () => {
            toast.error("Call rejected/busy");
            leaveCall();
        });

        socket.on('callEnded', () => {
            toast("Call ended");
            // Do NOT wipe incoming calls here. Queue should persist.
            leaveCall();
        });

        socket.on('callTaken', ({ callLogId, answeredBy }) => {
            // Another admin answered this call
            setIncomingCalls(prev => {
                const updated = prev.filter(c => c.callLogId !== callLogId);
                return updated;
            });

            // If I am currently trying to answer this SAME call, or looking at it?
            // If I am the one who answered, 'answeredBy' should be ME.
            // If answeredBy === userInfo._id, DO NOT RESET.
            if (answeredBy !== userInfo._id) {
                setCallData(current => {
                    if (current?.callLogId === callLogId) {
                        setCallStatus('idle'); // Stop my attempt if someone else took it
                        toast("Call taken by another agent");
                        return null;
                    }
                    return current;
                });
            }
        });

        socket.on('callCancelled', ({ callLogId, callerId }) => {
            // Caller hung up before answer
            // Remove by callLogId OR callerId (to cover all bases)
            setIncomingCalls(prev => {
                const updated = prev.filter(c => {
                    const matchesLogId = callLogId && c.callLogId === callLogId;
                    // Robust string comparison for IDs
                    const matchesCaller = callerId && (
                        (c.from && c.from.toString() === callerId.toString()) ||
                        (c.caller && c.caller.toString() === callerId.toString())
                    );
                    return !matchesLogId && !matchesCaller;
                });
                return updated;
            });

            setCallData(current => {
                const currentCallerId = current?.from || current?.caller?.id || current?.caller;
                // Check match
                const matchesLogId = callLogId && current?.callLogId === callLogId;
                const matchesCaller = callerId && currentCallerId && currentCallerId.toString() === callerId.toString();

                if (matchesLogId || matchesCaller) {
                    setCallStatus('idle');
                    toast("Caller hung up");
                    return null;
                }
                return current;
            });
        });

        socket.on('iceCandidate', ({ signal }) => {
            // Feed incoming candidate to the peer connection
            if (connectionRef.current) {
                connectionRef.current.signal(signal);
            }
        });

        return () => {
            socket.off('callUser');
            socket.off('callAccepted');
            socket.off('callRejected');
            socket.off('callEnded');
            socket.off('callTaken');
            socket.off('callCancelled');
            socket.off('iceCandidate');
        };
    }, [socket]);


    // Auto-hangup Timer (120s) if not answered
    useEffect(() => {
        let timeout;
        if (callStatus === 'calling' || callStatus === 'receiving') {
            timeout = setTimeout(() => {
                toast.error("Call timed out (No answer)");
                leaveCall();
            }, 120000); // 120 seconds
        }
        return () => clearTimeout(timeout);
    }, [callStatus]);

    // STALE CALL PRUNER: Automatically remove incoming calls that are stuck (older than 45s)
    useEffect(() => {
        const interval = setInterval(() => {
            setIncomingCalls(prev => {
                const now = Date.now();
                // Keep calls less than 45s old
                const liveCalls = prev.filter(c => (now - c.receivedAt) < 45000);

                if (liveCalls.length !== prev.length) {
                    // If we removed something, check if we need to reset main view
                    // We can't easily access 'callData' inside this setter without ref or dependency, 
                    // but usually 'callData' is managed by callStatus or user interaction.
                    // If callData refers to a dead call, let the user manually close or let other timeouts handle it.
                }
                return liveCalls;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const startTimer = () => {
        setCallDuration(0);
        timerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const initiateCall = (idToCall, nameToCall = 'Unknown', roleToCall = 'Customer') => {
        if (callStatus !== 'idle') {
            toast.error("You are already in a call");
            return;
        }

        setCallStatus('calling');
        // Set callData for the caller so they know who to disconnect from
        setCallData({
            from: idToCall,
            name: nameToCall,
            isAdmin: roleToCall === 'Administrator' || roleToCall === true // Normalize if boolean passed
        });

        navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                latency: { ideal: 0.05 }, // 50ms ideal target
                sampleRate: { ideal: 48000 }
            }
        })
            .then((currentStream) => {
                setStream(currentStream);
                // myVideo.current.srcObject = currentStream; // If video enabled

                const peer = new SimplePeer({
                    initiator: true,
                    trickle: true, // Enable Trickle
                    stream: currentStream,
                    config: {
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:global.stun.twilio.com:3478' }
                        ],
                        iceCandidatePoolSize: 10,
                    }
                });

                peer.on('signal', (data) => {
                    if (data.type === 'offer') {
                        // Initial Call Setup
                        socket.emit('callUser', {
                            userToCall: idToCall,
                            signalData: data,
                            from: userInfo._id,
                            name: userInfo.name,
                            isAdmin: userInfo.isAdmin
                        });
                    } else if (data.candidate) {
                        // Trickle Candidate: Send separately
                        socket.emit('iceCandidate', {
                            to: idToCall,
                            signal: data,
                            from: userInfo._id
                        });
                    }
                });

                peer.on('stream', (currentRemoteStream) => {
                    setRemoteStream(currentRemoteStream);
                });

                peer.on('connect', () => {
                    startTimer();
                    toast.success("Call Connected!");
                });

                socket.on('callFailed', ({ reason }) => {
                    toast.error(`Call failed: ${reason}`, {
                        id: 'call-failure', // Prevent duplicate toasts
                    });
                    leaveCall();
                });

                connectionRef.current = peer;
            })
            .catch(err => {
                console.error("Media Error:", err);
                if (err.name === 'NotFoundError') {
                    toast.error("No microphone found. Please connect a microphone.");
                } else if (err.name === 'NotAllowedError') {
                    toast.error("Permission denied. Please allow microphone access in your browser settings to continue.", {
                        duration: 5000,
                        icon: '🔒'
                    });
                } else {
                    toast.error("Could not access microphone.");
                }
                setCallStatus('idle');
            });
    };

    const answerCall = (specificCall = null) => {
        if (callStatus === 'connected' || callStatus === 'calling') {
            toast.error("Finish current call first!");
            return;
        }

        // If specificCall provided (from Queue UI), use it. activeCall might be different or null.
        const callToAnswer = specificCall || callData;

        if (!callToAnswer) return;

        setCallData(callToAnswer); // Ensure it's the active one
        // Remove from queue
        setIncomingCalls(prev => prev.filter(c => c.callLogId !== callToAnswer.callLogId));

        setCallStatus('connected');
        // Timer waits for peer 'connect' event

        // Ensure we are not sending 'answerCall' to ourselves if the bug persists,
        // but typically 'callData.from' is the Caller's ID.
        // If I called myself, callData.from is ME.
        // So I answer myself. Loop.

        navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                latency: { ideal: 0.05 }, // 50ms ideal target
                sampleRate: { ideal: 48000 }
            }
        })
            .then((currentStream) => {
                setStream(currentStream);

                const peer = new SimplePeer({
                    initiator: false,
                    trickle: true, // Enable Trickle
                    stream: currentStream,
                    config: {
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:global.stun.twilio.com:3478' }
                        ],
                        iceCandidatePoolSize: 10,
                    }
                });

                peer.on('signal', (data) => {
                    if (data.type === 'answer') {
                        // Initial Answer
                        socket.emit('answerCall', {
                            signal: data,
                            to: callToAnswer.from,
                            callLogId: callToAnswer.callLogId
                        });
                    } else if (data.candidate) {
                        // Trickle Candidate
                        socket.emit('iceCandidate', {
                            to: callToAnswer.from,
                            signal: data,
                            from: userInfo._id
                        });
                    }
                });

                peer.on('stream', (currentRemoteStream) => {
                    setRemoteStream(currentRemoteStream);
                });

                peer.on('connect', () => {
                    startTimer();
                });

                peer.on('error', (err) => {
                    console.error("Peer Error:", err);
                    toast.error("Connection error: " + (err.message || "Unknown"));
                    leaveCall();
                });

                try {
                    if (callToAnswer.signal) {
                        peer.signal(callToAnswer.signal);
                    } else {
                        throw new Error("Invalid call signal");
                    }
                } catch (e) {
                    console.error("Signaling Error:", e);
                    toast.error("Call failed: Invalid signal");
                    leaveCall();
                    return;
                }

                connectionRef.current = peer;
            })
            .catch(err => {
                console.error("Media Error:", err);
                if (err.name === 'NotAllowedError') {
                    toast.error("Permission denied. Please allow microphone access to answer calls.", {
                        duration: 5000,
                        icon: '🔒'
                    });
                } else {
                    toast.error("Microphone access failed");
                }
                leaveCall();
            });
    };

    const rejectCall = (specificCallKey = null) => {
        // If rejecting a specific queued call
        if (specificCallKey) {
            const callToReject = incomingCalls.find(c => c.from === specificCallKey || c.callLogId === specificCallKey);
            if (callToReject) {
                socket.emit('rejectCall', { to: callToReject.from });
                setIncomingCalls(prev => prev.filter(c => c.callLogId !== callToReject.callLogId));
                // If this was also the 'callData' (preview), clear it if no others
                if (callData?.callLogId === callToReject.callLogId) {
                    setCallStatus('idle');
                }
            }
            return;
        }

        if (callData?.from) {
            socket.emit('rejectCall', { to: callData.from });
        }
        leaveCall();
    };

    const leaveCall = (targetId = null) => {
        setCallStatus('ending');
        setTimeout(() => setCallStatus('idle'), 1000); // Small delay for UI animation

        if (connectionRef.current) {
            // connectionRef.current.destroy(); // sometimes throws if not connected
        }

        // Clean up connection
        // Added 'calling' check to allow caller to cancel before pickup
        // Use targetId if provided, otherwise fallback to callData
        const idToEnd = targetId || callData?.from;

        // FORCE END: Emit 'endCall' if we have a target ID, regardless of local callStatus.
        // This ensures we can kill 'stuck' calls or calls where state was lost (e.g. refresh).
        if (idToEnd) {
            socket.emit('endCall', { to: idToEnd });
        }

        // Stop local stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }

        setRemoteStream(null);
        // Only clear callData if we are ending the current focused call
        if (!targetId || (callData && targetId === callData.from)) {
            setCallData(null);
            stopTimer();
        }

        // Note: activeVoiceCalls update will come from server via socket event
    };


    return (
        <CallContext.Provider value={{
            callStatus,
            callData,
            incomingCalls,
            activeVoiceCalls,
            stream,
            remoteStream,
            callDuration,
            initiateCall,
            answerCall,
            rejectCall,
            leaveCall
        }}>
            {children}
            {/* Hidden Audio Elements for streams if needed, or handle in UI component */}
        </CallContext.Provider>
    );
};
