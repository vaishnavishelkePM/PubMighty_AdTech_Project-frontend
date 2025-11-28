'use client';

import React from 'react';

import { Dialog, Button, DialogTitle, DialogContent, DialogActions } from '@mui/material';

export default function DeleteInventoryDialog({ open, deleting, onCancel, onConfirm }) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>Delete Inventory</DialogTitle>
      <DialogContent>Are you sure you want to delete this inventory?</DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={deleting}>
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
