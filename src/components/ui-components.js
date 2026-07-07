window.HSE = window.HSE || {};
HSE.ui = {
  toast(title, message) {
    const host = document.getElementById('toastHost');
    const existing = [...host.querySelectorAll('.app-toast')].find((item) => item.dataset.title === title);
    if (existing) existing.remove();
    while (host.children.length >= 2) host.firstElementChild?.remove();
    const el = document.createElement('div');
    el.className = 'app-toast';
    el.dataset.title = title;
    const compactMessage = String(message || '').length > 180 ? `${String(message).slice(0, 177)}...` : message;
    el.innerHTML = `<strong>${HSE.helpers.esc(title)}</strong><span>${HSE.helpers.esc(compactMessage)}</span>`;
    host.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  },
  kpis(items) {
    if (!items.length) return '<div class="card empty-state">No Data.</div>';
    return `<div class="grid kpi-grid">${items.map((k, i) => `<article class="card kpi-card" data-page="${k.page || ''}" data-tone="${k.tone || 'info'}" title="${HSE.helpers.esc(k.label)}">
      <div class="kpi-top"><span class="kpi-label">${HSE.helpers.esc(k.label)}</span><div class="kpi-icon"><i data-lucide="${k.icon || 'activity'}"></i></div></div>
      <strong class="kpi-value">${HSE.helpers.esc(k.value)}</strong>
      <div class="kpi-meta"><span>${k.change || '0%'} vs prev</span><canvas id="spark-${i}" class="sparkline"></canvas></div>
      <div class="progress-line"><span style="width:${Math.max(8, Math.min(100, Number(k.progress || 65)))}%"></span></div>
    </article>`).join('')}</div>`;
  },
  chartCard(id, title, subtitle = '') { return `<div class="card"><div class="card-head"><h4>${title}</h4><span>${subtitle}</span></div><canvas id="${id}" class="chart"></canvas></div>`; },
  tableCard(id, title) { return `<div class="card table-card"><div class="card-head"><h4>${title}</h4><span>Search • Sort • Filter • Export</span></div><table id="${id}" class="table table-striped table-hover w-100"></table></div>`; },
  activity(items) {
    if (!items.length) items = [{ time: '-', name: 'Tidak ada aktivitas hari ini.', department: '-', area: '-', pic: '-', status: '-', priority: 'Low' }];
    return `<div class="card"><div class="card-head"><h4>Today's HSE Activity</h4><span>${items.length} activities</span></div><div class="activity-list">${items.map((a) => `<div class="activity-item" data-detail='${JSON.stringify(a).replace(/'/g, '&#39;')}'>
      <strong>${a.time}</strong><div><strong>${HSE.helpers.esc(a.name)}</strong><span>${HSE.helpers.esc(a.department)} • ${HSE.helpers.esc(a.area)} • ${HSE.helpers.esc(a.pic)}</span></div><span class="badge-soft ${this.badge(a.priority)}">${a.status}</span>
    </div>`).join('')}</div></div>`;
  },
  calendar(events) {
    const month = HSE.state.calendarMonth;
    const y = month.getFullYear(), m = month.getMonth(), days = new Date(y, m + 1, 0).getDate();
    const cells = Array.from({ length: days }, (_, i) => {
      const dayEvents = events.filter((e) => e.date?.getFullYear() === y && e.date?.getMonth() === m && e.date?.getDate() === i + 1);
      return `<div class="calendar-cell" data-day="${i + 1}" draggable="${dayEvents.some((e) => e.manual)}"><span class="calendar-day">${i + 1}</span><div>${dayEvents.slice(0, 5).map((e) => `<i class="calendar-dot" style="background:${this.eventColor(e.type)}"></i>`).join('')}${dayEvents.length > 1 ? `<span class="calendar-count">${dayEvents.length}</span>` : ''}</div></div>`;
    }).join('');
    return `<div class="card calendar"><div class="calendar-head"><button class="icon-button" id="prevMonth"><i data-lucide="chevron-left"></i></button><strong>${HSE.config.months[m]} ${y}</strong><button class="icon-button" id="nextMonth"><i data-lucide="chevron-right"></i></button></div><div class="calendar-grid">${cells}</div><button id="addScheduleFloating" class="calendar-add" title="Add Schedule"><i data-lucide="plus"></i></button></div>`;
  },
  badge(tone) {
    if (tone === 'Open' || tone === 'Critical' || tone === 'Fatality') return 'badge-critical';
    if (tone === 'High') return 'badge-high';
    if (tone === 'On Progress' || tone === 'In Progress' || tone === 'Medium') return 'badge-warning';
    if (tone === 'Closed' || tone === 'Completed' || tone === 'Active' || tone === 'Low') return 'badge-success';
    if (tone === 'Overdue' || tone === 'Expired' || tone === 'Disabled') return 'badge-disabled';
    return 'badge-info';
  },
  eventColor(type) {
    if (type === 'Incident') return '#dc2626';
    if (type === 'Finding' || type === 'APD') return '#d97706';
    if (type === 'Project') return '#16a34a';
    if (type === 'APAR' || type === 'Permit') return '#2563eb';
    if (type === 'Audit 5R') return '#7c3aed';
    if (type === 'CAPA') return '#ea580c';
    if (type === 'Schedule') return '#64748b';
    return '#94a3b8';
  },
};
