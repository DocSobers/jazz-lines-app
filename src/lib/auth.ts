export function isAdminUser(
  user: { publicMetadata?: Record<string, unknown> } | null | undefined
): boolean {
  if (!user) return false;
  return user.publicMetadata?.role === 'admin';
}
