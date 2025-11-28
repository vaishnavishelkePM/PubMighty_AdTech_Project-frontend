'use client';

import React from 'react';

import { Box, Dialog, DialogTitle, DialogContent } from '@mui/material';

export default function AvatarPreviewDialog({ open, title, imageUrl, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle>{title || 'Publisher image'}</DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 2,
        }}
      >
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={title || 'Avatar'}
            sx={{
              width: '100%',
              height: 'auto',
              borderRadius: 2,
            }}
          />
        ) : (
          'No image available'
        )}
      </DialogContent>
    </Dialog>
  );
}
