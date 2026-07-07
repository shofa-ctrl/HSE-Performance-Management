window.HSE = window.HSE || {};
HSE.helpers = {
  clean: (value) => String(value ?? '').trim(),
  norm(value) { return this.clean(value).toLowerCase().replace(/[_\-\\/]+/g, ' ').replace(/\s+/g, ' '); },
  esc(value) { return String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); },
  num(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    let text = this.clean(value).replace(/[^\d.,-]/g, '');
    if (!text) return 0;
    const hasDot = text.includes('.'), hasComma = text.includes(',');
    if (hasDot && hasComma) {
      text = text.lastIndexOf(',') > text.lastIndexOf('.')
        ? text.replace(/\./g, '').replace(',', '.')
        : text.replace(/,/g, '');
    } else if (hasComma) {
      text = /^-?\d{1,3}(,\d{3})+$/.test(text) ? text.replace(/,/g, '') : text.replace(',', '.');
    } else if (hasDot && /^-?\d{1,3}(\.\d{3})+$/.test(text)) {
      text = text.replace(/\./g, '');
    }
    const n = Number(text);
    return Number.isFinite(n) ? n : 0;
  },
  date(value) {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    const serial = Number(value);
    if (serial > 20000 && serial < 80000) return new Date(Math.round((serial - 25569) * 86400 * 1000));
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  },
  fmtDate(date) {
    if (!date) return '';
    const value = date instanceof Date ? date : this.date(date);
    if (!value) return '';
    const pad = (number) => String(number).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  },
  fmtDateTime(date) { return date ? date.toLocaleString('id-ID') : '-'; },
  fmt(value) { return Number(value || 0).toLocaleString('id-ID'); },
  pct(part, total) { return total ? Math.round((part / total) * 100) : 0; },
  avg(values) { const nums = values.filter((n) => Number.isFinite(n)); return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0; },
  sum(rows, field) { return rows.reduce((total, row) => total + (Number(row[field]) || 0), 0); },
  unique(values) { return [...new Set(values.filter((v) => v !== undefined && v !== null && String(v).trim() !== '').map(String))]; },
  byMonth(rows, valueFn = () => 1) {
    return HSE.config.months.map((_, i) => rows.filter((row) => row.date?.getMonth() === i).reduce((a, row) => a + valueFn(row), 0));
  },
  group(rows, field, limit = 10, valueFn = () => 1) {
    const map = new Map();
    rows.forEach((row) => {
      const key = row[field] || 'Tidak Ada Data';
      map.set(key, (map.get(key) || 0) + valueFn(row));
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  },
  daysBetween(a, b) { return a && b ? Math.max(0, Math.round((b - a) / 86400000)) : 0; },
  aging(due, closed) { return due && !closed ? Math.max(0, Math.ceil((new Date() - due) / 86400000)) : 0; },
  daysToDue(due) { return due ? Math.ceil((due - new Date()) / 86400000) : -9999; },
  debounce(fn, wait = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  },
};
