// 'use client';

// import axios from 'axios';
// import { toast } from 'react-toastify';
// import { useMemo, useState } from 'react';

// import {
//   Box,
//   Grid,
//   Slide,
//   Button,
//   Dialog,
//   Divider,
//   MenuItem,
//   TextField,
//   IconButton,
//   DialogTitle,
//   DialogActions,
//   DialogContent,
// } from '@mui/material';

// import { getCookie } from 'src/utils/helper';

// import { CONFIG } from 'src/global-config';

// import { Iconify } from 'src/components/iconify';

// const TYPES = [
//   { label: 'WEB', value: 'WEB' },
//   { label: 'APP', value: 'APP' },
//   { label: 'OTT/CTV', value: 'OTT_CTV' },
// ];

// const STATUS = [
//   { label: 'Inactive ', value: 0 },
//   { label: 'Active ', value: 1 },
//   { label: 'Blocked ', value: 2 },
// ];

// const ADS_TXT = [
//   { label: 'Not verified ', value: 0 },
//   { label: 'Verified ', value: 1 },
//   { label: 'Failed ', value: 2 },
// ];

// export default function AddInventoryFormDialog({ open, onClose, onSuccess }) {
//   const [form, setForm] = useState({
//     publisherId: '',
//     type: 'WEB',
//     name: '',
//     url: '',
//     developerWeb: '',
//     description: '',
//     logo: '',
//     adsTxtStatus: 0,
//     partnerStatus: 1,
//     status: 1,
//     packageName: '',
//   });

//   const [saving, setSaving] = useState(false);

//   const token = getCookie('session_key');
//   const headers = useMemo(
//     () => ({
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${token}`,
//     }),
//     [token]
//   );

//   // validation
//   const validate = () => {
//     if (!form.publisherId) return 'publisherId is required';
//     if (!form.type) return 'type is required';
//     if (!form.name) return 'name is required';
//     if (form.type === 'WEB' && !form.url) return 'WEB inventory must include a valid URL';
//     return null;
//   };

//   const handleChange = (key) => (e) => {
//     setForm((prev) => ({ ...prev, [key]: e.target.value }));
//   };

//   const handleSave = async () => {
//     const err = validate();
//     if (err) {
//       toast.error(err);
//       return;
//     }

//     const payload = {
//       ...form,
//       publisherId: form.publisherId ? Number(form.publisherId) : undefined,
//       adsTxtStatus: form.adsTxtStatus !== '' ? Number(form.adsTxtStatus) : 0,
//       partnerStatus: form.partnerStatus !== '' ? Number(form.partnerStatus) : 1,
//       status: form.status !== '' ? Number(form.status) : 1,
//       url: form.url?.trim() || '',
//       developerWeb: form.developerWeb?.trim() || '',
//       logo: form.logo?.trim() || '',
//       packageName: form.packageName?.trim() || '',
//       description: form.description ?? '',
//     };

//     try {
//       setSaving(true);

//       const res = await axios.post(`${CONFIG.apiUrl}/v1/admin/inventory`, payload, {
//         headers,
//         validateStatus: () => true,
//       });

//       console.log('Create Inventory →', res.status, res.data);

//       if (res?.data?.success) {
//         toast.success(res.data?.msg || 'Inventory created');
//         onSuccess?.();
//       } else {
//         toast.error(res?.data?.msg || res?.data?.message || 'Create failed');
//       }
//     } catch (e) {
//       console.error('create inventory error:', e);
//       toast.error('Something went wrong while saving');
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <Dialog
//       open={open}
//       onClose={onClose}
//       fullWidth
//       maxWidth="md"
//       TransitionComponent={Slide}
//       TransitionProps={{ direction: 'up' }}
//       PaperProps={{
//         sx: (theme) => ({
//           borderRadius: { xs: 2, sm: 3 },
//           overflow: 'hidden',
//           boxShadow: theme.shadows[24],
//           border: `1px solid ${theme.palette.divider}`,
//           bgcolor: 'background.paper',
//         }),
//       }}
//     >
//       <DialogTitle
//         sx={{
//           py: 2,
//           px: 3,
//           typography: 'h6',
//           display: 'flex',
//           alignItems: 'center',
//           gap: 1.5,
//         }}
//       >
//         <Iconify icon="mdi:calendar-plus" width={22} />
//         Add Inventory
//         <Box sx={{ flex: 1 }} />
//         <IconButton
//           aria-label="Close"
//           onClick={() => onClose(false)}
//           edge="end"
//           sx={{
//             ml: 1,
//             '&:hover': { bgcolor: 'action.hover' },
//           }}
//         >
//           <Iconify icon="mdi:close" />
//         </IconButton>
//       </DialogTitle>

//       <Divider />

//       <DialogContent
//         dividers
//         sx={{
//           px: { xs: 2, sm: 3 },
//           py: { xs: 2, sm: 2.5 },
//           bgcolor: 'background.default',
//         }}
//       >
//         <Grid container spacing={2} sx={{ pt: 1 }}>
//           <Grid item xs={12} sm={4}>
//             <TextField
//               fullWidth
//               label="Publisher ID"
//               type="number"
//               value={form.publisherId}
//               onChange={handleChange('publisherId')}
//               InputLabelProps={{ shrink: true }}
//               required
//             />
//           </Grid>

//           <Grid item xs={12} sm={4}>
//             <TextField
//               select
//               label="Type"
//               fullWidth
//               value={form.type}
//               onChange={handleChange('type')}
//               InputLabelProps={{ shrink: true }}
//               required
//             >
//               {TYPES.map((t) => (
//                 <MenuItem key={t.value} value={t.value}>
//                   {t.label}
//                 </MenuItem>
//               ))}
//             </TextField>
//           </Grid>

//           <Grid item xs={12} sm={4}>
//             <TextField
//               select
//               label="Status"
//               fullWidth
//               value={form.status}
//               onChange={handleChange('status')}
//               InputLabelProps={{ shrink: true }}
//             >
//               {STATUS.map((s) => (
//                 <MenuItem key={s.value} value={s.value}>
//                   {s.label}
//                 </MenuItem>
//               ))}
//             </TextField>
//           </Grid>

//           <Grid item xs={12} sm={6}>
//             <TextField
//               label="Name"
//               fullWidth
//               value={form.name}
//               onChange={handleChange('name')}
//               InputLabelProps={{ shrink: true }}
//               required
//             />
//           </Grid>

//           <Grid item xs={12} sm={6}>
//             <TextField
//               label="Logo URL"
//               fullWidth
//               value={form.logo}
//               onChange={handleChange('logo')}
//               InputLabelProps={{ shrink: true }}
//             />
//           </Grid>

//           <Grid item xs={12} sm={8}>
//             <TextField
//               label="URL (required for WEB)"
//               fullWidth
//               value={form.url}
//               onChange={handleChange('url')}
//               InputLabelProps={{ shrink: true }}
//             />
//           </Grid>

//           <Grid item xs={12} sm={4}>
//             <TextField
//               label="Developer Site"
//               fullWidth
//               value={form.developerWeb}
//               onChange={handleChange('developerWeb')}
//               InputLabelProps={{ shrink: true }}
//             />
//           </Grid>

//           <Grid item xs={12} sm={8}>
//             <TextField
//               label="Description"
//               fullWidth
//               multiline
//               minRows={2}
//               value={form.description}
//               onChange={handleChange('description')}
//               InputLabelProps={{ shrink: true }}
//             />
//           </Grid>

//           <Grid item xs={12} sm={4}>
//             <TextField
//               label="Package Name"
//               fullWidth
//               value={form.packageName}
//               onChange={handleChange('packageName')}
//               InputLabelProps={{ shrink: true }}
//             />
//           </Grid>

//           <Grid item xs={12} sm={6}>
//             <TextField
//               select
//               label="ads.txt status"
//               fullWidth
//               value={form.adsTxtStatus}
//               onChange={handleChange('adsTxtStatus')}
//               InputLabelProps={{ shrink: true }}
//             >
//               {ADS_TXT.map((s) => (
//                 <MenuItem key={s.value} value={s.value}>
//                   {s.label}
//                 </MenuItem>
//               ))}
//             </TextField>
//           </Grid>

//           <Grid item xs={12} sm={6}>
//             <TextField
//               select
//               label="Partner Status"
//               fullWidth
//               value={form.partnerStatus}
//               onChange={handleChange('partnerStatus')}
//               InputLabelProps={{ shrink: true }}
//             >
//               <MenuItem value={0}>Inactive (0)</MenuItem>
//               <MenuItem value={1}>Active (1)</MenuItem>
//               <MenuItem value={2}>Blocked (2)</MenuItem>
//             </TextField>
//           </Grid>
//         </Grid>
//       </DialogContent>

//       <DialogActions
//         sx={{
//           px: { xs: 2, sm: 3 },
//           py: 2,
//           position: { xs: 'sticky', sm: 'static' },
//           bottom: 0,
//           bgcolor: 'background.paper',
//           borderTop: (theme) => `1px solid ${theme.palette.divider}`,
//           gap: 1,
//         }}
//       >
//         <Button onClick={onClose} disabled={saving}>
//           Cancel
//         </Button>
//         <Button onClick={handleSave} variant="contained" disabled={saving}>
//           {saving ? 'Saving...' : 'Create'}
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// }

'use client';

import axios from 'axios';
import { toast } from 'react-toastify';
import { useMemo, useState, useEffect } from 'react';

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
  { label: 'Inactive ', value: 0 },
  { label: 'Active ', value: 1 },
  { label: 'Blocked ', value: 2 },
];

const ADS_TXT = [
  { label: 'Not verified ', value: 0 },
  { label: 'Verified ', value: 1 },
  { label: 'Failed ', value: 2 },
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

export default function AddInventoryFormDialog({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const token = getCookie('session_key');
  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  // Reset form every time dialog opens (fresh create)
  useEffect(() => {
    if (open) {
      setForm(INITIAL_FORM);
    }
  }, [open]);

  // validation
  const validate = () => {
    if (!form.publisherId) return 'publisherId is required';
    if (!form.type) return 'type is required';
    if (!form.name) return 'name is required';
    if (form.type === 'WEB' && !form.url) return 'WEB inventory must include a valid URL';
    return null;
  };

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const payload = {
      ...form,
      publisherId: form.publisherId ? Number(form.publisherId) : undefined,
      adsTxtStatus: form.adsTxtStatus !== '' ? Number(form.adsTxtStatus) : 0,
      partnerStatus: form.partnerStatus !== '' ? Number(form.partnerStatus) : 1,
      status: form.status !== '' ? Number(form.status) : 1,
      url: form.url?.trim() || '',
      developerWeb: form.developerWeb?.trim() || '',
      logo: form.logo?.trim() || '',
      packageName: form.packageName?.trim() || '',
      description: form.description ?? '',
    };

    try {
      setSaving(true);

      const res = await axios.post(`${CONFIG.apiUrl}/v1/admin/inventory`, payload, {
        headers,
        validateStatus: () => true,
      });

      console.log('Create Inventory →', res.status, res.data);

      if (res?.data?.success) {
        toast.success(res.data?.msg || 'Inventory created');
        onSuccess?.();
      } else {
        toast.error(res?.data?.msg || res?.data?.message || 'Create failed');
      }
    } catch (e) {
      console.error('create inventory error:', e);
      toast.error('Something went wrong while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    onClose?.(false);
  };

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
        Add Inventory
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
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12} sm={4}>
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

          <Grid item xs={12} sm={4}>
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

          <Grid item xs={12} sm={6}>
            <TextField
              label="Name"
              fullWidth
              value={form.name}
              onChange={handleChange('name')}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Logo URL"
              fullWidth
              value={form.logo}
              onChange={handleChange('logo')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={8}>
            <TextField
              label="URL (required for WEB)"
              fullWidth
              value={form.url}
              onChange={handleChange('url')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Developer Site"
              fullWidth
              value={form.developerWeb}
              onChange={handleChange('developerWeb')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={8}>
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

          <Grid item xs={12} sm={4}>
            <TextField
              label="Package Name"
              fullWidth
              value={form.packageName}
              onChange={handleChange('packageName')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="ads.txt status"
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
              <MenuItem value={0}>Inactive (0)</MenuItem>
              <MenuItem value={1}>Active (1)</MenuItem>
              <MenuItem value={2}>Blocked (2)</MenuItem>
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
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Saving...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
