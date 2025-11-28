import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { CONFIG } from 'src/global-config';

import EditAdminView from 'src/sections/dashboard/admin/child/edit-admin-form-dialog';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit Admin - ${CONFIG.appName}` };

export default async function EditAdminPage({ params }) {
  const { id } = params;

  // Get token from cookies (no await, this is sync in app router)
  const cookieStore = cookies();
  const token = cookieStore.get('session_key')?.value;

  if (!token) {
    redirect('/logout');
  }

  try {
    const url = `${CONFIG.apiUrl}/v1/admin/admins/${id}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      console.error(
        'EditAdminPage: non-JSON response from admin API:',
        res.status,
        text.slice(0, 200)
      );
      throw new Error('Expected JSON from admin API, got HTML');
    }

    const json = await res.json();

    if (!res.ok || !json.success) {
      console.error('Admin load failed:', json);
      throw new Error(json.msg || `Failed to load admin #${id}`);
    }

    const admin = json.data;
    if (!admin) {
      throw new Error('Admin data missing in response');
    }

    return <EditAdminView admin={admin} />;
  } catch (error) {
    console.error('Error during EditAdminPage:', error);
    return <p>Unable to load needed data.</p>;
  }
}
