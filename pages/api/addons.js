import { getPool } from '../../lib/db'

export default async function handler(req, res) {
  try {
    const pool = await getPool()
    const result = await pool.request().query('SELECT * FROM AddOnService ORDER BY AddOnID')
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
