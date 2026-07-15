import { getPool, sql } from '../../../lib/db'

export default async function handler(req, res) {
  const pool = await getPool()
  const { vin } = req.query

  if (req.method === 'PUT') {
    const { license_plate, status, branch_id, class_id } = req.body
    try {
      await pool.request()
        .input('plate', sql.VarChar, license_plate)
        .input('status', sql.VarChar, status)
        .input('branch', sql.Int, branch_id)
        .input('class', sql.Int, class_id)
        .input('vin', sql.Char, vin)
        .query('UPDATE Vehicle SET LicensePlate=@plate,Status=@status,BranchID=@branch,ClassID=@class WHERE VIN=@vin')
      res.json({ updated: vin })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else if (req.method === 'DELETE') {
    try {
      await pool.request()
        .input('vin', sql.Char, vin)
        .query('DELETE FROM Vehicle WHERE VIN=@vin')
      res.json({ deleted: vin })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}
