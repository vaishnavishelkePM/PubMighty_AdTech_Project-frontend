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

// ---------- Avatar helpers ----------
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

// ---------- Constants ----------
const ROLE_OPTIONS = [
  { label: 'Super Admin', value: 'superAdmin' },
  { label: 'Staff', value: 'staff' },
  { label: 'Payment Manager', value: 'paymentManager' },
  { label: 'Support', value: 'support' },
];

// 2FA options (0 = Off, 1 = App, 2 = Email)
const TWO_FA = [
  { label: 'Off', value: 0 },
  { label: 'App', value: 1 },
  { label: 'Email', value: 2 },
];

// ✅ Zod schema with numeric 2FA option
const Schema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(150),
  email: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || /\S+@\S+\.\S+/.test(val), 'Please enter a valid email address'),
  password: z.string().optional().or(z.literal('')),
  role: z.string().optional().or(z.literal('')),
  status: z.number({ invalid_type_error: 'Status is required' }).min(0).max(3),

  // 2FA single numeric option (0=off,1=app,2=email)
  two_fa_option: z.number().int().min(0).max(2).default(0),

  avatar: z.any().nullable().optional(),
});

// Default values
const defaultValues = {
  username: '',
  email: '',
  password: '',
  role: '',
  status: 1,
  two_fa_option: 0, // 0=Off, 1=App, 2=Email
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
  const twoFaOption = watch('two_fa_option'); // 0/1/2

  const errorText = (path) => errors?.[path]?.message || '';

  // Avatar preview when a local File is selected
  useEffect(() => {
    if (avatarFile instanceof File) {
      const url = URL.createObjectURL(avatarFile);
      setAvatarPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [avatarFile]);

  // Load admin on open
  useEffect(() => {
    if (!open) return;

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

        // ✅ Map backend 2FA to numeric option
        // Prefer new column `twoFactorEnabled` (0/1/2); fallback to old `two_fa`
        const rawTwoFA =
          typeof d.twoFactorEnabled === 'number'
            ? d.twoFactorEnabled
            : typeof d.two_fa === 'number'
            ? d.two_fa
            : 0;

        reset({
          username: d.username || '',
          email: d.email || '',
          password: '',
          role: d.role || '',
          status: typeof d.status === 'number' ? d.status : 1,
          two_fa_option: rawTwoFA,
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

    const numericId = Number(id);
    if (!numericId || Number.isNaN(numericId)) {
      console.warn('Invalid admin ID:', id);
      return;
    }

    load();
  }, [open, id, reset, token]);

  const closeDialog = () => {
    reset(defaultValues);
    setAvatarPreview(null);
    onClose?.();
  };

  // ---------- Avatar crop handlers ----------
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

  // ---------- Submit ----------
  const onSubmit = async (values) => {
    try {
      if (!token) {
        toast.error('Session expired. Please login again.');
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

      // ✅ 2FA: send numeric twoFactorEnabled 0/1/2
      const opt = values.two_fa_option ?? 0;
      fd.append('twoFactorEnabled', String(opt));

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
            {/* Avatar + upload */}
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
                    label={isEdit ? 'Password (leave blank to keep same)' : 'Password *'}
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

            {/* ✅ Single 2FA dropdown: Off / App / Email (0/1/2) */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth error={!!errors.two_fa_option}>
                <InputLabel>2FA</InputLabel>
                <Controller
                  name="two_fa_option"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="2FA"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
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
          {loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogActions>

      {/* Crop dialog */}
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
