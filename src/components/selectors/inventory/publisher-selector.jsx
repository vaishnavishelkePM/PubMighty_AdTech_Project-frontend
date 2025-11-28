
'use client';

import { useRef, useState, useEffect } from 'react';

import { Box, Avatar, TextField, Typography, Autocomplete, CircularProgress } from '@mui/material';

import { getCookie } from 'src/utils/helper';

import { CONFIG } from 'src/global-config';

const LOAD_MORE_KEY = '__LOAD_MORE__';
const END_OF_LIST_KEY = '__END_OF_LIST__';



export default function PublisherInventorySelector({
  onInventorySelect,
  label = 'Select inventory',
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

  const seenIdsRef = useRef(new Set());
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
          if (!seenIdsRef.current.has(inv.id)) {
            seenIdsRef.current.add(inv.id);
            setOptions((prev) => [inv, ...prev.filter((o) => !isSpecialOption(o))]);
          }
        }
      } catch {
        // ignore if not found or endpoint not ready
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

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

      // Optional status filter
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
        if (!seenIdsRef.current.has(r.id)) {
          seenIdsRef.current.add(r.id);
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

  // Primary text: Inventory Name or fallback
  function getOptionPrimaryText(inv) {
    return inv?.name || `Inventory #${inv?.id ?? ''}`.trim();
  }

  // Secondary text: “#inventoryId · publisherUsername · type”
  function getOptionSecondaryText(inv) {
    const bits = [];
    if (inv?.id) bits.push(`#${inv.id}`);
    if (inv?.publisher?.username) bits.push(inv.publisher.username);
    if (inv?.type) bits.push(inv.type);
    return bits.join(' · ');
  }

  // Tertiary text: publisher email or URL
  function getOptionTertiaryText(inv) {
    if (inv?.publisher?.email) return inv.publisher.email;
    if (inv?.url) return inv.url;
    return '';
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
        // 1) cleared
        if (!newVal) {
          setSelected(null);
          try {
            onInventorySelect && onInventorySelect(null, null);
          } catch {
            // ignore parent errors
          }
          return;
        }

        // 2) load more row
        if (newVal?.id === LOAD_MORE_KEY) {
          handleLoadMoreClick();
          return;
        }

        // 3) end-of-list footer
        if (newVal?.id === END_OF_LIST_KEY) {
          return;
        }

        // 4) normal inventory selection
        setSelected(newVal);
        try {
          onInventorySelect && onInventorySelect(newVal.id, newVal);
        } catch {
          // parent errors ignored
        }
      }}
      onInputChange={(_, newInput, reason) => {
        // handle clear/reset so old search is dropped
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
          // match by publisherId
          filtered = normalOptions.filter((o) => String(o.publisherId || '').startsWith(term));
        } else {
          // match by publisher.username
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

        const publisherName =
          option.publisher?.username ||
          option.publisher?.email ||
          (option.publisherId ? `Publisher #${option.publisherId}` : '');

        const firstLetter = (publisherName || getOptionPrimaryText(option) || '?')
          .charAt(0)
          .toUpperCase();

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
                alt={publisherName || getOptionPrimaryText(option)}
                sx={{ width: 40, height: 40, borderRadius: 1 }}
              >
                {firstLetter}
              </Avatar>

              <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {getOptionPrimaryText(option)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getOptionSecondaryText(option)}
                </Typography>
                {getOptionTertiaryText(option) && (
                  <Typography variant="caption" color="text.secondary">
                    {getOptionTertiaryText(option)}
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
