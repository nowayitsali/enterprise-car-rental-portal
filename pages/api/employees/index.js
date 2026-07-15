import { getPool, sql } from '../../../lib/db'

export default async function handler(req, res) {
  const pool = await getPool()

  if (req.method === 'GET') {
    try {
      const result = await pool.request().query('SELECT * FROM Employee ORDER BY EmployeeID')
      res.json(result.recordset)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else if (req.method === 'POST') {
    const { first_name, last_name, phone, role, email } = req.body
    try {
      const result = await pool.request()
        .input('fn', sql.VarChar, first_name)
        .input('ln', sql.VarChar, last_name)
        .input('phone', sql.VarChar, phone)
        .input('role', sql.VarChar, role)
        .input('email', sql.VarChar, email)
        .query(`INSERT INTO Employee (FirstName,LastName,PhoneNo,Role,Email)
                OUTPUT inserted.EmployeeID VALUES (@fn,@ln,@phone,@role,@email)`)
      res.status(201).json({ EmployeeID: result.recordset[0].EmployeeID })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}
