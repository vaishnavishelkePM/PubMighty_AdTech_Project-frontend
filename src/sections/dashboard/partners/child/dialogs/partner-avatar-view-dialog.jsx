'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

export default function PartnerAvatarPreviewDialog({ open, title, imageUrl, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent
        dividers
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.default',
        }}
      >
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={title}
            sx={{
              maxWidth: '100%',
              maxHeight: '70vh',
              borderRadius: 2,
              boxShadow: (theme) => theme.shadows[3],
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No image available
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
