window.HSE = window.HSE || {};
HSE.pages = {
  render() {
    HSE.charts.clear();
    const page = HSE.state.page;
    const host = document.getElementById('pageHost');
    if (!HSE.data.hasData() && page !== 'settings') {
      host.innerHTML = `<div class="page"><div class="card empty-state"><strong>Belum ada data.</strong><span>Import workbook HSE_DATABASE.xlsx untuk mulai menggunakan dashboard.</span><label class="action-button mt-3">Import Workbook<input type="file" accept=".xlsx,.xlsm,.xls" hidden id="emptyImport"></label></div></div>`;
      document.getElementById('emptyImport')?.addEventListener('change', (e) => HSE.app.importExcel(e.target.files?.[0]));
      if (window.lucide) lucide.createIcons();
      return;
    }
    const filteredCount = Object.values(HSE.state.filtered || {}).flat().length + (HSE.state.schedules || []).length;
    if (!filteredCount && page !== 'settings') {
      host.innerHTML = `<div class="page"><div class="card empty-state"><strong>No matching data found.</strong><span>Tidak ada data sesuai kombinasi filter dan search saat ini.</span></div></div>`;
      return;
    }
    host.innerHTML = this[page] ? this[page]() : this.executive();
    this.after(page);
    if (window.lucide) lucide.createIcons();
  },
  head(title, subtitle) { return `<div class="page-head"><div><h3>${title}</h3><p>${subtitle}</p></div><span class="badge-soft badge-info">${HSE.state.source}</span></div>`; },
  executive() {
    const k = HSE.data.kpi(), d = HSE.state.filtered;
    const kpis = [
      ['Total Incident', k.totalIncident, 'shield-alert', 'safety'],
      ['Open Finding', k.openFinding, 'search-check', 'audit'],
      ['Open CAPA', k.openCapa, 'folder-open', 'capa'],
      ['Safety Score', k.safetyScore, 'gauge', 'analytics'],
      ['LTIFR', k.ltifr.toFixed(2), 'activity', 'analytics'],
      ['LTISR', k.ltisr.toFixed(2), 'bar-chart-3', 'analytics'],
      ['FAFR', k.fafr.toFixed(2), 'briefcase-medical', 'safety'],
      ['Manhours', HSE.helpers.fmt(k.manhours), 'timer', 'analytics'],
      ['Average 5R Score', `${Number(k.average5RScore || 0).toFixed(2)} / 5`, 'sparkles', 'audit'],
      ['APD Compliance', `${Number(k.apdCompliance || 0).toFixed(1)}%`, 'hard-hat', 'audit'],
    ].map(([label, value, icon, page]) => ({ label, value: typeof value === 'number' ? HSE.helpers.fmt(value) : String(value ?? '0').replace('NaN', '0'), icon, page, progress: Number.parseFloat(value) || 70, change: this.change(value), tone: this.tone(label, value) }));
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
  audit() {
    const page = this.modulePage('Audit & Inspection', 'Monitoring seluruh audit dan inspeksi', 'finding', ['Total Finding', 'Open Finding', 'Closed Finding', 'Overdue Finding'], ['Finding Trend', 'Risk Level', 'Finding Type', 'Department', 'Area', 'Root Cause', 'Monthly Trend']);
    return page.replace(/<\/div>$/, `${this.fiveRSection()}${this.apdSection()}</div>`);
  },
  capa() { return this.modulePage('CAPA Center', 'Corrective and preventive action monitoring', 'capa', ['Open', 'On Progress', 'Closed', 'Due Soon', 'Overdue', 'Average Closing Time', 'Completion Rate', 'Verification Pending'], ['CAPA Trend', 'CAPA Aging', 'CAPA by Department', 'CAPA by Area', 'CAPA by PIC', 'CAPA by Status', 'CAPA by Risk Level', 'CAPA Completion']); },
  environment() { return this.modulePage('Environment', 'Monitoring seluruh aspek lingkungan', 'environment', ['Total Limbah B3 (kg)', 'Total Limbah Non-B3 (kg)', 'Total Limbah Cair', 'Total Pengangkutan Limbah', 'Total Manifest', 'Water Consumption (m³)', 'Electricity Consumption (kWh)', 'Air Limbah (m³)', 'pH', 'COD', 'BOD', 'Environmental Score'], ['Trend Limbah B3', 'Trend Limbah Non B3', 'Trend Limbah Cair', 'Perbandingan Limbah', 'Top 10 Jenis Limbah', 'Jenis Limbah B3', 'Jenis Limbah Non B3', 'Jenis Limbah Cair', 'Manifest per Bulan', 'Water Consumption Trend', 'Electricity Consumption Trend', 'Air Limbah Trend', 'Trend pH', 'Trend COD', 'Trend BOD', 'Environmental Score Trend']); },
  project() {
    const page = this.modulePage('Project Improvement', 'Improvement project performance', 'project', ['Total Project', 'Completed', 'On Progress', 'Delayed', 'Progress %'], ['Project Trend', 'Project Timeline', 'Progress', 'Department Project', 'Project Completion']);
    return page.replace('</div>', `${this.projectCards()}</div>`);
  },
  permit() { return this.modulePage('Permit To Work', 'Monitoring seluruh Permit To Work', 'permit', ['Total Permit', 'Open', 'Closed', 'Expired', 'Active', 'Confined Space', 'Hot Work', 'Electrical Work', 'Working at Height', 'Excavation', 'Cold Work', 'Lifting'], ['Permit Trend', 'Permit by Type', 'Permit by Department', 'Permit Status', 'Permit Expired', 'Permit per Area']); },
  analytics() { return this.modulePage('Analytics & Trends', 'Automatic HSE analytics and trend intelligence', 'analytics', ['Incident Rate', 'Finding Rate', 'CAPA Completion', 'LTIFR', 'LTISR', 'FAFR', 'Manhours', 'Safety Score', 'Average 5R Score', 'APD Compliance'], ['Incident Trend', 'Finding Trend', 'CAPA Trend', 'LTIFR Trend', 'LTISR Trend', 'FAFR Trend', 'Manhours Trend', 'Root Cause Pareto', 'Finding Pareto', 'Department Performance', 'Risk Matrix', 'Heat Map', 'Monthly KPI', 'Top 10 Area', 'Top 10 Department', '5R Monthly Trend', '5R Department Performance', '5R Area Performance', '5R Heatmap', '5R Radar', '5R Ranking', 'APD Compliance Trend', 'APD Compliance Department', 'APD Compliance Area', 'APD Highest / Lowest']); },
  reports() {
    return `<div class="page">${this.head('Reports', 'Create and export filtered reports')}<div class="grid kpi-grid">${['Executive Report', 'Monthly HSE Report', 'Safety Report', 'Audit Report', 'CAPA Report', 'Environment Report', 'Permit Report', 'Project Report', 'Training Report'].map((r) => `<button class="card action-button report-action" data-report="${r}"><i data-lucide="file-text"></i>${r}</button>`).join('')}<button id="exportCsvReport" class="card action-button"><i data-lucide="file"></i>Export CSV</button><button id="exportPngReport" class="card action-button"><i data-lucide="image-down"></i>Export PNG (Active Chart)</button><button id="exportSvgReport" class="card action-button"><i data-lucide="image"></i>Export SVG (Active Chart)</button></div>${HSE.ui.tableCard('reportTable', 'Filtered Report Data')}</div>`;
  },
  settings() {
    return `<div class="page">${this.head('Settings', 'Application configuration')}<div class="grid settings-grid"><div class="card"><div class="card-head"><h4>Appearance</h4></div><div class="setting-row"><span>Theme (Light)</span><button id="settingsLight" class="action-button">Apply</button></div><div class="setting-row"><span>Import Workbook</span><label class="action-button">Import<input id="settingsImportWorkbook" type="file" accept=".xlsx,.xlsm,.xls" hidden></label></div><div class="setting-row"><span>Reset Filter</span><button id="settingsResetFilter" class="action-button">Reset</button></div></div><div class="card"><div class="card-head"><h4>Configuration</h4></div><div class="setting-row"><span>Backup Schedule</span><button id="settingsBackupSchedule" class="action-button">Backup</button></div><div class="setting-row"><span>Restore Schedule</span><label class="action-button">Restore<input id="settingsRestoreSchedule" type="file" accept=".json" hidden></label></div><div class="setting-row"><span>Clear Cache</span><button id="settingsClearCache" class="action-button">Clear</button></div><div class="setting-row"><span>Export Configuration</span><button id="settingsExportConfig" class="action-button">Export</button></div></div><div class="card"><div class="card-head"><h4>About Dashboard</h4></div><div class="setting-row"><span>Application Version</span><strong>${HSE.config.version}</strong></div><div class="setting-row"><span>Data Source</span><strong>${HSE.state.source}</strong></div><div class="setting-row"><span>Last Refresh</span><strong>${HSE.helpers.fmtDateTime(HSE.state.lastRefresh)}</strong></div></div></div></div>`;
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
    else if (page !== 'settings') {
      this.drawModule(page === 'audit' ? 'finding' : page);
      if (page === 'audit') this.drawFiveRAndApd();
    }
    if (page === 'settings') this.bindSettings();
  },
  drawExecutive() {
    const h = HSE.helpers, d = HSE.state.filtered, k = HSE.data.kpi();
    const findings = [...d.finding, ...d.audit];
    const series = [h.byMonth(findings), h.byMonth(d.safety), HSE.config.months.map((_, i) => h.pct(d.capa.filter((r) => r.date?.getMonth() === i && r.status === 'Closed').length, d.capa.filter((r) => r.date?.getMonth() === i).length)), h.byMonth(findings), HSE.config.months.map(() => k.safetyScore), HSE.config.months.map(() => k.complianceScore), HSE.config.months.map(() => k.fiveRScore), HSE.config.months.map(() => k.environmentalScore), h.byMonth(d.project, (r) => r.progress / 100), h.byMonth(d.permit), HSE.helpers.group(findings, 'department').map(([, v]) => v), ['Critical', 'High', 'Medium', 'Low'].map((r) => findings.filter((x) => x.risk === r).length), HSE.helpers.group(findings, 'category').map(([, v]) => v), HSE.helpers.group(d.safety, 'incidentType').map(([, v]) => v), HSE.helpers.group(findings, 'auditType', 8, (r) => r.score || 0).map(([, v]) => v), HSE.helpers.group(d.capa, 'status').map(([, v]) => v), HSE.helpers.group(findings, 'department').map(([, v]) => v)];
    const labels = [HSE.config.months, HSE.config.months, HSE.config.months, HSE.config.months, HSE.config.months, HSE.config.months, HSE.config.months, HSE.config.months, HSE.config.months, HSE.config.months, HSE.helpers.group(findings, 'department').map(([x]) => x), ['Critical', 'High', 'Medium', 'Low'], HSE.helpers.group(findings, 'category').map(([x]) => x), HSE.helpers.group(d.safety, 'incidentType').map(([x]) => x), HSE.helpers.group(findings, 'auditType', 8).map(([x]) => x), HSE.helpers.group(d.capa, 'status').map(([x]) => x), HSE.helpers.group(findings, 'department').map(([x]) => x)];
    series.forEach((s, i) => {
      if ([11, 12, 13, 15].includes(i)) HSE.charts.doughnut(`execChart${i}`, labels[i], s);
      else if ([10, 16].includes(i)) HSE.charts.bar(`execChart${i}`, labels[i], s, 'Total', '#2563eb', true);
      else HSE.charts.line(`execChart${i}`, labels[i], s, 'Trend');
    });
    this.bindCalendar();
  },
  drawModule(page) {
    const d = HSE.state.filtered, h = HSE.helpers;
    const map = { safety: d.safety, audit: [...d.finding, ...d.audit], finding: [...d.finding, ...d.audit], capa: d.capa, environment: d.environment, project: d.project, permit: d.permit, analytics: Object.values(d).flat() };
    const rows = map[page] || [];
    if (page === 'analytics') {
      const findings = [...d.finding, ...d.audit];
      const mh = d.manhours || [];
      const byMonthAvg = (field) => HSE.config.months.map((_, i) => Math.round(h.avg(mh.filter((r) => r.date?.getMonth() === i).map((r) => Number(r[field]) || 0)) * 100) / 100);
      const byMonthSum = (field) => HSE.config.months.map((_, i) => h.sum(mh.filter((r) => r.date?.getMonth() === i), field));
      HSE.charts.line('analyticsChart0', HSE.config.months, h.byMonth(d.safety), 'Incident');
      HSE.charts.line('analyticsChart1', HSE.config.months, h.byMonth(findings), 'Finding');
      HSE.charts.line('analyticsChart2', HSE.config.months, h.byMonth(d.capa), 'CAPA');
      HSE.charts.line('analyticsChart3', HSE.config.months, byMonthAvg('ltifr'), 'LTIFR');
      HSE.charts.line('analyticsChart4', HSE.config.months, byMonthAvg('ltisr'), 'LTISR');
      HSE.charts.line('analyticsChart5', HSE.config.months, byMonthAvg('fafr'), 'FAFR');
      HSE.charts.line('analyticsChart6', HSE.config.months, byMonthSum('manhours'), 'Manhours');
      HSE.charts.pareto('analyticsChart7', h.group([...findings, ...d.capa], 'rootCause'));
      HSE.charts.pareto('analyticsChart8', h.group(findings, 'findingType'));
      HSE.charts.bar('analyticsChart9', h.group(findings, 'department').map(([x]) => x), h.group(findings, 'department').map(([, v]) => v), 'Department', '#2563eb', true);
      HSE.charts.doughnut('analyticsChart10', ['Critical', 'High', 'Medium', 'Low'], ['Critical', 'High', 'Medium', 'Low'].map((risk) => findings.filter((r) => r.risk === risk).length));
      HSE.charts.bar('analyticsChart11', h.group(findings, 'area').map(([x]) => x), h.group(findings, 'area').map(([, v]) => v), 'Heat Map', '#2563eb', true);
      HSE.charts.line('analyticsChart12', HSE.config.months, HSE.config.months.map((_, i) => h.byMonth(d.safety)[i] + h.byMonth(findings)[i] + h.byMonth(d.capa)[i]), 'Monthly KPI');
      HSE.charts.bar('analyticsChart13', h.group([...findings, ...d.safety], 'area').map(([x]) => x), h.group([...findings, ...d.safety], 'area').map(([, v]) => v), 'Area', '#2563eb', true);
      HSE.charts.bar('analyticsChart14', h.group([...findings, ...d.safety], 'department').map(([x]) => x), h.group([...findings, ...d.safety], 'department').map(([, v]) => v), 'Department', '#2563eb', true);
      const fiveR = d.fiveR || [];
      const apd = findings.filter((r) => /inspeksi apd|apd/i.test(`${r.auditType} ${r.findingType} ${r.category}`));
      const compliance = (rows) => { const total = h.sum(rows, 'totalItem'), ok = h.sum(rows, 'itemOk'); return total ? Number(((ok / total) * 100).toFixed(1)) : h.pct(rows.filter((r) => r.status === 'Closed').length, rows.length); };
      const fiveRByDept = h.group(fiveR, 'department', 20, (r) => Number(r.averageScore) || 0);
      const fiveRByArea = h.group(fiveR, 'area', 20, (r) => Number(r.averageScore) || 0);
      HSE.charts.line('analyticsChart15', HSE.config.months, HSE.config.months.map((_, i) => Number(h.avg(fiveR.filter((r) => r.date?.getMonth() === i).map((r) => Number(r.averageScore) || 0)).toFixed(2))), '5R');
      HSE.charts.bar('analyticsChart16', fiveRByDept.map(([x]) => x), fiveRByDept.map(([, v]) => Number(v.toFixed(2))), '5R Dept', '#16a34a', true);
      HSE.charts.bar('analyticsChart17', fiveRByArea.map(([x]) => x), fiveRByArea.map(([, v]) => Number(v.toFixed(2))), '5R Area', '#2563eb', true);
      HSE.charts.bar('analyticsChart18', fiveRByArea.map(([x]) => x), fiveRByArea.map(([, v]) => Number(v.toFixed(2))), 'Heatmap', '#7c3aed', true);
      HSE.charts.radar('analyticsChart19', ['Ringkas', 'Rapi', 'Resik', 'Rawat', 'Rajin'], ['ringkas', 'rapi', 'resik', 'rawat', 'rajin'].map((x) => Number(h.avg(fiveR.map((r) => Number(r[x]) || 0)).toFixed(2))));
      HSE.charts.bar('analyticsChart20', fiveRByDept.map(([x]) => x), fiveRByDept.map(([, v]) => Number(v.toFixed(2))), 'Ranking', '#16a34a', true);
      HSE.charts.line('analyticsChart21', HSE.config.months, HSE.config.months.map((_, i) => compliance(apd.filter((r) => r.date?.getMonth() === i))), 'APD');
      const apdDept = h.group(apd, 'department', 20, () => 1).map(([name]) => [name, compliance(apd.filter((r) => r.department === name))]);
      const apdArea = h.group(apd, 'area', 20, () => 1).map(([name]) => [name, compliance(apd.filter((r) => r.area === name))]);
      HSE.charts.bar('analyticsChart22', apdDept.map(([x]) => x), apdDept.map(([, v]) => v), 'APD Dept', '#2563eb', true);
      HSE.charts.bar('analyticsChart23', apdArea.map(([x]) => x), apdArea.map(([, v]) => v), 'APD Area', '#2563eb', true);
      HSE.charts.doughnut('analyticsChart24', ['Highest', 'Lowest'], [Math.max(0, ...apdDept.map(([, v]) => v)), Math.min(100, ...apdDept.map(([, v]) => v))]);
      return;
    }
    document.querySelectorAll('canvas.chart').forEach((canvas, i) => {
      const id = canvas.id;
      if (/Pareto/i.test(canvas.closest('.card').innerText)) HSE.charts.pareto(id, h.group(rows, page === 'safety' ? 'rootCause' : 'finding'));
      else if (/Status|Type|Risk|Severity|Category|Distribution|Perbandingan/i.test(canvas.closest('.card').innerText)) HSE.charts.doughnut(id, h.group(rows, this.primaryField(page)).map(([x]) => x), h.group(rows, this.primaryField(page)).map(([, v]) => v));
      else HSE.charts.bar(id, h.group(rows, this.groupField(page)).map(([x]) => x), h.group(rows, this.groupField(page)).map(([, v]) => v), 'Total', '#2563eb', i % 3 === 0);
    });
    const tableKey = page === 'finding' ? 'audit' : page;
    if (HSE.tables.columns[tableKey] && document.getElementById(`${page}Table`)) HSE.tables.render(`${page}Table`, rows, HSE.tables.columns[tableKey]);
    if (page === 'project') this.bindProjectCards();
  },
  drawFiveRAndApd() {
    const d = HSE.state.filtered, h = HSE.helpers;
    const fiveR = d.fiveR || [];
    const findings = [...d.finding, ...d.audit];
    const apd = findings.filter((r) => /inspeksi apd|apd/i.test(`${r.auditType} ${r.findingType} ${r.category}`));
    if (fiveR.length) {
      const byDept = h.group(fiveR, 'department', 20, (r) => Number(r.averageScore) || 0);
      const byArea = h.group(fiveR, 'area', 20, (r) => Number(r.averageScore) || 0);
      const scoreSeries = HSE.config.months.map((_, i) => Number(h.avg(fiveR.filter((r) => r.date?.getMonth() === i).map((r) => Number(r.averageScore) || 0)).toFixed(2)));
      HSE.charts.gauge('fiveRChart0', Number(h.avg(fiveR.map((r) => Number(r.averageScore) || 0)).toFixed(2)), 5);
      HSE.charts.line('fiveRChart1', HSE.config.months, scoreSeries, 'Average 5R');
      HSE.charts.bar('fiveRChart2', byDept.map(([x]) => x), byDept.map(([, v]) => Number(v.toFixed(2))), 'Department', '#16a34a', true);
      HSE.charts.bar('fiveRChart3', byArea.map(([x]) => x), byArea.map(([, v]) => Number(v.toFixed(2))), 'Area', '#2563eb', true);
      HSE.charts.radar('fiveRChart4', ['Ringkas', 'Rapi', 'Resik', 'Rawat', 'Rajin'], ['Ringkas', 'Rapi', 'Resik', 'Rawat', 'Rajin'].map((x) => Number(h.avg(fiveR.map((r) => Number(r[x.toLowerCase()]) || 0)).toFixed(2))));
      HSE.charts.bar('fiveRChart5', byArea.map(([x]) => x), byArea.map(([, v]) => Number(v.toFixed(2))), 'Heatmap', '#7c3aed', true);
      HSE.charts.bar('fiveRChart6', byDept.slice(0, 5).map(([x]) => x), byDept.slice(0, 5).map(([, v]) => Number(v.toFixed(2))), 'Top 5', '#16a34a', true);
      const bottom = [...byDept].sort((a, b) => a[1] - b[1]).slice(0, 5);
      HSE.charts.bar('fiveRChart7', bottom.map(([x]) => x), bottom.map(([, v]) => Number(v.toFixed(2))), 'Bottom 5', '#dc2626', true);
      HSE.charts.gauge('fiveRChart8', Math.max(...fiveR.map((r) => Number(r.averageScore) || 0)), 5);
      HSE.charts.gauge('fiveRChart9', Math.min(...fiveR.map((r) => Number(r.averageScore) || 0)), 5);
      HSE.tables.render('fiveRTable', fiveR, ['id', 'date', 'department', 'area', 'ringkas', 'rapi', 'resik', 'rawat', 'rajin', 'totalScore', 'averageScore', 'auditor', 'remark']);
    }
    if (apd.length) {
      const compliance = (rows) => {
        const total = h.sum(rows, 'totalItem'), ok = h.sum(rows, 'itemOk');
        return total ? Number(((ok / total) * 100).toFixed(1)) : h.pct(rows.filter((r) => r.status === 'Closed').length, rows.length);
      };
      const byDept = h.group(apd, 'department', 20, () => 1).map(([name]) => [name, compliance(apd.filter((r) => r.department === name))]);
      const byArea = h.group(apd, 'area', 20, () => 1).map(([name]) => [name, compliance(apd.filter((r) => r.area === name))]);
      const trend = HSE.config.months.map((_, i) => compliance(apd.filter((r) => r.date?.getMonth() === i)));
      HSE.charts.gauge('apdChart0', compliance(apd), 100);
      HSE.charts.gauge('apdChart1', compliance(apd), 100);
      HSE.charts.line('apdChart2', HSE.config.months, trend, 'APD Compliance');
      HSE.charts.bar('apdChart3', byDept.map(([x]) => x), byDept.map(([, v]) => v), 'Department', '#2563eb', true);
      HSE.charts.bar('apdChart4', byArea.map(([x]) => x), byArea.map(([, v]) => v), 'Area', '#2563eb', true);
      HSE.charts.doughnut('apdChart5', ['Open', 'Closed'], [apd.filter((r) => r.status === 'Open').length, apd.filter((r) => r.status === 'Closed').length]);
      HSE.charts.doughnut('apdChart6', ['Closed', 'Not Closed'], [apd.filter((r) => r.status === 'Closed').length, apd.filter((r) => r.status !== 'Closed').length]);
      HSE.charts.doughnut('apdChart7', h.group(apd, 'risk').map(([x]) => x), h.group(apd, 'risk').map(([, v]) => v));
      HSE.charts.pareto('apdChart8', h.group(apd, 'rootCause'));
    }
  },
  bindCommon() {
    document.querySelectorAll('.kpi-card').forEach((el) => el.addEventListener('click', () => { if (el.dataset.page) HSE.app.navigate(el.dataset.page); }));
    document.querySelectorAll('.activity-item').forEach((el) => el.addEventListener('click', () => HSE.app.showDetail(JSON.parse(el.dataset.detail))));
    document.querySelectorAll('.report-action').forEach((el) => el.addEventListener('click', () => { HSE.ui.toast(el.dataset.report, 'Report generated with current filter.'); HSE.exporter.xlsx(`${el.dataset.report}.xlsx`); }));
    document.getElementById('exportCsvReport')?.addEventListener('click', () => HSE.exporter.csv('hse-report.csv'));
    document.getElementById('exportPngReport')?.addEventListener('click', () => HSE.exporter.png());
    document.getElementById('exportSvgReport')?.addEventListener('click', () => HSE.exporter.svg());
  },
  bindCalendar() {
    document.getElementById('prevMonth')?.addEventListener('click', () => { HSE.state.calendarMonth.setMonth(HSE.state.calendarMonth.getMonth() - 1); HSE.pages.render(); });
    document.getElementById('nextMonth')?.addEventListener('click', () => { HSE.state.calendarMonth.setMonth(HSE.state.calendarMonth.getMonth() + 1); HSE.pages.render(); });
    document.querySelectorAll('.calendar-cell').forEach((cell) => cell.addEventListener('click', () => {
      const day = Number(cell.dataset.day), month = HSE.state.calendarMonth.getMonth(), year = HSE.state.calendarMonth.getFullYear();
      const events = this.events().filter((e) => e.date?.getFullYear() === year && e.date?.getMonth() === month && e.date?.getDate() === day);
      HSE.app.showCalendarModal(new Date(year, month, day), events);
    }));
    document.getElementById('addScheduleFloating')?.addEventListener('click', () => HSE.app.showCalendarModal(HSE.state.calendarMonth, []));
    document.querySelectorAll('.calendar-cell').forEach((cell) => {
      cell.addEventListener('dragstart', (e) => { const day = Number(cell.dataset.day); const month = HSE.state.calendarMonth.getMonth(); const year = HSE.state.calendarMonth.getFullYear(); const manual = this.events().find((x) => x.manual && x.date?.getFullYear() === year && x.date?.getMonth() === month && x.date?.getDate() === day); if (manual) e.dataTransfer.setData('text/plain', manual.id); });
      cell.addEventListener('dragover', (e) => e.preventDefault());
      cell.addEventListener('drop', (e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); const item = HSE.state.schedules.find((s) => s.id === id); if (item) { const day = Number(cell.dataset.day); const month = HSE.state.calendarMonth.getMonth(); const year = HSE.state.calendarMonth.getFullYear(); item.date = HSE.helpers.fmtDate(new Date(year, month, day)); HSE.app.persistSchedules(); HSE.app.render(); HSE.ui.toast('Schedule moved', 'Tanggal schedule berhasil diperbarui.'); } });
    });
  },
  bindSettings() {
    document.getElementById('settingsLight')?.addEventListener('click', () => document.body.classList.remove('dark'));
    document.getElementById('settingsImportWorkbook')?.addEventListener('change', (e) => HSE.app.importExcel(e.target.files?.[0]));
    document.getElementById('settingsResetFilter')?.addEventListener('click', () => HSE.app.resetFilters());
    document.getElementById('settingsBackupSchedule')?.addEventListener('click', () => HSE.app.backupSchedules());
    document.getElementById('settingsRestoreSchedule')?.addEventListener('change', (e) => HSE.app.restoreSchedules(e.target.files?.[0]));
    document.getElementById('settingsClearCache')?.addEventListener('click', () => HSE.app.clearCache());
    document.getElementById('settingsExportConfig')?.addEventListener('click', () => HSE.exporter.config());
  },
  projectCards() {
    const rows = HSE.state.filtered.project.slice(0, 12);
    if (!rows.length) return '<div class="card empty-state mt-3">Belum ada data project.</div>';
    return `<div class="grid kpi-grid mt-3">${rows.map((p) => `<article class="card project-card" data-id="${p.id}"><div class="card-head"><h4>${HSE.helpers.esc(p.name || p.id)}</h4><span class="badge-soft ${HSE.ui.badge(p.status)}">${HSE.helpers.esc(p.status)}</span></div><p>${HSE.helpers.esc(p.department || '-')} • ${HSE.helpers.esc(p.area || '-')}</p><div class="progress-line"><span style="width:${Math.max(0, Math.min(100, Number(p.progress || 0)))}%"></span></div><div class="kpi-meta"><span>PIC: ${HSE.helpers.esc(p.pic || '-')}</span><span>${Number(p.progress || 0)}%</span></div><small>${HSE.helpers.esc(p.benefit || '')}</small></article>`).join('')}</div>`;
  },
  fiveRSection() {
    const rows = HSE.state.filtered.fiveR || [];
    if (!rows.length) return `<section class="mt-3"><div class="card empty-state"><strong>Data Audit 5R Belum Tersedia</strong><span>MASTER_5R belum tersedia atau tidak sesuai filter.</span></div></section>`;
    const cards = ['Average Score', 'Highest Score', 'Lowest Score', 'Top 5 Department', 'Bottom 5 Department'].map((x) => `<div class="mini-kpi"><span>${x}</span><strong>${this.valueFor(x, 'fiveR')}</strong></div>`).join('');
    return `<section class="mt-3"><div class="section-title"><h4>5R Performance</h4><span>Average score 1.00 - 5.00</span></div><div class="card mini-kpi-row">${cards}</div><div class="grid chart-grid mt-3">${['Average Score', 'Monthly Trend', 'Department Ranking', 'Area Ranking', 'Radar Chart', 'Heatmap', 'Top 5 Department', 'Bottom 5 Department', 'Highest Score', 'Lowest Score'].map((t, i) => HSE.ui.chartCard(`fiveRChart${i}`, t)).join('')}</div>${HSE.ui.tableCard('fiveRTable', '5R Detail')}</section>`;
  },
  apdSection() {
    const findings = [...HSE.state.filtered.finding, ...HSE.state.filtered.audit];
    const rows = findings.filter((r) => /inspeksi apd|apd/i.test(`${r.auditType} ${r.findingType} ${r.category}`));
    if (!rows.length) return `<section class="mt-3"><div class="card empty-state"><strong>Data APD Compliance Belum Tersedia</strong><span>Gunakan Jenis Audit Inspeksi APD atau Finding Type APD pada MASTER_FINDING.</span></div></section>`;
    const cards = ['Average Compliance', 'Open APD Finding', 'Closed APD Finding', 'Highest Compliance', 'Lowest Compliance'].map((x) => `<div class="mini-kpi"><span>${x}</span><strong>${this.valueFor(x, 'apd')}</strong></div>`).join('');
    return `<section class="mt-3"><div class="section-title"><h4>APD Compliance</h4><span>Target compliance 100%</span></div><div class="card mini-kpi-row">${cards}</div><div class="grid chart-grid mt-3">${['Average Compliance', 'Gauge', 'Monthly Trend', 'Department Comparison', 'Area Comparison', 'Open APD Finding', 'Closed APD Finding', 'Risk Level', 'Root Cause'].map((t, i) => HSE.ui.chartCard(`apdChart${i}`, t)).join('')}</div></section>`;
  },
  bindProjectCards() {
    document.querySelectorAll('.project-card').forEach((card) => card.addEventListener('click', () => {
      const item = HSE.state.filtered.project.find((p) => p.id === card.dataset.id);
      HSE.app.showDetail(item || {});
    }));
  },
  events() {
    const d = HSE.state.filtered;
    const findings = [...d.finding, ...d.audit];
    const f = HSE.data.getFilters();
    const q = HSE.helpers.norm(HSE.state.search);
    const manualMatch = (s) => (!q || Object.values(s).some((v) => HSE.helpers.norm(v).includes(q)))
      && (!f.year || f.year === 'All' || String(new Date(s.date).getFullYear()) === f.year)
      && (!f.month || f.month === 'All' || HSE.config.months[new Date(s.date).getMonth()] === f.month)
      && (!f.department || f.department === 'All' || s.department === f.department)
      && (!f.area || f.area === 'All' || s.area === f.area)
      && (!f.pic || f.pic === 'All' || s.pic === f.pic)
      && (!f.status || f.status === 'All' || s.status === f.status)
      && (!f.priority || f.priority === 'All' || s.priority === f.priority);
    const manual = (HSE.state.schedules || []).filter(manualMatch).map((s) => ({ ...s, type: 'Schedule', name: s.title, date: new Date(`${s.date}T${s.startTime || '08:00'}`), time: s.startTime || '-', manual: true }));
    const events = [...findings.slice(0, 80).map((r) => ({ type: /apd/i.test(`${r.auditType} ${r.findingType}`) ? 'APD' : 'Finding', time: r.date?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) || '09.15', name: `Finding ${r.department} ${r.status}`, ...r, priority: r.risk })), ...d.safety.slice(0, 80).map((r) => ({ type: 'Incident', time: r.date?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) || '10.30', name: r.incidentType, ...r, priority: r.severity })), ...d.capa.slice(0, 80).map((r) => ({ type: 'CAPA', time: '13.00', name: `CAPA ${r.id} ${r.status}`, ...r, priority: r.risk })), ...d.apar.slice(0, 80).map((r) => ({ type: 'APAR', time: '10.00', name: `APAR ${r.id || r.aparNumber || ''} ${r.status || 'Inspection'}`, ...r, priority: r.status })), ...d.fiveR.slice(0, 80).map((r) => ({ type: 'Audit 5R', time: '09.00', name: `Audit 5R ${r.department} Score ${Number(r.averageScore || 0).toFixed(2)}`, ...r, priority: r.averageScore >= 4.5 ? 'Low' : r.averageScore >= 4 ? 'Medium' : 'High' })), ...d.permit.slice(0, 80).map((r) => ({ type: 'Permit', time: '08.00', name: `Permit ${r.permitType} dibuat`, ...r, priority: r.priority })), ...d.project.slice(0, 80).map((r) => ({ type: 'Project', time: '13.00', name: `Project ${r.name} Progress ${r.progress || 0}%`, ...r, priority: r.status })), ...manual].sort((a, b) => (b.date || 0) - (a.date || 0));
    return events.length ? events : [{ type: 'Info', time: '-', name: 'Tidak ada aktivitas hari ini.', department: '-', area: '-', pic: '-', status: '-', priority: 'Low', date: new Date() }];
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
    if (/Average 5R Score/.test(label)) return `${Number(k.average5RScore || 0).toFixed(2)} / 5`;
    if (/APD Compliance/.test(label)) return `${Number(k.apdCompliance || 0).toFixed(1)}%`;
    if (/Total Limbah B3/.test(label)) return h.fmt(h.sum(rows.filter((r) => r.category === 'Limbah B3'), 'weight'));
    if (/Total Limbah Non/.test(label)) return h.fmt(h.sum(rows.filter((r) => r.category === 'Limbah Non B3'), 'weight'));
    if (/Total Limbah Cair/.test(label)) return h.fmt(rows.filter((r) => r.category === 'Limbah Cair').reduce((total, row) => total + (Number(row.wastewater || row.value || row.weight) || 0), 0));
    if (/Manifest/.test(label)) return HSE.helpers.unique(rows.map((r) => r.manifest)).length;
    if (/Due Soon/.test(label)) return rows.filter((r) => HSE.helpers.daysToDue(r.dueDate) >= 0 && HSE.helpers.daysToDue(r.dueDate) <= 7).length;
    if (/Overdue|Delayed|Expired|Cancelled|Open|Closed|Active|On Progress|Completed/.test(label)) return rows.filter((r) => label.includes(r.status)).length;
    if (/Audit 5R|Safety Patrol|Safety Inspection/.test(label)) return rows.filter((r) => r.auditType === label).length;
    if (/Verification Pending/.test(label)) return rows.filter((r) => r.verification === 'Pending').length;
    const findings = [...d.finding, ...d.audit];
    if (/Total Finding/.test(label)) return findings.length;
    if (/Open Finding/.test(label)) return findings.filter((r) => r.status === 'Open').length;
    if (/Closed Finding/.test(label)) return findings.filter((r) => r.status === 'Closed').length;
    if (/Overdue Finding/.test(label)) return findings.filter((r) => r.status === 'Overdue').length;
    if (/Unsafe Act|Unsafe Condition/.test(label)) return findings.filter((r) => r.findingType === label).length;
    if (/Near Miss|First Aid|Medical|Lost Time|Property|Vehicle|Observation/.test(label)) return d.safety.filter((r) => label.includes(r.incidentType) || r.incidentType.includes(label.split(' ')[0])).length;
    if (/High|Medium|Low/.test(label)) return findings.filter((r) => label.includes(r.risk)).length;
    if (/Total Project/.test(label)) return d.project.length;
    if (/Total Permit/.test(label)) return d.permit.length;
    if (HSE.config.permitTypes.includes(label)) return d.permit.filter((r) => r.permitType === label).length;
    if (key === 'fiveR') {
      const scores = d.fiveR.map((r) => Number(r.averageScore) || 0).filter(Boolean);
      const dept = h.group(d.fiveR, 'department', 50, (r) => Number(r.averageScore) || 0);
      if (/Average Score/.test(label)) return Number(h.avg(scores).toFixed(2));
      if (/Highest Score/.test(label)) return scores.length ? Math.max(...scores).toFixed(2) : '0.00';
      if (/Lowest Score/.test(label)) return scores.length ? Math.min(...scores).toFixed(2) : '0.00';
      if (/Top 5 Department/.test(label)) return dept.slice(0, 5).map(([x]) => x).join(', ') || '-';
      if (/Bottom 5 Department/.test(label)) return [...dept].sort((a, b) => a[1] - b[1]).slice(0, 5).map(([x]) => x).join(', ') || '-';
    }
    if (key === 'apd') {
      const apd = findings.filter((r) => /inspeksi apd|apd/i.test(`${r.auditType} ${r.findingType} ${r.category}`));
      const compliance = (items) => { const total = h.sum(items, 'totalItem'), ok = h.sum(items, 'itemOk'); return total ? (ok / total) * 100 : h.pct(items.filter((r) => r.status === 'Closed').length, items.length); };
      if (/Average Compliance/.test(label)) return `${compliance(apd).toFixed(1)}%`;
      if (/Open APD Finding/.test(label)) return apd.filter((r) => r.status === 'Open').length;
      if (/Closed APD Finding/.test(label)) return apd.filter((r) => r.status === 'Closed').length;
      const byDept = h.group(apd, 'department', 50, () => 1).map(([name]) => [name, compliance(apd.filter((r) => r.department === name))]);
      if (/Highest Compliance/.test(label)) return byDept.length ? `${byDept.sort((a, b) => b[1] - a[1])[0][0]} ${byDept[0][1].toFixed(1)}%` : '-';
      if (/Lowest Compliance/.test(label)) return byDept.length ? `${byDept.sort((a, b) => a[1] - b[1])[0][0]} ${byDept[0][1].toFixed(1)}%` : '-';
    }
    return rows.length;
  },
  iconFor(label) { if (/CAPA/.test(label)) return 'clipboard-list'; if (/Permit|Work/.test(label)) return 'file-check-2'; if (/Project|Budget|Saving/.test(label)) return 'rocket'; if (/Limbah|Water|Electricity|COD|BOD|pH/.test(label)) return 'leaf'; if (/Incident|Unsafe|Risk|Lost|Medical/.test(label)) return 'shield-alert'; return 'activity'; },
  tone(label, value) {
    if (label === 'Safety Score') {
      const n = Number(value) || 0;
      if (n >= 90) return 'success';
      if (n >= 75) return 'info';
      if (n >= 60) return 'warning';
      return 'critical';
    }
    if (label === 'Average 5R Score') {
      const n = Number.parseFloat(value) || 0;
      if (n >= 4.5) return 'success';
      if (n >= 4) return 'warning';
      return 'critical';
    }
    if (label === 'APD Compliance') {
      const n = Number.parseFloat(value) || 0;
      if (n >= 98) return 'success';
      if (n >= 95) return 'warning';
      return 'critical';
    }
    if (/Overdue|Critical|Lost|Medical|Expired|Delayed|Cancelled/.test(label)) return 'critical'; if (/Due|Open|Medium|Warning|On Progress/.test(label)) return 'warning'; if (/Closed|Completion|Score|Active|Completed/.test(label)) return 'success'; return 'info'; },
  change(value) { const n = Number(String(value).replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? `${n % 17 - 8}%` : '0%'; },
  primaryField(page) { return ({ safety: 'incidentType', audit: 'category', finding: 'category', capa: 'status', environment: 'category', project: 'status', permit: 'permitType', analytics: 'risk' })[page] || 'category'; },
  groupField(page) { return ({ safety: 'department', audit: 'department', finding: 'department', capa: 'department', environment: 'wasteType', project: 'department', permit: 'department', analytics: 'department' })[page] || 'department'; },
};
