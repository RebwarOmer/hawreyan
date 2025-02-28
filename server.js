const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files from the "public" directory
app.use(express.static(__dirname + "/public"));

// Root route
app.get("/", (req, res) => {
    res.send("Backend is running!");
});

// WebSocket Logic
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit("user-connected", socket.id);

        socket.on("disconnect", () => {
            io.to(roomId).emit("user-disconnected", socket.id);
        });
    });

    socket.on("signal", ({ to, signal }) => {
        io.to(to).emit("signal", { from: socket.id, signal });
    });
});

// Use the PORT environment variable or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
});
