import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parse } from 'dotenv';
import pg from 'pg';

const backend = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const root = path.dirname(backend);
const directory = path.join(root, '.local', 'postgres');
const dev = parse(fs.readFileSync(path.join(backend, '.env')));
const database = new URL(dev.DATABASE_URL);
if (
  !['localhost', '127.0.0.1'].includes(database.hostname) ||
  database.port !== '5433'
) {
  throw new Error(
    'This helper manages only the local development database on port 5433. Use your configured database directly.',
  );
}
const windows = process.platform === 'win32';
let bin = process.env.POSTGRES_BIN || '';
if (!bin && windows) {
  const installations = path.join(
    process.env.ProgramFiles || 'C:/Program Files',
    'PostgreSQL',
  );
  const version = fs
    .readdirSync(installations)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
  bin = path.join(installations, version, 'bin');
}
const executable = (name) =>
  bin ? path.join(bin, name + (windows ? '.exe' : '')) : name;
function run(name, args, allowFailure = false) {
  const result = spawnSync(executable(name), args, {
    encoding: 'utf8',
    windowsHide: true,
    ...(name === 'pg_ctl' ? { stdio: 'ignore' } : {}),
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure)
    throw new Error(result.stderr || result.stdout || `${name} failed`);
  return result;
}

if (process.argv.includes('--stop')) {
  if (fs.existsSync(path.join(directory, 'postmaster.pid')))
    run('pg_ctl', ['-D', directory, 'stop', '-m', 'fast', '-w']);
  console.log('Workspace PostgreSQL stopped.');
} else {
  fs.mkdirSync(path.dirname(directory), { recursive: true });
  if (!fs.existsSync(path.join(directory, 'PG_VERSION'))) {
    const passwordFile = path.join(root, '.local', '.postgres-init-password');
    fs.writeFileSync(passwordFile, decodeURIComponent(database.password), {
      mode: 0o600,
    });
    try {
      run('initdb', [
        '-D',
        directory,
        '-U',
        decodeURIComponent(database.username),
        '--pwfile',
        passwordFile,
        '--auth=scram-sha-256',
        '--encoding=UTF8',
        '--locale=C',
      ]);
    } finally {
      fs.unlinkSync(passwordFile);
    }
  }
  if (run('pg_ctl', ['-D', directory, 'status'], true).status !== 0) {
    run('pg_ctl', [
      '-D',
      directory,
      '-l',
      path.join(root, '.local', 'postgres.log'),
      '-o',
      '-h 127.0.0.1 -p 5433',
      '-w',
      'start',
    ]);
  }
  const admin = new URL(database);
  admin.pathname = '/postgres';
  const client = new pg.Client({ connectionString: admin.href });
  await client.connect();
  try {
    for (const file of ['.env', '.env.test']) {
      if (!fs.existsSync(path.join(backend, file))) continue;
      const url = new URL(
        parse(fs.readFileSync(path.join(backend, file))).DATABASE_URL,
      );
      if (
        url.host !== database.host ||
        url.username !== database.username ||
        url.password !== database.password
      ) {
        throw new Error(
          `${file} must use the same local PostgreSQL connection as .env.`,
        );
      }
      const name = decodeURIComponent(url.pathname.slice(1));
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name))
        throw new Error('Use a simple local database name.');
      const exists = await client.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [name],
      );
      if (!exists.rowCount) await client.query(`CREATE DATABASE "${name}"`);
    }
  } finally {
    await client.end();
  }
  console.log(
    'Workspace PostgreSQL is ready on localhost:5433. Run the development and test migrations.',
  );
}
