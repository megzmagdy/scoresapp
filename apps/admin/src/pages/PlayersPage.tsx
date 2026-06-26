import { useEffect, useState } from 'react';
import { getPlayers, upsertPlayer, deletePlayer, takeRankSnapshot } from '@dpt/db';
import type { Player, Venue } from '@dpt/types';
import { getTier } from '@dpt/ui';
import { Button } from '../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react';

const VENUES: Venue[] = ['Mansoura Padel Point', 'Ace Town Complex', 'Padel H'];
const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";

type PlayerForm = { name: string; code: string; venue: Venue; total_points: number };

function nextCode(players: Player[]): string {
  const nums = players
    .map(p => p.code)
    .filter(Boolean)
    .map(c => parseInt((c as string).replace('DPT-', ''), 10))
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `DPT-${String(max + 1).padStart(2, '0')}`;
}

function PlayerDialog({
  initial, players, onSave, trigger,
}: {
  initial?: Player;
  players: Player[];
  onSave: (form: PlayerForm) => Promise<void>;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [venue, setVenue] = useState<Venue>(VENUES[0]);
  const [points, setPoints] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setCode(initial?.code ?? nextCode(players));
    setVenue((initial?.venue as Venue) ?? VENUES[0]);
    setPoints(initial?.total_points ?? 0);
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ name: name.trim(), code: code.trim(), venue, total_points: points });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-[#141414] border-white/10">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: ARCHIVO }} className="text-white">
            {initial ? 'Edit Player' : 'Add Player'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required className="bg-[#1a1a1a] border-white/10 text-white" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Code</Label>
            <Input value={code} onChange={e => setCode(e.target.value)} placeholder="DPT-01" className="bg-[#1a1a1a] border-white/10 text-white" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Venue</Label>
            <Select value={venue} onValueChange={v => setVenue(v as Venue)}>
              <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                {VENUES.map(v => (
                  <SelectItem key={v} value={v} className="text-white focus:bg-white/5">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Points</Label>
            <Input type="number" value={points} onChange={e => setPoints(Number(e.target.value))} className="bg-[#1a1a1a] border-white/10 text-white" />
          </div>
          <Button type="submit" disabled={saving} className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold mt-2">
            {saving ? 'Saving...' : initial ? 'Save Changes' : 'Add Player'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);

  useEffect(() => { getPlayers().then(setPlayers); }, []);

  const maxPts = players[0]?.total_points ?? 1;

  async function handleSave(existing: Player | undefined, form: PlayerForm) {
    const saved = await upsertPlayer({ id: existing?.id ?? crypto.randomUUID(), ...form });
    setPlayers(prev =>
      existing
        ? prev.map(p => p.id === saved.id ? saved : p)
        : [...prev, saved].sort((a, b) => b.total_points - a.total_points)
    );
    if (form.total_points !== existing?.total_points) {
      await takeRankSnapshot('auto');
    }
  }

  async function handleDelete(p: Player) {
    await deletePlayer(p.id);
    setPlayers(prev => prev.filter(x => x.id !== p.id));
    setDeleteTarget(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-dpt-gold mb-1" style={{ fontFamily: MONO }}>// Management</p>
          <h1 className="text-3xl font-black italic uppercase text-white" style={{ fontFamily: ARCHIVO }}>Players</h1>
        </div>
        <PlayerDialog
          players={players}
          onSave={form => handleSave(undefined, form)}
          trigger={
            <Button className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold gap-2">
              <Plus size={16} /> Add Player
            </Button>
          }
        />
      </div>

      <div className="rounded-xl border border-white/8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              {['Code', 'Name', 'Venue', 'Tier', 'Points', ''].map((h, i) => (
                <TableHead key={i} className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map(p => {
              const tier = getTier(p.total_points, maxPts);
              return (
                <TableRow key={p.id} className="border-white/5 hover:bg-white/2">
                  <TableCell className="text-[#555] text-xs" style={{ fontFamily: MONO }}>{p.code ?? '—'}</TableCell>
                  <TableCell className="text-white font-semibold">{p.name}</TableCell>
                  <TableCell className="text-[#666] text-sm">{p.venue ?? '—'}</TableCell>
                  <TableCell>
                    <Badge
                      style={{
                        background: `${tier.color}22`,
                        color: tier.color,
                        border: `1px solid ${tier.color}44`,
                        fontFamily: MONO,
                      }}
                      className="text-[10px] uppercase tracking-widest"
                    >
                      {tier.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-white font-bold" style={{ fontFamily: ARCHIVO }}>
                    {p.total_points.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#555] hover:text-white hover:bg-white/5">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                        <PlayerDialog
                          initial={p}
                          players={players}
                          onSave={form => handleSave(p, form)}
                          trigger={
                            <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-white focus:bg-white/5 gap-2 cursor-pointer">
                              <Pencil size={14} /> Edit
                            </DropdownMenuItem>
                          }
                        />
                        <DropdownMenuItem
                          onSelect={() => setDeleteTarget(p)}
                          className="text-red-400 focus:bg-red-500/10 focus:text-red-400 gap-2 cursor-pointer"
                        >
                          <Trash2 size={14} /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="bg-[#141414] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white" style={{ fontFamily: ARCHIVO }}>Delete Player</DialogTitle>
          </DialogHeader>
          <p className="text-[#888] text-sm">
            Remove <span className="text-white font-semibold">{deleteTarget?.name}</span> permanently? This cannot be undone.
          </p>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="border-white/15 text-white hover:bg-white/5">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
