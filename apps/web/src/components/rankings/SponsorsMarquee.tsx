import { Marquee, MarqueeContent, MarqueeFade, MarqueeItem } from '@dpt/ui/components/ui/marquee';

const SPONSORS = [
  { src: '/bonelli_White.png', alt: 'Bonelli', href: 'https://bonellisports.com/', width: 256, height: 256 },
  { src: '/elsaba_white.png', alt: 'El Saba', href: 'https://www.elsaba-group.com/', width: 256, height: 135 },
  { src: '/TMC.png', alt: 'TMC', href: 'https://tmc.eg/', width: 256, height: 144 },
  { src: '/jnya.png', alt: 'JNYA', href: 'https://jnyaa.com/', width: 256, height: 256 },
];

export function SponsorsMarquee() {
  return (
    <section className="w-full bg-black border-b border-[#E8B53A]/20 py-3">
      <Marquee>
        <MarqueeFade side="left" className="from-black" />
        <MarqueeContent speed={35}>
          {SPONSORS.map((sponsor) => (
            <MarqueeItem key={sponsor.alt}>
              <a href={sponsor.href} target="_blank" rel="noopener noreferrer">
                <img
                  src={sponsor.src}
                  alt={sponsor.alt}
                  width={sponsor.width}
                  height={sponsor.height}
                  className="h-12 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                />
              </a>
            </MarqueeItem>
          ))}
        </MarqueeContent>
        <MarqueeFade side="right" className="from-black" />
      </Marquee>
    </section>
  );
}
