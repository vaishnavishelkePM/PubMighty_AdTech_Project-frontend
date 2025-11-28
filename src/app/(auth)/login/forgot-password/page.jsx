import { redirect } from 'next/navigation';

import { CONFIG } from 'src/global-config';

import ForgotPasswordView from 'src/auth/view/forgot-password-view';

export const metadata = {
  title: `Forgot password - ${CONFIG.appName}`,
  description: 'Recover your admin account.',
};

export default async function ForgotPasswordPage() {
  let redirectPath = null;

  try {
    const res = await fetch(`${CONFIG.apiUrl}/v1/admin/settings`, {
      cache: 'no-store',
    });

    const data = await res.json();

    if (data.success) {
      const settings = data.data;
      return <ForgotPasswordView settings={settings} />;
    }

    // if API responded but not success, just render message
    return <p>{data.msg || 'Unable to load settings'}</p>;
  } catch (err) {
    console.error('Error during ForgotPasswordPage:', err);
    redirectPath = '/404';
  }

  if (redirectPath) {
    redirect(redirectPath);
  }
}
