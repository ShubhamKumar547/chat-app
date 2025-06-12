import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "./Socket.css";

const SocketComponent = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [userInfo, setUserInfo] = useState({ username: "", socket_id: "" });
  const [recipient, setRecipient] = useState("");
  const [isConnected, setIsConnected] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_BACKEND_URL, {
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: false,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      setIsConnected(1);
      setConnectionStatus("Connected");
      setUserInfo((prev) => ({ ...prev, socket_id: socket.id }));
      console.log("Connected to server with ID:", socket.id);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setConnectionStatus("Disconnected");
    });

    socket.on("private_message", (data) => {
      console.log("Received message:", data);
      setMessages((prev) => [...prev, { ...data, type: "received" }]);
    });

    socket.on("message_delivered458", (data) => {
      console.log("Message delivered to recipient:", data);
    });

    socket.on("registration_success", (data) => {
      console.log("Registration successful:", data);
      setUserInfo((prev) => ({ ...prev, socket_id: data.socketId }));
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
      alert(`Error: ${error}`);
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight; // Auto-scroll to bottom
    }
  }, [messages]);

  const sendPrivateMessage = async () => {
    if (isConnected == 0) {
      alert("Not connected to server");
      return;
    }
    if (isConnected == 1) {
      alert("Please register first");
      return;
    }
    if (!recipient.trim()) {
      alert("Please specify a recipient");
      return;
    }
    if (!inputMessage.trim()) {
      alert("Please enter a message");
      return;
    }

    socketRef.current.emit("private_message", {
      to: recipient.trim(),
      from: userInfo.username,
      message: inputMessage,
    });
    let delivered = 0;
    socket.on("message_delivered458", async (data) => {
      const { to, message } = await data;
      if (
        JSON.stringify({ to, message }) ===
        JSON.stringify({ to: recipient.trim(), message: inputMessage })
      ) {
        delivered = 1;
      } else {
        delivered = 0;
      }
      console.log("Message delivered to recipient:", data);
    });
    if (delivered) {
      setMessages((prev) => [
        ...prev,
        {
          from: userInfo.username,
          message: inputMessage,
          type: "pending",
          timestamp: new Date().toISOString(),
        },
      ]);
      setInputMessage("");
    } else {
      alert("message not sent");
    }
  };

  const registerUser = () => {
    if (isConnected == 0) {
      alert("Not connected to the server.");
      return;
    }
    if (!userInfo.username.trim()) {
      alert("Please enter your username");
      return;
    }

    socketRef.current.emit("register", {
      username: userInfo.username.trim(),
      socket_id: socketRef.current.id,
    });
    setIsConnected(2);
    alert("User registered successfully");
  };

  return (
    <div className="chat-container">
      <h2>Socket.IO Chat</h2>

      <div className="connection-info">
        <div>
          Connection Status:{" "}
          <span
            className={`status-${isConnected ? "connected" : "disconnected"}`}
          >
            {connectionStatus}
          </span>
        </div>
        <div>
          Socket ID:{" "}
          <span className="socket-id">
            {userInfo.socket_id || "Not connected"}
          </span>
        </div>
      </div>

      <div className="chat-layout">
        <div className="control-panel">
          <div className="input-group">
            <label>
              Your Username:
              <br></br>
              <input
                type="text"
                value={userInfo.username}
                onChange={(e) =>
                  setUserInfo((prev) => ({ ...prev, username: e.target.value }))
                }
              />
            </label>
          </div>

          <div className="input-group">
            <label>
              Recipient Username:
              <br></br>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </label>
          </div>

          <button className="register-btn" onClick={registerUser}>
            Register User
          </button>

          <div className="message-input">
            <label>
              <input
                placeholder="Enter your message here"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendPrivateMessage()}
              />
            </label>
            <button className="send-btn" onClick={sendPrivateMessage}>
              Send
            </button>
          </div>
        </div>

        <div className="message-panel" ref={scrollRef}>
          <h3>Messages</h3>
          {messages.length === 0 ? (
            <p className="no-messages">No messages yet</p>
          ) : (
            <div className="messages-list">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`message ${msg.type} ${
                    msg.type === "pending" ? "pending" : ""
                  }`}
                >
                  <div className="message-header">
                    <p>~ {msg.from}</p>
                  </div>
                  <div className="message-content">{msg.message}</div>
                  <div className="message-timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="creator">Made by "The desV"-IIT-BHU</div>
    </div>
  );
};

export default SocketComponent;
