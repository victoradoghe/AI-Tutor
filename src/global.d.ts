declare module 'lucide-react';
declare module '@google/genai';

interface ImportMetaEnv {
  readonly VITE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
