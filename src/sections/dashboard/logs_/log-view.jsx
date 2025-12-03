'use client';

import axios from 'axios';
import { toast } from 'react-toastify';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { getCookie } from 'src/utils/helper';
import { fDate, fTime } from 'src/utils/format-time';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import AdminLogDetailsDialog from './child/admin-log-dialog';

// Default filters for LOGS
const DEFAULT_FILTERS = {
  id: '',
  adminId: '',
  actionCategory: '',
  actionType: '',
  fromDate: '',
  toDate: '',
};

// ---------- JSON HELPERS ----------
function parseJsonSafely(data) {
  if (!data) return null;

  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return parsed;
    } catch (err) {
      return data;
    }
  }

  return data;
}

// Fallback generic preview
function getJsonPreview(data) {
  if (!data) return '—';

  const parsed = parseJsonSafely(data);

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const entries = Object.entries(parsed);
    if (!entries.length) return '{}';
    const [firstKey, firstVal] = entries[0];
    return `{ ${firstKey}: ${String(firstVal)} ... }`;
  }

  if (Array.isArray(parsed)) {
    return `[ ${parsed.length} items ... ]`;
  }

  return String(parsed);
}

function getChangedFieldPreview(beforeData, afterData, side = "before") {
  const before = parseJsonSafely(beforeData) || {};
  const after = parseJsonSafely(afterData) || {};

  // If not both objects, return simple raw preview
  if (
    typeof before !== "object" ||
    typeof after !== "object" ||
    Array.isArray(before) ||
    Array.isArray(after)
  ) {
    return `{ value: ${String(
      side === "before" ? beforeData : afterData
    )} }`;
  }

  // Identify changed keys
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changedKeys = [];

  keys.forEach((key) => {
    const b = before[key];
    const a = after[key];

    if (JSON.stringify(b) !== JSON.stringify(a)) {
      changedKeys.push(key);
    }
  });

  // Determine which key to show
  let keyToShow;

  if (changedKeys.length > 0) {
    keyToShow = changedKeys[0]; // show only the first changed field
  } else {
    const allKeys = Object.keys(side === "before" ? before : after);
    if (!allKeys.length) return `{ }`;
    keyToShow = allKeys[0]; // fallback
  }

  const value =
    side === "before"
      ? before[keyToShow]
      : after[keyToShow];

  let display =
    value && typeof value === "object"
      ? "[object]"
      : String(value);

  return ` ${keyToShow}: ${display} `;
}


function getJsonPretty(data) {
  if (!data) return '';

  const parsed = parseJsonSafely(data);

  try {
    return JSON.stringify(parsed, null, 2);
  } catch (err) {
    return String(parsed);
  }
}

export function AdminLogsView() {
  const listUrlBase = `${CONFIG.apiUrl}/v1/admin/logs`;

  const [allRows, setAllRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const fetchedOnceRef = useRef(false);

  const [expandedJson, setExpandedJson] = useState({});
  const toggleJson = (rowId, type) => {
    const key = `${rowId}-${type}`;
    setExpandedJson((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleOpenDetails = (log) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedLog(null);
  };

  const fetchLogs = useCallback(async () => {
    try {
      const token = getCookie('session_key');
      if (!token) {
        toast.error('Session expired. Please login again.');
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      setLoading(true);

      const res = await axios.get(listUrlBase, {
        headers,
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.status === 401) {
        toast.error(res?.data?.msg || 'Unauthorized. Please login again.');
        return;
      }

      if (res.data?.success) {
        const data = res.data?.data || {};
        const logs = Array.isArray(data) ? data : data.rows || [];

        setAllRows(logs);
        setRows(logs);
        fetchedOnceRef.current = true;
        setPage(1);
      } else {
        toast.error(res.data?.msg || 'Failed to fetch admin logs');
      }
    } catch (err) {
      console.error('fetchLogs error:', err);
      toast.error('Error fetching admin logs');
    } finally {
      setLoading(false);
    }
  }, [listUrlBase]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Apply filters client-side
  useEffect(() => {
    if (!fetchedOnceRef.current) return;

    const filtered = allRows.filter((row) => {
      const idMatch = filters.id ? String(row.id) === String(filters.id) : true;

      const adminIdMatch = filters.adminId
        ? String(row.adminId) === String(filters.adminId)
        : true;

      const actionCategoryMatch = filters.actionCategory
        ? (row.actionCategory || '')
            .toLowerCase()
            .includes(filters.actionCategory.toLowerCase())
        : true;

      const actionTypeMatch = filters.actionType
        ? (row.actionType || '')
            .toLowerCase()
            .includes(filters.actionType.toLowerCase())
        : true;

      let dateMatch = true;
      if (filters.fromDate || filters.toDate) {
        const rowDate = row.date ? new Date(row.date) : null;
        if (rowDate) {
          if (filters.fromDate) {
            const from = new Date(filters.fromDate);
            if (rowDate < from) dateMatch = false;
          }
          if (filters.toDate) {
            const to = new Date(filters.toDate);
            to.setHours(23, 59, 59, 999);
            if (rowDate > to) dateMatch = false;
          }
        }
      }

      return (
        idMatch &&
        adminIdMatch &&
        actionCategoryMatch &&
        actionTypeMatch &&
        dateMatch
      );
    });

    setRows(filtered);
    setPage(1);
  }, [filters, allRows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const paginatedRows = rows.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <DashboardContent maxWidth="xl">
      {/* ========= HEADER ========= */}
      <CustomBreadcrumbs
        heading="Admin Logs"
        links={[
          { name: 'Home', href: paths.root },
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Admin Logs', href: paths.dashboard.admin?.root || '#' },
        ]}
        action={
          <Button
            variant="contained"
            onClick={() => setShowFilter((prev) => !prev)}
          >
            <Iconify icon="stash:filter" sx={{ width: 20, mr: 1 }} />
            {showFilter ? 'Hide Filter' : 'Show Filter'}
          </Button>
        }
        sx={{ mb: 2 }}
      />

      {/* ========= FILTERS ========= */}
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
              label="Log ID"
              value={filters.id}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, id: e.target.value }))
              }
              fullWidth
            />

            <TextField
              label="Admin ID"
              value={filters.adminId}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, adminId: e.target.value }))
              }
              fullWidth
            />

            <TextField
              label="Action Category"
              value={filters.actionCategory}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  actionCategory: e.target.value,
                }))
              }
              fullWidth
            />

            <TextField
              label="Action Type"
              value={filters.actionType}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  actionType: e.target.value,
                }))
              }
              fullWidth
            />

            <TextField
              type="date"
              label="From Date"
              InputLabelProps={{ shrink: true }}
              value={filters.fromDate}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  fromDate: e.target.value,
                }))
              }
              fullWidth
            />

            <TextField
              type="date"
              label="To Date"
              InputLabelProps={{ shrink: true }}
              value={filters.toDate}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  toDate: e.target.value,
                }))
              }
              fullWidth
            />

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
                  setFilters(DEFAULT_FILTERS);
                }}
              >
                Reset
              </Button>

              <Button
                fullWidth
                size="medium"
                variant="contained"
                onClick={fetchLogs}
              >
                apply
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
          <Typography sx={{ fontSize: 14 }}>Total Log Entries</Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
            {rows.length}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            p: 2,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: '#d0bb00ff',
            color: '#fff',
          }}
        >
          <Iconify icon="mdi:clipboard-text-clock-outline" />
        </Box>
      </Card>

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
                  <TableCell>Log ID</TableCell>
                  <TableCell>Admin ID</TableCell>
                  <TableCell>Action Category</TableCell>
                  <TableCell>Action Type</TableCell>
                  <TableCell>Before Action Data</TableCell>
                  <TableCell>After Action Data</TableCell>
                  <TableCell>Log Date</TableCell>

                  <TableCell align="center">View Data</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedRows.length ? (
                  paginatedRows.map((row) => {
                    const beforeKey = `${row.id}-before`;
                    const afterKey = `${row.id}-after`;
                    const beforeExpanded = !!expandedJson[beforeKey];
                    const afterExpanded = !!expandedJson[afterKey];

                    const beforePreview = getChangedFieldPreview(
                      row.beforeAction,
                      row.afterAction,
                      'before'
                    );
                    const afterPreview = getChangedFieldPreview(
                      row.beforeAction,
                      row.afterAction,
                      'after'
                    );

                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.adminId}</TableCell>
                        <TableCell>{row.actionCategory || '—'}</TableCell>
                        <TableCell>{row.actionType || '—'}</TableCell>

                        <TableCell sx={{ maxWidth: 280 }}>
                          {row.beforeAction ? (
                            <Box>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.5}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: 'monospace',
                                    maxWidth: 220,
                                  }}
                                  noWrap
                                >
                                  {beforePreview}
                                </Typography>

                              </Stack>

                              <Collapse
                                in={beforeExpanded}
                                timeout="auto"
                                unmountOnExit
                              >
                                <Box
                                  component="pre"
                                  sx={(theme) => ({
                                    mt: 1,
                                    p: 1.5,
                                    bgcolor:
                                      theme.palette.mode === 'dark'
                                        ? theme.palette.background.paper
                                        : theme.palette.action.hover,
                                    borderRadius: 1,
                                    border: `1px solid ${theme.palette.divider}`,
                                    fontSize: 12,
                                    fontFamily:
                                      'JetBrains Mono, Menlo, Consolas, monospace',
                                    whiteSpace: 'pre-wrap',
                                    overflow: 'visible',
                                    maxHeight: 'none',
                                  })}
                                >
                                  {getJsonPretty(row.beforeAction)}
                                </Box>
                              </Collapse>
                            </Box>
                          ) : (
                            '—'
                          )}
                        </TableCell>

                        {/* AFTER DATA */}
                        <TableCell sx={{ maxWidth: 280 }}>
                          {row.afterAction ? (
                            <Box>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.5}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: 'monospace',
                                    maxWidth: 220,
                                  }}
                                  noWrap
                                >
                                  {afterPreview}
                                </Typography>


                              </Stack>

                              <Collapse
                                in={afterExpanded}
                                timeout="auto"
                                unmountOnExit
                              >
                                <Box
                                  component="pre"
                                  sx={(theme) => ({
                                    mt: 1,
                                    p: 1.5,
                                    bgcolor:
                                      theme.palette.mode === 'dark'
                                        ? theme.palette.background.paper
                                        : theme.palette.action.hover,
                                    borderRadius: 1,
                                    border: `1px solid ${theme.palette.divider}`,
                                    fontSize: 12,
                                    fontFamily:
                                      'JetBrains Mono, Menlo, Consolas, monospace',
                                    whiteSpace: 'pre-wrap',
                                    overflow: 'visible',
                                    maxHeight: 'none',
                                  })}
                                >
                                  {getJsonPretty(row.afterAction)}
                                </Box>
                              </Collapse>
                            </Box>
                          ) : (
                            '—'
                          )}
                        </TableCell>

                        <TableCell>
                          {row.date ? (
                            <Stack spacing={0}>
                              <Typography variant="body2">
                                {fDate(row.date)}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {fTime(row.date)}
                              </Typography>
                            </Stack>
                          ) : (
                            '—'
                          )}
                        </TableCell>

                        <TableCell align="center">
                          <Tooltip title="View full change details">
                            <IconButton onClick={() => handleOpenDetails(row)}>
                              <Iconify icon="solar:eye-bold"  width={20} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    {/* ⬇ colSpan updated from 7 to 8 */}
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      No logs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, newPage) => setPage(newPage)}
        />
      </Box>

      <AdminLogDetailsDialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        log={selectedLog}
      />
    </DashboardContent>
  );
}

export default AdminLogsView;
