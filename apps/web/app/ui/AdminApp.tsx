'use client';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
type Inquiry = { id: string; name: string; email: string; phone: string; userType: string; category: string; message: string; status: string; createdAt: string };
type Admin = { email: string };
const prettyDate = (value: string) => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export default function AdminApp() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [checking, setChecking] = useState(true);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [userType, setUserType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Inquiry | null>(null);

  const load = useCallback(async () => {
    if (!admin) return;
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim()); if (category) params.set('category', category); if (userType) params.set('userType', userType); if (statusFilter) params.set('status', statusFilter);
    const response = await fetch(`${API}/admin/inquiries?${params}`, { credentials: 'include' });
    if (response.status === 401) { setAdmin(null); return; }
    const data = await response.json(); if (response.ok) setInquiries(data.inquiries);
  }, [admin, search, category, userType, statusFilter]);

  useEffect(() => { fetch(`${API}/admin/me`, { credentials: 'include' }).then(r => r.ok ? r.json() : null).then(d => setAdmin(d?.admin ?? null)).catch(() => setAdmin(null)).finally(() => setChecking(false)); }, []);
  useEffect(() => { if (admin) { const timer = setTimeout(() => load().catch(() => setMessage('Unable to load inquiries. Check the API connection.')), 180); return () => clearTimeout(timer); } }, [admin, load]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(''); const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try { const r = await fetch(`${API}/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setAdmin(d.admin); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to sign in.'); } finally { setBusy(false); }
  }
  async function logout() { await fetch(`${API}/admin/logout`, { method: 'POST', credentials: 'include' }); setAdmin(null); setInquiries([]); }
  async function updateStatus(inquiry: Inquiry, status: string) {
    const r = await fetch(`${API}/admin/inquiries/${inquiry.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status }) });
    if (!r.ok) { setMessage('Could not update the inquiry status.'); return; }
    setSelected(current => current?.id === inquiry.id ? { ...current, status } : current); await load();
  }
  const counts = useMemo(() => ({ total: inquiries.length, fresh: inquiries.filter(i => i.status === 'New').length, progress: inquiries.filter(i => i.status === 'In Progress').length }), [inquiries]);

  if (checking) return <div className="admin-loading"><span className="brand-mark">N</span><p>Opening your workspace…</p></div>;
  if (!admin) return <main className="login-shell"><a className="brand" href="/"><span className="brand-mark">N</span><span>northstar<span className="brand-light"> learning</span></span></a><section className="login-card"><div className="eyebrow"><span className="eyebrow-dot"/> TEAM WORKSPACE</div><h1>Welcome back.</h1><p>Sign in to manage incoming inquiries.</p><form className="inquiry-form" onSubmit={signIn}><label>Email address<input name="email" type="email" autoComplete="username" required placeholder="team@example.com"/></label><label>Password<input name="password" type="password" autoComplete="current-password" required placeholder="Your password"/></label>{message && <p role="alert" className="notice error">{message}</p>}<button className="submit-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <span>↗</span></button></form><a className="back-link" href="/">← Back to the inquiry form</a></section></main>;

  return <main className="dashboard-shell"><header className="dash-header"><a href="/" className="brand"><span className="brand-mark">N</span><span>northstar<span className="brand-light"> learning</span></span></a><div className="dash-user"><span className="avatar">{admin.email.charAt(0).toUpperCase()}</span><span className="dash-email">{admin.email}</span><button className="text-button" onClick={logout}>Sign out</button></div></header>
    <section className="dashboard-content"><div className="dash-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> INQUIRY DESK</div><h1>Good work starts here.</h1><p>Keep every conversation moving forward.</p></div><div className="live-indicator"><span/> LIVE INBOX</div></div>
      <div className="stat-grid"><article className="stat-card"><span>Visible inquiries</span><strong>{counts.total}</strong><small>In the current view</small></article><article className="stat-card warm"><span>New to review</span><strong>{counts.fresh}</strong><small>Ready for a first reply</small></article><article className="stat-card dark"><span>In progress</span><strong>{counts.progress}</strong><small>Conversations underway</small></article></div>
      <section className="inbox-panel"><div className="inbox-title"><div><h2>All inquiries</h2><span>{inquiries.length} {inquiries.length === 1 ? 'conversation' : 'conversations'}</span></div><button className="refresh-button" onClick={() => load()}>↻ <span>Refresh</span></button></div>
        <div className="filters"><div className="search-wrap"><span>⌕</span><input aria-label="Search by name or phone" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or phone"/></div><select aria-label="Filter by category" value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{['Scholarship','Concert','Admission','General Query'].map(x => <option key={x}>{x}</option>)}</select><select aria-label="Filter by user type" value={userType} onChange={e => setUserType(e.target.value)}><option value="">All user types</option>{['Parent','Student','School'].map(x => <option key={x}>{x}</option>)}</select><select aria-label="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">All statuses</option>{['New','In Progress','Resolved'].map(x => <option key={x}>{x}</option>)}</select></div>
        {message && <p className="notice error">{message}</p>}
        <div className="table-scroll"><table><thead><tr><th>CONTACT</th><th>TYPE</th><th>TOPIC</th><th>RECEIVED</th><th>STATUS</th><th></th></tr></thead><tbody>{inquiries.map(item => <tr key={item.id}><td><button className="contact-cell" onClick={() => setSelected(item)}><strong>{item.name}</strong><span>{item.email}</span><span>{item.phone}</span></button></td><td><span className="type-pill">{item.userType}</span></td><td><span className="category-text">{item.category}</span></td><td><span className="date-text">{prettyDate(item.createdAt)}</span></td><td><select aria-label={`Status for ${item.name}`} className={`status-select status-${item.status.toLowerCase().replace(' ', '-')}`} value={item.status} onChange={e => updateStatus(item,e.target.value)}>{['New','In Progress','Resolved'].map(x=><option key={x}>{x}</option>)}</select></td><td><button className="open-button" aria-label={`Open message from ${item.name}`} onClick={() => setSelected(item)}>↗</button></td></tr>)}</tbody></table>
        {!inquiries.length && <div className="empty-state"><span>✳</span><strong>No inquiries in this view</strong><p>New conversations will show up here.</p></div>}</div>
      </section><p className="dashboard-foot">A thoughtful reply can make someone’s day.</p></section>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)} aria-label="Close">×</button><div className="eyebrow"><span className="eyebrow-dot"/> {selected.category.toUpperCase()}</div><h2 id="detail-title">{selected.name}</h2><p className="modal-meta">{selected.userType} · {prettyDate(selected.createdAt)}</p><div className="detail-contact"><a href={`mailto:${selected.email}`}>{selected.email}</a><a href={`tel:${selected.phone}`}>{selected.phone}</a></div><p className="detail-message">{selected.message}</p><label className="detail-status">Conversation status<select value={selected.status} onChange={e => updateStatus(selected,e.target.value)}>{['New','In Progress','Resolved'].map(x=><option key={x}>{x}</option>)}</select></label></section></div>}
  </main>;
}
