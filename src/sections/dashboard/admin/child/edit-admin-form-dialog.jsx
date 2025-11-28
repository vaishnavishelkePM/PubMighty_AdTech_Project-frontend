'use client';

import { z } from 'zod';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import { toast } from 'react-toastify';
import { getCookie } from 'minimal-shared';
import { useRef, useState, useEffect } from 'react';
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
  Slider,
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

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (err) => reject(err));
    img.crossOrigin = 'anonymous';
    img.src = url;
  });

const getCroppedImg = async (imageSrc, cropPixels) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const { x, y, width, height } = cropPixels;

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.9
    );
  });
};

const ROLE_OPTIONS = [
  { label: 'Super Admin', value: 'superAdmin' },
  { label: 'Staff', value: 'staff' },
  { label: 'Payment Manager', value: 'paymentManager' },
  { label: 'Support', value: 'support' },
];

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
    two_fa: z.boolean().default(false),
    two_fa_method: z.union([z.literal(''), z.enum(['email', 'auth_app'])]).default(''),
    two_fa_secret: z.string().optional().or(z.literal('')),
    avatar: z.any().nullable().optional(),
  })
  .refine(
    (v) => {
      if (!v.two_fa) return true;
      return !!v.two_fa_method;
    },
    { message: 'Select 2FA method', path: ['two_fa_method'] }
  )
  .refine(
    (v) => {
      if (!v.two_fa) return true;
      if (v.two_fa_method !== 'auth_app') return true;
      return !!v.two_fa_secret?.trim();
    },
    {
      message: 'Authenticator secret is required when using Auth App',
      path: ['two_fa_secret'],
    }
  );

const defaultValues = {
  username: '',
  email: '',
  password: '',
  role: '',
  status: 1,
  two_fa: false,
  two_fa_method: '',
  two_fa_secret: '',
  avatar: null,
};

export default function EditAdminFormDialog({ open, onClose, id, onSuccess }) {
  const token = getCookie('session_key');
  const isEdit = true;

  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropSaving, setCropSaving] = useState(false);

  const fileInputRef = useRef(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(Schema),
    defaultValues,
    mode: 'onBlur',
  });

  const avatarFile = watch('avatar');
  const twoFAEnabled = watch('two_fa');
  const twoFAMethod = watch('two_fa_method');

  const errorText = (path) => errors?.[path]?.message || '';

  useEffect(() => {
    if (avatarFile instanceof File) {
      const url = URL.createObjectURL(avatarFile);
      setAvatarPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [avatarFile]);

  useEffect(() => {
    if (!open) return;

    if (!isEdit) {
      reset(defaultValues);
      setAvatarPreview(null);
      return;
    }

    const load = async () => {
      try {
        if (!token) {
          toast.error('Session expired. Please login again.');
          return;
        }

        setLoading(true);

        const res = await axios.get(`${CONFIG.apiUrl}/v1/admin/admins/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
          validateStatus: () => true,
        });

        if (res.status === 401) {
          toast.error(res?.data?.msg || 'Unauthorized. Please login again.');
          return;
        }

        if (!res.data?.success) {
          toast.error(res.data?.msg || 'Failed to load admin');
          return;
        }

        const d = res.data.data || {};

        reset({
          username: d.username || '',
          email: d.email || '',
          password: '',
          role: d.role || '',
          status: typeof d.status === 'number' ? d.status : 1,
          two_fa: d.two_fa === 1,
          two_fa_method: d.two_fa_method || '',
          two_fa_secret: '',
          avatar: null,
        });

        if (d.avatar) {
          setAvatarPreview(`${CONFIG.assetsUrl}/upload/admin/${d.avatar}`);
        } else {
          setAvatarPreview(null);
        }
      } catch (err) {
        console.error('load admin error:', err);
        toast.error('Failed to load admin');
      } finally {
        setLoading(false);
      }
    };

    if (!open) return;

    // id must be a number
    const numericId = Number(id);
    if (!numericId || isNaN(numericId)) {
      console.warn('Invalid admin ID:', id);
      return;
    }

    load();
  }, [open, id]);

  const closeDialog = () => {
    reset(defaultValues);
    setAvatarPreview(null);
    onClose?.();
  };

  const handleAvatarPenClick = () => {
    if (!avatarPreview) {
      toast.info('No avatar image to crop');
      return;
    }

    setCropImageSrc(avatarPreview);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropDialogOpen(true);
  };

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setCropDialogOpen(true);
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleCropCancel = () => {
    if (cropSaving) return;
    setCropDialogOpen(false);
    setCropImageSrc(null);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropSave = async () => {
    if (!cropImageSrc || !croppedAreaPixels) {
      toast.error('Nothing to crop');
      return;
    }

    try {
      setCropSaving(true);
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);

      const croppedFile = new File([croppedBlob], 'admin-avatar.jpg', {
        type: 'image/jpeg',
      });

      setValue('avatar', croppedFile, { shouldDirty: true });

      const localUrl = URL.createObjectURL(croppedFile);
      setAvatarPreview(localUrl);

      setCropDialogOpen(false);
      setCropImageSrc(null);
      setCroppedAreaPixels(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      toast.success('Avatar cropped');
    } catch (err) {
      console.error('crop error:', err);
      toast.error('Failed to crop image');
    } finally {
      setCropSaving(false);
    }
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

      fd.append('username', values.username.trim());
      if (values.email) fd.append('email', values.email.trim().toLowerCase());
      if (values.password) fd.append('password', values.password);
      if (values.role) fd.append('role', values.role);

      if (typeof values.status === 'number') {
        fd.append('status', String(values.status));
      }

      if (values.two_fa) {
        fd.append('two_fa', '1');

        if (values.two_fa_method) {
          fd.append('two_fa_method', values.two_fa_method);
        }

        if (values.two_fa_method === 'auth_app' && values.two_fa_secret) {
          fd.append('two_fa_secret', values.two_fa_secret.trim());
        }
      } else {
        fd.append('two_fa', '0');
      }

      if (values.avatar instanceof File) {
        fd.append('avatar', values.avatar);
      }

      const url = isEdit
        ? `${CONFIG.apiUrl}/v1/admin/admins/${id}`
        : `${CONFIG.apiUrl}/v1/admin/admins/add`;

      const res = await axios.post(url, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
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

      toast.success(res.data?.msg || 'Admin updated successfully.');
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
          <Box sx={{ fontSize: 15, fontWeight: 600 }}>{isEdit ? 'Edit Admin' : 'Add Admin'}</Box>
          <Box sx={{ fontSize: 12, color: 'text.secondary' }}>
            {isEdit ? 'Update existing admin details' : 'Create a new admin user'}
          </Box>
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
            <Grid item xs={12}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarFileChange}
              />

              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <Avatar
                    src={avatarPreview || undefined}
                    sx={{ width: 86, height: 86, fontSize: 28 }}
                  >
                    {!avatarPreview && (watch('username')?.[0]?.toUpperCase() || 'A')}
                  </Avatar>

                  <IconButton
                    size="small"
                    onClick={handleAvatarPenClick}
                    sx={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      width: 28,
                      height: 28,
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      '&:hover': { bgcolor: 'background.paper' },
                    }}
                  >
                    <Iconify icon="mdi:pencil" width={18} />
                  </IconButton>
                </Box>

                <Controller
                  name="avatar"
                  control={control}
                  render={({ field }) => (
                    <Button
                      variant="outlined"
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}
                    >
                      <Iconify icon="mdi:upload" width={20} />
                      {field.value instanceof File ? 'Change Avatar' : 'Upload Avatar'}
                    </Button>
                  )}
                />
              </Stack>
            </Grid>

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
                    label={isEdit ? 'Password (leave blank to keep same)' : 'Password *'}
                    error={!!errors.password}
                    helperText={errorText('password')}
                  />
                )}
              />
            </Grid>

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
              <FormControl fullWidth>
                <InputLabel>2FA</InputLabel>
                <Select
                  label="2FA"
                  value={twoFAEnabled ? (twoFAMethod === 'auth_app' ? 'auth_app' : 'email') : 'off'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'off') {
                      setValue('two_fa', false);
                      setValue('two_fa_method', '');
                      setValue('two_fa_secret', '');
                    } else if (val === 'email') {
                      setValue('two_fa', true);
                      setValue('two_fa_method', 'email');
                      setValue('two_fa_secret', '');
                    } else if (val === 'auth_app') {
                      setValue('two_fa', true);
                      setValue('two_fa_method', 'auth_app');
                    }
                  }}
                >
                  <MenuItem value="off">Off</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="auth_app">App</MenuItem>
                </Select>
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
          {loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogActions>

      <Dialog open={cropDialogOpen} onClose={handleCropCancel} fullWidth maxWidth="sm">
        <DialogTitle>Crop Admin Avatar</DialogTitle>
        <DialogContent
          sx={{
            mt: 1,
            pb: 1,
          }}
        >
          {cropImageSrc && (
            <>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 320,
                  bgcolor: 'black',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Cropper
                  image={cropImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={(val) => setZoom(val)}
                  onCropComplete={handleCropComplete}
                  showGrid={false}
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <Box sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>Zoom</Box>
                <Slider
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(_, value) => setZoom(value)}
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCropCancel} disabled={cropSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleCropSave}
            variant="contained"
            disabled={cropSaving || !cropImageSrc || !croppedAreaPixels}
          >
            {cropSaving ? 'Saving…' : 'Done'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
