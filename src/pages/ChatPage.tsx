import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { sendChatMessage } from '../services/aiService';
import { Send, Mic, MicOff, Trash2 } from 'lucide-react';

const QUICK_ACTIONS = [
  { id: 'daily',  label: 'Daily Assistant', subtitle: 'Plan your day',         img: '/genie/genie_tasker.png',   prompt: "Help me plan my day in alignment with my core values." },
  { id: 'goals',  label: 'Goal Explorer',   subtitle: 'Explore your goals',    img: '/genie/genie_explorer.png', prompt: "Let's explore my goals and how they connect to my values." },
  { id: 'health', label: 'Health Coach',    subtitle: 'Build better habits',   img: '/genie/genie_doctor.png',   prompt: "How can I build better health habits aligned with what I value?" },
  { id: 'anchor', label: 'Value Anchor',    subtitle: 'Reconnect with values', img: '/genie/genie_value.png',    prompt: "I'm feeling off track. Help me reconnect with my core values." },
];

export function ChatPage() {
  const store = useAppStore();
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [listening, setListening] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.chatMessages, streamingText]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    store.addChatMessage({ content: trimmed, sender: 'user' });
    setInput('');
    setStreaming(true);
    setStreamingText('');

    const controller = new AbortController();
    abortRef.current = controller;

    let full = '';
    try {
      await sendChatMessage(
        trimmed,
        (chunk) => { full += chunk; setStreamingText(full); },
        controller.signal,
      );
      if (full) store.addChatMessage({ content: full.trim(), sender: 'assistant' });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        store.addChatMessage({ content: "Sorry, I couldn't respond right now. Please try again.", sender: 'assistant' });
      }
    } finally {
      setStreaming(false);
      setStreamingText('');
      abortRef.current = null;
    }
  }

  function startVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setInput(transcript);
      if (e.results[e.results.length - 1].isFinal) {
        setListening(false);
        sendMessage(transcript);
      }
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  const showWelcome = store.chatMessages.length <= 1;

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-surface flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-sm font-semibold text-text-primary">ValueVis Coach</h1>
            <p className="text-xs text-text-muted">{import.meta.env.VITE_OPENAI_API_KEY ? 'AI-powered · Ready' : 'Demo mode'}</p>
          </div>
        </div>
        <button onClick={() => store.clearChatMessages()}
          className="p-2 rounded-xl hover:bg-surface-2 text-text-muted hover:text-red-500 transition-colors"
          title="Clear chat"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {/* Welcome / quick actions */}
        {showWelcome && (
          <div className="px-5 pt-6 pb-4">
            <div className="max-w-2xl mx-auto">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">Quick Actions</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {QUICK_ACTIONS.map((action) => (
                  <button key={action.id} onClick={() => sendMessage(action.prompt)}
                    className="bg-white border border-border rounded-2xl p-4 text-left hover:border-primary/40 hover:shadow-md transition-all card-hover group"
                  >
                    <p className="text-sm font-semibold text-text-primary leading-tight">{action.label}</p>
                    <p className="text-xs text-text-muted mt-0.5">{action.subtitle}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat messages */}
        <div className="px-5 pb-4 space-y-4 max-w-2xl mx-auto">
          {store.chatMessages.map((msg) => (
            <MessageBubble key={msg.id} content={msg.content} sender={msg.sender} timestamp={msg.timestamp} />
          ))}

          {/* Streaming bubble */}
          {streaming && streamingText && (
            <MessageBubble content={streamingText} sender="assistant" streaming />
          )}

          {/* Loading dots */}
          {streaming && !streamingText && (
            <div className="flex items-start gap-3">
              <div className="bg-white border border-border rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  {[0,1,2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-text-muted"
                      style={{ animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="px-5 py-4 bg-surface border-t border-border flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 items-end">
            <div className="flex-1 bg-bg border border-border rounded-2xl focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="Ask your coach anything…"
                rows={1}
                className="w-full bg-transparent px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none resize-none"
                style={{ minHeight: '44px' }}
              />
            </div>
            <button onClick={listening ? stopVoice : startVoice}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border flex-shrink-0 ${listening ? 'bg-red-50 border-red-200 text-red-500' : 'bg-bg border-border text-text-muted hover:text-text-primary hover:border-primary/30'}`}
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || streaming}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40 hover:bg-primary-dark transition-colors flex-shrink-0"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
          {!import.meta.env.VITE_OPENAI_API_KEY && (
            <p className="text-xs text-text-muted text-center mt-2">Demo mode — add <code className="bg-surface-2 px-1 rounded text-xs">VITE_OPENAI_API_KEY</code> to .env for real AI</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ content, sender, timestamp, streaming }: {
  content: string; sender: 'user' | 'assistant'; timestamp?: string; streaming?: boolean;
}) {
  const isUser = sender === 'user';
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && null}
      <div className={`max-w-[75%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-white rounded-tr-none'
            : 'bg-white border border-border text-text-primary rounded-tl-none shadow-sm'
        }`}>
          {content}
          {streaming && <span className="inline-block w-0.5 h-4 bg-text-muted ml-0.5 animate-pulse align-middle" />}
        </div>
        {timestamp && (
          <span className="text-xs text-text-muted px-1">
            {new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
