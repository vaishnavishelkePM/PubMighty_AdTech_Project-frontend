'use client';

import React from 'react';

import { Chip, Stack } from '@mui/material';

import { Iconify } from 'src/components/iconify';

export function StatusChip({ value }) {
  switch (Number(value)) {
    case 1:
      return <Chip size="small" variant="outlined" color="success" label="Active" />;
    case 2:
      return <Chip size="small" variant="outlined" color="error" label="suspended" />;
    case 3:
      return <Chip size="small" variant="outlined" color="warning" label="Disabled" />;
    case 0:
    default:
      return <Chip size="small" variant="outlined" color="default" label="Pending" />;
  }
}

export function twoFaLabel(value) {
  // 0=off, 1=app, 2=email
  const v = Number(value);
  if (v === 1) return 'App';
  if (v === 2) return 'Email';
  return 'Off';
}

const Chips = {
  StatusChip,
  twoFaLabel,
};
export default Chips;
