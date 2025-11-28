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
      maxWidth="md"
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

      <DialogContent
        dividers
        sx={{
          bgcolor: 'background.paper',
          maxHeight: 800,
          overflowY: 'auto',
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': { width: 8 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: (theme) => theme.palette.divider,
            borderRadius: 4,
          },
        }}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Joined on{' '}
            {selected.createdAt ? `${fDate(selected.createdAt)} ${fTime(selected.createdAt)}` : '—'}
          </Typography>

          <Divider flexItem />

          {/* Hidden file input for avatar upload */}
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onChangeFile} />

          {/* Top avatar */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar
                alt={selected.username}
                src={
                  selected.avatar
                    ? `${CONFIG.assetsUrl}/upload/partner/${selected.avatar}`
                    : undefined
                }
                sx={{ width: 106, height: 106, fontSize: 18, fontWeight: 600 }}
              >
                {(selected.username || '?').charAt(0).toUpperCase()}
              </Avatar>

              <Box>
                <Typography variant="body1" fontWeight={600}>
                  {selected.username}
                </Typography>

                {selected.email && (
                  <Typography variant="caption" color="text.secondary">
                    {selected.email}
                  </Typography>
                )}
              </Box>
            </Stack>

            {/* (Optional) You can add an "Upload" button here in future if needed */}
          </Stack>

          <Grid container spacing={2}>
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
                  secondary={selected.language ? <LanguageBadge code={selected.language} /> : '—'}
                />
                <Typography variant="overline" color="text.secondary">
                  Security
                </Typography>
                <ListItemText primary="2FA" secondary={twoFaLabel(selected.twoFactorEnabled)} />
                <ListItemText primary="Registered IP" secondary={selected.registeredIp || '—'} />
                <ListItemText
                  primary="Last Active"
                  secondary={
                    selected.lastActiveAt
                      ? `${fDate(selected.lastActiveAt)} ${fTime(selected.lastActiveAt)}`
                      : '—'
                  }
                />
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:pen-bold" />}
          onClick={handleEditClick}
          disabled={isUploading}
        >
          Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
