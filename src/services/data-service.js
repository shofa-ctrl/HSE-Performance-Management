window.HSE = window.HSE || {};
HSE.state = { page: 'executive', raw: null, filtered: null, charts: {}, tables: {}, search: '', source: 'Dummy HSE_DATABASE.xlsx', lastRefresh: new Date(), calendarMonth: new Date(2026, 0, 1), notifications: [] };
HSE.data = {
  empty() { return { safety: [], audit: [], capa: [], environment: [], project: [], permit: [], config: [] }; },
  set(model, source) { HSE.state.raw = model; HSE.state.source = source; HSE.state.lastRefresh = new Date(); this.applyFilters(); },
  getFilters() {
    const v = (id) => document.getElementById(id)?.value || 'All';
    return { year: v('filterYear'), month: v('filterMonth'), date: v('filterDate'), department: v('filterDepartment'), area: v('filterArea'), pic: v('filterPic'), risk: v('filterRisk'), status: v('filterStatus'), priority: v('filterPriority'), auditType: v('filterAuditType'), incidentType: v('filterIncidentType'), permitType: v('filterPermitType'), project: v('filterProject'), vendor: v('filterVendor') };
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
        && (!f.project || f.project === 'All' || r.name === f.project || r.id === f.project)
        && (!f.vendor || f.vendor === 'All' || r.vendor === f.vendor || r.contractor === f.vendor);
    };
    const q = HSE.helpers.norm(HSE.state.search);
    const search = (r) => !q || Object.values(r).some((v) => HSE.helpers.norm(v).includes(q));
    HSE.state.filtered = Object.fromEntries(Object.entries(HSE.state.raw).map(([k, rows]) => [k, rows.filter((r) => match(r) && search(r))]));
  },
  kpi() {
    const h = HSE.helpers, d = HSE.state.filtered;
    const completion = h.pct(d.capa.filter((r) => r.status === 'Closed').length, d.capa.length);
    const auditScore = Math.round(h.avg(d.audit.map((r) => r.score).filter(Boolean)));
    const fiveRScore = Math.round(h.avg(d.audit.filter((r) => /5R|5S/i.test(r.auditType)).map((r) => r.score).filter(Boolean)));
    const envScore = Math.round(h.avg(d.environment.map((r) => r.score).filter(Boolean)));
    const safetyScore = Math.max(0, Math.round(100 - d.safety.filter((r) => ['Lost Time Injury', 'Property Damage', 'Environmental Incident'].includes(r.incidentType)).length * 2 - d.capa.filter((r) => r.status === 'Overdue').length));
    return { totalInspection: d.audit.length, totalFinding: d.audit.length, totalIncident: d.safety.length, unsafeAct: d.audit.filter((r) => r.findingType === 'Unsafe Act').length, unsafeCondition: d.audit.filter((r) => r.findingType === 'Unsafe Condition').length, nearMiss: d.safety.filter((r) => r.incidentType === 'Near Miss').length, fac: d.safety.filter((r) => r.incidentType === 'First Aid Case').length, mtc: d.safety.filter((r) => r.incidentType === 'Medical Treatment Case').length, lti: d.safety.filter((r) => r.incidentType === 'Lost Time Injury').length, propertyDamage: d.safety.filter((r) => r.incidentType === 'Property Damage').length, vehicleAccident: d.safety.filter((r) => r.incidentType === 'Vehicle Accident').length, safetyObservation: d.safety.filter((r) => r.incidentType === 'Safety Observation').length, capaCompletion: completion, openCapa: d.capa.filter((r) => r.status === 'Open').length, dueSoon: d.capa.filter((r) => HSE.helpers.daysToDue(r.dueDate) >= 0 && HSE.helpers.daysToDue(r.dueDate) <= 7 && r.status !== 'Closed').length, overdueCapa: d.capa.filter((r) => r.status === 'Overdue').length, safetyScore, complianceScore: Math.round((completion + auditScore) / 2), auditScore, fiveRScore, environmentalScore: envScore, totalProject: d.project.length, activePermit: d.permit.filter((r) => r.status === 'Active').length };
  },
};
