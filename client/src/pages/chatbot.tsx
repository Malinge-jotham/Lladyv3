import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Message {
  sender: "user" | "bot";
  text: string;
}

// Eldady company info
const companyInfo = {
  services:
    "Eldady provides top-quality e-commerce solutions, fast deliveries, and excellent customer support.",
  email: "support@eldady.com",
  whatsapp: "+254712345678",
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: "👋 Hi there! I’m Stella, Eldady’s friendly assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  // Simple AI logic
  const stellaReply = (msg: string): string => {
    const text = msg.toLowerCase();

    if (/hello|hi|hey/.test(text)) {
      return "Hello there 👋! How’s your day going?";
    }
    if (/services|what do you offer|products/.test(text)) {
      return "Great question! 🌟 " + companyInfo.services;
    }
    if (/bye|goodbye|exit/.test(text)) {
      return "Thanks for chatting with Stella 💚. Come back anytime!";
    }
    if (/help|support/.test(text)) {
      return `No worries, I’ve got you 🤗. You can reach our team via Email: ${companyInfo.email} or WhatsApp: ${companyInfo.whatsapp}`;
    }

    // fallback
    return `Hmm 🤔 I’m not so sure about that one. But our support staff will gladly help you: Email: ${companyInfo.email}, WhatsApp: ${companyInfo.whatsapp}`;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    const reply = stellaReply(input);
    const botMsg: Message = { sender: "bot", text: reply };

    setTimeout(() => {
      setMessages((prev) => [...prev, botMsg]);
    }, 600);

    setInput("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary text-primary-foreground p-4 shadow">
        <h2 className="font-bold text-lg">Stella - Eldady Assistant</h2>
        <button
          onClick={() => navigate("/")}
          className="text-sm bg-white text-primary px-3 py-1 rounded-md shadow hover:bg-gray-100"
        >
          ✖ Close
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-xs px-4 py-2 rounded-lg ${
              msg.sender === "bot"
                ? "bg-gray-200 text-gray-800 self-start"
                : "bg-primary text-primary-foreground self-end ml-auto"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t flex items-center space-x-2 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-primary/50"
        />
        <button
          onClick={handleSend}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
