
import { redirect } from 'next/navigation';

import { CONFIG } from 'src/global-config';

// Import Update Password View (you will create this component)
import { UpdatePasswordView } from 'src/sections/dashboard/profile/update-password';

// ----------------------------------------------------------------------

export const metadata = {
  title: `Update Password - ${CONFIG.appName}`,
  description: 'Securely update your account password from the dashboard.',
};

export default async function UpdatePasswordPage() {
  try {
    // If you want to reuse settings like profile page
    const [response] = await Promise.all([
      fetch(`${CONFIG.apiUrl}/v1/admin/settings`, {
        cache: 'no-store',
      }).then((res) => res.json()),
    ]);

    if (response?.success) {
      const settings = response.data;
      return <UpdatePasswordView settings={settings} />;
    }

    return <p>{response?.msg || 'Failed to load required data.'}</p>;
  } catch (error) {
    console.error('Error during Update Password Page:', error);
    redirect('/404');
  }
}
