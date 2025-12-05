'use client';

import { useRef, useState, useEffect } from 'react';
import {
  Box,
  Avatar,
  TextField,
  Typography,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import { getCookie } from 'src/utils/helper';
import { CONFIG } from 'src/global-config';

const LOAD_MORE_KEY = '__LOAD_MORE__';
const END_OF_LIST_KEY = '__END_OF_LIST__';

export default function PublisherInventorySelector({
  onInventorySelect,
  label = 'Select publisher',
  placeholder = 'Type publisher ID or username…',
  statusFilter = null, // publisher status
  valueId = undefined, // selected publisherId
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

  const reqSeqRef = useRef(0);
  const debouncedTerm = useDebounce(inputValue, 300);

  // ---------- LOAD LIST WHEN SEARCH / STATUS CHANGES ----------
  useEffect(() => {
    resetPaging();
    fetchPage(1, debouncedTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm, statusFilter]);

  // ---------- PRESELECT VALUE ----------
  useEffect(() => {
    if (valueId == null || valueId === '') return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErrorText('');

        // Assumes /v1/admin/publishers/:id exists
        const res = await fetch(`${CONFIG.apiUrl}/v1/admin/publishers/${valueId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Publisher not found');

        const json = await res.json();
        if (cancelled) return;

        const pub = json?.data || json?.publisher || null;
        if (pub && pub.id) {
          setSelected(pub);

          setOptions((prev) => {
            const normal = prev.filter((o) => !isSpecialOption(o));
            const already = normal.find((o) => o.id === pub.id);
            if (already) return prev;
            return [pub, ...normal, ...prev.filter((o) => isSpecialOption(o))];
          });
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [valueId, token]);

  // ---------- HELPERS ----------
  function resetPaging() {
    setOptions([]);
    setPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setErrorText('');
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

      // STATUS = publisher status
      if (statusFilter !== null && statusFilter !== undefined && statusFilter !== '') {
        params.set('status', String(statusFilter));
      }

      // SIMPLE SEARCH:
      // numeric → by id
      // text → by username/email (backend: adjust as per your API)
      if (term && term.trim()) {
        const trimmed = term.trim();
        const isNumeric = /^[0-9]+$/.test(trimmed);

        if (isNumeric) {
          params.set('id', trimmed);
        } else {
          params.set('search', trimmed); // e.g. search by username/email in backend
        }
      }

      const res = await fetch(`${CONFIG.apiUrl}/v1/admin/publishers?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (seq !== reqSeqRef.current) return;

      if (!json?.success) {
        throw new Error(json?.msg || json?.message || 'Request failed');
      }

      const rows = json?.data?.rows || json?.data?.publishers || [];
      const pagination = json?.data?.pagination || {};
      const newTotalPages = Number(pagination.totalPages || 1);
      const newTotalRecords = Number(pagination.total || rows.length);

      setOptions((prev) => {
        const base = targetPage === 1 ? [] : prev.filter((o) => !isSpecialOption(o));
        const combined = [...base, ...rows];
        return addFooterRows(combined, targetPage, newTotalPages, newTotalRecords);
      });

      setPage(targetPage);
      setTotalPages(newTotalPages);
      setTotalRecords(newTotalRecords);
    } catch (e) {
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

  // ---------- LABEL HELPERS ----------
  function getPublisherName(pub) {
    return (
      pub?.username ||
      pub?.email ||
      (pub?.id ? `PublisherId:${pub.id}` : 'Unknown publisher')
    );
  }

  function getPublisherEmail(pub) {
    return pub?.email || '';
  }

  function getPublisherIdText(pub) {
    return pub?.id ? `ID: ${pub.id}` : '';
  }

  // ---------- RENDER ----------
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
        return getPublisherName(opt);
      }}
      onChange={(_, newVal) => {
        if (!newVal) {
          setSelected(null);
          try {
            onInventorySelect && onInventorySelect(null, null);
          } catch {}
          return;
        }

        if (newVal?.id === LOAD_MORE_KEY) {
          handleLoadMoreClick();
          return;
        }

        if (newVal?.id === END_OF_LIST_KEY) {
          return;
        }

        setSelected(newVal);

        try {
          // keep prop name the same, but now returns publisherId + publisher object
          onInventorySelect && onInventorySelect(newVal.id, newVal);
        } catch {}
      }}
      onInputChange={(_, newInput, reason) => {
        if (reason === 'input' || reason === 'clear' || reason === 'reset') {
          setInputValue(newInput || '');
        }
      }}
      filterOptions={(opts, state) => {
        // Let backend handle search; only filter out if needed to keep MUI happy
        const term = (state?.inputValue || '').trim();
        if (!term) return opts;

        const normalOptions = opts.filter((o) => !isSpecialOption(o));
        const footers = opts.filter((o) => isSpecialOption(o));

        const lower = term.toLowerCase();
        const isNumeric = /^[0-9]+$/.test(term);

        let filtered = normalOptions;

        if (isNumeric) {
          filtered = normalOptions.filter((o) =>
            String(o.id || '').startsWith(term)
          );
        } else {
          filtered = normalOptions.filter((o) => {
            const username = o?.username || '';
            const email = o?.email || '';
            return (
              username.toLowerCase().includes(lower) ||
              email.toLowerCase().includes(lower)
            );
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
              <Box
                sx={{
                  py: 1,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                {loading ? <CircularProgress size={16} /> : null}
                <Typography variant="body2">Load more publishers</Typography>
              </Box>
            </li>
          );
        }

        if (option?.optionType === 'end') {
          return (
            <li
              {...props}
              key={END_OF_LIST_KEY}
              aria-disabled
              onMouseDown={(e) => e.preventDefault()}
            >
              <Box
                sx={{
                  py: 1,
                  width: '100%',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  End of list ({option.total ?? totalRecords})
                </Typography>
              </Box>
            </li>
          );
        }

        const publisherName = getPublisherName(option);
        const publisherEmail = getPublisherEmail(option);
        const publisherIdText = getPublisherIdText(option);

        const firstLetter = (publisherName || '?').charAt(0).toUpperCase();

        const avatarUrl = option.avatar
          ? `${CONFIG.assetsUrl}/upload/publishers/${option.avatar}`
          : '';

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
                alt={publisherName}
                sx={{ width: 40, height: 40, borderRadius: 1 }}
              >
                {firstLetter}
              </Avatar>

              <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {publisherName}
                </Typography>

                {publisherIdText && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {publisherIdText}
                  </Typography>
                )}

                {publisherEmail && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {publisherEmail}
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
