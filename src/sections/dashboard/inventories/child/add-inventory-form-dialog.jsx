// 'use client';

// import axios from 'axios';
// import { toast } from 'react-toastify';
// import { useMemo, useState, useEffect } from 'react';

// import {
//   Box,
//   Slide,
//   Button,
//   Dialog,
//   Divider,
//   MenuItem,
//   TextField,
//   IconButton,
//   Typography,
//   DialogTitle,
//   DialogActions,
//   DialogContent,
// } from '@mui/material';

// import { getCookie } from 'src/utils/helper';

// import { CONFIG } from 'src/global-config';

// import { Iconify } from 'src/components/iconify';
// import PublisherInventorySelector from 'src/components/selectors/inventory/publisher-selector';

// const TYPES = [
//   { label: 'WEB', value: 'WEB' },
//   { label: 'APP', value: 'APP' },
//   { label: 'OTT/CTV', value: 'OTT_CTV' },
// ];

// const STATUS = [
//   { label: 'Inactive', value: 0 },
//   { label: 'Active', value: 1 },
//   { label: 'Blocked', value: 2 },
// ];

// const PARTNER_STATUS = [
//   { label: 'Inactive (0)', value: 0 },
//   { label: 'Active (1)', value: 1 },
//   { label: 'Blocked (2)', value: 2 },
// ];

// const INITIAL_FORM = {
//   publisherId: '',
//   type: 'WEB',
//   name: '',
//   url: '',
//   description: '',
//   partnerStatus: 1,
//   status: 1,
// };

// export default function AddInventoryFormDialog({ open, onClose, onSuccess }) {
//   const [form, setForm] = useState(INITIAL_FORM);
//   const [saving, setSaving] = useState(false);
//   const [selectedInventory, setSelectedInventory] = useState(null);

//   const token = getCookie('session_key');
//   const headers = useMemo(
//     () => ({
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${token}`,
//     }),
//     [token]
//   );

//   useEffect(() => {
//     if (open) {
//       setForm(INITIAL_FORM);
//       setSelectedInventory(null);
//     }
//   }, [open]);

//   const validate = () => {
//     if (!form.publisherId) return 'Publisher is required';
//     if (!form.type) return 'Type is required';
//     if (!form.name) return 'Inventory name is required';
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
//       url: form.url?.trim() || '',
//       description: form.description ?? '',
//     };

//     try {
//       setSaving(true);

//       const res = await axios.post(`${CONFIG.apiUrl}/v1/admin/inventory`, payload, {
//         headers,
//         validateStatus: () => true,
//       });

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

//   const handleClose = () => {
//     if (saving) return;
//     onClose?.(false);
//   };

//   return (
//     <Dialog
//       open={open}
//       onClose={handleClose}
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
//         Properties
//         <Box sx={{ flex: 1 }} />
//         <IconButton
//           aria-label="Close"
//           onClick={handleClose}
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
//         {/* 2-column layout exactly like the screenshot */}
//         <Box
//           sx={{
//             display: 'grid',
//             gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
//             columnGap: 2,
//             rowGap: 2,
//             pt: 1,
//           }}
//         >
//           {/* Upload photo – left col, spans 2 rows */}
//           <Box
//             sx={(theme) => ({
//               gridColumn: { xs: '1 / -1', sm: '1 / 2' },
//               gridRow: { xs: 'auto', sm: '1 / 3' },
//               borderRadius: 2,
//               border: `1px dashed ${theme.palette.divider}`,
//               bgcolor: theme.palette.background.paper,
//               display: 'flex',
//               flexDirection: 'column',
//               alignItems: 'center',
//               justifyContent: 'center',
//               textAlign: 'center',
//               px: 2,
//               py: 3,
//             })}
//           >
//             <Iconify icon="mdi:cloud-upload-outline" width={30} />
//             <Typography variant="subtitle2" sx={{ mt: 1 }}>
//               Upload photo
//             </Typography>
//             <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
//               Allowed *.jpeg, *.jpg, *.png, *.gif, max size of 3 Mb
//             </Typography>
//           </Box>

//           {/* Inventory Name – right, row 1 */}
//           <Box
//             sx={{
//               gridColumn: { xs: '1 / -1', sm: '2 / 3' },
//               gridRow: { xs: 'auto', sm: '1 / 2' },
//             }}
//           >
//             <TextField
//               fullWidth
//               label="Inventory Name"
//               value={form.name}
//               onChange={handleChange('name')}
//               InputLabelProps={{ shrink: true }}
//               required
//             />
//           </Box>

//           {/* Type – right, row 2 */}
//           <Box
//             sx={{
//               gridColumn: { xs: '1 / -1', sm: '2 / 3' },
//               gridRow: { xs: 'auto', sm: '2 / 3' },
//             }}
//           >
//             <TextField
//               select
//               fullWidth
//               label="Type"
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
//           </Box>

//           {/* Partner Status – left, row 3 */}
//           <Box
//             sx={{
//               gridColumn: { xs: '1 / -1', sm: '1 / 2' },
//             }}
//           >
//             <TextField
//               select
//               fullWidth
//               label="Partner Status"
//               value={form.partnerStatus}
//               onChange={handleChange('partnerStatus')}
//               InputLabelProps={{ shrink: true }}
//             >
//               {PARTNER_STATUS.map((s) => (
//                 <MenuItem key={s.value} value={s.value}>
//                   {s.label}
//                 </MenuItem>
//               ))}
//             </TextField>
//           </Box>

//           {/* URL – right, row 3 */}
//           <Box
//             sx={{
//               gridColumn: { xs: '1 / -1', sm: '2 / 3' },
//             }}
//           >
//             <TextField
//               fullWidth
//               label="URL"
//               value={form.url}
//               onChange={handleChange('url')}
//               InputLabelProps={{ shrink: true }}
//             />
//           </Box>

//           {/* Status – left, row 4 */}
//           <Box
//             sx={{
//               gridColumn: { xs: '1 / -1', sm: '1 / 2' },
//             }}
//           >
//             <TextField
//               select
//               fullWidth
//               label="Status"
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
//           </Box>

//           {/* Publisher – right, row 4 (selector) */}
//           <Box
//             sx={{
//               gridColumn: { xs: '1 / -1', sm: '2 / 3' },
//             }}
//           >
//             <PublisherInventorySelector
//               label="Publisher"
//               placeholder="Type publisher ID or username…"
//               fullWidth
//               statusFilter={1} // only active, change if needed
//               valueId={selectedInventory?.id}
//               onInventorySelect={(inventoryId, inventory) => {
//                 setSelectedInventory(inventory || null);
//                 setForm((prev) => ({
//                   ...prev,
//                   publisherId: inventory?.publisherId || '',
//                 }));
//               }}
//             />
//           </Box>

//           {/* Description – full width bottom row */}
//           <Box
//             sx={{
//               gridColumn: '1 / -1',
//             }}
//           >
//             <TextField
//               fullWidth
//               label="Description"
//               multiline
//               minRows={3}
//               value={form.description}
//               onChange={handleChange('description')}
//               InputLabelProps={{ shrink: true }}
//             />
//           </Box>
//         </Box>
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
//         <Button onClick={handleClose} disabled={saving}>
//           Cancel
//         </Button>
//         <Button
//           onClick={handleSave}
//           variant="contained"
//           disabled={saving}
//           startIcon={<Iconify icon="mdi:plus" />}
//         >
//           {saving ? 'Saving...' : 'Add'}
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
import PublisherInventorySelector from 'src/components/selectors/inventory/publisher-selector';

// 👇 avatar + crop section (ADD mode: returns blob to parent)
import InventoryAvatarSection from 'src/sections/dashboard/inventories/child/inventory-avatar-section';

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

const PARTNER_STATUS = [
  { label: 'Inactive ', value: 0 },
  { label: 'Active ', value: 1 },
  { label: 'Blocked ', value: 2 },
];

const INITIAL_FORM = {
  publisherId: '',
  type: 'WEB',
  name: '',
  url: '',
  description: '',
  partnerStatus: 1,
  status: 1,
};

export default function AddInventoryFormDialog({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);

  // 👇 logo state for ADD mode
  const [avatarPreview, setAvatarPreview] = useState('');
  const [croppedLogoBlob, setCroppedLogoBlob] = useState(null); // Blob | null

  const token = getCookie('session_key');

  // 👇 DO NOT set Content-Type manually when using FormData
  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  useEffect(() => {
    if (open) {
      setForm(INITIAL_FORM);
      setSelectedInventory(null);
      setAvatarPreview('');
      setCroppedLogoBlob(null);
    }
  }, [open]);

  const validate = () => {
    if (!form.publisherId) return 'Publisher is required';
    if (!form.type) return 'Type is required';
    if (!form.name) return 'Inventory name is required';
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

    try {
      setSaving(true);

      // 👇 Use FormData so we can send `logo` file
      const formData = new FormData();

      formData.append('publisherId', String(form.publisherId));
      formData.append('type', form.type);
      formData.append('name', form.name.trim());

      if (form.url) {
        formData.append('url', form.url.trim());
      }
      if (form.description) {
        formData.append('description', form.description);
      }

      formData.append('partnerStatus', String(form.partnerStatus));
      formData.append('status', String(form.status));

      // 👇 attach cropped logo if user uploaded one
      if (croppedLogoBlob) {
        formData.append('logo', croppedLogoBlob, 'inventory-logo.jpg');
      }

      const res = await axios.post(`${CONFIG.apiUrl}/v1/admin/inventory`, formData, {
        headers: authHeaders,
        validateStatus: () => true,
      });

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
        Properties
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
        {/* 2-column layout exactly like the screenshot */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            columnGap: 2,
            rowGap: 2,
            pt: 1,
          }}
        >
          {/* LEFT: Upload logo / avatar (now real component) */}
          <Box
            sx={(theme) => ({
              gridColumn: { xs: '1 / -1', sm: '1 / 2' },
              gridRow: { xs: 'auto', sm: '1 / 3' },
              borderRadius: 2,
              border: `1px dashed ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper,
              px: 2,
              py: 2,
            })}
          >
            <InventoryAvatarSection
              inventoryId={undefined} // ADD mode → only crop + return blob
              token={token}
              name={form.name}
              url={form.url}
              previewUrl={avatarPreview}
              onPreviewChange={setAvatarPreview}
              onAvatarFilenameChange={() => {}}
              onCroppedBlobChange={setCroppedLogoBlob}
            />

            {/* Optional tiny helper text below, if you want */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: 'block', textAlign: 'center' }}
            >
              Allowed *.jpeg, *.jpg, *.png, max size of 3 Mb
            </Typography>
          </Box>

          {/* Inventory Name – right, row 1 */}
          <Box
            sx={{
              gridColumn: { xs: '1 / -1', sm: '2 / 3' },
              gridRow: { xs: 'auto', sm: '1 / 2' },
            }}
          >
            <TextField
              fullWidth
              label="Inventory Name"
              value={form.name}
              onChange={handleChange('name')}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Box>

          {/* Type – right, row 2 */}
          <Box
            sx={{
              gridColumn: { xs: '1 / -1', sm: '2 / 3' },
              gridRow: { xs: 'auto', sm: '2 / 3' },
            }}
          >
            <TextField
              select
              fullWidth
              label="Type"
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
          </Box>

          {/* Partner Status – left, row 3 */}
          <Box
            sx={{
              gridColumn: { xs: '1 / -1', sm: '1 / 2' },
            }}
          >
            <TextField
              select
              fullWidth
              label="Partner Status"
              value={form.partnerStatus}
              onChange={handleChange('partnerStatus')}
              InputLabelProps={{ shrink: true }}
            >
              {PARTNER_STATUS.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* URL – right, row 3 */}
          <Box
            sx={{
              gridColumn: { xs: '1 / -1', sm: '2 / 3' },
            }}
          >
            <TextField
              fullWidth
              label="URL"
              value={form.url}
              onChange={handleChange('url')}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {/* Status – left, row 4 */}
          <Box
            sx={{
              gridColumn: { xs: '1 / -1', sm: '1 / 2' },
            }}
          >
            <TextField
              select
              fullWidth
              label="Status"
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
          </Box>

          {/* Publisher – right, row 4 (selector) */}
          <Box
            sx={{
              gridColumn: { xs: '1 / -1', sm: '2 / 3' },
            }}
          >
            <PublisherInventorySelector
              label="Publisher"
              placeholder="Type publisher ID or username…"
              fullWidth
              statusFilter={1} // only active, change if needed
              valueId={selectedInventory?.id}
              onInventorySelect={(inventoryId, inventory) => {
                setSelectedInventory(inventory || null);
                setForm((prev) => ({
                  ...prev,
                  publisherId: inventory?.publisherId || '',
                }));
              }}
            />
          </Box>

          {/* Description – full width bottom row */}
          <Box
            sx={{
              gridColumn: '1 / -1',
            }}
          >
            <TextField
              fullWidth
              label="Description"
              multiline
              minRows={3}
              value={form.description}
              onChange={handleChange('description')}
              InputLabelProps={{ shrink: true }}
            />
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
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          startIcon={<Iconify icon="mdi:plus" />}
        >
          {saving ? 'Saving...' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
