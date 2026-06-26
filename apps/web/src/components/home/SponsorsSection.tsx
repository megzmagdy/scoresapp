import { Marquee, MarqueeContent, MarqueeFade, MarqueeItem } from '@dpt/ui/components/ui/marquee';

const MONO = "'Source Code Pro', monospace";

const SPONSORS = [
  { src: '/bonelli_White.png', alt: 'Bonelli' },
  { src: '/elsaba_white.png', alt: 'El Saba' },
  { src: '/TMC.png', alt: 'TMC' },
  { src: '/jnya.png', alt: 'JNYA' },
];

export function SponsorsSection() {
  return (
    <section className="w-full bg-black border-t border-[#E8B53A]/20 py-6">
      <p
        className="text-[11px] px-6 sm:px-10 lg:px-16 xl:px-24 2xl:px-32 py-6 uppercase tracking-[0.2em] text-dpt-gold mb-2"
        style={{ fontFamily: MONO }}
      >
        // Our Sponsors
      </p>
      <Marquee>
        <MarqueeFade side="left" className="from-black" />
        <MarqueeContent speed={35}>
          {SPONSORS.map((sponsor) => (
            <MarqueeItem key={sponsor.alt}>
              <img
                src={sponsor.src}
                alt={sponsor.alt}
                className="h-32 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
              />
            </MarqueeItem>
          ))}
        </MarqueeContent>
        <MarqueeFade side="right" className="from-black" />
      </Marquee>
    </section>
  );
}
