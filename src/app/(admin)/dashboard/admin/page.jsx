import { redirect } from 'next/navigation';

import { CONFIG } from 'src/global-config';

// Import your Admin view (the actual React UI component)
import { AdminListView } from 'src/sections/dashboard/admin/list-admin-view';

// ----------------------------------------------------------------------

export const metadata = {
  title: `Admin Management - ${CONFIG.appName}`,
  description: 'View, add, edit, or delete admins from the dashboard.',
};

export default async function AdminPage() {
  try {
    // fetch admin settings or initial data before rendering
    const [response] = await Promise.all([
      fetch(`${CONFIG.apiUrl}/v1/admin/settings`, {
        cache: 'no-store', // disable Next.js caching
      }).then((res) => res.json()),
    ]);

    if (response?.success) {
      const settings = response.data;

      // render your admin management UI and pass settings
      return <AdminListView settings={settings} />;
    }

    // if API fails
    return <p>{response?.msg || 'Failed to load admin data.'}</p>;
  } catch (error) {
    console.error('Error during AdminPage:', error);
    // redirect to error page if fetch fails
    redirect('/404');
  }
}
