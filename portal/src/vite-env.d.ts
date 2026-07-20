/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_MIDTRANS_CLIENT_KEY: string;
  readonly VITE_PEMETAAN_PRICE: string;
  readonly VITE_LANDING_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  snap?: {
    pay: (token: string, options?: {
      onSuccess?: (result: unknown) => void;
      onPending?: (result: unknown) => void;
      onError?: (result: unknown) => void;
      onClose?: () => void;
    }) => void;
  };
}
