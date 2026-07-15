import { getPool } from '../../lib/db'

export default async function handler(req, res) {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Customer) AS customers,
        (SELECT COUNT(*) FROM Vehicle WHERE Status = 'Available') AS available_vehicles,
        (SELECT COUNT(*) FROM Reservation WHERE ReservationStatus IN ('Confirmed','Active')) AS active_reservations,
        (SELECT ISNULL(SUM(Amount),0) FROM Payment WHERE PaymentStatus = 'Completed') AS total_revenue
    `)
    res.json(result.recordset[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
