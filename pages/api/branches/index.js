import { getPool, sql } from '../../../lib/db'

export default async function handler(req, res) {
  const pool = await getPool()

  if (req.method === 'GET') {
    try {
      const result = await pool.request().query('SELECT * FROM Branch ORDER BY BranchID')
      res.json(result.recordset)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else if (req.method === 'POST') {
    const { name, street, city, province, postal_code, phone } = req.body
    try {
      const result = await pool.request()
        .input('name', sql.VarChar, name)
        .input('street', sql.VarChar, street)
        .input('city', sql.VarChar, city)
        .input('province', sql.Char, province)
        .input('postal', sql.VarChar, postal_code)
        .input('phone', sql.VarChar, phone)
        .query(`INSERT INTO Branch (BranchName,Street,City,Province,PostalCode,PhoneNo)
                OUTPUT inserted.BranchID VALUES (@name,@street,@city,@province,@postal,@phone)`)
      res.status(201).json({ BranchID: result.recordset[0].BranchID })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}
