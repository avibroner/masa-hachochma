export function Noga({
  pose = "stand",
  className = "",
}: {
  pose?: "stand" | "teach" | "praise";
  className?: string;
}) {
  const lanternLift = pose === "praise" ? -26 : 0;
  const bookOpen = pose === "teach" || pose === "praise";
  return (
    <svg
      viewBox="0 0 320 460"
      className={className}
      role="img"
      aria-label="נוגה, מורה צעירה עם פנס ומחברת"
    >
      <ellipse cx="160" cy="432" rx="78" ry="12" fill="#e7d7bc" />
      <ellipse
        className="lantern-glow"
        cx={78}
        cy={318 + lanternLift}
        rx={pose === "praise" ? 58 : 42}
        ry={pose === "praise" ? 58 : 42}
        fill="#f0c36a"
        opacity={pose === "praise" ? 0.55 : 0.28}
      />
      <path
        d="M112 128c-8 36-6 74 8 108"
        stroke="#3f2c24"
        strokeWidth="18"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M208 128c8 36 6 74-8 108"
        stroke="#3f2c24"
        strokeWidth="18"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M108 236c-18 78-8 156 16 184h72c24-28 34-106 16-184-28-16-76-16-104 0z"
        fill="#8d4b3c"
      />
      <path d="M160 228c18 8 36 20 48 40 18 70 8 150-4 176h-44V228z" fill="#743f34" opacity="0.28" />
      <path d="M118 186c-36 18-52 70-40 112" stroke="#1d645d" strokeWidth="30" fill="none" strokeLinecap="round" />
      <path d="M202 186c40 12 58 52 42 96" stroke="#1d645d" strokeWidth="30" fill="none" strokeLinecap="round" />
      <path d="M122 168c0 46-8 78-14 96h104c-6-18-14-50-14-96-20-16-56-16-76 0z" fill="#1d645d" />
      <path d="M160 164c14 0 26 10 30 24 2 28-10 40-30 40s-32-12-30-40c4-14 16-24 30-24z" fill="#f4efe4" />
      <rect x="146" y="150" width="28" height="26" rx="10" fill="#f0c29a" />
      <ellipse cx="160" cy="116" rx="42" ry="46" fill="#f0c29a" />
      <path d="M120 112c2-48 28-62 40-62s38 14 40 62c-14-24-26-30-40-30s-26 6-40 30z" fill="#3f2c24" />
      <path d="M132 104c10 16 46 16 56 0" stroke="#3f2c24" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M130 102q12-10 24-2" stroke="#5a4034" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M190 102q-12-10-24-2" stroke="#5a4034" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <ellipse cx="144" cy="118" rx="4.2" ry="4.6" fill="#3a2a22" />
      <ellipse cx="176" cy="118" rx="4.2" ry="4.6" fill="#3a2a22" />
      <ellipse cx="145.5" cy="116.5" rx="1.4" ry="1.4" fill="#fffaf3" />
      <ellipse cx="177.5" cy="116.5" rx="1.4" ry="1.4" fill="#fffaf3" />
      <path d="M158 126c2 4 6 4 8 0" stroke="#c48b72" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path
        d={pose === "praise" ? "M142 138c6 12 30 12 36 0" : "M144 138c6 8 26 8 32 0"}
        stroke="#8d4b3c"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="136" cy="134" rx="7" ry="3" fill="#e7a48a" opacity="0.28" />
      <ellipse cx="184" cy="134" rx="7" ry="3" fill="#e7a48a" opacity="0.28" />
      <rect x="96" y="228" width="16" height="10" rx="4" fill="#f4efe4" transform="rotate(18 104 233)" />
      <rect x="214" y="214" width="16" height="10" rx="4" fill="#f4efe4" transform="rotate(-16 222 219)" />
      <ellipse cx="78" cy="304" rx="12" ry="10" fill="#f0c29a" />
      <ellipse cx="238" cy="286" rx="12" ry="10" fill="#f0c29a" />
      <rect x="108" y="236" width="10" height="8" rx="2" fill="#1d645d" />
      <rect x="198" y="236" width="10" height="8" rx="2" fill="#1d645d" />
      <ellipse cx="136" cy="422" rx="18" ry="8" fill="#3f2c24" />
      <ellipse cx="188" cy="422" rx="18" ry="8" fill="#3f2c24" />
      <g transform={`translate(0 ${lanternLift})`}>
        <path d="M78 292c-10-16 10-22 0-34" stroke="#8a5e16" strokeWidth="3" fill="none" />
        <rect x="62" y="300" width="32" height="8" rx="2" fill="#c4882a" />
        <path d="M64 308h28l6 36c0 6-8 12-20 12s-20-6-20-12z" fill="#c4882a" />
        <path d="M70 314h16l3 24c0 4-4 8-11 8s-11-4-11-8z" fill="#f6c15b" />
        <ellipse className="flame" cx="78" cy="322" rx="3.5" ry="6" fill="#fff6d8" />
      </g>
      {bookOpen ? (
        <g transform="translate(214 250)">
          <path d="M8 8h28c6 10 6 28 0 40H8c-6-12-6-30 0-40z" fill="#f7f1e6" stroke="#c4b49a" />
          <path d="M36 8h28c6 10 6 28 0 40H36c-6-12-6-30 0-40z" fill="#fffaf3" stroke="#c4b49a" />
          <path d="M14 20h16M14 28h16M42 20h16M42 28h12" stroke="#d9c7aa" strokeWidth="2" />
        </g>
      ) : (
        <g transform="translate(214 252) rotate(-8)">
          <rect x="0" y="0" width="46" height="58" rx="4" fill="#f7f1e6" stroke="#c4b49a" />
          <path d="M8 16h30M8 26h30M8 36h22" stroke="#d9c7aa" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}

export function LanternMark({ className = "size-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <ellipse className="lantern-glow" cx="32" cy="36" rx="18" ry="18" fill="#f0c36a" opacity="0.45" />
      <path d="M32 10c-6 8 6 10 0 18" stroke="#8a5e16" strokeWidth="2" fill="none" />
      <rect x="24" y="26" width="16" height="4" rx="1" fill="#c4882a" />
      <path d="M26 30h12l3 16c0 3-4 6-9 6s-9-3-9-6z" fill="#c4882a" />
      <path d="M29 33h6l1 10c0 2-2 4-4 4s-4-2-4-4z" fill="#f6c15b" />
      <ellipse className="flame" cx="32" cy="38" rx="1.6" ry="3" fill="#fff6d8" />
    </svg>
  );
}
