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

// ---------- helpers for cropping ----------

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

// ---------- component ----------

export default function InventoryAvatarSection({
  inventoryId, // number | undefined; if present => edit mode (upload now), else add mode (pass blob to parent)
  token,
  name,
  url,
  previewUrl,
  onPreviewChange,
  onAvatarFilenameChange,
  onCroppedBlobChange,
  setDebug,
}) {
  const fileInputRef = useRef(null);

  const [localPreview, setLocalPreview] = useState(previewUrl || '');
  const [isUploading, setIsUploading] = useState(false);

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const fallbackLetter = (name || url || 'I').charAt(0).toUpperCase();

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

      // 🚩 ADD MODE: no inventoryId yet → just return blob + local URL to parent
      if (!inventoryId) {
        const localUrl = URL.createObjectURL(croppedBlob);
        setLocalPreview(localUrl);
        onPreviewChange?.(localUrl);
        onCroppedBlobChange?.(croppedBlob);

        toast.success('Image cropped');
        setCropDialogOpen(false);
        setCropImageSrc(null);
        return;
      }

      // 🚩 EDIT MODE: inventoryId exists → upload immediately
      const formData = new FormData();
      formData.append('logo', croppedBlob, 'inventory-logo.jpg');

      // NOTE: adjust endpoint if your backend uses a different path
      const urlApi = `${CONFIG.apiUrl}/v1/admin/inventory/${inventoryId}/logo`;

      const resp = await axios.post(urlApi, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        validateStatus: () => true,
      });

      setDebug?.(urlApi, resp.status, resp.data);

      if (resp.data?.success) {
        const newLogo = resp.data?.data?.logo || resp.data?.data?.avatar; // support both keys

        if (!newLogo) {
          toast.error('Logo updated but no filename returned');
        } else {
          const newPreview = `${CONFIG.assetsUrl}/upload/inventory/${newLogo}`;
          setLocalPreview(newPreview);
          onPreviewChange?.(newPreview);
          onAvatarFilenameChange?.(newLogo);
          onCroppedBlobChange?.(null); // in edit, we don’t keep blob

          toast.success(resp.data.message || resp.data.msg || 'Inventory image updated');
          setCropDialogOpen(false);
          setCropImageSrc(null);
        }
      } else {
        toast.error(resp.data?.message || resp.data?.msg || 'Failed to update inventory image');
      }
    } catch (error) {
      console.error('Inventory avatar upload failed', error);
      toast.error('Inventory image upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCloseCropDialog = () => {
    if (isUploading) return;
    setCropDialogOpen(false);
    setCropImageSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenViewDialog = () => {
    if (!localPreview) {
      toast.info('No inventory image to view');
      return;
    }
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
  };

  // keep in sync with parent preview
  useEffect(() => {
    setLocalPreview(previewUrl || '');
  }, [previewUrl]);

  return (
    <>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleChangeFile} />

      {/* Avatar + main actions */}
      <Box
        sx={{
          mb: 3,
          pb: 2,
          borderBottom: (theme) => `1px dashed ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            alt={name}
            src={localPreview || undefined}
            sx={{
              width: 96,
              height: 96,
              fontSize: 24,
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            {fallbackLetter}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {name || 'Inventory'}
            </Typography>
            {url && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {url}
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
                {isUploading ? 'Uploading…' : 'Upload Image'}
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="material-symbols:image-outline" />}
                onClick={handleOpenViewDialog}
                disabled={!localPreview}
              >
                View Image
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* Crop dialog */}
      <Dialog open={cropDialogOpen} onClose={handleCloseCropDialog} fullWidth maxWidth="sm">
        <DialogTitle>Crop Inventory Image</DialogTitle>
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

      {/* View image dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} fullWidth maxWidth="sm">
        <DialogTitle>Inventory Image</DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 2,
          }}
        >
          {localPreview ? (
            <Box
              component="img"
              src={localPreview}
              alt={name || 'Inventory image'}
              sx={{
                maxWidth: '100%',
                maxHeight: 400,
                borderRadius: 2,
                objectFit: 'contain',
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No image to display.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
