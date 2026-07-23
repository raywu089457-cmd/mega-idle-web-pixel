/**
 * Service Worker — Offline caching for MEGA IDLE (放置王國)
 * Bump CACHE_NAME on every gameplay release so old Pages clients do not keep
 * serving a stale cached index.html.
 */

const CACHE_NAME = 'hunter-village-v33';   // bump to v33 — §六 1 空間擴張(4 服務圈分區 hint + zone stats)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
];
// 由 install 動態掃 src/ 補上;這裡放常見入口,讓 fetch handler 觸發 src/*.js runtime cache
const SRC_GLOB = [
  './src/main.js', './src/data.js', './src/util.js', './src/state.js', './src/bonuses.js',
  './src/building-stages.js', './src/building-effects.js', './src/reachability.js', './src/queue-points.js', './src/region-unlocks.js', './src/traditions.js', './src/specializations.js', './src/expedition-readiness.js', './src/layout-presets.js',
  './src/resources-buildings.js', './src/skills.js', './src/audio.js', './src/inventory.js',
  './src/heroes-stats.js', './src/meta.js', './src/combat.js', './src/combat-party.js',
  './src/expeditions.js', './src/scene.js', './src/ui.js', './src/selftest.js',
  './src/settings-and-init.js', './src/window-bridge.js',
];

const FONT_GLOB = [  './assets/fonts/fonts.css',
    "./assets/fonts/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-MoFoq92nA.woff2",
    "./assets/fonts/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-MoFoqB2nOeZ.woff2",
    "./assets/fonts/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-MoFoqF2nOeZ.woff2",
    "./assets/fonts/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-MoFoqJ2nOeZ.woff2",
    "./assets/fonts/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-MoFoqt2nOeZ.woff2",
    "./assets/fonts/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-MoFosF2nOeZ.woff2",
    "./assets/fonts/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-MoFotN2nOeZ.woff2",
    "./assets/fonts/0QIvMX1D_JOuM2T7I-NP.woff2",
    "./assets/fonts/0QIvMX1D_JOuM3b7I-NP.woff2",
    "./assets/fonts/0QIvMX1D_JOuMw77I-NP.woff2",
    "./assets/fonts/0QIvMX1D_JOuMwf7I-NP.woff2",
    "./assets/fonts/0QIvMX1D_JOuMwr7Iw.woff2",
    "./assets/fonts/0QIvMX1D_JOuMwT7I-NP.woff2",
    "./assets/fonts/0QIvMX1D_JOuMwX7I-NP.woff2",
    "./assets/fonts/e3t4euO8T-267oIAQAu6jDQyK3nbivN04w.woff2",
    "./assets/fonts/e3t4euO8T-267oIAQAu6jDQyK3nRivN04w.woff2",
    "./assets/fonts/e3t4euO8T-267oIAQAu6jDQyK3nVivM.woff2",
    "./assets/fonts/e3t4euO8T-267oIAQAu6jDQyK3nWivN04w.woff2",
    "./assets/fonts/e3t4euO8T-267oIAQAu6jDQyK3nYivN04w.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.0.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.1.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.10.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.101.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.102.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.103.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.104.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.105.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.106.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.107.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.108.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.109.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.11.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.110.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.111.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.112.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.113.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.114.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.115.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.116.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.117.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.118.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.119.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.12.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.120.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.121.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.122.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.123.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.2.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.23.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.24.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.25.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.26.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.27.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.28.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.29.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.30.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.31.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.32.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.33.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.34.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.35.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.36.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.37.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.38.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.39.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.4.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.40.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.41.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.42.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.43.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.44.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.45.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.46.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.47.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.48.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.49.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.50.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.51.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.52.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.53.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.54.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.55.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.56.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.57.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.58.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.59.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.60.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.61.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.62.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.63.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.64.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.65.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.66.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.67.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.68.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.69.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.70.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.71.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.72.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.73.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.74.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.75.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.76.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.77.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.78.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.79.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.80.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.81.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.82.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.83.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.84.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.85.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.86.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.87.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.88.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.89.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.90.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.91.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.92.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.93.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.94.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.95.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BhnJsUnN3PrBufRbmGqUtcg4pzRPk5AEpzv6YzI9aTbOhf6M.96.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0Btn4OSEFt.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0Btn8OSEFt.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BtnAOSA.woff2",
    "./assets/fonts/XLYgIZb5bJNDGYxLBibeHZ0BtnQOSEFt.woff2",  ];

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        // 先加 ASSETS_TO_CACHE(失敗不中斷,網路下才需要)
        await cache.addAll(ASSETS_TO_CACHE).catch(e => console.log('[SW] asset precache partial:', e.message));
        // 再加 src/*.js(略過 404,例如 sw.js 不在 src/)
        for (const url of SRC_GLOB) {
          try {
            const resp = await fetch(url, { cache: 'no-store' });
            if (resp.ok) await cache.put(url, resp);
            else console.log('[SW] skip 404:', url);
          } catch (e) { console.log('[SW] skip offline:', url); }
        }
        // 最後加 assets/fonts/*(woff2 + fonts.css,完全離線)
        for (const url of FONT_GLOB) {
          try {
            const resp = await fetch(url, { cache: 'no-store' });
            if (resp.ok) await cache.put(url, resp);
            else console.log('[SW] skip 404:', url);
          } catch (e) { console.log('[SW] skip offline:', url); }
        }
        console.log('[SW] Cached', ASSETS_TO_CACHE.length + SRC_GLOB.length + FONT_GLOB.length, 'assets');
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// ─── Fetch ─────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }

        // Not in cache — fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache if not a valid response
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clone the response before caching
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // Offline — return offline page if available
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// ─── 收到 SKIP_WAITING 訊息(讓用戶點 toast 主動跳過 waiting) ──────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting by user request');
    self.skipWaiting();
  }
});

// ─── Background Sync (for future save functionality) ─────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-save') {
    console.log('[SW] Background sync triggered');
    // Future: sync save data to server if needed
  }
});

// ─── Push Notifications (placeholder for future) ─────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Your kingdom needs attention!',
    icon: data.icon || '/icon.png',
    badge: '/icon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Idle Kingdom', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
