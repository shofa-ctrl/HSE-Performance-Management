window.HSE = window.HSE || {};
HSE.pages = {
  render() {
    HSE.charts.clear();
    const page = HSE.state.page;
    const host = document.getElementById('pageHost');
    host.innerHTML = this[page] ? this[page]() : this.executive();
    this.after(page);
    if (window.lucide) lucide.createIcons();
  },
  head(title, subtitle) { return `<div class="page-head"><div><h3>${title}</h3><p>${subtitle}</p></div><span class="badge-soft badge-info">${HSE.state.source}</span></div>`; },
  executive() {
    const k = HSE.data.kpi(), d = HSE.state.filtered;
    const kpis = [
      ['Total Inspection', k.totalInspection, 'clipboard-check', 'audit'], ['Total Finding', k.totalFinding, 'search-check', 'audit'],
      ['Total Incident', k.totalIncident, 'shield-alert', 'safety'], ['Unsafe Act', k.unsafeAct, 'alert-triangle', 'safety'],
      ['Unsafe Condition', k.unsafeCondition, 'shield-alert', 'safety'], ['Near Miss', k.nearMiss, 'eye', 'safety'],
      ['First Aid Case', k.fac, 'briefcase-medical', 'safety'], ['Medical Treatment Case', k.mtc, 'heart-pulse', 'safety'],
      ['Lost Time Injury', k.lti, 'timer-off', 'safety'], ['Property Damage', k.propertyDamage, 'wrench', 'safety'],
      ['CAPA Completion Rate', `${k.capaCompletion}%`, 'badge-check', 'capa'], ['Open CAPA', k.openCapa, 'folder-open', 'capa'],
      ['Due Soon', k.dueSoon, 'calendar-clock', 'capa'], ['Overdue CAPA', k.overdueCapa, 'calendar-x', 'capa'],
      ['Safety Score', k.safetyScore, 'gauge', 'analytics'], ['Compliance Score', k.complianceScore, 'badge-check', 'analytics'],
      ['Audit Score', k.auditScore, 'star', 'audit'], ['5R Score', k.fiveRScore, 'sparkles', 'audit'],
      ['Environmental Score', k.environmentalScore, 'leaf', 'environment'], ['Total Project', k.totalProject, 'rocket', 'project'],
      ['Active Permit', k.activePermit, 'file-check-2', 'permit'],
    ].map(([label, value, icon, page]) => ({ label, value: HSE.helpers.fmt(value).replace('NaN', '0'), icon, page, progress: Number(value) || 70, change: this.change(value), tone: this.tone(label, value) }));
    const events = this.events();
    return `<div class="page">${this.head('Executive Summary', '')}
      ${HSE.ui.kpis(kpis)}
      <div class="grid two-col">${HSE.ui.activity(events.slice(0, 12))}${HSE.ui.calendar(events)}</div>
      <div class="grid chart-grid mt-3">
        ${['Monthly Finding Trend', 'Monthly Incident Trend', 'Monthly CAPA Completion', 'Monthly Audit', 'Safety Score Trend', 'Compliance Trend', '5R Trend', 'Environmental Trend', 'Project Progress', 'Permit Trend', 'Department Performance', 'Risk Level Distribution', 'Finding Category', 'Incident Type', 'Audit Score', 'CAPA Status Pie', 'Finding by Department Bar'].map((t, i) => HSE.ui.chartCard(`execChart${i}`, t)).join('')}
      </div>
    </div>`;
  },
  safety() { return this.modulePage('Safety', 'Monitoring seluruh kejadian keselamatan kerja', 'safety', ['Unsafe Act', 'Unsafe Condition', 'Near Miss', 'First Aid Case', 'Medical Treatment Case', 'Lost Time Injury', 'Property Damage', 'Vehicle Accident', 'Safety Observation'], ['Incident Trend', 'Incident by Month', 'Incident by Department', 'Incident by Area', 'Incident by Severity', 'Incident by Type', 'Incident by Shift', 'Unsafe Act Trend', 'Unsafe Condition Trend', 'Near Miss Trend', 'Top 10 Unsafe Act', 'Top 10 Unsafe Condition', 'Top 10 Area', 'Top 10 Department', 'Root Cause Analysis']); },
  audit() { return this.modulePage('Audit & Inspection', 'Monitoring seluruh audit dan inspeksi', 'audit', ['Audit 5R', 'Safety Patrol', 'Safety Inspection'], ['Audit Trend', 'Finding Trend', 'Finding Category', 'Department Score', 'Risk Level', 'Finding Status', 'Finding by Area', 'Heatmap Finding', 'Audit Performance', 'Top Auditor']); },
  capa() { return this.modulePage('CAPA Center', 'Corrective and preventive action monitoring', 'capa', ['Open', 'On Progress', 'Closed', 'Due Soon', 'Overdue', 'Average Closing Time', 'Completion Rate', 'Verification Pending'], ['CAPA Trend', 'CAPA Aging', 'CAPA by Department', 'CAPA by Area', 'CAPA by PIC', 'CAPA by Status', 'CAPA by Risk Level', 'CAPA Completion']); },
  environment() { return this.modulePage('Environment', 'Monitoring seluruh aspek lingkungan', 'environment', ['Total Limbah B3 (kg)', 'Total Limbah Non-B3 (kg)', 'Total Pengangkutan Limbah', 'Total Manifest', 'Water Consumption (m³)', 'Electricity Consumption (kWh)', 'Air Limbah (m³)', 'pH', 'COD', 'BOD', 'Environmental Score'], ['Trend Limbah B3', 'Trend Limbah Non B3', 'Perbandingan Limbah', 'Top 10 Jenis Limbah', 'Jenis Limbah B3', 'Jenis Limbah Non B3', 'Manifest per Bulan', 'Water Consumption Trend', 'Electricity Consumption Trend', 'Air Limbah Trend', 'Trend pH', 'Trend COD', 'Trend BOD', 'Environmental Score Trend']); },
  project() { return this.modulePage('Project Improvement', 'Improvement project performance', 'project', ['Total Project', 'Completed', 'On Progress', 'Delayed', 'Cancelled', 'Budget', 'Actual Cost', 'Saving', 'Project Completion Rate'], ['Project Trend', 'Project Timeline', 'Progress', 'Budget vs Actual', 'Project by Category', 'Project by Department', 'Saving Trend']); },
  permit() { return this.modulePage('Permit To Work', 'Monitoring seluruh Permit To Work', 'permit', ['Total Permit', 'Open', 'Closed', 'Expired', 'Active', 'Confined Space', 'Hot Work', 'Electrical Work', 'Working at Height', 'Excavation', 'Cold Work', 'Lifting'], ['Permit Trend', 'Permit by Type', 'Permit by Department', 'Permit Status', 'Permit Expired', 'Permit per Area']); },
  analytics() { return this.modulePage('Analytics & Trends', 'Automatic HSE analytics and trend intelligence', 'analytics', ['Finding', 'Incident', 'Unsafe Act', 'Unsafe Condition', 'Department Ranking', 'Area Ranking', 'Project Ranking', 'Vendor Ranking'], ['Pareto Finding', 'Pareto Incident', 'Pareto Unsafe Act', 'Pareto Unsafe Condition', 'Department Ranking', 'Area Ranking', 'Project Ranking', 'Vendor Ranking', 'Risk Matrix', 'Heatmap Finding', 'Heatmap Incident', 'Monthly Trend', 'Yearly Trend', 'Moving Average', 'Forecast Trend', 'Top 10 Root Cause', 'Top 10 Area', 'Top 10 Department', 'Top 10 Finding', 'Top 10 Incident']); },
  reports() {
    return `<div class="page">${this.head('Reports', 'Create and export filtered reports')}<div class="grid kpi-grid">${['Executive Report', 'Monthly HSE Report', 'Safety Report', 'Audit Report', 'CAPA Report', 'Environment Report', 'Permit Report', 'Project Report', 'Training Report'].map((r) => `<button class="card action-button report-action" data-report="${r}"><i data-lucide="file-text"></i>${r}</button>`).join('')}</div>${HSE.ui.tableCard('reportTable', 'Filtered Report Data')}</div>`;
  },
  settings() {
    return `<div class="page">${this.head('Settings', 'Application configuration')}<div class="grid settings-grid"><div class="card"><div class="card-head"><h4>Appearance</h4></div><div class="setting-row"><span>Dark Mode</span><button id="settingsDark" class="action-button">Toggle</button></div><div class="setting-row"><span>Light Mode</span><button id="settingsLight" class="action-button">Apply</button></div><div class="setting-row"><span>Theme</span><strong>Enterprise Clean</strong></div></div><div class="card"><div class="card-head"><h4>Configuration</h4></div><div class="setting-row"><span>Reset Dashboard</span><button id="settingsReset" class="action-button">Reset</button></div><div class="setting-row"><span>Export Configuration</span><button id="settingsExportConfig" class="action-button">Export</button></div><div class="setting-row"><span>Import Configuration</span><label class="action-button">Import<input id="settingsImportConfig" type="file" accept=".json" hidden></label></div></div><div class="card"><div class="card-head"><h4>About Application</h4></div><div class="setting-row"><span>Dashboard Version</span><strong>${HSE.config.version}</strong></div><div class="setting-row"><span>Data Source</span><strong>${HSE.state.source}</strong></div><div class="setting-row"><span>Last Refresh</span><strong>${HSE.helpers.fmtDateTime(HSE.state.lastRefresh)}</strong></div></div></div></div>`;
  },
  modulePage(title, subtitle, key, kpiLabels, chartLabels) {
    const rows = key === 'analytics' ? Object.values(HSE.state.filtered).flat() : HSE.state.filtered[key] || [];
    const kpis = kpiLabels.map((label) => ({ label, value: this.valueFor(label, key), icon: this.iconFor(label), page: key, progress: Number(this.valueFor(label, key)) || 70, change: this.change(this.valueFor(label, key)), tone: this.tone(label, this.valueFor(label, key)) }));
    return `<div class="page">${this.head(title, subtitle)}${HSE.ui.kpis(kpis)}<div class="grid chart-grid">${chartLabels.map((label, i) => HSE.ui.chartCard(`${key}Chart${i}`, label)).join('')}</div>${key !== 'analytics' ? HSE.ui.tableCard(`${key}Table`, `${title} Table`) : ''}</div>`;
  },
  after(page) {
    this.bindCommon();
    if (page === 'executive') this.drawExecutive();
    else if (page === 'reports') HSE.tables.render('reportTable', Object.values(HSE.state.filtered).flat(), ['id', 'date', 'department', 'area', 'category', 'status', 'pic']);
    else if (page !== 'settings') this.drawModule(page);
    if (page === 'settings') this.bindSettings();
  },
  drawExecutive() {
    const h = HSE.helpers, d = HSE.state.filtered, k = HSE.data.kpi();
    const series = [h.byMonth(d.audit), h.byMonth(d.safety), HSE.config.months.map((_, i) => h.pct(d.capa.filter((r) => r.date?.getMonth() === i && r.status === 'Closed').length, d.capa.filter((r) => r.date?.getMonth() === i).length)), h.byMonth(d.audit), HSE.config.months.map(() => k.safetyScore), HSE.config.months.map(() => k.complianceScore), HSE.config.months.map(() => k.fiveRScore), HSE.config.months.map(() => k.environmentalScore), h.byMonth(d.project, (r) => r.progress / 100), h.byMonth(d.permit), HSE.helpers.group(d.audit, 'department').map(([, v]) => v), ['Critical', 'High', 'Medium', 'Low'].map((r) => d.audit.filter((x) => x.risk === r).length), HSE.helpers.group(d.audit, 'category').map(([, v]) => v), HSE.helpers.group(d.safety, 'incidentType').map(([, v]) => v), HSE.helpers.group(d.audit, 'auditType', 8, (r) => r.score || 0).map(([, v]) => v), HSE.helpers.group(d.capa, 'status').map(([, v]) => v), HSE.helpers.group(d.audit, 'department').map(([, v]) => v)];
    const labels = [HSE.config.months, HSE.config.months, HSE.config.months, HSE.config.months, HSE.config.months, HSE.config.months, HSE.config.months, HSE.config.months, HSE.config.months, HSE.config.months, HSE.helpers.group(d.audit, 'department').map(([x]) => x), ['Critical', 'High', 'Medium', 'Low'], HSE.helpers.group(d.audit, 'category').map(([x]) => x), HSE.helpers.group(d.safety, 'incidentType').map(([x]) => x), HSE.helpers.group(d.audit, 'auditType', 8).map(([x]) => x), HSE.helpers.group(d.capa, 'status').map(([x]) => x), HSE.helpers.group(d.audit, 'department').map(([x]) => x)];
    series.forEach((s, i) => {
      if ([11, 12, 13, 15].includes(i)) HSE.charts.doughnut(`execChart${i}`, labels[i], s);
      else if ([10, 16].includes(i)) HSE.charts.bar(`execChart${i}`, labels[i], s, 'Total', '#2563eb', true);
      else HSE.charts.line(`execChart${i}`, labels[i], s, 'Trend');
    });
    this.bindCalendar();
  },
  drawModule(page) {
    const d = HSE.state.filtered, h = HSE.helpers;
    const map = { safety: d.safety, audit: d.audit, capa: d.capa, environment: d.environment, project: d.project, permit: d.permit, analytics: Object.values(d).flat() };
    const rows = map[page] || [];
    document.querySelectorAll('canvas.chart').forEach((canvas, i) => {
      const id = canvas.id;
      if (/Pareto/i.test(canvas.closest('.card').innerText)) HSE.charts.pareto(id, h.group(rows, page === 'safety' ? 'rootCause' : 'finding'));
      else if (/Status|Type|Risk|Severity|Category|Distribution|Perbandingan/i.test(canvas.closest('.card').innerText)) HSE.charts.doughnut(id, h.group(rows, this.primaryField(page)).map(([x]) => x), h.group(rows, this.primaryField(page)).map(([, v]) => v));
      else HSE.charts.bar(id, h.group(rows, this.groupField(page)).map(([x]) => x), h.group(rows, this.groupField(page)).map(([, v]) => v), 'Total', '#2563eb', i % 3 === 0);
    });
    if (HSE.tables.columns[page] && document.getElementById(`${page}Table`)) HSE.tables.render(`${page}Table`, rows, HSE.tables.columns[page]);
  },
  bindCommon() {
    document.querySelectorAll('.kpi-card').forEach((el) => el.addEventListener('click', () => { if (el.dataset.page) HSE.app.navigate(el.dataset.page); }));
    document.querySelectorAll('.activity-item').forEach((el) => el.addEventListener('click', () => HSE.app.showDetail(JSON.parse(el.dataset.detail))));
    document.querySelectorAll('.report-action').forEach((el) => el.addEventListener('click', () => { HSE.ui.toast(el.dataset.report, 'Report generated with current filter.'); HSE.exporter.xlsx(`${el.dataset.report}.xlsx`); }));
  },
  bindCalendar() {
    document.getElementById('prevMonth')?.addEventListener('click', () => { HSE.state.calendarMonth.setMonth(HSE.state.calendarMonth.getMonth() - 1); HSE.pages.render(); });
    document.getElementById('nextMonth')?.addEventListener('click', () => { HSE.state.calendarMonth.setMonth(HSE.state.calendarMonth.getMonth() + 1); HSE.pages.render(); });
    document.querySelectorAll('.calendar-cell').forEach((cell) => cell.addEventListener('click', () => {
      const day = Number(cell.dataset.day), month = HSE.state.calendarMonth.getMonth(), year = HSE.state.calendarMonth.getFullYear();
      const events = this.events().filter((e) => e.date?.getFullYear() === year && e.date?.getMonth() === month && e.date?.getDate() === day);
      HSE.app.showDetail({ Tanggal: `${year}-${month + 1}-${day}`, Activities: events });
    }));
  },
  bindSettings() {
    document.getElementById('settingsDark')?.addEventListener('click', () => document.body.classList.toggle('dark'));
    document.getElementById('settingsLight')?.addEventListener('click', () => document.body.classList.remove('dark'));
    document.getElementById('settingsReset')?.addEventListener('click', () => HSE.app.reset());
    document.getElementById('settingsExportConfig')?.addEventListener('click', () => HSE.exporter.config());
  },
  events() {
    const d = HSE.state.filtered;
    return [...d.audit.slice(0, 80).map((r) => ({ type: 'Audit', time: r.date?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) || '-', name: r.auditType, ...r, priority: r.risk })), ...d.safety.slice(0, 80).map((r) => ({ type: 'Incident', time: r.date?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) || '-', name: r.incidentType, ...r, priority: r.severity })), ...d.capa.slice(0, 80).map((r) => ({ type: 'CAPA Due', time: '16:00', name: r.id, ...r, priority: r.risk })), ...d.permit.slice(0, 80).map((r) => ({ type: 'Permit', time: '08:00', name: r.permitType, ...r, priority: r.priority })), ...d.project.slice(0, 80).map((r) => ({ type: 'Project', time: '10:00', name: r.name, ...r, priority: r.status }))].sort((a, b) => (a.date || 0) - (b.date || 0));
  },
  insight(k, d) {
    const topDept = HSE.helpers.group(d.audit, 'department', 1)[0]?.[0] || 'Tidak Ada Data';
    const topFinding = HSE.helpers.group(d.audit, 'category', 1)[0]?.[0] || 'Tidak Ada Data';
    const b3 = HSE.helpers.group(d.environment.filter((r) => r.category === 'Limbah B3'), 'wasteType', 1, (r) => r.weight)[0];
    const non = HSE.helpers.group(d.environment.filter((r) => r.category === 'Limbah Non B3'), 'wasteType', 1, (r) => r.weight)[0];
    return `Pada periode ini dilakukan ${k.totalInspection} audit/inspeksi dengan ${k.totalFinding} temuan. CAPA completion rate mencapai ${k.capaCompletion}% dengan ${k.overdueCapa} CAPA overdue. LTI tercatat ${k.lti}. Departemen ${topDept} memiliki temuan tertinggi dengan kategori ${topFinding}. Limbah Non-B3 terbesar berasal dari ${non?.[0] || 'Tidak Ada Data'} sebesar ${HSE.helpers.fmt(non?.[1] || 0)} kg, sedangkan Limbah B3 terbesar adalah ${b3?.[0] || 'Tidak Ada Data'} sebesar ${HSE.helpers.fmt(b3?.[1] || 0)} kg. Rekomendasi utama adalah menyelesaikan CAPA overdue dan meningkatkan inspeksi pada area berisiko tinggi.`;
  },
  valueFor(label, key) {
    const d = HSE.state.filtered, h = HSE.helpers, k = HSE.data.kpi();
    const rows = d[key] || [];
    if (/Completion Rate|Project Completion/.test(label)) return `${h.pct(rows.filter((r) => ['Closed', 'Completed'].includes(r.status)).length, rows.length)}%`;
    if (/Average Closing/.test(label)) return `${Math.round(h.avg(rows.map((r) => h.daysBetween(r.date, r.closingDate || r.actualFinish)).filter(Boolean)))} d`;
    if (/Budget/.test(label)) return h.fmt(h.sum(rows, 'budget'));
    if (/Actual Cost/.test(label)) return h.fmt(h.sum(rows, 'actualCost'));
    if (/Saving/.test(label)) return h.fmt(h.sum(rows, 'saving'));
    if (/Water/.test(label)) return h.fmt(h.sum(rows, 'water'));
    if (/Electricity/.test(label)) return h.fmt(h.sum(rows, 'electricity'));
    if (/Air Limbah/.test(label)) return h.fmt(h.sum(rows, 'wastewater'));
    if (/pH/.test(label)) return h.avg(rows.map((r) => r.ph)).toFixed(1);
    if (/COD/.test(label)) return Math.round(h.avg(rows.map((r) => r.cod)));
    if (/BOD/.test(label)) return Math.round(h.avg(rows.map((r) => r.bod)));
    if (/Environmental Score/.test(label)) return k.environmentalScore;
    if (/Total Limbah B3/.test(label)) return h.fmt(h.sum(rows.filter((r) => r.category === 'Limbah B3'), 'weight'));
    if (/Total Limbah Non/.test(label)) return h.fmt(h.sum(rows.filter((r) => r.category === 'Limbah Non B3'), 'weight'));
    if (/Manifest/.test(label)) return HSE.helpers.unique(rows.map((r) => r.manifest)).length;
    if (/Due Soon/.test(label)) return rows.filter((r) => HSE.helpers.daysToDue(r.dueDate) >= 0 && HSE.helpers.daysToDue(r.dueDate) <= 7).length;
    if (/Overdue|Delayed|Expired|Cancelled|Open|Closed|Active|On Progress|Completed/.test(label)) return rows.filter((r) => label.includes(r.status)).length;
    if (/Audit 5R|Safety Patrol|Safety Inspection/.test(label)) return rows.filter((r) => r.auditType === label).length;
    if (/Verification Pending/.test(label)) return rows.filter((r) => r.verification === 'Pending').length;
    if (/Unsafe Act|Unsafe Condition/.test(label)) return d.audit.filter((r) => r.findingType === label).length;
    if (/Near Miss|First Aid|Medical|Lost Time|Property|Vehicle|Observation/.test(label)) return d.safety.filter((r) => label.includes(r.incidentType) || r.incidentType.includes(label.split(' ')[0])).length;
    if (/High|Medium|Low/.test(label)) return d.audit.filter((r) => label.includes(r.risk)).length;
    if (/Total Project/.test(label)) return d.project.length;
    if (/Total Permit/.test(label)) return d.permit.length;
    if (HSE.config.permitTypes.includes(label)) return d.permit.filter((r) => r.permitType === label).length;
    return rows.length;
  },
  iconFor(label) { if (/CAPA/.test(label)) return 'clipboard-list'; if (/Permit|Work/.test(label)) return 'file-check-2'; if (/Project|Budget|Saving/.test(label)) return 'rocket'; if (/Limbah|Water|Electricity|COD|BOD|pH/.test(label)) return 'leaf'; if (/Incident|Unsafe|Risk|Lost|Medical/.test(label)) return 'shield-alert'; return 'activity'; },
  tone(label, value) { if (/Overdue|Critical|Lost|Medical|Expired|Delayed|Cancelled/.test(label)) return 'critical'; if (/Due|Open|Medium|Warning|On Progress/.test(label)) return 'warning'; if (/Closed|Completion|Score|Active|Completed/.test(label)) return 'success'; return 'info'; },
  change(value) { const n = Number(String(value).replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? `${n % 17 - 8}%` : '0%'; },
  primaryField(page) { return ({ safety: 'incidentType', audit: 'category', capa: 'status', environment: 'category', project: 'status', permit: 'permitType', analytics: 'risk' })[page] || 'category'; },
  groupField(page) { return ({ safety: 'department', audit: 'department', capa: 'department', environment: 'wasteType', project: 'department', permit: 'department', analytics: 'department' })[page] || 'department'; },
};
