// 'use client';

// import axios from 'axios';
// import { toast } from 'react-toastify';
// import { useRouter } from 'next/navigation';
// import { useRef, useState, useEffect, useCallback } from 'react';

// import Box from '@mui/material/Box';
// import Card from '@mui/material/Card';
// import Grid from '@mui/material/Grid';
// import Table from '@mui/material/Table';
// import Stack from '@mui/material/Stack';
// import Avatar from '@mui/material/Avatar';
// import Button from '@mui/material/Button';
// import Dialog from '@mui/material/Dialog';
// import Select from '@mui/material/Select';
// import Tooltip from '@mui/material/Tooltip';
// import Divider from '@mui/material/Divider';
// import TableRow from '@mui/material/TableRow';
// import MenuItem from '@mui/material/MenuItem';
// import Collapse from '@mui/material/Collapse';
// import TableBody from '@mui/material/TableBody';
// import TableCell from '@mui/material/TableCell';
// import TableHead from '@mui/material/TableHead';
// import TextField from '@mui/material/TextField';
// import IconButton from '@mui/material/IconButton';
// import Pagination from '@mui/material/Pagination';
// import InputLabel from '@mui/material/InputLabel';
// import Typography from '@mui/material/Typography';
// import DialogTitle from '@mui/material/DialogTitle';
// import FormControl from '@mui/material/FormControl';
// import DialogActions from '@mui/material/DialogActions';
// import DialogContent from '@mui/material/DialogContent';
// import TableContainer from '@mui/material/TableContainer';
// import CircularProgress from '@mui/material/CircularProgress';

// import { paths } from 'src/routes/paths';

// import { getCookie } from 'src/utils/helper';
// import { fDate, fTime } from 'src/utils/format-time';

// import { CONFIG } from 'src/global-config';
// import { DashboardContent } from 'src/layouts/dashboard';

// import { Iconify } from 'src/components/iconify';
// import LanguageBadge from 'src/components/chip/country-language';
// import CountryBadge from 'src/components/chip/country-badge-chip';
// import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
// import { TwoFAChip, StatusChip } from 'src/components/chip/publisher-chip/publisher-chip';

// import AddPublisherDialog from 'src/sections/dashboard/publishers/child/add-publisher-form-dialog';
// import EditPublisherDialog from 'src/sections/dashboard/publishers/child/edit-publisher-form-dialog';
// import PublisherAvatarSection from 'src/sections/dashboard/publishers/child/publisher-avatar-section';
// import PublisherNotesDialog from 'src/sections/dashboard/publishers/child/dialogs/publisher-notes-dialog'; // ⬅️ NEW

// export function PublisherListView() {
//   const router = useRouter();
//   const token = getCookie('session_key');
//   const headers = {
//     Authorization: `Bearer ${token}`,
//     'Content-Type': 'application/json',
//   };

//   const defaultFilters = {
//     id: '',
//     username: '',
//     email: '',
//     country: '',
//     status: '',
//     twoFA: '',
//     sortBy: 'updatedAt',
//     sortDir: 'desc',
//   };

//   useEffect(() => {
//     fetchPublishers(defaultFilters, 1);
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps

//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalPublishers, setTotalPublishers] = useState(0);
//   const [filters, setFilters] = useState(defaultFilters);
//   const cacheRef = useRef({});
//   const [showFilter, setShowFilter] = useState(false);
//   const [openAdd, setOpenAdd] = useState(false);
//   const [openEdit, setOpenEdit] = useState(false);
//   const [editId, setEditId] = useState(null);
//   const [viewOpen, setViewOpen] = useState(false);
//   const [selected, setSelected] = useState(null);
//   const [deleteId, setDeleteId] = useState(null);
//   const [deleting, setDeleting] = useState(false);

//   // NEW: Notes dialog state
//   const [notesOpen, setNotesOpen] = useState(false);
//   const [notesPublisher, setNotesPublisher] = useState(null);

//   const listUrlApi = `${CONFIG.apiUrl}/v1/admin/publishers`;

//   const openViewDialog = (row) => {
//     setSelected(row);
//     setViewOpen(true);
//   };

//   // NEW: open notes dialog
//   const openNotesDialog = (row) => {
//     setNotesPublisher(row);
//     setNotesOpen(true);
//   };

//   const fetchPublishers = useCallback(
//     async (filter, p = 1, hardReload = false) => {
//       try {
//         const tokenValue = getCookie('session_key');
//         if (!tokenValue) {
//           toast.error('Session expired. Please login again.');
//           router.replace(paths.login.root);
//           return;
//         }

//         setLoading(true);

//         const qp = new URLSearchParams();

//         Object.entries(filter).forEach(([key, value]) => {
//           if (value !== '' && value !== null && value !== undefined) {
//             qp.append(key, value);
//           }
//         });

//         qp.append('page', p);

//         const queryKey = qp.toString();

//         if (cacheRef.current[queryKey] && !hardReload) {
//           const cached = cacheRef.current[queryKey];
//           setRows(cached.rows);
//           setTotalPages(cached.totalPages);
//           setTotalPublishers(cached.totalPublishers ?? 0);
//           setPage(p);
//           setLoading(false);
//           return;
//         }

//         const url = `${listUrlApi}?${queryKey}`;
//         const result = await axios.get(url, {
//           headers,
//           withCredentials: true,
//           validateStatus: () => true,
//         });

//         if (result.status === 401) {
//           toast.error(result?.data?.msg || 'Unauthorized. Please login again.');
//           router.replace(paths.login.root);
//           return;
//         }

//         if (result.data?.success) {
//           const data = result.data?.data || {};
//           const _rows = data.rows || [];
//           const pag = data.pagination || {};
//           const total = pag.totalPages || 1;
//           const totalCount = pag.totalItems ?? data.total ?? _rows.length;

//           cacheRef.current[queryKey] = {
//             rows: _rows,
//             totalPages: total,
//             totalPublishers: totalCount,
//           };

//           setRows(_rows);
//           setTotalPages(total);
//           setTotalPublishers(totalCount);
//           setPage(p);
//         } else {
//           toast.error(result.data?.msg || 'Failed to fetch publishers');
//         }
//       } catch (e) {
//         console.error('error occured in publisher list view during fetching the publisher:', e);
//         toast.error('Fetching error for publishers');
//       } finally {
//         setLoading(false);
//       }
//     },
//     [headers, listUrlApi, router]
//   );

//   const confirmDelete = async () => {
//     try {
//       if (!deleteId) return;
//       setDeleting(true);

//       const result = await axios.delete(`${listUrlApi}/${deleteId}`, {
//         headers,
//         withCredentials: true,
//         validateStatus: () => true,
//       });

//       if (result.status === 401) {
//         toast.error(result?.data?.msg || 'Unauthorized. Please login again.');
//         router.replace(paths.login.root);
//         return;
//       }

//       if (result.data?.success) {
//         toast.success(result.data?.msg || 'Publisher deleted');
//         setDeleteId(null);
//         fetchPublishers(filters, page, true);
//       } else {
//         toast.error(result.data?.msg || 'Failed to delete publisher');
//       }
//     } catch (e) {
//       console.error(
//         'error occured during deleting the user from the list in confirmDelete function:',
//         e
//       );
//       toast.error('Error deleting publisher');
//     } finally {
//       setDeleting(false);
//     }
//   };

//   return (
//     <DashboardContent maxWidth="xl">
//       <CustomBreadcrumbs
//         heading="Publishers"
//         links={[
//           { name: 'Home', href: paths.root },
//           { name: 'Dashboard', href: paths.dashboard.root },
//           { name: 'Publishers', href: paths.dashboard.publisher.list },
//         ]}
//         action={
//           <Box sx={{ display: 'flex', gap: 1 }}>
//             <Button variant="contained" onClick={() => setShowFilter((prev) => !prev)}>
//               <Iconify icon="stash:filter" sx={{ width: 20, mr: 1 }} />
//               {showFilter ? 'Hide Filter' : 'Show Filter'}
//             </Button>

//             <Button
//               variant="contained"
//               onClick={() => {
//                 setEditId(null);
//                 setOpenAdd(true);
//               }}
//             >
//               <Iconify icon="material-symbols:add" sx={{ width: 20, mr: 1 }} />
//               Add
//             </Button>
//           </Box>
//         }
//         sx={{ mb: 2 }}
//       />

//       <Collapse in={showFilter} timeout="auto" unmountOnExit>
//         <Card sx={{ p: 2, mb: 1 }}>
//           <Box
//             sx={{
//               display: 'grid',
//               gap: 2,
//               gridTemplateColumns: {
//                 xs: '1fr',
//                 sm: '1fr 1fr',
//                 md: 'repeat(4, 1fr)',
//               },
//             }}
//           >
//             <TextField
//               label="Publisher ID"
//               type="number"
//               value={filters.id}
//               onChange={(e) =>
//                 setFilters({
//                   ...filters,
//                   id: e.target.value,
//                 })
//               }
//               fullWidth
//             />

//             <TextField
//               label="Username"
//               value={filters.username}
//               onChange={(e) => setFilters({ ...filters, username: e.target.value })}
//               fullWidth
//             />

//             <TextField
//               label="Email"
//               value={filters.email}
//               onChange={(e) => setFilters({ ...filters, email: e.target.value })}
//               fullWidth
//             />

//             <TextField
//               label="Country"
//               placeholder="e.g. IN, US"
//               value={filters.country}
//               onChange={(e) =>
//                 setFilters({
//                   ...filters,
//                   country: e.target.value.toUpperCase(),
//                 })
//               }
//               fullWidth
//             />

//             <FormControl fullWidth>
//               <InputLabel>Status</InputLabel>
//               <Select
//                 label="Status"
//                 value={filters.status}
//                 onChange={(e) => setFilters({ ...filters, status: e.target.value })}
//               >
//                 <MenuItem value="">All</MenuItem>
//                 <MenuItem value={0}>Pending</MenuItem>
//                 <MenuItem value={1}>Active</MenuItem>
//                 <MenuItem value={2}>Suspended</MenuItem>
//                 <MenuItem value={3}>Disabled</MenuItem>
//               </Select>
//             </FormControl>

//             <FormControl fullWidth>
//               <InputLabel>2FA</InputLabel>
//               <Select
//                 label="2FA"
//                 value={filters.twoFA}
//                 onChange={(e) => setFilters({ ...filters, twoFA: e.target.value })}
//               >
//                 <MenuItem value="">All</MenuItem>
//                 <MenuItem value={0}>Disabled</MenuItem>
//                 <MenuItem value={1}>Email</MenuItem>
//                 <MenuItem value={2}>Auth App</MenuItem>
//               </Select>
//             </FormControl>

//             <FormControl fullWidth>
//               <InputLabel>Sort</InputLabel>
//               <Select
//                 label="Sort"
//                 value={filters.sortBy}
//                 onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
//               >
//                 <MenuItem value="id">ID</MenuItem>
//                 <MenuItem value="username">Username</MenuItem>
//                 <MenuItem value="status">Status</MenuItem>
//                 <MenuItem value="updatedAt">Updated</MenuItem>
//                 <MenuItem value="createdAt">Created</MenuItem>
//               </Select>
//             </FormControl>

//             <FormControl fullWidth>
//               <InputLabel>Order</InputLabel>
//               <Select
//                 label="Order"
//                 value={filters.sortDir}
//                 onChange={(e) => setFilters({ ...filters, sortDir: e.target.value })}
//               >
//                 <MenuItem value="asc">Ascending</MenuItem>
//                 <MenuItem value="desc">Descending</MenuItem>
//               </Select>
//             </FormControl>
//           </Box>

//           <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
//             <Button
//               variant="outlined"
//               onClick={() => {
//                 setFilters(defaultFilters);
//                 cacheRef.current = {};
//                 fetchPublishers(defaultFilters, 1, true);
//               }}
//             >
//               Reset
//             </Button>

//             <Button
//               variant="contained"
//               onClick={() => {
//                 cacheRef.current = {};
//                 fetchPublishers(filters, 1, true);
//               }}
//             >
//               Apply
//             </Button>
//           </Box>
//         </Card>
//       </Collapse>

//       <Card
//         sx={{
//           display: 'flex',
//           mb: 2,
//           mt: 2,
//           p: 2,
//           alignItems: 'center',
//           justifyContent: 'space-between',
//         }}
//       >
//         <Box sx={{ display: 'flex', flexDirection: 'column' }}>
//           <Typography sx={{ fontSize: 14 }}>Total Publishers</Typography>
//           <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{totalPublishers}</Typography>
//         </Box>
//         <Box
//           sx={{
//             display: 'flex',
//             p: 2,
//             alignItems: 'center',
//             justifyContent: 'center',
//             borderRadius: '50%',
//             bgcolor: '#3a86aeff',
//             color: '#fff',
//           }}
//         >
//           <Iconify icon="mdi:account-group-outline" />
//         </Box>
//       </Card>

//       {/* TABLE */}
//       <Card>
//         {loading ? (
//           <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
//             <CircularProgress />
//           </Box>
//         ) : (
//           <TableContainer>
//             <Table>
//               <TableHead>
//                 <TableRow>
//                   <TableCell>ID</TableCell>
//                   <TableCell>Publisher</TableCell>
//                   <TableCell>Phone</TableCell>
//                   <TableCell>Gender</TableCell>
//                   <TableCell>Country</TableCell>
//                   <TableCell>Language</TableCell>
//                   <TableCell>2FA</TableCell>
//                   <TableCell>Status</TableCell>
//                   <TableCell>Last Active</TableCell>
//                   <TableCell>Updated</TableCell>
//                   <TableCell align="right">Actions</TableCell>
//                 </TableRow>
//               </TableHead>

//               <TableBody>
//                 {rows.length ? (
//                   rows.map((r) => (
//                     <TableRow key={r.id} hover>
//                       <TableCell>{r.id}</TableCell>

//                       <TableCell>
//                         <Stack direction="row" spacing={1.5} alignItems="center">
//                           <PublisherAvatarSection row={r} size={32} />
//                           <Box>
//                             <Typography variant="body2" fontWeight={600}>
//                               {r.username}
//                             </Typography>
//                             <Typography variant="caption" color="text.secondary">
//                               {r.email || '—'}
//                             </Typography>
//                           </Box>
//                         </Stack>
//                       </TableCell>

//                       <TableCell>
//                         <Typography variant="body2">{r.phoneNo || '—'}</Typography>
//                       </TableCell>

//                       <TableCell>
//                         <Typography variant="body2">{r.gender || '—'}</Typography>
//                       </TableCell>

//                       <TableCell>
//                         {r.country ? (
//                           <CountryBadge code={r.country} size={25} showPhone={false} />
//                         ) : (
//                           '—'
//                         )}
//                       </TableCell>

//                       <TableCell>
//                         {r.language ? <LanguageBadge code={r.language} /> : '—'}
//                       </TableCell>

//                       <TableCell>
//                         <TwoFAChip value={r.twoFactorEnabled} />
//                       </TableCell>

//                       <TableCell>
//                         <StatusChip value={r.status} />
//                       </TableCell>

//                       <TableCell>
//                         <Typography variant="body2">{r.lastActiveAt || '—'}</Typography>
//                       </TableCell>

//                       <TableCell>
//                         {r.updatedAt ? (
//                           <Stack spacing={0}>
//                             <Typography variant="body2">{fDate(r.updatedAt)}</Typography>
//                             <Typography variant="caption" color="text.secondary">
//                               {fTime(r.updatedAt)}
//                             </Typography>
//                           </Stack>
//                         ) : (
//                           '—'
//                         )}
//                       </TableCell>

//                       <TableCell align="right">
//                         <Stack direction="row" spacing={0.5} justifyContent="flex-end">
//                           {/* NEW: Notes button */}
//                           <Tooltip title="Notes">
//                             <IconButton size="small" onClick={() => openNotesDialog(r)}>
//                               <Iconify icon="mdi:note-edit-outline" />
//                             </IconButton>
//                           </Tooltip>

//                           <Tooltip title="View">
//                             <IconButton size="small" onClick={() => openViewDialog(r)}>
//                               <Iconify icon="solar:eye-bold" />
//                             </IconButton>
//                           </Tooltip>

//                           <Tooltip title="Edit">
//                             <IconButton
//                               size="small"
//                               onClick={() => {
//                                 setEditId(r.id);
//                                 setOpenEdit(true);
//                               }}
//                             >
//                               <Iconify icon="mdi:pencil" />
//                             </IconButton>
//                           </Tooltip>

//                           <Tooltip title="Delete">
//                             <IconButton
//                               size="small"
//                               color="error"
//                               onClick={() => setDeleteId(r.id)}
//                             >
//                               <Iconify icon="mdi:delete-outline" />
//                             </IconButton>
//                           </Tooltip>
//                         </Stack>
//                       </TableCell>
//                     </TableRow>
//                   ))
//                 ) : (
//                   <TableRow>
//                     <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
//                       No publishers found.
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         )}
//       </Card>

//       {/* PAGINATION */}
//       <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
//         <Pagination
//           count={totalPages}
//           page={page}
//           onChange={(_, p) => fetchPublishers(filters, p)}
//         />
//       </Box>

//       {/* ADD / EDIT DIALOGS */}
//       <AddPublisherDialog
//         open={openAdd}
//         onClose={() => setOpenAdd(false)}
//         onSuccess={() => {
//           setOpenAdd(false);
//           fetchPublishers(filters, page, true);
//         }}
//       />

//       <EditPublisherDialog
//         open={openEdit}
//         id={editId}
//         onClose={() => setOpenEdit(false)}
//         onSuccess={() => {
//           setOpenEdit(false);
//           fetchPublishers(filters, page, true);
//         }}
//       />

//       {/* VIEW PUBLISHER DETAILS */}
//       <Dialog
//         fullWidth
//         maxWidth="sm"
//         open={viewOpen}
//         onClose={() => setViewOpen(false)}
//         PaperProps={{ sx: { borderRadius: 3 } }}
//       >
//         <DialogTitle>Publisher #{selected?.id}</DialogTitle>

//         <DialogContent dividers>
//           {selected && (
//             <Stack spacing={2}>
//               <Stack direction="row" spacing={2} alignItems="center">
//                 <Avatar
//                   src={
//                     selected.avatar
//                       ? `${CONFIG.assetsUrl}/upload/publishers/${selected.avatar}`
//                       : undefined
//                   }
//                   sx={{ width: 64, height: 64, fontWeight: 700 }}
//                 >
//                   {!selected.avatar && (selected.username?.[0]?.toUpperCase?.() || '?')}
//                 </Avatar>

//                 <Box>
//                   <Typography variant="h6">{selected.username}</Typography>
//                   <Typography variant="body2" color="text.secondary">
//                     {selected.email || '—'}
//                   </Typography>
//                 </Box>
//               </Stack>

//               <Divider />

//               <Grid container spacing={1.5}>
//                 <Grid item xs={6}>
//                   <Typography variant="body2" color="text.secondary">
//                     Country
//                   </Typography>

//                   {selected.country ? (
//                     <CountryBadge code={selected.country} size={30} showPhone sx={{ mt: 0.5 }} />
//                   ) : (
//                     <Typography variant="body2" fontWeight={600}>
//                       —
//                     </Typography>
//                   )}
//                 </Grid>

//                 <Grid item xs={6}>
//                   <Typography variant="body2" color="text.secondary">
//                     Language
//                   </Typography>
//                   {selected.language ? (
//                     <LanguageBadge code={selected.language} size={30} showPhone sx={{ mt: 0.5 }} />
//                   ) : (
//                     <Typography variant="body2" fontWeight={600}>
//                       —
//                     </Typography>
//                   )}
//                 </Grid>

//                 <Grid item xs={6}>
//                   <Typography variant="body2" color="text.secondary">
//                     Status
//                   </Typography>
//                   <StatusChip value={selected.status} />
//                 </Grid>

//                 <Grid item xs={6}>
//                   <Typography variant="body2" color="text.secondary">
//                     2FA
//                   </Typography>
//                   <TwoFAChip value={selected.twoFactorEnabled} />
//                 </Grid>

//                 <Grid item xs={12}>
//                   <Typography variant="body2" color="text.secondary">
//                     Updated
//                   </Typography>
//                   <Typography variant="body2" fontWeight={600}>
//                     {selected.updatedAt
//                       ? `${fDate(selected.updatedAt)} ${fTime(selected.updatedAt)}`
//                       : '—'}
//                   </Typography>
//                 </Grid>

//                 <Grid item xs={12}>
//                   <Typography variant="body2" color="text.secondary">
//                     Created
//                   </Typography>
//                   <Typography variant="body2" fontWeight={600}>
//                     {selected.createdAt
//                       ? `${fDate(selected.createdAt)} ${fTime(selected.createdAt)}`
//                       : '—'}
//                   </Typography>
//                 </Grid>
//               </Grid>
//             </Stack>
//           )}
//         </DialogContent>

//         <DialogActions>
//           <Button onClick={() => setViewOpen(false)}>Close</Button>
//         </DialogActions>
//       </Dialog>

//       {/* DELETE CONFIRM */}
//       <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
//         <DialogTitle>Delete Publisher</DialogTitle>
//         <DialogContent>Are you sure you want to delete this publisher?</DialogContent>
//         <DialogActions>
//           <Button onClick={() => setDeleteId(null)} disabled={deleting}>
//             Cancel
//           </Button>
//           <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>
//             {deleting ? 'Deleting…' : 'Delete'}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* PUBLISHER NOTES DIALOG */}
//       <PublisherNotesDialog
//         open={notesOpen}
//         publisher={notesPublisher}
//         headers={headers}
//         onClose={() => {
//           setNotesOpen(false);
//           setNotesPublisher(null);
//         }}
//       />
//     </DashboardContent>
//   );
// }

'use client';

import axios from 'axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Pagination from '@mui/material/Pagination';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { getCookie } from 'src/utils/helper';
import { fDate, fTime } from 'src/utils/format-time';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import LanguageBadge from 'src/components/chip/country-language';
import CountryBadge from 'src/components/chip/country-badge-chip';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { TwoFAChip, StatusChip } from 'src/components/chip/publisher-chip/publisher-chip';
import PublisherByPartnerSelector from 'src/components/selectors/publisher/publisher-by-partner-selector';

import AddPublisherDialog from 'src/sections/dashboard/publishers/child/add-publisher-form-dialog';
import EditPublisherDialog from 'src/sections/dashboard/publishers/child/edit-publisher-form-dialog';
import PublisherAvatarSection from 'src/sections/dashboard/publishers/child/publisher-avatar-section';
import PublisherNotesDialog from 'src/sections/dashboard/publishers/child/dialogs/publisher-notes-dialog';

export function PublisherListView() {
  const router = useRouter();
  const token = getCookie('session_key');
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const defaultFilters = {
    id: '',
    username: '',
    email: '',
    country: '',
    status: '',
    twoFA: '',
    sortBy: 'updatedAt',
    sortDir: 'desc',
  };

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPublishers, setTotalPublishers] = useState(0);
  const [filters, setFilters] = useState(defaultFilters);
  const cacheRef = useRef({});
  const [showFilter, setShowFilter] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Notes dialog state
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesPublisher, setNotesPublisher] = useState(null);

  const listUrlApi = `${CONFIG.apiUrl}/v1/admin/publishers`;

  useEffect(() => {
    fetchPublishers(defaultFilters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPublishers = useCallback(
    async (filter, p = 1, hardReload = false) => {
      try {
        const tokenValue = getCookie('session_key');
        if (!tokenValue) {
          toast.error('Session expired. Please login again.');
          router.replace(paths.login.root);
          return;
        }

        setLoading(true);

        const qp = new URLSearchParams();

        Object.entries(filter).forEach(([key, value]) => {
          if (value !== '' && value !== null && value !== undefined) {
            qp.append(key, value);
          }
        });

        qp.append('page', p);

        const queryKey = qp.toString();

        if (cacheRef.current[queryKey] && !hardReload) {
          const cached = cacheRef.current[queryKey];
          setRows(cached.rows);
          setTotalPages(cached.totalPages);
          setTotalPublishers(cached.totalPublishers ?? 0);
          setPage(p);
          setLoading(false);
          return;
        }

        const url = `${listUrlApi}?${queryKey}`;
        const result = await axios.get(url, {
          headers,
          withCredentials: true,
          validateStatus: () => true,
        });

        if (result.status === 401) {
          toast.error(result?.data?.msg || 'Unauthorized. Please login again.');
          router.replace(paths.login.root);
          return;
        }

        if (result.data?.success) {
          const data = result.data?.data || {};
          const _rows = data.rows || [];
          const pag = data.pagination || {};
          const total = pag.totalPages || 1;
          const totalCount = pag.totalItems ?? data.total ?? _rows.length;

          cacheRef.current[queryKey] = {
            rows: _rows,
            totalPages: total,
            totalPublishers: totalCount,
          };

          setRows(_rows);
          setTotalPages(total);
          setTotalPublishers(totalCount);
          setPage(p);
        } else {
          toast.error(result.data?.msg || 'Failed to fetch publishers');
        }
      } catch (e) {
        console.error('error occured in publisher list view during fetching the publisher:', e);
        toast.error('Fetching error for publishers');
      } finally {
        setLoading(false);
      }
    },
    [headers, listUrlApi, router]
  );

  const openViewDialog = (row) => {
    setSelected(row);
    setViewOpen(true);
  };

  const openNotesDialog = (row) => {
    setNotesPublisher(row);
    setNotesOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (!deleteId) return;
      setDeleting(true);

      const result = await axios.delete(`${listUrlApi}/${deleteId}`, {
        headers,
        withCredentials: true,
        validateStatus: () => true,
      });

      if (result.status === 401) {
        toast.error(result?.data?.msg || 'Unauthorized. Please login again.');
        router.replace(paths.login.root);
        return;
      }

      if (result.data?.success) {
        toast.success(result.data?.msg || 'Publisher deleted');
        setDeleteId(null);
        fetchPublishers(filters, page, true);
      } else {
        toast.error(result.data?.msg || 'Failed to delete publisher');
      }
    } catch (e) {
      console.error(
        'error occured during deleting the user from the list in confirmDelete function:',
        e
      );
      toast.error('Error deleting publisher');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Publishers"
        links={[
          { name: 'Home', href: paths.root },
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Publishers', href: paths.dashboard.publisher.list },
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={() => setShowFilter((prev) => !prev)}>
              <Iconify icon="stash:filter" sx={{ width: 20, mr: 1 }} />
              {showFilter ? 'Hide Filter' : 'Show Filter'}
            </Button>

            <Button
              variant="contained"
              onClick={() => {
                setEditId(null);
                setOpenAdd(true);
              }}
            >
              <Iconify icon="material-symbols:add" sx={{ width: 20, mr: 1 }} />
              Add
            </Button>
          </Box>
        }
        sx={{ mb: 2 }}
      />

      {/* FILTERS */}
      <Collapse in={showFilter} timeout="auto" unmountOnExit>
        <Card sx={{ p: 2, mb: 1 }}>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: 'repeat(4, 1fr)',
              },
            }}
          >
            {/* Publisher ID (manual) */}
            <TextField
              label="Publisher ID"
              type="number"
              value={filters.id}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  id: e.target.value,
                })
              }
              fullWidth
            />

            {/* 🔥 NEW: Publisher selector by PARTNER (id / username) */}
            <PublisherByPartnerSelector
              label="Publisher "
              placeholder="Type partner ID or username…"
              valueId={filters.id ? Number(filters.id) : undefined}
              onPublisherSelect={(publisherId) => {
                const nextFilters = {
                  ...filters,
                  id: publisherId || '',
                };
                setFilters(nextFilters);
                setPage(1);
                cacheRef.current = {};
              }}
            />

            <TextField
              label="Username"
              value={filters.username}
              onChange={(e) => setFilters({ ...filters, username: e.target.value })}
              fullWidth
            />

            <TextField
              label="Email"
              value={filters.email}
              onChange={(e) => setFilters({ ...filters, email: e.target.value })}
              fullWidth
            />

            <TextField
              label="Country"
              placeholder="e.g. IN, US"
              value={filters.country}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  country: e.target.value.toUpperCase(),
                })
              }
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value={0}>Pending</MenuItem>
                <MenuItem value={1}>Active</MenuItem>
                <MenuItem value={2}>Suspended</MenuItem>
                <MenuItem value={3}>Disabled</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>2FA</InputLabel>
              <Select
                label="2FA"
                value={filters.twoFA}
                onChange={(e) => setFilters({ ...filters, twoFA: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value={0}>Disabled</MenuItem>
                <MenuItem value={1}>Email</MenuItem>
                <MenuItem value={2}>Auth App</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Sort</InputLabel>
              <Select
                label="Sort"
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                <MenuItem value="id">ID</MenuItem>
                <MenuItem value="username">Username</MenuItem>
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="updatedAt">Updated</MenuItem>
                <MenuItem value="createdAt">Created</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Order</InputLabel>
              <Select
                label="Order"
                value={filters.sortDir}
                onChange={(e) => setFilters({ ...filters, sortDir: e.target.value })}
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setFilters(defaultFilters);
                cacheRef.current = {};
                fetchPublishers(defaultFilters, 1, true);
              }}
            >
              Reset
            </Button>

            <Button
              variant="contained"
              onClick={() => {
                cacheRef.current = {};
                fetchPublishers(filters, 1, true);
              }}
            >
              Apply
            </Button>
          </Box>
        </Card>
      </Collapse>

      {/* KPI CARD */}
      <Card
        sx={{
          display: 'flex',
          mb: 2,
          mt: 2,
          p: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ fontSize: 14 }}>Total Publishers</Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{totalPublishers}</Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            p: 2,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: '#3a86aeff',
            color: '#fff',
          }}
        >
          <Iconify icon="mdi:account-group-outline" />
        </Box>
      </Card>

      {/* TABLE */}
      <Card>
        {loading ? (
          <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Publisher</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>2FA</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Active</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.length ? (
                  rows.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>{r.id}</TableCell>

                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <PublisherAvatarSection row={r} size={32} />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {r.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {r.email || '—'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">{r.phoneNo || '—'}</Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">{r.gender || '—'}</Typography>
                      </TableCell>

                      <TableCell>
                        {r.country ? (
                          <CountryBadge code={r.country} size={25} showPhone={false} />
                        ) : (
                          '—'
                        )}
                      </TableCell>

                      <TableCell>
                        {r.language ? <LanguageBadge code={r.language} /> : '—'}
                      </TableCell>

                      <TableCell>
                        <TwoFAChip value={r.twoFactorEnabled} />
                      </TableCell>

                      <TableCell>
                        <StatusChip value={r.status} />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">{r.lastActiveAt || '—'}</Typography>
                      </TableCell>

                      <TableCell>
                        {r.updatedAt ? (
                          <Stack spacing={0}>
                            <Typography variant="body2">{fDate(r.updatedAt)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {fTime(r.updatedAt)}
                            </Typography>
                          </Stack>
                        ) : (
                          '—'
                        )}
                      </TableCell>

                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {/* Notes */}
                          <Tooltip title="Notes">
                            <IconButton size="small" onClick={() => openNotesDialog(r)}>
                              <Iconify icon="mdi:note-edit-outline" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => openViewDialog(r)}>
                              <Iconify icon="solar:eye-bold" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditId(r.id);
                                setOpenEdit(true);
                              }}
                            >
                              <Iconify icon="mdi:pencil" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteId(r.id)}
                            >
                              <Iconify icon="mdi:delete-outline" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                      No publishers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* PAGINATION */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, p) => fetchPublishers(filters, p)}
        />
      </Box>

      {/* ADD / EDIT DIALOGS */}
      <AddPublisherDialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={() => {
          setOpenAdd(false);
          fetchPublishers(filters, page, true);
        }}
      />

      <EditPublisherDialog
        open={openEdit}
        id={editId}
        onClose={() => setOpenEdit(false)}
        onSuccess={() => {
          setOpenEdit(false);
          fetchPublishers(filters, page, true);
        }}
      />

      {/* VIEW PUBLISHER DETAILS */}
      <Dialog
        fullWidth
        maxWidth="sm"
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Publisher #{selected?.id}</DialogTitle>

        <DialogContent dividers>
          {selected && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={
                    selected.avatar
                      ? `${CONFIG.assetsUrl}/upload/publishers/${selected.avatar}`
                      : undefined
                  }
                  sx={{ width: 64, height: 64, fontWeight: 700 }}
                >
                  {!selected.avatar && (selected.username?.[0]?.toUpperCase?.() || '?')}
                </Avatar>

                <Box>
                  <Typography variant="h6">{selected.username}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selected.email || '—'}
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Country
                  </Typography>

                  {selected.country ? (
                    <CountryBadge code={selected.country} size={30} showPhone sx={{ mt: 0.5 }} />
                  ) : (
                    <Typography variant="body2" fontWeight={600}>
                      —
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Language
                  </Typography>
                  {selected.language ? (
                    <LanguageBadge code={selected.language} size={30} showPhone sx={{ mt: 0.5 }} />
                  ) : (
                    <Typography variant="body2" fontWeight={600}>
                      —
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <StatusChip value={selected.status} />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    2FA
                  </Typography>
                  <TwoFAChip value={selected.twoFactorEnabled} />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Updated
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selected.updatedAt
                      ? `${fDate(selected.updatedAt)} ${fTime(selected.updatedAt)}`
                      : '—'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selected.createdAt
                      ? `${fDate(selected.createdAt)} ${fTime(selected.createdAt)}`
                      : '—'}
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Publisher</DialogTitle>
        <DialogContent>Are you sure you want to delete this publisher?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PUBLISHER NOTES DIALOG */}
      <PublisherNotesDialog
        open={notesOpen}
        publisher={notesPublisher}
        headers={headers}
        onClose={() => {
          setNotesOpen(false);
          setNotesPublisher(null);
        }}
      />
    </DashboardContent>
  );
}
