const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const cryptoJS = require("crypto-js");
require("dotenv").config();
const port = process.env.PORT || 3000;

const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Socket.IO setup
const { Server } = require("socket.io");

let usersInfo = {};

//gets the data after stringifying the json.
const dataEncryptor = (data) => {
  const encrypted = cryptoJS.AES.encrypt(
    data,
    process.env.MSG_SECRET
  ).toString();
  return encrypted;
};
// returns the data after parsing to the json
const dataDecryptor = (data) => {
  const bytes = cryptoJS.AES.decrypt(data, process.env.MSG_SECRET);
  const decryptedString = bytes.toString(cryptoJS.enc.Utf8);
  const decryptedData = JSON.parse(decryptedString);
  return decryptedData;
};

// Setup socket.io with express server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  //console.log(`User connected: ${socket.id}`);

  // Registration section
  socket.on("register", (user) => {
    if (Object.keys(usersInfo).length >= 200) {
      usersInfo = {};
      //console.log("");
    }

    const { username } = user;
    usersInfo[username] = socket.id;
    //console.log("Registered users:", usersInfo);
    socket.emit("registration_success", { username, socketId: socket.id });
  });

  // Handle private messages
  socket.on("private_message", (msg_encrypted) => {
    const msg = dataDecryptor(msg_encrypted);

    const { to, from, message } = msg;
    const to_socket_id = usersInfo[to];

    if (!to_socket_id) {
      //console.log(`Recipient ${to} not found`);
      //io.to(usersInfo[from]).emit("error", `User ${to} is not connected`);
      const acknowledgement_data = JSON.stringify({
        success: false,
        msg: "user not found",
        timestamp: new Date().toISOString(),
      });
      const encrypted_acknowledgement_data =
        dataEncryptor(acknowledgement_data);
      io.to(usersInfo[from]).emit(
        "message_delivery_confirmation",
        encrypted_acknowledgement_data
      );
      return;
    }

    // console.log(
    //   `Routing message from ${from} to ${to} (socket: ${to_socket_id})`
    // );

    const msg_to_deliver_parsed = JSON.stringify({
      from,
      message,
      timestamp: new Date().toISOString(),
    });
    const encrypted_msg = dataEncryptor(msg_to_deliver_parsed);

    io.to(to_socket_id).emit("private_message", encrypted_msg);

    // Send delivery confirmation to sender
    const acknowledgement_data = JSON.stringify({
      success: true,
      msg: "msg delivered successfully",
      timestamp: new Date().toISOString(),
    });
    const encrypted_acknowledgement_data = dataEncryptor(acknowledgement_data);
    io.to(usersInfo[from]).emit(
      "message_delivery_confirmation",
      encrypted_acknowledgement_data
    );
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    //console.log(`User disconnected: ${socket.id}`);
    // Clean up disconnected users
    for (const [username, socketId] of Object.entries(usersInfo)) {
      if (socketId === socket.id) {
        delete usersInfo[username];
        //console.log(`Removed disconnected user: ${username}`);
        break;
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
