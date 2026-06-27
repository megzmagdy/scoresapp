import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getPlayers, upsertPlayer, deletePlayer, takeRankSnapshot } from '@dpt/db';
import type { Player } from '@dpt/types';
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
import { PageHeader, PageBody } from '../components/PageHeader';

import { MONO, ARCHIVO, VENUES } from '~/lib/theme';

const playerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  venue: z.enum(['Mansoura Padel Point', 'Ace Town Complex', 'Padel H']),
  total_points: z.number().int().min(0, 'Points must be 0 or more'),
});

type PlayerFormValues = z.infer<typeof playerSchema>;
type PlayerForm = PlayerFormValues;

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

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: { name: '', code: '', venue: VENUES[0], total_points: 0 },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: initial?.name ?? '',
      code: initial?.code ?? nextCode(players),
      venue: (initial?.venue as PlayerFormValues['venue']) ?? VENUES[0],
      total_points: initial?.total_points ?? 0,
    });
  }, [open]);

  async function onSubmit(data: PlayerFormValues) {
    await onSave(data);
    setOpen(false);
  }

  const venueValue = watch('venue');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-[#141414] border-white/10">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: ARCHIVO }} className="text-white">
            {initial ? 'Edit Player' : 'Add Player'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Name</Label>
            <Input {...register('name')} className="bg-[#1a1a1a] border-white/10 text-white" />
            {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Code</Label>
            <Input {...register('code')} placeholder="DPT-01" className="bg-[#1a1a1a] border-white/10 text-white" />
            {errors.code && <p className="text-red-400 text-xs">{errors.code.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Venue</Label>
            <Select value={venueValue} onValueChange={v => setValue('venue', v as PlayerFormValues['venue'], { shouldValidate: true })}>
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
            <Input type="number" {...register('total_points', { valueAsNumber: true })} className="bg-[#1a1a1a] border-white/10 text-white" />
            {errors.total_points && <p className="text-red-400 text-xs">{errors.total_points.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting} className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold mt-2">
            {isSubmitting ? 'Saving...' : initial ? 'Save Changes' : 'Add Player'}
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
    setPlayers(prev => {
      const next = existing
        ? prev.map(p => p.id === saved.id ? saved : p)
        : [...prev, saved];
      return next.sort((a, b) => b.total_points - a.total_points);
    });
    if (form.total_points !== existing?.total_points) {
      await takeRankSnapshot('auto');
    }
  }

  async function handleDelete(p: Player) {
    try {
      await deletePlayer(p.id);
      setPlayers(prev => prev.filter(x => x.id !== p.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete player:', err);
    }
  }

  return (
    <>
      <PageHeader
        label="// Management"
        title="Players"
        action={
          <PlayerDialog
            players={players}
            onSave={form => handleSave(undefined, form)}
            trigger={
              <Button className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold gap-2">
                <Plus size={16} /> Add Player
              </Button>
            }
          />
        }
      />
      <PageBody>
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
      </PageBody>
    </>
  );
}
