import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
    server: {
      deps: {
        inline: ['express', 'supertest', 'mime-db', 'mime-types', 'body-parser', 'raw-body'],
      },
    },
  },
});
