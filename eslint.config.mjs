// eslint-config-next 16 ships native flat configs, so the FlatCompat
// shim (which broke against the v16 export shape) is no longer needed.
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const eslintConfig = [
  { ignores: ['.next/**', 'out/**', 'next-env.d.ts', 'public/**'] },
  ...coreWebVitals,
  ...typescript,
  {
    // Everything that moves on this site is exact physics or a measured bit
    // (lib/qrng), so pseudo-random numbers are banned from site code. A
    // disclosed starting offset may use crypto.getRandomValues.
    files: ['app/**', 'components/**', 'lib/**'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Use lib/qrng (measured bits) or a disclosed crypto.getRandomValues offset.',
        },
      ],
    },
  },
];

export default eslintConfig;
