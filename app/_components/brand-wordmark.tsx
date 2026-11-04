interface BrandWordmarkProps {
  className?: string;
}

export default function SamarthDealsLogo({ className }: BrandWordmarkProps) {
  return (
    <svg
      aria-label="Samarth Deals"
      className={className}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox="0 0 486 165"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="#FFA500">
        <path d="m8 63 26-11-7 8-22 9z" />
        <path d="m13 77 27-11-7 8-22 9z" />
        <path d="m7 91 26-11-7 8-22 9z" />
      </g>

      <path
        d="M298 39h155v64q0 12-12 12h-51M298 39v19"
        stroke="#FFA500"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5.5"
      />
      <path
        d="M332 41V29c0-15 13-27 33-27s33 12 33 27v12"
        stroke="#FFA500"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="6"
      />
      <path
        d="M325 41v-8c0-7 3-13 8-18"
        stroke="#FFA500"
        strokeLinecap="round"
        strokeWidth="4"
      />

      <text
        fill="#06163E"
        fontFamily="'Arial Black', Arial, Helvetica, sans-serif"
        fontSize="48"
        fontStyle="italic"
        fontWeight="900"
        letterSpacing="-1.2"
        y="94"
      >
        <tspan lengthAdjust="spacingAndGlyphs" textLength="238" x="45">SAMARTH</tspan>
        <tspan lengthAdjust="spacingAndGlyphs" textLength="154" x="290">DEALS</tspan>
      </text>

      <path
        d="M80 130c51 8 105 9 163 1 39-5 72-9 107-5-35-1-69 4-106 10-59 9-112 7-163-3z"
        fill="#06163E"
      />
      <path
        d="M125 138c53 7 104 8 153 2 38-5 71-9 103-8-32 3-65 8-102 13-50 7-101 5-154-7z"
        fill="#FFA500"
      />
    </svg>
  );
}