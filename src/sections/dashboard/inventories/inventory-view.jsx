'use client';

import axios from 'axios';
import { toast } from 'react-toastify';
import { usePathname } from 'next/navigation';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  Menu,
  Stack,
  Slide,
  Select,
  Divider,
  InputLabel,
  Pagination,
  FormControl,
  ListItemIcon,
  ListItemText,
  PaginationItem,
  TableContainer,
  InputAdornment,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { getCookie } from 'src/utils/helper';
import { fDate, fTime } from 'src/utils/format-time';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { TableNoData } from 'src/components/table';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import PartnerSelector from 'src/components/selectors/inventory/partner-selector';
import PublisherSelector from 'src/components/selectors/inventory/publisher-selector';
import {
  TypeChip,
  TypeChips,
  StatusChip,
  AdsTxtChip,
  PartnerStatusChip,
} from 'src/components/chip/inventory-chip/inventory-chip';

import AddInventoryFormDialog from './child/add-inventory-form-dialog';
import EditInventoryFormDialog from './child/edit-inventory-form-dialog';
import InventoryNotesDialog from './child/dialogs/inventory-notes-dialog';

// ----------------------------------------------------------------------

const TYPES = [
  { label: 'All', value: '' },
  { label: 'WEB', value: 'WEB' },
  { label: 'APP', value: 'APP' },
  { label: 'OTT/CTV', value: 'OTT_CTV' },
];

const STATUS = [
  { label: 'All', value: '' },
  { label: 'Inactive', value: 0 },
  { label: 'Active', value: 1 },
  { label: 'Blocked', value: 2 },
];

const PARTNER_STATUS = [
  { label: 'All', value: '' },
  { label: 'Unlinked', value: 0 },
  { label: 'Linked', value: 1 },
  { label: 'Paused', value: 2 },
];

const ADS_TXT_STATUS = [
  { label: 'All', value: '' },
  { label: 'Unknown', value: 0 },
  { label: 'OK', value: 1 },
  { label: 'Missing', value: 2 },
  { label: 'Mismatch', value: 3 },
];

const DEFAULT_FILTERS = {
  id: '',
  publisherId: '',
  partnerId: '',
  name: '',
  url: '',
  type: '',
  status: '',
  partnerStatus: '',
  adsTxtStatus: '',
  sortBy: 'updatedAt',
  sortDir: 'desc',
};

function buildQuery(filters) {
  const qp = new URLSearchParams();

  ['id', 'publisherId', 'partnerId', 'name', 'url', 'type'].forEach((k) => {
    const v = (filters[k] ?? '').toString().trim();
    if (v !== '') qp.append(k, v);
  });

  const numericMap = {
    status: filters.status,
    partnerStatus: filters.partnerStatus,
    adsTxtStatus: filters.adsTxtStatus,
  };
  Object.entries(numericMap).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) {
      qp.append(k, String(v));
    }
  });

  if (filters.sortBy) qp.append('sortBy', String(filters.sortBy));
  if (filters.sortDir) qp.append('sortDir', String(filters.sortDir));

  return qp.toString();
}

function Labeled({ label, children }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="baseline">
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
        {label}
      </Typography>
      <Typography variant="body2">{children}</Typography>
    </Stack>
  );
}

// ----------------------------------------------------------------------

export default function InventoryView() {
  const pathname = usePathname();

  // 🔹 Derive type from last path segment: /inventory/web, /inventory/ott, /inventory/app, /inventory/all
  const routeType = useMemo(() => {
    if (!pathname) return '';

    // strip query / hash just in case
    const cleanPath = pathname.split('?')[0].split('#')[0];
    const segments = cleanPath.split('/').filter(Boolean);
    const last = segments[segments.length - 1] || '';

    if (last === 'app') return 'APP';
    if (last === 'ott') return 'OTT_CTV';
    if (last === 'web') return 'WEB';

    // /inventory or /inventory/all or anything else → all types
    return '';
  }, [pathname]);

  const pageTitle = useMemo(() => {
    if (routeType === 'APP') return 'Inventory - App';
    if (routeType === 'WEB') return 'Inventory - Web';
    if (routeType === 'OTT_CTV') return 'Inventory - OTT/CTV';
    return 'Inventory';
  }, [routeType]);

  const token = useMemo(() => getCookie('session_key'), []);
  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const listUrlBase = `${CONFIG.apiUrl}/v1/admin/inventory`;
  const uiSettingUrl = `${CONFIG.apiUrl}/v1/admin/ui-setting`;
  const INVENTORY_PAGE_KEY = 'inventoryViewMode';

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilter, setShowFilter] = useState(false);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 1, perPage: 20 });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [viewMode, setViewMode] = useState('list');
  const [searchText, setSearchText] = useState('');

  // Quick status filter state
  const [quickStatus, setQuickStatus] = useState('all');
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  const cacheRef = useRef({});

  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // NOTES STATE
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesInventory, setNotesInventory] = useState(null);

  // MENU STATE (for list card 3-dots)
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  const openMenu = (event, row) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuRow(row);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
    setMenuRow(null);
  };

  const fetchInventories = useCallback(
    async (filter, page = 1, hardReload = false) => {
      try {
        setIsLoading(true);

        const qs = buildQuery(filter);
        const queryKey = `page=${page}&${qs}`;

        if (cacheRef.current[queryKey] && !hardReload) {
          const cached = cacheRef.current[queryKey];
          setRows(cached.rows);
          setPagination(cached.pagination);
          setIsLoading(false);
          return;
        }

        const url = `${listUrlBase}?page=${page}${qs ? `&${qs}` : ''}`;

        const res = await axios.get(url, {
          headers,
          validateStatus: () => true,
        });

        const data = res.data;
        if (data?.success) {
          const payload = data?.data || {};
          const _rows = Array.isArray(payload.rows) ? payload.rows : [];
          const pag = payload.pagination || {};
          const normPag = {
            totalItems: pag.totalItems ?? pag.total ?? _rows.length,
            totalPages: pag.totalPages ?? 1,
            perPage: pag.perPage ?? 20,
          };
          cacheRef.current[queryKey] = { rows: _rows, pagination: normPag };
          setRows(_rows);
          setPagination(normPag);
        } else {
          toast.error(data?.msg || data?.message || 'Failed to fetch inventories');
        }
      } catch (e) {
        console.error('fetchInventories error:', e);
        toast.error('Something went wrong while fetching inventories');
      } finally {
        setIsLoading(false);
      }
    },
    [headers, listUrlBase]
  );

  // fetchStatusCounts (for quick filter counts)
  const fetchStatusCounts = useCallback(
    async (baseFilters) => {
      try {
        const { status, ...restFilters } = baseFilters || {};

        const getTotal = async (extra) => {
          const merged = { ...restFilters, ...extra };
          const qs = buildQuery(merged);
          const url = `${listUrlBase}?page=1${qs ? `&${qs}` : ''}`;

          const res = await axios.get(url, {
            headers,
            validateStatus: () => true,
          });

          const data = res?.data;
          if (data?.success) {
            const payload = data.data || {};
            const pag = payload.pagination || {};
            return (
              pag.totalItems ?? pag.total ?? (Array.isArray(payload.rows) ? payload.rows.length : 0)
            );
          }
          return 0;
        };

        const [all, approved, pending, rejected] = await Promise.all([
          getTotal({}),
          getTotal({ status: 1 }),
          getTotal({ status: 0 }),
          getTotal({ status: 2 }),
        ]);

        setStatusCounts({ all, approved, pending, rejected });
      } catch (e) {
        console.error('fetchStatusCounts error:', e);
      }
    },
    [headers, listUrlBase]
  );

  const fetchViewMode = useCallback(async () => {
    try {
      const res = await axios.get(uiSettingUrl, {
        headers,
        validateStatus: () => true,
      });

      const data = res?.data;
      if (!data?.success) {
        return;
      }

      const prefs = data?.data?.ui_setting || {};
      let mode = prefs[INVENTORY_PAGE_KEY];

      if (mode !== 'table' && mode !== 'list') {
        mode = 'list';
      }

      setViewMode(mode);
    } catch (e) {
      console.error('fetchViewMode error:', e);
    }
  }, [headers, uiSettingUrl]);

  // 🔹 Fetch view mode ONCE on mount
  useEffect(() => {
    fetchViewMode();
  }, [fetchViewMode]);

  // 🔹 Initial load + re-run when routeType changes (All/Web/OTT/App)
  useEffect(() => {
    const initialFilters = {
      ...DEFAULT_FILTERS,
      type: routeType || '',
    };

    setFilters(initialFilters);
    setCurrentPage(1);
    setQuickStatus('all');
    cacheRef.current = {};

    fetchInventories(initialFilters, 1, true);
    fetchStatusCounts(initialFilters);
  }, [routeType, fetchInventories, fetchStatusCounts]);

  const handleToggleViewMode = async () => {
    const current = viewMode;
    const next = current === 'table' ? 'list' : 'table';

    setViewMode(next);

    try {
      const res = await axios.post(
        `${uiSettingUrl}/view-mode`,
        {
          pageKey: INVENTORY_PAGE_KEY,
          viewMode: next,
        },
        {
          headers,
          validateStatus: () => true,
        }
      );

      if (!res?.data?.success) {
        setViewMode(current);
        toast.error(res?.data?.msg || res?.data?.message || 'Failed to save view mode');
      }
    } catch (e) {
      console.error('save view mode error:', e);
      setViewMode(current);
      toast.error('Failed to save view mode');
    }
  };

  const handleFilterApply = () => {
    setCurrentPage(1);
    cacheRef.current = {};
    fetchInventories(filters, 1, true);
    fetchStatusCounts(filters);
  };

  const handleFilterReset = () => {
    const next = {
      ...DEFAULT_FILTERS,
      type: routeType || '',
    };
    setFilters(next);
    setQuickStatus('all');
    setCurrentPage(1);
    cacheRef.current = {};
    fetchInventories(next, 1, true);
    fetchStatusCounts(next);
  };

  useEffect(() => {
    setSearchText(filters.name || '');
  }, [filters.name]);

  const handlePageChange = (_, p) => {
    setCurrentPage(p);
    fetchInventories(filters, p);
  };

  const handleCreate = () => {
    setEditId(null);
    setOpenAdd(true);
  };

  const handleEdit = (id) => {
    setEditId(id);
    setOpenEdit(true);
  };

  const handleDelete = (id) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      const res = await axios.delete(`${listUrlBase}/${deleteId}`, {
        headers,
        validateStatus: () => true,
      });
      if (res?.data?.success) {
        toast.success(res?.data?.msg || 'Inventory deleted');
        setDeleteId(null);
        fetchInventories(filters, currentPage, true);
        fetchStatusCounts(filters);
      } else {
        toast.error(res?.data?.msg || res?.data?.message || 'Failed to delete inventory');
      }
    } catch (e) {
      console.error('delete error:', e);
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const openView = (row) => {
    setSelected(row);
    setViewOpen(true);
  };

  const handleSearch = () => {
    const nextFilters = { ...filters, name: searchText };
    setFilters(nextFilters);
    setCurrentPage(1);
    cacheRef.current = {};
    fetchInventories(nextFilters, 1, true);
    fetchStatusCounts(nextFilters);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // quick filter click
  const handleQuickStatusChange = (key) => {
    setQuickStatus(key);

    let statusVal = '';
    if (key === 'approved') statusVal = 1;
    else if (key === 'pending') statusVal = 0;
    else if (key === 'rejected') statusVal = 2;

    const nextFilters = { ...filters, status: statusVal };
    setFilters(nextFilters);
    setCurrentPage(1);
    cacheRef.current = {};
    fetchInventories(nextFilters, 1, true);
  };

  const handleClickUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleChangeFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selected) return;

    const publisherId = selected.publisherId || selected.publisher?.id;
    if (!publisherId) {
      toast.error('No publisher ID found for this inventory');
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('avatar', file);

      const url = `${CONFIG.apiUrl}/v1/admin/publishers/${publisherId}/avatar`;

      const resp = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        validateStatus: () => true,
      });

      if (resp.data?.success) {
        const newAvatar = resp.data?.data?.avatar;

        if (!newAvatar) {
          toast.error('Avatar updated but no filename returned');
        } else {
          setSelected((prev) =>
            prev
              ? {
                  ...prev,
                  publisher: {
                    ...(prev.publisher || {}),
                    avatar: newAvatar,
                  },
                }
              : prev
          );

          setRows((prevRows) =>
            prevRows.map((row) =>
              row.publisherId === publisherId
                ? {
                    ...row,
                    publisher: {
                      ...(row.publisher || {}),
                      avatar: newAvatar,
                    },
                  }
                : row
            )
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

  const openNotesDialog = (row) => {
    setNotesInventory(row);
    setNotesOpen(true);
  };

  const closeNotesDialog = () => {
    setNotesInventory(null);
    setNotesOpen(false);
  };

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <CustomBreadcrumbs
          heading={pageTitle}
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Inventory', href: paths.dashboard.inventory?.root || '#' },
          ]}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mr: '10px', mb: '16px' }}>
          <Box sx={{ display: 'flex', width: '100%', justifyContent: 'flex-end', mb: 2 }}>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Button variant="contained" onClick={() => setShowFilter((prev) => !prev)}>
                <Iconify icon="stash:filter" sx={{ width: 20, mr: 1 }} />
                {showFilter ? 'Hide Filter' : 'Show Filter'}
              </Button>
              <Button variant="contained" onClick={handleCreate}>
                <Iconify icon="material-symbols:add" sx={{ width: 20, mr: 1 }} />
                Add
              </Button>
              <Button variant="contained" onClick={handleToggleViewMode}>
                <Iconify icon="solar:widget-4-linear" sx={{ width: 20, mr: 1 }} />
                UI
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <Collapse in={showFilter} timeout="auto" unmountOnExit>
        <Card sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Publisher selector → sets publisherId from selected inventory */}
            <Grid item xs={12} sm={6} md={3}>
              <PublisherSelector
                label="Publisher"
                placeholder="Type publisher ID or username…"
                valueId={filters.publisherId ? Number(filters.publisherId) : undefined}
                onInventorySelect={(_, inv) => {
                  const publisherId = inv?.publisherId || inv?.publisher?.id || '';
                  setFilters((prev) => ({
                    ...prev,
                    publisherId: publisherId || '',
                  }));
                }}
              />
            </Grid>

            {/* Partner selector → sets partnerId from selected inventory */}
            <Grid item xs={12} sm={6} md={3}>
              <PartnerSelector
                label="Partner"
                placeholder="Type partner ID or username…"
                valueId={filters.partnerId ? Number(filters.partnerId) : undefined}
                onInventorySelect={(_, inv) => {
                  const partnerId = inv?.partnerId || inv?.partner?.id || '';
                  setFilters((prev) => ({
                    ...prev,
                    partnerId: partnerId || '',
                  }));
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="URL"
                value={filters.url}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    url: e.target.value,
                  }))
                }
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Type"
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                >
                  {TYPES.map((s) => (
                    <MenuItem key={String(s.value)} value={s.value}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  {STATUS.map((s) => (
                    <MenuItem key={String(s.value)} value={s.value}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Partner Status</InputLabel>
                <Select
                  value={filters.partnerStatus}
                  label="Partner Status"
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      partnerStatus: e.target.value,
                    }))
                  }
                >
                  {PARTNER_STATUS.map((s) => (
                    <MenuItem key={String(s.value)} value={s.value}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>ads.txt Status</InputLabel>
                <Select
                  value={filters.adsTxtStatus}
                  label="ads.txt Status"
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      adsTxtStatus: e.target.value,
                    }))
                  }
                >
                  {ADS_TXT_STATUS.map((s) => (
                    <MenuItem key={String(s.value)} value={s.value}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  label="Sort By"
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="id">ID</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="type">Type</MenuItem>
                  <MenuItem value="status">Status</MenuItem>
                  <MenuItem value="updatedAt">Updated At</MenuItem>
                  <MenuItem value="createdAt">Created At</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Order</InputLabel>
                <Select
                  value={filters.sortDir}
                  label="Order"
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortDir: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="asc">Ascending</MenuItem>
                  <MenuItem value="desc">Descending</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              item
              xs={12}
              md={12}
              sx={{
                gap: 1,
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
            >
              <Button
                variant="outlined"
                onClick={handleFilterReset}
                disabled={isLoading}
                sx={{ height: 48 }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                onClick={handleFilterApply}
                disabled={isLoading}
                sx={{ height: 48 }}
              >
                Apply
              </Button>
            </Grid>
          </Grid>
        </Card>
      </Collapse>

      {/* Quick status filter + search card */}
      <Card
        sx={(theme) => ({
          mb: 2,
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Status tabs */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 3,
              borderBottom: '1px solid',
              borderColor: 'divider',
              pb: 0,
            }}
          >
            {[
              { key: 'all', label: 'All', count: statusCounts.all, color: '#000000' },
              {
                key: 'approved',
                label: 'Approved',
                count: statusCounts.approved,
                color: '#4caf50',
              },
              { key: 'pending', label: 'Pending', count: statusCounts.pending, color: '#ffca28' },
              {
                key: 'rejected',
                label: 'Rejected',
                count: statusCounts.rejected,
                color: '#ef5350',
              },
            ].map((item) => {
              const active = quickStatus === item.key;

              return (
                <Box
                  key={item.key}
                  onClick={() => handleQuickStatusChange(item.key)}
                  sx={(theme) => ({
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    pb: 1,
                    borderBottom: active
                      ? `3px solid ${theme.palette.text.primary}`
                      : '1px solid transparent',
                    color: active ? theme.palette.text.primary : theme.palette.text.secondary,
                    fontWeight: active ? 600 : 500,
                    transition: 'all 0.1s',
                    gap: 2,
                    '&:hover': {
                      color: theme.palette.text.primary,
                    },
                  })}
                >
                  <span>{item.label}</span>

                  <Box
                    component="span"
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      px: 0.75,
                      py: 0.1,
                      borderRadius: 1,
                      backgroundColor: item.key === 'all' ? '#000000ff' : `${item.color}32`,
                      color: item.key === 'all' ? '#fff' : item.color,
                    }}
                  >
                    {item.count}
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Search row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <TextField
              size="small"
              fullWidth
              placeholder="Search by inventory name..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-outline" width={18} />
                  </InputAdornment>
                ),
              }}
            />

            <Tooltip title="Search">
              <IconButton onClick={handleSearch}>
                <Iconify icon="eva:search-outline" width={20} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Reset filters">
              <IconButton
                onClick={() => {
                  setSearchText('');
                  setQuickStatus('all');
                  handleFilterReset();
                }}
              >
                <Iconify icon="eva:refresh-outline" width={20} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Card>

      {isLoading ? (
        <Card>
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        </Card>
      ) : viewMode === 'table' ? (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Publisher</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Inventory Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Partner</TableCell>
                  <TableCell>ads.txt</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows?.length ? (
                  rows.map((row) => {
                    const publisherName =
                      row.publisher?.username ||
                      row.publisher?.email ||
                      (row.publisherId ? `Publisher #${row.publisherId}` : '—');

                    const firstLetter = (publisherName || '?').charAt(0).toUpperCase();

                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar
                              alt={publisherName}
                              src={
                                row.publisher?.avatar
                                  ? `${CONFIG.assetsUrl}/upload/publisher/${row.publisher.avatar}`
                                  : undefined
                              }
                              sx={{ width: 32, height: 32, fontSize: 14, fontWeight: 600 }}
                            >
                              {firstLetter}
                            </Avatar>

                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {publisherName}
                              </Typography>

                              {row.publisher?.email && (
                                <Typography variant="caption" color="text.secondary">
                                  {row.publisher.email}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {row.name || '—'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <TypeChips value={row.type} />
                        </TableCell>

                        <TableCell>
                          <Box
                            component="a"
                            href={row.url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            sx={{
                              color: 'primary.main',
                              textDecoration: row.url ? 'underline' : 'none',
                            }}
                            onClick={(e) => !row.url && e.preventDefault()}
                          >
                            {row.url || '—'}
                          </Box>
                        </TableCell>

                        <TableCell>
                          <StatusChip value={row.status} />
                        </TableCell>

                        <TableCell>
                          <PartnerStatusChip value={row.partnerStatus} />
                        </TableCell>

                        <TableCell>
                          <AdsTxtChip value={row.adsTxtStatus} />
                        </TableCell>

                        <TableCell>
                          {row.updatedAt ? (
                            <Stack spacing={0}>
                              <Typography variant="body2">{fDate(row.updatedAt)}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {fTime(row.updatedAt)}
                              </Typography>
                            </Stack>
                          ) : (
                            '—'
                          )}
                        </TableCell>

                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Notes">
                              <IconButton size="small" onClick={() => openNotesDialog(row)}>
                                <Iconify icon="mdi:note-edit-outline" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="View details">
                              <IconButton size="small" onClick={() => openView(row)}>
                                <Iconify icon="solar:eye-bold" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEdit(row.id)}>
                                <Iconify icon="solar:pen-bold" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(row.id)}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <TableNoData notFound />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        <Card
          sx={{
            background: 'transparent',
            boxShadow: 'none',
            border: 'none',
          }}
        >
          <Box>
            {rows?.length ? (
              <Stack spacing={2.5}>
                {rows.map((row) => {
                  const publisherName =
                    row.publisher?.username ||
                    row.publisher?.email ||
                    (row.publisherId ? `Publisher #${row.publisherId}` : '—');

                  const publisherFirstLetter = (publisherName || '?').charAt(0).toUpperCase();

                  const siteName = row.name || 'Untitled Inventory';
                  const firstLetter = (siteName || '?').charAt(0).toUpperCase();

                  return (
                    <Box
                      key={row.id}
                      sx={(theme) => ({
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.5fr) 160px auto',
                        columnGap: 16,
                        alignItems: 'center',
                        px: 2.5,
                        py: 3.5,
                        borderRadius: 3,
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: theme.shadows[1],
                        bgcolor: theme.palette.background.paper,
                        '&:hover': {
                          boxShadow: theme.shadows[3],
                          borderColor: theme.palette.primary.main,
                          bgcolor: theme.palette.action.hover,
                        },
                      })}
                    >
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
                        <Avatar
                          alt={siteName}
                          sx={{
                            width: 55,
                            height: 55,
                            fontSize: 18,
                            fontWeight: 600,
                            borderRadius: 1,
                          }}
                          src={
                            row.logo
                              ? row.logo.startsWith('http')
                                ? row.logo
                                : `${CONFIG.assetsUrl}/upload/inventories/${row.logo}`
                              : undefined
                          }
                        >
                          {firstLetter}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" fontWeight={600} noWrap title={siteName}>
                            {siteName}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            title={row.url || '—'}
                          >
                            {row.url || '—'}
                          </Typography>
                        </Box>
                      </Stack>

                      <Box
                        sx={{
                          minWidth: 0,
                          display: 'flex',
                          justifyContent: 'flex-start',
                          alignItems: 'center',
                        }}
                      >
                        <Stack spacing={0.75} alignItems="flex-start" sx={{ minWidth: 0 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ minWidth: 0 }}
                          >
                            <Avatar
                              alt={publisherName}
                              src={
                                row.publisher?.avatar
                                  ? `${CONFIG.assetsUrl}/upload/publisher/${row.publisher.avatar}`
                                  : undefined
                              }
                              sx={{
                                width: 42,
                                height: 42,
                                fontSize: 14,
                                fontWeight: 600,
                              }}
                            >
                              {publisherFirstLetter}
                            </Avatar>

                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                noWrap
                                title={publisherName}
                              >
                                {publisherName}
                              </Typography>

                              {row.publisher?.email && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  noWrap
                                  title={row.publisher.email}
                                >
                                  {row.publisher.email}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </Stack>
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                        }}
                      >
                        <Tooltip title="More actions">
                          <IconButton size="small" onClick={(e) => openMenu(e, row)}>
                            <Iconify icon="eva:more-vertical-fill" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Box sx={{ p: 3 }}>
                <TableNoData notFound />
              </Box>
            )}
          </Box>
        </Card>
      )}

      {/* Shared Menu for list card actions */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            if (menuRow) openView(menuRow);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <Iconify icon="solar:eye-bold" width={18} />
          </ListItemIcon>
          <ListItemText primary="View details" />
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (menuRow) openNotesDialog(menuRow);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <Iconify icon="mdi:note-edit-outline" width={18} />
          </ListItemIcon>
          <ListItemText primary="Notes" />
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (menuRow?.id) handleEdit(menuRow.id);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (menuRow?.id) handleDelete(menuRow.id);
            closeMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

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
          onChange={handlePageChange}
          renderItem={(item) => <PaginationItem {...item} />}
        />
      </Stack>

      <AddInventoryFormDialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={() => {
          setOpenAdd(false);
          fetchInventories(filters, currentPage, true);
          fetchStatusCounts(filters);
        }}
      />

      <EditInventoryFormDialog
        open={openEdit}
        id={editId}
        onClose={() => setOpenEdit(false)}
        onSuccess={() => {
          setOpenEdit(false);
          fetchInventories(filters, currentPage, true);
          fetchStatusCounts(filters);
        }}
      />

      <Dialog
        fullWidth
        maxWidth="md"
        open={viewOpen}
        onClose={() => setViewOpen(false)}
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
          Inventory #{selected?.id}
          <Box sx={{ flexGrow: 1 }} />
          {typeof selected?.status !== 'undefined' && <StatusChip value={selected?.status} />}
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            bgcolor: 'background.paper',
            maxHeight: 800,
            overflowY: 'auto',
            scrollBehavior: 'smooth',
            '&::-webkit-scrollbar': { width: 8 },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: (theme) => theme.palette.divider,
              borderRadius: 4,
            },
          }}
        >
          {!!selected && (
            <Stack spacing={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Updated on {selected.updatedAt ? fDate(selected.updatedAt) : '—'}
              </Typography>

              <Divider flexItem />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleChangeFile}
              />

              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 3 }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar
                    alt={
                      selected.publisher?.username ||
                      selected.publisher?.email ||
                      `Publisher #${selected.publisherId}`
                    }
                    src={
                      selected.publisher?.avatar
                        ? `${CONFIG.assetsUrl}/upload/publisher/${selected.publisher.avatar}`
                        : undefined
                    }
                    sx={{ width: 96, height: 96, fontSize: 20, fontWeight: 600 }}
                  >
                    {(selected.publisher?.username || selected.publisher?.email || `P`)
                      .charAt(0)
                      .toUpperCase()}
                  </Avatar>

                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      {selected.publisher?.username ||
                        selected.publisher?.email ||
                        (selected.publisherId ? `Publisher #${selected.publisherId}` : '—')}
                    </Typography>

                    {selected.publisher?.email && (
                      <Typography variant="caption" color="text.secondary">
                        {selected.publisher.email}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="overline" color="text.secondary">
                    Identity
                  </Typography>
                  <Stack spacing={1.25} sx={{ mt: 0.5 }}>
                    <Labeled label="ID">{selected.id}</Labeled>
                    <Labeled label="Name">{selected.name || '—'}</Labeled>
                    <Labeled label="Type">
                      <TypeChip value={selected.type} />
                    </Labeled>
                    <Labeled label="URL">
                      {selected.url ? (
                        <Box
                          component="a"
                          href={selected.url}
                          target="_blank"
                          rel="noreferrer"
                          sx={{ color: 'primary.main', textDecoration: 'underline' }}
                        >
                          {selected.url}
                        </Box>
                      ) : (
                        '—'
                      )}
                    </Labeled>
                  </Stack>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="overline" color="text.secondary">
                    Status
                  </Typography>
                  <Stack spacing={1.25} sx={{ mt: 0.5 }}>
                    <Labeled label="Inventory">
                      <StatusChip value={selected.status} />
                    </Labeled>
                    <Labeled label="Partner">
                      <PartnerStatusChip value={selected.partnerStatus} />
                    </Labeled>
                    <Labeled label="ads.txt">
                      <AdsTxtChip value={selected.adsTxtStatus} />
                    </Labeled>
                    <Labeled label="Publisher ID">{selected.publisherId ?? '—'}</Labeled>
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="overline" color="text.secondary">
                    Timestamps
                  </Typography>
                  <Stack spacing={1.25} sx={{ mt: 0.5 }}>
                    <Labeled label="Created">
                      {selected.createdAt
                        ? `${fDate(selected.createdAt)} ${fTime(selected.createdAt)}`
                        : '—'}
                    </Labeled>
                    <Labeled label="Updated">
                      {selected.updatedAt
                        ? `${fDate(selected.updatedAt)} ${fTime(selected.updatedAt)}`
                        : '—'}
                    </Labeled>
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:pen-bold" />}
            onClick={() => {
              setViewOpen(false);
              if (selected?.id) {
                setEditId(selected.id);
                setOpenEdit(true);
              }
            }}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Inventory</DialogTitle>
        <DialogContent>Are you sure you want to delete this inventory?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <InventoryNotesDialog
        open={notesOpen}
        inventory={notesInventory}
        headers={headers}
        onClose={closeNotesDialog}
      />
    </DashboardContent>
  );
}
