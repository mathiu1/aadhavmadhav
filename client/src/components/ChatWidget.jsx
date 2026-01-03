import { useSelector, useDispatch } from 'react-redux';
import { RiCustomerService2Fill } from 'react-icons/ri';
import ChatWindow from './ChatWindow';
import { toggleChat } from '../slices/messageSlice';
import { useEffect, useState } from 'react';
import api from '../api/axios';

const ChatWidget = () => {
    const dispatch = useDispatch();
    const { userInfo } = useSelector((state) => state.auth);
    const { isChatOpen, unreadCount } = useSelector((state) => state.messages);
    const [supportAgentId, setSupportAgentId] = useState(null);

    useEffect(() => {
        const fetchSupportAgent = async () => {
            try {
                const { data } = await api.get('/users/support-agent');
                setSupportAgentId(data._id);
            } catch (error) {
                console.error("No support agent found", error);
            }
        };

        if (userInfo && !userInfo.isAdmin && isChatOpen) {
            fetchSupportAgent();
        }
    }, [userInfo, isChatOpen]);

    if (!userInfo) return null;

    if (userInfo.isAdmin) return null;

    return (
        <>
            {!isChatOpen && (
                <button
                    onClick={() => dispatch(toggleChat(true))}
                    className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-tr from-primary via-purple-600 to-indigo-600 text-white rounded-full shadow-[0_10px_40px_rgba(124,58,237,0.5)] border-2 border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_20px_60px_rgba(124,58,237,0.7)] active:scale-95 z-50 group backdrop-blur-sm"
                >
                    <RiCustomerService2Fill className="w-6 h-6 md:w-8 md:h-8 transition-transform duration-300 group-hover:rotate-12" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 md:top-0 md:right-0 bg-red-500 text-white text-[10px] md:text-xs font-bold rounded-full h-5 w-5 md:h-6 md:w-6 flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </button>
            )}

            <ChatWindow
                conversationUserId={supportAgentId || userInfo._id} // Fallback to self (echo) if no admin found, but ideally should disable call
                title="Customer Support"
                isOpen={isChatOpen}
                onClose={() => dispatch(toggleChat(false))}
                isWidget={true}
            />
        </>
    );
};

export default ChatWidget;
