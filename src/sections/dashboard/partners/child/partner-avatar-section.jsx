'use client';

import axios from 'axios';
import Cropper from 'react-easy-crop';
import { toast } from 'react-toastify';
import { useRef, useState, useEffect } from 'react';

import {
  Box,
  Stack,
  Avatar,
  Button,
  Slider,
  Dialog,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';

// ---- helpers for cropping -----------------------------------------

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

export default function PartnerAvatarSection({
  partnerId,
  token,
  username,
  email,
  previewUrl,
  onPreviewChange,
  onAvatarFilenameChange,
  onCroppedBlobChange,
  setDebug,
}) {
  const [localPreview, setLocalPreview] = useState(previewUrl || '');
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  // crop dialog states
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // 🔹 view image dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // keep in sync with parent preview
  useEffect(() => {
    setLocalPreview(previewUrl || '');
  }, [previewUrl]);

  const handleClickUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleChangeFile = (event) => {
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

  const handleCropSave = async () => {
    if (!cropImageSrc || !croppedAreaPixels) {
      toast.error('Nothing to crop');
      return;
    }

    try {
      setIsUploading(true);

      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);

      // 🔹 CASE 1: ADD MODE (no partnerId yet)
      if (!partnerId) {
        const localUrl = URL.createObjectURL(croppedBlob);
        setLocalPreview(localUrl);
        onPreviewChange?.(localUrl);
        onCroppedBlobChange?.(croppedBlob);
        toast.success('Image cropped');
        setCropDialogOpen(false);
        setCropImageSrc(null);
        return;
      }

      // 🔹 CASE 2: EDIT MODE (partnerId exists) → upload immediately
      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.jpg');

      const url = `${CONFIG.apiUrl}/v1/admin/partners/${partnerId}/avatar`;

      const resp = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        validateStatus: () => true,
      });

      setDebug?.(url, resp.status, resp.data);

      if (resp.data?.success) {
        const newAvatar = resp.data?.data?.avatar;

        if (!newAvatar) {
          toast.error('Avatar updated but no filename returned');
        } else {
          const newPreview = `${CONFIG.assetsUrl}/upload/partner/${newAvatar}`;
          setLocalPreview(newPreview);
          onPreviewChange?.(newPreview);
          onAvatarFilenameChange?.(newAvatar);
          onCroppedBlobChange?.(null); // in edit we don't keep blob
          toast.success(resp.data.message || resp.data.msg || 'Avatar updated');
          setCropDialogOpen(false);
          setCropImageSrc(null);
        }
      } else {
        toast.error(resp.data?.message || resp.data?.msg || 'Failed to update avatar');
      }
    } catch (error) {
      console.error('Avatar upload failed', error);
      toast.error('Avatar upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 🔹 opens the view dialog
  const handleViewImage = () => {
    if (!localPreview) {
      toast.info('No profile image to view');
      return;
    }
    setViewDialogOpen(true);
  };

  const handleCloseCropDialog = () => {
    if (isUploading) return;
    setCropDialogOpen(false);
    setCropImageSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleChangeFile} />

      {/* Avatar + buttons */}
      <Box
        sx={{
          mb: 3,
          pb: 2,
          borderBottom: (theme) => `1px dashed ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {/* 🔹 UPDATED: avatar is now clickable to open view dialog */}
          <Box
            sx={{
              position: 'relative',
              display: 'inline-flex',
              cursor: localPreview ? 'pointer' : 'default',
            }}
            onClick={() => {
              if (localPreview) handleViewImage();
            }}
          >
            <Avatar
              alt={username}
              src={localPreview || undefined}
              sx={{
                width: 96,
                height: 96,
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              {(username || '?').charAt(0).toUpperCase()}
            </Avatar>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {username || 'Partner'}
            </Typography>
            {email && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {email}
              </Typography>
            )}

            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="soft"
                size="small"
                startIcon={<Iconify icon="solar:upload-linear" />}
                onClick={handleClickUpload}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading…' : 'Upload Photo'}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* Crop dialog */}
      <Dialog open={cropDialogOpen} onClose={handleCloseCropDialog} fullWidth maxWidth="sm">
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
          <Button onClick={handleCloseCropDialog} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleCropSave}
            variant="contained"
            disabled={isUploading || !cropImageSrc || !croppedAreaPixels}
          >
            {isUploading ? 'Saving…' : 'Done'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Image dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Profile Image Preview</DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 2,
          }}
        >
          {localPreview && (
            <Box
              component="img"
              src={localPreview}
              alt={username || 'Partner avatar'}
              sx={{
                maxWidth: '100%',
                maxHeight: 400,
                borderRadius: 2,
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setViewDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
