'use client';

import axios from 'axios';
import Cropper from 'react-easy-crop';
import { toast } from 'react-toastify';
import { getCookie } from 'minimal-shared';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { CONFIG } from 'src/global-config';
import { useAppContext } from 'src/contexts/app-context';

import { AnimateBorder } from 'src/components/animate';

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

export default function UpdateProfileDialog({ open, onClose }) {
  const { user, setUser } = useAppContext();

  const token = useMemo(() => getCookie('session_key'), []);

  const headers = useMemo(
    () =>
      token
        ? {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        : null,
    [token]
  );

  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(undefined);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    if (!open) return;

    const currentUsername = user?.username || '';
    const currentProfileUrl = user?.avatar
      ? `${CONFIG.assetsUrl || CONFIG.apiUrl}/upload/admin/${user.avatar}`
      : undefined;

    setUsername(currentUsername);
    setPreviewUrl(currentProfileUrl);
    setAvatarFile(null);
    setCropDialogOpen(false);
    setCropImageSrc(null);
    setCroppedAreaPixels(null);
  }, [open, user?.username, user?.avatar]);

  const handleClose = () => {
    if (loading) return;
    onClose?.();
  };

  const handleEditAvatarClick = () => {
    if (!previewUrl) {
      toast.info('No avatar to crop');
      return;
    }

    setCropImageSrc(previewUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropDialogOpen(true);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
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
    if (loading) return;
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
      setAvatarFile(croppedBlob);
      setPreviewUrl(localUrl);

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

  const handleSubmit = async () => {
    try {
      if (!username.trim()) {
        toast.error('Username is required');
        return;
      }

      if (!token || !headers) {
        toast.error('Session expired. Please login again.');
        return;
      }

      const formData = new FormData();
      formData.append('username', username.trim());

      if (avatarFile) {
        formData.append('avatar', avatarFile, 'avatar.jpg');
      }

      setLoading(true);

      const res = await axios.post(`${CONFIG.apiUrl}/v1/admin/profiles/update`, formData, {
        headers,
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.status === 401) {
        toast.error(res?.data?.msg || 'Unauthorized. Please login again.');
        return;
      }

      if (!res.data?.success) {
        toast.error(res.data?.msg || 'Update failed');
        return;
      }

      const updatedUser = res.data.data;

      if (setUser && updatedUser) {
        setUser(updatedUser);
      }

      const updatedUrl = updatedUser?.avatar
        ? `${CONFIG.assetsUrl || CONFIG.apiUrl}/upload/admin/${updatedUser.avatar}`
        : undefined;

      setPreviewUrl(updatedUrl);
      setAvatarFile(null);
      setUsername(updatedUser?.username || username);

      toast.success(res.data?.msg || 'Profile updated successfully');
      onClose?.();
    } catch (err) {
      console.error('Update profile error:', err);
      toast.error(err?.response?.data?.msg || err.message || 'Unable to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22 }}>Update Profile</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={3} sx={{ py: 2 }}>
            {/* Avatar */}
            <Box sx={{ textAlign: 'center', position: 'relative' }}>
              <AnimateBorder
                sx={{ p: '8px', width: 160, height: 160, mx: 'auto', borderRadius: '50%' }}
              >
                <Avatar
                  src={previewUrl}
                  alt={username}
                  sx={{
                    width: 1,
                    height: 1,
                    fontSize: 42,
                  }}
                >
                  {!previewUrl && username?.charAt(0)?.toUpperCase()}
                </Avatar>
              </AnimateBorder>

              {/* 🖊 Edit pen → crop EXISTING avatar */}
              <Tooltip title="Edit avatar">
                <IconButton
                  size="small"
                  onClick={handleEditAvatarClick}
                  sx={{
                    position: 'absolute',
                    bottom: 10,
                    right: '50%',
                    transform: 'translateX(60px)',
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'background.paper' },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Change / Remove buttons */}
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="contained" size="small" onClick={triggerFileSelect}>
                Change Avatar
              </Button>
            </Stack>

            {/* Hidden file input for new image */}
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />

            {/* Username */}
            <TextField
              label="Username"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                sx: { height: 50, fontSize: 16 },
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            sx={{ minWidth: 160 }}
          >
            Close
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{ minWidth: 160 }}
          >
            {loading ? 'Saving…' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Crop dialog */}
      <Dialog open={cropDialogOpen} onClose={handleCropCancel} fullWidth maxWidth="sm">
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
          <Button onClick={handleCropCancel} disabled={loading}>
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
