'use client';

import { useMemo } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import { languages } from 'src/assets/data/languages';
// [{ code: 'en', name: 'English', englishName: 'English', flag: '🇺🇸' }, ...]

/**
 * LanguageBadge
 * Props:
 * - code: string   // e.g. "en"
 * - sx?: SxProps
 */
export default function LanguageBadge({ code, sx = {} }) {
  const lower = String(code || '').toLowerCase();

  const meta = useMemo(() => {
    if (!lower) return null;
    return (languages || []).find((l) => l?.code === lower) || null;
  }, [lower]);

  const name = meta?.name || 'Unknown';
  const englishName = meta?.englishName || '';
  const subtitle = englishName ? `${englishName} • ${lower}` : lower;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ...sx }}>
      <Stack spacing={0} sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap>
          {name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {subtitle}
        </Typography>
      </Stack>
    </Box>
  );
}
