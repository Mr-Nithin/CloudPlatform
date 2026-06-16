import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { conversations } from '../api/client';

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [convList, setConvList] = useState([]);
  const bottomRef = useRef(null);

  // Load conversation list
  useEffect(() => {
    conversations.list().then((res) => setConvList(res.data)).catch(console.error);
  }, []);

  // Load selected conversation
  useEffect(() => {
    if (!conversationId) return;
    conversations.get(conversationId)
      .then((res) => {
        setConversation(res.data);
        setMessages(res.data.messages || []);
      })
      .catch(console.error);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNew = async () => {
    const res = await conversations.create();
    navigate(`/chat/${res.data.id}`);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending || !conversationId) return;

    const userMsg = { role: 'user', content: input, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await conversations.sendMessage(conversationId, input);
      setMessages((prev) => [...prev, res.data.message]);
      if (res.data.request) {
        // A formal request was raised — refresh conversation list
        conversations.list().then((r) => setConvList(r.data)).catch(() => {});
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Error: ' + (err.response?.data?.error || 'Something went wrong'), id: Date.now() + 1 }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 64px)' }}>
      {/* Conversation list */}
      <div style={{ width: 220, flexShrink: 0 }}>
        <button className="btn-primary" style={{ width: '100%', marginBottom: 16 }} onClick={startNew}>
          + New Conversation
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {convList.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/chat/${c.id}`)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontSize: 13,
                background: c.id === conversationId ? 'var(--color-accent-bg)' : 'transparent',
                color: c.id === conversationId ? 'var(--color-accent)' : 'var(--color-muted)',
                border: c.id === conversationId ? '1px solid var(--color-accent-border)' : '1px solid transparent',
              }}
            >
              💬 {new Date(c.createdAt).toLocaleDateString()}
              {c.requestId && <span style={{ marginLeft: 6, fontSize: 11 }}>📋</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {!conversationId ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, color: 'var(--color-muted)' }}>
            <div style={{ fontSize: 48 }}>💬</div>
            <div style={{ fontSize: 16 }}>Select a conversation or start a new one</div>
            <button className="btn-primary" onClick={startNew}>Start New Conversation</button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--color-muted)', marginTop: 40 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
                  <p>Hi! I'm your cloud infrastructure assistant.</p>
                  <p style={{ fontSize: 13, marginTop: 8 }}>Tell me what cloud resource you need and I'll help you raise a request.</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id || msg.createdAt} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '75%',
                    background: msg.role === 'user' ? 'var(--color-accent)' : 'var(--color-surface-2)',
                    color: msg.role === 'user' ? '#fff' : 'var(--color-text)',
                    border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    padding: '12px 16px',
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}>
                    {msg.role === 'assistant'
                      ? <ReactMarkdown>{msg.content}</ReactMarkdown>
                      : msg.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '16px 16px 16px 4px', padding: '12px 16px' }}>
                    <div className="spinner" style={{ width: 16, height: 16 }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} style={{ padding: 16, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 12 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. I need an S3 bucket for the payments project in dev..."
                disabled={sending}
                style={{ flex: 1 }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
              />
              <button type="submit" className="btn-primary" disabled={sending || !input.trim()} style={{ whiteSpace: 'nowrap' }}>
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
