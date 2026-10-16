import { spawn } from 'node:child_process';

const port = process.env.PORT || '4173';
spawn('python3', ['-m', 'http.server', port, '--bind', '127.0.0.1'], { cwd: new URL('../', import.meta.url), stdio: 'inherit' });
