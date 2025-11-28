export const setCookie = (name, value, options = {}) => {
  let cookie = `${name}=${encodeURIComponent(value)}; path=/`;
  if (options.expires) {
    cookie += `; Expires=${options.expires.toUTCString()}`;
  }
  if (options.maxAge) {
    cookie += `; Max-Age=${options.maxAge}`;
  }
  if (options.secure) {
    cookie += `; Secure`;
  }
  if (options.sameSite) {
    cookie += `; SameSite=${options.sameSite}`;
  }
  document.cookie = cookie;
};

// Function to set session cookies
export const setSessionCookies = (sessionKey, sessionExpiration) => {
  const currentTime = new Date().getTime();
  const expirationTime = new Date(sessionExpiration).getTime();

  console.log('currentTime', currentTime);
  console.log('expirationTime: ', expirationTime);
  // Calculate Max-Age in seconds
  const maxAge = Math.floor((expirationTime - currentTime) / 1000);
  console.log('maxAge: ', expirationTime);

  if (maxAge > 0) {
    // Set session_key with calculated Max-Age
    setCookie('session_key', sessionKey, {
      maxAge,
      sameSite: 'Strict',
      secure: false,
    });

    // Optionally, set session_expiration cookie (for debugging or client-side use)
    setCookie('session_expiration', sessionExpiration, {
      maxAge,
      sameSite: 'Strict',
      secure: false,
    });
  } else {
    console.error('Session expiration time is in the past.');
  }
};

// Utility to get a cookie value by name
export const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

// Utility to delete a cookie
export const deleteCookie = (name) => {
  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Strict; Secure`;
};

export const safeParse = (json) => {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export function toNullableNumber(val) {
  if (val === '' || val === null || val === undefined) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

export function toNullableBoolean(val) {
  // Accept true/false, "true"/"false", 1/0, "1"/"0"
  if (val === '' || val === null || val === undefined) return null;
  if (typeof val === 'boolean') return val;
  if (val === 1 || val === '1') return true;
  if (val === 0 || val === '0') return false;
  const s = String(val).toLowerCase().trim();
  if (s === 'true') return true;
  if (s === 'false') return false;
  return null;
}

export function formatNumber(num, digits = 1) {
  if (num === null || num === undefined || isNaN(num)) return '0';

  const units = [
    { value: 1e9, symbol: 'B' },
    { value: 1e6, symbol: 'M' },
    { value: 1e3, symbol: 'K' },
  ];

  for (const unit of units) {
    if (num >= unit.value) {
      return (
        (num / unit.value).toFixed(digits).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, '$1') + unit.symbol
      );
    }
  }

  return num.toString();
}

export function stringToArray(text) {
  console.log('text', text);
  const raw = text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  console.log('raw', raw);

  return raw;
}

function sanitizePhone(value = '') {
  // keep digits only for WhatsApp deep links
  return (value || '').replace(/\D/g, '');
}

export function buildSocialUrl(type, id, name = '') {
  if (!type || !id) return null;

  // if user already pasted a full link, just use it
  if (/^https?:\/\//i.test(id)) return id;

  const t = String(type).toLowerCase().trim();
  const v = String(id).trim();

  switch (t) {
    case 'whatsapp': {
      const digits = sanitizePhone(v);
      // wa.me needs an E.164-ish number; fallback to a generic message if not a number
      return digits
        ? `https://wa.me/${digits}`
        : `https://wa.me/?text=${encodeURIComponent(`Hi ${name || ''}`)}`;
    }

    case 'telegram': {
      const user = v.replace(/^@/, '');
      return `https://t.me/${user}`;
    }

    case 'teams': {
      // works if the contact id is an email
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        return `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(v)}`;
      }
      // otherwise assume it’s a full link or nothing usable
      return null;
    }

    case 'messenger': {
      // user/page id or vanity: m.me/<id>
      const user = v.replace(/^@/, '');
      return `https://m.me/${user}`;
    }

    case 'line': {
      // prefer web fallback that opens app if installed
      const user = v.startsWith('@') ? v : `@${v}`;
      return `https://line.me/R/ti/p/${encodeURIComponent(user)}`;
    }

    default:
      return null;
  }
}

export const sanitizeSlug = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD') // split accents
    .replace(/[\u0300-\u036f]/g, '') // drop accent marks
    .replace(/&/g, 'and')
    .replace(/[\s._/]+/g, '-') // spaces/dots/underscores/slashes -> hyphen
    .replace(/[^a-z0-9-]/g, '') // keep only a-z, 0-9, and hyphen
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens

export const queryStringFrom = (filter, page) => {
  const qp = new URLSearchParams();
  if (filter) {
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) qp.append(k, v);
    });
  }
  if (page) qp.append('page', page);
  return qp.toString();
};

export const prettySize = (bytes = 0) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

export  const capitalize = (s = '') => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  
export const preview = (text = '', max = 80) => (text.length > max ? `${text.slice(0, max)}…` : text);
