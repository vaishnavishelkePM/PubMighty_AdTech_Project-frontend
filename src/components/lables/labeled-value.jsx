'use client';

const { Box, Typography } = require("@mui/material");

export default function LabeledValue({ label, children }) {
  return (
    <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25, wordBreak: 'break-word', textTransform:"math-auto" }}>
        {children ?? '—'}
      </Typography>
    </Box>
  );
}