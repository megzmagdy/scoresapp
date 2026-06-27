import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getTeams, getPlayers, createTeam, deleteTeam } from '@dpt/db';
import type { Player, TeamWithPlayers } from '@dpt/types';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Trash2, Plus } from 'lucide-react';
import { PageHeader, PageBody } from '../components/PageHeader';

import { MONO, ARCHIVO } from '~/lib/theme';

const teamSchema = z.object({
  player1: z.string().min(1, 'Select player 1'),
  player2: z.string().min(1, 'Select player 2'),
}).refine(d => d.player1 !== d.player2, {
  message: 'Players must be different',
  path: ['player2'],
});

type TeamFormValues = z.infer<typeof teamSchema>;

export function TeamsPage() {
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getTeams().then(setTeams).catch(console.error);
    getPlayers().then(setPlayers).catch(console.error);
  }, []);

  const { control, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { player1: '', player2: '' },
  });

  const p1 = watch('player1');
  const p2 = watch('player2');
  const teamed = new Set(teams.flatMap(t => t.players.map(p => p.id)));
  const available = players.filter(p => !teamed.has(p.id));

  async function onSubmit(data: TeamFormValues) {
    const team = await createTeam([data.player1, data.player2]);
    const p1data = players.find(p => p.id === data.player1)!;
    const p2data = players.find(p => p.id === data.player2)!;
    setTeams(prev => [...prev, { ...team, players: [p1data, p2data] }]);
    reset();
    setOpen(false);
  }

  async function remove(id: string) {
    try {
      await deleteTeam(id);
      setTeams(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete team:', err);
    }
  }

  return (
    <>
      <PageHeader
        label="// Pairs"
        title="Teams"
        action={
          <Button onClick={() => setOpen(true)} className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold gap-2">
            <Plus size={16} /> Create Team
          </Button>
        }
      />
      <PageBody>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) reset(); }}>
          <DialogContent className="bg-[#141414] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white" style={{ fontFamily: ARCHIVO }}>Create Team</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Player 1</Label>
                <Controller
                  name="player1"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white"><SelectValue placeholder="Select Player 1" /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/10">
                        {available.filter(p => p.id !== p2).map(p => (
                          <SelectItem key={p.id} value={p.id} className="text-white focus:bg-white/5">{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.player1 && <p className="text-red-400 text-xs">{errors.player1.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Player 2</Label>
                <Controller
                  name="player2"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white"><SelectValue placeholder="Select Player 2" /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/10">
                        {available.filter(p => p.id !== p1).map(p => (
                          <SelectItem key={p.id} value={p.id} className="text-white focus:bg-white/5">{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.player2 && <p className="text-red-400 text-xs">{errors.player2.message}</p>}
              </div>
              <Button type="submit" disabled={isSubmitting} className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold mt-2">
                {isSubmitting ? 'Creating...' : 'Create Team'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="rounded-xl border border-white/8 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/8 hover:bg-transparent">
                <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>Players</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map(t => (
                <TableRow key={t.id} className="border-white/5 hover:bg-white/2">
                  <TableCell className="text-white font-semibold">{t.players.map(p => p.name).join(' & ')}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => remove(t.id)} className="h-8 w-8 text-[#555] hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PageBody>
    </>
  );
}
