import { FormEvent, useEffect, useState } from 'react';
import type { RoomDto } from '@smart-campus/shared-types';
import { useAuth } from '../lib/auth';
import { PageIntro } from '../components/PageIntro';

type Building = { id: string; code: string; name: string };

export function RoomsPage() {
  const { api, user } = useAuth();
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', capacity: 30, floor: 1, buildingId: '' });
  const canManage = user && ['ADMIN', 'COORDINATOR', 'TECHNICIAN'].includes(user.role);

  async function load() {
    const [roomsRes, buildingsRes] = await Promise.all([
      api.rooms(),
      fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/buildings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sc_access')}` },
      }).then((r) => r.json()),
    ]);
    setRooms(roomsRes.data);
    setBuildings((buildingsRes.data ?? []).map((b: Building) => ({ id: b.id, code: b.code, name: b.name })));
    if (!form.buildingId && buildingsRes.data?.[0]) {
      setForm((f) => ({ ...f, buildingId: buildingsRes.data[0].id }));
    }
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.createRoom({
        code: form.code,
        name: form.name,
        capacity: Number(form.capacity),
        floor: Number(form.floor),
        buildingId: form.buildingId,
      });
      setForm((f) => ({ ...f, code: '', name: '' }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar sala');
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Infraestrutura"
        title="Salas"
        description="Módulo funcional do Core — gestão de salas e disponibilidade."
      />

      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {canManage ? (
        <form onSubmit={onCreate} className="surface grid gap-3 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-5">
          <input className="field-input !mt-0" placeholder="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <input className="field-input !mt-0" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="field-input !mt-0" type="number" placeholder="Capacidade" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} required />
          <select className="field-input !mt-0" value={form.buildingId} onChange={(e) => setForm({ ...form, buildingId: e.target.value })} required>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} — {b.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary w-full md:w-auto xl:w-full">
            Criar sala
          </button>
        </form>
      ) : null}

      <div className="surface table-scroll">
        <table className="min-w-[640px] text-left text-sm">
          <thead className="bg-campus-mist/80 text-campus-deep">
            <tr>
              <th className="px-4 py-3 font-semibold">Código</th>
              <th className="px-4 py-3 font-semibold">Nome</th>
              <th className="px-4 py-3 font-semibold">Edifício</th>
              <th className="px-4 py-3 font-semibold">Capacidade</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="border-t border-campus-line/70">
                <td className="px-4 py-3 font-medium">{room.code}</td>
                <td className="px-4 py-3">{room.name}</td>
                <td className="px-4 py-3">{room.building.code}</td>
                <td className="px-4 py-3">{room.capacity}</td>
                <td className="px-4 py-3">{room.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
