// Coordenadas de Olvera, Cádiz
const LATITUDE = 36.7378;
const LONGITUDE = -5.3133;

// API Key para OpenWeatherMap (API pública gratuita)
// Se puede usar sin autenticación en el plan gratuito
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const API_KEY = 'b6fd4c4d19f8bf5a8d827154b5ca0b33'; // Free API Key para demo

// DOM Elements
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const weatherContent = document.getElementById('weatherContent');

// Fetch weather data on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchWeatherData();
    // Actualizar cada 30 minutos
    setInterval(fetchWeatherData, 30 * 60 * 1000);
});

/**
 * Fetch current weather data
 */
async function fetchWeatherData() {
    try {
        loadingSpinner.style.display = 'block';
        errorMessage.style.display = 'none';
        weatherContent.style.display = 'none';

        // Fetch current weather
        const currentResponse = await fetch(
            `${API_BASE_URL}/weather?lat=${LATITUDE}&lon=${LONGITUDE}&appid=${API_KEY}&units=metric&lang=es`
        );

        // Fetch forecast data
        const forecastResponse = await fetch(
            `${API_BASE_URL}/forecast?lat=${LATITUDE}&lon=${LONGITUDE}&appid=${API_KEY}&units=metric&lang=es`
        );

        // Fetch UV Index
        const uvResponse = await fetch(
            `${API_BASE_URL}/uvi?lat=${LATITUDE}&lon=${LONGITUDE}&appid=${API_KEY}`
        );

        if (!currentResponse.ok || !forecastResponse.ok || !uvResponse.ok) {
            throw new Error('Error al obtener datos del clima');
        }

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();
        const uvData = await uvResponse.json();

        // Populate current weather
        populateCurrentWeather(currentData, uvData);

        // Populate forecast
        populateForecast(forecastData);

        // Populate hourly forecast
        populateHourlyForecast(forecastData);

        // Update last update time
        updateLastUpdateTime();

        // Show weather content
        loadingSpinner.style.display = 'none';
        weatherContent.style.display = 'block';

    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'No se pudieron obtener los datos del clima');
    }
}

/**
 * Populate current weather data
 */
function populateCurrentWeather(data, uvData) {
    // Temperature
    document.getElementById('temperature').textContent = Math.round(data.main.temp);
    document.getElementById('feelsLike').textContent = Math.round(data.main.feels_like) + '°C';

    // Weather description and icon
    const description = data.weather[0].main;
    const weatherDesc = data.weather[0].description;
    document.getElementById('weatherDesc').textContent = 
        weatherDesc.charAt(0).toUpperCase() + weatherDesc.slice(1);

    // Weather icon mapping
    const iconCode = data.weather[0].icon;
    document.getElementById('weatherIcon').className = getWeatherIcon(iconCode);

    // Humidity
    document.getElementById('humidity').textContent = data.main.humidity + '%';

    // Wind speed (convert m/s to km/h)
    const windSpeed = Math.round(data.wind.speed * 3.6);
    document.getElementById('windSpeed').textContent = windSpeed + ' km/h';

    // Pressure
    document.getElementById('pressure').textContent = data.main.pressure + ' mb';

    // Visibility (convert from meters to km)
    const visibility = (data.visibility / 1000).toFixed(1);
    document.getElementById('visibility').textContent = visibility + ' km';

    // UV Index
    document.getElementById('uvIndex').textContent = Math.round(uvData.value);

    // Sunrise and Sunset
    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);
    document.getElementById('sunrise').textContent = formatTime(sunrise);
    document.getElementById('sunset').textContent = formatTime(sunset);

    // Rainfall (if available)
    const rainfall = data.rain?.['1h'] || 0;
    document.getElementById('rainfall').textContent = rainfall.toFixed(1) + ' mm';

    // Moon phase (simplified)
    document.getElementById('moonPhase').textContent = 'Consultar calendarios lunares';
}

/**
 * Populate 5-day forecast
 */
function populateForecast(data) {
    const forecastGrid = document.getElementById('forecastGrid');
    forecastGrid.innerHTML = '';

    // Get daily forecasts (one every 8 hours = every 24 hours starting from 00:00)
    const dailyForecasts = {};
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!dailyForecasts[dateKey]) {
            dailyForecasts[dateKey] = item;
        }
    });

    // Create forecast cards
    Object.entries(dailyForecasts).slice(0, 5).forEach(([date, item]) => {
        const forecastDate = new Date(item.dt * 1000);
        const card = document.createElement('div');
        card.className = 'forecast-card';
        
        const dayName = getDayName(forecastDate);
        const maxTemp = Math.round(item.main.temp_max);
        const minTemp = Math.round(item.main.temp_min);
        const icon = getWeatherIcon(item.weather[0].icon);
        const desc = item.weather[0].main;

        card.innerHTML = `
            <div class="forecast-date">${dayName}</div>
            <i class="${icon}"></i>
            <div class="forecast-temps">
                <span class="forecast-max">${maxTemp}°</span>
                <span class="forecast-min">${minTemp}°</span>
            </div>
            <div class="forecast-desc">${desc}</div>
        `;

        forecastGrid.appendChild(card);
    });
}

/**
 * Populate hourly forecast
 */
function populateHourlyForecast(data) {
    const hourlyForecast = document.getElementById('hourlyForecast');
    hourlyForecast.innerHTML = '';

    // Get next 24 hours
    data.list.slice(0, 8).forEach(item => {
        const date = new Date(item.dt * 1000);
        const hour = date.getHours().toString().padStart(2, '0') + ':00';
        const temp = Math.round(item.main.temp);
        const icon = getWeatherIcon(item.weather[0].icon);

        const card = document.createElement('div');
        card.className = 'hourly-card';
        card.innerHTML = `
            <div class="hourly-time">${hour}</div>
            <i class="${icon}"></i>
            <div class="hourly-temp">${temp}°</div>
        `;

        hourlyForecast.appendChild(card);
    });
}

/**
 * Get weather icon based on OpenWeatherMap icon code
 */
function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': 'fas fa-sun',
        '01n': 'fas fa-moon',
        '02d': 'fas fa-cloud-sun',
        '02n': 'fas fa-cloud-moon',
        '03d': 'fas fa-cloud',
        '03n': 'fas fa-cloud',
        '04d': 'fas fa-cloud',
        '04n': 'fas fa-cloud',
        '09d': 'fas fa-cloud-rain',
        '09n': 'fas fa-cloud-rain',
        '10d': 'fas fa-cloud-sun-rain',
        '10n': 'fas fa-cloud-moon-rain',
        '11d': 'fas fa-bolt',
        '11n': 'fas fa-bolt',
        '13d': 'fas fa-snowflake',
        '13n': 'fas fa-snowflake',
        '50d': 'fas fa-smog',
        '50n': 'fas fa-smog'
    };

    return iconMap[iconCode] || 'fas fa-cloud';
}

/**
 * Format time as HH:MM
 */
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Get day name in Spanish
 */
function getDayName(date) {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[date.getDay()];
}

/**
 * Update last update time
 */
function updateLastUpdateTime() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = formatTime(now);
}

/**
 * Show error message
 */
function showError(message) {
    loadingSpinner.style.display = 'none';
    errorMessage.style.display = 'block';
    errorText.textContent = message;
    weatherContent.style.display = 'none';
}
