'use client';

import { useRef, useState, useEffect } from 'react';

import { Box, Avatar, TextField, Typography, Autocomplete, CircularProgress } from '@mui/material';

import { getCookie } from 'src/utils/helper';

import { CONFIG } from 'src/global-config';

const LOAD_MORE_KEY = '__LOAD_MORE__';
const END_OF_LIST_KEY = '__END_OF_LIST__';

export default function PublisherByPartnerSelector({
  onPublisherSelect,
  label = 'Select publisher by partner',
  placeholder = 'Type partner ID or username…',
  statusFilter = null,
  valueId = undefined, // publisherId
  disabled = false,
  fullWidth = true,
  sx,
}) {
  const token = getCookie('session_key');

  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]); // publishers
  const [selected, setSelected] = useState(null); // selected publisher

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
        params.set('publisherId', String(valueId)); // backend: load specific publisher

        const res = await fetch(`${CONFIG.apiUrl}/v1/admin/publishers?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        if (cancelled) return;
        if (!json?.success) return;

        const publisher = json?.data?.rows?.[0];
        if (publisher && publisher.id) {
          setSelected(publisher);
          if (!seenIdsRef.current.has(publisher.id)) {
            seenIdsRef.current.add(publisher.id);
            setOptions((prev) => [publisher, ...prev.filter((o) => !isSpecialOption(o))]);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // optional cleanup
    // return () => { cancelled = true; };
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

      // 🔥 IMPORTANT:
      // here we search publishers BY partner (id / username)
      // so backend should support ?partnerSearch=... on /v1/admin/publishers
      if (term && term.trim()) {
        params.set('partnerSearch', term.trim());
      }

      if (statusFilter !== null && statusFilter !== undefined && statusFilter !== '') {
        params.set('status', String(statusFilter));
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
        throw new Error(json?.msg || 'Request failed');
      }

      const rows = json?.data?.rows || []; // these are publishers
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

  // ---------------- partner helpers (inverse of your previous one) --------
  // Expecting publisher.publisherLinks[0].partner from backend
  function getPartnerFromPublisher(publisher) {
    const link = publisher?.publisherLinks?.[0];
    return link?.partner || link?.Partner || null;
  }

  function getPartnerLabel(publisher) {
    const partner = getPartnerFromPublisher(publisher);
    if (!partner) return '';

    if (partner.username) return partner.username;
    if (partner.email) return partner.email;
    if (partner.id) return `Partner #${partner.id}`;
    return '';
  }

  // what is shown in the input when a publisher is selected
  function getOptionPrimaryText(publisher) {
    // main: publisher username / domain / name
    const label = getPartnerLabel(publisher);
    if (label) return label;
    if (publisher?.username) return publisher.username;
    if (publisher?.domain) return publisher.domain;
    if (publisher?.email) return publisher.email;

    // // fallback: publisher id
    // if (publisher?.id) return `Publisher #${publisher.id}`;

    // // last fallback: partner label
    // const partnerLabel = getPartnerLabel(publisher);
    // if (partnerLabel) return partnerLabel;

    return '';
  }

  function getOptionSecondaryText(publisher) {
    const partner = getPartnerFromPublisher(publisher);
    const bits = [];

    const partnerLabel = getPartnerLabel(publisher);
    if (partnerLabel) bits.push(`Partner: ${partnerLabel}`);
    if (partner?.email) bits.push(partner.email);
    if (typeof partner?.status === 'number') bits.push(`Partner status: ${partner.status}`);

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
            onPublisherSelect && onPublisherSelect(null, null);
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
          // return publisherId + full publisher row
          onPublisherSelect && onPublisherSelect(newVal.id, newVal);
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

        const publisher = option;
        const partner = getPartnerFromPublisher(publisher);

        const primaryLabel = getOptionPrimaryText(publisher) || 'Publisher';
        const firstLetter = (primaryLabel || 'P').charAt(0).toUpperCase();

        const avatarUrl = publisher?.avatar
          ? `${CONFIG.assetsUrl}/upload/publishers/${publisher.avatar}`
          : '';

        return (
          <li {...props} key={publisher.id}>
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
                alt={primaryLabel}
                sx={{ width: 40, height: 40, borderRadius: 1 }}
              >
                {firstLetter}
              </Avatar>

              <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {/* top: publisher info */}
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {primaryLabel}
                </Typography>

                {/* bottom: partner info used for searching */}
                <Typography variant="caption" color="text.secondary">
                  {getOptionSecondaryText(publisher)}
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
