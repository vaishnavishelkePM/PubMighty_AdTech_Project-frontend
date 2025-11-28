'use client';

import axios from 'axios';
import { z as zod } from 'zod';
import { toast } from 'react-toastify';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { setCookie } from 'minimal-shared';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import ReCAPTCHA from 'react-google-recaptcha';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import Turnstile from 'react-turnstile';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { setSessionCookies } from 'src/utils/helper';
import { CONFIG } from 'src/global-config';
import { useAppContext } from 'src/contexts/app-context';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { FormHead } from '../components/form-head';
import Altcha from '../components/altcha';

// ----------------------------------------------------------------------
// schema
export const logInSchema = zod.object({
  login: zod.string().min(3, { message: 'Email/Usename is required!' }),
  password: zod.string().min(8, { message: 'Password must be at least 8 characters!' }),
});

// ----------------------------------------------------------------------

export function LoginView({ settings }) {
  const router = useRouter();
  const showPassword = useBoolean();
  const { user, setUser } = useAppContext();
  const altchaRef = useRef(null);

  const [captchaToken] = useState('');

  const handleCaptcha = (token) => {
    setCaptchaToken(token);
  };

  const methods = useForm({
    resolver: zodResolver(logInSchema),
    defaultValues: {
      login: '',
      password: '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      let captchaValue;

      if (settings.admin_login_captcha === 'altcha') {
        captchaValue = altchaRef.current?.value;
      } else {
        captchaValue = captchaToken;
      }

      const payload = {
        login: data.login,
        password: data.password,
        captchaToken: captchaValue,
      };

      const result = await axios.post(`${CONFIG.apiUrl}/v1/admin/login`, payload, {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      });

      const response = result.data;

      // 1) basic error
      if (!response?.success) {
        toast.error(response?.msg || 'Invalid username or password');
        return;
      }

      // 2) 2FA path
      if (response.requires2FA) {
        // backend didn’t send action, but our verify API needs it -> save "login"
        setCookie('login', data.login, { sameSite: 'Strict', secure: true });
        setCookie('password', data.password, { sameSite: 'Strict', secure: true });
        setCookie('action', 'login_2fa', { sameSite: 'Strict', secure: true });

        toast.success(response.msg || 'Verification required');
        router.push(paths.login.verify); // go to /login/verify
        return;
      }

      // 3) no 2FA -> we got token right here
      if (response.data) {
        const { token, expiresAt, admin } = response.data;
        setUser(admin);
        // your helper however expects (session_key, session_expiration)
        // so either change helper OR call cookies directly.
        // I'll just call your helper with these names:
        setSessionCookies(token, expiresAt);

        // if your API will later return admin object, set it here:
        // setUser(response.data.admin);

        toast.success(response.msg || 'Login successful');
        router.push(paths.dashboard.root);
        return;
      }

      toast.error('Unexpected server response.');
    } catch (err) {
      console.error('Error during onSubmit in login action:', err);
      toast.error('Something went wrong.');
    }
  });

  const renderForm = (
    <Box gap={3} display="flex" flexDirection="column">
      <Field.Text name="login" label="Username/Email address" InputLabelProps={{ shrink: true }} />

      <Box gap={1.5} display="flex" flexDirection="column">
        <Field.Text
          name="password"
          label="Password"
          placeholder="8+ characters"
          type={showPassword.value ? 'text' : 'password'}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={showPassword.onToggle} edge="end">
                  <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Link
          component={RouterLink}
          href={paths.forgotPassword.root}
          variant="body2"
          color="inherit"
          sx={{ alignSelf: 'flex-end' }}
        >
          Forgot password?
        </Link>
      </Box>

      {settings.admin_login_captcha_enabled === 'true' &&
      settings.admin_login_captcha === 'recaptcha' ? (
        <ReCAPTCHA
          sitekey={settings.recaptcha_site_key} // Replace with your site key
          onChange={handleCaptcha}
        />
      ) : null}
      {settings.admin_login_captcha_enabled === 'true' &&
      settings.admin_login_captcha === 'hc  aptcha' ? (
        <HCaptcha
          sitekey={settings.hcaptcha_site_key} // Replace with your hCaptcha site key
          onVerify={handleCaptcha}
        />
      ) : null}
      {settings.admin_login_captcha_enabled === 'true' &&
      settings.admin_login_captcha === 'turnstile' ? (
        <Turnstile sitekey={settings.cloudflare_turnstile_site_key} onVerify={handleCaptcha} />
      ) : null}

      {settings.admin_login_captcha_enabled === 'true' &&
      settings.admin_login_captcha === 'altcha' ? (
        <Altcha ref={altchaRef} />
      ) : null}

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Login..."
      >
        Login
      </LoadingButton>
    </Box>
  );

  return (
    <Box>
      <FormHead title="Login to your account" sx={{ textAlign: { xs: 'center', md: 'left' } }} />
      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>
    </Box>
  );
}
