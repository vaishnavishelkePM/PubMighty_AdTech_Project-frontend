'use client';

import axios from 'axios';
import { toast } from 'react-toastify';
import { getCookie } from 'minimal-shared';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import {
  Grid,
  Card,
  Chip,
  Stack,
  Table,
  Button,
  Select,
  Avatar,
  Tooltip,
  MenuItem,
  Collapse,
  TableRow,
  TextField,
  TableCell,
  TableBody,
  TableHead,
  InputLabel,
  Typography,
  Pagination,
  IconButton,
  FormControl,
  ListItemText,
  PaginationItem,
  TableContainer,
} from '@mui/material';

import { fDate, fTime } from 'src/utils/format-time';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { TableNoData } from 'src/components/table';
import LanguageBadge from 'src/components/chip/country-language';
import CountryBadge from 'src/components/chip/country-badge-chip';
import TableSkeleton from 'src/components/skeletons/table-skeleton';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { twoFaLabel, StatusChip } from 'src/components/chip/partner-chip/partner-chip';
import PartnerByPublisherSelector from 'src/components/selectors/partner/partner-by-publisher-selector';

// Dialog components
import AddPartnerFormDialog from './child/add-partner-for-dialog';
import PartnerViewDialog from './child/dialogs/partnerView-dialog';
import EditPartnerFormDialog from './child/edit-partner-form-dialog';
import PartnerNotesDialog from './child/dialogs/partner-notes-dialog';
import PartnerAvatarPreviewDialog from './child/dialogs/partner-avatar-view-dialog';
import DeletePartnerConfirmDialog from './child/dialogs/delete-partner-confirm-dialog';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Pending ', value: 0 },
  { label: 'Active ', value: 1 },
  { label: 'Suspended ', value: 2 },
  { label: 'Disabled ', value: 3 },
];

const TWO_FA_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Off ', value: 0 },
  { label: 'App ', value: 1 },
  { label: 'Email ', value: 2 },
];

const SORT_BY_OPTIONS = [
  { label: 'ID', value: 'id' },
  { label: 'Username', value: 'username' },
  { label: 'Email', value: 'email' },
  { label: 'Status', value: 'status' },
  { label: 'Last Active', value: 'lastActiveAt' },
  { label: 'Created At', value: 'createdAt' },
];

const SORT_DIR_OPTIONS = [
  { label: 'Ascending', value: 'asc' },
  { label: 'Descending', value: 'desc' },
];

function buildQuery(filters = {}) {
  const qs = new URLSearchParams();

  ['partnerId', 'username', 'email', 'country'].forEach((k) => {
    const v = (filters[k] ?? '').toString().trim();
    if (v) qs.append(k, v);
  });

  if (filters.status !== '' && filters.status !== null && typeof filters.status !== 'undefined') {
    qs.append('status', String(filters.status));
  }
  if (
    filters.twoFactorEnabled !== '' &&
    filters.twoFactorEnabled !== null &&
    typeof filters.twoFactorEnabled !== 'undefined'
  ) {
    qs.append('twoFactorEnabled', String(filters.twoFactorEnabled));
  }

  if (filters.sortBy) {
    qs.append('sortBy', filters.sortBy);
  }
  if (filters.sortDir) {
    qs.append('sortDir', filters.sortDir);
  }

  return qs.toString();
}

// ----------------------------------------------------------------------

export default function PartnersView() {
  const token = getCookie('session_key');

  const defaultFilters = {
    partnerId: '',
    username: '',
    email: '',
    country: '',
    status: '',
    twoFactorEnabled: '',
    sortBy: 'createdAt',
    sortDir: 'desc',
  };

  const [filters, setFilters] = useState(defaultFilters);
  const [showFilter, setShowFilter] = useState(false);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 10,
  });

  // debug
  const [lastUrl, setLastUrl] = useState('');
  const [lastStatus, setLastStatus] = useState(null);
  const [lastBody, setLastBody] = useState('');

  const cacheRef = useRef({});

  // View dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // Delete confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Add/Edit dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // avatar upload – used in view dialog
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // Avatar preview dialog
  const [viewImageOpen, setViewImageOpen] = useState(false);
  const [viewImageUrl, setViewImageUrl] = useState('');
  const [viewImageTitle, setViewImageTitle] = useState('');

  // Notes dialog
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesPartner, setNotesPartner] = useState(null);

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  function setDebug(url, status, bodyObj) {
    setLastUrl(url);
    setLastStatus(status);
    try {
      const s = typeof bodyObj === 'string' ? bodyObj : JSON.stringify(bodyObj);
      setLastBody(s.length > 600 ? `${s.slice(0, 600)} …(truncated)` : s);
    } catch {
      setLastBody('<<unserializable>>');
    }
  }

  // ---------------- Fetch partners ----------------

  async function fetchPartners(page = 1, hardReload = false) {
    try {
      setIsLoading(true);

      const qsCore = buildQuery(filters);
      const limit = pagination.limit || 10;
      const queryKey = `page=${page}&limit=${limit}&${qsCore}`;

      if (cacheRef.current[queryKey] && !hardReload) {
        const cached = cacheRef.current[queryKey];
        setRows(cached.rows);
        setPagination(cached.pagination);
        setDebug('(cache)', 200, cached);
        setIsLoading(false);
        return;
      }

      const url = `${CONFIG.apiUrl}/v1/admin/partners?page=${page}&limit=${limit}${
        qsCore ? `&${qsCore}` : ''
      }`;

      const resp = await axios.get(url, { headers, validateStatus: () => true });
      setDebug(url, resp.status, resp.data);

      const data = resp.data;
      if (data?.success) {
        const rowsRaw = data?.data?.rows ?? [];
        const paginationRaw = data?.data?.pagination ?? {};
        setRows(rowsRaw);
        setPagination(paginationRaw);
        cacheRef.current[queryKey] = { rows: rowsRaw, pagination: paginationRaw };
      } else {
        toast.error(data?.msg || 'Failed to fetch partners');
      }
    } catch (err) {
      console.error('fetchPartners error:', err);
      toast.error('Something went wrong while fetching partners');
      setDebug(lastUrl || '(last)', 0, String(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchPartners(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPartners(page);
  };

  const handleFilterApply = () => {
    setCurrentPage(1);
    cacheRef.current = {};
    fetchPartners(1, true);
  };

  const handleFilterReset = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
    cacheRef.current = {};
    fetchPartners(1, true);
  };

  // ---------------- View dialog ----------------

  const openView = async (row) => {
    try {
      const url = `${CONFIG.apiUrl}/v1/admin/partners/${row.id}`;
      const resp = await axios.get(url, { headers, validateStatus: () => true });
      setDebug(url, resp.status, resp.data);

      if (resp?.data?.success) {
        setSelected(resp.data.data);
        setViewOpen(true);
      } else {
        toast.error(resp?.data?.msg || 'Failed to load partner');
      }
    } catch (e) {
      console.error('openView error:', e);
      toast.error('Failed to load partner');
    }
  };

  const closeView = () => {
    setViewOpen(false);
    setSelected(null);
  };

  const openCreate = () => {
    setEditId(null);
    setAddOpen(true);
  };

  const openEdit = (id) => {
    setEditId(id);
    setEditOpen(true);
  };

  // ---------------- Delete dialog ----------------

  const askDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);

      const url = `${CONFIG.apiUrl}/v1/admin/partners/${deleteId}`;
      const resp = await axios.post(url, {}, { headers, validateStatus: () => true });
      setDebug(url, resp.status, resp.data);

      const data = resp.data;
      if (data?.success) {
        toast.success(data?.msg || 'Partner deleted');
        setConfirmOpen(false);
        setDeleteId(null);
        cacheRef.current = {};
        fetchPartners(currentPage, true);
      } else {
        toast.error(data?.msg || 'Delete failed');
      }
    } catch (e) {
      console.error('delete error:', e);
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  // ---------------- Avatar upload (used in view dialog) ----------------

  const handleChangeFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selected?.id) return;

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('avatar', file);

      const url = `${CONFIG.apiUrl}/v1/admin/partners/${selected.id}/avatar`;

      const resp = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        validateStatus: () => true,
      });

      setDebug(url, resp.status, resp.data);

      if (resp.data?.success) {
        const newAvatar = resp.data?.data?.avatar;

        if (!newAvatar) {
          toast.error('Avatar updated but no filename returned');
        } else {
          // update selected dialog data
          setSelected((prev) => (prev ? { ...prev, avatar: newAvatar } : prev));

          // update table row as well
          setRows((prevRows) =>
            prevRows.map((r) => (r.id === selected.id ? { ...r, avatar: newAvatar } : r))
          );

          toast.success(resp.data.message || resp.data.msg || 'Avatar updated');
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

  // ---------------- Avatar preview dialog ----------------

  const handleOpenImage = (row) => {
    if (!row?.avatar) return;

    const title = row.username || row.email || (row.id ? `Partner #${row.id}` : 'Partner image');

    setViewImageTitle(title);
    setViewImageUrl(`${CONFIG.assetsUrl}/upload/partner/${row.avatar}`);
    setViewImageOpen(true);
  };

  const handleCloseImage = () => {
    setViewImageOpen(false);
    setViewImageUrl('');
    setViewImageTitle('');
  };

  // ---------------- Notes dialog ----------------

  const openNotesDialog = (row) => {
    setNotesPartner(row);
    setNotesOpen(true);
  };

  const closeNotesDialog = () => {
    setNotesOpen(false);
    setNotesPartner(null);
  };

  // ----------------------------------------------------

  return (
    <DashboardContent maxWidth="xl">
      {/* Header + actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <CustomBreadcrumbs
          heading="Partners"
          links={[{ name: 'Dashboard', href: '/' }, { name: 'Partners' }]}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 1, mr: '10px', mb: '16px' }}>
          <Button variant="contained" onClick={() => setShowFilter((p) => !p)}>
            <Iconify icon="stash:filter" sx={{ width: 20, mr: 1 }} />
            {showFilter ? 'Hide Filter' : 'Show Filter'}
          </Button>
          <Button variant="contained" onClick={openCreate}>
            <Iconify icon="material-symbols:add" sx={{ width: 20, mr: 1 }} />
            Add
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Collapse in={showFilter} timeout="auto" unmountOnExit>
        <Card sx={{ p: 2, mb: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr 1fr',
              },
            }}
          >
            <TextField
              label="Partner ID"
              type="number"
              value={filters.partnerId}
              onChange={(e) => setFilters({ ...filters, partnerId: e.target.value })}
              fullWidth
            />

            <TextField
              label="Username"
              value={filters.username}
              onChange={(e) => setFilters({ ...filters, username: e.target.value })}
              fullWidth
            />

            <PartnerByPublisherSelector
              label="Partner"
              placeholder="Type publisher ID or username…"
              valueId={filters.partnerId ? Number(filters.partnerId) : undefined}
              onPartnerSelect={(partnerId) => {
                const nextFilters = {
                  ...filters,
                  partnerId: partnerId || '',
                };
                setFilters(nextFilters);
                setCurrentPage(1);
                cacheRef.current = {};
              }}
            />

            <TextField
              label="Email"
              value={filters.email}
              onChange={(e) => setFilters({ ...filters, email: e.target.value })}
              fullWidth
            />

            <TextField
              label="Country"
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={String(s.value)} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>2FA</InputLabel>
              <Select
                value={filters.twoFactorEnabled}
                label="2FA"
                onChange={(e) => setFilters({ ...filters, twoFactorEnabled: e.target.value })}
              >
                {TWO_FA_OPTIONS.map((opt) => (
                  <MenuItem key={String(opt.value)} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy}
                label="Sort By"
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                {SORT_BY_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Order</InputLabel>
              <Select
                value={filters.sortDir}
                label="Order"
                onChange={(e) => setFilters({ ...filters, sortDir: e.target.value })}
              >
                {SORT_DIR_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Button
                fullWidth
                size="medium"
                variant="outlined"
                onClick={handleFilterReset}
                disabled={isLoading}
              >
                Reset
              </Button>

              <Button
                fullWidth
                size="medium"
                variant="contained"
                onClick={handleFilterApply}
                disabled={isLoading}
              >
                Apply
              </Button>
            </Box>
          </Box>
        </Card>
      </Collapse>

      {/* KPI card */}
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
          <Typography sx={{ fontSize: 14 }}>Total Partners</Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{pagination?.total ?? 0}</Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            p: 2,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: '#00A76F',
            color: '#fff',
          }}
        >
          <Iconify icon="mdi:handshake-outline" />
        </Box>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <TableSkeleton cols={14} />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>2FA</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Registered IP</TableCell>
                  <TableCell>Last Active</TableCell>
                  <TableCell>Registered</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows?.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>

                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        {/* Avatar clickable to open view image dialog */}
                        <Tooltip title={row.avatar ? 'View image' : ''}>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              cursor: row.avatar ? 'pointer' : 'default',
                            }}
                            onClick={() => row.avatar && handleOpenImage(row)}
                          >
                            <Avatar
                              alt={row.username}
                              src={
                                row.avatar
                                  ? `${CONFIG.assetsUrl}/upload/partner/${row.avatar}`
                                  : undefined
                              }
                              sx={{ width: 32, height: 32, fontSize: 14, fontWeight: 600 }}
                            >
                              {(row.username || '?').charAt(0).toUpperCase()}
                            </Avatar>
                          </Box>
                        </Tooltip>

                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {row.username}
                          </Typography>

                          {row.email && (
                            <Typography variant="caption" color="text.secondary">
                              {row.email}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{row.phoneNo || '—'}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{row.gender || '—'}</Typography>
                    </TableCell>

                    <TableCell>
                      {row.country ? (
                        <CountryBadge code={row.country} size={25} showPhone={false} />
                      ) : (
                        '—'
                      )}
                    </TableCell>

                    <TableCell>
                      {row.language ? <LanguageBadge code={row.language} /> : '—'}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        color={row.twoFactorEnabled ? 'success' : 'default'}
                        label={twoFaLabel(row.twoFactorEnabled)}
                      />
                    </TableCell>

                    <TableCell>
                      <StatusChip value={row.status} />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{row.registeredIp || '—'}</Typography>
                    </TableCell>

                    <TableCell>
                      {row.lastActiveAt ? (
                        <ListItemText
                          primary={fDate(row.lastActiveAt)}
                          secondary={fTime(row.lastActiveAt)}
                          primaryTypographyProps={{ typography: 'body2' }}
                          secondaryTypographyProps={{ mt: 0.5, component: 'span' }}
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>

                    <TableCell>
                      <ListItemText
                        primary={row.createdAt ? fDate(row.createdAt) : '—'}
                        secondary={row.createdAt ? fTime(row.createdAt) : ''}
                        primaryTypographyProps={{ typography: 'body2' }}
                        secondaryTypographyProps={{ mt: 0.5, component: 'span' }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {/* NOTES BUTTON */}
                        <Tooltip title="Notes">
                          <IconButton size="small" onClick={() => openNotesDialog(row)}>
                            <Iconify icon="mdi:note-edit-outline" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => openView(row)}>
                            <Iconify icon="solar:eye-bold" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(row.id)}>
                            <Iconify icon="solar:pen-bold" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => askDelete(row.id)}>
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                <TableNoData notFound={(pagination?.total ?? 0) === 0} />
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Pagination */}
      <Stack
        spacing={2}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          m: 2,
        }}
      >
        <Pagination
          count={pagination?.totalPages || 1}
          page={currentPage}
          onChange={(_, p) => handlePageChange(p)}
          renderItem={(item) => <PaginationItem {...item} />}
        />
      </Stack>

      {/* View dialog */}
      <PartnerViewDialog
        open={viewOpen}
        selected={selected}
        onClose={closeView}
        onEdit={(id) => {
          closeView();
          if (id) openEdit(id);
        }}
        fileInputRef={fileInputRef}
        onChangeFile={handleChangeFile}
        isUploading={isUploading}
      />

      {/* Avatar image preview dialog */}
      <PartnerAvatarPreviewDialog
        open={viewImageOpen}
        title={viewImageTitle}
        imageUrl={viewImageUrl}
        onClose={handleCloseImage}
      />

      {/* Notes dialog */}
      <PartnerNotesDialog
        open={notesOpen}
        partner={notesPartner}
        headers={headers}
        onClose={closeNotesDialog}
      />

      {/* Delete partner confirm dialog */}
      <DeletePartnerConfirmDialog
        open={confirmOpen}
        deleting={deleting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={doDelete}
      />

      {/* Add Partner dialog */}
      <AddPartnerFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => {
          setAddOpen(false);
          cacheRef.current = {};
          fetchPartners(currentPage, true);
        }}
        setDebug={(url, status, body) => setDebug(url, status, body)}
      />

      {/* Edit Partner dialog */}
      <EditPartnerFormDialog
        open={editOpen}
        id={editId}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          cacheRef.current = {};
          fetchPartners(currentPage, true);
        }}
        setDebug={(url, status, body) => setDebug(url, status, body)}
      />
    </DashboardContent>
  );
}
