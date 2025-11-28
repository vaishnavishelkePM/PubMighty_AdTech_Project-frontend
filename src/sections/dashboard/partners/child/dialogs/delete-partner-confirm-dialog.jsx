'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

export default function DeletePartnerConfirmDialog({ open, deleting, onCancel, onConfirm }) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>Delete Partner</DialogTitle>
      <DialogContent>Are you sure you want to delete this partner?</DialogContent>
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
