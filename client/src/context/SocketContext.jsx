import { createContext, useContext, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import io from "socket.io-client";
import { logout } from "../slices/authSlice";
import toast from "react-hot-toast";

const SocketContext = createContext();

export const useSocketContext = () => {
    return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { userInfo } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    //"https://aadhavmadhav.onrender.com"
    useEffect(() => {
        if (userInfo) {
            const socket = io("https://aadhavmadhav.onrender.com", {
                query: {
                    userId: userInfo._id,
                },
            });

            setSocket(socket);

            socket.on("getOnlineUsers", (users) => {
                setOnlineUsers(users);
            });

            // Listen for Force Logout Event
            socket.on("forceLogout", ({ userId }) => {
                if (userInfo._id === userId) {
                    toast.error("You have been logged out because this account signed in on a new device.");
                    dispatch(logout());
                    // socket.close() will happen in cleanup or effect re-run
                }
            });

            return () => socket.close();
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [userInfo]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
