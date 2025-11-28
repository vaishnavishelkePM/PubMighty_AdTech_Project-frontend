'use client';

import axios from 'axios';
import Cropper from 'react-easy-crop';
import { toast } from 'react-toastify';
import { getCookie } from 'minimal-shared';
import { useRef, useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Slide,
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
} from '@mui/material';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';

    // storing the array of objects of the fileter in the variable

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
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

    //add publisher form dialog

export default function AddPublisherFormDialog({ open, onClose, onSuccess, setDebug }) {

        // this is for states changing

  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
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
  });


    //this is for session storing for validating the admin

   const token = getCookie('session_key');
   const headers = {
      Authorization: `Bearer ${token}`,
    }


    useEffect(() => () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    }, [avatarPreview]);

      //this functionn are used for handeling the image releted operations

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result); // dataURL
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
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });

      // revoke old preview URL if any
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }

      const url = URL.createObjectURL(file);
      setAvatarFile(file);
      setAvatarPreview(url);

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

const fileInputRef = useRef(null);

    //thisis for handeling the validation

  const validate = () => {
    if (!form.username?.trim()) return 'username is required';
    if (!form.password) return 'password is required';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    if (!token) {
      toast.error('Session expired. Please login again.');
      return;
    }

    const formData = new FormData();
    formData.append('username', form.username.trim());

    if (form.email?.trim()) {
      formData.append('email', form.email.trim().toLowerCase());
    }

    formData.append('password', form.password);
    formData.append('phoneNo', form.phoneNo?.trim() || '');
    formData.append('gender', form.gender?.trim() || '');
    formData.append('country', form.country?.trim() || '');
    formData.append('language', form.language?.trim() || 'en');
    formData.append('status', String(form.status));
    formData.append('twoFactorEnabled', String(form.twoFactorEnabled));

    if (avatarFile) {
      // MUST match uploadImage.single('avatar') on backend
      formData.append('avatar', avatarFile);
    }

    try {
      setSaving(true);
      const url = `${CONFIG.apiUrl}/v1/admin/publishers/add`;

      const res = await axios.post(url, formData, {
        headers,
        withCredentials: true,
        validateStatus: () => true,
      });

      setDebug?.(url, res.status, res.data);

      if (res.status === 401) {
        toast.error(res?.data?.msg || 'Unauthorized. Please login again.');
        return;
      }

      if (res?.data?.success) {
        toast.success(res?.data?.msg || 'Publisher created');
        onSuccess?.();
        onClose?.();
      } else {
        toast.error(res?.data?.msg || 'Create failed');
      }
    } catch (e) {
      console.error('publisher create error:', e);
      toast.error('Something went wrong while saving');
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
          <Iconify icon="mdi:account-plus" width={22} />
          Add Publisher
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
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {/* Avatar row – full width, single line (like partner form) */}
            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                {/* Circle preview */}
                <Avatar
                  src={avatarPreview || undefined}
                  sx={{
                    width: 80,
                    height: 80,
                    fontSize: 32,
                    flexShrink: 0,
                  }}
                >
                  {!avatarPreview && form.username?.[0]?.toUpperCase()}
                </Avatar>

                {/* Small upload + info */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    flex: 1,
                  }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    component="label"
                    sx={{
                      alignSelf: 'flex-start',
                      px: 1.5,
                      py: 0.5,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.8,
                    }}
                  >
                    <Iconify icon="mdi:upload" width={18} />
                    {avatarFile ? 'Change avatar' : 'Upload avatar'}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleAvatarChange}
                    />
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* Form fields start on next line */}
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
            {saving ? 'Saving...' : 'Create'}
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
