"use client";
import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/sidebar/sidebar";
import PageTitle from "@/components/page_title/page_title";
import { Send, Sparkles, User, RefreshCw, Lightbulb } from "lucide-react";
import "./page.css";

type MessageRole = "assistant" | "user";

type Message = {
  id: number;
  role: MessageRole;
  text: string;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    role: "assistant",
    text: "Hello! I'm your Passyo AI assistant. I can help you analyze project status, review resource availability, identify risks, and generate reports. What would you like to know?",
  },
];

const SAMPLE_PROMPTS = [
  "Summarize the status of all active projects",
  "Which resources are critically low?",
  "What are the top 3 risks this week?",
  "Generate a progress report for Skyline Plaza",
];

const AI_RESPONSES: Record<string, string> = {
  default:
    "Based on the current project data, here's what I found:\n\n• **Skyline Plaza Phase II** is at 72% completion and on track for delivery in 14 days.\n• **Metro Station Upgrade** shows elevated risk — cabling delays have pushed it back by 4 days.\n• **West Ring Road Viaduct** is blocked at 25% due to inspection backlog.\n\nI recommend prioritizing Metro Station and West Ring Road for immediate resource reallocation. Would you like a detailed breakdown of any specific project?",
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: Message = { id: Date.now(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    inputRef.current?.focus();

    // Simulate AI response delay
    setTimeout(() => {
      setIsTyping(false);
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        text: AI_RESPONSES.default,
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleReset = () => {
    setMessages(INITIAL_MESSAGES);
    setInput("");
    inputRef.current?.focus();
  };

  const showPrompts = messages.length === 1 && !isTyping;

  return (
    <div className="chatbot-shell app-shell">
      <Sidebar />

      <main className="chatbot-content app-content">
        {/* ── Header ── */}
        <header className="chatbot-header">
          <div className="chatbot-header-left">
            <div className="chatbot-ai-icon">
              <Sparkles size={16} />
            </div>
            <PageTitle title="AI Assistant" />
          </div>
          <button
            className="chatbot-reset-btn"
            onClick={handleReset}
            title="Start a new conversation"
          >
            <RefreshCw size={14} />
            New chat
          </button>
        </header>

        {/* ── Message list ── */}
        <div className="chatbot-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${msg.role}`}
              aria-label={
                msg.role === "assistant" ? "AI message" : "Your message"
              }
            >
              <div className={`chat-avatar ${msg.role}`}>
                {msg.role === "assistant" ? (
                  <Sparkles size={13} />
                ) : (
                  <User size={13} />
                )}
              </div>
              <div className="chat-bubble">
                {msg.text.split("\n").map((line, i) => {
                  if (line.startsWith("•")) {
                    return (
                      <p key={i} className="chat-line bullet">
                        {line.replace(/\*\*(.*?)\*\*/g, "$1")}
                      </p>
                    );
                  }
                  if (line.trim() === "") return <br key={i} />;
                  return (
                    <p key={i} className="chat-line">
                      {line.replace(/\*\*(.*?)\*\*/g, "$1")}
                    </p>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="chat-message assistant">
              <div className="chat-avatar assistant">
                <Sparkles size={13} />
              </div>
              <div className="chat-bubble typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Sample prompts ── */}
        {showPrompts && (
          <div className="chatbot-prompts">
            <div className="chatbot-prompts-label">
              <Lightbulb size={14} />
              Try asking…
            </div>
            <div className="chatbot-prompts-grid">
              {SAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  className="chatbot-prompt-chip"
                  onClick={() => sendMessage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input area ── */}
        <form className="chatbot-input-area" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="chatbot-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your projects…"
            disabled={isTyping}
            autoComplete="off"
          />
          <button
            type="submit"
            className="chatbot-send-btn"
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
          >
            <Send size={17} />
          </button>
        </form>
      </main>
    </div>
  );
}
