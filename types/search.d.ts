declare module "@temp/slimsearch/store.js" {
  export const store: Record<string, string>
}
declare module "@temp/philosophos/search-pages.js" {
  const pages: Record<string, {title: string; parent?: string}>
  export default pages
}
