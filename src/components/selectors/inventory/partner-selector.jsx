'use client';

import { useRef, useState, useEffect } from 'react';
import { Box, Avatar, TextField, Typography, Autocomplete, CircularProgress } from '@mui/material';

import { getCookie } from 'src/utils/helper';
import { CONFIG } from 'src/global-config';

const LOAD_MORE_KEY = '__LOAD_MORE__';
const END_OF_LIST_KEY = '__END_OF_LIST__';

export default function PartnerInventorySelector({
  onInventorySelect,
  label = 'Select partner',
  placeholder = 'Type partner ID or username…',
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

  // IMPORTANT: track *partner ids*, not inventory ids
  const seenPartnerIdsRef = useRef(new Set());
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

        // NOTE: valueId here is assumed to be inventoryId.
        // For filter prefill by partnerId you can skip this block if not needed.
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

          const partnerId = inv.partnerId || inv.partner?.id;
          const key = partnerId || inv.id;

          if (!seenPartnerIdsRef.current.has(key)) {
            seenPartnerIdsRef.current.add(key);
            setOptions((prev) => [inv, ...prev.filter((o) => !isSpecialOption(o))]);
          }
        }
      } catch {
        console.log("Error during fetch inventory api ")
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [valueId, token]);

  // Helpers

  function resetPaging() {
    setOptions([]);
    setPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setErrorText('');
    seenPartnerIdsRef.current = new Set();
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

      // Search by partnerId or partnerUsername
      if (term && term.trim()) {
        const trimmed = term.trim();
        const isNumeric = /^[0-9]+$/.test(trimmed);

        if (isNumeric) {
          params.set('partnerId', trimmed);
        } else {
          params.set('partnerUsername', trimmed);
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
        const partnerId = r.partnerId || r.partner?.id;
        if (!partnerId) continue;

        // only one inventory per partner
        if (!seenPartnerIdsRef.current.has(partnerId)) {
          seenPartnerIdsRef.current.add(partnerId);
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

  function getPartnerName(inv) {
    console.log(inv)
    return (
      inv?.partner?.name ||
      inv?.partner?.email ||
      (inv?.id ? `PartnerId: ${inv.id}` : 'Unknown partner')
    );
  }

  function getPartnerEmail(inv) {
    return inv?.partner?.email || '';
  }

  function getPartnerIdText(inv) {
    return inv?.partnerId ? `ID: ${inv.partnerId}` : '';
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
        // show only partner name in the input
        return getPartnerName(opt);
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

        const partnerId = newVal.partnerId || newVal.partner?.id || null;
        try {
          // send partnerId to parent for filter
          onInventorySelect && onInventorySelect(partnerId, newVal);
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
          // match by partnerId
          filtered = normalOptions.filter((o) =>
            String(o.partnerId || '').startsWith(term)
          );
        } else {
          // match by partner.username
          filtered = normalOptions.filter((o) => {
            const username = o?.partner?.username || '';
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

        const partnerName = getPartnerName(option);
        const partnerEmail = getPartnerEmail(option);
        const partnerIdText = getPartnerIdText(option);

        const firstLetter = (partnerName || '?').charAt(0).toUpperCase();

        const avatarUrl = option.partner?.avatar
          ? `${CONFIG.assetsUrl}/upload/partner/${option.partner.avatar}`
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
                alt={partnerName}
                sx={{ width: 40, height: 40, borderRadius: 1 }}
              >
                {firstLetter}
              </Avatar>

              <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {/* Line 1: partner name */}
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {partnerName}
                </Typography>

                {/* Line 2: Partner ID */}
                {partnerIdText && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {partnerIdText}
                  </Typography>
                )}

                {/* Line 3: Partner email */}
                {partnerEmail && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {partnerEmail}
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

// Debounce hook
function useDebounce(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
