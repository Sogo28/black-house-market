// Logo « Black House · Private room » redessiné en vectoriel (maquette, planche Logo).
// Sans accroche, on ne garde que « Black House » : c'est la version de l'en-tête.

type LogoProps = {
  width?: number;
  withTagline?: boolean;
  className?: string;
};

export function Logo({ width = 180, withTagline = false, className }: LogoProps) {
  const viewBoxHeight = withTagline ? 300 : 150;
  const height = Math.round((width * viewBoxHeight) / 640);

  return (
    <svg
      width={width}
      height={height}
      viewBox={withTagline ? "0 0 640 300" : "0 40 640 150"}
      role="img"
      aria-label="Black House, Private room"
      className={className}
    >
      <defs>
        <linearGradient id="bh-script" x1="0" y1="50" x2="0" y2="182" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F8E08A" />
          <stop offset="0.42" stopColor="#E1A92E" />
          <stop offset="0.68" stopColor="#F3CF67" />
          <stop offset="1" stopColor="#B07A16" />
        </linearGradient>
        <linearGradient id="bh-tagline" x1="0" y1="222" x2="0" y2="264" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F8E08A" />
          <stop offset="0.5" stopColor="#E1A92E" />
          <stop offset="1" stopColor="#C08A1E" />
        </linearGradient>
        <linearGradient id="bh-rule" x1="110" y1="0" x2="530" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8C7A52" stopOpacity="0" />
          <stop offset="0.5" stopColor="#8C7A52" stopOpacity="0.9" />
          <stop offset="1" stopColor="#8C7A52" stopOpacity="0" />
        </linearGradient>
      </defs>
      <text x="320" y="150" textAnchor="middle" fontSize="116" fill="url(#bh-script)" className="font-script">
        Black House
      </text>
      {withTagline && (
        <>
          <rect x="110" y="198" width="420" height="1.5" fill="url(#bh-rule)" />
          <text
            x="320"
            y="262"
            textAnchor="middle"
            fontSize="54"
            letterSpacing="1"
            fill="url(#bh-tagline)"
            className="font-tagline"
          >
            Private room
          </text>
        </>
      )}
    </svg>
  );
}
