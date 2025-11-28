'use client';

import axios from 'axios';
import { z as zod } from 'zod';
import { toast } from 'react-toastify';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ReCAPTCHA from 'react-google-recaptcha';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import Turnstile from 'react-turnstile';

import Box from '@mui/material/Box';
import LoadingButton from '@mui/lab/LoadingButton';

import { CONFIG } from 'src/global-config';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { setCookie } from 'minimal-shared';

import { Form, Field } from 'src/components/hook-form';
import { FormHead } from '../components/form-head';
import { FormReturnLink } from '../components/form-return-link';
import Altcha from '../components/altcha';

// ----------------------------------------------------------------------

const forgotSchema = zod.object({
  email: zod.string().min(3, { message: 'Email is required!' }),
});

// ----------------------------------------------------------------------

export default function ForgotPasswordView({ settings = {} }) {
  const router = useRouter();
  const altchaRef = useRef(null);

  const [captchaToken, setCaptchaToken] = useState('');

  const handleCaptcha = (token) => {
    setCaptchaToken(token || '');
  };

  const methods = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      // decide what token to send
      let captchaValue = '';

      const captchaEnabled = settings.admin_forgot_password_captcha_enabled === 'true';

      if (captchaEnabled) {
        if (settings.admin_forgot_password_captcha === 'altcha') {
          captchaValue = altchaRef.current?.value || '';
        } else {
          captchaValue = captchaToken;
        }
      } else {
        // backend still wants a non-empty token
        captchaValue = '';
      }

      const payload = {
        email: data.email,
        captchaToken: captchaValue,
      };

      const res = await axios.post(`${CONFIG.apiUrl}/v1/admin/forgot-password`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      });

      const response = res.data;
      
      if (!response.success) {
        toast.error(response.msg || 'Failed to send reset code');
        return;
      }

      setCookie('email', data.email, { sameSite: 'Strict', secure: true });
      setCookie('action', 'forgot_password', { sameSite: 'Strict', secure: true });

      toast.success(response.msg || 'OTP sent to your email');
      router.push(paths.forgotPassword.verify);
    } catch (err) {
      console.error('Error in forgot password:', err);
      toast.error('Something went wrong');
    }
  });

  const renderCaptcha = () => {
    // use the enabled flag, not the provider string
    if (settings.admin_forgot_password_captcha_enabled !== 'true') return null;

    switch (settings.admin_forgot_password_captcha) {
      case 'recaptcha':
        return <ReCAPTCHA sitekey={settings.recaptcha_site_key} onChange={handleCaptcha} />;
      case 'hcaptcha':
        return <HCaptcha sitekey={settings.hcaptcha_site_key} onVerify={handleCaptcha} />;
      case 'turnstile':
        return <Turnstile sitekey={settings.cloudflare_turnstile_site_key} onVerify={handleCaptcha} />;
      case 'altcha':
        return <Altcha ref={altchaRef} />;
      default:
        return null;
    }
  };

  const renderForm = (
    <Box gap={3} display="flex" flexDirection="column">
      <Field.Text name="email" label="Email address" InputLabelProps={{ shrink: true }} />

      {renderCaptcha()}

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Sending..."
      >
        Send reset code
      </LoadingButton>
    </Box>
  );

  return (
    <>
      <FormHead
        title="Forgot password?"
        description="Enter your email or username and we’ll send you a reset code."
      />

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>

      <FormReturnLink label="Return to login" href={paths.login.root} />
    </>
  );
}
