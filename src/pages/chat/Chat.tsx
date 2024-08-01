import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import CryptoJS from "crypto-js";
import './Chat.css';

const SOCKET_SERVER_URL = import.meta.env.VITE_APP_API_URL_SOCKET as string;
const STORAGE_KEY = import.meta.env.VITE_APP_STORAGE_KEY;
const SECRET_KEY = import.meta.env.VITE_APP_SECRET_KEY; // Replace with a secure key
const THEME_KEY = "themePreference";

interface Message {
  text: string;
  senderId: string;
  createdAt: string;
}

const ChatApp: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    const loadMessages = () => {
      const encryptedMessages = localStorage.getItem(STORAGE_KEY);
      if (encryptedMessages) {
        const bytes = CryptoJS.AES.decrypt(encryptedMessages, SECRET_KEY);
        const decryptedMessages = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        setMessages(decryptedMessages);
      }
    };

    const loadTheme = () => {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme) {
        setIsDarkMode(savedTheme === "dark");
      }
    };

    const initializeSocket = async () => {
      try {
        const token = localStorage.getItem("token");

        socket.current = io(SOCKET_SERVER_URL, {
          withCredentials: true,
          transports: ["websocket"],
          query: { token },
          secure: true,
          rejectUnauthorized: false,
        });

        socket.current.on("reply", (message: Message) => {
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages, message];
            saveMessages(updatedMessages);
            return updatedMessages;
          });
        });

        socket.current.on("error", (error: { message: string }) => {
          alert(error.message);
          window.location.href = "/";
        });
      } catch (error) {
        console.error("Failed to initialize socket:", error);
        alert("Failed to initialize chat connection.");
        window.location.href = "/";
      }
    };

    loadMessages();
    loadTheme();
    initializeSocket();

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  const saveMessages = (messages: Message[]) => {
    const encryptedMessages = CryptoJS.AES.encrypt(JSON.stringify(messages), SECRET_KEY).toString();
    localStorage.setItem(STORAGE_KEY, encryptedMessages);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return;

    const message: Message = {
      text: newMessage,
      senderId: "1", // This should be dynamic in a real application
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);

    if (socket.current) {
      const receiverId = localStorage.getItem("userId");
      socket.current.emit("one-one-message", JSON.stringify({
        message: newMessage,
        recieverId: receiverId,
      }));
    }

    setNewMessage("");
  };

  const toggleTheme = () => {
    const newTheme = isDarkMode ? "light" : "dark";
    setIsDarkMode(!isDarkMode);
    localStorage.setItem(THEME_KEY, newTheme);
    document.body.classList.toggle("dark-mode", !isDarkMode);
  };

  return (
    <div className={`chat-app ${isDarkMode ? "dark-mode" : ""}`}>
      <div className="message-list">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${
              message.senderId === "1" ? "user" : "bot"
            }`}
          >
            <div className="message-text">{message.text}</div>
            <div className="message-timestamp">{new Date(message.createdAt).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
      <div className="message-form">
      <button className="theme-toggle" onClick={toggleTheme}>
        {isDarkMode ? "🌞" : "🌜"}
      </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
     
    </div>
  );
};

export default ChatApp;
