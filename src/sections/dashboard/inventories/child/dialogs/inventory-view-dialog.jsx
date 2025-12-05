'use client';

import { useRef } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Slide from '@mui/material/Slide';

import { Iconify } from 'src/components/iconify';
import { TypeChip, StatusChip, PartnerStatusChip, AdsTxtChip } from 'src/components/chip/inventory-chip/inventory-chip';
import { CONFIG } from 'src/global-config';
import { fDate, fTime } from 'src/utils/format-time';

// Local helper – same as your Labeled component
function Labeled({ label, children }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="baseline">
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
        {label}
      </Typography>
      <Typography variant="body2">{children}</Typography>
    </Stack>
  );
}

// Transition (optional, same as your Dialog in view)
const Transition = Slide;

// Props:
// open: boolean
// selected: inventory object
// onClose: () => void
// onChangeLogoFile?: (file: File, selected: any) => Promise<void> | void
export default function InventoryDetailsDialog({
  open,
  selected,
  onClose,
  onChangeLogoFile,
}) {
  const fileInputRef = useRef(null);

  const handleClickLogo = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selected) return;

    if (onChangeLogoFile) {
      await onChangeLogoFile(file, selected);
    }

    // reset input so same file can be picked again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const logoSrc =
  selected?.logo
    ? selected.logo.startsWith('http')
      ? selected.logo // already a full URL
      : `${CONFIG.assetsUrl}/upload/inventory/${selected.logo}` // stored filename
    : undefined;

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      TransitionProps={{ direction: 'up' }}
      PaperProps={{
        sx: (theme) => ({
          borderRadius: { xs: 2, sm: 3 },
          overflow: 'hidden',
          boxShadow: theme.shadows[24],
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
        }),
      }}
    >
      {/* HEADER */}
      <DialogTitle
        sx={{
          py: 2,
          px: 3,
        
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.background.default
              : theme.palette.grey[100],
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Iconify icon="solar:widget-4-bold-duotone" width={22} />
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6">Inventory {selected?.id || '—'}</Typography>
          {!!selected?.name && (
            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 260 }}>
              {selected.name}
            </Typography>
          )}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {!!selected && (
          <Stack direction="row" spacing={1} alignItems="center">
            <TypeChip value={selected.type} />
            {typeof selected.status !== 'undefined' && <StatusChip value={selected.status} />}
          </Stack>
        )}
      </DialogTitle>

      {/* CONTENT */}
      <DialogContent
        dividers
        sx={{
          bgcolor: 'background.paper',
          maxHeight: 800,
          mt:1,
          overflowY: 'auto',
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': { width: 8 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: (theme) => theme.palette.divider,
            borderRadius: 4,
          },
        }}
      >
        {!!selected && (
          <Stack spacing={3}>
            {/* Hidden input for logo change */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />

            {/* HERO CARD: Logo + quick info */}
            <Box
              sx={(theme) => ({
                p: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.background.default
                    : theme.palette.action.hover,
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'auto',
                  sm: 'auto 1fr',
                },
                gap: 2.5,
                alignItems: 'center',
              })}
            >
              {/* Logo */}
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                
                <Avatar
                alt={selected.name || `Inventory ${selected.id}`}
                src={logoSrc}
                sx={(theme) => ({
                  width: 96,
                  height: 96,
                  fontSize: 26,
                  fontWeight: 700,
                  border: `2px solid ${theme.palette.background.paper}`,
                  boxShadow: theme.shadows[4],
                  cursor: onChangeLogoFile ? 'pointer' : 'default',
                  bgcolor: theme.palette.background.paper,
                })}
              >
                {(selected.name || 'I').charAt(0).toUpperCase()}
              </Avatar>


                
              </Box>

              {/* Right side summary */}
              <Stack spacing={1} sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={600} noWrap>
                  {selected.name || 'Untitled inventory'}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  ID: {selected.id} · Type: {selected.type || '—'}
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                  <StatusChip value={selected.status} />
                  <PartnerStatusChip value={selected.partnerStatus} />
                  <AdsTxtChip value={selected.adsTxtStatus} />
                </Stack>

                {selected.url && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <Box
                      component="a"
                      href={selected.url}
                      target="_blank"
                      rel="noreferrer"
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'underline',
                        wordBreak: 'break-all',
                      }}
                    >
                      {selected.url}
                    </Box>
                  </Typography>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Updated on {selected.updatedAt ? fDate(selected.updatedAt) : '—'}
                </Typography>
              </Stack>
            </Box>

            {/* MAIN GRID SECTIONS */}
            <Grid container spacing={2.5}>
              {/* Overview */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={(theme) => ({
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                  })}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Overview
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Stack spacing={1.1}>
                    <Labeled label="Inventory ID">{selected.id}</Labeled>
                    <Labeled label="Name">{selected.name || '—'}</Labeled>
                    <Labeled label="Type">
                      <TypeChip value={selected.type} />
                    </Labeled>
                    <Labeled label="Package name">{selected.packageName || '—'}</Labeled>
                    <Labeled label="Description">{selected.description || '—'}</Labeled>
                  </Stack>
                </Box>
              </Grid>

              {/* Status & Deletion */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={(theme) => ({
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                  })}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Status
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Stack spacing={1.1}>
                    <Labeled label="Inventory status">
                      <StatusChip value={selected.status} />
                    </Labeled>

                    <Labeled label="Partner status">
                      <PartnerStatusChip value={selected.partnerStatus} />
                    </Labeled>

                    <Labeled label="ads.txt status">
                      <AdsTxtChip value={selected.adsTxtStatus} />
                    </Labeled>

                    <Labeled label="Deleted">
                      {Number(selected.is_deleted) === 1 ? 'Yes' : 'No'}
                    </Labeled>
                  </Stack>
                </Box>
              </Grid>

              {/* Publisher */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={(theme) => ({
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                  })}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Publisher
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Stack spacing={1.1}>
                    <Labeled label="Publisher ID">{selected.publisherId ?? '—'}</Labeled>

                    <Labeled label="Publisher name">
                      {selected.publisher?.username ||
                        selected.publisher?.email ||
                        (selected.publisherId ? `Publisher #${selected.publisherId}` : '—')}
                    </Labeled>

                    {selected.publisher?.email && (
                      <Labeled label="Publisher email">{selected.publisher.email}</Labeled>
                    )}
                  </Stack>
                </Box>
              </Grid>

              {/* Links */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={(theme) => ({
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                  })}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Links
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Stack spacing={1.1}>
                    <Labeled label="Inventory URL">
                      {selected.url ? (
                        <Box
                          component="a"
                          href={selected.url}
                          target="_blank"
                          rel="noreferrer"
                          sx={{
                            color: 'primary.main',
                            textDecoration: 'underline',
                            wordBreak: 'break-all',
                          }}
                        >
                          {selected.url}
                        </Box>
                      ) : (
                        '—'
                      )}
                    </Labeled>

                    <Labeled label="Developer website">
                      {selected.developerWeb ? (
                        <Box
                          component="a"
                          href={selected.developerWeb}
                          target="_blank"
                          rel="noreferrer"
                          sx={{
                            color: 'primary.main',
                            textDecoration: 'underline',
                            wordBreak: 'break-all',
                          }}
                        >
                          {selected.developerWeb}
                        </Box>
                      ) : (
                        '—'
                      )}
                    </Labeled>
                  </Stack>
                </Box>
              </Grid>

              {/* Timestamps */}
              <Grid item xs={12}>
                <Box
                  sx={(theme) => ({
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                  })}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Timestamps
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Stack spacing={1.1}>
                    <Labeled label="Created">
                      {selected.createdAt
                        ? `${fDate(selected.createdAt)} ${fTime(selected.createdAt)}`
                        : '—'}
                    </Labeled>
                    <Labeled label="Last updated">
                      {selected.updatedAt
                        ? `${fDate(selected.updatedAt)} ${fTime(selected.updatedAt)}`
                        : '—'}
                    </Labeled>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Stack>
        )}
      </DialogContent>

      {/* ACTIONS */}
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
