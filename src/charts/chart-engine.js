window.HSE = window.HSE || {};
HSE.charts = {
  clear() { Object.values(HSE.state.charts).forEach((c) => c.destroy()); HSE.state.charts = {}; },
  make(id, type, labels, datasets, options = {}) {
    const el = document.getElementById(id);
    if (!el) return;
    if (HSE.state.charts[id]) HSE.state.charts[id].destroy();
    HSE.state.charts[id] = new Chart(el, {
      type,
      data: { labels: labels.length ? labels : ['Tidak Ada Data'], datasets },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: type === 'doughnut' || datasets.length > 1, position: 'bottom' }, tooltip: { mode: 'index', intersect: false } }, scales: type === 'doughnut' || type === 'radar' ? {} : { x: { grid: { display: false } }, y: { beginAtZero: true } }, onClick: () => HSE.app.openDetail(id), ...options },
    });
  },
  line(id, labels, data, label, color = '#2563eb') { this.make(id, 'line', labels, [{ label, data: data.length ? data : [0], borderColor: color, backgroundColor: color + '22', fill: true, tension: .35 }]); },
  bar(id, labels, data, label, color = '#2563eb', horizontal = false) { this.make(id, 'bar', labels, [{ label, data: data.length ? data : [0], backgroundColor: Array.isArray(color) ? color : color }], { indexAxis: horizontal ? 'y' : 'x' }); },
  doughnut(id, labels, data) { this.make(id, 'doughnut', labels, [{ data: data.length ? data : [0], backgroundColor: ['#16a34a', '#d97706', '#dc2626', '#2563eb', '#7c3aed', '#0891b2'] }]); },
  radar(id, labels, data) { this.make(id, 'radar', labels, [{ label: 'Score', data: data.length ? data : [0], borderColor: '#0f766e', backgroundColor: 'rgba(15,118,110,.18)' }]); },
  pareto(id, rows) {
    const labels = rows.map(([k]) => k), values = rows.map(([, v]) => v), total = values.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    this.make(id, 'bar', labels, [{ label: 'Total', data: values, backgroundColor: '#d97706' }, { type: 'line', label: 'Cumulative %', data: values.map((v) => Math.round(((acc += v) / total) * 100)), yAxisID: 'y1', borderColor: '#2563eb' }], { scales: { y: { beginAtZero: true }, y1: { beginAtZero: true, max: 100, position: 'right', grid: { display: false } } } });
  },
};
