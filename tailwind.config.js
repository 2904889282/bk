/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./apps/web/index.html",
    "./apps/web/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background, #ffffff)',
        foreground: 'var(--color-foreground, #0f172a)',
        primary: {
          DEFAULT: 'var(--color-primary, #2563eb)',
          foreground: 'var(--color-primary-foreground, #ffffff)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary, #f1f5f9)',
          foreground: 'var(--color-secondary-foreground, #0f172a)',
        },
        muted: {
          DEFAULT: 'var(--color-muted, #f1f5f9)',
          foreground: 'var(--color-muted-foreground, #64748b)',
        },
        accent: {
          DEFAULT: 'var(--color-accent, #f1f5f9)',
          foreground: 'var(--color-accent-foreground, #0f172a)',
        },
        destructive: {
          DEFAULT: 'var(--color-destructive, #ef4444)',
          foreground: 'var(--color-destructive-foreground, #ffffff)',
        },
        border: 'var(--color-border, #e2e8f0)',
        input: 'var(--color-input, #e2e8f0)',
        ring: 'var(--color-ring, #2563eb)',
      },
      borderRadius: {
        lg: 'var(--radius, 0.5rem)',
        md: 'calc(var(--radius, 0.5rem) - 2px)',
        sm: 'calc(var(--radius, 0.5rem) - 4px)',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // 禁用 Tailwind 的 reset CSS，避免与 Ant Design 冲突
  },
}
