window.HSE = window.HSE || {};
HSE.app = {
  init() {
    HSE.data.set(HSE.dummy.build(), 'Dummy HSE_DATABASE.xlsx');
    this.renderNav();
    this.bind();
    this.populateFilters();
    this.tickClock();
    setInterval(() => this.tickClock(), 1000);
    this.render();
    HSE.ui.toast('HSE Performance Management ready', 'Dummy data realistis aktif. Import Excel akan mengganti seluruh data.');
  },
  renderNav() {
    document.getElementById('sideNav').innerHTML = HSE.config.pages.map(([id, label, icon]) => `<button data-page="${id}" class="${id === HSE.state.page ? 'active' : ''}"><i data-lucide="${icon}"></i><span class="nav-label">${label}</span></button>`).join('');
    if (window.lucide) lucide.createIcons();
  },
  bind() {
    document.getElementById('collapseSidebar').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('collapsed'));
    document.getElementById('sideNav').addEventListener('click', (e) => { const btn = e.target.closest('button[data-page]'); if (btn) this.navigate(btn.dataset.page); });
    document.getElementById('globalSearch').addEventListener('input', (e) => { HSE.state.search = e.target.value; HSE.data.applyFilters(); this.render(); });
    document.querySelectorAll('.filter-bar select, .filter-bar input').forEach((el) => el.addEventListener('change', () => { HSE.data.applyFilters(); this.render(); }));
    document.getElementById('excelInput').addEventListener('change', async (e) => this.importExcel(e.target.files?.[0]));
    document.getElementById('exportPdf').addEventListener('click', () => HSE.exporter.pdf());
    document.getElementById('exportExcel').addEventListener('click', () => HSE.exporter.xlsx('hse-command-center-export.xlsx'));
    document.getElementById('refreshData').addEventListener('click', () => { HSE.data.applyFilters(); this.render(); HSE.ui.toast('Refresh complete', 'Dashboard data refreshed.'); });
    document.getElementById('darkMode').addEventListener('click', () => document.body.classList.toggle('dark'));
    document.getElementById('notificationButton').addEventListener('click', () => this.showDetail({ Notifications: HSE.state.notifications.slice(0, 20) }));
  },
  async importExcel(file) {
    if (!file) return;
    try {
      HSE.ui.toast('Import Excel', 'Reading workbook in browser...');
      const model = await HSE.excel.load(file);
      HSE.data.set(model, file.name);
      this.populateFilters();
      this.render();
      HSE.ui.toast('Import complete', `${file.name} loaded successfully.`);
    } catch (error) {
      HSE.ui.toast('Import failed', error.message || 'Excel format cannot be read.');
    }
  },
  populateFilters() {
    const all = Object.values(HSE.state.raw).flat(), h = HSE.helpers;
    const fill = (id, values) => { document.getElementById(id).innerHTML = values.map((v) => `<option>${h.esc(v)}</option>`).join(''); };
    fill('filterYear', ['All', '2026', ...h.unique(all.map((r) => r.date?.getFullYear()).filter(Boolean))]);
    fill('filterMonth', ['All', ...HSE.config.months]);
    fill('filterDepartment', ['All', ...h.unique([...HSE.config.departments, ...all.map((r) => r.department)])]);
    fill('filterArea', ['All', ...h.unique([...HSE.config.areas, ...all.map((r) => r.area)])]);
    fill('filterPic', ['All', ...h.unique(all.map((r) => r.pic))]);
    fill('filterRisk', ['All', ...HSE.config.risks]);
    fill('filterStatus', ['All', ...h.unique([...HSE.config.statuses, ...all.map((r) => r.status)])]);
    fill('filterPriority', ['All', ...HSE.config.priorities]);
    fill('filterAuditType', ['All', ...HSE.config.auditTypes]);
    fill('filterIncidentType', ['All', ...HSE.config.incidentTypes]);
    fill('filterPermitType', ['All', ...HSE.config.permitTypes]);
    fill('filterProject', ['All', ...h.unique(HSE.state.raw.project.map((r) => r.name))]);
    fill('filterVendor', ['All', ...h.unique([...HSE.state.raw.environment.map((r) => r.vendor), ...HSE.state.raw.permit.map((r) => r.vendor), ...HSE.state.raw.project.map((r) => r.vendor)])]);
  },
  render() {
    HSE.data.applyFilters();
    document.getElementById('notificationCount').textContent = HSE.state.filtered.capa.filter((r) => r.status === 'Overdue').length;
    this.renderNav();
    HSE.pages.render();
    this.drawSparks();
  },
  navigate(page) { HSE.state.page = page; this.render(); },
  openDetail(id) { this.showDetail({ Chart: id, Page: HSE.state.page, Filter: HSE.data.getFilters() }); },
  showDetail(data) {
    document.getElementById('detailModalTitle').textContent = 'Detail';
    document.getElementById('detailModalBody').innerHTML = `<pre class="mb-0">${HSE.helpers.esc(JSON.stringify(data, null, 2))}</pre>`;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('detailModal')).show();
  },
  reset() {
    HSE.state.search = '';
    document.getElementById('globalSearch').value = '';
    HSE.data.set(HSE.dummy.build(), 'Dummy HSE_DATABASE.xlsx');
    this.populateFilters();
    this.render();
    HSE.ui.toast('Dashboard reset', 'Configuration and data reset to realistic dummy dataset.');
  },
  tickClock() {
    const now = new Date();
    document.getElementById('digitalClock').textContent = now.toLocaleTimeString('id-ID');
    document.getElementById('todayDate').textContent = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  },
  drawSparks() {
    const base = HSE.helpers.byMonth(HSE.state.filtered.audit);
    document.querySelectorAll('.sparkline').forEach((canvas, i) => {
      new Chart(canvas, {
        type: 'line',
        data: { labels: HSE.config.months, datasets: [{ data: base.map((v, idx) => Math.max(0, v + ((i + idx) % 5) - 2)), borderColor: '#2563eb', borderWidth: 1.5, pointRadius: 0, tension: .35 }] },
        options: { responsive: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } },
      });
    });
  },
};
document.addEventListener('DOMContentLoaded', () => HSE.app.init());
