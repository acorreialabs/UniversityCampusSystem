import net from 'node:net';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-change-me-min-32-chars';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-change-me-min-32!!';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

/**
 * Base de dados dos testes:
 * 1. DATABASE_URL explícito tem prioridade (CI/docker).
 * 2. Contêiner docker-compose (localhost:5436), quando estiver activo.
 * 3. Banco `smart_campus_test` no Postgres local (5432) — nunca o de desenvolvimento,
 *    para que os testes não contaminem os dados reais e vice-versa.
 * Criar/actualizar: npx prisma migrate deploy && npx tsx prisma/seed.ts
 *   (com DATABASE_URL a apontar para smart_campus_test).
 */
const DOCKER_TEST_URL = 'postgresql://smartcampus:smartcampus@localhost:5436/smart_campus?schema=public';
const LOCAL_TEST_URL = 'postgresql://smartcampus:smartcampus@localhost:5432/smart_campus_test?schema=public';

function isListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    const done = (ok: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(300, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = (await isListening(5436)) ? DOCKER_TEST_URL : LOCAL_TEST_URL;
}
