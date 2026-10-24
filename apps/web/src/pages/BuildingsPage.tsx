import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';

type Building = { id: string; code: string; name: string; floors: number; _count?: { rooms: number } };

export function BuildingsPage() {
  const { api: _api } = useAuth();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/buildings`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('sc_access')}` },
    })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.message || 'Erro');
        setBuildings(json.data);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-campus-line bg-white/85 p-5 shadow-panel">
        <h2 className="font-display text-2xl">Edifícios</h2>
        <p className="mt-1 text-sm text-campus-deep/75">Funcionalidade inicial — listagem a partir do Core.</p>
      </section>
      {error ? <p className="text-red-700">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {buildings.map((b) => (
          <article key={b.id} className="rounded-2xl border border-campus-line bg-white p-5 shadow-panel">
            <h3 className="font-medium text-campus-ink">
              {b.code} — {b.name}
            </h3>
            <p className="mt-2 text-sm text-campus-deep/70">
              {b.floors} pisos · {b._count?.rooms ?? '—'} salas
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
