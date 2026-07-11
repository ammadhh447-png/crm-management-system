import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { aiApi } from '../../lib/api';
import Spinner from '../ui/Spinner';

const WELCOME = {
  role: 'assistant',
  content: 'Hello! I\'m your CRM assistant. I can help you navigate the system, manage contacts, deals, tasks, and more. How can I help you today?',
};

const formatReply = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(?<!\w)\*([^*\n]+)\*(?!\w)/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/^\s*[\*\-]\s+/gm, '• ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*/g, '');
};

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const checkStatus = () => {
    aiApi
      .getStatus()
      .then((res) => setConfigured(!!res?.data?.configured))
      .catch(() => setConfigured(false));
  };

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    if (open) checkStatus();
  }, [open]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, loading]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleOpen = () => setOpen(true);
  const handleHide = () => setOpen(false);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError('');
    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const history = updated
        .slice(1)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await aiApi.chat(history);
      setMessages((prev) => [...prev, { role: 'assistant', content: res?.data?.reply }]);
    } catch (err) {
      setError(err.message || 'Failed to get a response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`ai-panel ${open ? 'ai-panel-open' : 'ai-panel-closed'}`}
        aria-hidden={!open}
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <button
            onClick={handleHide}
            className="ai-close-btn"
            aria-label="Close assistant"
            title="Close"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>

          <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3.5 pr-12">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">CRM Assistant</p>
              <p className="text-xs text-slate-500">Powered by AI</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {configured === false && (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                AI is not configured. Add OPENROUTER_API_KEY to backend .env and restart the server.
              </div>
            )}

            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-slate-900 text-white rounded-br-md'
                        : 'bg-slate-100 text-slate-800 rounded-bl-md'
                    }`}
                  >
                    {msg.role === 'assistant' ? formatReply(msg.content) : msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3">
                    <Spinner size="sm" />
                    <span className="text-sm text-slate-500">Thinking...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-slate-100 p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Ask about CRM features..."
                rows={1}
                disabled={loading || configured === false}
                className="max-h-24 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading || configured === false}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <button
        onClick={handleOpen}
        className={`ai-fab group ${open ? 'ai-fab-hidden' : 'ai-fab-visible'}`}
        aria-label="Open AI assistant"
        title="Open AI assistant"
      >
        <Bot className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
      </button>
    </>
  );
};

export default AIAssistant;
