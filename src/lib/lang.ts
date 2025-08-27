export function normalizeForSearch(s: string) {
return s
.toLowerCase()
.normalize('NFKD') // split accents
.replace(/\p{Diacritic}+/gu, '') // remove diacritics
.replaceAll('æ', 'ae')
.replaceAll('ø', 'o')
.replaceAll('å', 'aa');
}


// (Optional) expose a quick helper for starts-with on tokens
export function tokenIncludes(haystack: string, needle: string) {
const H = normalizeForSearch(haystack).split(/[^a-z0-9]+/g);
const n = normalizeForSearch(needle);
return H.some(t => t.startsWith(n));
}