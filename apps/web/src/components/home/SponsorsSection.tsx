import { Marquee, MarqueeContent, MarqueeFade, MarqueeItem } from '@dpt/ui/components/ui/marquee';
import { SectionLabel } from '@dpt/ui';

const SPONSORS = [
  { src: '/bonelli_White.png', alt: 'Bonelli', href: 'https://bonellisports.com/' },
  { src: '/elsaba_white.png', alt: 'El Saba', href: 'https://www.elsaba-group.com/' },
  { src: '/TMC.png', alt: 'TMC', href: 'https://tmc.eg/' },
  { src: '/jnya.png', alt: 'JNYA', href: 'https://jnyaa.com/' },
];

export function SponsorsSection() {
  return (
    <section className="w-full bg-black border-t border-[#E8B53A]/20 py-6">
      <SectionLabel className="container py-6 mb-2">
        // Our Sponsors
      </SectionLabel>
      <Marquee>
        <MarqueeFade side="left" className="from-black" />
        <MarqueeContent speed={35}>
          {SPONSORS.map((sponsor) => (
            <MarqueeItem key={sponsor.alt}>
              <a href={sponsor.href} target="_blank" rel="noopener noreferrer">
                <img
                  src={sponsor.src}
                  alt={sponsor.alt}
                  className="h-32 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
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
