import { getPool, sql } from '../../../lib/db'

export default async function handler(req, res) {
  const pool = await getPool()
  const { id } = req.query

  if (req.method === 'PUT') {
    const { email, drivers_license } = req.body
    try {
      await pool.request()
        .input('email', sql.VarChar, email)
        .input('license', sql.VarChar, drivers_license)
        .input('id', sql.Int, id)
        .query('UPDATE Customer SET Email=@email, DriversLicense=@license WHERE CustomerID=@id')
      res.json({ updated: id })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else if (req.method === 'DELETE') {
    try {
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Customer WHERE CustomerID=@id')
      res.json({ deleted: id })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}
