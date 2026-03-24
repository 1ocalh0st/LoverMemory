/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.json' {
  const value: Record<string, string>
  export default value
}
