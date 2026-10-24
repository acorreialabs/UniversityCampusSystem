import type { DeviceDto, DeviceStatus } from '@smart-campus/shared-types';

const statusStyle: Record<DeviceStatus, string> = {
  ONLINE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  OFFLINE: 'bg-slate-100 text-slate-600 border-slate-200',
  MAINTENANCE: 'bg-amber-50 text-amber-900 border-amber-200',
  UNKNOWN: 'bg-slate-100 text-slate-500 border-slate-200',
};

const STATUSES: DeviceStatus[] = ['ONLINE', 'OFFLINE', 'MAINTENANCE', 'UNKNOWN'];

type DeviceCardProps = {
  device: DeviceDto;
  onDelete?: (device: DeviceDto) => void | Promise<void>;
  onStatusChange?: (device: DeviceDto, status: DeviceStatus) => void | Promise<void>;
};

export function DeviceCard({ device, onDelete, onStatusChange }: DeviceCardProps) {
  return (
    <article className="rounded-2xl border border-campus-line/80 bg-white/90 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-semibold tracking-wide text-campus-teal">{device.code}</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-campus-ink">{device.name}</h3>
          <p className="mt-1 text-xs text-campus-deep/65">
            {device.type} · {device.room ? `${device.room.code} ${device.room.name}` : 'Sem sala'}
          </p>
        </div>
        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${statusStyle[device.status]}`}>
          {device.status}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-xs text-campus-deep/70">
        <p>Tópico MQTT: {device.mqttTopic ?? '—'}</p>
        {device.sensors.length === 0 ? (
          <p>Sem sensores associados</p>
        ) : (
          device.sensors.map((s) => (
            <p key={s.id}>
              Sensor: {s.name} ({s.metric}
              {s.unit ? `, ${s.unit}` : ''})
            </p>
          ))
        )}
      </div>

      {onStatusChange || onDelete ? (
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-campus-line/60 pt-3">
          {onStatusChange ? (
            <select
              value={device.status}
              onChange={(e) => onStatusChange(device, e.target.value as DeviceStatus)}
              className="rounded-xl border border-campus-line bg-white px-2 py-1.5 text-xs font-semibold"
              aria-label={`Estado de ${device.code}`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <span />
          )}
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(device)}
              className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
            >
              Eliminar
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}