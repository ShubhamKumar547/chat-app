import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "./Socket.css";
import cryptoJS from "crypto-js";
import GuidePopup from "./GuidePopup.jsx";



const SocketComponent = () => {
  const [isOpened, setIsOpened] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [userInfo, setUserInfo] = useState({ username: "", socket_id: "" });
  const [recipient, setRecipient] = useState("");
  const [isConnected, setIsConnected] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  // console.log(isOpened);

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

    socket.on("private_message", (encrypted_data) => {
      const data = dataDecryptor(encrypted_data);
      //console.log("Received message:", encrypted_data);
      setMessages((prev) => [...prev, { ...data, type: "received" }]);
    });

    // socket.on("message_delivered458", (data) => {
    //   console.log("Message delivered to recipient:", data);
    // });

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

  
  //gets the data after stringifying the json.
  const dataEncryptor = (data) => {
    const encrypted = cryptoJS.AES.encrypt(
      data,
      import.meta.env.VITE_MSG_SECRET
    ).toString();
    return encrypted;
  };
  // returns the data after parsing to the json
  const dataDecryptor = (data) => {
    const bytes = cryptoJS.AES.decrypt(data, import.meta.env.VITE_MSG_SECRET);
    const decryptedString = bytes.toString(cryptoJS.enc.Utf8);
    const decryptedData = JSON.parse(decryptedString);
    return decryptedData;
  };

  const responsehandling = () => {
    return new Promise((resolve, reject) => {
      socketRef.current.on("message_delivery_confirmation", (data_encrypted) => {
        const data = dataDecryptor(data_encrypted);

        const { success, msg } = data;
        resolve(success);
        setTimeout(() => resolve(0), 5000);
      });
    });
  };

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

    const data = {
      to: recipient.trim(),
      from: userInfo.username,
      message: inputMessage,
    };
    const parsed_data = JSON.stringify(data);
    const encryptedData = dataEncryptor(parsed_data);

    socketRef.current.emit("private_message", encryptedData);




    //response handling
    let delivered;
    delivered = await responsehandling();
    console.log(delivered);
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
      alert("User not found,Message not delivered");
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

  return (<>
    <div className="chat-container">
      <div className="header-help">
        <h2>Socket.IO Chat</h2>
        <div className="help" onClick={()=>isOpened?setIsOpened(false):setIsOpened(true)}>i</div>
      </div>

      <div className="connection-info">
        <div className="Connection-status">
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
              <strong>Send</strong>
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
    <GuidePopup value={isOpened} updateFn={setIsOpened}/>
    </>
  );
};

export default SocketComponent;
