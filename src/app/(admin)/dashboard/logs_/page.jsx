import { redirect } from 'next/navigation';

import { CONFIG } from 'src/global-config';

// Import Publisher List View
import { AdminLogsView } from 'src/sections/dashboard/logs_/log-view';

// ----------------------------------------------------------------------

export const metadata = {
  title: `Log Management - ${CONFIG.appName}`,
  description: 'View Logs from the dashboard.',
};

export default async function logPage() {
  try {
    // fetch settings (same API used for admin settings)
    const [response] = await Promise.all([
      fetch(`${CONFIG.apiUrl}/v1/admin/settings`, {
        cache: 'no-store',
      }).then((res) => res.json()),
    ]);

    if (response?.success) {
      const settings = response.data;
      return <AdminLogsView settings={settings} />;
    }

    return <p>{response?.msg || 'Failed to load Logs data.'}</p>;
  } catch (error) {
    console.error('Error during fetching the Logs Page:', error);
    redirect('/404');
  }
}
