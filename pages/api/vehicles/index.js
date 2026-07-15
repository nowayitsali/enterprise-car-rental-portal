import { getPool, sql } from '../../../lib/db'

export default async function handler(req, res) {
  const pool = await getPool()

  if (req.method === 'GET') {
    const { branch_id, status } = req.query
    try {
      let query = `
        SELECT v.VIN, v.LicensePlate, v.Status, v.BranchID, v.ClassID,
               b.BranchName, vc.ClassName, vc.DailyRate,
               vc.FuelType, vc.TransmissionType, vc.SeatingCapacity
        FROM Vehicle v
        INNER JOIN Branch b ON v.BranchID = b.BranchID
        INNER JOIN VehicleClass vc ON v.ClassID = vc.ClassID
        WHERE 1=1
      `
      const request = pool.request()
      if (branch_id) { query += ' AND v.BranchID = @branch'; request.input('branch', sql.Int, branch_id) }
      if (status)    { query += ' AND v.Status = @status';   request.input('status', sql.VarChar, status) }
      query += ' ORDER BY v.LicensePlate'
      const result = await request.query(query)
      res.json(result.recordset)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else if (req.method === 'POST') {
    const { vin, license_plate, status, branch_id, class_id } = req.body
    try {
      await pool.request()
        .input('vin', sql.Char, vin)
        .input('plate', sql.VarChar, license_plate)
        .input('status', sql.VarChar, status || 'Available')
        .input('branch', sql.Int, branch_id)
        .input('class', sql.Int, class_id)
        .query('INSERT INTO Vehicle (VIN,LicensePlate,Status,BranchID,ClassID) VALUES (@vin,@plate,@status,@branch,@class)')
      res.status(201).json({ VIN: vin })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}
