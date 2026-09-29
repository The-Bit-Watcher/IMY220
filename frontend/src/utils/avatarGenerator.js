
export function generateAvatarSvg(username = "default"){
        let hash = 0;
        for (let i = 0; i < username.length; i++){
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }

        const hue1 = Math.abs(hash) % 360;
        const hue2 = (hue1 + 140) % 360;
        const bg = `linear-gradient(135deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 80%, 40%))`;

        const initials = username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

    return { bg, initials };
}


export function AvatarDisplay({ username, src, className = "w-12 h-12" }) {
  if (src) {
    return <img src={src} alt={username} className={`${className} rounded-full object-cover border`} />;
  }

  const { bg, initials } = generateAvatarSvg(username);

  return (
    <div
      className={`${className} rounded-full flex items-center justify-center font-bold text-white shadow-sm border border-white/20`}
      style={{ background: bg }}
    >
      <span>{initials}</span>
    </div>
  );
}