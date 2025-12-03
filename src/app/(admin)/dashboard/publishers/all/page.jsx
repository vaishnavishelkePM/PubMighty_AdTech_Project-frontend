import { redirect } from 'next/navigation';

import { CONFIG } from 'src/global-config';

// Import Publisher List View
import { PublisherListView } from 'src/sections/dashboard/publishers/publisher-view';

// ----------------------------------------------------------------------

export const metadata = {
  title: `Publisher Management - ${CONFIG.appName}`,
  description: 'View, add, edit, or manage publishers from the dashboard.',
};

export default async function PublisherPage() {
  try {
    // fetch settings (same API used for admin settings)
    const [response] = await Promise.all([
      fetch(`${CONFIG.apiUrl}/v1/admin/settings`, {
        cache: 'no-store',
      }).then((res) => res.json()),
    ]);

    if (response?.success) {
      const settings = response.data;
      return <PublisherListView settings={settings} />;
    }

    return <p>{response?.msg || 'Failed to load publisher data.'}</p>;
  } catch (error) {
    console.error('Error during PublisherPage:', error);
    redirect('/404');
  }
}
