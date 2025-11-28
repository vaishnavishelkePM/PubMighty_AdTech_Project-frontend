'use client';

import axios from 'axios';
import Cropper from 'react-easy-crop';
import { toast } from 'react-toastify';
import { getCookie } from 'minimal-shared';
import { useRef, useMemo, useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Slide,
  Stack,
  Button,
  Dialog,
  Avatar,
  Slider,
  Divider,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
} from '@mui/material';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';

//filters for storing the array of objects in the variable

const STATUS = [
  { label: 'Pending', value: 0 },
  { label: 'Active', value: 1 },
  { label: 'Suspended', value: 2 },
  { label: 'Disabled', value: 3 },
];

const TWO_FA = [
  { label: 'Off', value: 0 },
  { label: 'Email', value: 1 },
  { label: 'Auth App', value: 2 },
];

const GENDERS = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
];

//thisis for editpublisher form dialog

export default function EditPublisherFormDialog({ open, onClose, id, onSuccess, setDebug }) {

  const token = useMemo(() => getCookie('session_key'), []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
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
    avatar: null,
    avatarName: '',
    avatarUrl: '',
    avatarPreview: '',
  });

  const fileInputRef = useRef(null);
  useEffect(() => {
    if (!open || !id) return;

    const load = async () => {
      try {
        if (!token) {
          toast.error('Session expired. Please login again.');
          return;
        }
        setLoading(true);

        const url = `${CONFIG.apiUrl}/v1/admin/publishers/${id}`;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
          validateStatus: () => true,
        });

        if (res.status === 401) {
          toast.error(res?.data?.msg || 'Unauthorized. Please login again.');
          return;
        }
        if (!res.data?.success) {
          toast.error(res.data?.msg || 'Failed to load publisher');
          return;
        }

        const d = res.data.data || {};
        const avatarUrl = d.avatar ? `${CONFIG.apiUrl}/upload/publishers/${d.avatar}` : '';

        setForm((prev) => ({
          ...prev,
          username: d.username || '',
          email: d.email || '',
          password: '',
          phoneNo: d.phoneNo || '',
          gender: d.gender || '',
          country: d.country || '',
          language: d.language || 'en',
          status: typeof d.status === 'number' ? d.status : 1,
          twoFactorEnabled:
            d.twoFactorEnabled === 2 ? 2 :
            d.twoFactorEnabled === 1 ? 1 : 0,
          avatar: null,
          avatarName: '',
          avatarUrl,
          avatarPreview: avatarUrl,
        }));
      } catch (err) {
        console.error('load publisher error:', err);
        toast.error('Failed to load publisher');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, id, token]);


  //this is for image handeling operation

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

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

  const handleEditAvatarClick = () => {
    const currentSrc = form.avatarPreview || form.avatarUrl;
    if (!currentSrc) {
      toast.info('No avatar to crop');
      return;
    }

    setCropImageSrc(currentSrc);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropDialogOpen(true);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result); // dataURL for Cropper
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
    if (saving) return;
    setCropDialogOpen(false);
    setCropImageSrc(null);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropSave = async () => {
    if (!cropImageSrc || !croppedAreaPixels) {
      toast.error('Nothing to crop');
      return;
    }

    try {
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const localUrl = URL.createObjectURL(croppedBlob);
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });

      setForm((prev) => ({
        ...prev,
        avatar: file,
        avatarName: 'avatar.jpg',
        avatarPreview: localUrl,
      }));

      setCropDialogOpen(false);
      setCropImageSrc(null);
      setCroppedAreaPixels(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.success('Image cropped');
    } catch (err) {
      console.error('Crop failed', err);
      toast.error('Failed to crop image');
    }
  };

  const handleSave = async () => {
    try {
      if (!token) {
        toast.error('Session expired. Please login again.');
        return;
      }
      setSaving(true);

      const basePayload = {
        username: form.username.trim(),
        email: form.email?.trim() ? form.email.trim().toLowerCase() : '', // keep empty string if clearing
        phoneNo: form.phoneNo?.trim() || '',
        gender: form.gender?.trim() || '',
        country: form.country?.trim() || '',
        language: form.language?.trim() || 'en',
        status: Number(form.status),
        twoFactorEnabled: Number(form.twoFactorEnabled),
      };

      const url = `${CONFIG.apiUrl}/v1/admin/publishers/${id}`;

      // If avatar selected → use FormData (cropped file)
      if (form.avatar instanceof File) {
        const fd = new FormData();
        Object.entries(basePayload).forEach(([k, v]) => fd.append(k, String(v)));
        if (form.password) fd.append('password', form.password);
        fd.append('avatar', form.avatar);

        const res = await axios.post(url, fd, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
          validateStatus: () => true,
        });

        setDebug?.(url, res.status, res.data);

        if (res.status === 401) {
          toast.error(res?.data?.msg || 'Unauthorized. Please login again.');
          return;
        }
        if (!res.data?.success) {
          toast.error(res.data?.msg || 'Failed to save publisher');
          return;
        }

        toast.success(res.data?.msg || 'Publisher updated');
        onSuccess?.();
        onClose?.();
        return;
      }

      // Otherwise send JSON (no avatar change)
      const payload = {
        ...basePayload,
        ...(form.password ? { password: form.password } : {}),
      };

      const res = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
        validateStatus: () => true,
      });

      setDebug?.(url, res.status, res.data);

      if (res.status === 401) {
        toast.error(res?.data?.msg || 'Unauthorized. Please login again.');
        return;
      }
      if (!res.data?.success) {
        toast.error(res.data?.msg || 'Failed to save publisher');
        return;
      }

      toast.success(res.data?.msg || 'Publisher updated');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('update publisher error:', err);
      toast.error('Something went wrong while saving publisher');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
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
          <Iconify icon="mdi:pencil" width={22} />
          Edit Publisher
          <Box sx={{ flex: 1 }} />
          <IconButton
            aria-label="Close"
            onClick={() => onClose(false)}
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
          {loading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ pt: 1 }}>

              <Grid item xs={12}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Avatar
                      src={form.avatarPreview || undefined}
                      sx={{ width: 86, height: 86 }}
                    >
                      {!form.avatarPreview && form.username?.[0]?.toUpperCase()}
                    </Avatar>
                    <IconButton
                      size="small"
                      onClick={handleEditAvatarClick}
                      sx={{
                        position: 'absolute',
                        bottom: -4,
                        right: -4,
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                        '&:hover': { bgcolor: 'background.paper' },
                      }}
                    >
                      <Iconify icon="mdi:pencil" width={16} />
                    </IconButton>
                  </Box>

                        <Button
                        variant="outlined"
                        onClick={triggerFileSelect}
                      >
                        <Iconify icon="mdi:upload" style={{ marginRight: 8 }} />
                        Upload Avatar
                      </Button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleAvatarChange}
                      />
                  <Box sx={{ color: 'text.secondary', fontSize: 13 }}>
                    {form.avatarName ||
                      (form.avatarPreview ? '' : 'No avatar')}
                  </Box>
                </Stack>
              </Grid>

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
                  label="Email (optional)"
                  type="email"
                  fullWidth
                  value={form.email}
                  onChange={handleChange('email')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Password (leave blank to keep same)"
                  type="password"
                  fullWidth
                  value={form.password}
                  onChange={handleChange('password')}
                  InputLabelProps={{ shrink: true }}
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
                  select
                  label="Gender"
                  fullWidth
                  value={form.gender}
                  onChange={handleChange('gender')}
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="">
                    <em>Not set</em>
                  </MenuItem>
                  {GENDERS.map((g) => (
                    <MenuItem key={g.value} value={g.value}>
                      {g.label}
                    </MenuItem>
                  ))}
                </TextField>
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
          )}
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
          <Button onClick={handleSave} variant="contained" disabled={saving || loading}>
            {saving ? 'Saving...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={cropDialogOpen}
        onClose={handleCropCancel}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Crop Profile Photo</DialogTitle>
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
                  onZoomChange={setZoom}
                  onCropComplete={handleCropComplete}
                  showGrid={false}
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Zoom
                </Typography>
                <Slider
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(_, value) => setZoom(value)}
                  sx={{ mt: 1 }}
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCropCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleCropSave}
            variant="contained"
            disabled={!cropImageSrc || !croppedAreaPixels}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
