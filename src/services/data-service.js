window.HSE = window.HSE || {};
HSE.state = { page: 'executive', raw: null, filtered: null, charts: {}, tables: {}, search: '', source: 'No workbook loaded', workbookFile: null, lastRefresh: null, calendarMonth: new Date(2026, 0, 1), notifications: [], validation: { missingSheets: [], missingColumns: [] }, loading: false, schedules: [] };
HSE.data = {
  empty() { return { safety: [], finding: [], audit: [], capa: [], environment: [], project: [], permit: [], manhours: [], fiveR: [], apar: [], lookup: [], config: [] }; },
  set(model, source, file = null) { HSE.state.raw = model; HSE.state.source = source; if (file) HSE.state.workbookFile = file; HSE.state.lastRefresh = new Date(); this.applyFilters(); },
  hasData() { return HSE.state.raw && Object.values(HSE.state.raw).some((rows) => Array.isArray(rows) && rows.length); },
  getFilters() {
    const v = (id) => document.getElementById(id)?.value || 'All';
    return { year: v('filterYear'), month: v('filterMonth'), date: document.getElementById('filterDate')?.value || '', department: v('filterDepartment'), area: v('filterArea'), pic: v('filterPic'), risk: v('filterRisk'), status: v('filterStatus'), priority: v('filterPriority'), auditType: v('filterAuditType'), incidentType: v('filterIncidentType'), permitType: v('filterPermitType'), wasteCategory: v('filterWasteType'), project: v('filterProject'), vendor: v('filterVendor') };
  },
  applyFilters() {
    const f = this.getFilters();
    const match = (r) => {
      const date = r.date || r.dueDate || r.issueDate || r.targetFinish;
      return (!f.year || f.year === 'All' || String(date?.getFullYear() || '') === f.year)
        && (!f.month || f.month === 'All' || HSE.config.months[date?.getMonth()] === f.month)
        && (!f.date || HSE.helpers.fmtDate(date) === f.date)
        && (!f.department || f.department === 'All' || r.department === f.department)
        && (!f.area || f.area === 'All' || r.area === f.area)
        && (!f.pic || f.pic === 'All' || r.pic === f.pic)
        && (!f.risk || f.risk === 'All' || r.risk === f.risk || r.severity === f.risk)
        && (!f.status || f.status === 'All' || r.status === f.status)
        && (!f.priority || f.priority === 'All' || r.priority === f.priority)
        && (!f.auditType || f.auditType === 'All' || r.auditType === f.auditType)
        && (!f.incidentType || f.incidentType === 'All' || r.incidentType === f.incidentType)
        && (!f.permitType || f.permitType === 'All' || r.permitType === f.permitType)
        && (!f.wasteCategory || f.wasteCategory === 'All' || r.category === f.wasteCategory)
        && (!f.project || f.project === 'All' || r.name === f.project || r.id === f.project)
        && (!f.vendor || f.vendor === 'All' || r.vendor === f.vendor || r.contractor === f.vendor);
    };
    const q = HSE.helpers.norm(HSE.state.search);
    const search = (r) => !q || Object.values(r).some((v) => HSE.helpers.norm(v).includes(q));
    HSE.state.filtered = Object.fromEntries(Object.entries(HSE.state.raw || this.empty()).map(([k, rows]) => [k, rows.filter((r) => match(r) && search(r))]));
  },
  kpi() {
    const h = HSE.helpers, d = HSE.state.filtered;
    const findings = [...(d.finding || []), ...(d.audit || [])];
    const apdRows = findings.filter((r) => /inspeksi apd|apd/i.test(`${r.auditType} ${r.findingType} ${r.category}`));
    const completion = h.pct(d.capa.filter((r) => r.status === 'Closed').length, d.capa.length);
    const scoredAudits = findings.map((r) => r.score).filter(Boolean);
    const auditScore = Math.round(scoredAudits.length ? h.avg(scoredAudits) : h.pct(findings.filter((r) => r.status === 'Closed').length, findings.length));
    const fiveRScore = Math.round(h.avg(findings.filter((r) => /5R|5S/i.test(r.auditType || r.category)).map((r) => r.score).filter(Boolean)));
    const envScore = Math.round(h.avg(d.environment.map((r) => r.score).filter(Boolean)));
    const incidentPenalty = Math.min(45, d.safety.length * 1.8);
    const findingClosed = h.pct(findings.filter((r) => r.status === 'Closed').length, findings.length);
    const environmentalCompliance = envScore || h.pct(d.environment.filter((r) => r.comply !== false).length, d.environment.length);
    const safetyScore = Math.max(0, Math.min(100, Math.round((100 - incidentPenalty + findingClosed + completion + environmentalCompliance) / 4)));
    const mh = d.manhours || [];
    const manhours = h.sum(mh, 'manhours');
    const lti = h.sum(mh, 'lti') || d.safety.filter((r) => r.incidentType === 'Lost Time Injury').length;
    const lostDays = h.sum(mh, 'lostDays');
    const fac = h.sum(mh, 'fac') || d.safety.filter((r) => /first aid|\bfac\b/i.test(r.incidentType)).length;
    const avg5R = h.avg(d.fiveR.map((r) => r.averageScore).filter(Boolean));
    const apdTotal = h.sum(apdRows, 'totalItem');
    const apdOk = h.sum(apdRows, 'itemOk');
    const apdCompliance = apdTotal ? (apdOk / apdTotal) * 100 : h.pct(apdRows.filter((r) => r.status === 'Closed').length, apdRows.length);
    return { totalInspection: findings.length, totalFinding: findings.length, totalIncident: d.safety.length, openFinding: findings.filter((r) => r.status === 'Open').length, unsafeAct: findings.filter((r) => r.findingType === 'Unsafe Act').length, unsafeCondition: findings.filter((r) => r.findingType === 'Unsafe Condition').length, nearMiss: d.safety.filter((r) => /near miss/i.test(r.incidentType)).length, fac, mtc: d.safety.filter((r) => /medical treatment|\bmtc\b/i.test(r.incidentType)).length, lti, propertyDamage: d.safety.filter((r) => /property damage/i.test(r.incidentType)).length, vehicleAccident: d.safety.filter((r) => /vehicle accident/i.test(r.incidentType)).length, safetyObservation: d.safety.filter((r) => /safety observation/i.test(r.incidentType)).length, capaCompletion: completion, openCapa: d.capa.filter((r) => r.status !== 'Closed').length, dueSoon: d.capa.filter((r) => HSE.helpers.daysToDue(r.dueDate) >= 0 && HSE.helpers.daysToDue(r.dueDate) <= 7 && r.status !== 'Closed').length, overdueCapa: d.capa.filter((r) => r.status === 'Overdue').length, safetyScore, complianceScore: Math.round((completion + auditScore) / 2), auditScore, fiveRScore, average5RScore: avg5R, apdCompliance, environmentalScore: envScore, totalProject: d.project.length, activePermit: d.permit.filter((r) => r.status === 'Active').length, manhours, ltifr: manhours ? (lti * 1000000 / manhours) : 0, ltisr: manhours ? (lostDays * 1000000 / manhours) : 0, fafr: manhours ? (fac * 1000000 / manhours) : 0 };
  },
};
