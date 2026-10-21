import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const checks = ['check:responsive', 'check:mobile'];
const failures = [];

function run(script) {
  return new Promise(resolve => {
    const child = spawn(npm, ['run', script], {
      env: process.env,
      stdio: 'inherit'
    });
    child.once('error', error => {
      console.error(`Não foi possível iniciar npm run ${script}:`, error);
      resolve(1);
    });
    child.once('exit', (code, signal) => {
      if (signal) console.error(`npm run ${script} foi interrompido por ${signal}.`);
      resolve(code ?? 1);
    });
  });
}

for (const script of checks) {
  const status = await run(script);
  if (status !== 0) failures.push(script);
}

if (failures.length) {
  console.error(`Validações de navegador com falha: ${failures.join(', ')}.`);
  process.exitCode = 1;
} else {
  console.log('Validações responsivas e de interação concluídas.');
}
