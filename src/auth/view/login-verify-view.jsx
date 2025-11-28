'use client';

import axios from 'axios';
import { z as zod } from 'zod';
import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useCountdownSeconds } from 'src/hooks/use-countdown';

import { getCookie, deleteCookie, setSessionCookies } from 'src/utils/helper';

import { CONFIG } from 'src/global-config';
import { EmailInboxIcon } from 'src/assets/icons';
import { useAppContext } from 'src/contexts/app-context';

import { Form, Field } from 'src/components/hook-form';

import { FormHead } from '../components/form-head';
import { FormReturnLink } from '../components/form-return-link';
import { FormResendCode } from '../components/form-resend-code';

// ----------------------------------------------------------------------

const loginVerifySchema = zod.object({
  otp: zod.string().min(6, { message: 'OTP must be at least 6 characters!' }),
  login: zod.string().min(1, { message: 'Username/Email is required!' }),
});

// ----------------------------------------------------------------------

export default function LoginVerifyView() {
  const router = useRouter();
  const { setUser } = useAppContext();

  const login = getCookie('login');
  const password = getCookie('password');
  const action = getCookie('action');

  const countdown = useCountdownSeconds(60);

  const methods = useForm({
    resolver: zodResolver(loginVerifySchema),
    defaultValues: { otp: '', login },
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        login,
        otp: data.otp,
        action, // we saved "login" earlier
        password,
      };

      //  use correct admin endpoint
      const result = await axios.post(`${CONFIG.apiUrl}/v1/admin/login/verify`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      });

      const resData = result.data;

      // backend returns { success: true, msg: "...", data: { token, expiresAt } }
      if (resData.success) {
        const token = resData.data?.token;
        const expiresAt = resData.data?.expiresAt;

        // clear the temp cookies we set after first login
        deleteCookie('login');
        deleteCookie('action');
        deleteCookie('password');

        // store session
        if (token && expiresAt) {
          setSessionCookies(token, expiresAt);
        }

        // we don't actually get user from this API, but keep your logic structure
        // so app context doesn't break
        if (resData.data?.user) {
          localStorage.setItem('user', JSON.stringify(resData.data.user));
          setUser(resData.data.user);
        }

        toast.success(resData.msg || 'Login verified');
        router.push(paths.dashboard.root);
      } else {
        toast.error(resData.msg || 'Invalid OTP');
      }
    } catch (err) {
      console.error('Error during onSubmit in login verify action:', errors);
      toast.error('Internal Server Error');
    }
  });

  const handleResendCode = useCallback(async () => {
    if (!countdown.isCounting) {
      try {
        countdown.reset();
        countdown.start();

        const payload = {
          login,
          action,
        };

        const result = await axios.post(`${CONFIG.apiUrl}/v1/admin/resend-send-otp`, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: () => true,
        });

        const resData = result.data;

        // your backend for resend likely also returns { success, msg }
        if (resData.success) {
          toast.success(resData.msg || 'OTP sent again');
        } else {
          toast.error(resData.msg || 'Failed to resend OTP');
        }
      } catch (err) {
        console.error('Error during handleResendCode in login verify action:', errors);
        toast.error('Internal Server Error');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, login, action]);

  const renderForm = (
    <Box gap={3} display="flex" flexDirection="column">
      <Field.Text
        name="login"
        label="Username/Email address"
        placeholder="example@gmail.com"
        InputLabelProps={{ shrink: true }}
        disabled
      />

      <Field.Code name="otp" />

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Verify..."
      >
        Verify
      </LoadingButton>
    </Box>
  );

  return (
    <>
      <FormHead
        icon={<EmailInboxIcon />}
        title="Verify Login!"
        description="Please verify your login using the OTP."
      />

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>

      <FormResendCode
        onResendCode={handleResendCode}
        value={countdown.value}
        disabled={countdown.isCounting}
      />

      <FormReturnLink label="Return to login" href={paths.login.root} />
    </>
  );
}
