import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { Send, ArrowLeft, MoreVertical, Trash2, Edit2 } from 'lucide-react';

export default function ThreadDetails({ user }) {
  const { id } = useParams();
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchThread();
  }, [id]);

  const fetchThread = async () => {
    try {
      const { data } = await api.get(`/threads/${id}`);
      setThread(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handlePostMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await api.post('/messages', { content: newMessage, threadId: id });
      setNewMessage('');
      fetchThread();
    } catch (err) {
      alert('Error posting message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/messages/${messageId}`);
      fetchThread();
    } catch (err) {
      alert('Error deleting message');
    }
  };

  if (loading) return <div className="container">Loading...</div>;
  if (!thread) return <div className="container">Thread not found</div>;

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '800px' }}>
      <Link to={`/projects/${thread.projectId}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '32px', fontSize: '0.9rem' }}>
        <ArrowLeft size={16} />
        Back to Project
      </Link>

      <div className="card" style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{thread.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ padding: '4px 12px', borderRadius: '20px', background: 'var(--glass)', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
            Admin Discussion
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Started by {thread.creator.name} • {new Date(thread.createdAt).toLocaleString()}
          </span>
        </div>
        <div style={{ lineHeight: '1.6', fontSize: '1.1rem', whiteSpace: 'pre-wrap' }}>
          {thread.content}
        </div>
      </div>

      <div className="messages" style={{ marginBottom: '100px' }}>
        <h3 style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>{thread.messages.length} Messages</h3>
        {thread.messages.map(msg => (
          <div key={msg.id} className="message-bubble animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{msg.author.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
              {(msg.authorId === user.id || user.isAdmin) && (
                <button onClick={() => handleDeleteMessage(msg.id)} style={{ background: 'none', color: 'var(--text-muted)' }}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div style={{ fontSize: '1rem', lineHeight: '1.5' }}>{msg.content}</div>
          </div>
        ))}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-dark)', borderTop: '1px solid var(--glass-border)', padding: '20px' }}>
        <form onSubmit={handlePostMessage} className="container" style={{ maxWidth: '800px', padding: 0, display: 'flex', gap: '12px' }}>
          <input 
            className="form-input"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px' }}>
            <Send size={18} />
            Post
          </button>
        </form>
      </div>
    </div>
  );
}
