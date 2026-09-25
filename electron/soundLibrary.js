// Unofficial integration with myinstants.com's soundboard — there is no
// public API, so this parses their server-rendered listing pages (search
// results and the /trending/ page share the exact same markup) with a
// regex over the known, verified structure:
//   <div class="instant">
//     <button class="small-button" onclick="play('/media/sounds/x.mp3', ...)">
//     <a href="/en/instant/x/" class="instant-link ...">Name</a>
//   </div>
// Both pages also support a `page` query param that silently returns more
// results (undocumented — there's no visible "next page" link — but
// confirmed working by comparing page=1 vs page=2 output), used here for
// infinite-scroll lazy loading.
//
// Fetching matters here: myinstants sits behind Cloudflare, which blocks
// Node's own fetch (undici) outright — confirmed by testing curl (succeeds)
// against Node's global fetch with identical headers (blocked with a
// Cloudflare "Attention Required" page), almost certainly via TLS
// fingerprinting rather than anything header-based. Electron's `net.fetch`
// runs over Chromium's own network stack — the same TLS fingerprint as a
// real browser — so it's used here instead of the global fetch.
//
// credentials: 'include' matters just as much — unlike the page's own
// fetch(), net.fetch() sends NO cookies by default. myinstants redirects
// the first request through a geo/locale-detection hop (e.g.
// /en/trending/ -> /en/trending/id/) and sets a locale cookie there; without
// credentials: 'include' that cookie is dropped, so every later request
// (every "load more" page) repeats the same cookie-less first-visit
// redirect dance instead of reusing the now-known locale, which is what was
// causing pagination to fail after the first page.
const { net } = require('electron');

const BASE_URL = 'https://www.myinstants.com';
const SEARCH_URL = `${BASE_URL}/en/search/`;
const TRENDING_URL = `${BASE_URL}/en/trending/`;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const ITEM_REGEX = /onclick="play\('([^']+)'[^)]*\)"[\s\S]*?<a href="([^"]+)" class="instant-link[^"]*">([^<]+)<\/a>/g;

function decodeHtmlEntities(str) {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;|&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

async function fetchAndParse(url) {
    const response = await net.fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        credentials: 'include',
    });

    // myinstants returns 404 (not an empty 200) whenever a search/page has
    // no results — confirmed by testing both a search term with zero hits
    // and paging past the last page of a narrow search — so this is a
    // normal "nothing here" outcome, not a real failure.
    if (response.status === 404) return [];

    if (!response.ok) {
        throw new Error(`Gagal memuat Sound Library (${response.status}).`);
    }

    const html = await response.text();
    const results = [];

    ITEM_REGEX.lastIndex = 0;
    let match;
    while ((match = ITEM_REGEX.exec(html))) {
        const [, mp3Path, detailPath, rawName] = match;
        results.push({
            id: detailPath,
            name: decodeHtmlEntities(rawName.trim()),
            url: `${BASE_URL}${mp3Path}`,
        });
    }

    return results;
}

async function search(query, page = 1) {
    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    return fetchAndParse(`${SEARCH_URL}?name=${encodeURIComponent(trimmed)}&page=${page}`);
}

async function trending(page = 1) {
    return fetchAndParse(`${TRENDING_URL}?page=${page}`);
}

module.exports = { search, trending };
