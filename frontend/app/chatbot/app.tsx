"use client";

import { useState } from "react";
import "./app.css";
import Sidebar from "@/components/sidebar/sidebar";
import PageTitle from "@/components/page_title/page_title";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  author: string;
  time: string;
  text: string;
  lines?: string[];
  image?: boolean;
};

const STARTER_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    role: "user",
    author: "You",
    time: "02:22 AM",
    text: "Do androids truly dream of electric sheeps or not?",
  },
  {
    id: 2,
    role: "assistant",
    author: "PatyoGPT",
    time: "02:22 AM",
    text: "The question of whether androids dream of electric sheep is the central theme of Philip K. Dick's novel.",
    lines: [
      "The story follows Rick Deckard, a bounty hunter who tracks rogue androids.",
      "The empathy test is used to distinguish humans from androids.",
      "The book explores identity, reality, and what it means to be human.",
      "It inspired Blade Runner, with a few plot differences.",
    ],
  },
  {
    id: 3,
    role: "user",
    author: "You",
    time: "02:22 AM",
    text: "Let's say it does. What happens then?",
  },
  {
    id: 4,
    role: "assistant",
    author: "PatyoGPT",
    time: "02:22 AM",
    text: "Here is a visual response:",
    image: true,
  },
];

function AssistantApp() {
  const [messages, setMessages] = useState<ChatMessage[]>(STARTER_MESSAGES);
  const [draft, setDraft] = useState("");

  const sendMessage = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        role: "user",
        author: "You",
        time: "Now",
        text: trimmed,
      },
      {
        id: Date.now() + 1,
        role: "assistant",
        author: "PatyoGPT",
        time: "Now",
        text: "Got it. I can summarize this, give next actions, or draft a report update.",
      },
    ]);
    setDraft("");
  };

  const avatarLabel = (message: ChatMessage) => {
    if (message.role === "assistant") {
      return "Ai";
    }
    return "Ly";
  };

  return (
    <div className="chatbot-right-side app-shell">
      <Sidebar />

      <main className="chatbot-content app-content">
        <header className="chatbot-header page-header-block">
          <PageTitle title="Chatbot" />
          <p>Ask, analyze, and generate quick project answers.</p>
        </header>

        <section className="assistant-surface" aria-label="Assistant chat">
          <div className="assistant-messages">
            {messages.map((message) => (
              <div key={message.id} className="chat-row">
                <div className={`chat-avatar ${message.role}`}>
                  {avatarLabel(message)}
                </div>

                <article className="chat-body">
                  <div className="chat-meta">
                    <strong>{message.author}</strong>
                    <span>{message.time}</span>
                  </div>

                  <div className={`assistant-message ${message.role}`}>
                    <p className="assistant-text">{message.text}</p>

                    {!!message.lines?.length && (
                      <ol className="assistant-list">
                        {message.lines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ol>
                    )}

                    {message.image && (
                      <div className="assistant-image-card">
                        <div
                          className="assistant-image"
                          aria-hidden="true"
                        ></div>
                        <div className="assistant-image-tools">
                          <span>◁</span>
                          <span>1/8</span>
                          <span>▷</span>
                          <span>⧉</span>
                          <span>↗</span>
                          <span>☆</span>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              </div>
            ))}
          </div>

          <form
            className="assistant-input-row"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <button
              className="attach-btn"
              type="button"
              aria-label="Attach file"
            >
              📎
            </button>
            <input
              type="text"
              placeholder="Message PatyoGPT..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              type="submit"
              className="send-btn"
              aria-label="Send message"
            >
              ↑
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default AssistantApp;
