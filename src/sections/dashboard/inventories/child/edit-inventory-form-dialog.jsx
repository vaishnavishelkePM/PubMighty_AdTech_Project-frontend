

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

import { getCookie } from 'src/utils/helper';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';

const TYPES = [
  { label: 'WEB', value: 'WEB' },
  { label: 'APP', value: 'APP' },
  { label: 'OTT/CTV', value: 'OTT_CTV' },
];

const STATUS = [
  { label: 'Inactive', value: 0 },
  { label: 'Active', value: 1 },
  { label: 'Blocked', value: 2 },
];

const ADS_TXT = [
  { label: 'Not verified', value: 0 },
  { label: 'Verified', value: 1 },
  { label: 'Failed', value: 2 },
];//testing change

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

          setForm({
            publisherId: d.publisherId ?? '',
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

    // If user edits logo URL manually, update preview
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

        // field name must match multer: upload.single('logo')
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

        // Try to get updated inventory from API response
        const updatedInventory = res?.data?.data || null;

        // Notify parent so it can update rows (like PartnersView avatar logic)
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
        Edit Inventory
        <Box sx={{ flex: 1 }} />
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
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleLogoChange} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1.2fr 1.8fr' },
            columnGap: 2,
            rowGap: 2,
            pt: 1,
          }}
        >
          {/* LEFT: Logo card */}
          <Box
            onClick={handleClickLogo}
            sx={(theme) => ({
              gridColumn: { xs: '1 / -1', sm: '1 / 2' },
              borderRadius: 2,
              border: `1px dashed ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: 2,
              py: 3,
              cursor: 'pointer',
              overflow: 'hidden',
            })}
          >
            {logoPreview ? (
              <>
                <Box
                  component="img"
                  src={logoPreview}
                  alt="Inventory logo"
                  sx={{
                    width: '100%',
                    maxWidth: 220,
                    height: 'auto',
                    borderRadius: 2,
                    mb: 1.5,
                    objectFit: 'cover',
                  }}
                />

                <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
                  Click to change logo
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Allowed *.jpeg, *.jpg, *.png, *.gif
                </Typography>
              </>
            ) : (
              <>
                <Iconify icon="mdi:cloud-upload-outline" width={30} />
                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                  Upload logo
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Allowed *.jpeg, *.jpg, *.png, *.gif, max size of 3 Mb
                </Typography>
              </>
            )}
          </Box>

          {/* RIGHT: Fields */}
          <Box
            sx={{
              gridColumn: { xs: '1 / -1', sm: '2 / 3' },
            }}
          >
            <Grid container spacing={2}>
              {/* Publisher + Type */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Publisher ID"
                  type="number"
                  value={form.publisherId}
                  onChange={handleChange('publisherId')}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

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

              {/* Name + Status */}
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

              {/* URL + Developer site */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Inventory URL (required for WEB)"
                  fullWidth
                  value={form.url}
                  onChange={handleChange('url')}
                  InputLabelProps={{ shrink: true }}
                />
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

              {/* Description + Package */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  minRows={2}
                  value={form.description}
                  onChange={handleChange('description')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Package Name"
                  fullWidth
                  value={form.packageName}
                  onChange={handleChange('packageName')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* ads.txt + Partner status */}
              <Grid item xs={12} sm={6}>
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
              </Grid>

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

              {/* Logo URL (optional) */}
              <Grid item xs={12}>
                <TextField
                  label="Logo URL (optional)"
                  fullWidth
                  value={form.logo}
                  onChange={handleChange('logo')}
                  InputLabelProps={{ shrink: true }}
                  helperText="If you upload a new logo file, that will be used instead of this URL."
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
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
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Saving...' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
