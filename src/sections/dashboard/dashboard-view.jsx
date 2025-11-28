'use client';

import axios from 'axios';
import { toast } from 'react-toastify';
import { getCookie } from 'minimal-shared';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

function formatNumber(n) {
  if (n === null || n === undefined) return '0';
  return new Intl.NumberFormat().format(Number(n));
}

export function DashboardView() {
  const [cards, setCards] = useState({
    employeeCount: 0,
    pendingFromCounts: 0,
    inProgresFromCounts: 0,
    reslovedFromCounts: 0,
  });
  const [isCardsLoading, setIsCardsLoading] = useState(true);

  async function fetchCards() {
    try {
      const token = getCookie('session_key');

      setIsCardsLoading(true);
      const result = await axios.get(`${CONFIG.apiUrl}/api/v1/dashboard-cards`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        validateStatus() {
          return true;
        },
      });
    } catch (error) {
      console.error('Error during fetchCards:', error);
      toast.error('Something went wrong while fetching cards');
    } finally {
      setIsCardsLoading(false);
    }
  }

  useEffect(() => {
    fetchCards();
  }, []);

  // Build the UI card model from the API response
  const uiCards = useMemo(
    () => [
      {
        title: 'Total Employees',
        value: cards.employeeCount ?? 0,
        icon: 'mdi:account-group',
        color: '#1976d2',
      },
      {
        title: 'Pending Forms',
        value: cards.pendingFromCounts ?? 0,
        icon: 'mdi:clipboard-alert-outline',
        color: '#ff9800',
      },
      {
        title: 'In Progress',
        value: cards.inProgresFromCounts ?? 0,
        icon: 'mdi:progress-clock',
        color: '#2196f3',
      },
      {
        title: 'Resolved Forms',
        value: cards.reslovedFromCounts ?? 0,
        icon: 'mdi:check-circle-outline',
        color: '#16a34a',
      },
    ],
    [cards]
  );

  return (
    <DashboardContent maxWidth="xl">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <CustomBreadcrumbs
          heading="Dashboard"
          links={[
            { name: 'Home', href: paths.root },
            { name: 'Dashboard', href: paths.dashboard.root },
          ]}
          sx={{ mb: 1 }}
        />
      </Box>
      <Grid container spacing={2}>
        {uiCards.map((card, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card
              sx={{
                display: { md: 'flex', xs: 'none' },
                flexDirection: { md: 'column', xs: 'row' },
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                p: 2,
                mt: 2,
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ typography: 'subtitle2', width: '100%' }}>{card.title}</Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: '16px',
                  width: '100%',
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ mt: 1.5, mb: 1, typography: 'h3' }}>
                    {isCardsLoading ? (
                      <Skeleton variant="text" width={90} height={36} sx={{ mt: 0.5 }} />
                    ) : (
                      formatNumber(card.value)
                    )}
                  </Box>
                </Box>
                <Box
                  sx={{
                    backgroundColor: card.color,
                    color: '#fff',
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26,
                    flexShrink: 0,
                  }}
                >
                  <Iconify icon={card.icon} width={26} height={26} />
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </DashboardContent>
  );
}
