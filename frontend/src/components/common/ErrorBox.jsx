
// Inline error / success message used by forms and pages instead of alert()
function ErrorBox({ message, tone = 'error', className = '' }) {
  if (!message) return null;
  const styles = tone === 'success'
    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
    : 'bg-rose-500/10 text-rose-300 border-rose-500/25';
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`border p-3 text-xs rounded-lg ${styles} ${className}`}>
      {message}
    </div>
  );
}

export default ErrorBox;
