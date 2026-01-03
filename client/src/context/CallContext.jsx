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
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callDuration, setCallDuration] = useState(0);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();
    const timerRef = useRef();

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
            connectionRef.current.signal(signal);
            startTimer();
        });

        socket.on('callRejected', () => {
            toast.error("Call rejected/busy");
            leaveCall();
        });

        socket.on('callEnded', () => {
            toast("Call ended");
            leaveCall();
        });

        return () => {
            socket.off('callUser');
            socket.off('callAccepted');
            socket.off('callRejected');
            socket.off('callEnded');
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

    const initiateCall = (idToCall) => {
        setCallStatus('calling');
        // Set callData for the caller so they know who to disconnect from
        setCallData({ from: idToCall, name: 'Calling...' });

        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                // myVideo.current.srcObject = currentStream; // If video enabled

                const peer = new SimplePeer({
                    initiator: true,
                    trickle: false,
                    stream: currentStream
                });

                peer.on('signal', (data) => {
                    socket.emit('callUser', {
                        userToCall: idToCall,
                        signalData: data,
                        from: userInfo._id,
                        name: userInfo.name,
                        isAdmin: userInfo.isAdmin // Pass role to receiver
                    });
                });

                peer.on('stream', (currentRemoteStream) => {
                    setRemoteStream(currentRemoteStream);
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

    const answerCall = () => {
        setCallStatus('connected');
        startTimer();

        // Ensure we are not sending 'answerCall' to ourselves if the bug persists,
        // but typically 'callData.from' is the Caller's ID.
        // If I called myself, callData.from is ME.
        // So I answer myself. Loop.

        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            .then((currentStream) => {
                setStream(currentStream);

                const peer = new SimplePeer({
                    initiator: false,
                    trickle: false,
                    stream: currentStream
                });

                peer.on('signal', (data) => {
                    socket.emit('answerCall', {
                        signal: data,
                        to: callData.from,
                        callLogId: callData.callLogId
                    });
                });

                peer.on('stream', (currentRemoteStream) => {
                    setRemoteStream(currentRemoteStream);
                });

                peer.signal(callData.signal);
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

    const rejectCall = () => {
        if (callData?.from) {
            socket.emit('rejectCall', { to: callData.from });
        }
        leaveCall();
    };

    const leaveCall = () => {
        setCallStatus('ending');
        setTimeout(() => setCallStatus('idle'), 1000); // Small delay for UI animation

        if (connectionRef.current) {
            // connectionRef.current.destroy(); // sometimes throws if not connected
        }

        // Clean up connection
        // Added 'calling' check to allow caller to cancel before pickup
        if (callData?.from && (callStatus === 'connected' || callStatus === 'calling')) {
            socket.emit('endCall', { to: callData.from });
        }

        // Stop local stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }

        setRemoteStream(null);
        setCallData(null);
        stopTimer();
    };


    return (
        <CallContext.Provider value={{
            callStatus,
            callData,
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
