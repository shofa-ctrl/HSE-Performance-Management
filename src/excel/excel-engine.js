window.HSE = window.HSE || {};
HSE.excel = {
  aliases: {
    date: ['tanggal', 'tanggal audit', 'date', 'tgl'], department: ['department', 'dept', 'departemen'], area: ['area', 'lokasi', 'location'],
    pic: ['pic', 'owner', 'person in charge'], status: ['status', 'progress'], risk: ['risk', 'severity', 'risk level'],
    finding: ['finding description', 'finding', 'temuan', 'description'], rootCause: ['root cause', 'akar masalah'], correctiveAction: ['corrective action', 'action'], preventiveAction: ['preventive action'],
    dueDate: ['due date', 'target date'], closingDate: ['closing date', 'completion date'], category: ['category', 'kategori', 'incident type', 'jenis incident', 'jenis kejadian', 'audit type', 'jenis audit', 'permit type', 'jenis permit', 'kategori limbah'], id: ['id', 'nomor', 'no'],
    incidentType: ['incident type', 'jenis incident', 'jenis kejadian'], findingType: ['finding type', 'jenis finding'], auditType: ['jenis audit', 'audit type'],
    projectName: ['project name', 'nama project'], permitType: ['permit type', 'jenis permit'], permitNumber: ['permit number', 'nomor permit'],
    water: ['water consumption', 'water'], electricity: ['electricity consumption', 'electricity'], wastewater: ['air limbah', 'wastewater'], weight: ['berat', 'weight'], value: ['nilai', 'value'], score: ['score', 'nilai'],
    aparNumber: ['apar number', 'nomor apar'], location: ['location', 'lokasi'], pressure: ['pressure', 'tekanan'], condition: ['condition', 'kondisi'], expireDate: ['expired date', 'expire date'], inspector: ['inspector', 'pemeriksa'], remark: ['remark', 'keterangan'],
    manhours: ['manhours', 'man hours', 'jam kerja'], ltifr: ['ltifr'], ltisr: ['ltisr'], fafr: ['fafr'], lti: ['lti', 'lost time injury'], lostDays: ['lost days', 'hari hilang'], fac: ['fac', 'first aid'],
    ringkas: ['ringkas'], rapi: ['rapi'], resik: ['resik'], rawat: ['rawat'], rajin: ['rajin'], totalScore: ['total score'], averageScore: ['average score', 'avg score'],
    totalItem: ['total item diperiksa', 'total item', 'item diperiksa'], itemOk: ['item sesuai', 'sesuai'], itemNotOk: ['item tidak sesuai', 'tidak sesuai'], apdCompliance: ['apd compliance', 'compliance apd'],
  },
  async load(file) {
    if (!window.XLSX) throw new Error('Library Excel tidak tersedia.');
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
    return this.parse(wb);
  },
  parse(workbook) {
    const allowedSheets = [...HSE.config.requiredSheets, ...(HSE.config.optionalSheets || [])];
    const sheetRows = {};
    workbook.SheetNames.forEach((name) => {
      const normalizedName = HSE.helpers.norm(name).toUpperCase().replace(/\s+/g, '_');
      if (!allowedSheets.includes(normalizedName)) return;
      sheetRows[normalizedName] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '', raw: false });
    });
    return this.parseRows(sheetRows);
  },
  parseRows(sheetRows) {
    const model = HSE.data.empty();
    const allowedSheets = [...HSE.config.requiredSheets, ...(HSE.config.optionalSheets || [])];
    HSE.state.validation = { missingSheets: HSE.config.requiredSheets.filter((sheet) => !sheetRows[sheet]), missingColumns: [], rowErrors: [] };
    const seenIds = {};
    Object.entries(sheetRows).forEach(([name, rows]) => {
      const normalizedName = HSE.helpers.norm(name).toUpperCase().replace(/\s+/g, '_');
      if (!allowedSheets.includes(normalizedName)) return;
      if (!rows.length) return;
      const module = this.module(normalizedName);
      const map = this.map(Object.keys(rows[0]));
      this.validateColumns(normalizedName, map);
      rows.forEach((row, i) => {
        const hasData = Object.values(row).some((value) => !['', '-', 'n/a', 'na', 'null'].includes(HSE.helpers.norm(value)));
        if (!hasData) return;
        const r = this.record(row, map, module, normalizedName, i);
        if (module && model[module]) {
          const key = `${module}:${r.id}`;
          if (r.id && seenIds[key]) {
            HSE.state.validation.rowErrors.push(`${normalizedName}: Duplicate ID ${r.id} (baris dilewati)`);
            return;
          }
          seenIds[key] = true;
          model[module].push(r);
        }
      });
    });
    return model;
  },
  module(name) {
    return {
      MASTER_SAFETY: 'safety',
      MASTER_FINDING: 'finding',
      MASTER_CAPA: 'capa',
      MASTER_ENVIRONMENT: 'environment',
      MASTER_PROJECT: 'project',
      MASTER_PERMIT: 'permit',
      MASTER_MANHOURS: 'manhours',
      MASTER_5R: 'fiveR',
      MASTER_APAR: 'apar',
      LOOKUP: 'lookup',
    }[name] || '';
  },
  map(headers) {
    const out = {};
    Object.entries(this.aliases).forEach(([key, words]) => {
      out[key] = words.map((word) => headers.find((header) => HSE.helpers.norm(header) === HSE.helpers.norm(word))).find(Boolean)
        || words.map((word) => headers.find((header) => HSE.helpers.norm(header).includes(HSE.helpers.norm(word)))).find(Boolean)
        || '';
    });
    return out;
  },
  validateColumns(sheet, map) {
    const required = {
      MASTER_SAFETY: ['date', 'department', 'area', 'category'],
      MASTER_FINDING: ['date', 'department', 'area', 'finding', 'status'],
      MASTER_CAPA: ['date', 'department', 'area', 'pic', 'status'],
      MASTER_ENVIRONMENT: ['date', 'category'],
      MASTER_PROJECT: ['date', 'department', 'area', 'status'],
      MASTER_PERMIT: ['date', 'department', 'area', 'status'],
      MASTER_MANHOURS: ['date', 'manhours'],
      MASTER_5R: ['date', 'department', 'area'],
      MASTER_APAR: ['date', 'department', 'area'],
      LOOKUP: [],
    }[sheet] || [];
    required.filter((field) => !map[field]).forEach((field) => HSE.state.validation.missingColumns.push(`${sheet}: ${field}`));
  },
  record(row, map, module, sheet, index) {
    const h = HSE.helpers, get = (k) => h.clean(row[map[k]]);
    const rawDate = get('date');
    const parsedDate = h.date(rawDate);
    const isPlaceholder = (value) => ['', '-', 'n/a', 'na', 'null'].includes(h.norm(value));
    if (!isPlaceholder(rawDate) && !parsedDate) HSE.state.validation.rowErrors.push(`${sheet}: Tanggal tidak valid pada baris ${index + 2}`);
    ['manhours', 'water', 'electricity', 'weight', 'ph', 'cod', 'bod'].forEach((field) => {
      const key = Object.keys(row).find((header) => h.norm(header) === field || (field === 'weight' && ['berat', 'quantity'].includes(h.norm(header))));
      const raw = key ? row[key] : '';
      if (!isPlaceholder(raw) && Number.isNaN(Number(String(raw).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.')))) HSE.state.validation.rowErrors.push(`${sheet}: Nilai numerik tidak valid pada ${field} baris ${index + 2}`);
    });
    const statusValue = get('status') || 'Open';
    const normalizedStatus = ({ close: 'Closed', closed: 'Closed', complete: 'Completed', completed: 'Completed', progress: 'On Progress', 'in progress': 'On Progress', 'on progress': 'On Progress' })[h.norm(statusValue)] || statusValue;
    const rawCategory = get('category') || sheet;
    const wasteCategory = /non\s*[- ]?b3/i.test(rawCategory) ? 'Limbah Non B3' : /limbah cair|air limbah|wastewater/i.test(rawCategory) ? 'Limbah Cair' : /limbah\s*b3/i.test(rawCategory) ? 'Limbah B3' : rawCategory;
    const base = { id: get('id') || `${sheet}-${index + 1}`, date: parsedDate, department: get('department'), area: get('area'), pic: get('pic'), status: normalizedStatus, risk: get('risk') || 'Low', priority: get('risk') || 'Low', category: module === 'environment' ? wasteCategory : rawCategory, finding: get('finding'), rootCause: get('rootCause'), correctiveAction: get('correctiveAction'), preventiveAction: get('preventiveAction'), dueDate: h.date(get('dueDate')), closingDate: h.date(get('closingDate')) };
    if (module === 'safety') return { ...base, incidentType: get('incidentType') || base.category, findingType: get('findingType'), severity: base.risk, description: base.finding, manHours: h.num(row.ManHours || row['Man Hours']), lostDays: h.num(row.LostDays || row['Lost Days']), remark: get('remark') };
    if (module === 'finding') return { ...base, findingId: base.id, auditType: get('auditType') || base.category, auditor: row.Auditor || row.auditor || '', findingType: get('findingType') || (/apd/i.test(base.category + base.finding) ? 'APD' : /act/i.test(base.category + base.finding) ? 'Unsafe Act' : 'Unsafe Condition'), score: h.num(get('score')), totalItem: h.num(get('totalItem')), itemOk: h.num(get('itemOk')), itemNotOk: h.num(get('itemNotOk')), apdCompliance: h.num(get('apdCompliance')), remark: get('remark') };
    if (module === 'capa') return { ...base, findingId: row.FindingID || row['Finding ID'] || '', progress: h.num(row.Progress), verification: row.Verification || '' };
    if (module === 'environment') return { ...base, wasteType: row['Jenis Limbah'] || row.WasteType || base.category, value: h.num(get('value')), weight: h.num(get('weight')), unit: row.Satuan || row.Unit || 'kg', vendor: row.Vendor || '', manifest: row.Manifest || row['Nomor Manifest'] || '', water: h.num(get('water')), electricity: h.num(get('electricity')), wastewater: h.num(get('wastewater')), ph: h.num(row.pH), cod: h.num(row.COD), bod: h.num(row.BOD), score: h.num(get('score')), remark: get('remark') };
    if (module === 'project') return { ...base, name: get('projectName') || base.id, budget: h.num(row.Budget), actualCost: h.num(row['Actual Cost']), saving: h.num(row.Saving), progress: h.num(row.Progress), targetFinish: h.date(row['Target Finish']), actualFinish: h.date(row['Actual Finish']), benefit: row.Benefit || '', vendor: row.Vendor || '', remark: get('remark') };
    if (module === 'permit') {
      const rawPermit = get('permitType') || base.category;
      const permitType = /ketinggian|working at height/i.test(rawPermit) ? 'Ketinggian' : /tangki|tank/i.test(rawPermit) ? 'Tangki' : /hot work|kerja panas/i.test(rawPermit) ? 'Kerja Panas' : /electrical|listrik/i.test(rawPermit) ? 'Kerja Listrik' : /alat berat|heavy equipment|lifting/i.test(rawPermit) ? 'Alat Berat' : /galian|excavation/i.test(rawPermit) ? 'Galian' : /confined space|ruang terbatas/i.test(rawPermit) ? 'Ruang Terbatas' : rawPermit;
      return { ...base, permitType, permitNumber: get('permitNumber'), contractor: row.Contractor || row.Vendor || '', vendor: row.Vendor || row.Contractor || '', issueDate: h.date(row['Issue Date']) || base.date, expireDate: h.date(row['Expire Date']), approver: row.Approver || '', remark: get('remark') };
    }
    if (module === 'manhours') return { ...base, manhours: h.num(get('manhours') || row.Manhours || row['Man Hours']), ltifr: h.num(get('ltifr') || row.LTIFR), ltisr: h.num(get('ltisr') || row.LTISR), fafr: h.num(get('fafr') || row.FAFR), lti: h.num(get('lti') || row.LTI), lostDays: h.num(get('lostDays') || row.LostDays), fac: h.num(get('fac') || row.FAC) };
    if (module === 'fiveR') {
      const ringkas = h.num(get('ringkas')), rapi = h.num(get('rapi')), resik = h.num(get('resik')), rawat = h.num(get('rawat')), rajin = h.num(get('rajin'));
      const totalScore = h.num(get('totalScore')) || ringkas + rapi + resik + rawat + rajin;
      return { ...base, auditId: base.id, ringkas, rapi, resik, rawat, rajin, totalScore, averageScore: h.num(get('averageScore')) || totalScore / 5, auditor: row.Auditor || row.auditor || '', remark: row.Remark || row.remark || '', category: 'Audit 5R' };
    }
    if (module === 'apar') return { ...base, category: 'APAR Inspection', findingType: 'APAR', aparNumber: get('aparNumber'), location: get('location') || base.area, pressure: get('pressure'), condition: get('condition'), expireDate: h.date(get('expireDate')), inspector: get('inspector'), remark: get('remark'), auditor: get('inspector') };
    if (module === 'lookup') return { ...base, value: row.Value || row.value || '' };
    return base;
  },
};
