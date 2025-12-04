
'use client';

import { useRef, useState, useEffect } from 'react';

import { Box, Avatar, TextField, Typography, Autocomplete, CircularProgress } from '@mui/material';

import { getCookie } from 'src/utils/helper';

import { CONFIG } from 'src/global-config';

const LOAD_MORE_KEY = '__LOAD_MORE__';
const END_OF_LIST_KEY = '__END_OF_LIST__';

export default function PublisherInventorySelector({
  onInventorySelect,
  label = 'Select publisher',
  placeholder = 'Type publisher ID or username…',
  statusFilter = null,
  valueId = undefined,
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

  // IMPORTANT: track SEEN PUBLISHER IDs, not inventory IDs
  const seenPublisherIdsRef = useRef(new Set());
  const reqSeqRef = useRef(0);

  const debouncedTerm = useDebounce(inputValue, 300);

  useEffect(() => {
    resetPaging();
    fetchPage(1, debouncedTerm);
  }, [debouncedTerm, statusFilter]);

  useEffect(() => {
    if (valueId == null) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErrorText('');

        const res = await fetch(`${CONFIG.apiUrl}/v1/admin/inventory/${valueId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Not found');

        const json = await res.json();
        if (cancelled) return;

        const inv = json?.data || json?.inventory || null;
        if (inv && inv.id) {
          setSelected(inv);

          const publisherId = inv.publisherId || inv.publisher?.id;
          const key = publisherId || inv.id;

          if (!seenPublisherIdsRef.current.has(key)) {
            seenPublisherIdsRef.current.add(key);
            setOptions((prev) => [inv, ...prev.filter((o) => !isSpecialOption(o))]);
          }
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

  function resetPaging() {
    setOptions([]);
    setPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setErrorText('');
    seenPublisherIdsRef.current = new Set();
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

      if (term && term.trim()) {
        const trimmed = term.trim();
        const isNumeric = /^[0-9]+$/.test(trimmed);

        if (isNumeric) {
          // Search by PUBLISHER ID
          params.set('publisherId', trimmed);
        } else {
          // Search by PUBLISHER USERNAME
          params.set('publisherUsername', trimmed);
        }
      }

      if (statusFilter !== null && statusFilter !== undefined && statusFilter !== '') {
        params.set('status', String(statusFilter));
      }

      const res = await fetch(`${CONFIG.apiUrl}/v1/admin/inventory?${params.toString()}`, {
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

      const rows = json?.data?.rows || json?.data?.inventories || [];
      const pagination = json?.data?.pagination || {};
      const newTotalPages = Number(pagination.totalPages || 1);
      const newTotalRecords = Number(pagination.total || rows.length);

      const appended = [];

      for (const r of rows) {
        const publisherId = r.publisherId || r.publisher?.id;
        if (!publisherId) continue;

        // ✅ only one inventory per publisher
        if (!seenPublisherIdsRef.current.has(publisherId)) {
          seenPublisherIdsRef.current.add(publisherId);
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

  // --------- PUBLISHER-ONLY LABEL HELPERS ---------

  function getPublisherName(inv) {
    return (
      inv?.publisher?.username ||
      inv?.publisher?.email ||
      (inv?.publisherId ? `PublisherId:${inv.publisherId}` : 'Unknown publisher')
    );
  }

  function getPublisherEmail(inv) {
    return inv?.publisher?.email || '';
  }

  function getPublisherIdText(inv) {
    return inv?.publisherId ? `ID: ${inv.publisherId}` : '';
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

        const publisherId = newVal.publisherId || newVal.publisher?.id || null;

        try {
          // you can use publisherId in parent filter
          onInventorySelect && onInventorySelect(publisherId, newVal);
        } catch {}
      }}
      onInputChange={(_, newInput, reason) => {
        if (reason === 'input' || reason === 'clear' || reason === 'reset') {
          setInputValue(newInput || '');
        }
      }}
      filterOptions={(opts, state) => {
        const term = (state?.inputValue || '').trim();
        if (!term) return opts;

        const lower = term.toLowerCase();
        const isNumeric = /^[0-9]+$/.test(term);

        const normalOptions = opts.filter((o) => !isSpecialOption(o));
        const footers = opts.filter((o) => isSpecialOption(o));

        let filtered = normalOptions;

        if (isNumeric) {
          filtered = normalOptions.filter((o) =>
            String(o.publisherId || '').startsWith(term)
          );
        } else {
          filtered = normalOptions.filter((o) => {
            const username = o?.publisher?.username || '';
            return username.toLowerCase().startsWith(lower);
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
              <Box sx={{ py: 1, width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
                {loading ? <CircularProgress size={16} /> : null}
                <Typography variant="body2">
                  {loading ? 'Loading…' : 'Load more…'}
                </Typography>
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
              <Box sx={{ py: 1, width: '100%', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  — End of list ({option?.total ?? 0} items loaded) —
                </Typography>
              </Box>
            </li>
          );
        }

        const publisherName = getPublisherName(option);
        const publisherEmail = getPublisherEmail(option);
        const publisherIdText = getPublisherIdText(option);

        const firstLetter = (publisherName || '?').charAt(0).toUpperCase();

        const avatarUrl = option.publisher?.avatar
          ? `${CONFIG.assetsUrl}/upload/publisher/${option.publisher.avatar}`
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
