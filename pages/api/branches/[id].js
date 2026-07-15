import { getPool, sql } from '../../../lib/db'

export default async function handler(req, res) {
  const pool = await getPool()
  const { id } = req.query

  if (req.method === 'PUT') {
    const { name, street, city, province, postal_code, phone } = req.body
    try {
      await pool.request()
        .input('name', sql.VarChar, name)
        .input('street', sql.VarChar, street)
        .input('city', sql.VarChar, city)
        .input('province', sql.Char, province)
        .input('postal', sql.VarChar, postal_code)
        .input('phone', sql.VarChar, phone)
        .input('id', sql.Int, id)
        .query('UPDATE Branch SET BranchName=@name,Street=@street,City=@city,Province=@province,PostalCode=@postal,PhoneNo=@phone WHERE BranchID=@id')
      res.json({ updated: id })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else if (req.method === 'DELETE') {
    try {
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Branch WHERE BranchID=@id')
      res.json({ deleted: id })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}
