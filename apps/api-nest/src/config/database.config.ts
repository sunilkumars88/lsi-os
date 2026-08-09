import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const url =
    process.env.DATABASE_URL ??
    'postgresql://eios:eios_secret@localhost:5432/eios';
  const isSqlite = url.startsWith('sqlite');

  return {
    url,
    isSqlite,
    synchronize: process.env.DB_SYNCHRONIZE !== 'false',
    logging: process.env.DB_LOGGING === 'true',
  };
});
