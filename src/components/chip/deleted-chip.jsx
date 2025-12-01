import { Chip } from '@mui/material';

export function DeletedChip({ value }) {
  const isDeleted = Number(value) === 1;

  return (
    <Chip
      size="small"
      label={isDeleted ? 'true' : 'false'}
      sx={{
        fontWeight: 600,
        color: '#fff',
        bgcolor: isDeleted ? 'error.main' : 'success.main',
        textTransform: 'uppercase',
      }}
    />
  );
}
