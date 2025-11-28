'use client';

import * as React from 'react';

import {
  Box,
  Grid,
  Stack,
  Slide,
  Avatar,
  Button,
  Dialog,
  Divider,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { fDate, fTime } from 'src/utils/format-time';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';
import {
  TypeChip,
  StatusChip,
  AdsTxtChip,
  PartnerStatusChip,
} from 'src/components/chip/inventory-chip/inventory-chip';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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

export default function InventoryViewDialog({ open, selected, onClose, onEdit }) {
  const publisherTitle =
    selected?.publisher?.username ||
    selected?.publisher?.email ||
    (selected?.publisherId ? `Publisher #${selected.publisherId}` : '—');

  const publisherAvatar = selected?.publisher?.avatar
    ? `${CONFIG.assetsUrl}/upload/publishers/${selected.publisher.avatar}`
    : undefined;

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
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
      <DialogTitle
        sx={{
          py: 2,
          px: 3,
          typography: 'h6',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Iconify icon="mdi:calendar-plus" width={22} />
        {selected?.id ? `Inventory #${selected.id}` : 'Inventory'}
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
        {!!selected && (
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Updated on {selected.updatedAt ? fDate(selected.updatedAt) : '—'}
            </Typography>

            <Divider flexItem />

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 3 }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  alt={publisherTitle}
                  src={publisherAvatar}
                  sx={{ width: 96, height: 96, fontSize: 20, fontWeight: 600 }}
                >
                  {(publisherTitle || 'P').charAt(0).toUpperCase()}
                </Avatar>

                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {publisherTitle}
                  </Typography>

                  {selected.publisher?.email && (
                    <Typography variant="caption" color="text.secondary">
                      {selected.publisher.email}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="overline" color="text.secondary">
                  Identity
                </Typography>
                <Stack spacing={1.25} sx={{ mt: 0.5 }}>
                  <Labeled label="ID">{selected.id}</Labeled>
                  <Labeled label="Name">{selected.name || '—'}</Labeled>
                  <Labeled label="Type">
                    <TypeChip value={selected.type} />
                  </Labeled>
                  <Labeled label="URL">
                    {selected.url ? (
                      <Box
                        component="a"
                        href={selected.url}
                        target="_blank"
                        rel="noreferrer"
                        sx={{ color: 'primary.main', textDecoration: 'underline' }}
                      >
                        {selected.url}
                      </Box>
                    ) : (
                      '—'
                    )}
                  </Labeled>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="overline" color="text.secondary">
                  Status
                </Typography>
                <Stack spacing={1.25} sx={{ mt: 0.5 }}>
                  <Labeled label="Inventory">
                    <StatusChip value={selected.status} />
                  </Labeled>
                  <Labeled label="Partner">
                    <PartnerStatusChip value={selected.partnerStatus} />
                  </Labeled>
                  <Labeled label="ads.txt">
                    <AdsTxtChip value={selected.adsTxtStatus} />
                  </Labeled>
                  <Labeled label="Publisher ID">{selected.publisherId ?? '—'}</Labeled>
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="overline" color="text.secondary">
                  Timestamps
                </Typography>
                <Stack spacing={1.25} sx={{ mt: 0.5 }}>
                  <Labeled label="Created">
                    {selected.createdAt
                      ? `${fDate(selected.createdAt)} ${fTime(selected.createdAt)}`
                      : '—'}
                  </Labeled>
                  <Labeled label="Updated">
                    {selected.updatedAt
                      ? `${fDate(selected.updatedAt)} ${fTime(selected.updatedAt)}`
                      : '—'}
                  </Labeled>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:pen-bold" />}
          onClick={() => selected?.id && onEdit(selected.id)}
        >
          Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
