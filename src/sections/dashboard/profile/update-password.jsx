'use client';

import axios from 'axios';
import { toast } from 'react-toastify';
import { useMemo, useState } from 'react';
import { getCookie } from 'minimal-shared';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { CONFIG } from 'src/global-config';
import { useAppContext } from 'src/contexts/app-context';

import { Iconify } from 'src/components/iconify';

export default function UpdatePasswordDialog({ open, onClose }) {
  const { user } = useAppContext();

  const token = useMemo(() => getCookie('session_key'), []);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const email = user?.email || '';

  const handleReset = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleClose = () => {
    if (!loading) {
      handleReset();
      onClose?.();
    }
  };

  const handleSubmit = async () => {
    try {
      if (!token) {
        toast.error('Session expired. Please login again.');
        return;
      }

      if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
        toast.error('All password fields are required.');
        return;
      }

      if (newPassword.length < 8) {
        toast.error('New password must be at least 8 characters.');
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error('Confirm password must match new password.');
        return;
      }

      setLoading(true);

      const payload = {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      };

      const res = await axios.post(`${CONFIG.apiUrl}/v1/admin/profile/update-password`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.status === 401) {
        toast.error(res?.data?.msg || 'Unauthorized. Please login again.');
        return;
      }

      if (!res.data?.success) {
        toast.error(res.data?.msg || 'Failed to update password.');
        return;
      }

      toast.success(res.data?.msg || 'Password updated successfully.');
      handleReset();
      onClose?.(); // close dialog on success
    } catch (error) {
      console.error('Update password error:', error);
      toast.error(error?.response?.data?.msg || error.message || 'Unable to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 22 }}>Update Password</DialogTitle>

      <DialogContent sx={{ pt: 1, pb: 3 }}>
        <Box sx={{ mt: 1 }}>
          <Stack spacing={3}>
            {/* Email (non-editable, big field) */}
            <TextField
              label="Email"
              value={email}
              fullWidth
              disabled
              InputProps={{
                sx: {
                  '& .MuiInputBase-input': {
                    py: 1.8,
                    fontSize: 15,
                  },
                },
              }}
            />

            {/* Old Password */}
            <TextField
              label="Old Password"
              type={showOld ? 'text' : 'password'}
              fullWidth
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowOld((prev) => !prev)} edge="end">
                    <Iconify icon={showOld ? 'mdi:eye-off' : 'mdi:eye'} />
                  </IconButton>
                ),
                sx: {
                  '& .MuiInputBase-input': {
                    py: 1.8,
                    fontSize: 15,
                  },
                },
              }}
            />

            {/* New Password */}
            <TextField
              label="New Password"
              type={showNew ? 'text' : 'password'}
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Use a strong password with at least 8 characters."
              FormHelperTextProps={{
                sx: { mt: 0.5, fontSize: 12 },
              }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowNew((prev) => !prev)} edge="end">
                    <Iconify icon={showNew ? 'mdi:eye-off' : 'mdi:eye'} />
                  </IconButton>
                ),
                sx: {
                  '& .MuiInputBase-input': {
                    py: 1.8,
                    fontSize: 15,
                  },
                },
              }}
            />

            {/* Confirm Password */}
            <TextField
              label="Confirm New Password"
              type={showConfirm ? 'text' : 'password'}
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowConfirm((prev) => !prev)} edge="end">
                    <Iconify icon={showConfirm ? 'mdi:eye-off' : 'mdi:eye'} />
                  </IconButton>
                ),
                sx: {
                  '& .MuiInputBase-input': {
                    py: 1.8,
                    fontSize: 15,
                  },
                },
              }}
            />
          </Stack>

          <Divider sx={{ mt: 4, mb: 3 }} />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              disabled={loading}
              onClick={handleClose}
              sx={{ minWidth: 150 }}
            >
              Close
            </Button>

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              sx={{ minWidth: 170 }}
            >
              {loading ? 'Updating…' : 'Update'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
