import { useState } from 'react';
import { useNavigate } from 'react-router';
import { createTournament } from '@dpt/db';
import type { Venue, BracketFormat, TournamentType } from '@dpt/types';

const VENUES: Venue[] = ['Mansoura Padel Point', 'Ace Town Complex', 'Padel H'];

export function CreateTournamentPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState<Venue>(VENUES[0]);
  const [format, setFormat] = useState<BracketFormat>('QF');
  const [type, setType] = useState<TournamentType>('individual');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = await createTournament({ name, date, venue, bracket_format: format, tournament_type: type, status: 'upcoming' });
    navigate(`/tournaments/${t.id}`);
  }

  return (
    <div>
      <h1>Create Tournament</h1>
      <form onSubmit={submit}>
        <div><label>Name <input value={name} onChange={e => setName(e.target.value)} required /></label></div>
        <div><label>Date <input type="date" value={date} onChange={e => setDate(e.target.value)} required /></label></div>
        <div>
          <label>Venue
            <select value={venue} onChange={e => setVenue(e.target.value as Venue)}>
              {VENUES.map(v => <option key={v}>{v}</option>)}
            </select>
          </label>
        </div>
        <div>
          <label>Format
            <select value={format} onChange={e => setFormat(e.target.value as BracketFormat)}>
              <option value="QF">Quarter Finals (8)</option>
              <option value="R16">Round of 16 (16)</option>
            </select>
          </label>
        </div>
        <div>
          <label>Type
            <select value={type} onChange={e => setType(e.target.value as TournamentType)}>
              <option value="individual">Individual</option>
              <option value="team">Team</option>
            </select>
          </label>
        </div>
        <button type="submit">Create</button>
      </form>
    </div>
  );
}
