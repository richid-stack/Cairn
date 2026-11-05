import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  // No usage data leaves this project.
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
};

export default config;
