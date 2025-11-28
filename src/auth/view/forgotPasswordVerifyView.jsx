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

import { getCookie, deleteCookie } from 'src/utils/helper';
import { CONFIG } from 'src/global-config';
import { EmailInboxIcon } from 'src/assets/icons';

import { Form, Field } from 'src/components/hook-form';

import { FormHead } from '../components/form-head';
import { FormReturnLink } from '../components/form-return-link';
import { FormResendCode } from '../components/form-resend-code';

// ----------------------------------------------------------------------
// schema: otp + password (new password) + we display email
const forgotVerifySchema = zod.object({
  otp: zod.string().min(6, { message: 'OTP must be at least 6 characters!' }),
  // we won’t edit this field, just to keep structure
  email: zod.string().min(3, { message: 'Email is required!' }),
  new_password: zod.string().min(8, { message: 'Password must be at least 8 characters!' }),
});

// ----------------------------------------------------------------------

export default function ForgotPasswordVerifyView() {
  const router = useRouter();

  // we saved this in the first step
  const email = getCookie('email');          // from forgot step
  const action = getCookie('action');        // should be "forgot_password"

  const countdown = useCountdownSeconds(60);

  const methods = useForm({
    resolver: zodResolver(forgotVerifySchema),
    defaultValues: {
      otp: '',
      email: email || '',
      new_password: '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        email: email,                  // backend expects "login" like in sendOTPAgain
        otp: data.otp,
        action: action || 'forgot_password',
        password: data.new_password,   // if your controller uses "password" instead of "new_password"
      };

      const result = await axios.post(`${CONFIG.apiUrl}/v1/admin/forgot-password/verify`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      });

      const resData = result.data;

      if (resData.success) {
        // cleanup
        deleteCookie('email');
        deleteCookie('action');

        toast.success(resData.msg || 'Password reset successful');
        router.push(paths.login.root);
      } else {
        toast.error(resData.msg || 'Invalid OTP');
      }
    } catch (err) {
      console.error('Error during forgot-password verify:', err);
      toast.error('Internal Server Error');
    }
  });

  const handleResendCode = useCallback(async () => {
    if (!countdown.isCounting) {
      try {
        countdown.reset();
        countdown.start();

        const payload = {
          email: email,
          action: login_2fa || 'forgot_password',
        };

        const result = await axios.post(`${CONFIG.apiUrl}/v1/admin/resend-send-otp`, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: () => true,
        });

        const resData = result.data;

        if (resData.success) {
          toast.success(resData.msg || 'OTP sent again');
        } else {
          toast.error(resData.msg || 'Failed to resend OTP');
        }
      } catch (err) {
        console.error('Error during resend in forgot-password verify:', err);
        toast.error('Internal Server Error');
      }
    }
  }, [countdown, email, action]);

  const renderForm = (
    <Box gap={3} display="flex" flexDirection="column">
      <Field.Text
        name="email"
        label="Email address"
        placeholder="example@gmail.com"
        InputLabelProps={{ shrink: true }}
        disabled
      />

      <Field.Code name="otp" />

      <Field.Text
        name="new_password"
        label="New password"
        type="password"
        placeholder="8+ characters"
        InputLabelProps={{ shrink: true }}
      />

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Verify..."
      >
        Verify & Reset
      </LoadingButton>
    </Box>
  );

  return (
    <>
      <FormHead
        icon={<EmailInboxIcon />}
        title="Verify password reset!"
        description="Enter the OTP we sent to your email and set a new password."
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
