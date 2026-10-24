import mqtt from 'mqtt';
import { prisma } from '../../../lib/prisma.js';
import { raiseDeviceAlert } from '../../devices/application/alertService.js';

const MQTT_URL = process.env.MQTT_URL ?? 'mqtt://localhost:1883';
/** Sem mensagens durante este tempo -> o device passa a OFFLINE (por omissão 2 min). */
const OFFLINE_AFTER_MS = Number(process.env.DEVICE_OFFLINE_AFTER_MS ?? 120_000);
const WATCHDOG_EVERY_MS = 30_000;
const REFRESH_TOPICS_EVERY_MS = 60_000;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** RSSI (dBm) -> percentagem aproximada: -100 dBm = 0 %, -50 dBm = 100 %. */
const rssiToPercent = (rssi: number) => Math.round(clamp(2 * (rssi + 100), 0, 100));

export function startMqttIngest() {
  const client = mqtt.connect(MQTT_URL);
  const topicToDevice = new Map<string, string>();

  async function refreshSubscriptions() {
    const devices = await prisma.device.findMany({
      where: { mqttTopic: { not: null } },
      select: { id: true, mqttTopic: true },
    });

    const wanted = new Map(devices.map((d) => [d.mqttTopic as string, d.id]));

    for (const [topic] of topicToDevice) {
      if (!wanted.has(topic)) {
        client.unsubscribe(topic);
        topicToDevice.delete(topic);
      }
    }
    for (const [topic, id] of wanted) {
      if (!topicToDevice.has(topic)) {
        client.subscribe(topic);
      }
      topicToDevice.set(topic, id);
    }
  }

  async function handleMessage(topic: string, raw: Buffer) {
    const deviceId = topicToDevice.get(topic);
    if (!deviceId) return;

    let payload: Record<string, unknown>;
    try {
      const parsed = JSON.parse(raw.toString('utf8'));
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return;
      payload = parsed as Record<string, unknown>;
    } catch {
      console.warn(`[mqtt] payload inválido em ${topic}`);
      return;
    }

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { sensors: true },
    });
    if (!device) return;

    const readings = device.sensors.flatMap((s) => {
      const value = payload[s.metric];
      return isNum(value) ? [{ sensorId: s.id, value, isDemo: false }] : [];
    });

    const signal = isNum(payload.rssi)
      ? rssiToPercent(payload.rssi)
      : isNum(payload.signal)
        ? Math.round(clamp(payload.signal, 0, 100))
        : undefined;
    const battery = isNum(payload.battery) ? Math.round(clamp(payload.battery, 0, 100)) : undefined;

    await prisma.$transaction(async (tx) => {
      if (readings.length > 0) await tx.reading.createMany({ data: readings });

      await tx.device.update({
        where: { id: device.id },
        data: {
          lastSeenAt: new Date(),
          ...(signal !== undefined ? { signal } : {}),
          ...(battery !== undefined ? { battery } : {}),
        },
      });

      // MAINTENANCE é decisão humana: a telemetria não a altera.
      // A transição é atómica: só a mensagem que muda mesmo o estado cria o alerta.
      const res = await tx.device.updateMany({
        where: { id: device.id, status: { in: ['OFFLINE', 'UNKNOWN'] } },
        data: { status: 'ONLINE' },
      });
      if (res.count > 0) await raiseDeviceAlert(tx, device, device.status, 'ONLINE');
    });
  }

  async function watchdog() {
    const cutoff = new Date(Date.now() - OFFLINE_AFTER_MS);
    // lastSeenAt null = nunca enviou telemetria (ex.: ONLINE posto à mão): não mexer
    const stale = await prisma.device.findMany({
      where: { status: 'ONLINE', lastSeenAt: { lt: cutoff } },
    });

    for (const device of stale) {
      await prisma.$transaction(async (tx) => {
        const res = await tx.device.updateMany({
          where: { id: device.id, status: 'ONLINE' },
          data: { status: 'OFFLINE' },
        });
        if (res.count > 0) await raiseDeviceAlert(tx, device, 'ONLINE', 'OFFLINE');
      });
    }
  }

  client.on('connect', () => {
    console.log(`[mqtt] ligado a ${MQTT_URL}`);
    refreshSubscriptions().catch((e) => console.error('[mqtt] refresh falhou', e));
  });
  client.on('error', (e) => console.error('[mqtt] erro', e.message));
  client.on('message', (topic, raw) => {
    handleMessage(topic, raw).catch((e) => console.error('[mqtt] mensagem falhou', e));
  });

  const refreshTimer = setInterval(() => {
    if (client.connected) refreshSubscriptions().catch((e) => console.error('[mqtt] refresh falhou', e));
  }, REFRESH_TOPICS_EVERY_MS);
  const watchdogTimer = setInterval(() => {
    watchdog().catch((e) => console.error('[mqtt] watchdog falhou', e));
  }, WATCHDOG_EVERY_MS);

  return () => {
    clearInterval(refreshTimer);
    clearInterval(watchdogTimer);
    client.end();
  };
}