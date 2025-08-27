import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
plugins: [react()],
base: '/norwegian-learner-v1/', // change to your repo name
});