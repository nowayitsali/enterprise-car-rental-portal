import sql from 'mssql'

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

// Reuse the pool across hot-reloads in dev
let pool

export async function getPool() {
  if (!pool) {
    pool = await sql.connect(config)
  }
  return pool
}

export { sql }
