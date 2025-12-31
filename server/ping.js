import axios from "axios";

const URL = "https://aadhavmadhav.netlify.app/api";

setInterval(async () => {
    try {
        const res = await axios.get(URL);
        console.log("Ping success:", res.status);
    } catch (err) {
        console.error("Ping failed:", err.message);
    }
}, 5 * 60 * 1000); 