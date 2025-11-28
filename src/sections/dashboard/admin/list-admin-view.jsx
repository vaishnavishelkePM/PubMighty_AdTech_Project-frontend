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
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { TwoFAChip, StatusChip } from 'src/components/chip/admin-chips/admin-chip';

import AddAdminFormDialog from './child/add-admin-form-dialog';
import EditAdminFormDialog from './child/edit-admin-form-dialog';

export function AdminListView() {
  const router = useRouter();

  const compact = true;

  const token = getCookie('session_key');
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const listUrlBase = `${CONFIG.apiUrl}/v1/admin/admins`;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [totalAdmins, setTotalAdmins] = useState(0);

  const defaultFilters = {
    username: '',
    email: '',
    role: '',
    status: '',
    twoFA: '',
    sortBy: 'updatedAt',
    sortDir: 'desc',
  };

  const [filters, setFilters] = useState(defaultFilters);
  const cacheRef = useRef({});

  const [showFilter, setShowFilter] = useState(false);
  const [viewImageOpen, setViewImageOpen] = useState(false);
  const [viewImageUrl, setViewImageUrl] = useState('');
  const [viewImageTitle, setViewImageTitle] = useState('');
  const [openAddForm, setOpenAddForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAdmins = useCallback(
    async (filter, p = 1, hardReload = false) => {
      try {
        //const token = getCookie('session_key');
        if (!token) {
          toast.error('Session expired. Please login again.');
          router.replace(paths.login.root);
          return;
        }

        setLoading(true);

        const qp = new URLSearchParams();
        Object.entries(filter).forEach(([k, v]) => {
          if (v !== '' && v !== null && v !== undefined) {
            qp.append(k, v);
          }
        });
        qp.append('page', p);

        const queryKey = qp.toString();

        if (cacheRef.current[queryKey] && !hardReload) {
          const cached = cacheRef.current[queryKey];
          setRows(cached.rows);
          setTotalPages(cached.totalPages);
          setTotalAdmins(cached.totalAdmins ?? 0);
          setPage(p);
          setLoading(false);
          return;
        }

        const url = `${listUrlBase}?${queryKey}`;
        const res = await axios.get(url, {
          headers,
          withCredentials: true,
          validateStatus: () => true,
        });

        if (res.status === 401) {
          toast.error(res?.data?.msg || 'Unauthorized. Please login again.');
          router.replace(paths.login.root);
          return;
        }

        if (res.data?.success) {
          const data = res.data?.data || {};
          const _rows = data.rows || [];
          const pag = data.pagination || {};
          const total = pag.totalPages || 1;

          const totalCount = pag.totalItems ?? data.total ?? _rows.length;

          cacheRef.current[queryKey] = {
            rows: _rows,
            totalPages: total,
            totalAdmins: totalCount,
          };

          setRows(_rows);
          setTotalPages(total);
          setTotalAdmins(totalCount);
          setPage(p);
        } else {
          toast.error(res.data?.msg || 'Failed to fetch admins');
        }
      } catch (e) {
        console.error('fetchAdmins error:', e);
        toast.error('Error fetching admins');
      } finally {
        setLoading(false);
      }
    },
    [headers, listUrlBase, router]
  );

  useEffect(() => {
    fetchAdmins(defaultFilters, 1);
  }, []);
  const openViewDialog = (row) => {
    setSelected(row);
    setViewOpen(true);
  };

  const handleOpenImage = (row) => {
    if (!row?.avatar) return;
    const title = row.username || row.email || (row.id ? `Admin #${row.id}` : 'Admin image');
    setViewImageTitle(title);

    setViewImageUrl(`${CONFIG.assetsUrl}/upload/admin/${row.avatar}`);
    setViewImageOpen(true);
  };

  const handleCloseImage = () => {
    setViewImageOpen(false);
    setViewImageUrl('');
    setViewImageTitle('');
  };

  const confirmDelete = async () => {
    try {
      if (!deleteId) return;
      setDeleting(true);

      const res = await axios.delete(`${listUrlBase}/${deleteId}`, {
        headers,
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.status === 401) {
        toast.error(res?.data?.msg || 'Unauthorized. Please login again.');
        router.replace(paths.login.root);
        return;
      }

      if (res.data?.success) {
        toast.success(res.data?.msg || 'Admin deleted');
        setDeleteId(null);
        cacheRef.current = {};
        fetchAdmins(filters, page, true);
      } else {
        toast.error(res.data?.msg || 'Failed to delete admin');
      }
    } catch (e) {
      console.error('delete error:', e);
      toast.error('Error deleting admin');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Admins"
        links={[
          { name: 'Home', href: paths.root },
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Admins', href: paths.dashboard.admin.list },
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
                setOpenAddForm(true);
              }}
            >
              <Iconify icon="material-symbols:add" sx={{ width: 20, mr: 1 }} />
              Add
            </Button>
          </Box>
        }
        sx={{ mb: 2 }}
      />

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
              label="Role"
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
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
                <MenuItem value={1}>Enabled</MenuItem>
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

            {/* Sort Direction */}
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
                onClick={() => {
                  setFilters(defaultFilters);
                  cacheRef.current = {};
                  fetchAdmins(defaultFilters, 1, true);
                }}
              >
                Reset
              </Button>

              <Button
                fullWidth
                size="medium"
                variant="contained"
                onClick={() => {
                  cacheRef.current = {};
                  fetchAdmins(filters, 1, true);
                }}
              >
                Apply
              </Button>
            </Box>
          </Box>
        </Card>
      </Collapse>

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
          <Typography sx={{ fontSize: 14 }}>Total Admins</Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{totalAdmins}</Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            p: 2,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: '#da7120ff',
            color: '#fff',
          }}
        >
          <Iconify icon="mdi:shield-account-outline" />
        </Box>
      </Card>

      {/* ================= TABLE ================= */}
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
                  <TableCell>Admin</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>2FA</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.length ? (
                  rows.map((r) => {
                    const letter = r.username?.[0]?.toUpperCase() ?? '?';

                    const fullName = `${r.first_name || ''}${
                      r.last_name ? ` ${r.last_name}` : ''
                    }`.trim();

                    return (
                      <TableRow key={r.id} hover>
                        <TableCell>{r.id}</TableCell>

                        {/* Admin */}
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Tooltip title={r.avatar ? 'View image' : ''}>
                              <Box
                                sx={{
                                  display: 'inline-flex',
                                  cursor: r.avatar ? 'pointer' : 'default',
                                }}
                                onClick={() => r.avatar && handleOpenImage(r)}
                              >
                                <Avatar
                                  src={
                                    r.avatar
                                      ? `${CONFIG.assetsUrl}/upload/admin/${r.avatar}`
                                      : undefined
                                  }
                                  sx={{ width: 32, height: 32 }}
                                >
                                  {!r.avatar && letter}
                                </Avatar>
                              </Box>
                            </Tooltip>

                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {r.username}
                              </Typography>

                              {r.email && (
                                <Typography variant="caption" color="text.secondary">
                                  {r.email}
                                </Typography>
                              )}

                              {fullName && (
                                <Typography variant="caption" color="text.secondary">
                                  {fullName}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          {r.createdAt ? (
                            <Stack spacing={0}>
                              <Typography variant="body2">{fDate(r.createdAt)}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {fTime(r.createdAt)}
                              </Typography>
                            </Stack>
                          ) : (
                            '—'
                          )}
                        </TableCell>

                        <TableCell>{r.role || '—'}</TableCell>

                        {/* 2FA */}
                        <TableCell>
                          <TwoFAChip value={r.two_fa ?? r.twoFactorEnabled} />
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusChip value={r.status} />
                        </TableCell>

                        {/* Updated */}
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

                        {/* Actions */}
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
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
                                  setOpenEditForm(true);
                                }}
                              >
                                <Iconify icon="mdi:pencil" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      No admins found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* ================= PAGINATION ================= */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, p) => {
            fetchAdmins(filters, p);
          }}
        />
      </Box>

      {/* ================= ADD DIALOG ================= */}
      <AddAdminFormDialog
        open={openAddForm}
        onClose={() => setOpenAddForm(false)}
        onSuccess={() => {
          setOpenAddForm(false);
          cacheRef.current = {};
          fetchAdmins(filters, page, true);
        }}
      />

      {/* ================= EDIT DIALOG ================= */}
      <EditAdminFormDialog
        open={openEditForm}
        id={editId}
        onClose={() => {
          setOpenEditForm(false);
          setEditId(null);
        }}
        onSuccess={() => {
          setOpenEditForm(false);
          setEditId(null);
          cacheRef.current = {};
          fetchAdmins(filters, page, true);
        }}
      />

      {/* ================= VIEW DIALOG ================= */}
      <Dialog
        fullWidth
        maxWidth="sm"
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Admin #{selected?.id}</DialogTitle>

        <DialogContent dividers>
          {selected && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Tooltip title={selected.avatar ? 'View image' : ''}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      cursor: selected.avatar ? 'pointer' : 'default',
                    }}
                    onClick={() => selected.avatar && handleOpenImage(selected)}
                  >
                    <Avatar
                      src={
                        selected.avatar
                          ? `${CONFIG.assetsUrl}/upload/admin/${selected.avatar}`
                          : undefined
                      }
                      sx={{ width: 64, height: 64 }}
                    >
                      {!selected.avatar && selected.username?.[0]?.toUpperCase()}
                    </Avatar>
                  </Box>
                </Tooltip>

                <Box>
                  <Typography variant="h6">{selected.username}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selected.email || '—'}
                  </Typography>
                  {(selected.first_name || selected.last_name) && (
                    <Typography variant="body2" color="text.secondary">
                      {`${selected.first_name || ''}${
                        selected.last_name ? ` ${selected.last_name}` : ''
                      }`.trim()}
                    </Typography>
                  )}
                </Box>
              </Stack>

              <Divider />

              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Role
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selected.role || '—'}
                  </Typography>
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
                  <TwoFAChip value={selected.two_fa ?? selected.twoFactorEnabled} />
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

      <Dialog open={viewImageOpen} onClose={handleCloseImage} maxWidth="sm" fullWidth>
        <DialogTitle>{viewImageTitle}</DialogTitle>
        <DialogContent
          dividers
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'background.default',
          }}
        >
          {viewImageUrl ? (
            <Box
              component="img"
              src={viewImageUrl}
              alt={viewImageTitle}
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: 2,
                boxShadow: (theme) => theme.shadows[3],
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No image available
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImage}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Admin</DialogTitle>
        <DialogContent>Are you sure you want to delete this admin?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}

export default AdminListView;
