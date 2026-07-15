import { getPool, sql } from '../../../lib/db'

export default async function handler(req, res) {
  const pool = await getPool()

  if (req.method === 'GET') {
    const { res_num } = req.query
    try {
      let query = `
        SELECT p.PaymentID, p.ResNum, p.PaymentDate, p.TransactionReference,
               p.PaymentStatus, p.PaymentType, p.Amount,
               cc.CardLastFour, cc.CardType
        FROM Payment p
        LEFT JOIN CreditCard cc ON p.CreditCardID = cc.CreditCardID
        WHERE 1=1
      `
      const request = pool.request()
      if (res_num) { query += ' AND p.ResNum = @resNum'; request.input('resNum', sql.Int, res_num) }
      query += ' ORDER BY p.PaymentDate DESC'
      const result = await request.query(query)
      res.json(result.recordset)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else if (req.method === 'POST') {
    const { res_num, credit_card_id, payment_type, status, amount } = req.body
    const txnRef = `TXN-${res_num}-${Date.now().toString(36).toUpperCase()}`
    try {
      const result = await pool.request()
        .input('resNum', sql.Int, res_num)
        .input('cardId', sql.Int, credit_card_id || null)
        .input('txn', sql.VarChar, txnRef)
        .input('status', sql.VarChar, status || 'Completed')
        .input('type', sql.VarChar, payment_type)
        .input('amount', sql.Decimal, amount)
        .query(`INSERT INTO Payment (ResNum,CreditCardID,TransactionReference,PaymentStatus,PaymentType,Amount)
                OUTPUT inserted.PaymentID VALUES (@resNum,@cardId,@txn,@status,@type,@amount)`)
      res.status(201).json({ PaymentID: result.recordset[0].PaymentID })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}
