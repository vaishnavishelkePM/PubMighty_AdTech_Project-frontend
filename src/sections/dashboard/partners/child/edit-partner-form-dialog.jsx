'use client';

import axios from 'axios';
import { toast } from 'react-toastify';
import { getCookie } from 'minimal-shared';
import { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Slide,
  Button,
  Dialog,
  Divider,
  MenuItem,
  TextField,
  IconButton,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';

import PartnerAvatarSection from './partner-avatar-section';

const STATUS_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Pending ', value: 0 },
  { label: 'Active ', value: 1 },
  { label: 'Suspended ', value: 2 },
  { label: 'Disabled ', value: 3 },
];
// STATUS per controller: 1=active, 2=suspended, 3=disabled
const STATUS = [
  { label: 'Pending ', value: 0 },
  { label: 'Active ', value: 1 },
  { label: 'Suspended ', value: 2 },
  { label: 'Disabled ', value: 3 },
];

// twoFactorEnabled: 0=off, 1=app, 2=email
const TWO_FA = [
  { label: 'Off ', value: 0 },
  { label: 'App ', value: 1 },
  { label: 'Email ', value: 2 },
];

export default function EditPartnerFormDialog({ open, onClose, id, onSuccess, setDebug }) {
  const isEdit = !!id;

  const [saving, setSaving] = useState(false);
  const token = getCookie('session_key');

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    phoneNo: '',
    gender: '',
    country: '',
    language: 'en',
    status: 1,
    twoFactorEnabled: 0,
    avatar: '',
  });

  const [previewUrl, setPreviewUrl] = useState('');

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  useEffect(() => {
    async function load() {
      if (!open || !isEdit) return;
      try {
        const url = `${CONFIG.apiUrl}/v1/admin/partners/${id}`;
        const res = await axios.get(url, { headers, validateStatus: () => true });
        setDebug?.(url, res.status, res.data);

        if (res?.data?.success) {
          const d = res.data.data;

          const avatarFile = d.avatar ?? '';
          const avatarUrl = avatarFile ? `${CONFIG.assetsUrl}/upload/partner/${avatarFile}` : '';

          setForm({
            username: d.username ?? '',
            email: d.email ?? '',
            password: '',
            phoneNo: d.phoneNo ?? '',
            gender: d.gender ?? '',
            country: d.country ?? '',
            language: d.language ?? 'en',
            status: typeof d.status === 'number' ? d.status : 1,
            twoFactorEnabled: typeof d.twoFactorEnabled === 'number' ? d.twoFactorEnabled : 0,
            avatar: avatarFile,
          });

          setPreviewUrl(avatarUrl);
        } else {
          toast.error(res?.data?.msg || 'Failed to load partner');
        }
      } catch (e) {
        console.error('load partner error:', e);
        toast.error('Failed to load partner');
      }
    }
    load();
  }, [open, id, isEdit, headers, setDebug]);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const validate = () => {
    if (!form.username) return 'username is required';
    if (!form.email) return 'email is required';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const payload = {
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      phoneNo: form.phoneNo?.trim() || '',
      gender: form.gender?.trim() || '',
      country: form.country?.trim() || '',
      language: form.language?.trim() || 'en',
      status: Number(form.status),
      twoFactorEnabled: Number(form.twoFactorEnabled),
      // avatar via separate endpoint
    };

    try {
      setSaving(true);

      const url = `${CONFIG.apiUrl}/v1/admin/partners/${id}`;
      const res = await axios.put(url, payload, { headers, validateStatus: () => true });
      setDebug?.(url, res.status, res.data);

      if (res?.data?.success) {
        toast.success(res?.data?.msg || 'Partner updated');
        onSuccess?.();
      } else {
        toast.error(res?.data?.msg || 'Update failed');
      }
    } catch (e) {
      console.error('save error:', e);
      toast.error('Something went wrong while saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' }}
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
        <Iconify icon="mdi:calendar-plus" width={22} />
        Edit Partner
        <Box sx={{ flex: 1 }} />
        <IconButton
          aria-label="Close"
          onClick={() => onClose(false)}
          edge="end"
          sx={{
            ml: 1,
            '&:hover': { bgcolor: 'action.hover' },
          }}
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
        {/* Avatar upload + view (separate component) */}
        <PartnerAvatarSection
          partnerId={id}
          token={token}
          username={form.username}
          email={form.email}
          previewUrl={previewUrl}
          onPreviewChange={setPreviewUrl}
          onAvatarFilenameChange={(filename) => setForm((prev) => ({ ...prev, avatar: filename }))}
          setDebug={setDebug}
        />

        {/* FORM FIELDS */}
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
              label="Phone"
              fullWidth
              value={form.phoneNo}
              onChange={handleChange('phoneNo')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Gender"
              fullWidth
              value={form.gender}
              onChange={handleChange('gender')}
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
          position: { xs: 'sticky', sm: 'static' },
          bottom: 0,
          bgcolor: 'background.paper',
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          gap: 1,
        }}
      >
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Saving...' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
