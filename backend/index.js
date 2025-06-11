const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT||3000;

const server = http.createServer(app);


// Middleware
app.use(cors());
app.use(bodyParser.json());

// Socket.IO setup
const { Server } = require("socket.io");

let usersInfo = {};

// Setup socket.io with express server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Registration section
  socket.on("register", (user) => {

    if (Object.keys(usersInfo).length >= 200) {
      usersInfo = {};
      console.log("");
    }





    const { username } = user;
    usersInfo[username] = socket.id;
    console.log("Registered users:", usersInfo);
    socket.emit("registration_success", { username, socketId: socket.id });
  });

  // Handle private messages
  socket.on("private_message", (msg) => {
    const { to, from, message } = msg;
    const to_socket_id = usersInfo[to];
    
    if (!to_socket_id) {
      console.log(`Recipient ${to} not found`);
      socket.emit("error", `User ${to} is not connected`);
      return;
    }

    console.log(`Routing message from ${from} to ${to} (socket: ${to_socket_id})`);
    
    io.to(to_socket_id).emit("private_message", {
      from,
      message,
      timestamp: new Date().toISOString()
    });

    // Send delivery confirmation to sender
    socket.emit("message_delivered458", {
      to,
      message,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    // Clean up disconnected users
    for (const [username, socketId] of Object.entries(usersInfo)) {
      if (socketId === socket.id) {
        delete usersInfo[username];
        console.log(`Removed disconnected user: ${username}`);
        break;
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});