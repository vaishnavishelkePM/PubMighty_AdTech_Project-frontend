'use client';

import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { getCookie } from 'src/utils/helper';

import { CONFIG } from 'src/global-config';

const LOAD_MORE_KEY = '__LOAD_MORE__';
const END_OF_LIST_KEY = '__END_OF_LIST__';

export default function AdminSelector({
  onAdminSelect,
  label = 'Assign to admin',
  placeholder = 'Type admin ID or username…',
  statusFilter = null, // 0,1,2,3 or null
  roleFilter = '', // 'superAdmin', 'staff', 'paymentManager', 'support' or ''
  twoFaFilter = null, // 0 or 1 or null
  valueId = undefined, // pre-selected admin id
  disabled = false,
  fullWidth = true,
  sx,
}) {
  const token = getCookie('session_key');

  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const seenIdsRef = useRef(new Set());
  const reqSeqRef = useRef(0);

  const debouncedTerm = useDebounce(inputValue, 300);

  // Reset & fetch when search/filter changes
  useEffect(() => {
    resetPaging();
    fetchPage(1, debouncedTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm, statusFilter, roleFilter, twoFaFilter]);

  // Preload selected admin by id
  useEffect(() => {
    if (valueId == null) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErrorText('');

        const res = await fetch(`${CONFIG.apiUrl}/v1/admin/admins/${valueId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Not found');

        const json = await res.json();
        if (cancelled) return;

        const admin = json?.data || json?.admin || null;
        if (admin && admin.email) {
          setSelected(admin);
          if (!seenIdsRef.current.has(admin.email)) {
            seenIdsRef.current.add(admin.email);
            setOptions((prev) => [admin, ...prev.filter((o) => !isSpecialOption(o))]);
          }
        }
      } catch {
        // ignore if not found
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // return () => {
    //   cancelled = true;
    // };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueId]);

  function resetPaging() {
    setOptions([]);
    setPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setErrorText('');
    seenIdsRef.current = new Set();
  }

  async function fetchPage(targetPage, term) {
    const seq = ++reqSeqRef.current;

    try {
      setLoading(true);
      setErrorText('');

      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      params.set('sortBy', 'createdAt');
      params.set('sortDir', 'desc');

      const trimmed = (term || '').trim();

      if (trimmed) {
        // API supports either `username` or `email`. We’ll decide:
        if (trimmed.includes('@')) {
          params.set('email', trimmed.toLowerCase());
        } else {
          params.set('username', trimmed);
        }
      }

      if (statusFilter !== null && statusFilter !== undefined && statusFilter !== '') {
        params.set('status', String(statusFilter));
      }

      if (roleFilter) {
        params.set('role', roleFilter);
      }

      if (twoFaFilter !== null && twoFaFilter !== undefined && twoFaFilter !== '') {
        params.set('two_fa', String(twoFaFilter));
      }

      const res = await fetch(`${CONFIG.apiUrl}/v1/admin/admins?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (seq !== reqSeqRef.current) return;

      if (!json?.success) {
        throw new Error(json?.msg || 'Request failed');
      }

      const rows = json?.data?.rows || [];
      const pagination = json?.data?.pagination || {};
      const newTotalPages = Number(pagination.totalPages || 1);
      const newTotalRecords = Number(pagination.total || rows.length);

      const appended = [];
      for (const r of rows) {
        if (!seenIdsRef.current.has(r.email)) {
          seenIdsRef.current.add(r.email);
          appended.push(r);
        }
      }

      setOptions((prev) => {
        const base = targetPage === 1 ? [] : prev.filter((o) => !isSpecialOption(o));
        const combined = [...base, ...appended];
        return addFooterRows(combined, targetPage, newTotalPages, newTotalRecords);
      });

      setPage(targetPage);
      setTotalPages(newTotalPages);
      setTotalRecords(newTotalRecords);
    } catch (e) {
      console.error('fetch admins error:', e);
      setErrorText(e?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function addFooterRows(list, currentPage, newTotalPages, newTotalRecords) {
    const clean = list.filter((o) => !isSpecialOption(o));

    if (currentPage < newTotalPages) {
      clean.push({ id: LOAD_MORE_KEY, optionType: 'loadMore' });
    } else {
      clean.push({ id: END_OF_LIST_KEY, optionType: 'end', total: newTotalRecords });
    }

    return clean;
  }

  function isSpecialOption(opt) {
    return opt?.optionType === 'loadMore' || opt?.optionType === 'end';
  }

  function handleLoadMoreClick(e) {
    e?.preventDefault?.();
    if (!loading && page < totalPages) {
      fetchPage(page + 1, debouncedTerm);
    }
  }

  // Primary text: username or email or fallback
  function getOptionPrimaryText(admin) {
    return admin?.username || admin?.email || `Admin #${admin?.id ?? ''}`.trim();
  }

  // Secondary: #id · role
  function getOptionSecondaryText(admin) {
    const bits = [];
    if (admin?.id) bits.push(`${admin.email}`);
    if (admin?.role) bits.push(admin.role);
    return bits.join(' · ');
  }

  return (
    <Autocomplete
      sx={sx}
      fullWidth={fullWidth}
      disabled={disabled}
      loading={loading}
      options={options}
      value={selected}
      inputValue={inputValue}
      isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
      getOptionLabel={(opt) => {
        if (!opt) return '';
        if (opt.id === LOAD_MORE_KEY || opt.id === END_OF_LIST_KEY) return '';
        return getOptionPrimaryText(opt);
      }}
      onChange={(_, newVal) => {
        // cleared
        if (!newVal) {
          setSelected(null);
          try {
            onAdminSelect && onAdminSelect(null, null);
          } catch {
            // ignore parent errors
          }
          return;
        }

        // load more
        if (newVal?.id === LOAD_MORE_KEY) {
          handleLoadMoreClick();
          return;
        }

        // end-of-list
        if (newVal?.id === END_OF_LIST_KEY) {
          return;
        }

        // normal admin
        setSelected(newVal);
        try {
          onAdminSelect && onAdminSelect(newVal.id, newVal);
        } catch {
          // ignore
        }
      }}
      onInputChange={(_, newInput, reason) => {
        if (reason === 'input' || reason === 'clear' || reason === 'reset') {
          setInputValue(newInput || '');
        }
      }}
      // Local filter so numeric ID search works on loaded rows
      filterOptions={(opts, state) => {
        const term = (state?.inputValue || '').trim();
        if (!term) return opts;

        const lower = term.toLowerCase();
        const isNumeric = /^[0-9]+$/.test(term);

        const normalOptions = opts.filter((o) => !isSpecialOption(o));
        const footers = opts.filter((o) => isSpecialOption(o));

        let filtered = normalOptions;

        if (isNumeric) {
          filtered = normalOptions.filter((o) => String(o.id || '').startsWith(term));
        } else {
          filtered = normalOptions.filter((o) => {
            const username = o?.username || '';
            const email = o?.email || '';
            return username.toLowerCase().includes(lower) || email.toLowerCase().includes(lower);
          });
        }

        return [...filtered, ...footers];
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          helperText={errorText || ''}
          error={Boolean(errorText)}
        />
      )}
      renderOption={(props, option) => {
        // Load more row
        if (option?.optionType === 'loadMore') {
          return (
            <li
              {...props}
              key={LOAD_MORE_KEY}
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleLoadMoreClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLoadMoreClick(e);
                }
              }}
              style={{ cursor: loading ? 'default' : 'pointer' }}
            >
              <Box sx={{ py: 1, width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
                {loading ? <CircularProgress size={16} /> : null}
                <Typography variant="body2">{loading ? 'Loading…' : 'Load more…'}</Typography>
              </Box>
            </li>
          );
        }

        // End-of-list row
        if (option?.optionType === 'end') {
          return (
            <li
              {...props}
              key={END_OF_LIST_KEY}
              aria-disabled
              onMouseDown={(e) => e.preventDefault()}
            >
              <Box sx={{ py: 1, width: '100%', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  — End of list ({option?.total ?? 0} items loaded) —
                </Typography>
              </Box>
            </li>
          );
        }

        const primary = getOptionPrimaryText(option);
        const secondary = getOptionSecondaryText(option);
        const firstLetter = (primary || '?').charAt(0).toUpperCase();

        const avatarUrl = option.avatar ? `${CONFIG.assetsUrl}/upload/admin/${option.avatar}` : '';

        return (
          <li {...props} key={option.id}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr',
                gap: 1,
                alignItems: 'center',
              }}
            >
              <Avatar
                src={avatarUrl}
                alt={primary}
                sx={{ width: 40, height: 40, borderRadius: '50%' }}
              >
                {firstLetter}
              </Avatar>

              <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {primary}
                </Typography>
                {secondary && (
                  <Typography variant="caption" color="text.secondary">
                    {secondary}
                  </Typography>
                )}
              </Box>
            </Box>
          </li>
        );
      }}
    />
  );
}

function useDebounce(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
