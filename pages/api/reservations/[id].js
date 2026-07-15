import { getPool, sql } from '../../../lib/db'

export default async function handler(req, res) {
  const pool = await getPool()
  const { id } = req.query

  if (req.method === 'PUT') {
    const { status, special_request, pickup_datetime, dropoff_datetime } = req.body
    try {
      await pool.request()
        .input('status', sql.VarChar, status)
        .input('special', sql.VarChar, special_request || null)
        .input('pickupDT', sql.DateTime2, pickup_datetime)
        .input('dropoffDT', sql.DateTime2, dropoff_datetime)
        .input('id', sql.Int, id)
        .query(`UPDATE Reservation
                SET ReservationStatus=@status, SpecialRequest=@special,
                    PickupDateTime=@pickupDT, DropoffDateTime=@dropoffDT
                WHERE ResNum=@id`)
      res.json({ updated: id })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else if (req.method === 'DELETE') {
    try {
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Reservation WHERE ResNum=@id')
      res.json({ deleted: id })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}
