(function () {
  const state = {
    page: 'executive',
    raw: {},
    filtered: {},
    search: '',
    workbookFile: null,
    source: 'Snapshot data',
    charts: [],
  };

  const pages = [
    ['executive', 'Executive Summary', 'layout-dashboard'],
    ['safety', 'Safety', 'shield-alert'],
    ['audit', 'Audit & Inspection', 'clipboard-check'],
    ['capa', 'CAPA Center', 'clipboard-list'],
    ['environment', 'Environment', 'leaf'],
    ['project', 'Project Improvement', 'rocket'],
    ['permit', 'Permit To Work', 'file-check'],
    ['analytics', 'Analytics & Trends', 'chart-line'],
  ];

  const sheetMap = {
    safety: 'MASTER_SAFETY',
    finding: 'MASTER_FINDING',
    capa: 'MASTER_CAPA',
    environment: 'MASTER_ENVIRONMENT',
    project: 'MASTER_PROJECT',
    manhours: 'MASTER_MANHOURS',
    fiveR: 'MASTER_5R',
    apar: 'MASTER_APAR',
    permit: 'MASTER_PERMIT',
    lookup: 'LOOKUP',
  };

  const monthOrder = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const norm = (v) => String(v ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const unique = (arr) => [...new Set(arr.filter(v => v !== undefined && v !== null && String(v).trim() !== '').map(String))].sort((a,b) => a.localeCompare(b));
  const pick = (r, keys) => {
    for (const k of keys) if (r && r[k] !== undefined && r[k] !== null && String(r[k]).trim() !== '') return r[k];
    return '';
  };
  const asNumber = (v) => {
    if (typeof v === 'number') return v;
    const n = Number(String(v ?? '').replace(',', '.').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };
  const toDate = (v) => {
    if (!v) return null;
    if (v instanceof Date && !isNaN(v)) return v;
    if (typeof v === 'number') {
      const d = XLSX?.SSF ? XLSX.SSF.parse_date_code(v) : null;
      if (d) return new Date(d.y, d.m - 1, d.d);
    }
    const d = new Date(v);
    return isNaN(d) ? null : d;
  };
  const fmtDate = (v) => {
    const d = toDate(v);
    return d ? d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  };
  const getDate = (r) => toDate(pick(r, ['Tanggal', 'Tanggal Audit', 'Issue Date', 'Start Date', 'Expired Date', 'Due Date', 'Target Finish']));
  const getYear = (r) => String(pick(r, ['Tahun']) || getDate(r)?.getFullYear() || '');
  const getMonth = (r) => String(pick(r, ['Bulan']) || (getDate(r) ? monthOrder[getDate(r).getMonth()] : ''));
  const getDepartment = (r) => pick(r, ['Department', 'Departemen']);
  const getArea = (r) => pick(r, ['Area', 'Location']);
  const getPIC = (r) => pick(r, ['PIC', 'Auditor', 'Inspector', 'Approver']);
  const getStatus = (r) => pick(r, ['Status', 'Progress', 'Condition']);
  const getPriority = (r) => pick(r, ['Priority', 'Severity', 'Risk Level']);
  const rowText = (r) => norm(Object.values(r).join(' '));

  function getSeedModel() {
    try {
      const el = document.getElementById('hseWorkbookSeed');
      if (!el?.textContent?.trim()) return {};
      return JSON.parse(el.textContent);
    } catch (e) {
      console.warn('Seed data tidak terbaca:', e);
      return {};
    }
  }

  function normalizeModel(model) {
    const out = {};
    Object.entries(sheetMap).forEach(([key, sheet]) => {
      const rows = model[sheet] || model[sheet.toLowerCase()] || [];
      out[key] = Array.isArray(rows) ? rows : [];
    });
    return out;
  }

  function rowCount(model) {
    return Object.values(model || {}).reduce((t, rows) => t + (Array.isArray(rows) ? rows.length : 0), 0);
  }

  async function loadWorkbookFromUrl() {
    try {
      if (!window.XLSX || !/^https?:$/.test(location.protocol)) return null;
      const res = await fetch(`./HSE_Dashboard_Database.xlsx?v=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Excel tidak ditemukan (${res.status})`);
      const buf = await res.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: true });
      const model = {};
      wb.SheetNames.forEach(name => {
        model[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '', raw: false });
      });
      if (!rowCount(normalizeModel(model))) throw new Error('Excel terbaca, tapi data master kosong.');
      state.workbookFile = new File([buf], 'HSE_Dashboard_Database.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      state.source = 'HSE_Dashboard_Database.xlsx (Published)';
      return model;
    } catch (e) {
      console.warn('Workbook publish tidak terbaca, pakai snapshot:', e);
      return null;
    }
  }

  async function loadWorkbookFile(file) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array', cellDates: true });
    const model = {};
    wb.SheetNames.forEach(name => model[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '', raw: false }));
    return model;
  }

  function bind() {
    document.getElementById('collapseSidebar')?.addEventListener('click', () => document.getElementById('sidebar')?.classList.toggle('collapsed'));
    document.getElementById('sideNav')?.addEventListener('click', e => {
      const btn = e.target.closest('button[data-page]');
      if (!btn) return;
      state.page = btn.dataset.page;
      render();
    });
    const search = document.getElementById('globalSearch');
    const clear = document.getElementById('clearSearch');
    search?.addEventListener('input', () => { state.search = search.value; applyFilters(); renderPage(); });
    clear?.addEventListener('click', () => { search.value = ''; state.search = ''; applyFilters(); renderPage(); });
    document.querySelectorAll('.filter-bar select, .filter-bar input').forEach(el => el.addEventListener('change', () => { applyFilters(); renderPage(); }));
    document.getElementById('quickFilters')?.addEventListener('click', e => {
      const btn = e.target.closest('button[data-search]');
      if (!btn || !search) return;
      search.value = btn.dataset.search;
      state.search = search.value;
      applyFilters(); renderPage();
    });
    document.getElementById('excelInput')?.addEventListener('change', async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setLoading(true, 'Importing workbook...');
        const model = await loadWorkbookFile(file);
        state.raw = normalizeModel(model);
        state.workbookFile = file;
        state.source = `${file.name} (Imported)`;
        populateFilters(); applyFilters(); render();
        toast('Import berhasil', `${rowCount(state.raw).toLocaleString('id-ID')} baris data dimuat.`);
      } catch (err) { toast('Import gagal', err.message || 'File Excel tidak bisa dibaca.'); }
      finally { setLoading(false); e.target.value = ''; }
    });
    document.getElementById('importExcelButton')?.addEventListener('click', e => {
      if (e.target?.id !== 'excelInput') document.getElementById('excelInput')?.click();
    });
    document.getElementById('refreshData')?.addEventListener('click', async () => { await refreshWorkbook(); });
    document.getElementById('exportPdf')?.addEventListener('click', () => window.print());
    document.getElementById('exportExcel')?.addEventListener('click', exportExcel);
    document.getElementById('darkMode')?.addEventListener('click', () => document.body.classList.toggle('dark'));
    document.getElementById('notificationButton')?.addEventListener('click', showNotifications);
  }

  function renderNav() {
    const host = document.getElementById('sideNav');
    if (!host) return;
    host.innerHTML = pages.map(([id, label, icon]) => `<button data-page="${id}" class="${id === state.page ? 'active' : ''}"><i data-lucide="${icon}"></i><span class="nav-label">${label}</span></button>`).join('');
    if (window.lucide) lucide.createIcons();
  }

  function setLoading(active, text) {
    document.getElementById('loadingOverlay')?.remove();
    if (!active) return;
    document.getElementById('pageHost')?.insertAdjacentHTML('afterbegin', `<div id="loadingOverlay" class="card mb-3"><strong>${esc(text || 'Loading...')}</strong><div class="progress-line"><span style="width:72%"></span></div></div>`);
  }
  function toast(title, message) {
    const host = document.getElementById('toastHost');
    if (!host) return alert(`${title}\n${message}`);
    const id = `toast-${Date.now()}`;
    host.insertAdjacentHTML('beforeend', `<div id="${id}" class="toast show"><div class="toast-header"><strong class="me-auto">${esc(title)}</strong><button type="button" class="btn-close" onclick="this.closest('.toast').remove()"></button></div><div class="toast-body">${esc(message)}</div></div>`);
    setTimeout(() => document.getElementById(id)?.remove(), 4500);
  }

  function populateFilters() {
    const all = Object.values(state.raw).flat();
    const fill = (id, values) => {
      const el = document.getElementById(id); if (!el) return;
      const old = el.value;
      el.innerHTML = values.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
      if ([...el.options].some(o => o.value === old)) el.value = old;
    };
    fill('filterYear', ['All', ...unique(all.map(getYear))]);
    fill('filterMonth', ['All', ...monthOrder.filter(m => all.some(r => getMonth(r) === m))]);
    fill('filterDepartment', ['All', ...unique(all.map(getDepartment))]);
    fill('filterArea', ['All', ...unique(all.map(getArea))]);
    fill('filterPic', ['All', ...unique(all.map(getPIC))]);
    fill('filterRisk', ['All', ...unique(all.map(r => pick(r, ['Risk Level','Severity']))) ]);
    fill('filterStatus', ['All', ...unique(all.map(getStatus))]);
    fill('filterPriority', ['All', ...unique(all.map(getPriority))]);
    fill('filterAuditType', ['All', ...unique(state.raw.finding.map(r => pick(r, ['Jenis Audit','Audit Type']))) ]);
    fill('filterIncidentType', ['All', ...unique(state.raw.safety.map(r => pick(r, ['Incident Type']))) ]);
    fill('filterPermitType', ['All', ...unique(state.raw.permit.map(r => pick(r, ['Permit Type']))) ]);
    fill('filterWasteType', ['All', ...unique(state.raw.environment.map(r => pick(r, ['Jenis Limbah','Kategori']))) ]);
    fill('filterProject', ['All', ...unique(state.raw.project.map(r => pick(r, ['Project Name','Project']))) ]);
    fill('filterVendor', ['All', ...unique([...state.raw.environment, ...state.raw.permit, ...state.raw.project].map(r => pick(r, ['Vendor','Contractor']))) ]);
  }

  function getFilters() {
    const val = id => document.getElementById(id)?.value || 'All';
    return {
      year: val('filterYear'), month: val('filterMonth'), date: document.getElementById('filterDate')?.value || '', department: val('filterDepartment'), area: val('filterArea'), pic: val('filterPic'), risk: val('filterRisk'), status: val('filterStatus'), priority: val('filterPriority'), auditType: val('filterAuditType'), incidentType: val('filterIncidentType'), permitType: val('filterPermitType'), wasteType: val('filterWasteType'), project: val('filterProject'), vendor: val('filterVendor')
    };
  }

  function rowMatches(r, type, f) {
    if (f.year !== 'All' && getYear(r) !== f.year) return false;
    if (f.month !== 'All' && getMonth(r) !== f.month) return false;
    if (f.date) {
      const d = getDate(r);
      if (!d || d.toISOString().slice(0,10) !== f.date) return false;
    }
    if (f.department !== 'All' && getDepartment(r) !== f.department) return false;
    if (f.area !== 'All' && getArea(r) !== f.area) return false;
    if (f.pic !== 'All' && getPIC(r) !== f.pic) return false;
    if (f.risk !== 'All' && ![pick(r,['Risk Level']), pick(r,['Severity'])].includes(f.risk)) return false;
    if (f.status !== 'All' && getStatus(r) !== f.status) return false;
    if (f.priority !== 'All' && getPriority(r) !== f.priority) return false;
    if (f.auditType !== 'All' && type === 'finding' && pick(r, ['Jenis Audit','Audit Type']) !== f.auditType) return false;
    if (f.incidentType !== 'All' && type === 'safety' && pick(r, ['Incident Type']) !== f.incidentType) return false;
    if (f.permitType !== 'All' && type === 'permit' && pick(r, ['Permit Type']) !== f.permitType) return false;
    if (f.wasteType !== 'All' && type === 'environment' && ![pick(r,['Jenis Limbah']), pick(r,['Kategori'])].includes(f.wasteType)) return false;
    if (f.project !== 'All' && type === 'project' && pick(r, ['Project Name','Project']) !== f.project) return false;
    if (f.vendor !== 'All' && ![pick(r,['Vendor']), pick(r,['Contractor'])].includes(f.vendor)) return false;
    if (state.search && !rowText(r).includes(norm(state.search))) return false;
    return true;
  }

  function applyFilters() {
    const f = getFilters();
    state.filtered = {};
    Object.entries(state.raw).forEach(([type, rows]) => state.filtered[type] = rows.filter(r => rowMatches(r, type, f)));
  }

  function statusClass(v) {
    const n = norm(v);
    if (/overdue|expired|critical|delayed|open|major/.test(n)) return 'badge-soft badge-critical';
    if (/progress|medium|pending|scheduled/.test(n)) return 'badge-soft badge-warning';
    if (/close|closed|completed|normal|done|low/.test(n)) return 'badge-soft badge-success';
    return 'badge-soft badge-info';
  }
  function kpi(label, value, meta, icon, tone='info') {
    return `<div class="card kpi-card" data-tone="${tone}"><div class="kpi-top"><div><span class="kpi-label">${esc(label)}</span><strong class="kpi-value">${esc(value)}</strong></div><div class="kpi-icon"><i data-lucide="${icon}"></i></div></div><div class="kpi-meta"><span>${esc(meta || '')}</span></div></div>`;
  }
  function table(rows, cols, limit=12) {
    if (!rows?.length) return '<div class="empty-state">Tidak ada data untuk filter saat ini.</div>';
    const shown = rows.slice(0, limit);
    return `<div class="table-responsive"><table class="table table-sm align-middle"><thead><tr>${cols.map(c => `<th>${esc(c[0])}</th>`).join('')}</tr></thead><tbody>${shown.map(r => `<tr>${cols.map(c => `<td>${c[2] ? c[2](pick(r, c[1])) : esc(pick(r,c[1]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${rows.length > limit ? `<p class="text-muted small mt-2">Menampilkan ${limit} dari ${rows.length.toLocaleString('id-ID')} baris.</p>` : ''}`;
  }
  function chartCard(title, canvasId) {
    return `<div class="card"><div class="section-title"><h4>${esc(title)}</h4></div><canvas id="${canvasId}" height="120"></canvas></div>`;
  }
  function destroyCharts() { state.charts.forEach(c => c.destroy?.()); state.charts = []; }
  function addChart(id, config) {
    const canvas = document.getElementById(id);
    if (canvas && window.Chart) state.charts.push(new Chart(canvas, config));
  }
  function groupCount(rows, keyFn) {
    const m = {};
    rows.forEach(r => { const k = keyFn(r) || '-'; m[k] = (m[k] || 0) + 1; });
    return m;
  }
  function byMonth(rows) { const m = Object.fromEntries(monthOrder.map(x => [x,0])); rows.forEach(r => { const mo = getMonth(r); if (mo in m) m[mo]++; }); return monthOrder.map(x => m[x]); }
  function renderCharts() {
    if (!window.Chart) return;
    addChart('chartIncidentMonth', { type: 'line', data: { labels: monthOrder, datasets: [{ label: 'Incident', data: byMonth(state.filtered.safety), tension: .35 }] }, options: { responsive: true, plugins: { legend: { display: false } } } });
    const dept = groupCount(state.filtered.finding, getDepartment);
    addChart('chartFindingDept', { type: 'bar', data: { labels: Object.keys(dept).slice(0,10), datasets: [{ label: 'Finding', data: Object.values(dept).slice(0,10) }] }, options: { responsive: true, plugins: { legend: { display: false } } } });
    const st = groupCount([...state.filtered.finding, ...state.filtered.capa], getStatus);
    addChart('chartStatus', { type: 'doughnut', data: { labels: Object.keys(st), datasets: [{ data: Object.values(st) }] }, options: { responsive: true } });
  }

  function metrics() {
    const safety = state.filtered.safety || [], finding = state.filtered.finding || [], capa = state.filtered.capa || [], apar = state.filtered.apar || [], man = state.filtered.manhours || [];
    const open = rows => rows.filter(r => /open|progress|pending|overdue/i.test(getStatus(r))).length;
    const totalManhours = man.reduce((s,r) => s + asNumber(pick(r,['Manhours'])), 0);
    const lti = man.reduce((s,r) => s + asNumber(pick(r,['LTI'])), 0) || safety.filter(r => /lost time/i.test(pick(r,['Incident Type']))).length;
    const lostDays = man.reduce((s,r) => s + asNumber(pick(r,['Lost Days'])), 0);
    const ltifr = totalManhours ? ((lti * 1000000) / totalManhours) : 0;
    const ltisr = totalManhours ? ((lostDays * 1000000) / totalManhours) : 0;
    const openFind = open(finding);
    const safetyScore = Math.max(0, Math.round(100 - Math.min(40, safety.length * 1.5) - Math.min(30, openFind / 10)));
    return { totalIncident: safety.length, openFinding: openFind, openCapa: open(capa), expiredApar: apar.filter(r => /expired/i.test(`${getStatus(r)} ${pick(r,['Condition'])}`)).length, safetyScore, ltifr, ltisr };
  }

  function renderExecutive() {
    const m = metrics();
    return `<div class="page"><div class="page-head"><div><h3>Executive Summary</h3><p>${esc(state.source)} · ${rowCount(state.filtered).toLocaleString('id-ID')} baris sesuai filter</p></div></div>
      <div class="grid kpi-grid">
        ${kpi('Total Incident', m.totalIncident, 'Semua data safety', 'shield-alert')}
        ${kpi('Open Finding', m.openFinding, 'Temuan belum close', 'search-check', 'warning')}
        ${kpi('Open CAPA', m.openCapa, 'CAPA belum close', 'folder-open', 'warning')}
        ${kpi('Expired APAR', m.expiredApar, 'Perlu follow up', 'flame', m.expiredApar ? 'critical' : 'success')}
        ${kpi('Safety Score', m.safetyScore, 'Estimasi berbasis incident & finding', 'gauge', 'success')}
        ${kpi('LTIFR', m.ltifr.toFixed(2), 'Per 1.000.000 jam kerja', 'activity')}
        ${kpi('LTISR', m.ltisr.toFixed(2), 'Per 1.000.000 jam kerja', 'bar-chart-3')}
        ${kpi('Project Active', state.filtered.project.filter(r => !/completed|closed/i.test(getStatus(r))).length, 'Project belum selesai', 'rocket')}
      </div>
      <div class="grid chart-grid">${chartCard('Incident per Bulan', 'chartIncidentMonth')}${chartCard('Finding per Department', 'chartFindingDept')}${chartCard('Status Finding/CAPA', 'chartStatus')}</div>
      <div class="card mt-3"><div class="section-title"><h4>Latest Finding</h4><span>Top 10</span></div>${table(state.filtered.finding, [['ID',['Finding ID']],['Tanggal',['Tanggal']],['Department',['Department']],['Area',['Area']],['Finding',['Finding Description']],['Status',['Status'], v=>`<span class="${statusClass(v)}">${esc(v)}</span>`]], 10)}</div>
    </div>`;
  }

  function renderRowsPage(title, subtitle, rows, cols) {
    return `<div class="page"><div class="page-head"><div><h3>${esc(title)}</h3><p>${esc(subtitle)} · ${rows.length.toLocaleString('id-ID')} baris</p></div></div><div class="card">${table(rows, cols, 60)}</div></div>`;
  }

  function renderPage() {
    destroyCharts();
    const h = document.getElementById('pageHost'); if (!h) return;
    const commonStatus = v => `<span class="${statusClass(v)}">${esc(v)}</span>`;
    const page = state.page;
    if (page === 'executive') h.innerHTML = renderExecutive();
    else if (page === 'safety') h.innerHTML = renderRowsPage('Safety', 'Incident, FAC, MTC, LTI, dan pelaporan kecelakaan', state.filtered.safety, [['Incident ID',['Incident ID']],['Tanggal',['Tanggal'],fmtDate],['Department',['Department']],['Area',['Area']],['Incident Type',['Incident Type']],['Severity',['Severity'], commonStatus],['Description',['Description']],['Lost Days',['Lost Days']],['Status',['Status'], commonStatus]]);
    else if (page === 'audit') h.innerHTML = renderRowsPage('Audit & Inspection', 'Master finding dan temuan audit', state.filtered.finding, [['Finding ID',['Finding ID']],['Tanggal',['Tanggal'],fmtDate],['Bulan',['Bulan']],['Department',['Department']],['Area',['Area']],['Jenis Audit',['Jenis Audit']],['Risk',['Risk Level'], commonStatus],['Finding',['Finding Description']],['PIC',['PIC']],['Due Date',['Due Date'],fmtDate],['Status',['Status'], commonStatus]]);
    else if (page === 'capa') h.innerHTML = renderRowsPage('CAPA Center', 'Corrective dan preventive action', state.filtered.capa, [['CAPA ID',['CAPA ID']],['Finding ID',['Finding ID']],['Tanggal',['Tanggal'],fmtDate],['Department',['Department']],['Area',['Area']],['Finding',['Finding']],['PIC',['PIC']],['Due Date',['Due Date'],fmtDate],['Progress',['Progress'], commonStatus],['Status',['Status'], commonStatus]]);
    else if (page === 'environment') h.innerHTML = renderRowsPage('Environment', 'Limbah, manifest, vendor, dan parameter lingkungan', state.filtered.environment, [['Record ID',['Record ID']],['Tanggal',['Tanggal'],fmtDate],['Department',['Department']],['Area',['Area']],['Kategori',['Kategori']],['Jenis Limbah',['Jenis Limbah']],['Nilai',['Nilai']],['Berat',['Berat']],['Vendor',['Vendor']],['Manifest',['Nomor Manifest']],['Status',['Status'], commonStatus]]);
    else if (page === 'project') h.innerHTML = renderRowsPage('Project Improvement', 'Monitoring project HSE', state.filtered.project, [['Project ID',['Project ID']],['Tanggal',['Tanggal'],fmtDate],['Project Name',['Project Name']],['Department',['Department']],['Area',['Area']],['PIC',['PIC']],['Target Finish',['Target Finish'],fmtDate],['Progress',['Progress']],['Priority',['Priority'], commonStatus],['Status',['Status'], commonStatus]]);
    else if (page === 'permit') h.innerHTML = renderRowsPage('Permit To Work', 'Monitoring PTW dan pekerjaan kontraktor', state.filtered.permit, [['Permit ID',['Permit ID']],['Permit Number',['Permit Number']],['Tanggal',['Tanggal'],fmtDate],['Permit Type',['Permit Type']],['Department',['Department']],['Area',['Area']],['Contractor',['Contractor']],['PIC',['PIC']],['Issue Date',['Issue Date'],fmtDate],['Close Date',['Close Date'],fmtDate],['Status',['Status'], commonStatus],['Priority',['Priority'], commonStatus]]);
    else h.innerHTML = `<div class="page"><div class="page-head"><div><h3>Analytics & Trends</h3><p>Ringkasan tren berdasarkan data terfilter</p></div></div><div class="grid chart-grid">${chartCard('Incident per Bulan','chartIncidentMonth')}${chartCard('Finding per Department','chartFindingDept')}${chartCard('Status Finding/CAPA','chartStatus')}</div></div>`;
    if (window.lucide) lucide.createIcons();
    renderCharts();
    updateNotifications();
  }

  function render() { renderNav(); updateClock(); renderPage(); }
  function updateClock() {
    const now = new Date();
    const dc = document.getElementById('digitalClock'); if (dc) dc.textContent = now.toLocaleTimeString('id-ID');
    const td = document.getElementById('todayDate'); if (td) td.textContent = now.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  }
  function updateNotifications() {
    const m = metrics();
    const n = m.openFinding + m.openCapa + m.expiredApar;
    const el = document.getElementById('notificationCount'); if (el) el.textContent = n;
  }
  function showNotifications() {
    const m = metrics();
    const items = [`Open Finding: ${m.openFinding}`, `Open CAPA: ${m.openCapa}`, `Expired APAR: ${m.expiredApar}`, `Total Incident: ${m.totalIncident}`];
    const modal = document.getElementById('detailModal');
    document.getElementById('detailModalTitle').textContent = 'Notification Center';
    document.getElementById('detailModalBody').innerHTML = `<div class="activity-list">${items.map((x,i)=>`<div class="activity-item"><strong>${i+1}</strong><div><strong>${esc(x)}</strong><span>Data sesuai filter saat ini</span></div></div>`).join('')}</div>`;
    if (window.bootstrap && modal) bootstrap.Modal.getOrCreateInstance(modal).show();
  }
  async function refreshWorkbook() {
    setLoading(true, 'Refreshing workbook...');
    const model = await loadWorkbookFromUrl();
    if (model) { state.raw = normalizeModel(model); populateFilters(); applyFilters(); render(); toast('Refresh berhasil', 'Data published workbook berhasil dibaca ulang.'); }
    else { applyFilters(); render(); toast('Refresh selesai', 'Snapshot data tetap aktif.'); }
    setLoading(false);
  }
  function exportExcel() {
    if (!window.XLSX) return toast('Export gagal', 'Library XLSX tidak terbaca.');
    const wb = XLSX.utils.book_new();
    Object.entries(sheetMap).forEach(([key, sheet]) => {
      const ws = XLSX.utils.json_to_sheet(state.filtered[key] || []);
      XLSX.utils.book_append_sheet(wb, ws, sheet.slice(0,31));
    });
    XLSX.writeFile(wb, 'hse-dashboard-filtered-export.xlsx');
  }

  async function init() {
    bind();
    const seed = normalizeModel(getSeedModel());
    state.raw = seed;
    const published = await loadWorkbookFromUrl();
    if (published) state.raw = normalizeModel(published);
    populateFilters();
    applyFilters();
    render();
    setInterval(updateClock, 1000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
