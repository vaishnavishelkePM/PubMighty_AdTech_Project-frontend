'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { fDate, fTime } from 'src/utils/format-time';
import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';
import LanguageBadge from 'src/components/chip/country-language';
import CountryBadge from 'src/components/chip/country-badge-chip';
import { twoFaLabel, StatusChip } from 'src/components/chip/partner-chip/partner-chip';

export default function PartnerViewDialog({
  open,
  selected,
  onClose,
  onEdit,
  fileInputRef,
  onChangeFile,
  isUploading,
}) {
  if (!selected) {
    return null;
  }

  const handleEditClick = () => {
    if (onEdit && selected?.id) {
      onEdit(selected.id);
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm" // match the style of the first (publisher) dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Iconify icon="mdi:handshake-outline" />
        Partner #{selected?.id}
        <Box sx={{ flexGrow: 1 }} />
        {typeof selected?.status !== 'undefined' && <StatusChip value={selected?.status} />}
      </DialogTitle>

      <DialogContent dividers>
        {/* Hidden file input for avatar upload */}
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onChangeFile} />

        <Stack spacing={2}>
          {/* Top: avatar + basic info (same style pattern as publisher dialog) */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              alt={selected.username}
              src={
                selected.avatar
                  ? `${CONFIG.assetsUrl}/upload/partner/${selected.avatar}`
                  : undefined
              }
              sx={{ width: 64, height: 64, fontWeight: 700 }}
            >
              {(selected.username || '?').charAt(0).toUpperCase()}
            </Avatar>

            <Box>
              <Typography variant="h6">{selected.username || '—'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selected.email || '—'}
              </Typography>
            </Box>
          </Stack>

          <Divider />

          {/* Details grid */}
          <Grid container spacing={1.5}>
            {/* Left column: personal details */}
            <Grid item xs={12} sm={6}>
              <Stack spacing={1.25} sx={{ mt: 0.5 }}>
                <ListItemText primary="First Name" secondary={selected.firstName || '—'} />
                <ListItemText primary="Last Name" secondary={selected.lastName || '—'} />
                <ListItemText primary="Username" secondary={selected.username || '—'} />
                <ListItemText primary="Email" secondary={selected.email || '—'} />
                <ListItemText primary="Phone" secondary={selected.phoneNo || '—'} />
                <ListItemText primary="Gender" secondary={selected.gender || '—'} />
              </Stack>
            </Grid>

            {/* Right column: geo, security & activity */}
            <Grid item xs={12} sm={6}>
              <Stack spacing={1.25} sx={{ mt: 0.5 }}>
                <ListItemText
                  primary="Country"
                  secondary={
                    selected.country ? (
                      <CountryBadge code={selected.country} size={25} showPhone={false} />
                    ) : (
                      '—'
                    )
                  }
                />

                <ListItemText
                  primary="Language"
                  secondary={
                    selected.language ? <LanguageBadge code={selected.language} /> : '—'
                  }
                />

                <ListItemText
                  primary="2FA"
                  secondary={twoFaLabel(selected.twoFactorEnabled)}
                />

                <ListItemText
                  primary="Registered IP"
                  secondary={selected.registeredIp || '—'}
                />

                <ListItemText
                  primary="Last Active"
                  secondary={
                    selected.lastActiveAt
                      ? `${fDate(selected.lastActiveAt)} ${fTime(selected.lastActiveAt)}`
                      : '—'
                  }
                />

                {/* <ListItemText
                  primary="Created"
                  secondary={
                    selected.createdAt
                      ? `${fDate(selected.createdAt)} ${fTime(selected.createdAt)}`
                      : '—'
                  }
                />

                <ListItemText
                  primary="Updated"
                  secondary={
                    selected.updatedAt
                      ? `${fDate(selected.updatedAt)} ${fTime(selected.updatedAt)}`
                      : '—'
                  }
                /> */}
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
      
      </DialogActions>
    </Dialog>
  );
}
