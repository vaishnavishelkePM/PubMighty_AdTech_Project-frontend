'use client';

import React from 'react';
import { Chip, Stack } from '@mui/material';
import { Iconify } from 'src/components/iconify';

// -------------------------
// STATUS CHIP (0/1/2)
// Pending / Approved / Rejected
// -------------------------
export function StatusChip({ value, iconOnly = false }) {
  const status = Number(value);

  let color = 'warning';
  let icon = 'solar:clock-circle-bold';
  let labelText = 'Pending';

  switch (status) {
    case 1: // approved
      color = 'success';
      icon = 'solar:check-circle-bold';
      labelText = 'Approved';
      break;
    case 2: // rejected
      color = 'error';
      icon = 'solar:close-circle-bold';
      labelText = 'Rejected';
      break;
    case 0:
    default:
      // keep defaults → Pending
      break;
  }

  // LIST VIEW → iconOnly = true (only logo)
  if (iconOnly) {
    return (
      <Chip
        size="small"
        variant="outlined"
        color={color}
        sx={{
          border: 'none',
          boxShadow: 'none',
          p: 0,
          minWidth: 'auto',
          '& .MuiChip-label': { p: 0 },
        }}
        label={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Iconify icon={icon} width={20} />
          </Stack>
        }
      />
    );
  }

  // TABLE VIEW → text label only
  return (
    <Chip
      size="small"
      variant="outlined"
      color={color}
      label={labelText}
    />
  );
}

// -------------------------
// SIMPLE TYPE CHIP
// -------------------------
export function TypeChip({ value }) {
  const v = String(value || '').toUpperCase();
  return <Chip size="small" variant="outlined" label={v || '—'} />;
}

// -------------------------
// PARTNER STATUS CHIP
// -------------------------
export function PartnerStatusChip({ value }) {
  switch (Number(value)) {
    case 1:
      return <Chip size="small" variant="outlined" color="primary" label="Active" />;
    case 0:
    default:
      return <Chip size="small" variant="outlined" color="default" label="Inactive" />;
  }
}

// -------------------------
// ADS.TXT CHIP (0/1/2/3)
// 0 = Invalid, 1 = Valid, 2 = Not Found, 3 = Mismatch
// -------------------------
export function AdsTxtChip({ value, iconOnly = false }) {
  const status = Number(value);

  let color = 'warning';
  let labelText = 'Invalid';
 
  switch (status) {
    case 1: // OK / Valid
      color = 'success';
      labelText = 'Valid';
     
      break;
    case 2: // Not found
      color = 'error';
      labelText = 'Not found';
     
      break;
    case 3: // Mismatch
      color = 'warning';
      labelText = 'Mismatch';
   
      break;
    case 0:
    default:
      // keep defaults → Invalid
      break;
  }

  if (iconOnly) {
  return (
  <Chip
    size="small"
    variant="filled"
    color={color}
    sx={{
      bgcolor: (theme) => `${theme.palette[color].main}100`,
      border: 'none',
      boxShadow: 'none',
      fontWeight: 800,
    }}
    label={
      <Stack direction="row" spacing={0.5} alignItems="center">
        {labelText}
      </Stack>
    }
  />
);

  }

  // TABLE VIEW → text only like your second file
  return (
    <Chip
      size="small"
      variant="outlined"
      color={color}
      label={
        <Stack direction="row" spacing={0.5} alignItems="center">
          {labelText}
        </Stack>
      }
    />
  );
}

// -------------------------
// TYPE + ICON CHIP (WEB / APP / OTT_CTV)
// -------------------------
export function TypeChips({ value }) {
  const type = String(value || '').toUpperCase();

  let icon = <Iconify icon="mdi:earth" />;
  let label = 'All';
  let color = 'default';

  switch (type) {
    case 'WEB':
      icon = <Iconify icon="mdi:web" />;
      label = 'WEB';
      color = 'info';
      break;
    case 'APP':
      icon = <Iconify icon="mdi:android" />;
      label = 'APP';
      color = 'success';
      break;
    case 'OTT_CTV':
      icon = <Iconify icon="mdi:television-classic" />;
      label = 'OTT / CTV';
      color = 'warning';
      break;
    default:
      break;
  }

  return (
    <Chip
      size="small"
      variant="outlined"
      color={color}
      label={
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {icon}
          {label}
        </Stack>
      }
    />
  );
}

const Chips = {
  StatusChip,
  TypeChip,
  PartnerStatusChip,
  AdsTxtChip,
  TypeChips,
};

export default Chips;
