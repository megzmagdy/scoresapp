import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getTournaments } from '@dpt/db';
import type { Tournament } from '@dpt/types';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, ChevronRight } from 'lucide-react';

const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";
const GOLD = '#E8B53A';

function statusColor(s: Tournament['status']) {
  if (s === 'upcoming') return '#60a5fa';
  if (s === 'ongoing') return GOLD;
  return '#4ade80';
}

export function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => { getTournaments().then(setTournaments).catch(console.error); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-dpt-gold mb-1" style={{ fontFamily: MONO }}>// Events</p>
          <h1 className="text-3xl font-black italic uppercase text-white" style={{ fontFamily: ARCHIVO }}>Tournaments</h1>
        </div>
        <Button asChild className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold gap-2">
          <Link to="/tournaments/new"><Plus size={16} /> Create Tournament</Link>
        </Button>
      </div>

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
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-[#555] hover:text-white hover:bg-white/5">
                      <Link to={`/tournaments/${t.id}`}><ChevronRight size={16} /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
