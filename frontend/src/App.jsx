import React, { useState, useEffect } from 'react';
import { 
  FileText, Upload, Download, CheckCircle2, Clock, 
  AlertCircle, Edit3, Save, LogOut, ArrowRight, User, 
  ShieldAlert, BarChart2, DollarSign, Tag, RefreshCw, FileCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

const API_BASE = 'http://localhost:8000';

export default function App() {
  // Auth States
  const [token, setToken] = useState(localStorage.getItem('parser_token') || '');
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('parser_username') || '');
  const [authView, setAuthView] = useState('login'); // login, register
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // App States
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editableData, setEditableData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load tasks on login
  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  // Polling for processing tasks
  useEffect(() => {
    if (!token) return;
    const hasPending = tasks.some(t => t.status === 'PENDING' || t.status === 'PROCESSING');
    if (!hasPending) return;

    const interval = setInterval(() => {
      fetchTasks();
    }, 2000);

    return () => clearInterval(interval);
  }, [token, tasks]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/parser/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) handleLogout();
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
      
      // Update selectedTask if active
      if (selectedTask) {
        const updated = data.find(t => t.task_id === selectedTask.task_id);
        if (updated) {
          setSelectedTask(updated);
          if (!editableData || updated.status === 'COMPLETED') {
            setEditableData(updated.extracted_data);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  };

  // Auth Handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const endpoint = authView === 'login' ? '/api/v1/auth/token' : '/api/v1/auth/register';

    let options = {};
    if (authView === 'login') {
      const formData = new URLSearchParams();
      formData.append('username', usernameInput);
      formData.append('password', passwordInput);
      options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      };
    } else {
      options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput, email: emailInput })
      };
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, options);
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Auth error');

      if (authView === 'login') {
        localStorage.setItem('parser_token', data.access_token);
        localStorage.setItem('parser_username', usernameInput);
        setToken(data.access_token);
        setCurrentUser(usernameInput);
      } else {
        setAuthView('login');
        setErrorMsg('Registration successful! Please log in.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('parser_token');
    localStorage.removeItem('parser_username');
    setToken('');
    setCurrentUser('');
    setTasks([]);
    setSelectedTask(null);
  };

  // File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/v1/parser/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const newTask = await res.json();
        setTasks(prev => [newTask, ...prev]);
        setSelectedTask(newTask);
        setEditableData(null);
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Manual Verification & Field Edit Save
  const handleSaveCorrection = async () => {
    if (!selectedTask || !editableData) return;
    setIsSaving(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/parser/tasks/${selectedTask.task_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ extracted_data: editableData })
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedTask(updated);
        fetchTasks();
      }
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  // CSV Export Trigger
  const handleExportCSV = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/parser/export/csv`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'parsed_documents.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  // Analytics Chart Data
  const getAnalyticsData = () => {
    const vendorTotals = {};
    tasks.forEach(t => {
      if (t.status === 'COMPLETED' && t.extracted_data) {
        const v = t.extracted_data.vendor_name || 'Other';
        const amt = parseFloat(t.extracted_data.total_amount) || 0;
        vendorTotals[v] = (vendorTotals[v] || 0) + amt;
      }
    });

    return Object.keys(vendorTotals).map(vendor => ({
      vendor,
      amount: Number(Math.round(vendorTotals[vendor] + 'e2') + 'e-2')
    }));
  };

  const chartData = getAnalyticsData();

  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <FileCheck size={36} color="#10b981" />
            </div>
          </div>
          <h2 className="auth-title">
            {authView === 'login' ? 'Async Document Parser' : 'Create Account'}
          </h2>
          <p className="auth-subtitle">
            {authView === 'login' ? 'Sign in to extract structured fields from documents' : 'Sign up to build parsing pipelines'}
          </p>

          <form onSubmit={handleAuth}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                required
                className="form-input"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                placeholder="rushikesh"
              />
            </div>

            {authView === 'register' && (
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email"
                  required
                  className="form-input"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="name@domain.com"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                required
                className="form-input"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {errorMsg && (
              <div className="error-banner">
                {errorMsg}
              </div>
            )}

            <button type="submit" className="btn-primary">
              <span>{authView === 'login' ? 'Login' : 'Register'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
            {authView === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setAuthView(authView === 'login' ? 'register' : 'login'); setErrorMsg(''); }}
              style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer' }}
            >
              {authView === 'login' ? 'Register' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="user-badge">
            <div className="avatar-circle">
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#f8fafc' }}>{currentUser}</div>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Gemini 1.5 Parser</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px' }} title="Log Out">
            <LogOut size={18} />
          </button>
        </div>

        {/* Upload Dropzone */}
        <div className="dropzone-container">
          <label className="dropzone-label">
            <Upload size={24} color="#10b981" style={{ marginBottom: '4px' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Upload PDF / Image</span>
            <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Async extraction pipeline</span>
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg" 
              className="hidden" 
              style={{ display: 'none' }}
              onChange={handleFileUpload} 
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Task List Header */}
        <div style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>
            Parsed Documents
          </span>
          <button 
            onClick={handleExportCSV} 
            style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Download size={12} />
            <span>CSV</span>
          </button>
        </div>

        {/* Task List */}
        <div className="task-list">
          {tasks.map(t => (
            <button
              key={t.task_id}
              onClick={() => { setSelectedTask(t); setEditableData(t.extracted_data); }}
              className={`task-item ${selectedTask?.task_id === t.task_id ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                  {t.filename}
                </span>
                <span className={`status-chip ${t.status.toLowerCase()}`}>{t.status}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>
                {new Date(t.created_at).toLocaleString()}
              </div>
            </button>
          ))}
          {tasks.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
              No files uploaded yet.
            </div>
          )}
        </div>
      </div>

      {/* MAIN INSPECTOR AREA */}
      <div className="main-window">
        {selectedTask ? (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            
            {/* LEFT: DOCUMENT INSPECTOR */}
            <div className="split-left">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>{selectedTask.filename}</h2>
                  <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>Task ID: {selectedTask.task_id}</span>
                </div>
                <span className={`status-chip ${selectedTask.status.toLowerCase()}`}>{selectedTask.status}</span>
              </div>

              <div className="document-preview-box">
                <FileText size={48} color="#10b981" style={{ marginBottom: '12px' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>{selectedTask.filename}</span>
                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Multi-modal Document Payload</span>

                {selectedTask.status === 'PROCESSING' && (
                  <div style={{ marginTop: '24px', fontSize: '12px', color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={14} style={{ animation: 'spin 2s linear infinite' }} />
                    <span>Gemini 1.5 Extracting Fields...</span>
                  </div>
                )}

                {selectedTask.status === 'COMPLETED' && (
                  <div style={{ marginTop: '24px', fontSize: '12px', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} />
                    <span>Schema Extraction Validated</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: EDITABLE VERIFICATION FORM */}
            <div className="split-right">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Edit3 size={16} color="#10b981" />
                    <span>Field Verification & Edit</span>
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Edit extracted JSON values below</span>
                </div>
                {selectedTask.status === 'COMPLETED' && (
                  <button
                    onClick={handleSaveCorrection}
                    disabled={isSaving}
                    className="btn-primary"
                    style={{ width: 'auto', padding: '8px 14px', fontSize: '12px' }}
                  >
                    <Save size={14} />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                )}
              </div>

              {editableData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="field-grid">
                    <div className="field-input-box">
                      <label className="form-label">Vendor Name</label>
                      <input 
                        type="text"
                        className="form-input"
                        style={{ padding: '8px', fontSize: '12px' }}
                        value={editableData.vendor_name || ''}
                        onChange={e => setEditableData({ ...editableData, vendor_name: e.target.value })}
                      />
                    </div>
                    <div className="field-input-box">
                      <label className="form-label">Invoice Number</label>
                      <input 
                        type="text"
                        className="form-input"
                        style={{ padding: '8px', fontSize: '12px' }}
                        value={editableData.invoice_number || ''}
                        onChange={e => setEditableData({ ...editableData, invoice_number: e.target.value })}
                      />
                    </div>
                    <div className="field-input-box">
                      <label className="form-label">Invoice Date</label>
                      <input 
                        type="text"
                        className="form-input"
                        style={{ padding: '8px', fontSize: '12px' }}
                        value={editableData.invoice_date || ''}
                        onChange={e => setEditableData({ ...editableData, invoice_date: e.target.value })}
                      />
                    </div>
                    <div className="field-input-box">
                      <label className="form-label">Total Amount ($)</label>
                      <input 
                        type="number"
                        step="0.01"
                        className="form-input"
                        style={{ padding: '8px', fontSize: '12px', fontWeight: 700, color: '#34d399' }}
                        value={editableData.total_amount || 0}
                        onChange={e => setEditableData({ ...editableData, total_amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ marginBottom: '8px' }}>Line Items ({editableData.line_items?.length || 0})</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {editableData.line_items?.map((item, idx) => (
                        <div key={idx} style={{ background: 'rgba(9, 13, 22, 0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="text"
                            className="form-input"
                            style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}
                            value={item.item_name}
                            onChange={e => {
                              const items = [...editableData.line_items];
                              items[idx].item_name = e.target.value;
                              setEditableData({ ...editableData, line_items: items });
                            }}
                          />
                          <span style={{ fontSize: '11px', color: '#64748b' }}>x{item.quantity}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>${item.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
                  Waiting for extraction data...
                </div>
              )}
            </div>

          </div>
        ) : (
          /* DASHBOARD VIEW */
          <div className="dashboard-container">
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>Document Analytics Dashboard</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '32px' }}>Aggregated spend summary across all completed document extractions</p>

            <div style={{ background: 'rgba(9, 13, 22, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={18} color="#10b981" />
                <span>Vendor Total Spend Summary</span>
              </h3>

              {chartData.length > 0 ? (
                <div style={{ height: '260px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="vendor" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                      <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ padding: '48px', textAlign: 'center', fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
                  Upload invoices to view aggregate spend charts.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
