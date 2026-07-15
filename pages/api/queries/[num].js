import { getPool } from '../../../lib/db'

const QUERIES = {
  1: {
    title: 'Detailed Reservation Report',
    sql: `
      SELECT r.ResNum, c.Email AS CustomerEmail, v.LicensePlate,
             vc.ClassName, pb.BranchName AS PickupBranch,
             db.BranchName AS DropoffBranch, r.PickupDateTime,
             r.DropoffDateTime, r.ReservationStatus, pc.Code AS PromoCode
      FROM Reservation r
      INNER JOIN Customer c ON r.CustomerID = c.CustomerID
      INNER JOIN Vehicle v ON r.VIN = v.VIN
      INNER JOIN VehicleClass vc ON v.ClassID = vc.ClassID
      INNER JOIN Branch pb ON r.PickupBranchID = pb.BranchID
      INNER JOIN Branch db ON r.DropoffBranchID = db.BranchID
      LEFT  JOIN PromoCode pc ON r.PromoCodeID = pc.PromoCodeID
      ORDER BY r.PickupDateTime
    `,
  },
  2: {
    title: 'Customers with 2+ Reservations',
    sql: `
      SELECT c.CustomerID, c.Email, COUNT(r.ResNum) AS NumberOfReservations
      FROM Customer c
      INNER JOIN Reservation r ON c.CustomerID = r.CustomerID
      GROUP BY c.CustomerID, c.Email
      HAVING COUNT(r.ResNum) >= 2
      ORDER BY NumberOfReservations DESC
    `,
  },
  3: {
    title: 'Revenue by Branch',
    sql: `
      SELECT b.BranchID, b.BranchName,
             COUNT(DISTINCT r.ResNum) AS PaidReservations,
             SUM(p.Amount) AS TotalCollected
      FROM Branch b
      INNER JOIN Reservation r ON b.BranchID = r.PickupBranchID
      INNER JOIN Payment p ON r.ResNum = p.ResNum
      WHERE p.PaymentStatus = 'Completed'
      GROUP BY b.BranchID, b.BranchName
      HAVING SUM(p.Amount) > 100
      ORDER BY TotalCollected DESC
    `,
  },
  4: {
    title: 'Vehicle Maintenance Summary',
    sql: `
      SELECT v.VIN, v.LicensePlate, v.Status,
             COUNT(m.MaintenanceID) AS NumberOfServices,
             MAX(m.MaintenanceDate) AS MostRecentService
      FROM Vehicle v
      LEFT JOIN MaintenanceRecord m ON v.VIN = m.VIN
      GROUP BY v.VIN, v.LicensePlate, v.Status
      ORDER BY NumberOfServices DESC, v.LicensePlate
    `,
  },
  5: {
    title: 'Available Vehicles by Branch & Class',
    sql: `
      SELECT b.BranchName, vc.ClassName, COUNT(v.VIN) AS AvailableCount
      FROM Branch b
      INNER JOIN Vehicle v ON b.BranchID = v.BranchID
      INNER JOIN VehicleClass vc ON v.ClassID = vc.ClassID
      WHERE v.Status = 'Available'
      GROUP BY b.BranchName, vc.ClassName
      HAVING COUNT(v.VIN) >= 1
      ORDER BY b.BranchName, vc.ClassName
    `,
  },
  6: {
    title: 'Estimated Reservation Totals',
    sql: `
      WITH ReservationBase AS (
        SELECT r.ResNum,
               DATEDIFF(DAY, r.PickupDateTime, r.DropoffDateTime) AS RentalDays,
               vc.DailyRate,
               COALESCE(SUM(aos.DailyFee * ra.Quantity *
                 DATEDIFF(DAY, r.PickupDateTime, r.DropoffDateTime)), 0) AS AddOnTotal,
               pc.DiscountType, pc.DiscountValue
        FROM Reservation r
        INNER JOIN Vehicle v ON r.VIN = v.VIN
        INNER JOIN VehicleClass vc ON v.ClassID = vc.ClassID
        LEFT JOIN ReservationAddOn ra ON r.ResNum = ra.ResNum
        LEFT JOIN AddOnService aos ON ra.AddOnID = aos.AddOnID
        LEFT JOIN PromoCode pc ON r.PromoCodeID = pc.PromoCodeID
        GROUP BY r.ResNum, r.PickupDateTime, r.DropoffDateTime,
                 vc.DailyRate, pc.DiscountType, pc.DiscountValue
      )
      SELECT ResNum, RentalDays, DailyRate,
             CAST(RentalDays * DailyRate AS DECIMAL(10,2)) AS BaseRentalTotal,
             CAST(AddOnTotal AS DECIMAL(10,2)) AS AddOnTotal,
             CAST(
               CASE
                 WHEN DiscountType = 'Percentage'
                   THEN ((RentalDays * DailyRate) + AddOnTotal) * (1 - DiscountValue / 100.0)
                 WHEN DiscountType = 'Fixed'
                   THEN CASE WHEN ((RentalDays * DailyRate) + AddOnTotal) - DiscountValue < 0
                             THEN 0
                             ELSE ((RentalDays * DailyRate) + AddOnTotal) - DiscountValue END
                 ELSE (RentalDays * DailyRate) + AddOnTotal
               END AS DECIMAL(10,2)
             ) AS EstimatedTotal
      FROM ReservationBase
      ORDER BY ResNum
    `,
  },
  7: {
    title: 'Customers Without Loyalty Account',
    sql: `
      SELECT c.CustomerID, c.Email, c.DriversLicense
      FROM Customer c
      LEFT JOIN LoyalAccount la ON c.CustomerID = la.CustomerID
      WHERE la.AccountID IS NULL
      ORDER BY c.CustomerID
    `,
  },
  8: {
    title: 'Employee Maintenance Workload',
    sql: `
      SELECT e.EmployeeID, CONCAT(e.FirstName,' ',e.LastName) AS EmployeeName,
             e.Role, COUNT(m.MaintenanceID) AS ServicesRecorded,
             COALESCE(SUM(m.ServiceCost), 0) AS TotalServiceCost
      FROM Employee e
      LEFT JOIN MaintenanceRecord m ON e.EmployeeID = m.EmployeeID
      GROUP BY e.EmployeeID, e.FirstName, e.LastName, e.Role
      ORDER BY ServicesRecorded DESC, EmployeeName
    `,
  },
  9: {
    title: 'Most Popular Add-On Services',
    sql: `
      SELECT aos.AddOnID, aos.AddOnName,
             SUM(ra.Quantity) AS TotalUnitsSelected,
             COUNT(DISTINCT ra.ResNum) AS ReservationsUsingAddOn
      FROM AddOnService aos
      INNER JOIN ReservationAddOn ra ON aos.AddOnID = ra.AddOnID
      GROUP BY aos.AddOnID, aos.AddOnName
      HAVING SUM(ra.Quantity) >= 2
      ORDER BY TotalUnitsSelected DESC
    `,
  },
  10: {
    title: 'Outstanding Balances',
    sql: `
      WITH CalculatedTotals AS (
        SELECT r.ResNum,
               CAST(
                 DATEDIFF(DAY, r.PickupDateTime, r.DropoffDateTime) * vc.DailyRate
                 + COALESCE(SUM(aos.DailyFee * ra.Quantity *
                     DATEDIFF(DAY, r.PickupDateTime, r.DropoffDateTime)), 0)
               AS DECIMAL(10,2)) AS GrossTotal
        FROM Reservation r
        INNER JOIN Vehicle v ON r.VIN = v.VIN
        INNER JOIN VehicleClass vc ON v.ClassID = vc.ClassID
        LEFT JOIN ReservationAddOn ra ON r.ResNum = ra.ResNum
        LEFT JOIN AddOnService aos ON ra.AddOnID = aos.AddOnID
        GROUP BY r.ResNum, r.PickupDateTime, r.DropoffDateTime, vc.DailyRate
      ),
      PaymentsReceived AS (
        SELECT ResNum,
               SUM(CASE WHEN PaymentStatus = 'Completed' THEN Amount ELSE 0 END) AS AmountPaid
        FROM Payment GROUP BY ResNum
      )
      SELECT r.ResNum, c.Email AS CustomerEmail, ct.GrossTotal,
             COALESCE(pr.AmountPaid, 0) AS AmountPaid,
             ct.GrossTotal - COALESCE(pr.AmountPaid, 0) AS OutstandingBeforeDiscount
      FROM Reservation r
      INNER JOIN Customer c ON r.CustomerID = c.CustomerID
      INNER JOIN CalculatedTotals ct ON r.ResNum = ct.ResNum
      LEFT  JOIN PaymentsReceived pr ON r.ResNum = pr.ResNum
      WHERE COALESCE(pr.AmountPaid, 0) < ct.GrossTotal
        AND r.ReservationStatus <> 'Cancelled'
      ORDER BY OutstandingBeforeDiscount DESC
    `,
  },
}

export default async function handler(req, res) {
  const num = parseInt(req.query.num)
  if (!QUERIES[num]) return res.status(404).json({ error: 'Query not found' })
  try {
    const pool = await getPool()
    const result = await pool.request().query(QUERIES[num].sql)
    res.json({ title: QUERIES[num].title, rows: result.recordset })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
