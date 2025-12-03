import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  dashboard: icon('ic-dashboard'),
  partner: icon('ic-user'),
  publisher: icon('ic-user'),
  admin: icon('ic-user'),
  inventory: icon('ic-inventory'),
};

// ----------------------------------------------------------------------

export const navData = [
  /**
   * Overview
   */
  {
    subheader: 'Overview',
    items: [
      {
        title: 'Dashboard',
        path: paths.dashboard.root,
        icon: ICONS.dashboard,
      },
    ],
  },

  /**
   * Management
   */
  {
    subheader: 'Management',
    items: [
      {
        title: 'Inventory',
        path: paths.dashboard.inventory.root,
        icon: ICONS.inventory,
        children: [
          {
            title: 'Active',
            path: paths.dashboard.inventory.all,
          },
          {
            title: 'Web',
            path: paths.dashboard.inventory.web,
          },
          {
            title: 'OTT',
            path: paths.dashboard.inventory.ott,
          },
          {
            title: 'App',
            path: paths.dashboard.inventory.app,
          },
          {
            title: 'Deleted',
            path: paths.dashboard.inventory.delete,
          },
        ],
      },
    ],
  },

  /**
   * User Management
   */
  {
    subheader: 'User Management',
    items: [
      {
        title: ' Partners',
        path: paths.dashboard.partners.root,
        icon: ICONS.partner,
        children: [
          {
            title: 'Active',
            path: paths.dashboard.partners.all,
          },
          {
            title: 'Deleted',
            path: paths.dashboard.partners.delete,
          },
        ],
      },
      {
        title: 'Publishers',
        path: paths.dashboard.publisher.root,
        icon: ICONS.publisher,
        children: [
          {
            title: 'Active',
            path: paths.dashboard.publisher.all,
          },
          {
            title: 'Deleted',
            path: paths.dashboard.publisher.delete,
          },
        ],
      },
    ],
  },

  /**
   * Site
   */
  {
    subheader: 'Site',
    items: [
      {
        title: 'Admin',
        path: paths.dashboard.admin.list,
        icon: ICONS.admin,
      },
    ],
  },
  {
    subheader: 'Log Reports',
    items: [
      {
        title: 'Admin Logs',
        path: paths.dashboard.logs.root,
        icon: ICONS.admin_log,
      },
    ],
  },
];
