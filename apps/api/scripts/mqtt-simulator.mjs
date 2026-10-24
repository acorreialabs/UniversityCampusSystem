// Simulador de um ESP32: publica leituras num tópico MQTT.
// Uso: node mqtt-simulator.mjs <topico> [intervaloEmSegundos]
// Ex.:  node mqtt-simulator.mjs campus/building-a/room-a101/env 5
import mqtt from 'mqtt';

const [topic, intervalArg = '5'] = process.argv.slice(2);
if (!topic) {
  console.error('Uso: node mqtt-simulator.mjs <topico> [intervaloEmSegundos]');
  process.exit(1);
}

const url = process.env.MQTT_URL ?? 'mqtt://localhost:1883';
const everyMs = Math.max(1, Number(intervalArg)) * 1000;
const client = mqtt.connect(url);

let temperature = 23;
let humidity = 50;
let battery = 100;

const walk = (v, step, min, max) => Math.min(max, Math.max(min, v + (Math.random() - 0.5) * step));
const round1 = (n) => Math.round(n * 10) / 10;

function publish() {
  temperature = walk(temperature, 0.8, 15, 35);
  humidity = walk(humidity, 2, 30, 80);
  battery = Math.max(0, battery - 0.05);

  const payload = {
    temperature: round1(temperature),
    humidity: round1(humidity),
    rssi: Math.round(-55 - Math.random() * 15),
    battery: Math.round(battery),
  };
  client.publish(topic, JSON.stringify(payload));
  console.log(`-> ${topic} ${JSON.stringify(payload)}`);
}

client.on('connect', () => {
  console.log(`Ligado a ${url}. A publicar de ${intervalArg}s em ${intervalArg}s (Ctrl+C para parar).`);
  publish();
  setInterval(publish, everyMs);
});
client.on('error', (e) => console.error('Erro MQTT:', e.message));
