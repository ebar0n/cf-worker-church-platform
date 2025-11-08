declare global {
  interface Window {
    turnstile: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          appearance?: string;
          theme?: string;
          language?: string;
        }
      ) => void;
      reset: (container: HTMLElement) => void;
    };
  }
}

export {};
