/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** E-mail do dono da plataforma (selo verificado). Vários separados por vírgula. */
  readonly VITE_PLATFORM_OWNER_EMAIL?: string;
}
