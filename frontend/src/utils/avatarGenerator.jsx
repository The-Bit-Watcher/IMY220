// Fallback avatar (initials on a gradient) for users without a profile picture.
// Gradients are fixed Tailwind classes picked by a hash of the name, so no inline styles are needed.
const GRADIENTS = [
  'bg-gradient-to-br from-indigo-500 to-violet-700',
  'bg-gradient-to-br from-rose-500 to-orange-600',
  'bg-gradient-to-br from-emerald-500 to-teal-700',
  'bg-gradient-to-br from-sky-500 to-blue-700',
  'bg-gradient-to-br from-amber-500 to-red-600',
  'bg-gradient-to-br from-fuchsia-500 to-purple-700',
  'bg-gradient-to-br from-cyan-500 to-emerald-700',
  'bg-gradient-to-br from-pink-500 to-rose-700',
];

function avatarFor(name = 'User') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const initials = name.split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  return { gradient: GRADIENTS[Math.abs(hash) % GRADIENTS.length], initials };
}

export function AvatarDisplay({ username, src, className = 'w-12 h-12' }) {
  if (src) {
    return <img src={src} alt={username} className={`${className} rounded-full object-cover border border-slate-700`} />;
  }
  const { gradient, initials } = avatarFor(username);
  return (
    <div role="img" aria-label={username}
      className={`${className} ${gradient} rounded-full flex items-center justify-center font-bold text-white shadow-sm border border-white/20`}>
      <span aria-hidden="true">{initials}</span>
    </div>
  );
}
