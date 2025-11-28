'use client';

import { useRef, useState, useEffect } from 'react';

import { Box, Avatar, TextField, Typography, Autocomplete, CircularProgress } from '@mui/material';

import { getCookie } from 'src/utils/helper';

import { CONFIG } from 'src/global-config';

const LOAD_MORE_KEY = '__LOAD_MORE__';
const END_OF_LIST_KEY = '__END_OF_LIST__';

export default function PartnerByPublisherSelector({
  onPartnerSelect,
  label = 'Select partner by publisher',
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

  // ---------------- load list when search / status changes ----------------
  useEffect(() => {
    resetPaging();
    fetchPage(1, debouncedTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm, statusFilter]);

  // ---------------- preload selected when valueId provided ----------------
  useEffect(() => {
    if (valueId == null) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErrorText('');

        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('limit', '1');
        params.set('partnerId', String(valueId)); // use partnerId to load specific row

        const res = await fetch(`${CONFIG.apiUrl}/v1/admin/partners?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        if (cancelled) return;
        if (!json?.success) return;

        const partner = json?.data?.rows?.[0];
        if (partner && partner.id) {
          setSelected(partner);
          if (!seenIdsRef.current.has(partner.id)) {
            seenIdsRef.current.add(partner.id);
            setOptions((prev) => [partner, ...prev.filter((o) => !isSpecialOption(o))]);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // return () => {
    //   cancelled = true;
    // };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueId]);

  // -----------------------------------------------------------------------
  // helpers
  // -----------------------------------------------------------------------
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
      params.set('limit', '20');

      if (term && term.trim()) {
        params.set('publisherSearch', term.trim()); // backend will resolve to publisherId
      }

      if (statusFilter !== null && statusFilter !== undefined && statusFilter !== '') {
        params.set('status', String(statusFilter));
      }

      const res = await fetch(`${CONFIG.apiUrl}/v1/admin/partners?${params.toString()}`, {
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

  // --------- publisher helpers (using your sample JSON structure) ---------
  function getPublisherFromPartner(partner) {
    const link = partner?.partnerLinks?.[0];
    return link?.publisher || link?.Publisher || null;
  }

  function getPublisherLabel(partner) {
    const pub = getPublisherFromPartner(partner);
    if (!pub) return '';

    if (pub.username) return pub.username; // main label
    if (pub.email) return pub.email; // fallback
    if (pub.id) return `Publisher #${pub.id}`; // last fallback
    return '';
  }

  // what is shown in the input when one is selected
  function getOptionPrimaryText(partner) {
    const label = getPublisherLabel(partner);
    if (label) return label;
    // if somehow mapping is missing, show partner username as backup
    if (partner?.username) return partner.username;
    if (partner?.id) return `Partner #${partner.id}`;
    return '';
  }

  function getOptionSecondaryText(partner) {
    const bits = [];
    if (partner?.username) bits.push(`Partner: ${partner.username}`);
    if (partner?.email) bits.push(partner.email);
    if (typeof partner?.status === 'number') bits.push(`Status: ${partner.status}`);
    return bits.join(' · ');
  }

  // -----------------------------------------------------------------------
  // render
  // -----------------------------------------------------------------------
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
        if (!newVal) {
          setSelected(null);
          try {
            onPartnerSelect && onPartnerSelect(null, null);
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
          onPartnerSelect && onPartnerSelect(newVal.id, newVal);
        } catch {}
      }}
      onInputChange={(_, newInput, reason) => {
        if (reason === 'input' || reason === 'clear' || reason === 'reset') {
          setInputValue(newInput || '');
        }
      }}
      filterOptions={(opts) => opts} // server-side filtering
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

        const publisher = getPublisherFromPartner(option);
        const publisherDisplay = getPublisherLabel(option) || 'Publisher';
        const firstLetter = (publisherDisplay || 'P').charAt(0).toUpperCase();


        const avatarUrl = publisher?.avatar
          ? `${CONFIG.assetsUrl}/upload/publisher/${publisher.avatar}`
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
                src={avatarUrl || undefined}
                alt={publisherDisplay}
                sx={{ width: 40, height: 40, borderRadius: 1 }}
              >
                {firstLetter}
              </Avatar>

              <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {/* top: publisher username */}
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {publisherDisplay}
                </Typography>

                {/* bottom: partner info */}
                <Typography variant="caption" color="text.secondary">
                  {getOptionSecondaryText(option)}
                </Typography>
              </Box>
            </Box>
          </li>
        );
      }}
    />
  );
}

// simple debounce hook
function useDebounce(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
