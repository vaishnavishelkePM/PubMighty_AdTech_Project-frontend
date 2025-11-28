'use client';

import {
  Box,
  Card,
  Dialog,
  Button,
  Typography,
  CardContent,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

// simple JSON parser
function safeParse(data) {
  if (!data) return null;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  }
  return data;
}

export default function AdminLogDetailsDialog({ open, onClose, log }) {
  if (!log) return null;

  const beforePretty = log.beforeAction
    ? JSON.stringify(safeParse(log.beforeAction), null, 2)
    : '// no before action data';

  const afterPretty = log.afterAction
    ? JSON.stringify(safeParse(log.afterAction), null, 2)
    : '// no after action data';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle
        sx={{
          pr: 6,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Log {log.id} - Data View
        </Typography>


      </DialogTitle>

      <DialogContent dividers>
        <Card
          variant="outlined"
          sx={{
            borderRadius: 2,
          }}
        >
          <CardContent
            sx={{
              '&:last-child': { pb: 2 },
            }}
          >
            {/* 2-column layout */}
            <Box
              sx={(theme) => ({
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                minHeight: 260,
                borderRadius: 2,
                overflow: 'hidden',

              })}
            >
              {/* LEFT: BEFORE */}
              <Box
                sx={(theme) => ({
                  p: 2,
                  borderRight: {
                    xs: 'none',
                    md: `1px solid ${theme.palette.divider}`, // vertical border between
                  },
                  display: 'flex',
                  flexDirection: 'column',
                })}
              >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Before Action Data
                </Typography>

                <Box
                  component="pre"
                  sx={(theme) => ({
                    flex: 1,
                    m: 0,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? theme.palette.background.paper
                        : theme.palette.action.hover,
                    fontSize: 12,
                    fontFamily:
                      'JetBrains Mono, Menlo, Consolas, monospace',
                    whiteSpace: 'pre-wrap',
                    overflowY: 'auto',
                    maxHeight: 400,
                  })}
                >
                  {beforePretty}
                </Box>
              </Box>

              {/* RIGHT: AFTER */}
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  After Action Data
                </Typography>

                <Box
                  component="pre"
                  sx={(theme) => ({
                    flex: 1,
                    m: 0,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? theme.palette.background.paper
                        : theme.palette.action.hover,
                    fontSize: 12,
                    fontFamily:
                      'JetBrains Mono, Menlo, Consolas, monospace',
                    whiteSpace: 'pre-wrap',
                    overflowY: 'auto',
                    maxHeight: 400,
                  })}
                >
                  {afterPretty}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions sx={{ p: 1.5, justifyContent: 'flex-end' }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
