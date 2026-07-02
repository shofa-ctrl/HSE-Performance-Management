window.HSE = window.HSE || {};
HSE.dummy = {
  build() {
    const c = HSE.config;
    const data = HSE.data.empty();
    const rootCauses = ['Kurang pengawasan', 'SOP tidak dipahami', 'Housekeeping tidak konsisten', 'Training belum efektif', 'Kontrol engineering belum memadai'];
    const vendors = ['Vendor Alpha', 'Vendor Beta', 'Vendor Gamma', 'Internal Team'];
    for (let i = 0; i < 500; i++) {
      const month = i % 12;
      const department = c.departments[i % c.departments.length];
      const area = c.areas[(i * 7) % c.areas.length];
      const auditType = c.auditTypes[i % c.auditTypes.length];
      const risk = c.risks[i % c.risks.length];
      const findingType = i % 2 ? 'Unsafe Condition' : 'Unsafe Act';
      const date = new Date(2026, month, (i % 24) + 1, 8 + (i % 8), 0);
      const due = new Date(2026, month, Math.min(28, (i % 24) + 5));
      const closed = i % 4 === 0 ? new Date(2026, month, Math.min(28, (i % 24) + 8)) : null;
      data.audit.push({
        id: `AUD-${2026}-${String(i + 1).padStart(4, '0')}`, findingId: `FND-${String(i + 1).padStart(5, '0')}`, date, department, area, auditType,
        auditor: `Auditor ${i % 12 + 1}`, finding: findingType === 'Unsafe Act' ? 'Perilaku kerja tidak sesuai standar keselamatan' : 'Kondisi area kerja perlu perbaikan',
        category: auditType, findingType, risk, status: closed ? 'Closed' : ['Open', 'On Progress', 'Overdue'][i % 3], dueDate: due, closingDate: closed,
        rootCause: rootCauses[i % rootCauses.length], correctiveAction: 'Lakukan koreksi area dan coaching PIC', preventiveAction: 'Tambahkan checklist kontrol mingguan', pic: `PIC ${department}`, score: 70 + (i % 29), priority: risk,
      });
    }
    for (let i = 0; i < 500; i++) {
      const f = data.audit[i % data.audit.length];
      const due = f.dueDate;
      const closed = i % 3 === 0 ? new Date(2026, due.getMonth(), Math.min(28, due.getDate() + 2)) : null;
      data.capa.push({ id: `CAPA-${String(i + 1).padStart(5, '0')}`, findingId: f.findingId, date: f.date, department: f.department, area: f.area, pic: f.pic, dueDate: due, closingDate: closed, progress: closed ? 100 : (i % 9) * 10, status: closed ? 'Closed' : ['Open', 'On Progress', 'Overdue'][i % 3], verification: closed && i % 4 === 0 ? 'Pending' : 'Verified', risk: f.risk, priority: f.priority, rootCause: f.rootCause, correctiveAction: f.correctiveAction, preventiveAction: f.preventiveAction, finding: f.finding });
    }
    for (let i = 0; i < 300; i++) {
      const month = i % 12;
      data.safety.push({ id: `INC-${String(i + 1).padStart(5, '0')}`, date: new Date(2026, month, (i % 26) + 1, 7 + (i % 10), 30), department: c.departments[i % c.departments.length], area: c.areas[(i * 3) % c.areas.length], incidentType: c.incidentTypes[i % c.incidentTypes.length], severity: c.risks[i % c.risks.length], shift: ['Shift 1', 'Shift 2', 'Shift 3'][i % 3], description: 'Catatan kejadian keselamatan kerja', rootCause: rootCauses[i % rootCauses.length], correctiveAction: 'Investigasi dan tindakan perbaikan', pic: `PIC ${c.departments[i % c.departments.length]}`, status: ['Open', 'On Progress', 'Closed'][i % 3], manHours: 160000 + i * 12, lostDays: i % 5 });
    }
    for (let i = 0; i < 300; i++) {
      const month = i % 12;
      data.permit.push({ id: `PTW-${String(i + 1).padStart(5, '0')}`, date: new Date(2026, month, (i % 27) + 1, 8, 0), permitType: c.permitTypes[i % c.permitTypes.length], department: c.departments[i % c.departments.length], area: c.areas[(i * 5) % c.areas.length], contractor: vendors[i % vendors.length], vendor: vendors[i % vendors.length], pic: `PIC ${i % 18 + 1}`, issueDate: new Date(2026, month, (i % 27) + 1), expireDate: new Date(2026, month, Math.min(28, (i % 27) + 2)), status: ['Open', 'Active', 'Closed', 'Expired'][i % 4], approver: `Approver ${i % 8 + 1}`, priority: c.priorities[i % 4] });
    }
    for (let i = 0; i < 100; i++) {
      const month = i % 12;
      const progress = i % 5 === 0 ? 100 : (i * 7) % 95;
      data.project.push({ id: `PRJ-${String(i + 1).padStart(4, '0')}`, date: new Date(2026, month, (i % 23) + 1), name: `Improvement Project ${i + 1}`, category: ['Safety', 'Environment', 'Productivity', 'Energy'][i % 4], department: c.departments[i % c.departments.length], area: c.areas[(i * 9) % c.areas.length], pic: `Project PIC ${i % 12 + 1}`, budget: 25000000 + i * 1250000, actualCost: 21000000 + i * 1100000, saving: 3500000 + i * 450000, progress, status: progress === 100 ? 'Completed' : ['On Progress', 'Delayed', 'Cancelled'][i % 3], targetFinish: new Date(2026, month, 25), actualFinish: progress === 100 ? new Date(2026, month, 24) : null, benefit: 'Risk reduction and process improvement', vendor: vendors[i % vendors.length] });
    }
    for (let i = 0; i < 500; i++) {
      const month = i % 12;
      const isB3 = i % 3 === 0;
      const wasteType = isB3 ? c.wasteB3[i % c.wasteB3.length] : c.wasteNonB3[i % c.wasteNonB3.length];
      data.environment.push({ id: `ENV-${String(i + 1).padStart(5, '0')}`, date: new Date(2026, month, (i % 25) + 1), category: isB3 ? 'Limbah B3' : 'Limbah Non B3', wasteType, weight: 18 + (i % 80), unit: 'kg', vendor: vendors[i % vendors.length], manifest: `MNF-${String(i + 1).padStart(5, '0')}`, status: ['Open', 'Closed'][i % 2], note: 'Data monitoring environment', department: 'General Affair', area: c.areas[(i * 4) % c.areas.length], water: 120 + (i % 35), electricity: 2500 + i * 6, wastewater: 40 + (i % 30), ph: 6.5 + ((i % 20) / 20), cod: 40 + (i % 80), bod: 15 + (i % 35), score: 75 + (i % 25) });
    }
    return data;
  },
};
