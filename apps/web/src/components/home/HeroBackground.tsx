export function HeroBackground() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 65% 70% at 80% 45%, rgba(202,131,42,0.18) 0%, rgba(238,177,73,0.06) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(45deg, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(-45deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
    </>
  );
}
