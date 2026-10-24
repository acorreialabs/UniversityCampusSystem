import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import type { NotificationDto } from '@smart-campus/shared-types';

export function NotificationsPage() {
  const { api } = useAuth();
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await api.notifications();
    setItems(res.data);
  }

  useEffect(() => {
    load()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [api]);

  async function onRead(id: string) {
    setError(null);
    setBusyId(id);
    try {
      await api.markNotificationRead(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar notificação');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-campus-line bg-white/85 p-5 shadow-panel">
        <h2 className="font-display text-2xl">Notificações</h2>
        <p className="mt-1 text-sm text-campus-deep/75">As tuas notificações, da mais recente para a mais antiga.</p>
      </section>

      {error ? <p className="text-red-700">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-campus-deep/70">A carregar notificações…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-campus-deep/70">Não tens notificações.</p>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <article
              key={n.id}
              className={`rounded-2xl border p-4 shadow-panel ${
                n.readAt ? 'border-campus-line bg-white' : 'border-campus-teal bg-white ring-2 ring-campus-teal/15'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">{n.title}</h3>
                <span className="text-xs text-campus-deep/60">{new Date(n.createdAt).toLocaleString('pt-PT')}</span>
              </div>
              <p className="mt-1 text-sm text-campus-deep/75">{n.body}</p>
              <div className="mt-3 text-xs">
                {n.readAt ? (
                  <span className="text-campus-deep/60">Lida</span>
                ) : (
                  <button type="button" disabled={busyId === n.id} onClick={() => onRead(n.id)} className="btn-primary">
                    {busyId === n.id ? 'A marcar…' : 'Marcar como lida'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}