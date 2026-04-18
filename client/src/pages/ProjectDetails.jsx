import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { FileText, MessageSquare, Plus, Paperclip, Trash2, Shield, User as UserIcon } from 'lucide-react';

export default function ProjectDetails({ user }) {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/projects/${id}/attachments`, formData);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    try {
      await api.delete(`/projects/${id}/attachments/${attachmentId}`);
      fetchProject();
    } catch (err) {
      const msg = err.response?.data?.error || 'Error deleting attachment';
      alert(msg);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    try {
      await api.post('/threads', { ...newThread, projectId: id });
      setShowThreadModal(false);
      setNewThread({ title: '', content: '' });
      fetchProject();
    } catch (err) {
      alert('Only project admins can create threads.');
    }
  };

  if (loading) return <div className="container">Loading...</div>;
  if (!project) return <div className="container">Project not found</div>;

  return (
    <div className="container animate-fade-in">
      <div className="detail-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '16px' }}>
          <Shield size={20} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project Space</span>
        </div>
        <h1 style={{ fontSize: '3rem', marginBottom: '12px' }}>{project.name}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '800px' }}>{project.description}</p>
      </div>

      <div className="section-grid">
        <div className="main-content">
          {/* Threads Section */}
          <div className="card" style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MessageSquare size={24} color="var(--primary)" />
                Discussions
              </h2>
              {user.isAdmin && (
                <button onClick={() => setShowThreadModal(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                  New Thread
                </button>
              )}
            </div>
            
            <div className="thread-list">
              {project.threads.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No discussions yet.</p>
              ) : (
                project.threads.map(thread => (
                  <Link to={`/threads/${thread.id}`} key={thread.id} className="thread-item" style={{ display: 'block', textDecoration: 'none', color: 'inherit', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ padding: '16px 0' }}>
                      <h3 style={{ marginBottom: '4px' }}>{thread.title}</h3>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span>Started by {thread.creator.name}</span>
                        <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Attachments Section */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Paperclip size={24} color="var(--accent-light)" />
                Files & Attachments
              </h2>
              <label className="btn-primary" style={{ cursor: 'pointer', padding: '8px 16px', fontSize: '0.9rem' }}>
                <Plus size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Upload File
                <input type="file" hidden onChange={handleFileUpload} />
              </label>
            </div>

            <div className="attachment-list">
              {project.attachments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No files uploaded.</p>
              ) : (
                project.attachments.map(file => (
                  <div key={file.id} className="attachment-item">
                    <div className="format-icon">
                      <FileText size={20} color={file.format === 'pdf' ? '#ef4444' : '#10b981'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{file.filename}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {file.format} • Uploaded by {file.user.name}
                      </div>
                    </div>
                    <a href={import.meta.env.PROD ? file.url : `http://localhost:5000${file.url}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>View</a>
                    {(user.id === file.userId || user.isAdmin) && (
                      <button onClick={() => handleDeleteAttachment(file.id)} style={{ background: 'none', color: 'var(--danger)' }}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="side-content">
          <div className="card">
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Team Members</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {project.members.map(member => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--glass)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                    <UserIcon size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{member.user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {member.user.id === project.ownerId ? 'Project Owner' : 'Member'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showThreadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '24px' }}>Start a Discussion</h2>
            <form onSubmit={handleCreateThread}>
              <div className="form-group">
                <label>Thread Title</label>
                <input 
                  className="form-input" 
                  type="text" 
                  required 
                  value={newThread.title}
                  onChange={(e) => setNewThread({...newThread, title: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Opening Message</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '150px', resize: 'vertical' }}
                  value={newThread.content}
                  onChange={(e) => setNewThread({...newThread, content: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button type="button" onClick={() => setShowThreadModal(false)} style={{ flex: 1, background: 'var(--glass)', color: 'white' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Publish Thread</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
