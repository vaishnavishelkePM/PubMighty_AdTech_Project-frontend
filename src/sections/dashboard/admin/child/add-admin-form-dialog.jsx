'use client';

import { z } from 'zod';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getCookie } from 'minimal-shared';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Grid,
  Stack,
  Slide,
  Dialog,
  Button,
  Select,
  Avatar,
  Divider,
  MenuItem,
  TextField,
  InputLabel,
  IconButton,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  FormHelperText,
  CircularProgress,
} from '@mui/material';

import { CONFIG } from 'src/global-config';
import { Iconify } from 'src/components/iconify';

// Role options -> must match backend
const ROLE_OPTIONS = [
  { label: 'Super Admin', value: 'superAdmin' },
  { label: 'Staff', value: 'staff' },
  { label: 'Payment Manager', value: 'paymentManager' },
  { label: 'Support', value: 'support' },
];

// 2FA options (same style as Partner)
const TWO_FA = [
  { label: 'Off', value: 0 },
  { label: 'App', value: 1 },
  { label: 'Email', value: 2 },
];

// Zod schema aligned with addAdmin + our 2FA dropdown
const Schema = z
  .object({
    username: z.string().trim().min(1, 'Username is required').max(150),

    email: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine((val) => !val || /\S+@\S+\.\S+/.test(val), 'Please enter a valid email address'),

    password: z.string().optional().or(z.literal('')),

    role: z.string().optional().or(z.literal('')),

    status: z.number({ invalid_type_error: 'Status is required' }).min(0).max(3),

    // single numeric 2FA selection (like partner twoFactorEnabled)
    two_fa_option: z.number().int().min(0).max(2).default(0),

    two_fa_secret: z.string().optional().or(z.literal('')),
    avatar: z.any().nullable().optional(),
  })

const defaultValues = {
  username: '',
  email: '',
  password: '',
  role: '',
  status: 1,
  two_fa_option: 0, // 0=Off, 1=App, 2=Email
  two_fa_secret: '',
  avatar: null,
};

export default function AddAdminFormDialog({ open, onClose, onSuccess }) {
  const token = getCookie('session_key');
  const isEdit = false; // ADD only

  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(Schema),
    defaultValues,
    mode: 'onBlur',
  });

  const avatarFile = watch('avatar');
  const twoFaOption = watch('two_fa_option'); // 0/1/2

  const errorText = (path) => errors?.[path]?.message || '';

  useEffect(() => {
    if (avatarFile instanceof File) {
      const url = URL.createObjectURL(avatarFile);
      setAvatarPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    if (!avatarFile) {
      setAvatarPreview(null);
    }
  }, [avatarFile]);

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
    setAvatarPreview(null);
  }, [open, reset]);

  const closeDialog = () => {
    reset(defaultValues);
    setAvatarPreview(null);
    onClose?.();
  };

  const onSubmit = async (values) => {
    try {
      if (!token) {
        toast.error('Session expired. Please login again.');
        return;
      }

      if (!isEdit && !values.password) {
        toast.error('Password is required for a new admin');
        return;
      }

      setLoading(true);

      const fd = new FormData();

      // username & email
      fd.append('username', values.username.trim());
      if (values.email) {
        fd.append('email', values.email.trim().toLowerCase());
      }

      // password
      if (values.password) {
        fd.append('password', values.password);
      }

      // role
      if (values.role) {
        fd.append('role', values.role);
      }

      // status
      if (typeof values.status === 'number') {
        fd.append('status', String(values.status));
      }

      // 2FA → backend now expects twoFactorEnabled (0/1/2)
      const opt = values.two_fa_option ?? 0;
      fd.append('twoFactorEnabled', String(opt));

      // avatar
      if (values.avatar instanceof File) {
        fd.append('avatar', values.avatar);
      }

      const url = `${CONFIG.apiUrl}/v1/admin/admins/add`;

      const res = await axios.post(url, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          // Let browser set multipart boundary
        },
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.status === 401) {
        toast.error(res?.data?.msg || 'Unauthorized. Please login again.');
        return;
      }

      if (!res.data?.success) {
        toast.error(res.data?.msg || 'Failed to save admin');
        return;
      }

      toast.success(res.data?.msg || 'Admin created.');
      onSuccess?.();
    } catch (err) {
      console.error('save admin error:', err);
      toast.error('Something went wrong while saving admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      fullWidth
      maxWidth="md"
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' }}
      PaperProps={{
        sx: (theme) => ({
          borderRadius: 3,
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
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 35,
            height: 35,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify icon="mdi:shield-account" width={28} />
        </Box>

        <Box>
          <Box sx={{ fontSize: 15, fontWeight: 600 }}>Add Admin</Box>
          <Box sx={{ fontSize: 12, color: 'text.secondary' }}>Create a new admin user</Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton
          aria-label="Close"
          onClick={closeDialog}
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
        {loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {/* Avatar */}
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={avatarPreview || undefined} sx={{ width: 86, height: 86 }}>
                  {!avatarPreview && (watch('username')?.[0]?.toUpperCase() || 'A')}
                </Avatar>

                <Controller
                  name="avatar"
                  control={control}
                  render={({ field }) => (
                    <Button
                      variant="outlined"
                      component="label"
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}
                    >
                      <Iconify icon="mdi:upload" width={20} />
                      {field.value instanceof File ? 'Change Avatar' : 'Upload Avatar'}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          field.onChange(file || null);
                        }}
                      />
                    </Button>
                  )}
                />
              </Stack>
            </Grid>

            {/* Username / Email / Password */}
            <Grid item xs={12} md={4}>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Username *"
                    error={!!errors.username}
                    helperText={errorText('username')}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email"
                    type="email"
                    error={!!errors.email}
                    helperText={errorText('email')}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="password"
                    label="Password *"
                    error={!!errors.password}
                    helperText={errorText('password')}
                  />
                )}
              />
            </Grid>

            {/* Role / Status / 2FA */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth error={!!errors.role}>
                <InputLabel>Role</InputLabel>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Role">
                      <MenuItem value="">
                        <em>Not set</em>
                      </MenuItem>
                      {ROLE_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.role && <FormHelperText>{errorText('role')}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth error={!!errors.status}>
                <InputLabel>Status</InputLabel>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Status"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      <MenuItem value={0}>Pending</MenuItem>
                      <MenuItem value={1}>Active</MenuItem>
                      <MenuItem value={2}>Suspended</MenuItem>
                      <MenuItem value={3}>Disabled</MenuItem>
                    </Select>
                  )}
                />
                {errors.status && <FormHelperText>{errorText('status')}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth error={!!errors.two_fa_option}>
                <InputLabel>2FA</InputLabel>
                <Controller
                  name="two_fa_option"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="2FA">
                      {TWO_FA.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.two_fa_option && (
                  <FormHelperText>{errorText('two_fa_option')}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        )}
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
        <Button onClick={closeDialog} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={loading}>
          {loading ? 'Saving…' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
