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

// 0=off, 1=app, 2=email (matches Partner/Admin models: twoFactorEnabled)
export function TwoFAChip({ value }) {
  const num = Number(value);

  if (!Number.isNaN(num)) {
    const map = {
      0: { label: 'Off', color: 'default' },
      1: { label: 'App', color: 'success' },
      2: { label: 'Email', color: 'primary' },
    };

    const m = map[num] ?? map[0];
    return <Chip size="small" variant="outlined" label={m.label} color={m.color} />;
  }

  // Fallback for weird/legacy values
  if (value) {
    return <Chip size="small" variant="outlined" label="Enabled" color="primary" />;
  }

  return <Chip size="small" variant="outlined" label="Off" color="default" />;
}