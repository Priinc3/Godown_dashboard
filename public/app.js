// Godown Dashboard - Frontend with Products & Reports

// ===== CACHE =====
const cache = { employees: null, workTypes: null, products: null, units: null, settings: null, lastFetch: {} };
const CACHE_TTL = 60000;

function isCacheValid(key) { return cache[key] && cache.lastFetch[key] && (Date.now() - cache.lastFetch[key] < CACHE_TTL); }
async function getCached(key, endpoint) {
  if (isCacheValid(key)) return cache[key];
  cache[key] = await API.get(endpoint);
  cache.lastFetch[key] = Date.now();
  return cache[key];
}
function invalidateCache(key) { cache[key] = null; cache.lastFetch[key] = null; }

// ===== API =====
const API = {
  async get(endpoint) { const r = await fetch(`/api${endpoint}`); if (!r.ok) throw new Error(r.statusText); return r.json(); },
  async post(endpoint, data) { const r = await fetch(`/api${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!r.ok) throw new Error(r.statusText); return r.json(); },
  async put(endpoint, data) { const r = await fetch(`/api${endpoint}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!r.ok) throw new Error(r.statusText); return r.json(); },
  async patch(endpoint, data) { const r = await fetch(`/api${endpoint}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!r.ok) throw new Error(r.statusText); return r.json(); },
  async delete(endpoint) { const r = await fetch(`/api${endpoint}`, { method: 'DELETE' }); if (!r.ok) throw new Error(r.statusText); return r.json(); }
};

// ===== UTILS =====
const formatDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const formatDateInput = d => new Date(d).toISOString().split('T')[0];
const showLoading = () => document.getElementById('main-content').innerHTML = '<div class="loading">Loading...</div>';
const showError = msg => document.getElementById('main-content').innerHTML = `<div class="error-message"><h2>Error</h2><p>${msg}</p></div>`;

let currentEditEntry = null;
let reportPeriod = 'day';

// ===== TRACKING PAGE =====
async function generateTrackingPage() {
  try {
    const [employees, workTypes, products, units, entries, settings] = await Promise.all([
      getCached('employees', '/employees/active'),
      getCached('workTypes', '/work-types'),
      getCached('products', '/products'),
      getCached('units', '/units'),
      API.get('/work-entries'),
      getCached('settings', '/settings')
    ]);

    const empOpts = employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
    const wtOpts = workTypes.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
    const prodOpts = products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    const unitOpts = units.map(u => `<option value="${u.id}">${u.name}</option>`).join('');

    const sorted = [...entries].sort((a, b) => {
      if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
      if (b.status === 'in-progress' && a.status !== 'in-progress') return 1;
      return new Date(b.start_time) - new Date(a.start_time);
    });

    const entriesHtml = sorted.length === 0 ? '<div class="empty-state"><p class="text-muted">No entries yet.</p></div>' :
      `<div class="entries-list">${sorted.map(e => {
        const eff = e.actual_quantity !== null ? Math.round((e.actual_quantity / e.target_quantity) * 100) : null;
        const effClass = eff !== null ? (eff >= 100 ? 'text-success' : eff >= 80 ? '' : 'text-danger') : '';
        return `
          <div class="entry-card">
            <div class="entry-main">
              <div class="entry-info">
                <div class="entry-employee">${e.employee?.name || '—'}</div>
                <div class="entry-task">${e.work_type?.name || '—'} ${e.product?.name ? '• ' + e.product.name : ''}</div>
              </div>
              <span class="badge ${e.status === 'in-progress' ? 'badge-pending' : 'badge-complete'}">${e.status === 'in-progress' ? 'In Progress' : 'Complete'}</span>
            </div>
            <div class="entry-details">
              <div class="entry-stat"><span class="entry-stat-label">Date</span><span class="entry-stat-value">${formatDate(e.start_time)}</span></div>
              <div class="entry-stat"><span class="entry-stat-label">Target</span><span class="entry-stat-value">${e.target_quantity}</span></div>
              <div class="entry-stat"><span class="entry-stat-label">Actual</span><span class="entry-stat-value">${e.actual_quantity ?? '—'}</span></div>
              <div class="entry-stat"><span class="entry-stat-label">Efficiency</span><span class="entry-stat-value ${effClass}">${eff !== null ? eff + '%' : '—'}</span></div>
            </div>
            <div class="entry-actions">
              <button class="btn btn-secondary btn-sm" onclick='openFullEditEntry(${JSON.stringify(e).replace(/'/g, "&#39;")})'>Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteEntry(${e.id})">Delete</button>
            </div>
          </div>`;
      }).join('')}</div>`;

    return `
      <div class="page-header"><h1 class="page-title">Tracking</h1><p class="page-subtitle">${settings.shift_duration || 9}h shift</p></div>
      <div class="card">
        <div class="card-header"><h2 class="card-title">New Entry</h2></div>
        <form id="tracking-form" onsubmit="saveWorkEntry(event)">
          <div class="form-row">
            <div class="form-group"><label class="form-label">Employee *</label><select class="form-select" id="employee-select" required><option value="">Select...</option>${empOpts}</select></div>
            <div class="form-group"><label class="form-label">Work Type *</label><select class="form-select" id="work-type-select" required><option value="">Select...</option>${wtOpts}</select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Product</label><select class="form-select" id="product-select"><option value="">Select...</option>${prodOpts}</select></div>
            <div class="form-group"><label class="form-label">Unit</label><select class="form-select" id="unit-select">${unitOpts}</select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Target Qty *</label><input type="number" class="form-input" id="target-quantity" required min="1"></div>
          </div>
          <button type="submit" class="btn btn-primary">Start Entry</button>
        </form>
      </div>
      <div class="card">
        <div class="card-header"><h2 class="card-title">Entries</h2><span class="text-muted">${entries.length}</span></div>
        ${entriesHtml}
      </div>
      <div id="edit-modal" class="modal" style="display:none;">
        <div class="modal-content">
          <div class="modal-header"><h3 class="modal-title">Edit Entry</h3><button class="modal-close" onclick="closeEditModal()">&times;</button></div>
          <form id="edit-entry-form" onsubmit="updateFullWorkEntry(event)">
            <input type="hidden" id="edit-entry-id">
            <div class="form-row">
              <div class="form-group"><label class="form-label">Employee</label><select class="form-select" id="edit-employee">${empOpts}</select></div>
              <div class="form-group"><label class="form-label">Work Type</label><select class="form-select" id="edit-work-type">${wtOpts}</select></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Product</label><select class="form-select" id="edit-product"><option value="">None</option>${prodOpts}</select></div>
              <div class="form-group"><label class="form-label">Unit</label><select class="form-select" id="edit-unit">${unitOpts}</select></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Date</label><input type="date" class="form-input" id="edit-date"></div>
              <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="edit-status"><option value="in-progress">In Progress</option><option value="complete">Complete</option></select></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Target</label><input type="number" class="form-input" id="edit-target" min="1"></div>
              <div class="form-group"><label class="form-label">Actual</label><input type="number" class="form-input" id="edit-actual" min="0"></div>
            </div>
            <div class="form-group"><label class="form-label">Notes</label><textarea class="form-input" id="edit-notes" rows="2"></textarea></div>
            <div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeEditModal()">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
          </form>
        </div>
      </div>`;
  } catch (error) { return `<div class="error-message"><p>Error: ${error.message}</p></div>`; }
}

// ===== ANALYSIS PAGE =====
async function generateAnalysisPage() {
  try {
    const [analytics, report] = await Promise.all([
      API.get('/analytics/productivity'),
      API.get(`/analytics/daily-report?period=${reportPeriod}`)
    ]);

    const empRows = analytics.employeeStats.map(e => `
      <div class="perf-row">
        <span class="perf-name">${e.name}</span>
        <span class="perf-stat">${e.totalTasks}</span>
        <span class="perf-stat">${e.totalProduced.toLocaleString()}</span>
        <span class="perf-stat ${e.avgEfficiency >= 100 ? 'text-success' : e.avgEfficiency >= 80 ? '' : 'text-danger'}">${e.avgEfficiency}%</span>
      </div>`).join('');

    const dailyRows = report.dailyData.map(d => `
      <div class="daily-row">
        <span class="daily-date">${formatDate(d.date)}</span>
        <span class="daily-value">${d.finalProducts?.toLocaleString() || 0} products</span>
        <span class="daily-tasks">${d.tasks} tasks</span>
      </div>`).join('');

    const empWorkRows = report.employeeBreakdown.map(e => `
      <div class="breakdown-row">
        <span>${e.name}</span>
        <span>${e.totalWork?.toLocaleString() || 0} done</span>
      </div>`).join('');

    const workTypeRows = (report.workTypeBreakdown || []).map(w => `
      <div class="breakdown-row">
        <span>${w.name}</span>
        <span>${w.totalDone?.toLocaleString() || 0}</span>
      </div>`).join('');

    const prodRows = report.productBreakdown.map(p => `
      <div class="breakdown-row">
        <span>${p.name}</span>
        <span class="text-success">${p.finalCount?.toLocaleString() || 0} final</span>
      </div>`).join('');

    return `
      <div class="page-header"><h1 class="page-title">Analysis</h1></div>
      
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${analytics.totalEmployees}</div><div class="stat-label">Employees</div></div>
        <div class="stat-card"><div class="stat-value">${analytics.thisWeekCompleted}</div><div class="stat-label">This Week</div></div>
        <div class="stat-card"><div class="stat-value">${analytics.avgEfficiency}%</div><div class="stat-label">Avg Efficiency</div></div>
        <div class="stat-card"><div class="stat-value">${analytics.totalUnits.toLocaleString()}</div><div class="stat-label">Total Work Done</div></div>
      </div>

      <div class="card">
        <div class="card-header"><h2 class="card-title">Employee Performance</h2></div>
        <div class="perf-header"><span>Name</span><span>Tasks</span><span>Produced</span><span>Efficiency</span></div>
        ${empRows || '<p class="text-muted">No data.</p>'}
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Production Report</h2>
          <div class="period-tabs">
            <button class="period-btn ${reportPeriod === 'day' ? 'active' : ''}" onclick="changePeriod('day')">Today</button>
            <button class="period-btn ${reportPeriod === 'week' ? 'active' : ''}" onclick="changePeriod('week')">Week</button>
            <button class="period-btn ${reportPeriod === 'month' ? 'active' : ''}" onclick="changePeriod('month')">Month</button>
            <button class="btn btn-secondary btn-sm" onclick="exportReport()">Export CSV</button>
          </div>
        </div>
        <div class="report-summary">
          <div class="report-stat highlight"><span class="report-stat-value">${report.totalFinalProducts?.toLocaleString() || 0}</span><span class="report-stat-label">Final Products</span></div>
          <div class="report-stat"><span class="report-stat-value">${report.totalWork?.toLocaleString() || 0}</span><span class="report-stat-label">Total Work Done</span></div>
          <div class="report-stat"><span class="report-stat-value">${report.totalTasks}</span><span class="report-stat-label">Tasks</span></div>
        </div>
        
        <div class="report-section">
          <h4>Daily Production (Final Products)</h4>
          <div class="daily-list">${dailyRows || '<p class="text-muted">No data for this period.</p>'}</div>
        </div>

        <div class="report-section">
          <h4>By Product (Final Count)</h4>
          <div class="breakdown-list">${prodRows || '<p class="text-muted">No products.</p>'}</div>
        </div>
        
        <div class="report-section">
          <h4>By Work Type</h4>
          <div class="breakdown-list">${workTypeRows || '<p class="text-muted">No data.</p>'}</div>
        </div>
        
        <div class="report-section">
          <h4>By Employee</h4>
          <div class="breakdown-list">${empWorkRows || '<p class="text-muted">No data.</p>'}</div>
        </div>
      </div>`;
  } catch (error) { return `<div class="error-message"><p>Error: ${error.message}</p></div>`; }
}

function changePeriod(period) {
  reportPeriod = period;
  loadPage('productivity/analysis');
}

async function exportReport() {
  try {
    const report = await API.get(`/analytics/daily-report?period=${reportPeriod}`);
    let csv = 'Date,Employee,Product,Work Type,Target,Actual,Efficiency\n';
    report.entries.forEach(e => {
      const eff = e.actual_quantity ? Math.round((e.actual_quantity / e.target_quantity) * 100) : 0;
      csv += `${formatDate(e.start_time)},${e.employee?.name || ''},${e.product?.name || ''},${e.work_type?.name || ''},${e.target_quantity},${e.actual_quantity || 0},${eff}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `production-report-${reportPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) { alert('Export failed: ' + error.message); }
}

// ===== SETTINGS PAGE =====
async function generateProductivitySettingsPage() {
  try {
    const [employees, workTypes, products, units] = await Promise.all([
      API.get('/employees'),
      getCached('workTypes', '/work-types'),
      getCached('products', '/products'),
      getCached('units', '/units')
    ]);

    const makeList = (items, type, hasActive = false) => items.map(i => `
      <div class="list-item">
        <span>${i.name}${hasActive && !i.active ? ' <span class="badge badge-pending">Inactive</span>' : ''}</span>
        <div class="list-item-actions">
          <button class="btn btn-secondary btn-sm" onclick="edit${type}(${i.id}, '${i.name.replace(/'/g, "\\'")}')">Edit</button>
          ${hasActive ? `<button class="btn ${i.active ? 'btn-danger' : 'btn-success'} btn-sm" onclick="toggle${type}(${i.id})">${i.active ? 'Deactivate' : 'Activate'}</button>` :
        `<button class="btn btn-danger btn-sm" onclick="delete${type}(${i.id})">Delete</button>`}
        </div>
      </div>`).join('');

    const makeCard = (title, type, items, hasActive = false) => `
      <div class="card">
        <div class="card-header"><h2 class="card-title">${title}</h2><button class="btn btn-primary btn-sm" onclick="showAddForm('${type.toLowerCase()}')">+ Add</button></div>
        <div id="add-${type.toLowerCase()}-form" class="add-form" style="display:none">
          <input type="text" class="form-input" id="new-${type.toLowerCase()}-name" placeholder="Name">
          <div class="add-form-actions"><button class="btn btn-primary btn-sm" onclick="add${type}()">Save</button><button class="btn btn-secondary btn-sm" onclick="hideAddForm('${type.toLowerCase()}')">Cancel</button></div>
        </div>
        ${makeList(items, type, hasActive) || '<p class="text-muted">None yet.</p>'}
      </div>`;

    return `
      <div class="page-header"><h1 class="page-title">Settings</h1></div>
      ${makeCard('Employees', 'Employee', employees, true)}
      ${makeCard('Work Types', 'WorkType', workTypes)}
      ${makeCard('Products', 'Product', products)}
      ${makeCard('Units', 'Unit', units)}`;
  } catch (error) { return `<div class="error-message"><p>Error: ${error.message}</p></div>`; }
}

// ===== DATA SOURCES PAGE =====
async function generateDataSourcesPage() {
  try {
    const sources = await API.get('/data-sources');

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
    const formatTime = (d) => {
      if (!d) return 'Never';
      const diff = Date.now() - new Date(d).getTime();
      if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
      return formatDate(d);
    };

    const statusBadge = (s) => {
      const colors = { active: 'badge-complete', pending: 'badge-pending', error: 'badge-error' };
      return `<span class="badge ${colors[s] || 'badge-pending'}">${s}</span>`;
    };

    const rows = sources.map(s => `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td>${statusBadge(s.status)}</td>
        <td>${(s.record_count || 0).toLocaleString()}</td>
        <td>${s.date_range_start ? `${formatDate(s.date_range_start)} - ${formatDate(s.date_range_end)}` : '-'}</td>
        <td>${formatTime(s.last_imported_at)}</td>
        <td class="list-item-actions">
          <button class="btn btn-sm btn-secondary" onclick="importDataSource('${s.id}')" title="Import">⟳</button>
          <button class="btn btn-sm btn-danger" onclick="deleteDataSource('${s.id}')" title="Delete">🗑</button>
        </td>
      </tr>
    `).join('');

    return `
      <div class="page-header">
        <h1 class="page-title">Data Sources</h1>
        <p class="page-subtitle">Manage your Google Sheet data sources</p>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Add New Source</h3>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input type="text" id="ds-name" class="form-input" placeholder="e.g. October Sales">
          </div>
          <div class="form-group">
            <label class="form-label">Google Sheet CSV URL</label>
            <input type="text" id="ds-url" class="form-input" placeholder="https://docs.google.com/spreadsheets/d/.../gviz/tq?tqx=out:csv">
          </div>
        </div>
        <button class="btn btn-primary" onclick="addDataSource()">Add Source</button>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Your Data Sources</h3>
        </div>
        ${sources.length === 0 ? '<p class="text-muted">No data sources yet. Add one above.</p>' : `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Records</th>
                <th>Date Range</th>
                <th>Last Import</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        `}
      </div>
    `;
  } catch (error) { return `<div class="error-message"><p>Error: ${error.message}</p></div>`; }
}

async function addDataSource() {
  const name = document.getElementById('ds-name').value.trim();
  const url = document.getElementById('ds-url').value.trim();
  if (!name || !url) return alert('Please enter both name and URL');
  try {
    await API.post('/data-sources', { name, sheet_url: url });
    loadPage('sales/data-sources');
  } catch (e) { alert(e.message); }
}

async function importDataSource(id) {
  if (!confirm('Import data from this source?')) return;
  try {
    showLoading();
    await API.post(`/data-sources/${id}/import`);
    loadPage('sales/data-sources');
    alert('Import successful!');
  } catch (e) { alert('Import failed: ' + e.message); loadPage('sales/data-sources'); }
}

async function deleteDataSource(id) {
  if (!confirm('Delete this data source?')) return;
  try {
    await API.delete(`/data-sources/${id}`);
    loadPage('sales/data-sources');
  } catch (e) { alert(e.message); }
}

// ===== SALES ANALYSIS PAGE =====
let salesCharts = {};
let salesFilters = { startDate: '', endDate: '', marketplace: 'All', status: 'All', paymentMode: 'All' };

async function generateSalesAnalysisPage() {
  try {
    const queryParams = new URLSearchParams();
    if (salesFilters.startDate) queryParams.set('startDate', salesFilters.startDate);
    if (salesFilters.endDate) queryParams.set('endDate', salesFilters.endDate);
    if (salesFilters.marketplace !== 'All') queryParams.set('marketplace', salesFilters.marketplace);
    if (salesFilters.status !== 'All') queryParams.set('status', salesFilters.status);
    if (salesFilters.paymentMode !== 'All') queryParams.set('paymentMode', salesFilters.paymentMode);

    const data = await API.get(`/sales-analysis?${queryParams.toString()}`);
    const { kpis, charts, filters } = data;

    const formatCurrency = (val) => '₹' + val.toLocaleString('en-IN', { maximumFractionDigits: 0 });

    // Build filter options
    const mpOpts = ['All', ...filters.marketplaces].map(m => `<option value="${m}" ${salesFilters.marketplace === m ? 'selected' : ''}>${m}</option>`).join('');
    const statusOpts = ['All', ...filters.statuses].map(s => `<option value="${s}" ${salesFilters.status === s ? 'selected' : ''}>${s}</option>`).join('');
    const paymentOpts = ['All', ...filters.paymentModes].map(p => `<option value="${p}" ${salesFilters.paymentMode === p ? 'selected' : ''}>${p}</option>`).join('');

    return `
      <div class="page-header">
        <h1 class="page-title">Sales Analysis</h1>
        <p class="page-subtitle">Order and revenue insights from CSV data</p>
      </div>
      
      <!-- Filters -->
      <div class="card filter-card">
        <div class="filter-bar">
          <div class="filter-group">
            <label class="filter-label">From</label>
            <input type="date" class="form-input filter-input" id="filter-start-date" value="${salesFilters.startDate}" onchange="updateSalesFilter('startDate', this.value)">
          </div>
          <div class="filter-group">
            <label class="filter-label">To</label>
            <input type="date" class="form-input filter-input" id="filter-end-date" value="${salesFilters.endDate}" onchange="updateSalesFilter('endDate', this.value)">
          </div>
          <div class="filter-group">
            <label class="filter-label">Marketplace</label>
            <select class="form-select filter-input" id="filter-marketplace" onchange="updateSalesFilter('marketplace', this.value)">${mpOpts}</select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Status</label>
            <select class="form-select filter-input" id="filter-status" onchange="updateSalesFilter('status', this.value)">${statusOpts}</select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Payment</label>
            <select class="form-select filter-input" id="filter-payment" onchange="updateSalesFilter('paymentMode', this.value)">${paymentOpts}</select>
          </div>
          <button class="btn btn-secondary" onclick="resetSalesFilters()">Reset</button>
        </div>
      </div>
      
      <!-- KPI Section: Order Fulfillment -->
      <div class="kpi-section">
        <div class="kpi-section-header">📦 Order Fulfillment</div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon">📥</div>
            <div class="kpi-content">
              <div class="kpi-label">Orders Received</div>
              <div class="kpi-value">${kpis.ordersReceived.toLocaleString()}</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon">🚚</div>
            <div class="kpi-content">
              <div class="kpi-label">Orders Shipped</div>
              <div class="kpi-value">${kpis.ordersShipped.toLocaleString()}</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon">⏳</div>
            <div class="kpi-content">
              <div class="kpi-label">Pending Orders</div>
              <div class="kpi-value">${kpis.pendingOrders.toLocaleString()}</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon">📊</div>
            <div class="kpi-content">
              <div class="kpi-label">On-time Dispatch</div>
              <div class="kpi-value ${kpis.onTimeDispatch >= 98 ? 'text-success' : 'text-warning'}">${kpis.onTimeDispatch}%</div>
              <div class="kpi-target">Target: ≥98%</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon">✓</div>
            <div class="kpi-content">
              <div class="kpi-label">Order Accuracy</div>
              <div class="kpi-value ${kpis.orderAccuracy >= 99.5 ? 'text-success' : 'text-warning'}">${kpis.orderAccuracy}%</div>
              <div class="kpi-target">Target: ≥99.5%</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- KPI Section: Revenue -->
      <div class="kpi-section">
        <div class="kpi-section-header">💰 Revenue Snapshot</div>
        <div class="kpi-grid">
          <div class="kpi-card kpi-card-highlight">
            <div class="kpi-icon">💵</div>
            <div class="kpi-content">
              <div class="kpi-label">Total Revenue</div>
              <div class="kpi-value">${formatCurrency(kpis.totalRevenue)}</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon">🛒</div>
            <div class="kpi-content">
              <div class="kpi-label">Avg Order Value</div>
              <div class="kpi-value">${formatCurrency(kpis.avgOrderValue)}</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon">↩️</div>
            <div class="kpi-content">
              <div class="kpi-label">Returned Orders</div>
              <div class="kpi-value text-warning">${kpis.returnedOrders.toLocaleString()}</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon">❌</div>
            <div class="kpi-content">
              <div class="kpi-label">Cancelled Orders</div>
              <div class="kpi-value text-danger">${kpis.cancelledOrders.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-row">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Sales Trend</h3>
            </div>
            <div class="chart-container">
              <canvas id="sales-trend-chart"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Revenue by Marketplace</h3>
            </div>
            <div class="chart-container">
              <canvas id="marketplace-chart"></canvas>
            </div>
          </div>
        </div>
        <div class="chart-row">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Order Status Distribution</h3>
            </div>
            <div class="chart-container">
              <canvas id="status-chart"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Top 10 Products</h3>
            </div>
            <div class="chart-container">
              <canvas id="products-chart"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Top States Table -->
      <div class="card">
        <div class="card-header"><h2 class="card-title">Top States by Orders</h2></div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>State</th>
                <th>Orders</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${charts.topStates.map(s => `
                <tr>
                  <td>${s.name}</td>
                  <td>${s.orders.toLocaleString()}</td>
                  <td>${formatCurrency(s.revenue)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <script>
        // Initialize charts after DOM update
        setTimeout(() => initSalesCharts(${JSON.stringify(charts)}), 100);
      </script>
    `;
  } catch (error) {
    console.error('Sales analysis error:', error);
    return `<div class="error-message"><h2>Error</h2><p>${error.message}</p></div>`;
  }
}

function initSalesCharts(charts) {
  // Destroy existing charts
  Object.values(salesCharts).forEach(chart => chart?.destroy());
  salesCharts = {};

  const colors = {
    primary: '#3b82f6',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    teal: '#14b8a6',
    orange: '#f97316'
  };

  const chartColors = [colors.primary, colors.success, colors.warning, colors.purple, colors.pink, colors.teal, colors.orange, colors.danger];

  // Sales Trend Chart
  const trendCtx = document.getElementById('sales-trend-chart');
  if (trendCtx && charts.salesTrend.length > 0) {
    salesCharts.trend = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: charts.salesTrend.map(d => d.date),
        datasets: [{
          label: 'Revenue (₹)',
          data: charts.salesTrend.map(d => d.revenue),
          borderColor: colors.primary,
          backgroundColor: colors.primary + '20',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: v => '₹' + (v / 1000).toFixed(0) + 'K' } }
        }
      }
    });
  }

  // Marketplace Chart
  const mpCtx = document.getElementById('marketplace-chart');
  if (mpCtx && charts.marketplaceRevenue.length > 0) {
    salesCharts.marketplace = new Chart(mpCtx, {
      type: 'doughnut',
      data: {
        labels: charts.marketplaceRevenue.map(m => m.name),
        datasets: [{
          data: charts.marketplaceRevenue.map(m => m.revenue),
          backgroundColor: chartColors
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' }
        }
      }
    });
  }

  // Status Chart
  const statusCtx = document.getElementById('status-chart');
  if (statusCtx && charts.statusDistribution.length > 0) {
    salesCharts.status = new Chart(statusCtx, {
      type: 'bar',
      data: {
        labels: charts.statusDistribution.map(s => s.name),
        datasets: [{
          label: 'Orders',
          data: charts.statusDistribution.map(s => s.count),
          backgroundColor: [colors.success, colors.warning, colors.danger, colors.purple, colors.primary]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // Top Products Chart
  const prodCtx = document.getElementById('products-chart');
  if (prodCtx && charts.topProducts.length > 0) {
    salesCharts.products = new Chart(prodCtx, {
      type: 'bar',
      data: {
        labels: charts.topProducts.map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name),
        datasets: [{
          label: 'Quantity',
          data: charts.topProducts.map(p => p.quantity),
          backgroundColor: colors.teal
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } }
      }
    });
  }
}

function updateSalesFilter(key, value) {
  salesFilters[key] = value;
  loadPage('sales/analysis');
}

function resetSalesFilters() {
  salesFilters = { startDate: '', endDate: '', marketplace: 'All', status: 'All', paymentMode: 'All' };
  loadPage('sales/analysis');
}

async function exportSalesReport() {
  try {
    const queryParams = new URLSearchParams();
    if (salesFilters.startDate) queryParams.set('startDate', salesFilters.startDate);
    if (salesFilters.endDate) queryParams.set('endDate', salesFilters.endDate);
    if (salesFilters.marketplace !== 'All') queryParams.set('marketplace', salesFilters.marketplace);
    if (salesFilters.status !== 'All') queryParams.set('status', salesFilters.status);
    if (salesFilters.paymentMode !== 'All') queryParams.set('paymentMode', salesFilters.paymentMode);

    const data = await API.get(`/sales-analysis?${queryParams.toString()}`);

    let csv = 'Metric,Value\n';
    csv += `Total Orders,${data.kpis.ordersReceived}\n`;
    csv += `Orders Shipped,${data.kpis.ordersShipped}\n`;
    csv += `Total Revenue,${data.kpis.totalRevenue}\n`;
    csv += `Avg Order Value,${data.kpis.avgOrderValue}\n`;
    csv += `On-time Dispatch %,${data.kpis.onTimeDispatch}\n`;
    csv += `Order Accuracy %,${data.kpis.orderAccuracy}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) { alert('Export failed: ' + error.message); }
}

// ===== EXPENSES PAGES =====
async function generateExpensesTransactionsPage() {
  try {
    const [expenses, categories] = await Promise.all([
      API.get('/expenses'),
      API.get('/expense-categories')
    ]);

    const categoryOptions = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const today = new Date().toISOString().split('T')[0];

    // Only show active expenses in replacement dropdown
    const activeExpenses = expenses.filter(e => e.status === 'active');
    const replacementOptions = activeExpenses.map(e =>
      `<option value="${e.id}">${e.item_name} - ₹${parseFloat(e.amount).toLocaleString('en-IN')} (${e.category?.name || 'N/A'})</option>`
    ).join('');

    // Calculate totals (only active expenses)
    const totalAmount = activeExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const thisMonth = activeExpenses.filter(e => {
      const d = new Date(e.expense_date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    const expenseRows = expenses.length === 0 ?
      '<tr><td colspan="7" class="text-muted" style="text-align:center;padding:24px;">No expenses recorded yet</td></tr>' :
      expenses.map(e => `
        <tr class="${e.status === 'replaced' ? 'row-replaced' : ''}">
          <td>${new Date(e.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
          <td>
            <strong>${e.item_name}</strong>
            ${e.is_replacement ? '<span class="badge badge-info" style="margin-left:6px;font-size:10px;">Replacement</span>' : ''}
            ${e.notes ? `<br><small class="text-muted">${e.notes}</small>` : ''}
            ${e.replacement_reason ? `<br><small class="text-muted" style="color:#e67700;">Reason: ${e.replacement_reason}</small>` : ''}
          </td>
          <td><span class="badge badge-${e.category?.name === 'Equipment' ? 'complete' : 'pending'}">${e.category?.name || '-'}</span></td>
          <td><strong>₹${parseFloat(e.amount).toLocaleString('en-IN')}</strong></td>
          <td>
            <span class="badge ${e.status === 'active' ? 'badge-complete' : e.status === 'replaced' ? 'badge-warning' : 'badge-pending'}">${e.status}</span>
          </td>
          <td class="list-item-actions">
            ${e.status === 'active' ? `<button class="btn btn-sm btn-danger" onclick="deleteExpense('${e.id}')">🗑</button>` : '<span class="text-muted">—</span>'}
          </td>
        </tr>
      `).join('');

    return `
      <div class="page-header">
        <h1 class="page-title">Expense Tracker</h1>
        <p class="page-subtitle">Track and manage all expenses</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">₹${totalAmount.toLocaleString('en-IN')}</div>
          <div class="stat-label">Total Expenses</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">₹${thisMonth.toLocaleString('en-IN')}</div>
          <div class="stat-label">This Month</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${expenses.length}</div>
          <div class="stat-label">Transactions</div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Add New Expense</h3>
        </div>
        
        <!-- Type Toggle: New or Replacement -->
        <div class="form-group">
          <label class="form-label">Type</label>
          <div class="type-toggle">
            <label class="toggle-option">
              <input type="radio" name="exp-type" value="new" checked onchange="toggleReplacementFields()">
              <span class="toggle-label">🆕 New Purchase</span>
            </label>
            <label class="toggle-option">
              <input type="radio" name="exp-type" value="replacement" onchange="toggleReplacementFields()">
              <span class="toggle-label">🔄 Replacement</span>
            </label>
          </div>
        </div>
        
        <!-- Replacement Fields (hidden by default) -->
        <div id="replacement-fields" style="display:none;margin-bottom:16px;padding:16px;background:#fff8e6;border-radius:8px;border:1px solid #ffd43b;">
          <div class="form-group">
            <label class="form-label">Replacing Product</label>
            <select id="exp-original" class="form-select">
              <option value="">Select product being replaced</option>
              ${replacementOptions}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Replacement Reason *</label>
            <input type="text" id="exp-reason" class="form-input" placeholder="e.g. Broken, Worn out, Upgrade needed">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Item Name</label>
            <input type="text" id="exp-item" class="form-input" placeholder="e.g. Office Supplies">
          </div>
          <div class="form-group">
            <label class="form-label">Amount (₹)</label>
            <input type="number" id="exp-amount" class="form-input" placeholder="0.00" step="0.01">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Category</label>
            <select id="exp-category" class="form-select">
              <option value="">Select category</option>
              ${categoryOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" id="exp-date" class="form-input" value="${today}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notes (optional)</label>
          <input type="text" id="exp-notes" class="form-input" placeholder="Additional notes">
        </div>
        <button class="btn btn-primary" onclick="addExpense()">Add Expense</button>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Recent Expenses</h3>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${expenseRows}</tbody>
          </table>
        </div>
      </div>
    `;
  } catch (error) { return `<div class="error-message"><p>Error: ${error.message}</p></div>`; }
}

async function addExpense() {
  const item_name = document.getElementById('exp-item').value.trim();
  const amount = document.getElementById('exp-amount').value;
  const category_id = document.getElementById('exp-category').value;
  const expense_date = document.getElementById('exp-date').value;
  const notes = document.getElementById('exp-notes').value.trim();

  // Check if replacement type
  const isReplacement = document.querySelector('input[name="exp-type"]:checked')?.value === 'replacement';
  const original_expense_id = isReplacement ? document.getElementById('exp-original')?.value : null;
  const replacement_reason = isReplacement ? document.getElementById('exp-reason')?.value.trim() : null;

  if (!item_name || !amount || !category_id) return alert('Please fill in item, amount, and category');

  if (isReplacement) {
    if (!original_expense_id) return alert('Please select the product being replaced');
    if (!replacement_reason) return alert('Please provide a reason for replacement');
  }

  try {
    await API.post('/expenses', {
      item_name,
      amount: parseFloat(amount),
      category_id,
      expense_date,
      notes,
      is_replacement: isReplacement,
      original_expense_id: original_expense_id || null,
      replacement_reason: replacement_reason || null
    });
    loadPage('expenses/transactions');
  } catch (e) { alert(e.message); }
}

function toggleReplacementFields() {
  const isReplacement = document.querySelector('input[name="exp-type"]:checked')?.value === 'replacement';
  const fields = document.getElementById('replacement-fields');
  if (fields) fields.style.display = isReplacement ? 'block' : 'none';
}

async function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  try {
    await API.delete(`/expenses/${id}`);
    loadPage('expenses/transactions');
  } catch (e) { alert(e.message); }
}

async function generateExpensesSettingsPage() {
  try {
    const categories = await API.get('/expense-categories');

    const categoryList = categories.length === 0 ?
      '<p class="text-muted">No categories yet</p>' :
      categories.map(c => `
        <div class="list-item">
          <span>${c.name}</span>
          <div class="list-item-actions">
            <button class="btn btn-sm btn-danger" onclick="deleteExpenseCategory('${c.id}')">🗑</button>
          </div>
        </div>
      `).join('');

    return `
      <div class="page-header">
        <h1 class="page-title">Expense Settings</h1>
        <p class="page-subtitle">Manage expense categories</p>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Expense Categories</h3>
        </div>
        <div class="add-form" id="add-category-form" style="display:none;">
          <div class="form-group">
            <label class="form-label">Category Name</label>
            <input type="text" id="cat-name" class="form-input" placeholder="e.g. Transportation">
          </div>
          <div class="add-form-actions">
            <button class="btn btn-primary btn-sm" onclick="addExpenseCategory()">Save</button>
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('add-category-form').style.display='none'">Cancel</button>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('add-category-form').style.display='block'" style="margin-bottom:16px;">+ Add Category</button>
        ${categoryList}
      </div>
    `;
  } catch (error) { return `<div class="error-message"><p>Error: ${error.message}</p></div>`; }
}

async function addExpenseCategory() {
  const name = document.getElementById('cat-name').value.trim();
  if (!name) return alert('Please enter a category name');
  try {
    await API.post('/expense-categories', { name });
    loadPage('expenses/settings');
  } catch (e) { alert(e.message); }
}

async function deleteExpenseCategory(id) {
  if (!confirm('Delete this category?')) return;
  try {
    await API.delete(`/expense-categories/${id}`);
    loadPage('expenses/settings');
  } catch (e) { alert(e.message); }
}
async function generateGeneralSettingsPage() {
  try {
    const settings = await getCached('settings', '/settings');
    return `
      <div class="page-header"><h1 class="page-title">General Settings</h1></div>
      <div class="card">
        <form onsubmit="saveSettings(event)">
          <div class="form-group"><label class="form-label">Company Name</label><input type="text" class="form-input" id="setting-company-name" value="${settings.company_name || ''}"></div>
          <div class="form-group"><label class="form-label">Currency</label><select class="form-select" id="setting-currency"><option value="INR" ${settings.currency === 'INR' ? 'selected' : ''}>₹ INR</option><option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>$ USD</option></select></div>
          <div class="form-group"><label class="form-label">Shift Hours</label><input type="number" class="form-input" id="setting-shift-duration" value="${settings.shift_duration || 9}"></div>
          <button type="submit" class="btn btn-primary">Save</button>
        </form>
      </div>`;
  } catch (error) { return `<div class="error-message"><p>Error: ${error.message}</p></div>`; }
}

// ===== WORK ENTRY FUNCTIONS =====
async function saveWorkEntry(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Saving...';
  try {
    await API.post('/work-entries', {
      employee_id: parseInt(document.getElementById('employee-select').value),
      work_type_id: parseInt(document.getElementById('work-type-select').value),
      product_id: parseInt(document.getElementById('product-select').value) || null,
      unit_id: parseInt(document.getElementById('unit-select').value),
      target_quantity: parseInt(document.getElementById('target-quantity').value)
    });
    loadPage('productivity/tracking');
  } catch (error) { alert('Error: ' + error.message); btn.disabled = false; btn.textContent = 'Start Entry'; }
}

function openFullEditEntry(entry) {
  currentEditEntry = entry;
  document.getElementById('edit-entry-id').value = entry.id;
  document.getElementById('edit-employee').value = entry.employee_id || entry.employee?.id || '';
  document.getElementById('edit-work-type').value = entry.work_type_id || entry.work_type?.id || '';
  document.getElementById('edit-product').value = entry.product_id || entry.product?.id || '';
  document.getElementById('edit-unit').value = entry.unit_id || entry.unit?.id || '';
  document.getElementById('edit-date').value = formatDateInput(entry.start_time);
  document.getElementById('edit-target').value = entry.target_quantity;
  document.getElementById('edit-actual').value = entry.actual_quantity || '';
  document.getElementById('edit-status').value = entry.status;
  document.getElementById('edit-notes').value = entry.notes || '';
  document.getElementById('edit-modal').style.display = 'flex';
}

function closeEditModal() { document.getElementById('edit-modal').style.display = 'none'; currentEditEntry = null; }

async function updateFullWorkEntry(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Saving...';
  const id = document.getElementById('edit-entry-id').value;
  const status = document.getElementById('edit-status').value;
  const actual = document.getElementById('edit-actual').value;
  try {
    if (status === 'complete' && actual) {
      await API.put(`/work-entries/${id}/complete`, { actual_quantity: parseInt(actual), notes: document.getElementById('edit-notes').value });
    } else {
      await API.put(`/work-entries/${id}`, { actual_quantity: actual ? parseInt(actual) : null, notes: document.getElementById('edit-notes').value, status });
    }
    closeEditModal(); loadPage('productivity/tracking');
  } catch (error) { alert('Error: ' + error.message); btn.disabled = false; btn.textContent = 'Save'; }
}

async function deleteEntry(id) {
  if (!confirm('Delete?')) return;
  try { await API.delete(`/work-entries/${id}`); loadPage('productivity/tracking'); } catch (error) { alert('Error: ' + error.message); }
}

// ===== CRUD HELPERS =====
const showAddForm = t => { document.getElementById(`add-${t}-form`).style.display = 'block'; document.getElementById(`new-${t}-name`).focus(); };
const hideAddForm = t => { document.getElementById(`add-${t}-form`).style.display = 'none'; document.getElementById(`new-${t}-name`).value = ''; };

async function addEmployee() { const n = document.getElementById('new-employee-name').value.trim(); if (!n) return alert('Enter name'); try { await API.post('/employees', { name: n }); invalidateCache('employees'); loadPage('productivity/settings'); } catch (e) { alert(e.message); } }
async function editEmployee(id, name) { const n = prompt('Edit:', name); if (!n?.trim()) return; try { await API.put(`/employees/${id}`, { name: n.trim() }); invalidateCache('employees'); loadPage('productivity/settings'); } catch (e) { alert(e.message); } }
async function toggleEmployee(id) { try { await API.patch(`/employees/${id}/toggle`, {}); invalidateCache('employees'); loadPage('productivity/settings'); } catch (e) { alert(e.message); } }

async function addWorkType() { const n = document.getElementById('new-worktype-name').value.trim(); if (!n) return alert('Enter name'); try { await API.post('/work-types', { name: n }); invalidateCache('workTypes'); loadPage('productivity/settings'); } catch (e) { alert(e.message); } }
async function editWorkType(id, name) { const n = prompt('Edit:', name); if (!n?.trim()) return; try { await API.put(`/work-types/${id}`, { name: n.trim() }); invalidateCache('workTypes'); loadPage('productivity/settings'); } catch (e) { alert(e.message); } }
async function deleteWorkType(id) { if (!confirm('Delete?')) return; try { await API.delete(`/work-types/${id}`); invalidateCache('workTypes'); loadPage('productivity/settings'); } catch (e) { alert(e.message); } }

async function addProduct() { const n = document.getElementById('new-product-name').value.trim(); if (!n) return alert('Enter name'); try { await API.post('/products', { name: n }); invalidateCache('products'); loadPage('productivity/settings'); } catch (e) { alert(e.message); } }
async function editProduct(id, name) { const n = prompt('Edit:', name); if (!n?.trim()) return; try { await API.put(`/products/${id}`, { name: n.trim() }); invalidateCache('products'); loadPage('productivity/settings'); } catch (e) { alert(e.message); } }
async function deleteProduct(id) { if (!confirm('Delete?')) return; try { await API.delete(`/products/${id}`); invalidateCache('products'); loadPage('productivity/settings'); } catch (e) { alert(e.message); } }

async function addUnit() { const n = document.getElementById('new-unit-name').value.trim(); if (!n) return alert('Enter name'); try { await API.post('/units', { name: n }); invalidateCache('units'); loadPage('productivity/settings'); } catch (e) { alert(e.message); } }
async function editUnit(id, name) { const n = prompt('Edit:', name); if (!n?.trim()) return; try { await API.put(`/units/${id}`, { name: n.trim() }); invalidateCache('units'); loadPage('productivity/settings'); } catch (e) { alert(e.message); } }
async function deleteUnit(id) { if (!confirm('Delete?')) return; try { await API.delete(`/units/${id}`); invalidateCache('units'); loadPage('productivity/settings'); } catch (e) { alert(e.message); } }

async function saveSettings(e) {
  e.preventDefault();
  try {
    await API.put('/settings', { company_name: document.getElementById('setting-company-name').value, currency: document.getElementById('setting-currency').value, shift_duration: document.getElementById('setting-shift-duration').value });
    invalidateCache('settings'); alert('Saved!');
  } catch (error) { alert(error.message); }
}

// ===== NAVIGATION =====
let currentPage = 'productivity/tracking';

async function getPageContent(p) {
  switch (p) {
    case 'productivity/tracking': return await generateTrackingPage();
    case 'productivity/analysis': return await generateAnalysisPage();
    case 'productivity/settings': return await generateProductivitySettingsPage();
    case 'expenses/transactions': return await generateExpensesTransactionsPage();
    case 'expenses/settings': return await generateExpensesSettingsPage();
    case 'sales/data-sources': return await generateDataSourcesPage();
    case 'sales/analysis': return await generateSalesAnalysisPage();
    case 'settings': return await generateGeneralSettingsPage();
    default: return '<div class="page-header"><h1>Not found</h1></div>';
  }
}

function toggleFolder(f) { document.querySelector(`[data-folder="${f}"]`).classList.toggle('open'); }
function toggleSidebar() { document.querySelector('.sidebar').classList.toggle('open'); document.querySelector('.sidebar-overlay').classList.toggle('show'); }
function closeSidebar() { document.querySelector('.sidebar').classList.remove('open'); document.querySelector('.sidebar-overlay').classList.remove('show'); }

async function loadPage(p) {
  showLoading(); closeSidebar();
  try { document.getElementById('main-content').innerHTML = await getPageContent(p); currentPage = p; updateActiveNav(); } catch (e) { showError(e.message); }
}

function updateActiveNav() {
  document.querySelectorAll('.nav-item, .nav-single').forEach(i => i.classList.remove('active'));
  document.querySelector(`[data-page="${currentPage}"]`)?.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  Promise.all([getCached('employees', '/employees/active'), getCached('workTypes', '/work-types'), getCached('products', '/products'), getCached('units', '/units'), getCached('settings', '/settings')])
    .then(() => loadPage('productivity/tracking'));
  document.querySelectorAll('.nav-item, .nav-single').forEach(i => i.addEventListener('click', e => { e.preventDefault(); const p = i.getAttribute('data-page'); if (p) loadPage(p); }));
});
