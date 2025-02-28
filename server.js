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

// Serve the index.html file for the root route
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

// WebSocket Logic
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit("user-connected", socket.id);

        socket.on("disconnect", () => {
            io.to(roomId).emit("user-disconnected", socket.id);
            console.log("A user disconnected:", socket.id);
        });
    });

    socket.on("signal", ({ to, signal }) => {
        io.to(to).emit("signal", { from: socket.id, signal });
    });
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
