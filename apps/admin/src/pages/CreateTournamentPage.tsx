import { useNavigate } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createTournament } from '@dpt/db';
import type { BracketFormat, TournamentType } from '@dpt/types';
import { Button } from '@dpt/ui/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { PageHeader, PageBody } from '~/components/PageHeader';

import { GOLD, MONO, VENUES } from '~/lib/theme';

const tournamentSchema = z.object({
  name: z.string().min(1, 'Tournament name is required'),
  date: z.string().min(1, 'Date is required'),
  venue: z.enum(['Mansoura Padel Point', 'Ace Town Complex', 'Padel H']),
  bracket_format: z.enum(['QF', 'R16', 'R32']),
  tournament_type: z.enum(['individual', 'team']),
});

type TournamentFormValues = z.infer<typeof tournamentSchema>;

function ToggleGroup<T extends string>({
  label, options, value, onChange, error,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>{label}</Label>
      <div className="flex gap-2">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="flex-1 py-2 rounded-lg text-sm font-bold border transition-all cursor-pointer"
            style={{
              background: value === o.value ? `${GOLD}18` : '#1a1a1a',
              border: value === o.value ? `1px solid ${GOLD}44` : '1px solid rgba(255,255,255,0.1)',
              color: value === o.value ? GOLD : '#666',
              fontFamily: MONO,
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

export function CreateTournamentPage() {
  const navigate = useNavigate();

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: '',
      date: '',
      venue: VENUES[0],
      bracket_format: 'QF',
      tournament_type: 'individual',
    },
  });

  async function onSubmit(data: TournamentFormValues) {
    const t = await createTournament({ ...data, status: 'upcoming' });
    navigate(`/tournaments/${t.id}`);
  }

  return (
    <>
      <PageHeader label="// New Event" title="Create Tournament" />
      <PageBody>
      <div className="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 bg-[#141414] border border-white/8 rounded-xl p-6">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Tournament Name</Label>
          <Input {...register('name')} placeholder="DPT Season 2 — Open" className="bg-[#1a1a1a] border-white/10 text-white" />
          {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Date</Label>
          <Input type="date" {...register('date')} className="bg-[#1a1a1a] border-white/10 text-white scheme-dark" />
          {errors.date && <p className="text-red-400 text-xs">{errors.date.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Venue</Label>
          <Controller
            name="venue"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  {VENUES.map(v => <SelectItem key={v} value={v} className="text-white focus:bg-white/5">{v}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
          {errors.venue && <p className="text-red-400 text-xs">{errors.venue.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="bracket_format"
            control={control}
            render={({ field }) => (
              <ToggleGroup<BracketFormat>
                label="Format"
                value={field.value}
                onChange={field.onChange}
                options={[{ value: 'QF', label: 'QF (8)' }, { value: 'R16', label: 'R16 (16)' }, { value: 'R32', label: 'R32 (32)' }]}
                error={errors.bracket_format?.message}
              />
            )}
          />
          <Controller
            name="tournament_type"
            control={control}
            render={({ field }) => (
              <ToggleGroup<TournamentType>
                label="Type"
                value={field.value}
                onChange={field.onChange}
                options={[{ value: 'individual', label: 'Individual' }, { value: 'team', label: 'Team' }]}
                error={errors.tournament_type?.message}
              />
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold mt-2 w-full">
          {isSubmitting ? 'Creating...' : 'Create Tournament'}
        </Button>
      </form>
      </div>
      </PageBody>
    </>
  );
}
