
'use client';

import Chip from '@mui/material/Chip';

export function StatusChip({ value }) {
  const map = {
    0: { label: 'Pending', color: 'warning' },
    1: { label: 'Active', color: 'success' },
    2: { label: 'Suspended', color: 'error' },
    3: { label: 'Disabled', color: 'default' },
  };

  const m = map[Number(value)] || { label: 'Unknown', color: 'default' };

  return <Chip size="small" variant="outlined" label={m.label} color={m.color} />;
}
export function TwoFAChip({ value }) {
  const map = {
    0: { label: 'Disabled', color: 'default' },
    1: { label: 'Email', color: 'info' },
    2: { label: 'Auth App', color: 'success' },
  };

  const m = map[Number(value)] ?? map[0];

  return <Chip size="small" variant="outlined" label={m.label} color={m.color} />;
}
