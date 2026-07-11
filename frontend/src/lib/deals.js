export const DEAL_STAGES = ['prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

export const STAGE_LABELS = {
  prospect: 'Prospect',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export const STAGE_COLORS = {
  prospect: { column: 'bg-slate-100', header: 'border-slate-300', dot: 'bg-slate-500', badge: 'default' },
  qualified: { column: 'bg-blue-50', header: 'border-blue-200', dot: 'bg-blue-500', badge: 'info' },
  proposal: { column: 'bg-indigo-50', header: 'border-indigo-200', dot: 'bg-indigo-500', badge: 'purple' },
  negotiation: { column: 'bg-amber-50', header: 'border-amber-200', dot: 'bg-amber-500', badge: 'warning' },
  won: { column: 'bg-emerald-50', header: 'border-emerald-200', dot: 'bg-emerald-500', badge: 'success' },
  lost: { column: 'bg-red-50', header: 'border-red-200', dot: 'bg-red-500', badge: 'danger' },
};

export const getAssignedName = (assignedTo) => {
  if (!assignedTo) return 'Unassigned';
  if (assignedTo.fullName) return assignedTo.fullName;
  const name = `${assignedTo.firstName || ''} ${assignedTo.lastName || ''}`.trim();
  return name || 'Unassigned';
};

export const getContactName = (deal) => {
  if (!deal?.contact) return '—';
  if (typeof deal.contact === 'string') return deal.contact;
  const name = `${deal.contact.firstName || ''} ${deal.contact.lastName || ''}`.trim();
  return name || deal.contact.email || '—';
};

export const getCompanyName = (deal) => {
  if (!deal?.company) return deal?.companyName || '—';
  if (typeof deal.company === 'string') return deal.company;
  return deal.company.name || '—';
};

export const emptyDealForm = (userId) => ({
  title: '',
  value: '',
  probability: '10',
  stage: 'prospect',
  contact: '',
  description: '',
  assignedTo: userId || '',
});

export const dealToForm = (deal) => ({
  title: deal.title || '',
  value: deal.value?.toString() || '0',
  probability: deal.probability?.toString() || '10',
  stage: deal.stage || 'prospect',
  contact: getContactName(deal) === '—' ? '' : getContactName(deal),
  description: deal.description || '',
  assignedTo: deal.assignedTo?._id || deal.assignedTo || '',
});
