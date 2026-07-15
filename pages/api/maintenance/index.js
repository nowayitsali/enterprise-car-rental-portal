import { getPool, sql } from '../../../lib/db'

export default async function handler(req, res) {
  const pool = await getPool()

  if (req.method === 'GET') {
    const { vin } = req.query
    try {
      let query = `
        SELECT m.MaintenanceID, m.VIN, v.LicensePlate,
               CONCAT(e.FirstName,' ',e.LastName) AS EmployeeName,
               m.ServiceType, m.MaintenanceDate, m.ServiceCost, m.Notes
        FROM MaintenanceRecord m
        INNER JOIN Vehicle v ON m.VIN = v.VIN
        INNER JOIN Employee e ON m.EmployeeID = e.EmployeeID
        WHERE 1=1
      `
      const request = pool.request()
      if (vin) { query += ' AND m.VIN = @vin'; request.input('vin', sql.Char, vin) }
      query += ' ORDER BY m.MaintenanceDate DESC'
      const result = await request.query(query)
      res.json(result.recordset)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else if (req.method === 'POST') {
    const { vin, employee_id, service_type, maintenance_date, service_cost, notes } = req.body
    try {
      const result = await pool.request()
        .input('vin', sql.Char, vin)
        .input('empId', sql.Int, employee_id)
        .input('type', sql.VarChar, service_type)
        .input('date', sql.Date, maintenance_date)
        .input('cost', sql.Decimal, service_cost || 0)
        .input('notes', sql.VarChar, notes || null)
        .query(`INSERT INTO MaintenanceRecord (VIN,EmployeeID,ServiceType,MaintenanceDate,ServiceCost,Notes)
                OUTPUT inserted.MaintenanceID VALUES (@vin,@empId,@type,@date,@cost,@notes)`)
      res.status(201).json({ MaintenanceID: result.recordset[0].MaintenanceID })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}
