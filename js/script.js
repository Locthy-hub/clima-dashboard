/* ==========================================================================
   CLIMA — Painel de Clima
   JavaScript puro (sem frameworks)
   APIs: Open-Meteo (forecast + geocoding + air quality, sem chave) e
   BigDataCloud (reverse geocoding, sem chave) para "usar minha localização".
   ==========================================================================
   Índice:
   1. Configuração, estado e persistência (localStorage)
   2. Ícones (SVG animados por categoria de clima)
   3. Mapeamento de códigos WMO
   4. Camada de API
   5. Utilidades (unidade, vento, AQI, bandeira)
   6. Motor da "sky arc" (elemento assinatura)
   7. Renderização de UI (hero, stats, hourly, daily, chart, mapa)
   8. Favoritos, histórico e chips
   9. Busca, geolocalização, unidade, compartilhar
   10. Inicialização
   ========================================================================== */

/* ---------------------------------------------------------------------- */
/* 1. Configuração, estado e persistência                                  */
/* ---------------------------------------------------------------------- */

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const REVERSE_GEOCODE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

const LS_KEYS = { favorites: "clima:favorites", history: "clima:history", unit: "clima:unit" };

const state = {
  location: { name: "São Paulo", country: "Brasil", countryCode: "BR", lat: -23.5505, lon: -46.6333 },
  data: null,
  aqi: null,
  unit: localStorage.getItem(LS_KEYS.unit) || "C",
};

const el = (id) => document.getElementById(id);

function loadList(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* localStorage indisponível — segue sem persistência */
  }
}

/* ---------------------------------------------------------------------- */
/* 2. Ícones — SVG com classes animadas por categoria                      */
/* ---------------------------------------------------------------------- */

const ICONS = {
  "clear-day": `<g class="sun-rays" stroke="#F4B942" stroke-width="1.4" stroke-linecap="round">
      <line x1="11" y1="1" x2="11" y2="3.4"/><line x1="11" y1="18.6" x2="11" y2="21"/>
      <line x1="1" y1="11" x2="3.4" y2="11"/><line x1="18.6" y1="11" x2="21" y2="11"/>
      <line x1="4.2" y1="4.2" x2="5.9" y2="5.9"/><line x1="16.1" y1="16.1" x2="17.8" y2="17.8"/>
      <line x1="4.2" y1="17.8" x2="5.9" y2="16.1"/><line x1="16.1" y1="5.9" x2="17.8" y2="4.2"/>
    </g><circle cx="11" cy="11" r="4.5" fill="#F4B942"/>`,
  "clear-night": `<path d="M15.5 12.8A6.8 6.8 0 0 1 8.2 5.2a6.8 6.8 0 1 0 7.3 7.6Z" fill="#DCE3F0"/>`,
  "partly-day": `<circle cx="8" cy="9" r="4" fill="#F4B942"/>
    <path class="cloud-shape" d="M4 17.5h11a3.6 3.6 0 0 0 0-7.2c-.35 0-.68.05-1 .14A5.2 5.2 0 0 0 4 13.1a3.4 3.4 0 0 0 0 4.4Z" fill="#B9C6DE"/>`,
  "partly-night": `<path d="M8.8 8.2A4.6 4.6 0 0 1 12.9 4a4.6 4.6 0 1 0 4.9 5.2Z" fill="#DCE3F0"/>
    <path class="cloud-shape" d="M3 17.5h11.5a3.6 3.6 0 0 0 0-7.2c-.35 0-.68.05-1 .14A5.2 5.2 0 0 0 3 13.1a3.4 3.4 0 0 0 0 4.4Z" fill="#8592AC"/>`,
  cloudy: `<path class="cloud-shape" d="M3.5 17.5h13.2a4 4 0 0 0 0-8c-.4 0-.78.05-1.14.16A5.8 5.8 0 0 0 4.2 12.9a3.9 3.9 0 0 0-.7 4.6Z" fill="#9AA7C2"/>`,
  fog: `<g stroke="#9AA7C2" stroke-width="1.6" stroke-linecap="round">
      <line x1="3" y1="8" x2="19" y2="8"/><line x1="3" y1="12" x2="19" y2="12"/>
      <line x1="3" y1="16" x2="19" y2="16"/>
    </g>`,
  rain: `<path class="cloud-shape" d="M3.5 12.5h13.2a4 4 0 0 0 0-8c-.4 0-.78.05-1.14.16A5.8 5.8 0 0 0 4.2 7.9a3.9 3.9 0 0 0-.7 4.6Z" fill="#8592AC"/>
    <g stroke="#5EC8D8" stroke-width="1.5" stroke-linecap="round">
      <line class="rain-drop" x1="7" y1="16" x2="6" y2="20"/><line class="rain-drop" x1="11" y1="16" x2="10" y2="20"/><line class="rain-drop" x1="15" y1="16" x2="14" y2="20"/>
    </g>`,
  storm: `<path class="cloud-shape" d="M3.5 11.5h13.2a4 4 0 0 0 0-8c-.4 0-.78.05-1.14.16A5.8 5.8 0 0 0 4.2 6.9a3.9 3.9 0 0 0-.7 4.6Z" fill="#8592AC"/>
    <path class="bolt-shape" d="M12 13l-3.4 5.2h2.6L9.6 22l4.9-6.2h-2.7L13.8 13Z" fill="#F4B942"/>`,
  snow: `<path class="cloud-shape" d="M3.5 12.5h13.2a4 4 0 0 0 0-8c-.4 0-.78.05-1.14.16A5.8 5.8 0 0 0 4.2 7.9a3.9 3.9 0 0 0-.7 4.6Z" fill="#9AA7C2"/>
    <g fill="#DCE3F0">
      <circle class="snow-dot" cx="7" cy="18" r="1.1"/><circle class="snow-dot" cx="11" cy="20" r="1.1"/><circle class="snow-dot" cx="15" cy="18" r="1.1"/>
    </g>`,
};

function iconSVG(name, size = 22) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">${ICONS[name] || ICONS.cloudy}</svg>`;
}
function iconInner(name) {
  return ICONS[name] || ICONS.cloudy;
}

/* ---------------------------------------------------------------------- */
/* 3. Mapeamento de códigos WMO                                             */
/* ---------------------------------------------------------------------- */

function weatherFromCode(code, isDay) {
  const map = {
    0: { label: "Céu limpo", cat: isDay ? "clear-day" : "clear-night" },
    1: { label: "Predominantemente limpo", cat: isDay ? "clear-day" : "clear-night" },
    2: { label: "Parcialmente nublado", cat: isDay ? "partly-day" : "partly-night" },
    3: { label: "Nublado", cat: "cloudy" },
    45: { label: "Nevoeiro", cat: "fog" },
    48: { label: "Nevoeiro com geada", cat: "fog" },
    51: { label: "Garoa fraca", cat: "rain" },
    53: { label: "Garoa moderada", cat: "rain" },
    55: { label: "Garoa forte", cat: "rain" },
    61: { label: "Chuva fraca", cat: "rain" },
    63: { label: "Chuva moderada", cat: "rain" },
    65: { label: "Chuva forte", cat: "rain" },
    71: { label: "Neve fraca", cat: "snow" },
    73: { label: "Neve moderada", cat: "snow" },
    75: { label: "Neve forte", cat: "snow" },
    80: { label: "Pancadas de chuva", cat: "rain" },
    81: { label: "Pancadas de chuva moderadas", cat: "rain" },
    82: { label: "Pancadas de chuva fortes", cat: "rain" },
    95: { label: "Trovoada", cat: "storm" },
    96: { label: "Trovoada com granizo", cat: "storm" },
    99: { label: "Trovoada forte com granizo", cat: "storm" },
  };
  return map[code] || { label: "Condição indisponível", cat: "cloudy" };
}

/* ---------------------------------------------------------------------- */
/* 4. Camada de API                                                         */
/* ---------------------------------------------------------------------- */

async function geocodeCity(query) {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(query)}&count=5&language=pt&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao buscar cidade");
  const json = await res.json();
  return json.results || [];
}

async function reverseGeocode(lat, lon) {
  const url = `${REVERSE_GEOCODE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=pt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha no reverse geocoding");
  const json = await res.json();
  return {
    name: json.city || json.locality || "Local atual",
    country: json.countryName || "",
    countryCode: json.countryCode || "",
  };
}

async function fetchForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,is_day",
    hourly: "temperature_2m,weather_code,precipitation_probability,visibility",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "6",
  });
  const res = await fetch(`${FORECAST_URL}?${params.toString()}`);
  if (!res.ok) throw new Error("Falha ao buscar previsão");
  return res.json();
}

async function fetchAirQuality(lat, lon) {
  const params = new URLSearchParams({ latitude: lat, longitude: lon, current: "us_aqi" });
  const res = await fetch(`${AIR_QUALITY_URL}?${params.toString()}`);
  if (!res.ok) throw new Error("Falha ao buscar qualidade do ar");
  return res.json();
}

/* ---------------------------------------------------------------------- */
/* 5. Utilidades — unidade, vento, AQI, bandeira                            */
/* ---------------------------------------------------------------------- */

function toDisplayTemp(celsius) {
  const value = state.unit === "F" ? celsius * 9 / 5 + 32 : celsius;
  return Math.round(value);
}

function windCompass(deg) {
  const dirs = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(deg / 45) % 8];
}

function aqiLabel(aqi) {
  if (aqi == null) return { text: "—", tone: "" };
  if (aqi <= 50) return { text: "Boa", tone: "good" };
  if (aqi <= 100) return { text: "Moderada", tone: "" };
  if (aqi <= 150) return { text: "Ruim p/ sensíveis", tone: "warn" };
  if (aqi <= 200) return { text: "Ruim", tone: "warn" };
  return { text: "Muito ruim", tone: "warn" };
}

function flagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "🌍";
  const codePoints = [...countryCode.toUpperCase()].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...codePoints);
}

/* ---------------------------------------------------------------------- */
/* 6. Motor da "sky arc" — elemento assinatura                             */
/* ---------------------------------------------------------------------- */

const SKY_THEMES = {
  night: ["#060a14", "#111d33"],
  dawn: ["#1c2b4a", "#3c4f74"],
  day: ["#1b3a63", "#2e5c8f"],
  dusk: ["#2a2650", "#5a3a58"],
};

function updateSkyArc(currentIso, sunriseIso, sunsetIso) {
  const now = new Date(currentIso);
  const sunrise = new Date(sunriseIso);
  const sunset = new Date(sunsetIso);

  const path = document.getElementById("arc-path");
  const dot = document.getElementById("sky-body");
  const skySection = document.getElementById("sky");
  const phaseLabel = document.getElementById("sky-phase-label");
  const timeLabel = document.getElementById("sky-time-label");

  let fraction, phase, theme;

  if (now >= sunrise && now <= sunset) {
    fraction = (now - sunrise) / (sunset - sunrise);
    phase = "Dia";
    theme = fraction < 0.18 ? SKY_THEMES.dawn : fraction > 0.82 ? SKY_THEMES.dusk : SKY_THEMES.day;
  } else {
    const nightSpan = 12 * 60 * 60 * 1000;
    const msSinceSunset = now >= sunset ? now - sunset : now - sunset + 24 * 60 * 60 * 1000;
    fraction = Math.min(msSinceSunset / nightSpan, 1);
    phase = "Noite";
    theme = SKY_THEMES.night;
  }

  skySection.style.setProperty("--sky-top", theme[0]);
  skySection.style.setProperty("--sky-bottom", theme[1]);

  const length = path.getTotalLength();
  const point = path.getPointAtLength(fraction * length);
  const viewBoxScale = skySection.clientWidth / 1000;
  const heightScale = skySection.clientHeight / 220;

  dot.style.left = `${point.x * viewBoxScale}px`;
  dot.style.top = `${point.y * heightScale}px`;

  const iconName = phase === "Dia" ? "clear-day" : "clear-night";
  el("sky-body-icon").innerHTML = iconInner(iconName);

  phaseLabel.textContent = phase;
  timeLabel.textContent = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/* ---------------------------------------------------------------------- */
/* 7. Renderização de UI                                                    */
/* ---------------------------------------------------------------------- */

function showState(message, isError = false) {
  const banner = el("state-banner");
  if (!message) {
    banner.hidden = true;
    return;
  }
  banner.hidden = false;
  banner.textContent = message;
  banner.classList.toggle("is-error", isError);
}

function setLoading(isLoading) {
  el("skeleton-block").hidden = !isLoading;
  el("hero").style.display = isLoading ? "none" : "";
}

function retriggerAnimation(node) {
  node.style.animation = "none";
  void node.offsetWidth;
  node.style.animation = "";
}

function renderAll(data, aqiData, location) {
  const { current, hourly, daily } = data;
  const isDay = current.is_day === 1;
  const weather = weatherFromCode(current.weather_code, isDay);
  const unitLabel = `°${state.unit}`;

  document.body.dataset.weather = weather.cat;

  el("flag-emoji").textContent = flagEmoji(location.countryCode);
  el("city-name").textContent = location.name;
  el("region-name").textContent = location.country || "";

  el("hero-icon").innerHTML = iconSVG(weather.cat, 76);
  el("temp-value").textContent = toDisplayTemp(current.temperature_2m);
  el("temp-unit-label").textContent = unitLabel;
  el("condition-text").textContent = weather.label;
  el("feels-like").textContent = `Sensação ${toDisplayTemp(current.apparent_temperature)}°`;
  el("temp-max").textContent = `${toDisplayTemp(daily.temperature_2m_max[0])}°`;
  el("temp-min").textContent = `${toDisplayTemp(daily.temperature_2m_min[0])}°`;
  retriggerAnimation(el("hero-temp"));

  // Favorito ativo?
  const favorites = loadList(LS_KEYS.favorites);
  const isFav = favorites.some((f) => f.name === location.name && f.lat === location.lat);
  el("favorite-btn").classList.toggle("is-active", isFav);

  // Stats
  el("stat-humidity").innerHTML = `${Math.round(current.relative_humidity_2m)}<small>%</small>`;
  el("stat-wind").innerHTML = `${Math.round(current.wind_speed_10m)}<small>km/h</small>`;
  el("stat-wind-dir").textContent = windCompass(current.wind_direction_10m);
  el("wind-arrow").style.transform = `rotate(${current.wind_direction_10m}deg)`;
  el("stat-pressure").innerHTML = `${Math.round(current.surface_pressure)}<small>hPa</small>`;
  el("stat-uv").textContent = daily.uv_index_max[0] != null ? daily.uv_index_max[0].toFixed(1) : "—";
  el("stat-precip").innerHTML = `${daily.precipitation_probability_max[0] ?? 0}<small>%</small>`;
  el("stat-sun").textContent = `${new Date(daily.sunrise[0]).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} / ${new Date(daily.sunset[0]).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  const nowIso = current.time;
  const nowIdx = Math.max(hourly.time.findIndex((t) => t >= nowIso), 0);
  const visibilityKm = hourly.visibility[nowIdx] != null ? (hourly.visibility[nowIdx] / 1000).toFixed(0) : "—";
  el("stat-visibility").innerHTML = `${visibilityKm}<small>km</small>`;

  if (aqiData && aqiData.current) {
    const aqi = aqiData.current.us_aqi;
    const label = aqiLabel(aqi);
    el("stat-aqi").textContent = aqi != null ? Math.round(aqi) : "—";
    el("stat-aqi-label").textContent = label.text;
  } else {
    el("stat-aqi").textContent = "—";
    el("stat-aqi-label").textContent = "indisponível";
  }

  // Hourly — próximas 8h
  const hourlyItems = [];
  for (let i = nowIdx; i < nowIdx + 8 && i < hourly.time.length; i++) {
    const hourDate = new Date(hourly.time[i]);
    const hourWeather = weatherFromCode(hourly.weather_code[i], true);
    hourlyItems.push(`
      <div class="hour-card">
        <span class="hour-time">${hourDate.toLocaleTimeString("pt-BR", { hour: "2-digit" })}h</span>
        <span class="hour-icon">${iconSVG(hourWeather.cat, 26)}</span>
        <span class="hour-temp">${toDisplayTemp(hourly.temperature_2m[i])}°</span>
        <span class="hour-precip">${hourly.precipitation_probability[i] ?? 0}%</span>
      </div>
    `);
  }
  el("hourly-strip").innerHTML = hourlyItems.join("");

  // Gráfico — próximas 24h
  drawTempChart(hourly, nowIdx);

  // Daily — 5 dias
  const dayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
  const dailyItems = [];
  for (let i = 1; i < Math.min(daily.time.length, 6); i++) {
    const dayDate = new Date(`${daily.time[i]}T12:00:00`);
    const dayWeather = weatherFromCode(daily.weather_code[i], true);
    const dayName = dayFormatter.format(dayDate).replace(".", "");
    dailyItems.push(`
      <div class="day-row">
        <span class="day-name">${dayName}</span>
        <span class="day-icon">${iconSVG(dayWeather.cat, 22)}</span>
        <span class="day-condition">${dayWeather.label}</span>
        <span class="day-range"><span class="max">${toDisplayTemp(daily.temperature_2m_max[i])}°</span><span class="min">${toDisplayTemp(daily.temperature_2m_min[i])}°</span></span>
      </div>
    `);
  }
  el("daily-list").innerHTML = dailyItems.join("");

  updateSkyArc(current.time, daily.sunrise[0], daily.sunset[0]);
  updateMap(location.lat, location.lon, location.name);
}

function drawTempChart(hourly, startIdx) {
  const canvas = el("temp-chart");
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.parentElement.clientWidth - 16;
  const cssHeight = 180;
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const temps = hourly.temperature_2m.slice(startIdx, startIdx + 24).map((t) => toDisplayTemp(t));
  const times = hourly.time.slice(startIdx, startIdx + 24);
  if (!temps.length) return;

  const paddingX = 26;
  const paddingY = 24;
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = Math.max(max - min, 1);

  const xFor = (i) => paddingX + (i / (temps.length - 1)) * (cssWidth - paddingX * 2);
  const yFor = (t) => cssHeight - paddingY - ((t - min) / range) * (cssHeight - paddingY * 2);

  // Linha
  ctx.beginPath();
  temps.forEach((t, i) => {
    const x = xFor(i);
    const y = yFor(t);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#5EC8D8";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.stroke();

  // Área sob a linha
  ctx.lineTo(xFor(temps.length - 1), cssHeight - paddingY);
  ctx.lineTo(xFor(0), cssHeight - paddingY);
  ctx.closePath();
  const gradient = ctx.createLinearGradient(0, 0, 0, cssHeight);
  gradient.addColorStop(0, "rgba(94, 200, 216, 0.22)");
  gradient.addColorStop(1, "rgba(94, 200, 216, 0)");
  ctx.fillStyle = gradient;
  ctx.fill();

  // Pontos + rótulos a cada 4h
  ctx.font = "10px JetBrains Mono, monospace";
  ctx.fillStyle = "#8b93a7";
  ctx.textAlign = "center";
  temps.forEach((t, i) => {
    const x = xFor(i);
    const y = yFor(t);
    if (i % 4 === 0) {
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = "#F2F5FA";
      ctx.fill();
      ctx.fillStyle = "#F2F5FA";
      ctx.fillText(`${t}°`, x, y - 10);
      ctx.fillStyle = "#8b93a7";
      ctx.fillText(new Date(times[i]).toLocaleTimeString("pt-BR", { hour: "2-digit" }), x, cssHeight - 6);
    }
  });
}

function updateMap(lat, lon, name) {
  const offset = 0.06;
  const bbox = `${lon - offset},${lat - offset},${lon + offset},${lat + offset}`;
  el("map-frame").src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${lat},${lon}&layer=mapnik`;
  el("map-frame").title = `Mapa de ${name}`;
}

/* ---------------------------------------------------------------------- */
/* 8. Favoritos, histórico e chips                                          */
/* ---------------------------------------------------------------------- */

function renderChips() {
  const favorites = loadList(LS_KEYS.favorites);
  const history = loadList(LS_KEYS.history);

  el("favorites-row").innerHTML = favorites
    .map(
      (f, i) => `
      <button type="button" class="chip" data-fav-idx="${i}">
        ${flagEmoji(f.countryCode)} ${f.name}
        <span class="chip-remove" data-remove-fav="${i}">✕</span>
      </button>`
    )
    .join("");

  el("history-row").innerHTML = history
    .slice(0, 6)
    .map((h, i) => `<button type="button" class="chip" data-hist-idx="${i}">${h.name}</button>`)
    .join("");

  el("favorites-row").querySelectorAll("[data-fav-idx]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (e.target.dataset.removeFav !== undefined) return;
      const f = favorites[Number(btn.dataset.favIdx)];
      selectLocation(f);
    });
  });
  el("favorites-row").querySelectorAll("[data-remove-fav]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.removeFav);
      favorites.splice(idx, 1);
      saveList(LS_KEYS.favorites, favorites);
      renderChips();
    });
  });
  el("history-row").querySelectorAll("[data-hist-idx]").forEach((btn) => {
    btn.addEventListener("click", () => selectLocation(history[Number(btn.dataset.histIdx)]));
  });
}

function addToHistory(location) {
  let history = loadList(LS_KEYS.history);
  history = history.filter((h) => !(h.name === location.name && h.lat === location.lat));
  history.unshift(location);
  saveList(LS_KEYS.history, history.slice(0, 8));
}

function toggleFavorite() {
  const favorites = loadList(LS_KEYS.favorites);
  const idx = favorites.findIndex((f) => f.name === state.location.name && f.lat === state.location.lat);
  if (idx >= 0) favorites.splice(idx, 1);
  else favorites.unshift(state.location);
  saveList(LS_KEYS.favorites, favorites);
  el("favorite-btn").classList.toggle("is-active", idx < 0);
  renderChips();
}

/* ---------------------------------------------------------------------- */
/* 9. Busca, geolocalização, unidade, compartilhar                          */
/* ---------------------------------------------------------------------- */

let searchDebounce = null;
let lastResults = [];

function setupSearch() {
  const form = el("search-form");
  const input = el("search-input");
  const resultsBox = el("search-results");

  input.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    const query = input.value.trim();
    if (query.length < 2) {
      resultsBox.hidden = true;
      return;
    }
    searchDebounce = setTimeout(async () => {
      try {
        lastResults = await geocodeCity(query);
        renderSearchResults(lastResults);
      } catch {
        resultsBox.hidden = true;
      }
    }, 350);
  });

  // Enter seleciona diretamente o primeiro resultado
  input.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const query = input.value.trim();
    if (query.length < 2) return;
    const results = lastResults.length ? lastResults : await geocodeCity(query).catch(() => []);
    if (results.length) {
      const r = results[0];
      selectLocation({ name: r.name, country: r.country || "", countryCode: r.country_code || "", lat: r.latitude, lon: r.longitude });
      resultsBox.hidden = true;
      input.value = "";
    }
  });

  form.addEventListener("submit", (e) => e.preventDefault());

  document.addEventListener("click", (e) => {
    if (!form.contains(e.target)) resultsBox.hidden = true;
  });
}

function renderSearchResults(results) {
  const resultsBox = el("search-results");
  if (!results.length) {
    resultsBox.hidden = true;
    return;
  }
  resultsBox.innerHTML = results
    .map(
      (r, i) => `
      <button type="button" class="search-result-item" data-idx="${i}">
        ${flagEmoji(r.country_code)} ${r.name}
        <small>${[r.admin1, r.country].filter(Boolean).join(", ")}</small>
      </button>
    `
    )
    .join("");
  resultsBox.hidden = false;

  resultsBox.querySelectorAll(".search-result-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const r = results[Number(btn.dataset.idx)];
      selectLocation({ name: r.name, country: r.country || "", countryCode: r.country_code || "", lat: r.latitude, lon: r.longitude });
      resultsBox.hidden = true;
      el("search-input").value = "";
    });
  });
}

async function selectLocation(location) {
  state.location = location;
  addToHistory(location);
  renderChips();
  await loadWeather();
}

function setupGeolocation() {
  el("geo-btn").addEventListener("click", () => {
    if (!navigator.geolocation) {
      showState("Geolocalização não é suportada neste navegador.", true);
      return;
    }
    setLoading(true);
    showState("Obtendo sua localização…");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        let location = { name: "Sua localização", country: "", countryCode: "", lat: coords.latitude, lon: coords.longitude };
        try {
          const info = await reverseGeocode(coords.latitude, coords.longitude);
          location = { ...location, ...info };
        } catch {
          /* segue com o nome genérico caso o reverse geocoding falhe */
        }
        state.location = location;
        addToHistory(location);
        renderChips();
        await loadWeather();
      },
      () => {
        showState("Não foi possível obter sua localização. Verifique as permissões do navegador.", true);
        setLoading(false);
      },
      { timeout: 8000 }
    );
  });
}

function setupUnitToggle() {
  const buttons = document.querySelectorAll(".unit-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.unit = btn.dataset.unit;
      localStorage.setItem(LS_KEYS.unit, state.unit);
      buttons.forEach((b) => b.classList.toggle("is-active", b === btn));
      if (state.data) renderAll(state.data, state.aqi, state.location);
    });
  });
}

function setupFavoriteButton() {
  el("favorite-btn").addEventListener("click", toggleFavorite);
}

function showToast(message) {
  const toast = el("toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.hidden = true; }, 2400);
}

function setupShare() {
  el("share-btn").addEventListener("click", async () => {
    if (!state.data) return;
    const { current, daily } = state.data;
    const weather = weatherFromCode(current.weather_code, current.is_day === 1);
    const text = [
      `Hoje em ${state.location.name}`,
      `${weather.label} · ${toDisplayTemp(current.temperature_2m)}°${state.unit}`,
      `💨 ${Math.round(current.wind_speed_10m)} km/h  ·  💧 ${Math.round(current.relative_humidity_2m)}%`,
      `Máx ${toDisplayTemp(daily.temperature_2m_max[0])}° · Mín ${toDisplayTemp(daily.temperature_2m_min[0])}°`,
    ].join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: "Previsão do tempo — clima", text });
      } catch {
        /* usuário cancelou o compartilhamento */
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        showToast("Previsão copiada para a área de transferência");
      } catch {
        showToast("Não foi possível copiar a previsão");
      }
    }
  });
}

/* ---------------------------------------------------------------------- */
/* 10. Inicialização                                                        */
/* ---------------------------------------------------------------------- */

async function loadWeather() {
  setLoading(true);
  showState(null);
  try {
    const { lat, lon, name, country, countryCode } = state.location;
    const [data, aqiData] = await Promise.all([
      fetchForecast(lat, lon),
      fetchAirQuality(lat, lon).catch(() => null),
    ]);
    state.data = data;
    state.aqi = aqiData;
    setLoading(false);
    renderAll(data, aqiData, { name, country, countryCode, lat, lon });
  } catch (err) {
    console.error(err);
    setLoading(false);
    showState("Não foi possível carregar os dados de clima. Tente novamente.", true);
  }
}

window.addEventListener("resize", () => {
  if (state.data) {
    const { current, daily, hourly } = state.data;
    updateSkyArc(current.time, daily.sunrise[0], daily.sunset[0]);
    const nowIdx = Math.max(hourly.time.findIndex((t) => t >= current.time), 0);
    drawTempChart(hourly, nowIdx);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(`.unit-btn[data-unit="${state.unit}"]`)?.classList.add("is-active");
  document.querySelectorAll(".unit-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.unit === state.unit));

  setupSearch();
  setupGeolocation();
  setupUnitToggle();
  setupFavoriteButton();
  setupShare();
  renderChips();
  loadWeather();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* PWA é um extra — segue normalmente se o registro falhar */
    });
  }
});