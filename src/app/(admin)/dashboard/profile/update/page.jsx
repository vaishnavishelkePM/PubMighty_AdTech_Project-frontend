import { redirect } from 'next/navigation';

import { CONFIG } from 'src/global-config';

// Import Publisher List View
import UpdateProfileView from 'src/sections/dashboard/profile/update-profile1';

// ----------------------------------------------------------------------

export const metadata = {
  title: `Profile Management - ${CONFIG.appName}`,
  description: 'View, add, edit, or manage Profile from the dashboard.',
};

// eslint-disable-next-line consistent-return
export default async function updateProfielPage() {
  try {
    // fetch settings (same API used for admin settings)
    const [response] = await Promise.all([
      fetch(`${CONFIG.apiUrl}/v1/admin/settings`, {
        cache: 'no-store',
      }).then((res) => res.json()),
    ]);

    if (response?.success) {
      const settings = response.data;
      return <UpdateProfileView settings={settings} />;
    }

    return <p>{response?.msg || 'Failed to load profile data.'}</p>;
  } catch (error) {
    console.error('Error during Profile Page:', error);
    redirect('/404');
  }
}
