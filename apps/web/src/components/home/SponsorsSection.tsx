import { Marquee, MarqueeContent, MarqueeFade, MarqueeItem } from '@dpt/ui/components/ui/marquee';

const SPONSORS = [
  { src: '/bonelli_White.png', alt: 'Bonelli' },
  { src: '/elsaba_white.png', alt: 'El Saba' },
  { src: '/TMC.png', alt: 'TMC' },
  { src: '/jnya.png', alt: 'JNYA' },
];

export function SponsorsSection() {
  return (
    <section className="w-full bg-black border-t border-[#E8B53A]/20 py-6">
      <p className="text-center text-xs tracking-[0.2em] font-semibold text-[#E8B53A]/60 uppercase mb-4">
        Our Sponsors
      </p>
      <Marquee>
        <MarqueeFade side="left" />
        <MarqueeContent speed={35}>
          {SPONSORS.map((sponsor) => (
            <MarqueeItem key={sponsor.alt}>
              <img
                src={sponsor.src}
                alt={sponsor.alt}
                className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
              />
            </MarqueeItem>
          ))}
        </MarqueeContent>
        <MarqueeFade side="right" />
      </Marquee>
    </section>
  );
}
