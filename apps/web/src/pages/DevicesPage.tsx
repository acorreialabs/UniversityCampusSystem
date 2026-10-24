import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { DeviceDto, DeviceStatus } from '@smart-campus/shared-types';
import { DeviceCard } from '../components/iot/DeviceCard';
import { PageIntro } from '../components/PageIntro';

export function DevicesPage() {
  const { api, user } = useAuth();
  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | DeviceStatus>('ALL');
  const [form, setForm] = useState({ code: '', name: '', type: '' });
  const [saving, setSaving] = useState(false);

  const canManage = !!user && ['ADMIN', 'COORDINATOR', 'TECHNICIAN'].includes(user.role);
  const canDelete = !!user && ['ADMIN', 'COORDINATOR'].includes(user.role);

  async function load() {
    const res = await api.devices();
    setDevices(res.data);
  }

  useEffect(() => {
    load()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [api]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.createDevice({
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type.trim(),
      });
      setForm({ code: '', name: '', type: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar dispositivo');
    } finally {
      setSaving(false);
    }
  }

  
  async function onDelete(device: DeviceDto) {
    if (!window.confirm(`Eliminar o dispositivo ${device.code}?`)) return;
    setError(null);
    try {
      await api.deleteDevice(device.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao eliminar dispositivo');
    }
  }

  async function onStatusChange(device: DeviceDto, status: DeviceStatus) {
  if (status === device.status) return;
  setError(null);
  try {
    await api.updateDeviceStatus(device.id, { status });
    await load();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Erro ao actualizar o estado');
  }
}


  const filtered = devices.filter((d) => (filter === 'ALL' ? true : d.status === filter));

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Inventário IoT"
        title="Dispositivos"
        description="Dispositivos registados no Core, com a sala e os sensores associados."
        actions={
          <Link to="/iot" className="btn-primary">
            Ver hub IoT
          </Link>
        }
      />

      {canManage ? (
        <form onSubmit={onCreate} className="grid gap-3 rounded-2xl border border-campus-line bg-white p-4 sm:grid-cols-4">
          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="Código (ex.: TEMP-A-01)"
            required
            minLength={2}
            className="rounded-xl border border-campus-line px-3 py-2 text-sm"
          />
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nome"
            required
            minLength={2}
            className="rounded-xl border border-campus-line px-3 py-2 text-sm"
          />
          <input
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            placeholder="Tipo (ex.: sensor)"
            required
            minLength={2}
            className="rounded-xl border border-campus-line px-3 py-2 text-sm"
          />
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'A criar…' : 'Criar dispositivo'}
          </button>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(['ALL', 'ONLINE', 'MAINTENANCE', 'OFFLINE', 'UNKNOWN'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition ${
              filter === f
                ? 'border-campus-teal bg-campus-teal text-white'
                : 'border-campus-line bg-white text-campus-deep/75 hover:bg-campus-mist'
            }`}
          >
            {f === 'ALL' ? 'Todos' : f}
          </button>
        ))}
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-campus-deep/70">A carregar dispositivos…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-campus-deep/70">Nenhum dispositivo para mostrar.</p>
      ) : (
   <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
  {filtered.map((device) => (
    <DeviceCard
      key={device.id}
      device={device}
      onDelete={canDelete ? onDelete : undefined}
      onStatusChange={canManage ? onStatusChange : undefined}
    />
  ))}
</div>
      )}
    </div>
  );
}