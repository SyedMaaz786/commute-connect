import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { CommutePost } from '../posts/entities/commute-post.entity.js';
import { Interest } from '../interests/entities/interest.entity.js';

config({ quiet: true });

const currentDir = dirname(fileURLToPath(import.meta.url));

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [User, CommutePost, Interest],
  migrations: [join(currentDir, 'migrations', '*.js')],
  synchronize: false,
});

export default dataSource;
