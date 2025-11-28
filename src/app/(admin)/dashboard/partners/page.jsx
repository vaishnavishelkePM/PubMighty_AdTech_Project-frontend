// (Server Component — no "use client" here)
import { CONFIG } from 'src/global-config';

import PartnersView from 'src/sections/dashboard/partners/partners-view';

export const metadata = { title: `Partners - ${CONFIG.appName}` };

export default function PartnersPage() {
  return <PartnersView />;
}

