import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import notiSound from "/noti.mp3";

const socket = io("https://quickserve-5mhc.onrender.com", {
    transports: ["websocket"],
    withCredentials: true,
});

export default function NotificationClient() {
    const [notifications, setNotifications] = useState([]);
    const [tableNo, setTableNo] = useState("");
    const [message, setMessage] = useState("");
    const [soundEnabled, setSoundEnabled] = useState(false);

    const tableRef = useRef(null);
    const messageRef = useRef(null);
    const audioRef = useRef(null);
    const listRef = useRef(null);

    // Enable sound on user interaction to satisfy autoplay policies
    const enableSound = () => {
        if (audioRef.current) {
            audioRef.current
                .play()
                .then(() => {
                    setSoundEnabled(true);
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                })
                .catch(() => {
                    // User blocked autoplay
                });
        }
    };

    useEffect(() => {
        socket.on("connect", () => {
            console.log("✅ Connected:", socket.id);
        });

        socket.on("chat-history", (data) => {
            setNotifications(data);
        });

        socket.on("new-notification", (data) => {
            setNotifications((prev) => [data, ...prev]);

            if (audioRef.current && soundEnabled) {
                audioRef.current.play().catch(() => {
                    // Audio playback error, ignoring
                });
            }

            listRef.current?.scrollIntoView({ behavior: "smooth" });
        });

        return () => {
            socket.off("connect");
            socket.off("chat-history");
            socket.off("new-notification");
        };
    }, [soundEnabled]);

    const handleSend = () => {
        if (!tableNo.trim() || !message.trim()) {
            alert("❌ Table number and message are required.");
            return;
        }

        socket.emit("send-notification", { tableNo, message });

        setTableNo("");
        setMessage("");
        tableRef.current?.focus();
    };

    // Group notifications by table number
    const groupedByTable = notifications.reduce((acc, curr) => {
        if (!acc[curr.tableNo]) acc[curr.tableNo] = [];
        acc[curr.tableNo].push(curr);
        return acc;
    }, {});

    return (
        <div className="p-6 max-w-2xl mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
                🧾 Notification Panel
            </h1>

            {!soundEnabled && (
                <div className="mb-4 text-center">
                    <button
                        onClick={enableSound}
                        className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
                    >
                        🔊 Enable Notification Sound
                    </button>
                </div>
            )}

            <audio ref={audioRef} src={notiSound} preload="auto" className="hidden" />

            <form
                className="grid grid-cols-1 gap-3 mb-6 bg-white p-4 rounded-xl shadow"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                }}
            >
                <input
                    value={tableNo}
                    onChange={(e) => setTableNo(e.target.value)}
                    ref={tableRef}
                    placeholder="Table No"
                    className="border-2 border-slate-200 p-2 outline-0 rounded w-full focus:outline-none focus:border-slate-400"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            messageRef.current?.focus();
                        }
                    }}
                />
                <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    ref={messageRef}
                    placeholder="Message"
                    className="border-2 border-slate-200 p-2 outline-0 rounded w-full focus:outline-none focus:border-slate-400"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                >
                    ➤ Send Notification
                </button>
            </form>

            <div className="space-y-6" aria-live="polite" aria-atomic="true">
                {Object.entries(groupedByTable).map(([table, msgs]) => (
                    <section
                        key={table}
                        className="bg-white p-4 rounded-xl shadow"
                        aria-label={`Notifications for Table ${table}`}
                    >
                        <h2 className="text-lg font-semibold text-blue-600 mb-3">
                            🪑 Table {table}
                        </h2>
                        <ul className="space-y-2 text-gray-700">
                            {msgs.map((n, idx) => (
                                <li
                                    key={idx}
                                    className="border p-3 rounded bg-gray-100"
                                    role="listitem"
                                >
                                    <div>{n.message}</div>
                                    <small className="text-sm text-gray-500">
                                        {n.timestamp
                                            ? new Date(n.timestamp).toLocaleString()
                                            : "No timestamp"}
                                    </small>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
                <div ref={listRef} />
            </div>
        </div>
    );
}
