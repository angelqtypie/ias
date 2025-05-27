export function formatLocalDateTime(dateString: string) {
  if (!dateString) return '';
  const hasTimeZone = dateString.endsWith('Z') || dateString.includes('+') || dateString.includes('-');
  const date = new Date(hasTimeZone ? dateString : dateString + 'Z');
  return date.toLocaleString();
}
