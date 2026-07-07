window.HSE = window.HSE || {};
HSE.tables = {
  columns: {
    safety: ['id', 'date', 'department', 'area', 'incidentType', 'severity', 'description', 'rootCause', 'correctiveAction', 'pic', 'status'],
    audit: ['id', 'date', 'department', 'area', 'auditType', 'auditor', 'finding', 'risk', 'status', 'dueDate', 'closingDate'],
    capa: ['id', 'findingId', 'department', 'area', 'pic', 'dueDate', 'closingDate', 'progress', 'status', 'verification'],
    environment: ['date', 'category', 'wasteType', 'weight', 'unit', 'vendor', 'manifest', 'status', 'note'],
    project: ['id', 'name', 'category', 'department', 'area', 'pic', 'budget', 'actualCost', 'progress', 'status', 'targetFinish', 'actualFinish', 'benefit'],
    permit: ['id', 'date', 'permitType', 'department', 'area', 'contractor', 'pic', 'issueDate', 'expireDate', 'status', 'approver'],
  },
  render(id, rows, fields) {
    if (HSE.state.tables[id]) HSE.state.tables[id].destroy();
    const table = document.getElementById(id);
    table.innerHTML = `<thead><tr>${fields.map((f) => `<th>${this.label(f)}<input class="column-filter" aria-label="Filter ${this.label(f)}"></th>`).join('')}</tr></thead><tbody></tbody>`;
    HSE.state.tables[id] = new DataTable(`#${id}`, {
      data: rows,
      columns: fields.map((field) => ({ data: field, title: this.label(field), render: (value) => this.cell(field, value) })),
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      autoWidth: false,
      responsive: true,
    });
    table.querySelectorAll('thead input').forEach((input, i) => {
      input.addEventListener('keyup', () => HSE.state.tables[id].column(i).search(input.value).draw());
      input.addEventListener('click', (e) => e.stopPropagation());
    });
    table.querySelector('tbody').addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (!tr) return;
      HSE.app.showDetail(HSE.state.tables[id].row(tr).data());
    });
    table.querySelector('tbody').addEventListener('dblclick', (e) => {
      const tr = e.target.closest('tr');
      if (!tr) return;
      navigator.clipboard?.writeText(JSON.stringify(HSE.state.tables[id].row(tr).data(), null, 2));
      HSE.ui.toast('Row copied', 'Data row disalin ke clipboard.');
    });
  },
  label(field) { return field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()); },
  cell(field, value) {
    if (value instanceof Date) return HSE.helpers.fmtDate(value);
    if (/status|risk|severity|priority/i.test(field)) return `<span class="badge-soft ${HSE.ui.badge(value)}">${HSE.helpers.esc(value || '-')}</span>`;
    if (/budget|actualCost|saving/i.test(field)) return HSE.helpers.fmt(value);
    const text = HSE.helpers.esc(value ?? '-');
    const q = HSE.helpers.esc(HSE.state.search || '').trim();
    if (!q) return text;
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${safe})`, 'ig'), '<mark class="search-hit">$1</mark>');
  },
};
