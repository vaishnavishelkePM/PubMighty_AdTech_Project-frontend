// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  root: '/',
  faqs: '/faqs',
  // AUTH
  login: {
    root: `/login`,
    verify: `/login/verify`,
  },
  forgotPassword: {
    root: `/login/forgot-password`,
    verify: `/login/forgot-password/verify`,
    update: `/update-password`,
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    profile: {
      root: `${ROOTS.DASHBOARD}/profile`,
      update: `${ROOTS.DASHBOARD}/profile/update`,
      updatePassword: `${ROOTS.DASHBOARD}/profile/update-password`,
    },

    partners: {
      root: `${ROOTS.DASHBOARD}/partners`,
      new: `${ROOTS.DASHBOARD}/partners/new`,
      details: (id) => `${ROOTS.DASHBOARD}/partners/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/partners/${id}/edit`,
    },
    inventory: {
      root: `${ROOTS.DASHBOARD}/inventory`,
      new: `${ROOTS.DASHBOARD}/inventory/new`,
      details: (id) => `${ROOTS.DASHBOARD}/inventory/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/inventory/${id}/edit`,
      all: `${ROOTS.DASHBOARD}/inventory/all`,
      web: `${ROOTS.DASHBOARD}/inventory/web`,
      ott: `${ROOTS.DASHBOARD}/inventory/ott`,
      app: `${ROOTS.DASHBOARD}/inventory/app`,
    },
    publisher: {
      root: `${ROOTS.DASHBOARD}/publishers`,
      list: `${ROOTS.DASHBOARD}/publishers/list`,
      create: `${ROOTS.DASHBOARD}/publishers/add`,
      edit: (id) => `${ROOTS.DASHBOARD}/publishers/${id}`,
    },
    // admin: {
    //   root: `${ROOTS.DASHBOARD}/admin`,
    //   list: `${ROOTS.DASHBOARD}/admin`,
    //   create: `${ROOTS.DASHBOARD}/admin/add`,
    //   edit: (id) => `${ROOTS.DASHBOARD}/admin/${id}`,
    // },
    admin: {
      root: `${ROOTS.DASHBOARD}/admin`,
      list: `${ROOTS.DASHBOARD}/admin`,
      create: `${ROOTS.DASHBOARD}/admin/add`,
      edit: (id) => `${ROOTS.DASHBOARD}/admin/${id}`,
    },
    logs: {
      root: `${ROOTS.DASHBOARD}/logs`,
    },
  },
};
