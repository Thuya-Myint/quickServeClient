import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import notiSound from "/noti.mp3";

const socket = io("https://quickserve-t1f6.onrender.com", {
    transports: ["websocket"],
    withCredentials: true,
});

export default function NotificationClient() {
    const [notifications, setNotifications] = useState([]);
    const [tableNo, setTableNo] = useState("");
    const [message, setMessage] = useState("");
    const [filterTable, setFilterTable] = useState("");
    const [filterOrder, setFilterOrder] = useState("");
    const [soundEnabled, setSoundEnabled] = useState(false);

    const tableRef = useRef(null);
    const messageRef = useRef(null);
    const audioRef = useRef(null);
    const newestNotifRef = useRef(null);

    // Enable notification sound
    const enableSound = () => {
        if (audioRef.current) {
            audioRef.current
                .play()
                .then(() => {
                    setSoundEnabled(true);
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                })
                .catch(() => { });
        }
    };

    // Scroll smoothly to newest notification when added
    const prevCount = useRef(0);
    useEffect(() => {
        if (notifications.length > prevCount.current) {
            newestNotifRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        prevCount.current = notifications.length;
    }, [notifications]);

    // Socket listeners
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
                audioRef.current.play().catch(() => { });
            }
        });

        return () => {
            socket.off("connect");
            socket.off("chat-history");
            socket.off("new-notification");
        };
    }, [soundEnabled]);

    // Send notification
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

    // Group and filter notifications
    const groupedByTable = notifications.reduce((acc, curr) => {
        if (!acc[curr.tableNo]) acc[curr.tableNo] = [];
        acc[curr.tableNo].push(curr);
        return acc;
    }, {});

    const filteredGrouped = Object.entries(groupedByTable).reduce(
        (acc, [table, msgs]) => {
            if (
                filterTable.trim() &&
                table.toLowerCase() !== filterTable.trim().toLowerCase()
            )
                return acc;
            const filteredMsgs = msgs.filter((msg) =>
                msg.message.toLowerCase().includes(filterOrder.trim().toLowerCase())
            );
            if (filteredMsgs.length) acc[table] = filteredMsgs;
            return acc;
        },
        {}
    );

    return (
        <div
            className="h-full p-6 max-w-3xl mx-auto"
            style={{

                color: "white",
            }}
        >
            <h1 className="text-3xl font-extrabold mb-8 text-center drop-shadow-lg">
                🧾 Notification Panel
            </h1>

            {!soundEnabled && (
                <div className="mb-6 text-center">
                    <button
                        onClick={enableSound}
                        className="bg-green-500 hover:bg-green-600 transition rounded-lg px-6 py-3 font-semibold shadow-lg"
                        aria-label="Enable Notification Sound"
                    >
                        🔊 Enable Notification Sound
                    </button>
                </div>
            )}

            <audio ref={audioRef} src={notiSound} preload="auto" className="hidden" />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                }}
                className="mb-8 bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg grid grid-cols-1 gap-4"
            >
                <input
                    type="text"
                    value={tableNo}
                    onChange={(e) => setTableNo(e.target.value)}
                    ref={tableRef}
                    placeholder="Table No"
                    className="rounded-lg p-3 outline-none border border-white/50 bg-white/20 placeholder-white placeholder-opacity-80 text-white focus:border-white focus:bg-white/30 transition"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            messageRef.current?.focus();
                        }
                    }}
                    aria-label="Table Number"
                    autoComplete="off"
                />
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    ref={messageRef}
                    placeholder="Message"
                    className="rounded-lg p-3 outline-none border border-white/50 bg-white/20 placeholder-white placeholder-opacity-80 text-white focus:border-white focus:bg-white/30 transition"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    aria-label="Message"
                    autoComplete="off"
                />
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 transition rounded-lg py-3 font-semibold shadow-lg"
                    aria-label="Send Notification"
                >
                    ➤ Send Notification
                </button>
            </form>

            {/* Filters */}
            <div className="mb-10 flex flex-wrap gap-4 items-center">
                <input
                    type="text"
                    value={filterTable}
                    onChange={(e) => setFilterTable(e.target.value)}
                    placeholder="Filter by Table No"
                    className="flex-1 min-w-[120px] rounded-lg p-3 outline-none border border-white/50 bg-white/20 placeholder-white placeholder-opacity-80 text-white focus:border-white focus:bg-white/30 transition"
                    aria-label="Filter by Table Number"
                />
                <input
                    type="text"
                    value={filterOrder}
                    onChange={(e) => setFilterOrder(e.target.value)}
                    placeholder="Filter by Order"
                    className="flex-1 min-w-[120px] rounded-lg p-3 outline-none border border-white/50 bg-white/20 placeholder-white placeholder-opacity-80 text-white focus:border-white focus:bg-white/30 transition"
                    aria-label="Filter by Order"
                />
                <button
                    className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition shadow-lg cursor-not-allowed"
                    onClick={(e) => e.preventDefault()}
                    disabled
                    title="Filtering applied on input change"
                    aria-disabled="true"
                >
                    Find
                </button>
                <button
                    onClick={() => {
                        setFilterTable("");
                        setFilterOrder("");
                    }}
                    className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition shadow-lg"
                    aria-label="Clear filters"
                >
                    Clear
                </button>
            </div>

            {/* Notifications */}
            <div aria-live="polite" aria-atomic="true" className="space-y-8">
                {Object.entries(filteredGrouped).length === 0 ? (
                    <p className="text-center text-white/80 text-lg">No notifications found.</p>
                ) : (
                    Object.entries(filteredGrouped).map(([table, msgs], idx) => (
                        <section
                            key={table}
                            ref={idx === 0 ? newestNotifRef : null}
                            className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6"
                            aria-label={`Notifications for Table ${table}`}
                        >
                            <h2 className="text-xl font-semibold mb-5 text-white drop-shadow-md">
                                🪑 Table {table}
                            </h2>
                            <ul className="space-y-4 text-white">
                                <AnimatePresence initial={false}>
                                    {msgs.map((n, idx) => (
                                        <motion.li
                                            key={n._id || idx}
                                            role="listitem"
                                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                            transition={{ duration: 0.35, ease: "easeOut" }}
                                            className="border border-white/30 rounded-lg p-4 bg-gradient-to-r from-purple-600 to-pink-600 shadow-md"
                                        >
                                            <div className="font-medium">{n.message}</div>
                                            <small className="text-sm text-white/80">
                                                {n.timestamp
                                                    ? new Date(n.timestamp).toLocaleString()
                                                    : "No timestamp"}
                                            </small>
                                        </motion.li>
                                    ))}
                                </AnimatePresence>
                            </ul>
                        </section>
                    ))
                )}
            </div>
        </div>
    );
}
