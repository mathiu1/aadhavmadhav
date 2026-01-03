import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSend as SendIcon, FiX as CloseIcon, FiMinimize2, FiMaximize2, FiMessageSquare, FiTrash2, FiPhone } from 'react-icons/fi';
import { getMessages, sendMessage, addMessage, markAsRead, deleteMessage, removeMessage } from '../slices/messageSlice';
import { useSocketContext } from '../context/SocketContext';
import { useCallContext } from '../context/CallContext';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const formatLastSeen = (date) => {
    if (!date) return 'Never';
    const lastSeen = new Date(date);
    const now = new Date();
    const diffInMs = now - lastSeen;
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return lastSeen.toLocaleDateString();
};

const ChatWindow = ({ conversationUserId, title, onClose, isWidget = false, isOpen = true, lastSeen }) => {
    const dispatch = useDispatch();
    const { messages, loading, hasMore } = useSelector((state) => state.messages);
    const { userInfo } = useSelector((state) => state.auth);
    const { socket, onlineUsers } = useSocketContext();
    const { initiateCall } = useCallContext();
    const [text, setText] = useState('');
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
    const [offset, setOffset] = useState(0);
    const [prevScrollHeight, setPrevScrollHeight] = useState(0);

    // Force "Online" status for Customers viewing Support (to keep Call button enabled always), 
    // otherwise check real status for Admins viewing Users.
    const isOnline = !userInfo.isAdmin ? true : onlineUsers.some(id => String(id) === String(conversationUserId));

    // Determine the relevant User ID for data fetching (Messages belong to the Customer)
    // If I am Admin, I fetch messages for the 'conversationUserId' (Customer)
    // If I am Customer, I fetch messages for MYSELF (userInfo._id)
    const dataUserId = userInfo.isAdmin ? conversationUserId : userInfo._id;

    // Fetch messages on mount
    useEffect(() => {
        if (dataUserId && isOpen) {
            setOffset(0);
            dispatch(getMessages({ userId: dataUserId, offset: 0 }));
            // Mark as read and reset local count
            dispatch(markAsRead(dataUserId));
        }
    }, [dispatch, dataUserId, isOpen]);

    // Restore scroll position when loading previous messages
    useLayoutEffect(() => {
        if (offset > 0 && chatContainerRef.current) {
            const newHeight = chatContainerRef.current.scrollHeight;
            const diff = newHeight - prevScrollHeight;
            if (diff > 0) {
                chatContainerRef.current.scrollTop = diff;
            }
        }
    }, [messages, offset, prevScrollHeight]);

    // Scroll to bottom on new message (only if seeing latest)
    useEffect(() => {
        if (offset === 0 && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isMinimized, offset]);

    // Handle Infinite Scroll
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight } = e.currentTarget;
        if (scrollTop === 0 && hasMore && !loading) {
            setPrevScrollHeight(scrollHeight);
            const newOffset = offset + 10;
            setOffset(newOffset);
            dispatch(getMessages({ userId: dataUserId, offset: newOffset }));
        }
    };

    // Listen for real-time messages and deletions
    useEffect(() => {
        if (socket) {
            socket.on("newMessage", (newMessage) => {
                const msgUserId = newMessage.user._id || newMessage.user;

                let isRelevant = false;

                if (userInfo.isAdmin) {
                    // Admin: Relevant if message belongs to the user I am viewing
                    isRelevant = msgUserId && conversationUserId && msgUserId.toString() === conversationUserId.toString();
                } else {
                    // Customer: Relevant if message belongs to ME (since all support messages are owned by the customer)
                    // We don't check conversationUserId (Admin ID) because the message 'user' field is always the Customer.
                    // Note: conversationUserId is still useful for Online Status check of the Agent.
                    isRelevant = msgUserId && userInfo._id && msgUserId.toString() === userInfo._id.toString();
                }

                if (isRelevant) {
                    dispatch(addMessage(newMessage));
                    if (isOpen) {
                        dispatch(markAsRead(dataUserId));
                    }
                }
            });

            socket.on("messageDeleted", (payload) => {
                const id = (typeof payload === 'object' && payload !== null) ? payload.id : payload;
                dispatch(removeMessage(id));
            });

            return () => {
                socket.off("newMessage");
                socket.off("messageDeleted");
            };
        }
    }, [socket, dispatch, conversationUserId]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        const msgData = {
            text,
            recipientId: userInfo.isAdmin ? conversationUserId : null
        };

        setOffset(0); // Jump to latest
        await dispatch(sendMessage(msgData));
        setText('');
    };

    const handleDelete = (messageId) => {
        setDeleteModal({ open: true, id: messageId });
    };

    const confirmDelete = () => {
        if (deleteModal.id) {
            dispatch(deleteMessage(deleteModal.id));
            setDeleteModal({ open: false, id: null });
        }
    };

    if (!isOpen && isWidget) return null;

    if (isMinimized && isWidget) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-4 right-4 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-secondary transition-all z-50 animate-bounce"
            >
                <FiMessageSquare size={24} />
            </button>
        )
    }

    return (
        <div className={`${isWidget ? 'fixed bottom-4 right-4 w-[calc(100vw-2rem)] md:w-96 h-[80vh] md:h-[600px] md:bottom-8 md:right-8 z-[100] rounded-2xl shadow-2xl' : 'w-full h-full min-h-[500px] flex-grow rounded-3xl border border-slate-100 relative'} bg-white flex flex-col overflow-hidden font-sans shadow-xl`}>

            {/* Delete Modal */}
            {deleteModal.open && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiTrash2 size={24} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-1">Delete Message?</h3>
                        <p className="text-xs text-slate-500 font-bold mb-6">Are you sure you want to delete this message?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModal({ open: false, id: null })}
                                className="flex-1 py-2.5 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-2.5 rounded-xl text-xs font-black text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all transform active:scale-95"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]' : 'bg-slate-500'} transition-all duration-300`}></div>
                        {isOnline && <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-400 animate-ping opacity-75"></div>}
                    </div>
                    <div>
                        <span className="font-black text-sm md:text-base block leading-none mb-1">{title}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {isOnline ? 'Online now' : (lastSeen ? `Last seen ${formatLastSeen(lastSeen)}` : 'Offline')}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 md:gap-3">
                        {conversationUserId && (
                            <button
                                onClick={() => initiateCall(conversationUserId)}
                                className="p-2 md:p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20"
                                title="Start Voice Call"
                            >
                                <FiPhone size={18} className="md:w-5 md:h-5" />
                            </button>
                        )}
                        {isWidget && (
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-2 md:p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-300"
                            >
                                <FiMinimize2 size={20} />
                            </button>
                        )}
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <CloseIcon size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 space-y-6 sleek-scrollbar"
                ref={chatContainerRef}
                onScroll={handleScroll}
            >
                {loading && messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-slate-400">
                        <AiOutlineLoading3Quarters className="animate-spin text-2xl" />
                    </div>
                ) : (
                    <>
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-70">
                                <div className="p-4 bg-slate-100 rounded-full mb-3">
                                    <FiMessageSquare size={32} />
                                </div>
                                <p className="font-bold text-sm">Welcome to Support!</p>
                                <p className="text-xs">Type a message to start chatting.</p>
                            </div>
                        )}
                        {loading && offset > 0 && (
                            <div className="flex justify-center p-2">
                                <AiOutlineLoading3Quarters className="animate-spin text-slate-400 text-sm" />
                            </div>
                        )}
                        {messages.map((msg, index) => {
                            const isMe = msg.sender._id === userInfo._id || msg.sender === userInfo._id;
                            const senderName = msg.sender.name;
                            const senderRole = msg.sender.isAdmin ? 'Administrator' : 'Customer';

                            return (
                                <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group/message`}>
                                    <div className={`flex items-center gap-2 mb-1 px-1`}>
                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{isMe ? 'You' : senderName}</span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-widest ${msg.sender.isAdmin ? 'bg-purple-100 text-purple-600' : 'bg-slate-200 text-slate-600'}`}>
                                            {senderRole}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 max-w-[85%]">
                                        {/* Delete Button (Left side for me) */}
                                        {isMe && (
                                            <button
                                                onClick={() => handleDelete(msg._id)}
                                                className="text-red-400 opacity-0 group-hover/message:opacity-100 focus:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-full"
                                                title="Delete message"
                                            >
                                                <FiTrash2 size={14} />
                                            </button>
                                        )}

                                        <div className={`rounded-[1.5rem] px-4 py-3 text-sm shadow-sm ${isMe
                                            ? 'bg-primary text-white rounded-tr-none'
                                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                            }`}>
                                            <p className="leading-relaxed font-bold whitespace-pre-wrap">{msg.text}</p>
                                            <span className={`text-[10px] block mt-1.5 font-bold ${isMe ? 'text-primary-100' : 'text-slate-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 h-12 text-sm font-bold text-slate-700 focus:outline-none focus:border-primary/30 transition-all"
                />
                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="bg-primary hover:bg-secondary text-white w-12 h-12 rounded-2xl flex flex-shrink-0 items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                >
                    <SendIcon size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
