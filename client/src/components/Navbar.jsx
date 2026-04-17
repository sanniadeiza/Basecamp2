import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Home, User as UserIcon } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  return (
    <nav className="nav">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
        <div style={{ background: 'var(--primary)', padding: '5px', borderRadius: '8px' }}>
          <Home size={20} color="white" />
        </div>
        <h2 style={{ fontSize: '1.25rem' }}>MyBaseCamp</h2>
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserIcon size={18} color="var(--text-muted)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.name}</span>
          <span className={`badge ${user.isAdmin ? 'badge-admin' : 'badge-user'}`}>
            {user.isAdmin ? 'Admin' : 'User'}
          </span>
        </div>
        <button onClick={onLogout} style={{ background: 'transparent', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
