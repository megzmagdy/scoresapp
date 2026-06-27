import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAnnouncements, upsertAnnouncement, deleteAnnouncement } from '@dpt/db';
import type { Announcement, AnnouncementType } from '@dpt/types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { PageHeader, PageBody } from '../components/PageHeader';

import { MONO, ARCHIVO } from '~/lib/theme';

const TYPE_COLORS: Record<AnnouncementType, string> = {
  general: '#60a5fa',
  tournament: '#E8B53A',
  rules: '#a78bfa',
  rewards: '#4ade80',
};

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['general', 'tournament', 'rules', 'rewards']),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

function AnnouncementDialog({ initial, onSave, trigger }: {
  initial?: Announcement;
  onSave: (form: AnnouncementFormValues) => Promise<void>;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', content: '', type: 'general' },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      title: initial?.title ?? '',
      content: initial?.content ?? '',
      type: initial?.type ?? 'general',
    });
  }, [open]);

  async function onSubmit(data: AnnouncementFormValues) {
    await onSave(data);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-[#141414] border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white" style={{ fontFamily: ARCHIVO }}>{initial ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Title</Label>
            <Input {...register('title')} className="bg-[#1a1a1a] border-white/10 text-white" />
            {errors.title && <p className="text-red-400 text-xs">{errors.title.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Content</Label>
            <Textarea {...register('content')} rows={4} className="bg-[#1a1a1a] border-white/10 text-white resize-none" />
            {errors.content && <p className="text-red-400 text-xs">{errors.content.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Type</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {(['general', 'tournament', 'rules', 'rewards'] as AnnouncementType[]).map(t => (
                      <SelectItem key={t} value={t} className="text-white focus:bg-white/5 capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold mt-2">
            {isSubmitting ? 'Saving...' : initial ? 'Save Changes' : 'Post Announcement'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  useEffect(() => { getAnnouncements().then(setAnnouncements).catch(console.error); }, []);

  async function handleSave(existing: Announcement | undefined, form: AnnouncementFormValues) {
    try {
      const a = await upsertAnnouncement({
        ...(existing ?? { id: crypto.randomUUID() }),
        ...form,
        published_at: existing?.published_at ?? new Date().toISOString(),
      });
      setAnnouncements(prev => existing ? prev.map(x => x.id === a.id ? a : x) : [a, ...prev]);
    } catch (err) {
      console.error('Failed to save announcement:', err);
    }
  }

  async function handleDelete(a: Announcement) {
    try {
      await deleteAnnouncement(a.id);
      setAnnouncements(prev => prev.filter(x => x.id !== a.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    }
  }

  return (
    <>
      <PageHeader
        label="// Comms"
        title="Announcements"
        action={
          <AnnouncementDialog
            onSave={form => handleSave(undefined, form)}
            trigger={
              <Button className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold gap-2">
                <Plus size={16} /> New Announcement
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
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>Title</TableHead>
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>Type</TableHead>
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>Published</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.map(a => {
              const c = TYPE_COLORS[a.type];
              return (
                <TableRow key={a.id} className="border-white/5 hover:bg-white/2">
                  <TableCell className="text-white font-semibold">{a.title}</TableCell>
                  <TableCell>
                    <Badge style={{ background: `${c}22`, color: c, border: `1px solid ${c}44`, fontFamily: MONO }} className="text-[10px] uppercase tracking-widest">
                      {a.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#555] text-sm" style={{ fontFamily: MONO }}>
                    {new Date(a.published_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#555] hover:text-white hover:bg-white/5">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                        <AnnouncementDialog
                          initial={a}
                          onSave={form => handleSave(a, form)}
                          trigger={
                            <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-white focus:bg-white/5 gap-2 cursor-pointer">
                              <Pencil size={14} /> Edit
                            </DropdownMenuItem>
                          }
                        />
                        <DropdownMenuItem onSelect={() => setDeleteTarget(a)} className="text-red-400 focus:bg-red-500/10 focus:text-red-400 gap-2 cursor-pointer">
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
            <DialogTitle className="text-white" style={{ fontFamily: ARCHIVO }}>Delete Announcement</DialogTitle>
          </DialogHeader>
          <p className="text-[#888] text-sm">Remove <span className="text-white font-semibold">"{deleteTarget?.title}"</span> permanently?</p>
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
