window.HSE = window.HSE || {};
HSE.excel = {
  aliases: {
    date: ['tanggal', 'date', 'tgl'], department: ['department', 'dept', 'departemen'], area: ['area', 'lokasi', 'location'],
    pic: ['pic', 'owner', 'person in charge'], status: ['status', 'progress'], risk: ['risk', 'severity', 'risk level'],
    finding: ['finding', 'temuan', 'description'], rootCause: ['root cause', 'akar masalah'], correctiveAction: ['corrective action', 'action'], preventiveAction: ['preventive action'],
    dueDate: ['due date', 'target date'], closingDate: ['closing date', 'completion date'], category: ['category', 'kategori'], id: ['id', 'nomor', 'no'],
  },
  async load(file) {
    if (!window.XLSX) throw new Error('Library Excel tidak tersedia.');
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
    return this.parse(wb);
  },
  parse(workbook) {
    const model = HSE.data.empty();
    workbook.SheetNames.forEach((name) => {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '', raw: false });
      if (!rows.length) return;
      const module = this.module(name);
      const map = this.map(Object.keys(rows[0]));
      rows.forEach((row, i) => {
        const r = this.record(row, map, module, name, i);
        if (module && model[module]) model[module].push(r);
      });
    });
    return model;
  },
  module(name) {
    const n = HSE.helpers.norm(name);
    if (/safety|incident|kecelakaan/.test(n)) return 'safety';
    if (/audit|inspection|inspeksi|finding/.test(n)) return 'audit';
    if (/capa|corrective|preventive/.test(n)) return 'capa';
    if (/environment|limbah|waste|ipal|air limbah/.test(n)) return 'environment';
    if (/project|improvement/.test(n)) return 'project';
    if (/permit|ptw|work/.test(n)) return 'permit';
    if (/config/.test(n)) return 'config';
    return 'audit';
  },
  map(headers) {
    const out = {};
    Object.entries(this.aliases).forEach(([key, words]) => {
      out[key] = headers.find((h) => words.some((w) => HSE.helpers.norm(h).includes(HSE.helpers.norm(w)))) || '';
    });
    return out;
  },
  record(row, map, module, sheet, index) {
    const h = HSE.helpers, get = (k) => h.clean(row[map[k]]);
    const base = { id: get('id') || `${sheet}-${index + 1}`, date: h.date(get('date')) || new Date(2026, 0, 1), department: get('department'), area: get('area'), pic: get('pic'), status: get('status') || 'Open', risk: get('risk') || 'Low', priority: get('risk') || 'Low', category: get('category') || sheet, finding: get('finding'), rootCause: get('rootCause'), correctiveAction: get('correctiveAction'), preventiveAction: get('preventiveAction'), dueDate: h.date(get('dueDate')), closingDate: h.date(get('closingDate')) };
    if (module === 'safety') return { ...base, incidentType: base.category, severity: base.risk, description: base.finding, manHours: h.num(row.ManHours || row['Man Hours']), lostDays: h.num(row.LostDays || row['Lost Days']) };
    if (module === 'audit') return { ...base, findingId: base.id, auditType: base.category, auditor: row.Auditor || row.auditor || '', findingType: /act/i.test(base.category + base.finding) ? 'Unsafe Act' : 'Unsafe Condition', score: h.num(row.Score || row.Nilai) };
    if (module === 'capa') return { ...base, findingId: row.FindingID || row['Finding ID'] || '', progress: h.num(row.Progress), verification: row.Verification || '' };
    if (module === 'environment') return { ...base, wasteType: row['Jenis Limbah'] || row.WasteType || base.category, weight: h.num(row.Berat || row.Weight), unit: row.Satuan || row.Unit || 'kg', vendor: row.Vendor || '', manifest: row.Manifest || row['Nomor Manifest'] || '', water: h.num(row.Water), electricity: h.num(row.Electricity), wastewater: h.num(row.Wastewater), ph: h.num(row.pH), cod: h.num(row.COD), bod: h.num(row.BOD), score: h.num(row.Score) };
    if (module === 'project') return { ...base, name: row.Project || row['Nama Project'] || base.id, budget: h.num(row.Budget), actualCost: h.num(row['Actual Cost']), saving: h.num(row.Saving), progress: h.num(row.Progress), targetFinish: h.date(row['Target Finish']), actualFinish: h.date(row['Actual Finish']), benefit: row.Benefit || '', vendor: row.Vendor || '' };
    if (module === 'permit') return { ...base, permitType: base.category, contractor: row.Contractor || row.Vendor || '', vendor: row.Vendor || row.Contractor || '', issueDate: h.date(row['Issue Date']) || base.date, expireDate: h.date(row['Expire Date']), approver: row.Approver || '' };
    return base;
  },
};
