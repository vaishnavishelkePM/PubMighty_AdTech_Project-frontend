'use client';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useRef, useMemo, useState, useEffect } from 'react';

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
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import PublisherSelector from 'src/components/selectors/inventory/publisher-selector';
import { getCookie } from 'src/utils/helper';
import { CONFIG } from 'src/global-config';
import { Iconify } from 'src/components/iconify';

const TYPES = [
  { label: 'WEB', value: 'WEB' },
  { label: 'APP', value: 'APP' },
  { label: 'OTT/CTV', value: 'OTT_CTV' },
];

const STATUS = [
  { label: 'Pending', value: 0 },
  { label: 'Approved', value: 1 },
  { label: 'Rejected', value: 2 },
];

const ADS_TXT = [
  { label: 'Invalid', value: 0 },
  { label: 'Valid', value: 1 },
  { label: 'Not Found', value: 2 },
];

const INITIAL_FORM = {
  publisherId: '',
  type: 'WEB',
  name: '',
  url: '',
  developerWeb: '',
  description: '',
  logo: '',
  adsTxtStatus: 0,
  partnerStatus: 1,
  status: 1,
  packageName: '',
};

export default function EditInventoryFormDialog({ open, onClose, id, onSuccess }) {
  const isEdit = !!id;

  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const fileInputRef = useRef(null);

  // NEW: track selected publisher for selector
  const [selectedPublisherId, setSelectedPublisherId] = useState('');

  const token = getCookie('session_key');

  const jsonHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  // -------- LOAD INVENTORY --------
  useEffect(() => {
    const run = async () => {
      if (!open || !isEdit) return;

      try {
        const res = await axios.get(`${CONFIG.apiUrl}/v1/admin/inventory/${id}`, {
          headers: jsonHeaders,
          validateStatus: () => true,
        });

        if (res?.data?.success) {
          const d = res.data.data || {};

          const logoDbValue = d.logo ?? '';
          let previewUrl = '';
          if (logoDbValue) {
            previewUrl = logoDbValue.startsWith('http')
              ? logoDbValue
              : `${CONFIG.assetsUrl}/upload/inventory/${logoDbValue}`;
          }

          const publisherId = d.publisherId ?? '';

          setForm({
            publisherId,
            type: d.type ?? 'WEB',
            name: d.name ?? '',
            url: d.url ?? '',
            developerWeb: d.developerWeb ?? '',
            description: d.description ?? '',
            logo: logoDbValue,
            adsTxtStatus: d.adsTxtStatus ?? 0,
            partnerStatus: d.partnerStatus ?? 1,
            status: d.status ?? 1,
            packageName: d.packageName ?? '',
          });

          setSelectedPublisherId(publisherId || '');

          setLogoFile(null);
          setLogoPreview(previewUrl);
        } else {
          toast.error(res?.data?.msg || res?.data?.message || 'Failed to load inventory');
        }
      } catch (e) {
        console.error('load inventory error:', e);
        toast.error('Failed to load inventory');
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id, isEdit]);

  // -------- VALIDATION --------
  const validate = () => {
    if (!form.publisherId) return 'publisherId is required';
    if (!form.type) return 'type is required';
    if (!form.name) return 'name is required';
    if (form.type === 'WEB' && !form.url) return 'WEB inventory must include a valid URL';
    return null;
  };

  const handleChange = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));

    if (key === 'logo') {
      if (!value) {
        setLogoPreview('');
      } else {
        setLogoPreview(
          value.startsWith('http') ? value : `${CONFIG.assetsUrl}/upload/inventory/${value}`
        );
      }
    }
  };

  // -------- LOGO UPLOAD HANDLERS --------
  const handleClickLogo = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
  };

  // -------- SAVE --------
  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const basePayload = {
      publisherId: form.publisherId ? Number(form.publisherId) : undefined,
      type: form.type,
      name: form.name,
      url: form.url?.trim() || '',
      developerWeb: form.developerWeb?.trim() || '',
      description: form.description ?? '',
      adsTxtStatus: form.adsTxtStatus !== '' ? Number(form.adsTxtStatus) : 0,
      partnerStatus: form.partnerStatus !== '' ? Number(form.partnerStatus) : 1,
      status: form.status !== '' ? Number(form.status) : 1,
      packageName: form.packageName?.trim() || '',
    };

    if (!logoFile) {
      basePayload.logo = form.logo?.trim() || '';
    }

    try {
      setSaving(true);
      const url = `${CONFIG.apiUrl}/v1/admin/inventory/${id}`;

      let res;

      if (logoFile) {
        const formData = new FormData();
        Object.entries(basePayload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        formData.append('logo', logoFile);

        res = await axios.put(url, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          validateStatus: () => true,
        });
      } else {
        res = await axios.put(url, basePayload, {
          headers: jsonHeaders,
          validateStatus: () => true,
        });
      }

      if (res?.data?.success) {
        toast.success(res.data?.msg || 'Inventory updated');
        const updatedInventory = res?.data?.data || null;
        onSuccess?.(updatedInventory);
      } else {
        toast.error(res?.data?.msg || res?.data?.message || 'Update failed');
      }
    } catch (e) {
      console.error('update inventory error:', e);
      toast.error('Something went wrong while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    onClose?.(false);
  };

  // -------- UI --------
  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
          typography: 'h6',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Iconify icon="mdi:tag-outline" width={22} />
        Properties
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          aria-label="Close"
          onClick={handleClose}
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
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleLogoChange}
        />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          {/* Upload photo bar */}
          <Box
            onClick={handleClickLogo}
            sx={(theme) => ({
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              px: 2.5,
              py: 3.5,
              cursor: 'pointer',
            })}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 1.5,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.100',
              }}
            >
              {logoPreview ? (
                <Box
                  component="img"
                  src={logoPreview}
                  alt="Inventory logo"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Iconify icon="mdi:image-outline" width={32} />
              )}
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2">Upload photo</Typography>
              <Typography variant="caption" color="text.secondary">
                Allowed *.jpeg, *.jpg, *.png, *.gif, max size of 3 Mb
              </Typography>
            </Box>
          </Box>

          {/* Form fields */}
          <Grid container spacing={2}>
            {/* Row 1: Inventory Name / URL */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Inventory Name"
                fullWidth
                value={form.name}
                onChange={handleChange('name')}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="URL"
                fullWidth
                value={form.url}
                onChange={handleChange('url')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Row 2: Type / Publisher selector */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Type"
                fullWidth
                value={form.type}
                onChange={handleChange('type')}
                InputLabelProps={{ shrink: true }}
                required
              >
                {TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
             <PublisherSelector
                    label="Publisher"
                    placeholder="Type publisher ID or username…"
                    fullWidth
                    statusFilter={1}
                    valueId={selectedPublisherId || ''}
                    onInventorySelect={(publisherId, publisher) => {
                      const finalId = publisherId || publisher?.id || '';
                      setSelectedPublisherId(finalId);
                      setForm((prev) => ({
                        ...prev,
                        publisherId: finalId,
                      }));
                    }}
                  />
            </Grid>

            {/* Row 3: Partner Status / Developer Site */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Partner Status"
                fullWidth
                value={form.partnerStatus}
                onChange={handleChange('partnerStatus')}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value={0}>Inactive</MenuItem>
                <MenuItem value={1}>Active</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Developer Site"
                fullWidth
                value={form.developerWeb}
                onChange={handleChange('developerWeb')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Row 4: Description / Status + extras */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={4}
                value={form.description}
                onChange={handleChange('description')}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                sx={{ mt: 2 }}
                label="Logo URL (optional)"
                fullWidth
                value={form.logo}
                onChange={handleChange('logo')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
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

              <Box
                sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
              >
                <TextField
                  select
                  label="ads.txt Status"
                  fullWidth
                  value={form.adsTxtStatus}
                  onChange={handleChange('adsTxtStatus')}
                  InputLabelProps={{ shrink: true }}
                >
                  {ADS_TXT.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      {s.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Package Name"
                  fullWidth
                  value={form.packageName}
                  onChange={handleChange('packageName')}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          bgcolor: 'background.paper',
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
