/**
 * The landing hero's background scene: a student, seen from behind, facing a
 * signpost that points to "Better College", "Brighter Future" and "Your
 * Dream", in front of a campus.
 *
 * Drawn to fill the right-hand side of the hero edge to edge, with the chat
 * panel sitting over its left part (client reference, 26 Sep 2026). The
 * subject is kept on the right of the canvas and anchored there
 * (`xMaxYMax slice`), so on any screen width the crop eats into the campus
 * behind the chat panel, never into the student or the signpost.
 *
 * Drawn inline so the page ships without a stock photo — replace with the
 * client's artwork (an <img> with object-cover object-right-bottom) when it is
 * supplied; nothing else depends on this component's internals.
 */
export default function HeroIllustration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 720 440"
      preserveAspectRatio="xMaxYMax slice"
      className={className}
      role="img"
      aria-label="A student looking at a signpost pointing to Better College, Brighter Future and Your Dream"
    >
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfdbfe" />
          <stop offset="1" stopColor="#eff6ff" />
        </linearGradient>
        <linearGradient id="hero-hoodie" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e40af" />
        </linearGradient>
        <linearGradient id="hero-bag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="hero-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#86efac" />
          <stop offset="1" stopColor="#4ade80" />
        </linearGradient>
      </defs>

      {/* Sky and clouds */}
      <rect width="720" height="440" fill="url(#hero-sky)" />
      <g fill="#ffffff" opacity="0.9">
        <ellipse cx="200" cy="70" rx="56" ry="16" />
        <ellipse cx="236" cy="60" rx="34" ry="16" />
        <ellipse cx="610" cy="46" rx="50" ry="14" />
        <ellipse cx="640" cy="38" rx="30" ry="13" />
      </g>

      {/* Campus — sits behind the chat panel, so it may be cropped. */}
      <g>
        <rect x="90" y="190" width="340" height="150" fill="#f5e6c8" />
        <rect x="90" y="178" width="340" height="16" fill="#c2410c" />
        <rect x="215" y="126" width="90" height="56" fill="#fbecd0" />
        <polygon points="202,130 260,94 318,130" fill="#b45309" />
        <rect x="251" y="64" width="18" height="36" fill="#fbecd0" />
        <polygon points="246,66 260,48 274,66" fill="#b45309" />
        <rect x="228" y="142" width="64" height="26" rx="4" fill="#93c5fd" />
        {[118, 152, 186, 334, 368, 402].map((x) => (
          <g key={x}>
            <rect x={x - 10} y="208" width="20" height="28" rx="10" fill="#93c5fd" />
            <rect x={x - 10} y="258" width="20" height="28" rx="10" fill="#93c5fd" />
          </g>
        ))}
        <rect x="240" y="266" width="40" height="74" rx="20" fill="#7c2d12" />
        {/* Steps */}
        <rect x="222" y="332" width="76" height="8" fill="#e7e5e4" />
        <rect x="214" y="338" width="92" height="8" fill="#d6d3d1" />
      </g>

      {/* Ground, path and trees */}
      <rect y="336" width="720" height="104" fill="url(#hero-ground)" />
      <path d="M300 440 L340 346 L380 346 L470 440 Z" fill="#e7e5e4" />
      <g>
        <rect x="46" y="250" width="10" height="90" fill="#78350f" />
        <circle cx="51" cy="236" r="40" fill="#22c55e" />
        <circle cx="72" cy="262" r="28" fill="#16a34a" />
        <circle cx="30" cy="262" r="24" fill="#16a34a" />
        <rect x="690" y="262" width="10" height="80" fill="#78350f" />
        <circle cx="696" cy="250" r="38" fill="#22c55e" />
        <circle cx="676" cy="276" r="26" fill="#16a34a" />
      </g>
      <g fill="#15803d">
        <circle cx="610" cy="352" r="18" />
        <circle cx="632" cy="346" r="22" />
        <circle cx="656" cy="354" r="16" />
      </g>

      {/* Signpost */}
      <g>
        <rect x="628" y="76" width="16" height="280" rx="4" fill="#1e3a8a" />
        <g transform="rotate(5 610 100)">
          <path d="M520 80 H676 L698 102 L676 124 H520 Z" fill="#2563eb" />
          <text x="604" y="109" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="800" fontFamily="Inter, sans-serif">Better College</text>
        </g>
        <g transform="rotate(-4 610 160)">
          <path d="M512 140 H676 L698 162 L676 184 H512 Z" fill="#f97316" />
          <text x="600" y="169" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="800" fontFamily="Inter, sans-serif">Brighter Future</text>
        </g>
        <g transform="rotate(3 610 222)">
          <path d="M530 202 H676 L698 224 L676 246 H530 Z" fill="#16a34a" />
          <text x="610" y="231" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="800" fontFamily="Inter, sans-serif">Your Dream</text>
        </g>
      </g>

      {/* Student, seen from behind */}
      <g>
        {/* Hoodie */}
        <path d="M430 440 C430 362 462 314 520 314 C578 314 610 362 610 440 Z" fill="url(#hero-hoodie)" />
        {/* Hood, bunched behind the neck */}
        <path d="M478 318 C486 300 554 300 562 318 C552 334 488 334 478 318 Z" fill="#1d4ed8" />
        {/* Neck and ears */}
        <rect x="506" y="282" width="28" height="30" rx="10" fill="#e9b894" />
        <ellipse cx="480" cy="262" rx="7" ry="11" fill="#e9b894" />
        <ellipse cx="560" cy="262" rx="7" ry="11" fill="#e9b894" />
        {/* Back of the head */}
        <circle cx="520" cy="254" r="40" fill="#1f2937" />
        <path d="M486 236 C492 206 540 200 558 226 C546 216 520 214 500 226 Z" fill="#374151" />
        {/* Backpack */}
        <path d="M486 330 C466 336 462 360 470 380" stroke="#92400e" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M554 330 C574 336 578 360 570 380" stroke="#92400e" strokeWidth="9" fill="none" strokeLinecap="round" />
        <rect x="474" y="338" width="92" height="102" rx="24" fill="url(#hero-bag)" />
        <rect x="490" y="382" width="60" height="44" rx="12" fill="#f59e0b" stroke="#d97706" strokeWidth="2.5" />
        <rect x="512" y="376" width="16" height="8" rx="3" fill="#92400e" />
        <path d="M486 350 H554" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}
