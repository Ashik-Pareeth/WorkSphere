export const ROLE_HIERARCHY = {
  SUPER_ADMIN: 4,
  HR: 3,
  MANAGER: 2,
  EMPLOYEE: 1,
  AUDITOR: 0,
};

export function getHighestRole(roles = []) {
  const names = roles.map((r) => {
    const name = typeof r === 'string' ? r : r.roleName;
    return name ? name.replace(/^ROLE_/, '') : ''; // Strip ROLE_ prefix
  });
  return names.reduce((best, r) => {
    if (!best) return r;
    return (ROLE_HIERARCHY[r] ?? -1) > (ROLE_HIERARCHY[best] ?? -1) ? r : best;
  }, null);
}

export function canManage(viewerRank, targetRoles = []) {
  const targetHighest = getHighestRole(targetRoles);
  const targetRank = ROLE_HIERARCHY[targetHighest] ?? 1;
  return viewerRank > targetRank;
}

export function assignableRoles(allRoles = [], viewerRank) {
  return allRoles.filter((r) => {
    const cleanName = r.roleName ? r.roleName.replace(/^ROLE_/, '') : '';
    return (ROLE_HIERARCHY[cleanName] ?? -1) < viewerRank;
  });
}
