import { getPool, sql } from '../../../lib/db'

export default async function handler(req, res) {
  const pool = await getPool()

  if (req.method === 'GET') {
    const { customer_id, status } = req.query
    try {
      let query = `
        SELECT r.ResNum, c.Email AS CustomerEmail, v.LicensePlate,
               vc.ClassName, pb.BranchName AS PickupBranch,
               db.BranchName AS DropoffBranch, r.PickupDateTime,
               r.DropoffDateTime, r.ReservationStatus, r.SpecialRequest,
               pc.Code AS PromoCode, r.CustomerID, r.VIN,
               r.PickupBranchID, r.DropoffBranchID
        FROM Reservation r
        INNER JOIN Customer c ON r.CustomerID = c.CustomerID
        INNER JOIN Vehicle v ON r.VIN = v.VIN
        INNER JOIN VehicleClass vc ON v.ClassID = vc.ClassID
        INNER JOIN Branch pb ON r.PickupBranchID = pb.BranchID
        INNER JOIN Branch db ON r.DropoffBranchID = db.BranchID
        LEFT  JOIN PromoCode pc ON r.PromoCodeID = pc.PromoCodeID
        WHERE 1=1
      `
      const request = pool.request()
      if (customer_id) { query += ' AND r.CustomerID = @cid'; request.input('cid', sql.Int, customer_id) }
      if (status)      { query += ' AND r.ReservationStatus = @status'; request.input('status', sql.VarChar, status) }
      query += ' ORDER BY r.PickupDateTime DESC'
      const result = await request.query(query)
      res.json(result.recordset)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else if (req.method === 'POST') {
    const { customer_id, vin, pickup_branch_id, dropoff_branch_id,
            promo_code_id, pickup_datetime, dropoff_datetime, status, special_request } = req.body
    try {
      const result = await pool.request()
        .input('cid', sql.Int, customer_id)
        .input('vin', sql.Char, vin)
        .input('pickup', sql.Int, pickup_branch_id)
        .input('dropoff', sql.Int, dropoff_branch_id)
        .input('promo', sql.Int, promo_code_id || null)
        .input('pickupDT', sql.DateTime2, pickup_datetime)
        .input('dropoffDT', sql.DateTime2, dropoff_datetime)
        .input('status', sql.VarChar, status || 'Pending')
        .input('special', sql.VarChar, special_request || null)
        .query(`
          INSERT INTO Reservation
            (CustomerID,VIN,PickupBranchID,DropoffBranchID,PromoCodeID,
             PickupDateTime,DropoffDateTime,ReservationStatus,SpecialRequest)
          OUTPUT inserted.ResNum
          VALUES (@cid,@vin,@pickup,@dropoff,@promo,@pickupDT,@dropoffDT,@status,@special)
        `)
      res.status(201).json({ ResNum: result.recordset[0].ResNum })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}
