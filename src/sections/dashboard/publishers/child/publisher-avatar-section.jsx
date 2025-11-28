'use client';

import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { CONFIG } from 'src/global-config';

export default function PublisherAvatarSection({ row, size = 32 }) {
  const [open, setOpen] = useState(false);

  const hasAvatar = !!row?.avatar;

  const letter = useMemo(
    () => row?.username?.[0]?.toUpperCase?.() || '?',
    [row?.username]
  );

  const title = useMemo(
    () =>
      row?.username ||
      row?.email ||
      (row?.id ? `Publisher #${row.id}` : 'Publisher image'),
    [row?.username, row?.email, row?.id]
  );

  const imageUrl = useMemo(
    () =>
      hasAvatar
        ? `${CONFIG.assetsUrl}/upload/publishers/${row.avatar}`
        : '',
    [hasAvatar, row?.avatar]
  );

  const handleOpen = useCallback(() => {
    if (!hasAvatar) return;
    setOpen(true);
  }, [hasAvatar]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <Tooltip title={hasAvatar ? 'View image' : ''}>
        <Box
          sx={{
            display: 'inline-flex',
            cursor: hasAvatar ? 'pointer' : 'default',
          }}
          onClick={handleOpen}
        >
          <Avatar
            src={imageUrl || undefined}
            sx={{ width: size, height: size, fontWeight: 600 }}
          >
            {!hasAvatar && letter}
          </Avatar>
        </Box>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent
          dividers
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'background.default',
          }}
        >
          {imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt={title}
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: 2,
                boxShadow: (theme) => theme.shadows[3],
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No image available
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
