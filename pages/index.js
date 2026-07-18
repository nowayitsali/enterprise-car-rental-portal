import { useState, useEffect, useCallback } from 'react'

// ── Helpers ──────────────────────────────────────────────────────────────────
const api = (path, opts = {}) =>
  fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts }).then(r => r.json())

// Edits and deletes are temporarily disabled to protect the database.
const disabledAction = () => alert('currently disabled due to security reasons')

function fmtMoney(n) {
  return '$' + parseFloat(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}
function fmtDT(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function toLocalDT(d) {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 16)
}

const STATUS_COLORS = {
  Available: 'badge-green', Confirmed: 'badge-green', Completed: 'badge-green',
  Active: 'badge-blue', Rented: 'badge-blue',
  Pending: 'badge-yellow', Reserved: 'badge-yellow', Maintenance: 'badge-yellow',
  Cancelled: 'badge-red', Failed: 'badge-red', Refunded: 'badge-red',
  Inactive: 'badge-gray',
  Manager: 'badge-green', 'Rental Agent': 'badge-blue',
  'Maintenance Technician': 'badge-yellow', Administrator: 'badge-gray',
  Silver: 'badge-gray', Gold: 'badge-yellow', Platinum: 'badge-blue',
}

function Badge({ value }) {
  if (!value) return <span className="badge badge-gray">—</span>
  return <span className={`badge ${STATUS_COLORS[value] || 'badge-gray'}`}>{value}</span>
}

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null
  return <div className={`toast ${type}`}>{msg}</div>
}

// ── Modal ────────────────────────────────────────────────────────────────────
function Modal({ id, title, children, footer, open, onClose }) {
  if (!open) return null
  return (
    <div className="overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{title}</h2>
        {children}
        <div className="modal-footer">{footer}</div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
const TABS = [
  'Dashboard', 'Queries', 'Reservations', 'Customers',
  'Fleet', 'Employees', 'Branches', 'Payments', 'Maintenance',
]

const QUERY_LABELS = [
  'Detailed Reservation Report',
  'Customers with 2+ Reservations',
  'Revenue by Branch',
  'Vehicle Maintenance Summary',
  'Available Vehicles by Branch & Class',
  'Estimated Reservation Totals',
  'Customers Without Loyalty Account',
  'Employee Maintenance Workload',
  'Most Popular Add-On Services',
  'Outstanding Balances',
]

export default function Home() {
  const [tab, setTab] = useState('Dashboard')
  const [toast, setToast] = useState({ msg: '', type: '' })

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3000)
  }

  return (
    <>
      <header className="header">
        <div className="header-logo">Enterprise <span>Rent-A-Car</span></div>
        <div className="header-divider" />
        <div className="header-sub">Admin Portal</div>
      </header>
      <nav className="nav">
        {TABS.map(t => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </nav>
      <main className="main">
        <div key={tab} className="section-enter">
          {tab === 'Dashboard'    && <DashboardTab />}
          {tab === 'Queries'      && <QueriesTab />}
          {tab === 'Reservations' && <ReservationsTab showToast={showToast} />}
          {tab === 'Customers'    && <CustomersTab showToast={showToast} />}
          {tab === 'Fleet'        && <FleetTab showToast={showToast} />}
          {tab === 'Employees'    && <EmployeesTab showToast={showToast} />}
          {tab === 'Branches'     && <BranchesTab showToast={showToast} />}
          {tab === 'Payments'     && <PaymentsTab showToast={showToast} />}
          {tab === 'Maintenance'  && <MaintenanceTab showToast={showToast} />}
        </div>
      </main>
      <Toast msg={toast.msg} type={toast.type} />
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
function DashboardTab() {
  const [stats, setStats] = useState(null)
  useEffect(() => { api('/api/dashboard').then(setStats) }, [])

  return (
    <>
      <div className="stats">
        <div className="stat"><div className="stat-num">{stats ? stats.customers : '—'}</div><div className="stat-lbl">Customers</div></div>
        <div className="stat"><div className="stat-num">{stats ? stats.available_vehicles : '—'}</div><div className="stat-lbl">Available Vehicles</div></div>
        <div className="stat"><div className="stat-num">{stats ? stats.active_reservations : '—'}</div><div className="stat-lbl">Active Reservations</div></div>
        <div className="stat"><div className="stat-num">{stats ? fmtMoney(stats.total_revenue) : '—'}</div><div className="stat-lbl">Total Revenue</div></div>
      </div>
      <div style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '28px 32px',
        marginBottom: 20,
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'var(--green-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Enterprise Rent-A-Car Portal</h1>
          </div>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: 13, maxWidth: 560 }}>
            Manage reservations, customers, fleet, employees, branches, payments, and maintenance.
            Use the <span style={{ color: 'var(--green)', fontWeight: 600 }}>Queries</span> tab for all 10 analytical reports.
          </p>
        </div>
        <div style={{
          flexShrink: 0,
          padding: '10px 20px',
          background: 'var(--green-light)',
          borderRadius: 8,
          textAlign: 'center',
          border: '1px solid rgba(0,103,71,.12)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 2 }}>EECS 3421</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Group Project</div>
        </div>
      </div>
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// QUERIES
// ════════════════════════════════════════════════════════════════════════════
function QueriesTab() {
  const [activeQ, setActiveQ] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function runQuery(num) {
    setActiveQ(num)
    setLoading(true)
    const data = await api(`/api/queries/${num}`)
    setResult(data)
    setLoading(false)
  }

  return (
    <>
      <div className="card">
        <h2>Management Queries</h2>
        <div className="query-grid">
          {QUERY_LABELS.map((label, i) => (
            <button key={i} className={`query-btn ${activeQ === i + 1 ? 'active' : ''}`} onClick={() => runQuery(i + 1)}>
              <div className="query-num">{i + 1}</div>
              <div className="query-title">{label}</div>
            </button>
          ))}
        </div>
      </div>
      {(loading || result) && (
        <div className="card">
          {loading && <p className="loading">Running query…</p>}
          {!loading && result && (
            <>
              <h2>Query {activeQ}: {result.title}</h2>
              {result.error && <p style={{ color: 'var(--danger)' }}>{result.error}</p>}
              {result.rows && result.rows.length === 0 && <p className="empty">No results.</p>}
              {result.rows && result.rows.length > 0 && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>{Object.keys(result.rows[0]).map(k => <th key={k}>{k}</th>)}</tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i}>
                          {Object.entries(row).map(([k, v]) => (
                            <td key={k}>
                              {v === null || v === undefined ? '—'
                                : typeof v === 'number' && (k.toLowerCase().includes('total') || k.toLowerCase().includes('cost') || k.toLowerCase().includes('rate') || k.toLowerCase().includes('amount')) ? fmtMoney(v)
                                : typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}T/) ? fmtDT(v)
                                : String(v)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CUSTOMERS
// ════════════════════════════════════════════════════════════════════════════
function CustomersTab({ showToast }) {
  const [rows, setRows] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ CustomerID: '', email: '', drivers_license: '' })

  const load = useCallback(() => api('/api/customers').then(setRows), [])
  useEffect(() => { load() }, [load])

  function openAdd() { setForm({ CustomerID: '', email: '', drivers_license: '' }); setOpen(true) }
  function openEdit(r) { setForm({ CustomerID: r.CustomerID, email: r.Email, drivers_license: r.DriversLicense }); setOpen(true) }

  async function save() {
    const url = form.CustomerID ? `/api/customers/${form.CustomerID}` : '/api/customers'
    const method = form.CustomerID ? 'PUT' : 'POST'
    const res = await api(url, { method, body: JSON.stringify({ email: form.email, drivers_license: form.drivers_license }) })
    if (res.error) return showToast(res.error, 'error')
    showToast(form.CustomerID ? 'Customer updated' : 'Customer added')
    setOpen(false); load()
  }

  async function del(id) {
    if (!confirm('Delete this customer?')) return
    const res = await api(`/api/customers/${id}`, { method: 'DELETE' })
    if (res.error) return showToast(res.error, 'error')
    showToast('Customer deleted'); load()
  }

  return (
    <>
      <div className="card">
        <h2>Customers</h2>
        <div className="toolbar">
          <button className="btn btn-primary" onClick={openAdd}>+ Add Customer</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Email</th><th>Driver's License</th><th>Loyalty Tier</th><th>Points</th><th>Actions</th></tr></thead>
            <tbody>
              {!rows && <tr><td colSpan={6} className="loading">Loading…</td></tr>}
              {rows && rows.length === 0 && <tr><td colSpan={6} className="empty">No customers.</td></tr>}
              {rows && rows.map(r => (
                <tr key={r.CustomerID}>
                  <td>{r.CustomerID}</td><td>{r.Email}</td><td>{r.DriversLicense}</td>
                  <td>{r.Tier ? <Badge value={r.Tier} /> : '—'}</td>
                  <td>{r.PointsBalance ?? '—'}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-outline" onClick={disabledAction}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={disabledAction}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)}
        title={form.CustomerID ? 'Edit Customer' : 'Add Customer'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </>}>
        <div className="form-grid">
          <div className="form-group full">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="customer@email.com" />
          </div>
          <div className="form-group full">
            <label>Driver's License</label>
            <input value={form.drivers_license} onChange={e => setForm({ ...form, drivers_license: e.target.value })} placeholder="ON-X0000-00000" />
          </div>
        </div>
      </Modal>
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEES
// ════════════════════════════════════════════════════════════════════════════
function EmployeesTab({ showToast }) {
  const [rows, setRows] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ EmployeeID: '', first_name: '', last_name: '', role: 'Rental Agent', phone: '', email: '' })

  const load = useCallback(() => api('/api/employees').then(setRows), [])
  useEffect(() => { load() }, [load])

  function openAdd() { setForm({ EmployeeID: '', first_name: '', last_name: '', role: 'Rental Agent', phone: '', email: '' }); setOpen(true) }
  function openEdit(r) { setForm({ EmployeeID: r.EmployeeID, first_name: r.FirstName, last_name: r.LastName, role: r.Role, phone: r.PhoneNo, email: r.Email }); setOpen(true) }

  async function save() {
    const url = form.EmployeeID ? `/api/employees/${form.EmployeeID}` : '/api/employees'
    const method = form.EmployeeID ? 'PUT' : 'POST'
    const res = await api(url, { method, body: JSON.stringify(form) })
    if (res.error) return showToast(res.error, 'error')
    showToast(form.EmployeeID ? 'Employee updated' : 'Employee added')
    setOpen(false); load()
  }

  async function del(id) {
    if (!confirm('Delete this employee?')) return
    const res = await api(`/api/employees/${id}`, { method: 'DELETE' })
    if (res.error) return showToast(res.error, 'error')
    showToast('Employee deleted'); load()
  }

  const f = form; const s = k => e => setForm({ ...f, [k]: e.target.value })

  return (
    <>
      <div className="card">
        <h2>Employees</h2>
        <div className="toolbar"><button className="btn btn-primary" onClick={openAdd}>+ Add Employee</button></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
            <tbody>
              {!rows && <tr><td colSpan={6} className="loading">Loading…</td></tr>}
              {rows && rows.length === 0 && <tr><td colSpan={6} className="empty">No employees.</td></tr>}
              {rows && rows.map(r => (
                <tr key={r.EmployeeID}>
                  <td>{r.EmployeeID}</td><td>{r.FirstName} {r.LastName}</td>
                  <td><Badge value={r.Role} /></td><td>{r.Email}</td><td>{r.PhoneNo}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-outline" onClick={disabledAction}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={disabledAction}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)}
        title={form.EmployeeID ? 'Edit Employee' : 'Add Employee'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </>}>
        <div className="form-grid">
          <div className="form-group"><label>First Name</label><input value={f.first_name} onChange={s('first_name')} /></div>
          <div className="form-group"><label>Last Name</label><input value={f.last_name} onChange={s('last_name')} /></div>
          <div className="form-group">
            <label>Role</label>
            <select value={f.role} onChange={s('role')}>
              {['Manager','Rental Agent','Maintenance Technician','Administrator'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Phone</label><input value={f.phone} onChange={s('phone')} placeholder="905-555-0000" /></div>
          <div className="form-group full"><label>Email</label><input type="email" value={f.email} onChange={s('email')} /></div>
        </div>
      </Modal>
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// BRANCHES
// ════════════════════════════════════════════════════════════════════════════
function BranchesTab({ showToast }) {
  const [rows, setRows] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ BranchID: '', name: '', street: '', city: '', province: 'ON', postal_code: '', phone: '' })

  const load = useCallback(() => api('/api/branches').then(setRows), [])
  useEffect(() => { load() }, [load])

  function openAdd() { setForm({ BranchID: '', name: '', street: '', city: '', province: 'ON', postal_code: '', phone: '' }); setOpen(true) }
  function openEdit(r) { setForm({ BranchID: r.BranchID, name: r.BranchName, street: r.Street, city: r.City, province: r.Province.trim(), postal_code: r.PostalCode, phone: r.PhoneNo }); setOpen(true) }

  async function save() {
    const url = form.BranchID ? `/api/branches/${form.BranchID}` : '/api/branches'
    const method = form.BranchID ? 'PUT' : 'POST'
    const res = await api(url, { method, body: JSON.stringify(form) })
    if (res.error) return showToast(res.error, 'error')
    showToast(form.BranchID ? 'Branch updated' : 'Branch added')
    setOpen(false); load()
  }

  async function del(id) {
    if (!confirm('Delete this branch?')) return
    const res = await api(`/api/branches/${id}`, { method: 'DELETE' })
    if (res.error) return showToast(res.error, 'error')
    showToast('Branch deleted'); load()
  }

  const f = form; const s = k => e => setForm({ ...f, [k]: e.target.value })
  const PROVINCES = ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT']

  return (
    <>
      <div className="card">
        <h2>Branches</h2>
        <div className="toolbar"><button className="btn btn-primary" onClick={openAdd}>+ Add Branch</button></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Street</th><th>City</th><th>Province</th><th>Postal Code</th><th>Phone</th><th>Actions</th></tr></thead>
            <tbody>
              {!rows && <tr><td colSpan={8} className="loading">Loading…</td></tr>}
              {rows && rows.length === 0 && <tr><td colSpan={8} className="empty">No branches.</td></tr>}
              {rows && rows.map(r => (
                <tr key={r.BranchID}>
                  <td>{r.BranchID}</td><td>{r.BranchName}</td><td>{r.Street}</td>
                  <td>{r.City}</td><td>{r.Province}</td><td>{r.PostalCode}</td><td>{r.PhoneNo}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-outline" onClick={disabledAction}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={disabledAction}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)}
        title={form.BranchID ? 'Edit Branch' : 'Add Branch'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </>}>
        <div className="form-grid">
          <div className="form-group full"><label>Branch Name</label><input value={f.name} onChange={s('name')} /></div>
          <div className="form-group full"><label>Street</label><input value={f.street} onChange={s('street')} /></div>
          <div className="form-group"><label>City</label><input value={f.city} onChange={s('city')} /></div>
          <div className="form-group">
            <label>Province</label>
            <select value={f.province} onChange={s('province')}>{PROVINCES.map(p => <option key={p}>{p}</option>)}</select>
          </div>
          <div className="form-group"><label>Postal Code</label><input value={f.postal_code} onChange={s('postal_code')} /></div>
          <div className="form-group"><label>Phone</label><input value={f.phone} onChange={s('phone')} /></div>
        </div>
      </Modal>
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// FLEET
// ════════════════════════════════════════════════════════════════════════════
function FleetTab({ showToast }) {
  const [rows, setRows] = useState(null)
  const [branches, setBranches] = useState([])
  const [classes, setClasses] = useState([])
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ vinOrig: '', vin: '', license_plate: '', status: 'Available', branch_id: '', class_id: '' })

  useEffect(() => {
    api('/api/branches').then(setBranches)
    api('/api/vehicle-classes').then(setClasses)
  }, [])

  const load = useCallback(() => {
    let url = '/api/vehicles?'
    if (filterStatus) url += `status=${encodeURIComponent(filterStatus)}&`
    if (filterBranch) url += `branch_id=${filterBranch}`
    api(url).then(setRows)
  }, [filterStatus, filterBranch])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setForm({ vinOrig: '', vin: '', license_plate: '', status: 'Available', branch_id: branches[0]?.BranchID || '', class_id: classes[0]?.ClassID || '' })
    setOpen(true)
  }
  function openEdit(r) {
    setForm({ vinOrig: r.VIN, vin: r.VIN, license_plate: r.LicensePlate, status: r.Status, branch_id: r.BranchID, class_id: r.ClassID })
    setOpen(true)
  }

  async function save() {
    const url = form.vinOrig ? `/api/vehicles/${form.vinOrig}` : '/api/vehicles'
    const method = form.vinOrig ? 'PUT' : 'POST'
    const res = await api(url, { method, body: JSON.stringify(form) })
    if (res.error) return showToast(res.error, 'error')
    showToast(form.vinOrig ? 'Vehicle updated' : 'Vehicle added')
    setOpen(false); load()
  }

  async function del(vin) {
    if (!confirm('Delete this vehicle?')) return
    const res = await api(`/api/vehicles/${vin}`, { method: 'DELETE' })
    if (res.error) return showToast(res.error, 'error')
    showToast('Vehicle deleted'); load()
  }

  const f = form; const s = k => e => setForm({ ...f, [k]: e.target.value })

  return (
    <>
      <div className="card">
        <h2>Fleet</h2>
        <div className="toolbar">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {['Available','Reserved','Rented','Maintenance','Inactive'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.BranchID} value={b.BranchID}>{b.BranchName}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Vehicle</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>VIN</th><th>Plate</th><th>Class</th><th>Daily Rate</th><th>Fuel</th><th>Branch</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {!rows && <tr><td colSpan={8} className="loading">Loading…</td></tr>}
              {rows && rows.length === 0 && <tr><td colSpan={8} className="empty">No vehicles found.</td></tr>}
              {rows && rows.map(r => (
                <tr key={r.VIN}>
                  <td className="mono">{r.VIN}</td><td><strong>{r.LicensePlate}</strong></td>
                  <td>{r.ClassName}</td><td>{fmtMoney(r.DailyRate)}</td>
                  <td>{r.FuelType}</td><td>{r.BranchName}</td>
                  <td><Badge value={r.Status} /></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-outline" onClick={disabledAction}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={disabledAction}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)}
        title={form.vinOrig ? 'Edit Vehicle' : 'Add Vehicle'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </>}>
        <div className="form-grid">
          <div className="form-group full">
            <label>VIN (17 characters)</label>
            <input value={f.vin} onChange={s('vin')} maxLength={17} readOnly={!!f.vinOrig} placeholder="1HGBH41JXMN109186" />
          </div>
          <div className="form-group"><label>License Plate</label><input value={f.license_plate} onChange={s('license_plate')} /></div>
          <div className="form-group">
            <label>Status</label>
            <select value={f.status} onChange={s('status')}>
              {['Available','Reserved','Rented','Maintenance','Inactive'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Branch</label>
            <select value={f.branch_id} onChange={s('branch_id')}>
              {branches.map(b => <option key={b.BranchID} value={b.BranchID}>{b.BranchName}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Vehicle Class</label>
            <select value={f.class_id} onChange={s('class_id')}>
              {classes.map(c => <option key={c.ClassID} value={c.ClassID}>{c.ClassName} – {fmtMoney(c.DailyRate)}/day</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// RESERVATIONS
// ════════════════════════════════════════════════════════════════════════════
function ReservationsTab({ showToast }) {
  const [rows, setRows] = useState(null)
  const [branches, setBranches] = useState([])
  const [filterStatus, setFilterStatus] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    ResNum: '', customer_id: '', vin: '', pickup_branch_id: '', dropoff_branch_id: '',
    pickup_datetime: '', dropoff_datetime: '', status: 'Pending', special_request: '', promo_code_id: '',
  })

  useEffect(() => { api('/api/branches').then(setBranches) }, [])

  const load = useCallback(() => {
    let url = '/api/reservations?'
    if (filterStatus) url += `status=${encodeURIComponent(filterStatus)}`
    api(url).then(setRows)
  }, [filterStatus])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setForm({ ResNum: '', customer_id: '', vin: '', pickup_branch_id: branches[0]?.BranchID || '', dropoff_branch_id: branches[0]?.BranchID || '', pickup_datetime: '', dropoff_datetime: '', status: 'Pending', special_request: '', promo_code_id: '' })
    setOpen(true)
  }
  function openEdit(r) {
    setForm({
      ResNum: r.ResNum, customer_id: r.CustomerID, vin: r.VIN,
      pickup_branch_id: r.PickupBranchID, dropoff_branch_id: r.DropoffBranchID,
      pickup_datetime: toLocalDT(r.PickupDateTime), dropoff_datetime: toLocalDT(r.DropoffDateTime),
      status: r.ReservationStatus, special_request: r.SpecialRequest || '', promo_code_id: '',
    })
    setOpen(true)
  }

  async function save() {
    const payload = { ...form, pickup_datetime: form.pickup_datetime.replace('T', ' '), dropoff_datetime: form.dropoff_datetime.replace('T', ' '), promo_code_id: form.promo_code_id || null }
    const url = form.ResNum ? `/api/reservations/${form.ResNum}` : '/api/reservations'
    const method = form.ResNum ? 'PUT' : 'POST'
    const res = await api(url, { method, body: JSON.stringify(payload) })
    if (res.error) return showToast(res.error, 'error')
    showToast(form.ResNum ? 'Reservation updated' : 'Reservation created')
    setOpen(false); load()
  }

  async function del(id) {
    if (!confirm(`Delete reservation #${id}?`)) return
    const res = await api(`/api/reservations/${id}`, { method: 'DELETE' })
    if (res.error) return showToast(res.error, 'error')
    showToast('Reservation deleted'); load()
  }

  const f = form; const s = k => e => setForm({ ...f, [k]: e.target.value })

  return (
    <>
      <div className="card">
        <h2>Reservations</h2>
        <div className="toolbar">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {['Pending','Confirmed','Active','Completed','Cancelled'].map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openAdd}>+ New Reservation</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Res#</th><th>Customer</th><th>Plate</th><th>Class</th><th>Pickup</th><th>Dropoff</th><th>Dates</th><th>Status</th><th>Promo</th><th>Actions</th></tr></thead>
            <tbody>
              {!rows && <tr><td colSpan={10} className="loading">Loading…</td></tr>}
              {rows && rows.length === 0 && <tr><td colSpan={10} className="empty">No reservations.</td></tr>}
              {rows && rows.map(r => (
                <tr key={r.ResNum}>
                  <td><strong>#{r.ResNum}</strong></td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.CustomerEmail}</td>
                  <td>{r.LicensePlate}</td><td>{r.ClassName}</td>
                  <td style={{ fontSize: 12 }}>{r.PickupBranch}</td>
                  <td style={{ fontSize: 12 }}>{r.DropoffBranch}</td>
                  <td style={{ fontSize: 12 }}>{fmtDT(r.PickupDateTime)} → {fmtDT(r.DropoffDateTime)}</td>
                  <td><Badge value={r.ReservationStatus} /></td>
                  <td>{r.PromoCode || '—'}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-outline" onClick={disabledAction}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={disabledAction}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)}
        title={form.ResNum ? `Edit Reservation #${form.ResNum}` : 'New Reservation'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </>}>
        <div className="form-grid">
          <div className="form-group"><label>Customer ID</label><input type="number" value={f.customer_id} onChange={s('customer_id')} /></div>
          <div className="form-group"><label>VIN</label><input value={f.vin} onChange={s('vin')} maxLength={17} /></div>
          <div className="form-group">
            <label>Pickup Branch</label>
            <select value={f.pickup_branch_id} onChange={s('pickup_branch_id')}>
              {branches.map(b => <option key={b.BranchID} value={b.BranchID}>{b.BranchName}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Dropoff Branch</label>
            <select value={f.dropoff_branch_id} onChange={s('dropoff_branch_id')}>
              {branches.map(b => <option key={b.BranchID} value={b.BranchID}>{b.BranchName}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Pickup Date/Time</label><input type="datetime-local" value={f.pickup_datetime} onChange={s('pickup_datetime')} /></div>
          <div className="form-group"><label>Dropoff Date/Time</label><input type="datetime-local" value={f.dropoff_datetime} onChange={s('dropoff_datetime')} /></div>
          <div className="form-group">
            <label>Status</label>
            <select value={f.status} onChange={s('status')}>
              {['Pending','Confirmed','Active','Completed','Cancelled'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Promo Code ID (optional)</label><input type="number" value={f.promo_code_id} onChange={s('promo_code_id')} /></div>
          <div className="form-group full"><label>Special Request</label><textarea value={f.special_request} onChange={s('special_request')} /></div>
        </div>
      </Modal>
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PAYMENTS
// ════════════════════════════════════════════════════════════════════════════
function PaymentsTab({ showToast }) {
  const [rows, setRows] = useState(null)
  const [filterRes, setFilterRes] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ res_num: '', credit_card_id: '', payment_type: 'Full Payment', status: 'Completed', amount: '' })

  const load = useCallback(() => {
    let url = '/api/payments?'
    if (filterRes) url += `res_num=${filterRes}`
    api(url).then(setRows)
  }, [filterRes])

  useEffect(() => { load() }, [load])

  async function save() {
    const res = await api('/api/payments', { method: 'POST', body: JSON.stringify(form) })
    if (res.error) return showToast(res.error, 'error')
    showToast('Payment recorded'); setOpen(false); load()
  }

  const f = form; const s = k => e => setForm({ ...f, [k]: e.target.value })

  return (
    <>
      <div className="card">
        <h2>Payments</h2>
        <div className="toolbar">
          <input type="number" placeholder="Filter by Res#" value={filterRes} onChange={e => setFilterRes(e.target.value)} style={{ width: 150 }} />
          <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Record Payment</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Res#</th><th>Date</th><th>Type</th><th>Status</th><th>Amount</th><th>Card</th><th>Reference</th></tr></thead>
            <tbody>
              {!rows && <tr><td colSpan={8} className="loading">Loading…</td></tr>}
              {rows && rows.length === 0 && <tr><td colSpan={8} className="empty">No payments.</td></tr>}
              {rows && rows.map(r => (
                <tr key={r.PaymentID}>
                  <td>{r.PaymentID}</td><td>#{r.ResNum}</td><td>{fmtDate(r.PaymentDate)}</td>
                  <td>{r.PaymentType}</td><td><Badge value={r.PaymentStatus} /></td>
                  <td><strong>{fmtMoney(r.Amount)}</strong></td>
                  <td>{r.CardType ? `${r.CardType} ···${r.CardLastFour}` : '—'}</td>
                  <td className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{r.TransactionReference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Record Payment"
        footer={<>
          <button className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </>}>
        <div className="form-grid">
          <div className="form-group"><label>Reservation #</label><input type="number" value={f.res_num} onChange={s('res_num')} /></div>
          <div className="form-group"><label>Credit Card ID (optional)</label><input type="number" value={f.credit_card_id} onChange={s('credit_card_id')} /></div>
          <div className="form-group">
            <label>Payment Type</label>
            <select value={f.payment_type} onChange={s('payment_type')}>
              {['Deposit','Full Payment','Balance','Refund'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={f.status} onChange={s('status')}>
              {['Completed','Pending','Failed','Refunded'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Amount ($)</label><input type="number" step="0.01" value={f.amount} onChange={s('amount')} /></div>
        </div>
      </Modal>
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MAINTENANCE
// ════════════════════════════════════════════════════════════════════════════
function MaintenanceTab({ showToast }) {
  const [rows, setRows] = useState(null)
  const [filterVin, setFilterVin] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ vin: '', employee_id: '', service_type: '', maintenance_date: '', service_cost: '', notes: '' })

  const load = useCallback(() => {
    let url = '/api/maintenance?'
    if (filterVin) url += `vin=${encodeURIComponent(filterVin)}`
    api(url).then(setRows)
  }, [filterVin])

  useEffect(() => { load() }, [load])

  async function save() {
    const res = await api('/api/maintenance', { method: 'POST', body: JSON.stringify(form) })
    if (res.error) return showToast(res.error, 'error')
    showToast('Maintenance logged'); setOpen(false); load()
  }

  async function del(id) {
    if (!confirm('Delete this record?')) return
    const res = await api(`/api/maintenance/${id}`, { method: 'DELETE' })
    if (res.error) return showToast(res.error, 'error')
    showToast('Record deleted'); load()
  }

  const f = form; const s = k => e => setForm({ ...f, [k]: e.target.value })

  return (
    <>
      <div className="card">
        <h2>Maintenance Records</h2>
        <div className="toolbar">
          <input placeholder="Filter by VIN" value={filterVin} onChange={e => setFilterVin(e.target.value)} style={{ width: 200 }} />
          <button className="btn btn-primary" onClick={() => { setForm({ vin: '', employee_id: '', service_type: '', maintenance_date: '', service_cost: '', notes: '' }); setOpen(true) }}>+ Log Service</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>VIN</th><th>Plate</th><th>Employee</th><th>Service</th><th>Date</th><th>Cost</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {!rows && <tr><td colSpan={9} className="loading">Loading…</td></tr>}
              {rows && rows.length === 0 && <tr><td colSpan={9} className="empty">No records.</td></tr>}
              {rows && rows.map(r => (
                <tr key={r.MaintenanceID}>
                  <td>{r.MaintenanceID}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{r.VIN}</td>
                  <td>{r.LicensePlate}</td><td>{r.EmployeeName}</td>
                  <td>{r.ServiceType}</td><td>{fmtDate(r.MaintenanceDate)}</td>
                  <td>{fmtMoney(r.ServiceCost)}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{r.Notes || '—'}</td>
                  <td><button className="btn btn-sm btn-danger" onClick={disabledAction}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Log Maintenance Service"
        footer={<>
          <button className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </>}>
        <div className="form-grid">
          <div className="form-group"><label>VIN</label><input value={f.vin} onChange={s('vin')} maxLength={17} /></div>
          <div className="form-group"><label>Employee ID</label><input type="number" value={f.employee_id} onChange={s('employee_id')} /></div>
          <div className="form-group"><label>Service Type</label><input value={f.service_type} onChange={s('service_type')} placeholder="Oil Change, Tire Rotation…" /></div>
          <div className="form-group"><label>Date</label><input type="date" value={f.maintenance_date} onChange={s('maintenance_date')} /></div>
          <div className="form-group"><label>Cost ($)</label><input type="number" step="0.01" value={f.service_cost} onChange={s('service_cost')} /></div>
          <div className="form-group full"><label>Notes</label><textarea value={f.notes} onChange={s('notes')} /></div>
        </div>
      </Modal>
    </>
  )
}
