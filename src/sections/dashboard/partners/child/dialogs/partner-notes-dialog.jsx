'use client';

import axios from 'axios';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { fDate, fTime } from 'src/utils/format-time';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';
import { Editor } from 'src/components/editor/editor';
import AdminSelector from 'src/components/selectors/Admin1/admin-selector'; // ⬅️ NEW IMPORT

// partner: { id, username, ... }

export default function PartnerNotesDialog({ open, partner, headers, onClose }) {
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);

  const [noteText, setNoteText] = useState('');
  // store selected admin id as string
  const [noteAssignedTo, setNoteAssignedTo] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const resetNoteForm = () => {
    setNoteText('');
    setNoteAssignedTo('');
    setEditingNoteId(null);
  };

  // Fetch notes when dialog opens / partner changes
  useEffect(() => {
    const fetchNotes = async () => {
      if (!open || !partner?.id) {
        setNotes([]);
        resetNoteForm();
        setEditorOpen(false);
        return;
      }

      try {
        setNotesLoading(true);
        const url = `${CONFIG.apiUrl}/v1/admin/partners/${partner.id}/notes`;
        const resp = await axios.get(url, { headers, validateStatus: () => true });

        if (resp.data?.success) {
          setNotes(resp.data.data || []);
        } else {
          setNotes([]);
        }
      } catch (err) {
        console.error('fetchPartnerNotes error:', err);
        setNotes([]);
      } finally {
        setNotesLoading(false);
      }
    };

    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, partner?.id]);

  const handleOpenNewNote = () => {
    resetNoteForm();
    setEditorOpen(true);
  };

  const handleSaveNote = async () => {
    if (!partner?.id) return;

    const trimmed = noteText.trim();
    if (!trimmed) return;

    try {
      setNotesSaving(true);

      const assignedTo =
        noteAssignedTo && String(noteAssignedTo).trim()
          ? Number(String(noteAssignedTo).trim())
          : null;

      let url;
      let method;
      let payload;

      if (editingNoteId) {
        url = `${CONFIG.apiUrl}/v1/admin/partners/notes/${editingNoteId}`;
        method = 'put';
        payload = {
          note: trimmed,
          assignedTo,
        };
      } else {
        url = `${CONFIG.apiUrl}/v1/admin/partners/${partner.id}/notes`;
        method = 'post';
        payload = {
          partnerId: partner.id,
          note: trimmed,
          assignedTo,
        };
      }

      const resp = await axios[method](url, payload, {
        headers,
        validateStatus: () => true,
      });

      if (resp.data?.success) {
        const savedNote = resp.data.data;

        setNotes((prev) => {
          if (editingNoteId) {
            return prev.map((n) => (n.id === editingNoteId ? savedNote : n));
          }
          return [savedNote, ...prev];
        });

        resetNoteForm();
        setEditorOpen(false);
      }
    } catch (err) {
      console.error('handleSaveNote error:', err);
    } finally {
      setNotesSaving(false);
    }
  };

  const handleEditNoteClick = (note) => {
    setEditingNoteId(note.id);
    setNoteText(note.note || '');
    setNoteAssignedTo(
      typeof note.assignedTo !== 'undefined' && note.assignedTo !== null
        ? String(note.assignedTo)
        : ''
    );
    setEditorOpen(true);
  };

  const handleDeleteNote = async (note) => {
    if (!note?.id) return;

    try {
      const url = `${CONFIG.apiUrl}/v1/admin/partners/notes/${note.id}`;
      const resp = await axios.delete(url, {
        headers,
        validateStatus: () => true,
      });

      if (resp.data?.success) {
        setNotes((prev) => prev.filter((n) => n.id !== note.id));
        if (editingNoteId === note.id) {
          resetNoteForm();
          setEditorOpen(false);
        }
      }
    } catch (err) {
      console.error('handleDeleteNote error:', err);
    }
  };

  const handleClose = () => {
    onClose?.();
    setNotes([]);
    resetNoteForm();
    setEditorOpen(false);
  };

  const handleCloseEditor = () => {
    if (notesSaving) return;
    resetNoteForm();
    setEditorOpen(false);
  };

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const renderNotesList = () => {
    if (notesLoading) {
      return (
        <Typography variant="body2" color="text.secondary">
          Loading notes...
        </Typography>
      );
    }

    if (!sortedNotes.length) {
      return (
        <Typography variant="body2" color="text.secondary">
          No notes for this partner yet.
        </Typography>
      );
    }

    let lastDateLabel = '';

    return (
      <Stack spacing={1.5} sx={{ mt: 0.5 }}>
        {sortedNotes.map((note) => {
          const dateLabel = note.createdAt ? fDate(note.createdAt) : '';
          const isNewDate = dateLabel && dateLabel !== lastDateLabel;
          if (isNewDate) lastDateLabel = dateLabel;

          const writer = note.writer || note.assignee || null;
          const writerName =
            writer &&
            (writer.firstName || writer.lastName
              ? `${writer.firstName || ''} ${writer.lastName || ''}`.trim()
              : writer.username || `#${writer.id}`);

          const initial = (writerName || 'A').charAt(0).toUpperCase();

          const writerAvatarUrl = writer?.avatar
            ? `${CONFIG.assetsUrl}/upload/admin/${writer.avatar}`
            : undefined;

          let assigneeText = '';
          if (note.assignee) {
            const a = note.assignee;
            assigneeText =
              a.firstName || a.lastName
                ? `${a.firstName || ''} ${a.lastName || ''}`.trim()
                : a.username || `#${a.id}`;
          }

          return (
            <Box key={note.id}>
              {/* DATE CHIP LIKE WHATSAPP / INSTAGRAM DM */}
              {isNewDate && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.4,
                      borderRadius: 999,
                      fontSize: 12,
                      bgcolor: (theme) =>
                        theme.palette.mode === 'light'
                          ? 'rgba(145,158,171,0.16)'
                          : 'rgba(145,158,171,0.32)',
                      color: 'text.secondary',
                    }}
                  >
                    {dateLabel}
                  </Box>
                </Box>
              )}

              {/* MESSAGE ROW */}
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                {/* Left: avatar */}
                <Avatar
                  src={writerAvatarUrl}
                  alt={writerName || 'Admin'}
                  sx={{ width: 32, height: 32, fontSize: 14, fontWeight: 600, mt: 0.5 }}
                >
                  {!writerAvatarUrl && initial}
                </Avatar>

                {/* Bubble + actions */}
                <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ flex: 1 }}>
                  {/* Bubble */}
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'inline-block',
                      maxWidth: '100%',
                      bgcolor: (theme) =>
                        theme.palette.mode === 'light'
                          ? 'rgba(145, 158, 171, 0.12)'
                          : 'rgba(145, 158, 171, 0.16)',
                      borderRadius: 3,
                      px: 1.5,
                      py: 1.1,
                      boxShadow: (theme) =>
                        theme.palette.mode === 'light'
                          ? '0 4px 12px rgba(145,158,171,0.20)'
                          : '0 4px 12px rgba(0,0,0,0.60)',
                    }}
                  >
                    {/* Writer name */}
                    <Typography variant="subtitle2" sx={{ mb: 0.25, fontWeight: 600 }}>
                      {writerName || 'Admin'}
                    </Typography>

                    {/* Note content */}
                    <Box
                      sx={{
                        '& .tiptap-content': {
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontSize: 14,
                        },
                      }}
                    >
                      <div
                        className="tiptap-content"
                        dangerouslySetInnerHTML={{ __html: note.note || '' }}
                      />
                    </Box>

                    {/* Footer: @assignee + time at END OF NOTE, right side */}
                    <Box
                      sx={{
                        mt: 0.5,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 0.75,
                      }}
                    >
                      {assigneeText && (
                        <Typography
                          variant="caption"
                          sx={{ color: 'primary.main', fontWeight: 500 }}
                        >
                          @{assigneeText}
                        </Typography>
                      )}

                      {note.createdAt && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                          {fTime(note.createdAt)}
                        </Typography>
                      )}
                    </Box>

                    {note.updatedAt && note.updatedAt !== note.createdAt && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.25, textAlign: 'right', fontSize: 10 }}
                      >
                        edited
                      </Typography>
                    )}
                  </Box>

                  {/* Edit/Delete icons close to bubble */}
                  <Stack spacing={0.5} sx={{ mt: 0.25 }}>
                    <Tooltip title="Edit note">
                      <IconButton size="small" onClick={() => handleEditNoteClick(note)}>
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete note">
                      <IconButton size="small" color="error" onClick={() => handleDeleteNote(note)}>
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={undefined} // no backdrop close
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 5 } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="mdi:note-edit-outline" />
            <Typography variant="h6">Partner Notes</Typography>
            {partner && (
              <Typography variant="body2" color="text.secondary">
                {partner.username ? `— ${partner.username}` : `— Partner #${partner.id}`}
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            size="small"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={handleOpenNewNote}
            sx={{ textTransform: 'none', borderRadius: 999 }}
          >
            Add note
          </Button>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            maxHeight: 600,
            display: 'flex',
            flexDirection: 'column',
            '&::-webkit-scrollbar': { width: 8 },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: (theme) => theme.palette.divider,
              borderRadius: 4,
            },
          }}
        >
          <Box sx={{ flex: 1, overflowY: 'auto', pb: 2, pr: 0.5 }}>{renderNotesList()}</Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>


      <Dialog
        open={editorOpen}
        onClose={handleCloseEditor}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Typography variant="h6">{editingNoteId ? 'Edit note' : 'Add note'}</Typography>
          <IconButton onClick={handleCloseEditor} disabled={notesSaving}>
            <Iconify icon="mdi:close" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Note
          </Typography>
          <Editor
            value={noteText}
            onChange={setNoteText}
            editable={!notesSaving}
            fullItem
            placeholder={
              editingNoteId ? 'Update your note...' : 'Write an internal note for this partner...'
            }
          />

          {/* Assign to admin selector */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Assign to
            </Typography>
            <AdminSelector
              label="Assign to admin"
              placeholder="Type admin ID or username…"
              valueId={noteAssignedTo ? Number(noteAssignedTo) : undefined}
              onAdminSelect={(adminId, admin) => {
                setNoteAssignedTo(adminId ? String(adminId) : '');
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseEditor} disabled={notesSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveNote}
            disabled={notesSaving}
            startIcon={
              <Iconify icon={editingNoteId ? 'solar:pen-bold' : 'solar:add-circle-bold'} />
            }
          >
            {notesSaving
              ? editingNoteId
                ? 'Updating...'
                : 'Adding...'
              : editingNoteId
                ? 'Update note'
                : 'Save note'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
