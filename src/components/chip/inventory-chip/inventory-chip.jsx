'use client';

import React from 'react';

import { Chip, Stack } from '@mui/material';

import { Iconify } from 'src/components/iconify';

// 0/1/2 status
export function StatusChip({ value }) {
  switch (Number(value)) {
    case 1:
      return <Chip size="small" variant="outlined" color="success" label="Active" />;
    case 2:
      return <Chip size="small" variant="outlined" color="warning" label="Blocked" />;
    case 0:
    default:
      return <Chip size="small" variant="outlined" color="default" label="Inactive" />;
  }
}

export function TypeChip({ value }) {
  const v = String(value || '').toUpperCase();
  return <Chip size="small" variant="outlined" label={v || '—'} />;
}

export function PartnerStatusChip({ value }) {
  switch (Number(value)) {
    case 1:
      return <Chip size="small" variant="outlined" color="primary" label="Linked" />;
    case 2:
      return <Chip size="small" variant="outlined" color="warning" label="Paused" />;
    case 0:
    default:
      return <Chip size="small" variant="outlined" color="default" label="Unlinked" />;
  }
}

// ads.txt: 0=Unknown, 1=OK, 2=Missing, 3=Mismatch
export function AdsTxtChip({ value }) {
  switch (Number(value)) {
    case 1:
      return <Chip size="small" variant="outlined" color="success" label="OK" />;
    case 2:
      return <Chip size="small" variant="outlined" color="default" label="Missing" />;
    case 3:
      return <Chip size="small" variant="outlined" color="error" label="Mismatch" />;
    case 0:
    default:
      return <Chip size="small" variant="outlined" color="default" label="Unknown" />;
  }
}

// Typed with icon: WEB / APP / OTT_CTV / default
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
      // keep defaults
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
// module.exports = {
//   StatusChip,
//   TypeChip,
//   PartnerStatusChip,
//   AdsTxtChip,
//   TypeChips,
// };
