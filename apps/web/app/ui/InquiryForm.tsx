'use client';
import { FormEvent, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export default function InquiryForm() {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setNotice(null);
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch(`${API}/inquiries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'We couldn’t send that just now. Please try again.');
      setNotice({ kind: 'success', text: result.message }); form.reset();
    } catch (error) { setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Connection error. Please try again.' }); }
    finally { setPending(false); }
  }
  return <form className="inquiry-form" onSubmit={submit}>
    <div className="field-row"><label>Your name<input name="name" placeholder="e.g. Alex Morgan" required minLength={2} maxLength={120} autoComplete="name" /></label><label>I’m a<select name="userType" defaultValue="" required><option value="" disabled>Select one</option><option>Parent</option><option>Student</option><option>School</option></select></label></div>
    <label>Email address<input name="email" type="email" placeholder="you@example.com" required maxLength={254} autoComplete="email" /></label>
    <label>Phone number<input name="phone" type="tel" placeholder="+1 (555) 000-0000" required minLength={7} maxLength={30} autoComplete="tel" /></label>
    <label>What’s on your mind?<select name="category" defaultValue="" required><option value="" disabled>Choose a topic</option><option>Scholarship</option><option>Concert</option><option>Admission</option><option>General Query</option></select></label>
    <label>Your message<textarea name="message" placeholder="Tell us a little about what you’re looking for…" rows={3} required minLength={10} maxLength={3000} /></label>
    {notice && <p role="status" className={`notice ${notice.kind}`}>{notice.text}</p>}
    <button className="submit-button" type="submit" disabled={pending}>{pending ? 'Sending your message…' : 'Send my inquiry'} <span aria-hidden="true">↗</span></button>
    <p className="privacy-note"><span>▣</span> Your details are only used to respond to your inquiry.</p>
  </form>;
}
