export const ROLE_HIERARCHY: Record<string, number> = {
  STUDENT: 0,
  INSTRUCTOR: 1,
  ADMIN: 2,
  OVERALL_ADMIN: 3,
};

export const OVERALL_ADMIN_EMAIL = "dodmanc@icloud.com";

export function isAdmin(role: string | undefined): boolean {
  return role === "ADMIN" || role === "OVERALL_ADMIN";
}

export function isOverallAdmin(role: string | undefined): boolean {
  return role === "OVERALL_ADMIN";
}

export function canManageUser(actorRole: string, targetRole: string): boolean {
  return (ROLE_HIERARCHY[actorRole] || 0) > (ROLE_HIERARCHY[targetRole] || 0);
}
