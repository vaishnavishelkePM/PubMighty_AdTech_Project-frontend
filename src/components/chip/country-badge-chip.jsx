'use client';

import ReactCountryFlag from 'react-country-flag';

import { Box, Stack, Typography } from '@mui/material';

import { countries } from 'src/assets/data'; // [{ code:'AD', label:'Andorra', phone:'376' }, ...]
import { useMemo } from 'react';

/**
 * CountryBadge
 *
 * Props:
 * - code: string            // ISO-2 code like "IN", "US"
 * - size?: number           // flag size in px (default 22)
 * - showPhone?: boolean     // show dialing code like (+91)
 * - sx?: SxProps            // extra MUI styles for the outer box
 */
export default function CountryBadge({ code, size = 22, showPhone = true, sx = {} }) {
  const upper = String(code || '').toUpperCase();

  // Find country meta by ISO-2 code
  const meta = useMemo(() => {
    if (!upper) return null;
    return (countries || []).find((c) => c?.code === upper) || null;
  }, [upper]);

  // Fallbacks
  const label = meta?.label || 'Unknown country';
  const phone = meta?.phone ? ` (+${meta.phone})` : '';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,

        ...sx,
      }}
    >
      {/* Left: Flag */}
      <Box
        sx={{
          width: size,
          height: size,
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          borderRadius: '0px',
        }}
      >
        {upper ? (
          <ReactCountryFlag
            countryCode={upper}
            svg
            title={upper}
            style={{ width: size, height: size, display: 'block', borderRadius: '0px' }}
          />
        ) : null}
      </Box>

      {/* Right: Name + Code (and optional phone) */}
      <Stack spacing={0} sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {upper}
          {showPhone && phone}
        </Typography>
      </Stack>
    </Box>
  );
}
