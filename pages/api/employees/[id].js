import { getPool, sql } from '../../../lib/db'

export default async function handler(req, res) {
  const pool = await getPool()
  const { id } = req.query

  if (req.method === 'PUT') {
    const { first_name, last_name, phone, role, email } = req.body
    try {
      await pool.request()
        .input('fn', sql.VarChar, first_name)
        .input('ln', sql.VarChar, last_name)
        .input('phone', sql.VarChar, phone)
        .input('role', sql.VarChar, role)
        .input('email', sql.VarChar, email)
        .input('id', sql.Int, id)
        .query('UPDATE Employee SET FirstName=@fn,LastName=@ln,PhoneNo=@phone,Role=@role,Email=@email WHERE EmployeeID=@id')
      res.json({ updated: id })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else if (req.method === 'DELETE') {
    try {
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Employee WHERE EmployeeID=@id')
      res.json({ deleted: id })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}
