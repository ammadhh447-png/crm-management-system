const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALES_REP: 'sales_rep',
  SUPPORT: 'support',
  HR: 'hr',
};

const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.SALES_REP]: 'Sales Representative',
  [ROLES.SUPPORT]: 'Support',
  [ROLES.HR]: 'Human Resources',
};

const ALL_ROLES = Object.values(ROLES);

module.exports = { ROLES, ROLE_LABELS, ALL_ROLES };
