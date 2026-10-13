export default function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase().replace(' ', '-');
  return <span className={`status status-${key}`}>{status || '—'}</span>;
}
