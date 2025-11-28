import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';

import { CONFIG } from 'src/global-config';

const Altcha = forwardRef(({ onStateChange }, ref) => {
  const widgetRef = useRef(null);
  const [value, setValue] = useState(null);

  useImperativeHandle(
    ref,
    () => ({
      get value() {
        return value;
      },
    }),
    [value]
  );

  useEffect(() => {
    // Dynamically import Altcha only on client
    import('altcha');

    const handleStateChange = (ev) => {
      if (ev.detail) {
        const newValue = ev.detail.payload || null;
        setValue(newValue);
        if (onStateChange) {
          onStateChange(ev);
        }
      }
    };

    const { current } = widgetRef;

    if (current) {
      current.addEventListener('statechange', handleStateChange);
      return () => {
        current.removeEventListener('statechange', handleStateChange);
      };
    }

    return undefined;
  }, [onStateChange]);

  return (
    <altcha-widget
      ref={widgetRef}
      style={{
        '--altcha-max-width': '100%',
      }}
      challengeurl={`${CONFIG.apiUrl}/v1/admin/altcha-challenge`}
      hidelogo
      hidefooter
    />
  );
});

export default Altcha;
