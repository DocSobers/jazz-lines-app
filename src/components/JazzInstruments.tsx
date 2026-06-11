/** Stylized jazz-combo illustrations for the landing page. */
export default function JazzInstruments() {
  return (
    <div className="jazz-instruments" aria-hidden="true">
      <svg
        className="jazz-instruments__svg"
        viewBox="0 0 920 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0c060" />
            <stop offset="100%" stopColor="#c88a2a" />
          </linearGradient>
          <linearGradient id="horn" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d4a84b" />
            <stop offset="100%" stopColor="#8a5e1e" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Stage floor */}
        <ellipse cx="460" cy="278" rx="400" ry="18" fill="#1a222d" opacity="0.9" />
        <ellipse cx="460" cy="276" rx="360" ry="10" stroke="#e8a838" strokeOpacity="0.25" strokeWidth="1" />

        {/* Piano */}
        <g transform="translate(40, 95)">
          <g className="jazz-instruments__piano">
          <path
            d="M0 120 L180 120 L200 40 L220 120 L280 120 L280 160 L0 160 Z"
            fill="#1a222d"
            stroke="url(#gold)"
            strokeWidth="1.5"
          />
          <path d="M20 120 L20 90 L260 90 L260 120" fill="#243040" stroke="#5a4a32" strokeWidth="1" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => (
            <rect
              key={i}
              x={24 + i * 16}
              y={92}
              width={13}
              height={26}
              fill="#e8edf4"
              fillOpacity={0.85}
              stroke="#8fa3bf"
              strokeWidth="0.5"
            />
          ))}
          {[1, 2, 4, 5, 6, 8, 9, 11, 12].map((i) => (
            <rect
              key={`b${i}`}
              x={32 + i * 16}
              y={92}
              width={9}
              height={16}
              fill="#0f1419"
              stroke="#2f3d52"
              strokeWidth="0.5"
            />
          ))}
          <path d="M200 40 L210 20 L225 40" stroke="url(#gold)" strokeWidth="2" fill="none" />
          </g>
        </g>

        {/* Upright bass */}
        <g transform="translate(195, 35)">
          <g className="jazz-instruments__bass">
          <path
            d="M55 200 C55 120 30 80 55 30 C80 80 55 120 55 200 Z"
            fill="#1a222d"
            stroke="url(#gold)"
            strokeWidth="1.5"
          />
          <path d="M55 30 L55 8" stroke="#c88a2a" strokeWidth="2" />
          <circle cx="55" cy="6" r="4" fill="#e8a838" />
          <path d="M30 200 L80 200" stroke="#8fa3bf" strokeWidth="2" />
          <rect x="48" y="55" width="14" height="100" rx="3" fill="#2a1f14" stroke="#5a4a32" strokeWidth="1" />
          <path d="M20 120 Q55 100 90 120" stroke="#8fa3bf" strokeWidth="1.2" fill="none" />
          <path d="M18 140 Q55 118 92 140" stroke="#8fa3bf" strokeWidth="1.2" fill="none" />
          <path d="M16 160 Q55 136 94 160" stroke="#8fa3bf" strokeWidth="1.2" fill="none" />
          </g>
        </g>

        {/* Archtop guitar (Joe Pass style) */}
        <g transform="translate(330, 70)">
          <g className="jazz-instruments__guitar" filter="url(#glow)">
          <ellipse cx="95" cy="115" rx="72" ry="88" fill="#1a222d" stroke="url(#gold)" strokeWidth="2" />
          <ellipse cx="95" cy="115" rx="52" ry="62" fill="none" stroke="#5a4a32" strokeWidth="1" opacity="0.6" />
          <path
            d="M55 95 C45 115 45 135 55 155 C70 170 120 170 135 155 C145 135 145 115 135 95"
            fill="none"
            stroke="#c88a2a"
            strokeWidth="1.2"
            opacity="0.7"
          />
          <path
            d="M65 100 C58 115 58 135 65 150 C75 162 115 162 125 150 C132 135 132 115 125 100"
            fill="none"
            stroke="#c88a2a"
            strokeWidth="1.2"
            opacity="0.7"
          />
          <rect x="88" y="28" width="14" height="95" rx="3" fill="#2a1f14" stroke="url(#gold)" strokeWidth="1.2" />
          <rect x="84" y="18" width="22" height="18" rx="2" fill="#243040" stroke="#8fa3bf" strokeWidth="1" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line
              key={i}
              x1={86 + i * 3.5}
              y1={22}
              x2={86 + i * 3.5}
              y2={120}
              stroke="#8fa3bf"
              strokeWidth="0.6"
              opacity="0.5"
            />
          ))}
          <ellipse cx="95" cy="115" rx="18" ry="22" fill="#0f1419" stroke="#e8a838" strokeWidth="1" />
          </g>
        </g>

        {/* Tenor sax */}
        <g transform="translate(530, 55)">
          <g className="jazz-instruments__sax">
          <path
            d="M30 180 Q10 140 35 90 Q55 50 80 35 L95 30 L110 35 Q135 50 155 90 Q180 140 160 180"
            fill="#1a222d"
            stroke="url(#horn)"
            strokeWidth="2"
          />
          <path d="M95 30 L95 8" stroke="#c88a2a" strokeWidth="2" />
          <circle cx="95" cy="6" r="4" fill="#e8a838" />
          <ellipse cx="95" cy="115" rx="38" ry="48" fill="#243040" stroke="#8fa3bf" strokeWidth="1" />
          <circle cx="120" cy="95" r="7" fill="#0f1419" stroke="url(#gold)" strokeWidth="1.2" />
          <circle cx="120" cy="95" r="3" fill="#e8a838" />
          <path d="M70 155 L120 155" stroke="#8fa3bf" strokeWidth="1.5" />
          <path d="M145 100 L175 85 L180 95 L150 110 Z" fill="url(#horn)" stroke="#5a4a32" strokeWidth="1" />
          </g>
        </g>

        {/* Trumpet */}
        <g transform="translate(700, 80)">
          <g className="jazz-instruments__trumpet">
          <path
            d="M10 120 Q30 100 60 95 L140 90 Q170 88 185 75 L195 70"
            stroke="url(#horn)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="200" cy="68" rx="14" ry="10" fill="#d4a84b" stroke="#8a5e1e" strokeWidth="1" />
          <circle cx="208" cy="68" r="4" fill="#0f1419" />
          <path d="M50 95 L50 70 Q50 55 65 50" stroke="url(#gold)" strokeWidth="2" fill="none" />
          <circle cx="65" cy="48" r="5" fill="#e8a838" />
          <rect x="35" y="108" width="8" height="24" rx="2" fill="#2a1f14" stroke="#8fa3bf" strokeWidth="1" />
          <circle cx="90" cy="92" r="9" fill="#1a222d" stroke="url(#gold)" strokeWidth="1.5" />
          <circle cx="115" cy="91" r="7" fill="#1a222d" stroke="url(#gold)" strokeWidth="1.2" />
          <path d="M10 125 L40 130 L55 128" stroke="#8fa3bf" strokeWidth="1.5" fill="none" />
          </g>
        </g>

        {/* Music staff accents */}
        <g opacity="0.35" stroke="#e8a838" strokeWidth="1">
          <path d="M120 42 Q200 28 280 42" fill="none" />
          <path d="M640 38 Q720 24 800 38" fill="none" />
          <circle cx="300" cy="36" r="3" fill="#e8a838" />
          <circle cx="760" cy="34" r="3" fill="#e8a838" />
        </g>
      </svg>

      <ul className="jazz-instruments__labels">
        <li>Piano</li>
        <li>Upright bass</li>
        <li>Jazz guitar</li>
        <li>Tenor sax</li>
        <li>Trumpet</li>
      </ul>
    </div>
  );
}
