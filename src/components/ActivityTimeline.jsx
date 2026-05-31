import { useState, useEffect } from 'react';
import apiClient from '../api/client';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `il y a ${sec} s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `il y a ${days} j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const EVENT_ICONS = {
  created: { bg: 'bg-gray-100', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-gray-500' },
  submitted: { bg: 'bg-green-100', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-green-600' },
  paid: { bg: 'bg-green-100', icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-green-600' },
  cancelled: { bg: 'bg-red-100', icon: 'M6 18L18 6M6 6l12 12', color: 'text-red-600' },
  comment: { bg: 'bg-blue-100', icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z', color: 'text-blue-600' },
};

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function Avatar({ name, className = '' }) {
  const colors = ['bg-cobilan-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
  const color = colors[name ? name.charCodeAt(0) % colors.length : 0];
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${color} ${className}`}>
      {getInitials(name)}
    </div>
  );
}

export default function ActivityTimeline({ doctype, name }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!doctype || !name) return;
    loadTimeline();
  }, [doctype, name]);

  const loadTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const [docRes, commentsRes] = await Promise.all([
        apiClient.get(`/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`),
        apiClient.get('/resource/Comment', {
          params: {
            filters: JSON.stringify([['reference_doctype', '=', doctype], ['reference_name', '=', name]]),
            fields: JSON.stringify(['creation', 'content', 'owner', 'comment_type']),
            limit_page_length: 50,
            order_by: 'creation desc',
          },
        }),
      ]);

      const doc = docRes.data?.data || {};
      const comments = commentsRes.data?.data || [];
      const result = [];

      result.push({ type: 'created', date: doc.creation, owner: doc.owner, label: 'Document créé' });

      if (doc.docstatus === 1) {
        result.push({ type: 'submitted', date: doc.modified, owner: doc.modified_by || doc.owner, label: 'Document soumis' });
      }

      if (doc.docstatus === 1 && Number(doc.outstanding_amount) === 0 && Number(doc.grand_total) > 0) {
        result.push({ type: 'paid', date: doc.modified, owner: null, label: 'Paiement reçu' });
      }

      if (doc.docstatus === 2) {
        result.push({ type: 'cancelled', date: doc.modified, owner: doc.modified_by || doc.owner, label: 'Document annulé' });
      }

      comments
        .filter(c => c.comment_type === 'Comment' || c.comment_type === 'Info')
        .forEach(c => {
          result.push({ type: 'comment', date: c.creation, owner: c.owner, label: c.content || 'Commentaire' });
        });

      result.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(result);
    } catch {
      setError('Impossible de charger l\'historique');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Activité</h3>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2.5 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 text-center py-6">{error}</p>
      )}

      {!loading && !error && events.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">Aucune activité</p>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="relative">
          <div className="absolute left-3.5 top-2 bottom-2 w-px bg-gray-200" />
          <div className="space-y-0">
            {events.map((ev, i) => {
              const icon = EVENT_ICONS[ev.type] || EVENT_ICONS.comment;
              return (
                <div key={i} className="flex gap-3 relative pb-5 last:pb-0">
                  <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center ${icon.bg}`}>
                    <svg className={`w-3.5 h-3.5 ${icon.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2">
                      {ev.owner && <Avatar name={ev.owner} />}
                      {ev.type === 'comment' ? (
                        <p className="text-sm text-gray-700 italic leading-snug">{ev.label}</p>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{ev.label}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ev.owner && `${ev.owner} · `}{timeAgo(ev.date)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
