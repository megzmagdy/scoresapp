import { Link } from 'react-router';
import { getTournaments } from '@dpt/db';
import type { Tournament } from '@dpt/types';
import { useAsyncData } from '@dpt/ui';
import { Button } from '@dpt/ui/components/ui/button';
import { Badge } from '@dpt/ui/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Plus, ChevronRight } from 'lucide-react';
import { PageHeader, PageBody } from '~/components/PageHeader';

import { MONO, statusColor } from '~/lib/theme';

export function TournamentsPage() {
  const { data: tournaments } = useAsyncData(getTournaments, [] as Tournament[]);

  return (
    <>
      <PageHeader
        label="// Events"
        title="Tournaments"
        action={
          <Button asChild className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold gap-2">
            <Link to="/tournaments/new"><Plus size={16} /> Create Tournament</Link>
          </Button>
        }
      />
      <PageBody>
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              {['Name', 'Date', 'Venue', 'Format', 'Status', ''].map((h, i) => (
                <TableHead key={h || `col-${i}`} className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tournaments.map(t => {
              const sc = statusColor(t.status);
              return (
                <TableRow key={t.id} className="border-white/5 hover:bg-white/2">
                  <TableCell className="text-white font-semibold">{t.name}</TableCell>
                  <TableCell className="text-[#666] text-sm" style={{ fontFamily: MONO }}>{t.date}</TableCell>
                  <TableCell className="text-[#666] text-sm">{t.venue}</TableCell>
                  <TableCell>
                    <Badge style={{ background: 'rgba(255,255,255,0.04)', color: '#888', border: '1px solid rgba(255,255,255,0.1)', fontFamily: MONO }} className="text-[10px] uppercase tracking-widest">
                      {t.bracket_format}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge style={{ background: `${sc}22`, color: sc, border: `1px solid ${sc}44`, fontFamily: MONO }} className="text-[10px] tracking-widest capitalize">
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-dim hover:text-white hover:bg-white/5">
                      <Link to={`/tournaments/${t.id}`}><ChevronRight size={16} /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      </PageBody>
    </>
  );
}
