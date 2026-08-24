import { describe, expect, it } from 'vitest';
import { loadEnv, normalizeCorsOrigin } from './env.js';

const baseEnv = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/smart_campus?schema=public',
  JWT_ACCESS_SECRET: 'test-access-secret-change-me-min-32-chars!!',
  JWT_REFRESH_SECRET: 'test-refresh-secret-change-me-min-32-chars!',
};

describe('loadEnv', () => {
  it('usa PORT quando API_PORT não está definido (Render)', () => {
    const env = loadEnv({ ...baseEnv, PORT: '10000', NODE_ENV: 'test' });
    expect(env.API_PORT).toBe(10000);
  });

  it('prefere API_PORT explícito sobre PORT', () => {
    const env = loadEnv({ ...baseEnv, API_PORT: '4100', PORT: '10000', NODE_ENV: 'test' });
    expect(env.API_PORT).toBe(4100);
  });

  it('normaliza CORS com host sem protocolo', () => {
    const env = loadEnv({
      ...baseEnv,
      CORS_ORIGIN: 'smart-campus-web.onrender.com',
      NODE_ENV: 'test',
    });
    expect(env.CORS_ORIGIN).toBe('https://smart-campus-web.onrender.com');
  });
});

describe('normalizeCorsOrigin', () => {
  it('mantém URL com https', () => {
    expect(normalizeCorsOrigin('https://app.example.com')).toBe('https://app.example.com');
  });
});
