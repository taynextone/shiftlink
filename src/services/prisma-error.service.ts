export function isPrismaUniqueConstraintError(error: unknown, targetIncludes?: string[]): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = (error as { code?: string }).code;
  if (code !== 'P2002') {
    return false;
  }

  if (!targetIncludes || targetIncludes.length === 0) {
    return true;
  }

  const target = (error as { meta?: { target?: unknown } }).meta?.target;
  if (!Array.isArray(target)) {
    return false;
  }

  return targetIncludes.every((value) => target.includes(value));
}
