'use client';

import axios from 'axios';
import { toast } from 'react-toastify';
import { useMemo, useState } from 'react';
import { getCookie } from 'minimal-shared';

import {
  Box,
  Grid,
  Dialog,
  Button,
  Divider,
  MenuItem,
  TextField,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';

import PartnerAvatarSection from './partner-avatar-section';

const STATUS = [
  { label: 'Pending ', value: 0 },
  { label: 'Active ', value: 1 },
  { label: 'Suspended ', value: 2 },
  { label: 'Disabled ', value: 3 },
];

const Gender = [
  { label: 'Male ', value: 'Male' },
  { label: 'Female ', value: 'Female' },
  { label: 'None ', value: 'None' },
];

const TWO_FA = [
  { label: 'Off', value: 0 },
  { label: 'App ', value: 1 },
  { label: 'Email ', value: 2 },
];

const INITIAL_FORM = {
  username: '',
  email: '',
  password: '',
  phoneNo: '',
  gender: '',
  country: '',
  language: 'en',
  status: 1,
  twoFactorEnabled: 0,
};

export default function AddPartnerFormDialog({ open, onClose, onSuccess, setDebug }) {
  const sessionKey = getCookie('session_key');

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionKey}`,
    }),
    [sessionKey]
  );

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const [previewUrl, setPreviewUrl] = useState('');
  const [avatarBlob, setAvatarBlob] = useState(null); // 🔹 store cropped image for upload after create

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const validate = () => {
    if (!form.username.trim()) return 'Username is required';
    if (!form.email.trim()) return 'Email is required';
    if (!form.password.trim()) return 'Password is required';
    return null;
  };

  const uploadAvatarForPartner = async (partnerId) => {
    if (!avatarBlob || !sessionKey) return;

    try {
      const formData = new FormData();
      formData.append('avatar', avatarBlob, 'avatar.jpg');

      const url = `${CONFIG.apiUrl}/v1/admin/partners/${partnerId}/avatar`;

      const res = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${sessionKey}`,
          'Content-Type': 'multipart/form-data',
        },
        validateStatus: () => true,
      });

      setDebug?.(url, res.status, res.data);

      if (!res.data?.success) {
        toast.error(res.data?.msg || res.data?.message || 'Avatar upload failed');
      }
    } catch (e) {
      console.error('Avatar upload error:', e);
      toast.error('Avatar upload failed');
    }
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    if (!sessionKey) {
      toast.error('Admin session expired. Please log in again.');
      return;
    }

    const payload = {
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password, // required on create
      phoneNo: form.phoneNo?.trim() || '',
      country: form.country?.trim() || '',
      language: form.language?.trim() || 'en',
      status: Number(form.status),
      twoFactorEnabled: Number(form.twoFactorEnabled),
      // gender as numeric or null to match Joi schema
      gender: form.gender === '' ? null : Number(form.gender),
    };

    try {
      setSaving(true);
      const url = `${CONFIG.apiUrl}/v1/admin/partners`;
      const res = await axios.post(url, payload, {
        headers,
        validateStatus: () => true,
      });

      setDebug?.(url, res.status, res.data);

      if (res?.data?.success) {
        const newPartnerId = res.data?.data?.id;

        // 🔹 Upload avatar (if cropped) after partner is created
        if (newPartnerId && avatarBlob) {
          await uploadAvatarForPartner(newPartnerId);
        }

        toast.success(res?.data?.msg || 'Partner created');
        onSuccess?.();

        // reset after success → so next Add is clean
        setForm(INITIAL_FORM);
        setPreviewUrl('');
        setAvatarBlob(null);
      } else {
        toast.error(res?.data?.msg || 'Create failed');
      }
    } catch (e) {
      console.error('AddPartner save error:', e);
      toast.error('Something went wrong while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onClose?.();
    // optional: clear state on close too
    // setForm(INITIAL_FORM);
    // setPreviewUrl('');
    // setAvatarBlob(null);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: (theme) => ({
          borderRadius: { xs: 2, sm: 3 },
          overflow: 'hidden',
          boxShadow: theme.shadows[24],
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
        }),
      }}
    >
      <DialogTitle
        sx={{
          py: 2,
          px: 3,
          typography: 'h6',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Iconify icon="mdi:account-plus" width={22} />
        Add Partner
        <Box sx={{ flex: 1 }} />
        <IconButton
          aria-label="Close"
          onClick={handleClose}
          edge="end"
          sx={{ ml: 1, '&:hover': { bgcolor: 'action.hover' } }}
        >
          <Iconify icon="mdi:close" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent
        dividers
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 2.5 },
          bgcolor: 'background.default',
        }}
      >
        <PartnerAvatarSection
          // no partnerId here → ADD MODE
          token={sessionKey}
          username={form.username}
          email={form.email}
          previewUrl={previewUrl}
          onPreviewChange={setPreviewUrl}
          onAvatarFilenameChange={() => {}}
          onCroppedBlobChange={setAvatarBlob}
          setDebug={setDebug}
        />

        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Username"
              fullWidth
              value={form.username}
              onChange={handleChange('username')}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={form.email}
              onChange={handleChange('email')}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={form.password}
              onChange={handleChange('password')}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Phone"
              fullWidth
              value={form.phoneNo}
              onChange={handleChange('phoneNo')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Country"
              fullWidth
              value={form.country}
              onChange={handleChange('country')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Language"
              fullWidth
              value={form.language}
              onChange={handleChange('language')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Gender"
              fullWidth
              value={form.gender}
              onChange={handleChange('gender')}
              InputLabelProps={{ shrink: true }}
            >
              {Gender.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Status"
              fullWidth
              value={form.status}
              onChange={handleChange('status')}
              InputLabelProps={{ shrink: true }}
            >
              {STATUS.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="2FA"
              fullWidth
              value={form.twoFactorEnabled}
              onChange={handleChange('twoFactorEnabled')}
              InputLabelProps={{ shrink: true }}
            >
              {TWO_FA.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          bgcolor: 'background.paper',
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          gap: 1,
        }}
      >
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Saving...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
