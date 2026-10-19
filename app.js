const API_KEY ="902ae7da862caf820f51fface22271ce";
        
const el = (id) => document.getElementById(id);

const searchForm = el("searchForm");
const cityInput  = el("cityInput");
const geoBtn     = el("geoBtn");
const unitBtn    = el("unitBtn");
const statusBox  = el("status");

let units = "metric"; // metric = °C, imperial = °F

function setStatus(msg, isError=false){
  statusBox.textContent = msg;
  statusBox.classList.toggle("hidden", !msg);
  statusBox.style.borderColor = isError ? "rgba(255,120,120,.55)" : "rgba(255,255,255,.14)";
}

function formatLocalTime(dtSeconds, tzOffsetSeconds){
  const ms = (dtSeconds + tzOffsetSeconds) * 1000;
  return new Date(ms).toUTCString().replace("GMT", "").trim();
}

function unitSymbol(){
  return units === "metric" ? "°C" : "°F";
}

function speedUnit(){
  return units === "metric" ? "m/s" : "mph";
}

async function fetchJSON(url){
  const res = await fetch(url);
  if(!res.ok){
    let message = `Request failed (${res.status})`;
    try{
      const err = await res.json();
      if(err?.message) message = err.message;
    }catch{}
    throw new Error(message);
  }
  return res.json();
}

async function getWeatherByCity(city){
  setStatus("Loading weather…");
  const q = encodeURIComponent(city);

  // Current weather
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${API_KEY}&units=${units}`;
  const current = await fetchJSON(currentUrl);

  // 5-day / 3-hour forecast (we'll show next hours)
  const lat = current.coord.lat;
  const lon = current.coord.lon;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`;
  const forecast = await fetchJSON(forecastUrl);

  render(current, forecast);
  setStatus("");
}

async function getWeatherByCoords(lat, lon){
  setStatus("Getting your location weather…");
  const currentUrl  = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`;
  const [current, forecast] = await Promise.all([fetchJSON(currentUrl), fetchJSON(forecastUrl)]);
  render(current, forecast);
  setStatus("");
}

function render(current, forecast){
  const name = `${current.name}, ${current.sys.country}`;
  const desc = current.weather?.[0]?.description ?? "—";
  const iconCode = current.weather?.[0]?.icon ?? "01d";
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  el("place").textContent = name;
  el("desc").textContent = desc[0].toUpperCase() + desc.slice(1);
  el("icon").src = iconUrl;
  el("icon").alt = desc;

  const t = Math.round(current.main.temp);
  const feels = Math.round(current.main.feels_like);
  el("temp").textContent = `${t}${unitSymbol()}`;
  el("feels").textContent = `Feels like ${feels}${unitSymbol()}`;

  el("humidity").textContent = `${current.main.humidity}%`;
  el("wind").textContent = `${Math.round(current.wind.speed)} ${speedUnit()}`;
  el("pressure").textContent = `${current.main.pressure} hPa`;

  const tmin = Math.round(current.main.temp_min);
  const tmax = Math.round(current.main.temp_max);
  el("minmax").textContent = `${tmin}${unitSymbol()} / ${tmax}${unitSymbol()}`;

  el("time").textContent = `Local time: ${formatLocalTime(current.dt, current.timezone)}`;

  // Next hours cards (forecast list is 3-hour steps)
  const hourly = el("hourly");
  hourly.innerHTML = "";

  const items = forecast.list.slice(0, 8); // ~24 hours
  for(const item of items){
    const time = formatLocalTime(item.dt, forecast.city.timezone).slice(0, 16); // readable
    const temp = Math.round(item.main.temp);
    const ic = item.weather?.[0]?.icon ?? "01d";
    const icUrl = `https://openweathermap.org/img/wn/${ic}.png`;

    const div = document.createElement("div");
    div.className = "hour";
    div.innerHTML = `
      <p class="t">${time}</p>
      <img src="${icUrl}" alt="">
      <p class="v">${temp}${unitSymbol()}</p>
    `;
    hourly.appendChild(div);
  }
}

searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if(!city) return setStatus("Type a city name first.", true);

  try{
    await getWeatherByCity(city);
  }catch(err){
    setStatus(`Couldn’t load weather: ${err.message}`, true);
  }
});

geoBtn.addEventListener("click", () => {
  if(!navigator.geolocation){
    setStatus("Geolocation not supported in this browser.", true);
    return;
  }

  setStatus("Requesting location permission…");
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try{
        await getWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
      }catch(err){
        setStatus(`Couldn’t load weather: ${err.message}`, true);
      }
    },
    (err) => {
      setStatus("Location permission denied or unavailable.", true);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

unitBtn.addEventListener("click", async () => {
  units = units === "metric" ? "imperial" : "metric";
  unitBtn.textContent = units === "metric" ? "°C" : "°F";

  // refresh current displayed city if we have one
  const placeText = el("place").textContent;
  if(placeText && placeText !== "—"){
    // try re-search by city name part
    const city = placeText.split(",")[0];
    try{
      await getWeatherByCity(city);
    }catch(err){
      setStatus(`Couldn’t refresh units: ${err.message}`, true);
    }
  }
});

// Default: show a city immediately (you can change this)
getWeatherByCity("Lagos").catch(err => setStatus(`Couldn’t load weather: ${err.message}`, true));

function setWeatherBackground(main){
  // OpenWeather "main" values: Clear, Clouds, Rain, Drizzle, Thunderstorm, Snow, Mist, Smoke, Haze, Dust, Fog, Sand, Ash, Squall, Tornado
  const map = {
    Clear: "bg-clear",
    Clouds: "bg-clouds",
    Rain: "bg-rain",
    Drizzle: "bg-drizzle",
    Thunderstorm: "bg-thunder",
    Snow: "bg-snow",
    Mist: "bg-mist",
    Smoke: "bg-mist",
    Haze: "bg-mist",
    Dust: "bg-mist",
    Fog: "bg-mist",
    Sand: "bg-mist",
    Ash: "bg-mist",
    Squall: "bg-rain",
    Tornado: "bg-thunder"
  };

  // remove old bg-* classes
  document.body.classList.forEach(c => {
    if (c.startsWith("bg-")) document.body.classList.remove(c);
  });

  document.body.classList.add(map[main] || "bg-clouds");
}