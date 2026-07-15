import { getPool, sql } from '../../../lib/db'

export default async function handler(req, res) {
  const pool = await getPool()
  const { id } = req.query

  if (req.method === 'DELETE') {
    try {
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM MaintenanceRecord WHERE MaintenanceID=@id')
      res.json({ deleted: id })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}
