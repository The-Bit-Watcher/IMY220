// Blue check shown next to the name of a verified account
function VerifiedBadge({ user, size = 'sm' }) {
  if (!user?.verified) return null;
  const dims = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <span title="Verified account" className="inline-flex shrink-0 align-middle">
      <svg className={`${dims} text-sky-400`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 1.5l2.6 1.9 3.2-.2 1 3.1 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3.1-3.2-.2L12 22.5l-2.6-1.9-3.2.2-1-3.1-2.6-1.9 1-3.1-1-3.1 2.6-1.9 1-3.1 3.2.2z" />
        <path d="M8.5 12.3l2.3 2.3 4.7-4.9" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="sr-only">Verified account</span>
    </span>
  );
}

export default VerifiedBadge;
