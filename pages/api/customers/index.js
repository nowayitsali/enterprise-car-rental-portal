import { getPool, sql } from '../../../lib/db'

export default async function handler(req, res) {
  const pool = await getPool()

  if (req.method === 'GET') {
    try {
      const result = await pool.request().query(`
        SELECT c.CustomerID, c.Email, c.DriversLicense,
               la.Tier, la.PointsBalance
        FROM Customer c
        LEFT JOIN LoyalAccount la ON c.CustomerID = la.CustomerID
        ORDER BY c.CustomerID
      `)
      res.json(result.recordset)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else if (req.method === 'POST') {
    const { email, drivers_license } = req.body
    try {
      const result = await pool.request()
        .input('email', sql.VarChar, email)
        .input('license', sql.VarChar, drivers_license)
        .query('INSERT INTO Customer (Email, DriversLicense) OUTPUT inserted.CustomerID VALUES (@email, @license)')
      res.status(201).json({ CustomerID: result.recordset[0].CustomerID })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}
