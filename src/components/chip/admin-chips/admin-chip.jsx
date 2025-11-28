'use client';

import Chip from '@mui/material/Chip';

// 0=pending, 1=active, 2=suspended, 3=disabled
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

// supports boolean or numeric (0/1/2)
export function TwoFAChip({ value }) {
  const num = Number(value);

  if (!Number.isNaN(num)) {
    const map = {
      0: { label: 'Disabled', color: 'default' },
      1: { label: 'Enabled', color: 'primary' },
      2: { label: 'Auth App', color: 'success' },
    };
    const m = map[num] ?? map[0];

    return <Chip size="small" variant="outlined" label={m.label} color={m.color} />;
  }

  if (value) {
    return <Chip size="small" variant="outlined" label="Enabled" color="primary" />;
  }

  return <Chip size="small" variant="outlined" label="Disabled" color="default" />;
}