window.HSE = window.HSE || {};
HSE.exporter = {
  currentRows() {
    const page = HSE.state.page;
    if (page === 'safety') return HSE.state.filtered.safety;
    if (page === 'audit') return HSE.state.filtered.audit;
    if (page === 'capa') return HSE.state.filtered.capa;
    if (page === 'environment') return HSE.state.filtered.environment;
    if (page === 'project') return HSE.state.filtered.project;
    if (page === 'permit') return HSE.state.filtered.permit;
    return Object.values(HSE.state.filtered).flat();
  },
  csv(fileName = 'hse-export.csv') {
    const rows = this.currentRows();
    const keys = HSE.helpers.unique(rows.flatMap((r) => Object.keys(r))).filter((k) => !/image|photo|evidence|attachment|hyperlink/i.test(k));
    const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = fileName;
    a.click();
  },
  xlsx(fileName = 'hse-command-center-export.xlsx') {
    const rows = this.currentRows().map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => !/image|photo|evidence|attachment|hyperlink/i.test(key))));
    if (!window.XLSX) return this.csv(fileName.replace(/\.xlsx$/i, '.csv'));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Filtered Data');
    XLSX.writeFile(wb, fileName);
  },
  pdf() { window.print(); },
  config() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ filters: HSE.data.getFilters(), version: HSE.config.version }, null, 2)], { type: 'application/json' }));
    a.download = 'hse-dashboard-config.json';
    a.click();
  },
};
