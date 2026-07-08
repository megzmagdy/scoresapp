// import { useEffect, useState } from 'react';
// import { getTournaments } from '@dpt/db';
// import type { Tournament } from '@dpt/types';

import { HeroBackground } from '~/components/home/HeroBackground';
import { HeroContent } from '~/components/home/HeroContent';
import { HeroEmblem } from '~/components/home/HeroEmblem';
import { StatsBar } from '~/components/home/StatsBar';
import { AnnouncementsSection } from '~/components/home/AnnouncementsSection';
// import { UpcomingSection } from '~/components/home/UpcomingSection';
import { RewardsSection } from '~/components/home/RewardsSection';
import { RulesSection } from '~/components/home/RulesSection';
import { SponsorsSection } from '~/components/home/SponsorsSection';
import { HomeFooter } from '~/components/home/HomeFooter';

export function HomePage() {
  // const [tournaments, setTournaments] = useState<Tournament[]>([]);

  // useEffect(() => {
  //   getTournaments().then(setTournaments);
  // }, []);

  return (
    <div style={{ background: '#000', minHeight: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <section
        className="relative flex flex-col"
        style={{ minHeight: 'calc(100vh - 64px)' }}
      >
        <HeroBackground />

        <div className="relative flex-1 container w-full mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 pt-16 pb-10 lg:pt-16 lg:pb-16 min-h-[calc(100vh-130px)]">
            <HeroContent />
            <HeroEmblem />
          </div>
        </div>

        <StatsBar />
      </section>
      <SponsorsSection />
      <AnnouncementsSection />
      {/* <UpcomingSection tournaments={tournaments} /> */}
      <RewardsSection />
      <RulesSection />
      <HomeFooter />
    </div>
  );
}
