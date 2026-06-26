const MONO = "'Source Code Pro', monospace";

export function HomeFooter() {
  return (
    <footer
      style={{
        background: '#0b0c0f',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '32px 0',
      }}
    >
      <div
        className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 2xl:px-32"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        {/* Logo + info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img
            src="/logo.png"
            alt="Delta Padel Tour"
            style={{ width: 40, height: 40, objectFit: 'contain' }}
          />
          <div>
            <p
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#888',
                marginBottom: 2,
              }}
            >
              Delta Padel Tour · Season 2 · 2026
            </p>
            <p
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '0.1em',
                color: '#555',
              }}
            >
              Mansoura · Egypt
            </p>
          </div>
        </div>

        {/* Copyright */}
        <p
          style={{
            fontFamily: MONO,
            fontSize: 10,
            color: '#444',
            letterSpacing: '0.05em',
          }}
        >
          © 2026 Delta Padel Tour. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
