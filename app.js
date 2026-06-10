/**
 * Kiosk Weather & Calendar Dashboard
 * Target Location: High Park Sanctuary (High Park North, Toronto, ON)
 * Weather Coordinates: 43.6558, -79.4678
 * Magical Wizarding Theme (Harry Potter Edition)
 */

document.addEventListener('DOMContentLoaded', async () => {
    const KIOSK_MODE = true;

    if (KIOSK_MODE) {
        document.body.classList.add('kiosk-mode');
    }

    // DOM Elements
    const txtTime = document.getElementById('txt-time');
    const txtSeconds = document.getElementById('txt-seconds');
    const txtAmpm = document.getElementById('txt-ampm');
    const txtDate = document.getElementById('txt-date');
    const txtTodayEvents = document.getElementById('txt-today-events');
    const txtAlarmTime = document.getElementById('txt-alarm-time');
    
    const calendarMonthYear = document.getElementById('calendar-month-year');
    const calendarGridContainer = document.getElementById('calendar-grid-container');
    const btnPrevMonth = document.getElementById('btn-prev-month');
    const btnNextMonth = document.getElementById('btn-next-month');
    const btnOpenCalendar = document.getElementById('btn-open-calendar');
    const btnCloseCalendar = document.getElementById('btn-close-calendar');
    const calendarOverlay = document.getElementById('calendar-overlay');
    const btnOpenAlarm = document.getElementById('btn-open-alarm');
    const alarmOverlay = document.getElementById('alarm-overlay');
    const btnCloseAlarm = document.getElementById('btn-close-alarm');
    const alarmForm = document.getElementById('alarm-form');
    const alarmTimeInput = document.getElementById('alarm-time');
    const btnPickAlarmTime = document.getElementById('btn-pick-alarm-time');
    const btnDisableAlarm = document.getElementById('btn-disable-alarm');
    const btnAlarmSnooze = document.getElementById('btn-alarm-snooze');
    const btnAlarmStop = document.getElementById('btn-alarm-stop');
    const alarmStatus = document.getElementById('alarm-status');
    const alarmRingingBanner = document.getElementById('alarm-ringing-banner');
    
    const refreshBadge = document.getElementById('refresh-badge');
    const txtLastUpdate = document.getElementById('txt-last-update');
    const weatherMainIcon = document.getElementById('weather-main-icon');
    const txtCurrentTemp = document.getElementById('txt-current-temp');
    const txtWeatherDesc = document.getElementById('txt-weather-desc');
    const txtFeelsLike = document.getElementById('txt-feels-like');
    
    const txtHumidity = document.getElementById('txt-humidity');
    const txtWind = document.getElementById('txt-wind');
    const txtPrecipitation = document.getElementById('txt-precipitation');
    const forecastDaysContainer = document.getElementById('forecast-days-container');
    const loader = document.getElementById('loader');
    const locationHouseIcon = document.getElementById('location-house-icon');
    const houseStampIcon = document.getElementById('house-stamp-icon');
    const houseStampName = document.getElementById('house-stamp-name');
    const txtDailySpell = document.getElementById('txt-daily-spell');
    const houseStatIcon1 = document.getElementById('house-stat-icon-1');
    const houseStatIcon2 = document.getElementById('house-stat-icon-2');
    const houseStatIcon3 = document.getElementById('house-stat-icon-3');
    const forecastTitleIcon = document.getElementById('forecast-title-icon');
    const houseRevealIconQuote = document.getElementById('house-reveal-icon-quote');
    const houseRevealIconRiddle = document.getElementById('house-reveal-icon-riddle');
    const houseRevealIconJoke = document.getElementById('house-reveal-icon-joke');
    const houseWatermark = document.getElementById('house-watermark');

    function updateKioskOrientationClass() {
        if (!KIOSK_MODE) return;

        if (window.matchMedia('(orientation: portrait)').matches) {
            document.body.classList.add('kiosk-portrait');
        } else {
            document.body.classList.remove('kiosk-portrait');
        }
    }

    // Event Modal DOM Elements
    const eventModal = document.getElementById('event-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const modalDateTitle = document.getElementById('modal-date-title');
    const eventsList = document.getElementById('events-list');
    const eventForm = document.getElementById('event-form');
    const eventTitleInput = document.getElementById('event-title');
    const eventTimeInput = document.getElementById('event-time');
    const btnPickEventTime = document.getElementById('btn-pick-event-time');

    // Weather API Settings
    const LATITUDE = 43.6558;
    const LONGITUDE = -79.4678;
    const WEATHER_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=America%2FNew_York`;

    // Calendar State
    let currentDate = new Date();
    let calendarMonth = currentDate.getMonth();
    let calendarYear = currentDate.getFullYear();
    let selectedDateKey = ''; // Holds key: YYYY-MM-DD

    // Persistent Wizarding Events
    const events = JSON.parse(localStorage.getItem('wizard_kiosk_events') || '{}');
    let lastWeatherData = null;
    let forecastMode = 'hourly';

    const btnForecastDaily = document.getElementById('btn-forecast-daily');
    const btnForecastHourly = document.getElementById('btn-forecast-hourly');
    const btnForecastTomorrow = document.getElementById('btn-forecast-tomorrow');
    const houseOverrideParam = new URLSearchParams(window.location.search).get('house');
    const ALARM_STORAGE_KEY = 'wizard_alarm_config';

    const hedwigThemeAudio = new Audio('music/Hedwigs_Theme-4096-mobiles24.mp3');
    hedwigThemeAudio.loop = true;
    hedwigThemeAudio.preload = 'auto';

    let alarmState = loadAlarmState();
    let isAlarmRinging = false;
    let isDashboardRefreshing = false;
    let fallbackAudioContext = null;
    let fallbackAlarmInterval = null;

    function loadAlarmState() {
        try {
            const raw = localStorage.getItem(ALARM_STORAGE_KEY);
            if (!raw) {
                return {
                    time: '',
                    enabled: false,
                    lastTriggeredDate: '',
                    snoozeUntil: '',
                    nextTriggerAt: ''
                };
            }

            const parsed = JSON.parse(raw);
            return {
                time: typeof parsed.time === 'string' ? parsed.time : '',
                enabled: Boolean(parsed.enabled),
                lastTriggeredDate: typeof parsed.lastTriggeredDate === 'string' ? parsed.lastTriggeredDate : '',
                snoozeUntil: typeof parsed.snoozeUntil === 'string' ? parsed.snoozeUntil : '',
                nextTriggerAt: typeof parsed.nextTriggerAt === 'string' ? parsed.nextTriggerAt : ''
            };
        } catch (error) {
            console.warn('Failed to load alarm state, resetting:', error);
            return {
                time: '',
                enabled: false,
                lastTriggeredDate: '',
                snoozeUntil: '',
                nextTriggerAt: ''
            };
        }
    }

    function saveAlarmState() {
        localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(alarmState));
    }

    function formatAlarmTime(timeValue) {
        if (!timeValue || !timeValue.includes(':')) {
            return '--:--';
        }

        const [hourStr, minute] = timeValue.split(':');
        const hour = parseInt(hourStr, 10);
        if (Number.isNaN(hour)) return timeValue;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minute} ${ampm}`;
    }

    function updateAlarmStatusText() {
        if (!alarmStatus) return;

        const alarmButtonLabel = btnOpenAlarm ? btnOpenAlarm.querySelector('span') : null;

        if (!alarmState.enabled || !alarmState.time) {
            alarmStatus.textContent = 'No alarm is set.';
            if (txtAlarmTime) {
                txtAlarmTime.textContent = 'Not set';
            }
            if (alarmButtonLabel) {
                alarmButtonLabel.textContent = 'Set Owl Alarm';
            }
            updateAlarmControlButtons();
            return;
        }

        let effectiveAlarmText = formatAlarmTime(alarmState.time);
        if (alarmState.nextTriggerAt) {
            const nextTrigger = new Date(alarmState.nextTriggerAt);
            if (!Number.isNaN(nextTrigger.getTime())) {
                effectiveAlarmText = nextTrigger.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            }
        }

        if (txtAlarmTime) {
            txtAlarmTime.textContent = effectiveAlarmText;
        }
        if (alarmButtonLabel) {
            alarmButtonLabel.textContent = `Alarm ${effectiveAlarmText}`;
        }

        let statusLine = `Alarm set for ${formatAlarmTime(alarmState.time)} daily.`;
        if (alarmState.snoozeUntil) {
            const snoozeDate = new Date(alarmState.snoozeUntil);
            if (!Number.isNaN(snoozeDate.getTime()) && snoozeDate.getTime() > Date.now()) {
                statusLine += ` Snoozed until ${snoozeDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}.`;
            }
        }
        alarmStatus.textContent = statusLine;
    }

    function startFallbackAlarmLoop() {
        if (fallbackAlarmInterval) return;

        fallbackAudioContext = new (window.AudioContext || window.webkitAudioContext)();

        const playPulse = () => {
            if (!fallbackAudioContext) return;

            const now = fallbackAudioContext.currentTime;
            const notes = [659.25, 783.99, 880.0];
            notes.forEach((freq, idx) => {
                const oscillator = fallbackAudioContext.createOscillator();
                const gainNode = fallbackAudioContext.createGain();
                oscillator.type = 'triangle';
                oscillator.frequency.value = freq;
                gainNode.gain.setValueAtTime(0.0001, now + idx * 0.22);
                gainNode.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.22 + 0.03);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.22 + 0.2);

                oscillator.connect(gainNode);
                gainNode.connect(fallbackAudioContext.destination);
                oscillator.start(now + idx * 0.22);
                oscillator.stop(now + idx * 0.22 + 0.21);
            });
        };

        playPulse();
        fallbackAlarmInterval = setInterval(playPulse, 1700);
    }

    function stopFallbackAlarmLoop() {
        if (fallbackAlarmInterval) {
            clearInterval(fallbackAlarmInterval);
            fallbackAlarmInterval = null;
        }

        if (fallbackAudioContext) {
            fallbackAudioContext.close().catch(() => {});
            fallbackAudioContext = null;
        }
    }

    async function startAlarmPlayback() {
        try {
            hedwigThemeAudio.currentTime = 0;
            await hedwigThemeAudio.play();
        } catch (error) {
            console.warn('Hedwig theme file unavailable or blocked, using fallback alarm tones:', error);
            startFallbackAlarmLoop();
        }
    }

    function stopAlarmPlayback() {
        hedwigThemeAudio.pause();
        hedwigThemeAudio.currentTime = 0;
        stopFallbackAlarmLoop();
    }
    function updateAlarmControlButtons() {
        const hasAlarmConfigured = Boolean(alarmState.enabled && alarmState.time);
        const canControlRinging = hasAlarmConfigured && isAlarmRinging;

        if (btnAlarmSnooze) {
            btnAlarmSnooze.disabled = !canControlRinging;
        }
        if (btnAlarmStop) {
            btnAlarmStop.disabled = !canControlRinging;
        }
    }

    function setAlarmRingingState(ringing) {
        isAlarmRinging = ringing;
        if (alarmRingingBanner) {
            alarmRingingBanner.classList.toggle('hidden', !ringing);
        }
        updateAlarmControlButtons();
    }

    function openAlarmOverlay() {
        if (!alarmOverlay) return;
        alarmOverlay.classList.remove('hidden');
    }

    function closeAlarmOverlay() {
        if (!alarmOverlay) return;
        if (isAlarmRinging) return;
        alarmOverlay.classList.add('hidden');
    }

    function getDateKey(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function computeNextTriggerAt(timeValue, fromDate = new Date()) {
        if (!timeValue || !timeValue.includes(':')) {
            return '';
        }

        const [hourStr, minuteStr] = timeValue.split(':');
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);
        if (Number.isNaN(hour) || Number.isNaN(minute)) {
            return '';
        }

        const next = new Date(fromDate);
        next.setSeconds(0, 0);
        next.setHours(hour, minute, 0, 0);

        // If today's alarm time has passed, schedule for tomorrow.
        if (next.getTime() <= fromDate.getTime()) {
            next.setDate(next.getDate() + 1);
        }

        return next.toISOString();
    }

    async function primeAlarmAudio() {
        try {
            hedwigThemeAudio.volume = 0;
            await hedwigThemeAudio.play();
            hedwigThemeAudio.pause();
            hedwigThemeAudio.currentTime = 0;
        } catch (error) {
            // Ignore autoplay priming errors; alarm still has visual + fallback paths.
        } finally {
            hedwigThemeAudio.volume = 1;
        }
    }

    function triggerAlarm(now) {
        if (isAlarmRinging) return;

        alarmState.lastTriggeredDate = getDateKey(now);
        alarmState.snoozeUntil = '';
        alarmState.nextTriggerAt = computeNextTriggerAt(alarmState.time, new Date(now.getTime() + 1000));
        saveAlarmState();
        updateAlarmStatusText();

        setAlarmRingingState(true);
        openAlarmOverlay();
        startAlarmPlayback();
    }

    function checkAndTriggerAlarm(now) {
        if (!alarmState.enabled || !alarmState.time || isAlarmRinging) {
            return;
        }

        if (!alarmState.nextTriggerAt) {
            alarmState.nextTriggerAt = computeNextTriggerAt(alarmState.time, now);
            saveAlarmState();
        }

        const nextTrigger = new Date(alarmState.nextTriggerAt);
        if (Number.isNaN(nextTrigger.getTime())) {
            alarmState.nextTriggerAt = computeNextTriggerAt(alarmState.time, now);
            saveAlarmState();
            return;
        }

        if (now.getTime() >= nextTrigger.getTime()) {
            triggerAlarm(now);
        }
    }

    // WMO Weather Codes to Magical Labels, Lucide Icons, and Hogwarts Themes
    const weatherCodes = {
        0: { label: 'Felix Felicis (Clear)', icon: 'sun', theme: 'sunny', nightIcon: 'moon', nightTheme: 'night' },
        1: { label: 'Mainly Clear Skies', icon: 'cloud-sun', theme: 'sunny', nightIcon: 'cloud-moon', nightTheme: 'night' },
        2: { label: 'Partly Cloudy', icon: 'cloud-sun', theme: 'cloudy', nightIcon: 'cloud-moon', nightTheme: 'night' },
        3: { label: 'Hogwarts Mist', icon: 'cloud', theme: 'cloudy' },
        45: { label: 'Herbology Fog', icon: 'cloud-fog', theme: 'cloudy' },
        48: { label: 'Herbology Fog', icon: 'cloud-fog', theme: 'cloudy' },
        51: { label: 'Aquamenti Drizzle', icon: 'cloud-drizzle', theme: 'rainy' },
        53: { label: 'Aquamenti Drizzle', icon: 'cloud-drizzle', theme: 'rainy' },
        55: { label: 'Heavy Aquamenti', icon: 'cloud-drizzle', theme: 'rainy' },
        56: { label: 'Glacial Drizzle', icon: 'cloud-snow', theme: 'snowy' },
        57: { label: 'Heavy Glacial Drizzle', icon: 'cloud-snow', theme: 'snowy' },
        61: { label: 'Aquamenti Rain', icon: 'cloud-rain', theme: 'rainy' },
        63: { label: 'Moderate Rain', icon: 'cloud-rain', theme: 'rainy' },
        65: { label: 'Heavy Aquamenti Rain', icon: 'cloud-rain', theme: 'rainy' },
        66: { label: 'Freezing Rain', icon: 'cloud-snow', theme: 'snowy' },
        67: { label: 'Heavy Freezing Rain', icon: 'cloud-snow', theme: 'snowy' },
        71: { label: 'Hogsmeade Flurries', icon: 'snowflake', theme: 'snowy' },
        73: { label: 'Hogsmeade Snow', icon: 'snowflake', theme: 'snowy' },
        75: { label: 'Heavy Hogsmeade Snow', icon: 'snowflake', theme: 'snowy' },
        77: { label: 'Glacial Grains', icon: 'snowflake', theme: 'snowy' },
        80: { label: 'Aquamenti Showers', icon: 'cloud-drizzle', theme: 'rainy' },
        81: { label: 'Aquamenti Showers', icon: 'cloud-rain', theme: 'rainy' },
        82: { label: 'Torrential Aquamenti', icon: 'cloud-rain', theme: 'rainy' },
        85: { label: 'Hogsmeade Showers', icon: 'cloud-snow', theme: 'snowy' },
        86: { label: 'Heavy Hogsmeade Showers', icon: 'cloud-snow', theme: 'snowy' },
        95: { label: 'Azkaban Tempest', icon: 'cloud-lightning', theme: 'stormy' },
        96: { label: 'Azkaban Hailstorm', icon: 'cloud-lightning', theme: 'stormy' },
        99: { label: 'Severe Azkaban Tempest', icon: 'cloud-lightning', theme: 'stormy' }
    };

    // Helper: Escape HTML strings to prevent XSS
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    function setIcon(target, iconName) {
        if (target) {
            target.setAttribute('data-lucide', iconName);
        }
    }

    const dailySpells = [
        'Expelliarmus: Disarming Charm',
        'Expecto Patronum: Patronus Charm (creates a protective guardian).',
        'Lumos: Wand-Lighting Charm.',
        'Alohomora: Unlocking Charm.',
        'Accio: Summoning Charm.',
        'Wingardium Leviosa: Levitation Charm.',
        'Stupefy: Stunning Spell.',
        'Avada Kedavra: Killing Curse (Unforgivable).',
        'Crucio: Torture Curse (Unforgivable).',
        'Imperio: Control Curse (Unforgivable).',
        'Riddikulus: Boggart Banishing Spell.',
        'Obliviate: Memory Modification Charm.',
        'Petrificus Totalus: Full Body-Bind Curse.',
        'Protego: Shield Charm.',
        'Incendio: Fire-Making Spell.',
        'Sectumsempra: Cutting Curse (invented by the Half-Blood Prince).',
        'Aguamenti: Water-Making Spell.',
        'Bombarda: Blasting Charm.',
        'Confundo: Confundus Charm.',
        'Diffindo: Severing Charm.',
        'Engorgio: Engorgement Charm.',
        'Episkey: Minor Healing Spell.',
        'Evanesco: Vanishing Spell.',
        'Finite Incantatem: General Counter-Spell.',
        'Glisseo: Sliding Spell.',
        'Impedimenta: Impediment Jinx.',
        'Incarcerous: Conjures ropes.',
        'Nox: Wand-Extinguishing Charm.',
        'Rictusempra: Tickling Charm.',
        'Reparo: Mending Charm.',
        'Silencio: Silencing Charm.',
        'Tergeo: Cleaning Spell.'
    ];

    function applyHouseVisuals(house) {
        if (house === 'gryffindor') {
            if (houseStampName) houseStampName.textContent = 'Gryffindor House';

            setIcon(locationHouseIcon, 'compass');
            setIcon(houseStampIcon, 'shield-check');
            setIcon(houseStatIcon1, 'flame');
            setIcon(houseStatIcon2, 'swords');
            setIcon(houseStatIcon3, 'shield');
            setIcon(forecastTitleIcon, 'scroll');
            setIcon(houseRevealIconQuote, 'crown');
            setIcon(houseRevealIconRiddle, 'help-circle');
            setIcon(houseRevealIconJoke, 'sparkles');

            if (houseWatermark) {
                houseWatermark.innerHTML = `
                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M50 90 C15 75 15 25 50 10 C85 25 85 75 50 90 Z" />
                        <path d="M50 80 L50 20" stroke-width="0.6" />
                        <path d="M42 28 L58 28" stroke-width="0.6" />
                        <path d="M50 28 L50 18" stroke-width="0.6" />
                        <circle cx="50" cy="18" r="2" fill="currentColor" />
                        <path d="M30 45 L32 42 L35 45 L32 48 Z" fill="currentColor" opacity="0.5" />
                        <path d="M70 55 L72 52 L75 55 L72 58 Z" fill="currentColor" opacity="0.5" />
                    </svg>
                `;
            }
        } else {
            if (houseStampName) houseStampName.textContent = 'Slytherin House';

            setIcon(locationHouseIcon, 'map-pinned');
            setIcon(houseStampIcon, 'shield');
            setIcon(houseStatIcon1, 'droplets');
            setIcon(houseStatIcon2, 'wind');
            setIcon(houseStatIcon3, 'umbrella');
            setIcon(forecastTitleIcon, 'scroll-text');
            setIcon(houseRevealIconQuote, 'book-open-text');
            setIcon(houseRevealIconRiddle, 'eye');
            setIcon(houseRevealIconJoke, 'snake');

            if (houseWatermark) {
                houseWatermark.innerHTML = `
                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M50 90 C15 75 15 25 50 10 C85 25 85 75 50 90 Z" />
                        <path d="M50 20 C32 20 32 38 50 44 C68 50 68 68 50 74 C32 80 38 82 50 82 C65 82 68 76 68 70" stroke-width="0.6" />
                        <path d="M50 20 L53 16 L47 16 Z" fill="currentColor" />
                        <path d="M32 55 L34 52 L37 55 L34 58 Z" fill="currentColor" opacity="0.5" />
                        <path d="M68 35 L70 32 L73 35 L70 38 Z" fill="currentColor" opacity="0.5" />
                    </svg>
                `;
            }
        }

        if (txtDailySpell) {
            const spellIndex = seededIndex(new Date(), 'daily-spell', dailySpells.length);
            txtDailySpell.textContent = dailySpells[spellIndex];
        }
    }

    function getDailyRandomHouse(date) {
        if (houseOverrideParam === 'gryffindor' || houseOverrideParam === 'slytherin') {
            return houseOverrideParam;
        }

        const value = seededIndex(date, 'house', 2);
        return value === 0 ? 'gryffindor' : 'slytherin';
    }

    function setForecastMode(mode) {
        forecastMode = mode;
        if (btnForecastDaily) btnForecastDaily.classList.toggle('active', mode === 'daily');
        if (btnForecastHourly) btnForecastHourly.classList.toggle('active', mode === 'hourly');
        if (btnForecastTomorrow) btnForecastTomorrow.classList.toggle('active', mode === 'tomorrow');

        if (lastWeatherData) {
            renderForecast(lastWeatherData, mode);
        }
    }

    function renderForecast(data, mode) {
        const daily = data.daily;
        const hourly = data.hourly;
        forecastDaysContainer.innerHTML = '';
        forecastDaysContainer.classList.remove('forecast-grid-hourly');

        if (mode === 'hourly' && hourly && hourly.time) {
            forecastDaysContainer.classList.add('forecast-grid-hourly');
            const currentHour = new Date();
            let startIdx = hourly.time.findIndex((t) => new Date(t).getTime() >= currentHour.getTime());
            if (startIdx < 0) startIdx = 0;
            const endIdx = Math.min(startIdx + 24, hourly.time.length);

            for (let i = startIdx; i < endIdx; i++) {
                const hourDate = new Date(hourly.time[i]);

                const hourLabel = hourDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
                const temp = Math.round(hourly.temperature_2m[i]);
                const windVal = Math.round(hourly.wind_speed_10m[i]);
                const hCode = hourly.weather_code[i];
                const hMapping = weatherCodes[hCode] || { icon: 'cloud' };

                const hourlyDiv = document.createElement('div');
                hourlyDiv.className = 'forecast-day forecast-day-hourly';
                hourlyDiv.innerHTML = `
                    <span class="forecast-hour-label">${hourLabel}</span>
                    <div class="forecast-icon"><i data-lucide="${hMapping.icon}"></i></div>
                    <div class="forecast-temps">
                        <span class="forecast-temp-max">${temp}°</span>
                    </div>
                    <span class="forecast-hour-label">${windVal} km/h</span>
                `;
                forecastDaysContainer.appendChild(hourlyDiv);
            }
            return;
        }

        if (mode === 'tomorrow' && daily && daily.time && daily.time[1]) {
            const tomorrowCode = daily.weather_code[1];
            const tomorrowMap = weatherCodes[tomorrowCode] || { icon: 'cloud', label: 'Unknown Magic' };
            const tMax = Math.round(daily.temperature_2m_max[1]);
            const tMin = Math.round(daily.temperature_2m_min[1]);

            const tomorrowCard = document.createElement('div');
            tomorrowCard.className = 'forecast-day forecast-tomorrow-card';
            tomorrowCard.innerHTML = `
                <div class="forecast-tomorrow-icon"><i data-lucide="${tomorrowMap.icon}"></i></div>
                <div>
                    <div class="forecast-tomorrow-title">Tomorrow</div>
                    <div class="forecast-tomorrow-desc">${tomorrowMap.label}</div>
                </div>
                <div class="forecast-temps">
                    <span class="forecast-temp-max">${tMax}°</span>
                    <span class="forecast-temp-min">${tMin}°</span>
                </div>
            `;
            forecastDaysContainer.appendChild(tomorrowCard);
            return;
        }

        // Default daily 5-day forecast
        for (let i = 1; i <= 5; i++) {
            if (!daily.time[i]) break;

            const dateStr = daily.time[i];
            const dateObj = new Date(`${dateStr}T00:00:00`);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const maxTemp = Math.round(daily.temperature_2m_max[i]);
            const minTemp = Math.round(daily.temperature_2m_min[i]);
            const dailyCode = daily.weather_code[i];

            const forecastMapping = weatherCodes[dailyCode] || { icon: 'cloud' };
            const forecastIcon = forecastMapping.icon;

            const forecastDayDiv = document.createElement('div');
            forecastDayDiv.className = 'forecast-day';
            forecastDayDiv.innerHTML = `
                <span class="forecast-day-name">${dayName}</span>
                <div class="forecast-icon"><i data-lucide="${forecastIcon}"></i></div>
                <div class="forecast-temps">
                    <span class="forecast-temp-max">${maxTemp}°</span>
                    <span class="forecast-temp-min">${minTemp}°</span>
                </div>
            `;
            forecastDaysContainer.appendChild(forecastDayDiv);
        }
    }

    // ==========================================
    // Clock & Date Logic
    // ==========================================
    function updateClock() {
        const now = new Date();
        
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        const hoursStr = String(hours).padStart(2, '0');

        // Apply to DOM
        txtTime.textContent = `${hoursStr}:${minutes}`;
        txtSeconds.textContent = seconds;
        txtAmpm.textContent = ampm;

        // Date format: e.g. "Sunday, June 7, 2026"
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        txtDate.textContent = now.toLocaleDateString('en-US', options);

        // Cross midnight check
        if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
            currentDate = new Date();
            renderCalendar(calendarMonth, calendarYear);
            renderTodayEventsSummary(currentDate);
        }

        checkAndTriggerAlarm(now);
    }

    // Initialize clock
    updateClock();
    setInterval(updateClock, 1000);
    updateKioskOrientationClass();
    window.addEventListener('resize', updateKioskOrientationClass);


    // ==========================================
    // Calendar Logic
    // ==========================================
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    function renderCalendar(month, year) {
        calendarMonthYear.textContent = `${months[month]} ${year}`;
        
        // Remove previous days (leaving headers)
        const dayElements = calendarGridContainer.querySelectorAll('.calendar-day, .calendar-day-empty');
        dayElements.forEach(el => el.remove());

        // First day of the month
        const firstDayIndex = new Date(year, month, 1).getDay();
        
        // Number of days in the month
        const totalDays = new Date(year, month + 1, 0).getDate();
        
        // Previous month padding days
        const prevMonthTotalDays = new Date(year, month, 0).getDate();

        // Render previous month padding
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day calendar-day-other';
            dayDiv.textContent = prevMonthTotalDays - i;
            calendarGridContainer.appendChild(dayDiv);
        }

        // Render current month days
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        for (let day = 1; day <= totalDays; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';

            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events[dateKey] || [];

            dayDiv.innerHTML = `<span class="calendar-day-number">${day}</span>`;

            if (dayEvents.length > 0) {
                dayDiv.classList.add('calendar-day-event');

                const sortedEvents = [...dayEvents].sort((a, b) => {
                    if (!a.time) return 1;
                    if (!b.time) return -1;
                    return a.time.localeCompare(b.time);
                });

                const preview = document.createElement('div');
                preview.className = 'calendar-event-preview';

                const previewItems = sortedEvents.slice(0, 3).map((eventItem) => {
                    let previewTime = 'All Day';
                    if (eventItem.time) {
                        const [h, m] = eventItem.time.split(':');
                        const hourNum = parseInt(h, 10);
                        const ampm = hourNum >= 12 ? 'PM' : 'AM';
                        const formattedHour = hourNum % 12 || 12;
                        previewTime = `${formattedHour}:${m} ${ampm}`;
                    }

                    return `
                        <span class="calendar-event-line">
                            <span class="calendar-event-time">${escapeHTML(previewTime)}</span>
                            <span class="calendar-event-title">${escapeHTML(eventItem.title)}</span>
                        </span>
                    `;
                }).join('');

                preview.innerHTML = `
                    ${previewItems}
                    ${sortedEvents.length > 3 ? `<span class="calendar-event-more">+${sortedEvents.length - 3} more</span>` : ''}
                `;
                dayDiv.appendChild(preview);
            }

                    updateAlarmControlButtons();
            // Highlight today
            if (isCurrentMonth && today.getDate() === day) {
                dayDiv.classList.add('calendar-day-today');
            }

            // Click listener to add/view events
            dayDiv.addEventListener('click', () => {
                openEventModal(day, month, year, dateKey);
            });

            calendarGridContainer.appendChild(dayDiv);
        }

        // Render next month padding
        const totalGridSlots = firstDayIndex + totalDays;
        const remainingSlots = (7 - (totalGridSlots % 7)) % 7;
        
        for (let i = 1; i <= remainingSlots; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day calendar-day-other';
            dayDiv.textContent = i;
            calendarGridContainer.appendChild(dayDiv);
        }
    }

    function formatEventTime(timeValue) {
        if (!timeValue) return 'All Day';
        const [h, m] = timeValue.split(':');
        const hourNum = parseInt(h, 10);
        if (Number.isNaN(hourNum)) return 'All Day';
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const formattedHour = hourNum % 12 || 12;
        return `${formattedHour}:${m} ${ampm}`;
    }

    function renderTodayEventsSummary(date = new Date()) {
        if (!txtTodayEvents) return;

        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const todayEvents = events[dateKey] || [];

        if (todayEvents.length === 0) {
            txtTodayEvents.textContent = 'No events today.';
            return;
        }

        const sortedEvents = [...todayEvents].sort((a, b) => {
            if (!a.time) return 1;
            if (!b.time) return -1;
            return a.time.localeCompare(b.time);
        });

        const formatPreviewTitle = (title, maxLength = 24) => {
            const compact = String(title || '').replace(/\s+/g, ' ').trim();
            if (compact.length <= maxLength) {
                return compact;
            }
            return `${compact.slice(0, maxLength - 1)}...`;
        };

        const maxPreviewEvents = 4;
        const previewLines = sortedEvents.slice(0, maxPreviewEvents).map((eventItem) => {
            const eventTime = formatEventTime(eventItem.time);
            return `${eventTime} - ${formatPreviewTitle(eventItem.title)}`;
        });

        if (sortedEvents.length > maxPreviewEvents) {
            previewLines.push(`+${sortedEvents.length - maxPreviewEvents} more events`);
        }
        txtTodayEvents.textContent = previewLines.join('\n');
    }

    // Navigation events
    btnPrevMonth.addEventListener('click', () => {
        calendarMonth--;
        if (calendarMonth < 0) {
            calendarMonth = 11;
            calendarYear--;
        }
        renderCalendar(calendarMonth, calendarYear);
    });

    btnNextMonth.addEventListener('click', () => {
        calendarMonth++;
        if (calendarMonth > 11) {
            calendarMonth = 0;
            calendarYear++;
        }
        renderCalendar(calendarMonth, calendarYear);
    });

    // Initialize calendar
    renderCalendar(calendarMonth, calendarYear);
    renderTodayEventsSummary();

    if (btnOpenCalendar && calendarOverlay) {
        btnOpenCalendar.addEventListener('click', () => {
            calendarOverlay.classList.remove('hidden');
        });
    }

    if (btnCloseCalendar && calendarOverlay) {
        btnCloseCalendar.addEventListener('click', () => {
            calendarOverlay.classList.add('hidden');
        });
    }

    if (calendarOverlay) {
        calendarOverlay.addEventListener('click', (e) => {
            if (e.target === calendarOverlay) {
                calendarOverlay.classList.add('hidden');
            }
        });
    }

    if (btnOpenAlarm) {
        btnOpenAlarm.addEventListener('click', () => {
            primeAlarmAudio();
            if (alarmTimeInput) {
                alarmTimeInput.value = alarmState.time || '';
            }
            updateAlarmStatusText();
            openAlarmOverlay();
        });
    }

    if (btnCloseAlarm) {
        btnCloseAlarm.addEventListener('click', closeAlarmOverlay);
    }

    if (alarmOverlay) {
        alarmOverlay.addEventListener('click', (e) => {
            if (e.target === alarmOverlay) {
                closeAlarmOverlay();
            }
        });
    }

    if (alarmForm) {
        alarmForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!alarmTimeInput || !alarmTimeInput.value) return;

            alarmState.time = alarmTimeInput.value;
            alarmState.enabled = true;
            alarmState.snoozeUntil = '';
            alarmState.nextTriggerAt = computeNextTriggerAt(alarmState.time, new Date());
            saveAlarmState();
            updateAlarmStatusText();
            closeAlarmOverlay();
        });
    }

    function openNativeTimePicker(inputEl) {
        if (!inputEl) return;

        if (typeof inputEl.showPicker === 'function') {
            inputEl.showPicker();
            return;
        }

        inputEl.focus();
        inputEl.click();
    }

    if (btnPickAlarmTime) {
        btnPickAlarmTime.addEventListener('click', () => {
            openNativeTimePicker(alarmTimeInput);
        });
    }

    if (btnPickEventTime) {
        btnPickEventTime.addEventListener('click', () => {
            openNativeTimePicker(eventTimeInput);
        });
    }

    if (btnDisableAlarm) {
        btnDisableAlarm.addEventListener('click', () => {
            alarmState.enabled = false;
            alarmState.time = '';
            alarmState.lastTriggeredDate = '';
            alarmState.snoozeUntil = '';
            alarmState.nextTriggerAt = '';
            if (alarmTimeInput) {
                alarmTimeInput.value = '';
            }
            saveAlarmState();
            updateAlarmStatusText();
            setAlarmRingingState(false);
            stopAlarmPlayback();
            closeAlarmOverlay();
        });
    }

    if (btnAlarmStop) {
        btnAlarmStop.addEventListener('click', () => {
            setAlarmRingingState(false);
            stopAlarmPlayback();
            closeAlarmOverlay();
        });
    }

    if (btnAlarmSnooze) {
        btnAlarmSnooze.addEventListener('click', () => {
            const now = new Date();
            let snoozeBase = now;

            if (alarmState.nextTriggerAt) {
                const scheduled = new Date(alarmState.nextTriggerAt);
                if (!Number.isNaN(scheduled.getTime()) && scheduled.getTime() > now.getTime()) {
                    snoozeBase = scheduled;
                }
            }

            const nextSnooze = new Date(snoozeBase.getTime() + 5 * 60 * 1000);
            alarmState.enabled = true;
            alarmState.snoozeUntil = nextSnooze.toISOString();
            alarmState.nextTriggerAt = alarmState.snoozeUntil;
            saveAlarmState();
            updateAlarmStatusText();
            setAlarmRingingState(false);
            stopAlarmPlayback();
            closeAlarmOverlay();
        });
    }


    // ==========================================
    // Event Management Logic (Modal & localStorage)
    // ==========================================
    function openEventModal(day, month, year, dateKey) {
        selectedDateKey = dateKey;
        
        const dateObj = new Date(year, month, day);
        modalDateTitle.textContent = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        renderEventsList();
        eventModal.classList.remove('hidden');
    }

    function renderEventsList() {
        eventsList.innerHTML = '';
        const dayEvents = events[selectedDateKey] || [];

        if (dayEvents.length === 0) {
            eventsList.innerHTML = `<li class="no-events-placeholder">No magical events cast for this day...</li>`;
            return;
        }

        // Sort events by time
        const sortedEvents = [...dayEvents].sort((a, b) => {
            if (!a.time) return 1;
            if (!b.time) return -1;
            return a.time.localeCompare(b.time);
        });

        sortedEvents.forEach(evt => {
            const li = document.createElement('li');
            li.className = 'event-item';

            // Format time display
            let timeDisplay = 'All Day';
            if (evt.time) {
                const [h, m] = evt.time.split(':');
                const hourNum = parseInt(h);
                const ampm = hourNum >= 12 ? 'PM' : 'AM';
                const formattedHour = hourNum % 12 || 12;
                timeDisplay = `${formattedHour}:${m} ${ampm}`;
            }

            li.innerHTML = `
                <div class="event-item-details">
                    <span class="event-item-text">${escapeHTML(evt.title)}</span>
                    <span class="event-item-time"><i data-lucide="clock"></i> ${timeDisplay}</span>
                </div>
                <button class="btn-delete-event" aria-label="Vanish Event">
                    <i data-lucide="trash-2"></i>
                </button>
            `;

            // Delete event action
            li.querySelector('.btn-delete-event').addEventListener('click', () => {
                deleteEvent(evt.id);
            });

            eventsList.appendChild(li);
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function deleteEvent(id) {
        if (!events[selectedDateKey]) return;

        events[selectedDateKey] = events[selectedDateKey].filter(evt => evt.id !== id);
        if (events[selectedDateKey].length === 0) {
            delete events[selectedDateKey];
        }

        localStorage.setItem('wizard_kiosk_events', JSON.stringify(events));
        renderEventsList();
        renderCalendar(calendarMonth, calendarYear);
        renderTodayEventsSummary();
    }

    // Cast Event Form Submit
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = eventTitleInput.value.trim();
        const time = eventTimeInput.value;

        if (!title) return;

        if (!events[selectedDateKey]) {
            events[selectedDateKey] = [];
        }

        events[selectedDateKey].push({
            id: Date.now().toString(),
            title: title,
            time: time
        });

        localStorage.setItem('wizard_kiosk_events', JSON.stringify(events));
        
        // Reset and refresh
        eventTitleInput.value = '';
        eventTimeInput.value = '';
        renderEventsList();
        renderCalendar(calendarMonth, calendarYear);
        renderTodayEventsSummary();
        eventModal.classList.add('hidden');
    });

    // Close Modal Events
    btnCloseModal.addEventListener('click', () => {
        eventModal.classList.add('hidden');
    });

    eventModal.addEventListener('click', (e) => {
        if (e.target === eventModal) {
            eventModal.classList.add('hidden');
        }
    });


    // ==========================================
    // Weather Fetching & Theme Mapping
    // ==========================================
    async function fetchWeather() {
        refreshBadge.classList.add('updating');
        
        try {
            const response = await fetch(WEATHER_URL);
            if (!response.ok) throw new Error('Skies scrying failed');
            const data = await response.json();
            
            updateWeatherUI(data);
            
            // Hide loading screen
            if (loader && !loader.classList.contains('fade-out')) {
                loader.classList.add('fade-out');
            }
        } catch (error) {
            console.error('Spells failed to scry weather:', error);
            txtWeatherDesc.textContent = 'Astral Blocks';
            
            // Fade out loader on error after delay
            setTimeout(() => {
                if (loader && !loader.classList.contains('fade-out')) {
                    loader.classList.add('fade-out');
                }
            }, 3000);
        } finally {
            refreshBadge.classList.remove('updating');
        }
    }

    function updateWeatherUI(data) {
        const current = data.current;
        const daily = data.daily;
        lastWeatherData = data;
        
        const temp = Math.round(current.temperature_2m);
        const apparentTemp = Math.round(current.apparent_temperature);
        const code = current.weather_code;
        const humidity = current.relative_humidity_2m;
        const wind = Math.round(current.wind_speed_10m);
        const precipitation = current.precipitation.toFixed(1);
        const isDay = current.is_day;

        // Resolve code mapping
        const codeMapping = weatherCodes[code] || { label: 'Unknown Magic', icon: 'help-circle', theme: 'cloudy' };
        
        let label = codeMapping.label;
        let iconName = codeMapping.icon;
        let themeName = codeMapping.theme;

        // Adjust for night themes
        if (isDay === 0) {
            if (codeMapping.nightIcon) iconName = codeMapping.nightIcon;
            if (codeMapping.nightTheme) themeName = codeMapping.nightTheme;
        }

        // Set weather text and values
        txtCurrentTemp.textContent = temp;
        txtWeatherDesc.textContent = label;
        txtFeelsLike.textContent = `Apparent Conjuring ${apparentTemp}°C`;
        txtHumidity.textContent = `${humidity}%`;
        txtWind.textContent = `${wind} km/h`;
        txtPrecipitation.textContent = `${precipitation} mm`;

        // House selection is randomized per day but stable during the same day.
        const activeHouse = getDailyRandomHouse(new Date());
        const houseTheme = activeHouse === 'gryffindor' ? 'sunny' : 'rainy';
        const themeClasses = ['theme-sunny', 'theme-cloudy', 'theme-rainy', 'theme-snowy', 'theme-stormy', 'theme-night'];
        document.body.classList.remove(...themeClasses);
        document.body.classList.add(`theme-${houseTheme}`);
        applyHouseVisuals(activeHouse);

        // Update main icon
        weatherMainIcon.innerHTML = `<i data-lucide="${iconName}"></i>`;

        // Update last updated timestamp
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        txtLastUpdate.textContent = `Scryed at ${timeString}`;

        renderForecast(data, forecastMode);

        // Re-run Lucide dynamic replacement
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }


    // ==========================================
    // Daily Revelations Logic (Quote / Riddle / Joke)
    // ==========================================
    const txtDailyQuote = document.getElementById('txt-daily-quote');
    const txtDailyQuoteAuthor = document.getElementById('txt-daily-quote-author');
    const txtDailyRiddle = document.getElementById('txt-daily-riddle');
    const btnRiddleReveal = document.getElementById('btn-riddle-reveal');
    const txtDailyJoke = document.getElementById('txt-daily-joke');
    const txtDailyJokeAnswer = document.getElementById('txt-daily-joke-answer');
    const btnJokeReveal = document.getElementById('btn-joke-reveal');
    let currentRiddleAnswer = '';
    let currentJokeAnswer = '';

    const fallbackDailyQuotes = [
        { text: 'Courage grows when you choose your friends over your fear.', author: 'Filix\'s Notes' },
        { text: 'The sea never gives easy answers, but it rewards brave hearts.', author: 'Filix\'s Notes' },
        { text: 'Truth often hides in the places pride refuses to look.', author: 'Filix\'s Notes' },
        { text: 'Magic is strongest when it protects, not when it boasts.', author: 'Filix\'s Notes' },
        { text: 'Even in chaos, loyalty can become your compass.', author: 'Filix\'s Notes' },
        { text: 'A kind choice can outshine the loudest power.', author: 'Filix\'s Notes' },
        { text: 'Hope sounds quiet, but it can still move mountains.', author: 'Filix\'s Notes' },
        { text: 'Legends are written by those who keep moving through storms.', author: 'Filix\'s Notes' },
        { text: 'Wisdom is knowing when to listen to the heart before the crowd.', author: 'Filix\'s Notes' }
    ];
    let dailyQuotes = [...fallbackDailyQuotes];

    async function loadDailyQuotesFromJson() {
        try {
            const response = await fetch('quotes/harry_potter_quotes.json', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Quote file request failed: ${response.status}`);
            }

            const rawQuotes = await response.json();
            if (!Array.isArray(rawQuotes)) {
                throw new Error('Quote file does not contain an array');
            }

            const parsedQuotes = rawQuotes
                .map((item) => {
                    const text = typeof item.quote === 'string' ? item.quote.trim() : '';
                    const speaker = typeof item.speaker === 'string' ? item.speaker.trim() : '';

                    if (!text) {
                        return null;
                    }

                    return {
                        text,
                        author: speaker || 'Filix\'s Notes'
                    };
                })
                .filter(Boolean);

            if (parsedQuotes.length > 0) {
                dailyQuotes = parsedQuotes;
            }
        } catch (error) {
            console.warn('Using fallback daily quotes:', error);
        }
    }

    const dailyRiddles = [
        {
            question: 'I am lighter than air, but no one can hold me for long. What am I?',
            answer: 'A breath.'
        },
        {
            question: 'I speak without a mouth and answer without ears. What am I?',
            answer: 'An echo.'
        },
        {
            question: 'The more of me you remove, the bigger I become. What am I?',
            answer: 'A hole.'
        },
        {
            question: 'I have many keys but open no doors. What am I?',
            answer: 'A piano.'
        },
        {
            question: 'I run forever but never move. What am I?',
            answer: 'Time.'
        },
        {
            question: 'I can fill a room but take up no space. What am I?',
            answer: 'Light.'
        },
        {
            question: 'You can keep me only after giving me away. What am I?',
            answer: 'Your word.'
        },
        {
            question: 'I am tall when I am young and short when I am old. What am I?',
            answer: 'A candle.'
        },
        {
            question: 'What has a head and a tail but no body?',
            answer: 'A coin.'
        },
        {
            question: 'I have four legs and a tail, and I love to say woof. What am I?',
            answer: 'A dog.'
        },
        {
            question: 'I am yellow, I peel, and monkeys love me. What am I?',
            answer: 'A banana.'
        },
        {
            question: 'I hop on lily pads and catch flies with my tongue. What am I?',
            answer: 'A frog.'
        },
        {
            question: 'You wear me on your feet, and I always come in pairs. What am I?',
            answer: 'Shoes.'
        },
        {
            question: 'I have a trunk, but I am not a tree. I have big ears and I never forget. What am I?',
            answer: 'An elephant.'
        },
        {
            question: 'What is full of holes but still holds water?',
            answer: 'A sponge.'
        },
        {
            question: 'What gets wetter as it dries?',
            answer: 'A towel.'
        },
        {
            question: 'What has to be broken before you can use it?',
            answer: 'An egg.'
        },
        {
            question: 'What comes down but never goes up?',
            answer: 'Rain.'
        },
        {
            question: 'What has legs but cannot walk?',
            answer: 'A table.'
        },
        {
            question: 'What has ears but cannot hear?',
            answer: 'A cornfield.'
        },
        {
            question: 'What has a thumb and four fingers but is not alive?',
            answer: 'A glove.'
        },
        {
            question: 'What has a neck but no head?',
            answer: 'A bottle.'
        },
        {
            question: 'What can travel around the world while staying in a corner?',
            answer: 'A stamp.'
        },
        {
            question: 'What has words but never speaks?',
            answer: 'A book.'
        },
        {
            question: 'I have a shell and I carry my home. I move very slowly wherever I roam. What am I?',
            answer: 'A snail.'
        },
        {
            question: 'I shine in the sky each night alongside millions of others. What am I?',
            answer: 'A star.'
        },
        {
            question: 'I am cold, I am sweet, and kids love to lick me. What am I?',
            answer: 'Ice cream.'
        },
        {
            question: 'I have wings, but I am not a bird. I have a stinger, and I make honey. What am I?',
            answer: 'A bee.'
        },
        {
            question: 'I am orange, I grow underground, and rabbits love to munch on me. What am I?',
            answer: 'A carrot.'
        },
        {
            question: 'What has hands but cannot clap?',
            answer: 'A clock.'
        },
        {
            question: 'Everyone has me, but no one can lose me. What am I?',
            answer: 'A shadow.'
        },
        {
            question: 'I bounce, I roll, and kids kick me through a goal. What am I?',
            answer: 'A ball.'
        },
        {
            question: 'The more you take, the more you leave behind. What am I?',
            answer: 'Footsteps.'
        },
        {
            question: 'What is so delicate that saying its name breaks it?',
            answer: 'Silence.'
        },
        {
            question: 'What is always before you but cannot be seen?',
            answer: 'The future.'
        },
        {
            question: 'What has a face and two hands but no arms or legs?',
            answer: 'A clock.'
        },
        {
            question: 'What can run but never walks, has a mouth but never talks, has a head but never weeps, and has a bed but never sleeps?',
            answer: 'A river.'
        },
        {
            question: 'What has cities but no houses, forests and trees, but no water?',
            answer: 'A map.'
        },
        {
            question: 'What has one eye but cannot see?',
            answer: 'A needle.'
        },
        {
            question: 'What can you break without touching it?',
            answer: 'A promise.'
        },
        {
            question: 'I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?',
            answer: 'An echo.'
        },
        {
                question: 'If you drop me, I am sure to crack, but give me a smile and I will always smile back. What am I?',
                answer: 'A mirror.'
        },
        {
            question: 'I am not alive, but I grow. I do not have lungs, but I need air. What am I?',
            answer: 'Fire.'
        },
        {
            question: 'The more you remove from me, the bigger I get. What am I?',
            answer: 'A hole',
        },
        {
            question: 'The more you have of me, the less you see. What am I?',
            answer: 'Darkness.'
        },
        {
            question: 'I go up but never come down, except when I fall. What am I?',
            answer: 'A balloon.'
        },
        {
            question: 'What starts out tall but gets shorter the more you use it?',
            answer: 'A pencil.'
        },
        {
            question: 'What begins with an E, ends with an E, but only contains one letter?',
            answer: 'An envelope.'
        },
        {
            question: 'What kind of bow cannot be tied?',
            answer: 'A rainbow.'
        },
        {
            question: 'What can you hear but never touch or see?',
            answer: 'Sound.'
        },
        {
            question: 'What has four legs and a back but cannot walk?',
            answer: 'A chair.'
        },
        {
            question: 'What has a tongue but cannot taste, eyes but cannot see, and a sole but cannot think?',
            answer: 'A shoe.'
        },
        {
            question: 'What has teeth but cannot bite?',
            answer: 'A comb.'
        },
        {
            question: 'What has many keys but cannot open a single door?',
            answer: 'A piano.'
        },
        {
            question: 'What has one head, one foot, and four legs?',
            answer: 'A bed.'
        },
        {
            question: 'What can fill a room but takes up no space?',
            answer: 'Light.'
        },
        {
            question: 'What belongs to you but others use it more than you do?',
            answer: 'Your name.'
        },
        {
            question: 'What goes up but never comes down?',
            answer: 'Your age.'
        },
        {
            question: 'What gets sharper the more you use it?',
            answer: 'Your brain.'
        },
        {
            question: 'What can you hold in your left hand but not in your right?',
            answer: 'Your right elbow.'
        },
        {
            question: 'What cannot be used until it is broken?',
            answer: 'A glow stick.'
        },
        {
            question: 'What can you catch but not throw?',
            answer: 'A cold.'
        },
        {
            question: 'What can be cracked, made, told, and played?',
            answer: 'A joke.'
        },
        {
            question: 'What kind of room has no doors or windows?',
            answer: 'A mushroom.'
        },
        {
            question: 'What kind of table can you eat?',
            answer: 'A vegetable.'
        },
        {
            question: 'What starts with a P, ends with an E, and has thousands of letters?',
            answer: 'A post office.'
        },
        {
            question: 'What has thirteen hearts but no other organs?',
            answer: 'A deck of cards.'
        },
        {
            question: 'What has rings but no fingers?',
            answer: 'Saturn.'
        },
        {
            question: 'What kind of coat is always wet when you put it on?',
            answer: 'A coat of paint.'
        },
        {
            question: 'How many months of the year have 28 days?',
            answer: 'All of them.'
        },
        {
            question: 'What falls but never lands?',
            answer: 'Nightfall.'
        },
        {
            question: 'What runs all around a backyard but never moves?',
            answer: 'A fence.'
        },
        {
            question: 'What can you serve but never eat?',
            answer: 'A tennis ball.'
        },
        {
            question: 'What letter comes at the very end of Thanksgiving?',
            answer: 'The letter G.'
        }
    ];

    const dailyJokes = [
        {
            question: 'What were prehistoric sleepovers called?',
            answer: 'Dino-SNORES.'
        },
        {
            question: 'What’s a bee’s favorite musical?',
            answer: 'Stinging in the Rain.'
        },
        {
            question: 'What kind of cow wears a crown?',
            answer: 'A dairy queen.'
        },
        {
            question: 'What do turkeys like to eat for dessert?',
            answer: 'Apple Gobbler.'
        },
        {
            question: 'Why do storks have so little money?',
            answer: 'They have such big bills.'
        },
        {
            question: 'Which reptile always knows what time it is?',
            answer: 'A grandfather croc.'
        },
        {
            question: 'Are the moon and Earth good friends?',
            answer: 'Yes, they’ve been going around together for years.'
        },
        {
            question: 'Can a horse join the army?',
            answer: 'No, the Neigh-vy.'
        },
        {
            question: 'Can bees fly in the rain?',
            answer: 'Not without their little yellow jackets.'
        },
        {
            question: 'Can you buy a ticket today for a trip to the moon?',
            answer: 'No, sorry. The moon is full right now.'
        },
        {
            question: 'Did you hear the story about the skunk?',
            answer: 'Never mind–it stinks.'
        },
        {
            question: 'How are migrating birds different from flies?',
            answer: 'Birds fly, but flies don’t bird.'
        },
        {
            question: 'How can you make your money go far?',
            answer: 'Put your piggy bank in outer space.'
        },
        {
            question: 'How can you tell if a bee is talking on a cell phone?',
            answer: 'You get a buzzy signal.'
        },
        {
            question: 'How can you tell which end of a worm is the head?',
            answer: 'Tickle it in the middle, see which end laughs.'
        },
        {
            question: 'How can you tell worms from spaghetti?',
            answer: 'Worms can hang on to your fork.'
        },
        {
            question: 'How come frogs are such good liars?',
            answer: 'Because they’re amFIBians.'
        },
        {
            question: 'How did one calf finish his math problems faster than the other calves?',
            answer: 'It used a COW-culator.'
        },
        {
            question: 'How did the duck get rid of its headache?',
            answer: 'With quack-upuncture.'
        },
        {
            question: 'How did the farmer count his herd of cattle?',
            answer: 'He used a COWculator.'
        },
        {
            question: 'How did the frog cross the road?',
            answer: 'Its cousin toad it.'
        },
        {
            question: 'How did the hammerhead shark do on his math test?',
            answer: 'He nailed it.'
        },
        {
            question: 'How did the horse get a soda?',
            answer: 'He gave the vending machine a buck.'
        },
        {
            question: 'How did the snake escape from jail?',
            answer: 'It scaled the wall.'
        },
        {
            question: 'How do baby geese get out of their shells?',
            answer: 'They follow eggs-it signs.'
        },
        {
            question: 'How do birds fly in the rain?',
            answer: 'They use wing shield wipers.'
        },
        {
            question: 'How do birds keep in shape?',
            answer: 'They do a lot of eggs-ercises.'
        },
        {
            question: 'How do bulls pay for their groceries?',
            answer: 'They charge them.'
        },
        {
            question: 'How do cats keep their breath fresh?',
            answer: 'They use mouse wash.'
        },
        {
            question: 'How do chickens keep in shape?',
            answer: 'They do lots of EGGSercises.'
        },
        {
            question: 'How do cows find their way home?',
            answer: 'They follow the Milky Way.'
        },
        {
            question: 'How do deer keep their coats looking good?',
            answer: 'They use pine combs.'
        },
        {
            question: 'How do dentists fix dragon teeth?',
            answer: 'With a fire drill.'
        },
        {
            question: 'How do dolphins make important decisions?',
            answer: 'They flipper a coin.'
        },
        {
            question: 'How do elephants communicate with each other?',
            answer: 'By elephone.'
        },
        {
            question: 'How do fish start their fairy tales?',
            answer: 'Once upon a SLIME.'
        },
        {
            question: 'How do fleas travel?',
            answer: 'They itch hike.'
        },
        {
            question: 'How do ghosts greet each other on New Year’s Day?',
            answer: '“Happy Boo Year!”'
        },
        {
            question: 'How do groups of whales listen to music?',
            answer: 'They use their i-PODS.'
        },
        {
            question: 'How do jackrabbits keep cool in the dessert?',
            answer: 'The use ear-conditioning.'
        },
        {
            question: 'How do monkeys go downstairs?',
            answer: 'They slide down the banana-ster.'
        },
        {
            question: 'How do ocean creatures cross the ocean?',
            answer: 'By taxi crab.'
        },
        {
            question: 'How do porcupines communicate?',
            answer: 'Through spine language.'
        },
        {
            question: 'How do porcupines hug and kiss?',
            answer: 'Very carefully.'
        },
        {
            question: 'How do porcupines play leapfrog?',
            answer: 'Very carefully.'
        },
        {
            question: 'How do rabbits keep in shape?',
            answer: 'They do HARErobics.'
        },
        {
            question: 'How do rabbits travel?',
            answer: 'In HARE-planes.'
        },
        {
            question: 'How do robins find their way to their nesting places?',
            answer: 'They follow the “egg-sit” signs.'
        },
        {
            question: 'How do robins start their exercise routine?',
            answer: 'With worm-ups.'
        },
        {
            question: 'How do skeletons send their mail?',
            answer: 'By bony express.'
        },
        {
            question: 'How do slugs get up mountains?',
            answer: 'They slime to the top.'
        },
        {
            question: 'How do snails get their shells all shiny and clean?',
            answer: 'They use snail polish.'
        },
        {
            question: 'How do snails greet each other?',
            answer: '“Long slime, no see.”'
        },
        {
            question: 'How do snails start their fairy tales?',
            answer: 'Once upon a slime.'
        },
        {
            question: 'How do snakes sign their letters?',
            answer: 'With hugs and hisses.'
        },
        {
            question: 'How do termites travel?',
            answer: 'By chew-chew train.'
        },
        {
            question: 'How do turkeys wake their friends on Thanksgiving morning?',
            answer: 'With alarm clucks.'
        },
        {
            question: 'How do tyrannosaurs like their eggs?',
            answer: 'Terri-fried!'
        },
        {
            question: 'How do wasps communicate?',
            answer: 'Through bee-mail.'
        },
        {
            question: 'How do weeping willows remove splinters?',
            answer: 'With tree-zers.'
        },
        {
            question: 'How do you divide an ocean in half?',
            answer: 'Use a sea saw.'
        },
        {
            question: 'How do you find a cheetah at night?',
            answer: 'Use a spotlight.'
        },
        {
            question: 'How do you find your mosquito bites?',
            answer: 'Start from scratch.'
        },
        {
            question: 'How do you fix a smashed jack-o’-lantern?',
            answer: 'With a pumpkin patch.'
        },
        {
            question: 'How do you get a baby astronaut to sleep?',
            answer: 'You rock-it.'
        },
        {
            question: 'How do you get a frog off your back car window?',
            answer: 'Use a rear-window defrogger.'
        },
        {
            question: 'How do you keep a buffalo from charging?',
            answer: 'Take away its credit card.'
        },
        {
            question: 'How do you keep a dragon from going through the eye of a needle?',
            answer: 'Tie a knot in its tail.'
        },
        {
            question: 'How do you keep a stinky salmon from smelling?',
            answer: 'Hold its nose.'
        },
        {
            question: 'How do you know when a bee is talking on the phone?',
            answer: 'You hear a buzzy signal.'
        },
        {
            question: 'How do you know when a fish is playing hooky?',
            answer: 'When it’s not in a school.'
        },
        {
            question: 'How do you know when a vampire bat is sick?',
            answer: 'It can’t stop coffin.'
        },
        {
            question: 'How do you know when a vampire is deathly sick?',
            answer: 'It can’t stop coffin.'
        },
        {
            question: 'How do you make a skeleton laugh?',
            answer: 'Tickle its funny bone.'
        },
        {
            question: 'How do you make a whale float?',
            answer: 'Two scoops of ice cream, root beer, and a whale.'
        },
        {
            question: 'How do you make a witch itch?',
            answer: 'Take out the “W”.'
        },
        {
            question: 'How do you make friends with a squirrel?',
            answer: 'Climb a tree and act like a nut.'
        },
        {
            question: 'How do you milk an ant?',
            answer: 'First you get a really low stool.'
        },
        {
            question: 'How do you read a book about plants?',
            answer: 'You leaf through it.'
        },
        {
            question: 'How do you say goodbye to a sick alligator?',
            answer: '“See you later, illigator.”'
        },
        {
            question: 'How do you spell mouse trap with 3 letters?',
            answer: 'C-A-T.'
        },
        {
            question: 'How do you stop a stinky fish from smelling?',
            answer: 'Hold its nose.'
        },
        {
            question: 'How do young deer call each other?',
            answer: 'They use a tell-a-fawn.'
        },
        {
            question: 'How does a cat succeed in life?',
            answer: 'Through purr-sistence.'
        },
        {
            question: 'How does a dolphin make bread?',
            answer: 'With All-Porpoise Flour.'
        },
        {
            question: 'How does a dolphin wash its flippers?',
            answer: 'With an all-porpoise cleaner.'
        },
        {
            question: 'How does a firefly start a race?',
            answer: 'Ready, set, glow!'
        },
        {
            question: 'How does a fish feel when it gets caught stealing bait?',
            answer: 'Gill-ty.'
        },
        {
            question: 'How does a flower ride a bike?',
            answer: 'With its petals.'
        },
        {
            question: 'How does a lion like its steak?',
            answer: 'Medium-roar.'
        },
        {
            question: 'How does a mother kangaroo tell time?',
            answer: 'With her pocket watch.'
        },
        {
            question: 'How does a mountain goat mom call her baby?',
            answer: '“Here, kiddie, kiddie!”'
        },
        {
            question: 'How does a mouse disguise himself?',
            answer: 'He wears a mousetache.'
        },
        {
            question: 'How does a mouse feel after a bath?',
            answer: 'Squeaky clean.'
        },
        {
            question: 'How does a penguin feel after its friend moves away?',
            answer: 'Ice-olated.'
        },
        {
            question: 'How does a skunk put out a fire?',
            answer: 'It uses an ex-stink-guisher.'
        },
        {
            question: 'How does a slug go fishing?',
            answer: 'On a snail boat.'
        },
        {
            question: 'How does a sponge spend its free time?',
            answer: 'It soaks up some fun.'
        },
        {
            question: 'How does a tree get into the Internet?',
            answer: 'It logs on.'
        },
        {
            question: 'How does a turtle call its friends?',
            answer: 'With a shell phone.'
        },
        {
            question: 'How does a turtle get to the top floor?',
            answer: 'In a shell-evator.'
        },
        {
            question: 'How does an octopus pay its bills?',
            answer: 'With sand dollars.'
        },
        {
            question: 'How does the ocean say hello?',
            answer: 'It waves.'
        },
        {
            question: 'How is a wall light switch like a penguin?',
            answer: 'They both have flippers.'
        },
        {
            question: 'How many birds can sing a duet?',
            answer: 'Toucan.'
        },
        {
            question: 'How many cockroaches does it take to screw in a light bulb?',
            answer: 'Can’t tell. They scatter as soon as the light turns on.'
        },
        {
            question: 'How many frogs would fit in your glass of water?',
            answer: 'Toadily too many.'
        },
        {
            question: 'How many mice can an owl eat?',
            answer: 'OWL of them!'
        },
        {
            question: 'How many skunks live in a neighborhood?',
            answer: 'Quite a phew.'
        },
        {
            question: 'How much does a pile of bones weigh?',
            answer: 'A skele-TON.'
        },
        {
            question: 'How much seafood does a crab eat?',
            answer: 'Just a pinch.'
        },
        {
            question: 'In an emergency whom do you call for a sick rabbit?',
            answer: 'A hare-a-medic.'
        },
        {
            question: 'Is chicken soup good for you?',
            answer: 'Not if you’re the chicken!'
        },
        {
            question: 'Is turkey soup good for you?',
            answer: 'Not if you’re the turkey!'
        },
        {
            question: 'What part of a salmon weighs the most?',
            answer: 'Its scales.'
        },
        {
            question: 'What’s brown and white and dangerous?',
            answer: 'A cow on a skateboard.'
        },
        {
            question: 'What do you call a sleeping male cow?',
            answer: 'A Bulldozer.'
        },
        {
            question: 'What ancient cat solved mysteries?',
            answer: 'The saber SLEUTH tiger.'
        },
        {
            question: 'What animal can you find in the military?',
            answer: 'An army-dillo.'
        },
        {
            question: 'What animal hibernates while standing on its head?',
            answer: 'Yoga bear.'
        },
        {
            question: 'What animal sewed the first American flag?',
            answer: 'Bat-sy Ross.'
        },
        {
            question: 'What’s an aardvark’s favorite pizza topping?',
            answer: 'Ant-chovies.'
        },
        {
            question: 'What’s smarter than a talking parrot?',
            answer: 'A spelling bee.'
        },
        {
            question: 'What does a lemur pirate say?',
            answer: '“Aye-aye, matey!”'
        },
        {
            question: 'What makes a jellyfish laugh?',
            answer: 'Ten tickles.'
        },
        {
            question: 'What do you get when you cross a chicken with a skunk?',
            answer: 'A fowl smell.'
        },
        {
            question: 'Are the moon and Earth good friends?',
            answer: 'Yes, they’ve been going around together for years.'
        },
        {
            question: 'Can a horse join the army?',
            answer: 'No, the Neigh-vy.'
        },
        {
            question: 'Can bees fly in the rain?',
            answer: 'Not without their little yellow jackets.'
        },
        {
            question: 'Can you buy a ticket today for a trip to the moon?',
            answer: 'No, sorry. The moon is full right now.'
        },
        {
            question: 'Did you hear the story about the skunk?',
            answer: 'Never mind–it stinks.'
        },
        {
            question: 'How are migrating birds different from flies?',
            answer: 'Birds fly, but flies don’t bird.'
        },
        {
            question: 'How can you make your money go far?',
            answer: 'Put your piggy bank in outer space.'
        },
        {
            question: 'How can you tell if a bee is talking on a cell phone?',
            answer: 'You get a buzzy signal.'
        },
        {
            question: 'How can you tell which end of a worm is the head?',
            answer: 'Tickle it in the middle, see which end laughs.'
        },
        {
            question: 'How can you tell worms from spaghetti?',
            answer: 'Worms can hang on to your fork.'
        },
        {
            question: 'How come frogs are such good liars?',
            answer: 'Because they’re amFIBians.'
        },
        {
            question: 'How did one calf finish his math problems faster than the other calves?',
            answer: 'It used a COW-culator.'
        },
        {
            question: 'How did the duck get rid of its headache?',
            answer: 'With quack-upuncture.'
        },
        {
            question: 'How did the farmer count his herd of cattle?',
            answer: 'He used a COWculator.'
        },
        {
            question: 'How did the frog cross the road?',
            answer: 'Its cousin toad it.'
        },
        {
            question: 'How did the hammerhead shark do on his math test?',
            answer: 'He nailed it.'
        },
        {
            question: 'How did the horse get a soda?',
            answer: 'He gave the vending machine a buck.'
        },
        {
            question: 'How did the snake escape from jail?',
            answer: 'It scaled the wall.'
        },
        {
            question: 'How do baby geese get out of their shells?',
            answer: 'They follow eggs-it signs.'
        },
        {
            question: 'How do bees get to school?',
            answer: 'They take the school buzz.'
        },
        {
            question: 'How do birds fly in the rain?',
            answer: 'They use wing shield wipers.'
        },
        {
            question: 'How do birds keep in shape?',
            answer: 'They do a lot of eggs-ercises.'
        },
        {
            question: 'How do bulls pay for their groceries?',
            answer: 'They charge them.'
        },
        {
            question: 'How do cats keep their breath fresh?',
            answer: 'They use mouse wash.'
        },
        {
            question: 'How do cows find their way home?',
            answer: 'They follow the Milky Way.'
        },
        {
            question: 'How do deer keep their coats looking good?',
            answer: 'They use pine combs.'
        },
        {
            question: 'How do dentists fix dragon teeth?',
            answer: 'With a fire drill.'
        },
        {
            question: 'How do dolphins make important decisions?',
            answer: 'They flipper a coin.'
        },
        {
            question: 'How do elephants communicate with each other?',
            answer: 'By elephone.'
        },
        {
            question: 'How do fleas travel?',
            answer: 'They itch hike.'
        },
        {
            question: 'How do ghosts greet each other on New Year’s Day?',
            answer: '“Happy Boo Year!”'
        },
        {
            question: 'How do groups of whales listen to music?',
            answer: 'They use their i-PODS.'
        },
        {
            question: 'How do jackrabbits keep cool in the desert?',
            answer: 'They use ear-conditioning.'
        },
        {
            question: 'How do monkeys go downstairs?',
            answer: 'They slide down the banana-ster.'
        },
        {
            question: 'How do ocean creatures cross the ocean?',
            answer: 'By taxi crab.'
        },
        {
            question: 'How do porcupines communicate?',
            answer: 'Through spine language.'
        },
        {
            question: 'How do porcupines play leapfrog?',
            answer: 'Very carefully.'
        },
        {
            question: 'How do rabbits keep in shape?',
            answer: 'They do HARErobics.'
        },
        {
            question: 'How do rabbits travel?',
            answer: 'In HARE-planes.'
        },
        {
            question: 'How do robins find their way to their nesting places?',
            answer: 'They follow the “egg-sit” signs.'
        },
        {
            question: 'How do robins start their exercise routine?',
            answer: 'With worm-ups.'
        },
        {
            question: 'How do skeletons send their mail?',
            answer: 'By bony express.'
        },
        {
            question: 'How do slugs get up mountains?',
            answer: 'They slime to the top.'
        },
        {
            question: 'How do snails get their shells all shiny and clean?',
            answer: 'They use snail polish.'
        },
        {
            question: 'How do snails greet each other?',
            answer: '“Long slime, no see.”'
        },
        {
            question: 'How do snails start their fairy tales?',
            answer: 'Once upon a slime.'
        },
        {
            question: 'How do snakes sign their letters?',
            answer: 'With hugs and hisses.'
        },
        {
            question: 'How do termites travel?',
            answer: 'By chew-chew train.'
        },
        {
            question: 'How do turkeys wake their friends on Thanksgiving morning?',
            answer: 'With alarm clucks.'
        },
        {
            question: 'How do tyrannosaurs like their eggs?',
            answer: 'Terri-fried!'
        },
        {
            question: 'How do wasps communicate?',
            answer: 'Through bee-mail.'
        },
        {
            question: 'How do weeping willows remove splinters?',
            answer: 'With tree-zers.'
        },
        {
            question: 'How do you divide an ocean in half?',
            answer: 'Use a sea saw.'
        },
        {
            question: 'How do you find a cheetah at night?',
            answer: 'Use a spotlight.'
        },
        {
            question: 'How do you find your mosquito bites?',
            answer: 'Start from scratch.'
        },
        {
            question: 'How do you fix a smashed jack-o’-lantern?',
            answer: 'With a pumpkin patch.'
        },
        {
            question: 'How do you get a baby astronaut to sleep?',
            answer: 'You rock-it.'
        },
        {
            question: 'How do you get a frog off your back car window?',
            answer: 'Use a rear-window defrogger.'
        },
        {
            question: 'How do you keep a buffalo from charging?',
            answer: 'Take away its credit card.'
        },
        {
            question: 'How do you keep a dragon from going through the eye of a needle?',
            answer: 'Tie a knot in its tail.'
        },
        {
            question: 'How do you keep a stinky salmon from smelling?',
            answer: 'Hold its nose.'
        },
        {
            question: 'How do you know when a fish is playing hooky?',
            answer: 'When it’s not in a school.'
        },
        {
            question: 'How do you know when a vampire bat is sick?',
            answer: 'It can’t stop coffin.'
        },
        {
            question: 'How do you make a skeleton laugh?',
            answer: 'Tickle its funny bone.'
        },
        {
            question: 'How do you make a whale float?',
            answer: 'Two scoops of ice cream, root beer, and a whale.'
        },
        {
            question: 'How do you make a witch itch?',
            answer: 'Take out the “W”.'
        },
        {
            question: 'How do you make friends with a squirrel?',
            answer: 'Climb a tree and act like a nut.'
        },
        {
            question: 'How do you milk an ant?',
            answer: 'First you get a really low stool.'
        },
        {
            question: 'How do you read a book about plants?',
            answer: 'You leaf through it.'
        },
        {
            question: 'How do you say good-bye to a sick alligator?',
            answer: '“See you later, illigator.”'
        },
        {
            question: 'How do you spell mouse trap with 3 letters?',
            answer: 'C-A-T.'
        },
        {
            question: 'How do young deer call each other?',
            answer: 'They use a tell-a-fawn.'
        },
        {
            question: 'How does a cat succeed in life?',
            answer: 'Through purr-sistence.'
        },
        {
            question: 'How does a dolphin wash its flippers?',
            answer: 'With an all-porpoise cleaner.'
        },
        {
            question: 'How does a firefly start a race?',
            answer: 'Ready, set, glow!'
        },
        {
            question: 'How does a fish feel when it gets caught stealing bait?',
            answer: 'Gill-ty.'
        },
        {
            question: 'How does a flower ride a bike?',
            answer: 'With its petals.'
        },
        {
            question: 'How does a lion like its steak?',
            answer: 'Medium-roar.'
        },
        {
            question: 'How does a mother kangaroo tell time?',
            answer: 'With her pocket watch.'
        },
        {
            question: 'How does a mountain goat mom call her baby?',
            answer: '“Here, kiddie, kiddie!”'
        },
        {
            question: 'How does a mouse disguise himself?',
            answer: 'He wears a mousetache.'
        },
        {
            question: 'How does a mouse feel after a bath?',
            answer: 'Squeaky clean.'
        },
        {
            question: 'How does a penguin feel after its friend moves away?',
            answer: 'Ice-olated.'
        },
        {
            question: 'How does a skunk put out a fire?',
            answer: 'It uses an ex-stink-guisher.'
        },
        {
            question: 'How does a slug go fishing?',
            answer: 'On a snail boat.'
        },
        {
            question: 'How does a sponge spend its free time?',
            answer: 'It soaks up some fun.'
        },
        {
            question: 'How does a tree get into the Internet?',
            answer: 'It logs on.'
        },
        {
            question: 'How does a turtle call its friends?',
            answer: 'With a shell phone.'
        },
        {
            question: 'How does a turtle get to the top floor?',
            answer: 'In a shell-evator.'
        },
        {
            question: 'How does an octopus pay its bills?',
            answer: 'With sand dollars.'
        },
        {
            question: 'How does the ocean say hello?',
            answer: 'It waves.'
        },
        {
            question: 'How is a wall light switch like a penguin?',
            answer: 'They both have flippers.'
        },
        {
            question: 'How many birds can sing a duet?',
            answer: 'Toucan.'
        },
        {
            question: 'How many cockroaches does it take to screw in a light bulb?',
            answer: 'Can’t tell. They scatter as soon as the light turns on.'
        },
        {
            question: 'How many frogs would fit in your glass of water?',
            answer: 'Toadily too many.'
        },
        {
            question: 'How many mice can an owl eat?',
            answer: 'OWL of them!'
        },
        {
            question: 'How many parents does a dog have?',
            answer: 'Five: one ma and four paws.'
        },
        {
            question: 'How much does a pile of bones weigh?',
            answer: 'A skele-TON.'
        },
        {
            question: 'How much seafood does a crab eat?',
            answer: 'Just a pinch.'
        },
        {
            question: 'In an emergency, whom do you call for a sick rabbit?',
            answer: 'A hare-a-medic.'
        },
        {
            question: 'Is chicken soup good for you?',
            answer: 'Not if you’re the chicken!'
        },
        {
            question: 'Is turkey soup good for you?',
            answer: 'Not if you’re the turkey!'
        },
        {
            question: 'What part of a salmon weighs the most?',
            answer: 'Its scales.'
        },
        {
            question: 'What’s brown and white and dangerous?',
            answer: 'A cow on a skateboard.'
        },
        {
            question: 'What do you call a sleeping male cow?',
            answer: 'A Bulldozer.'
        },
        {
            question: 'What ancient cat solved mysteries?',
            answer: 'The saber SLEUTH tiger.'
        },
        {
            question: 'What animal can you find in the military?',
            answer: 'An army-dillo.'
        },
        {
            question: 'What animal hibernates while standing on its head?',
            answer: 'Yoga bear.'
        },
        {
            question: 'What animal sewed the first American flag?',
            answer: 'Bat-sy Ross.'
        },
        {
            question: 'What are a dog’s favorite pizza toppings?',
            answer: 'Pupperoni and muttzarella.'
        },
        {
            question: 'What are a toad’s favorite games in Ranger Rick?',
            answer: 'Cross-wart puzzles.'
        },
        {
            question: 'What are flies most afraid of?',
            answer: 'The SWAT team.'
        },
        {
            question: 'What are sad cranberries called?',
            answer: 'BLUEberries.'
        },
        {
            question: 'What are skunks so smart?',
            answer: 'They make a lot of scents.'
        },
        {
            question: 'What are spiders called after their wedding?',
            answer: 'Newly webs.'
        },
        {
            question: 'What barks, chases cats, and has black and red spots?',
            answer: 'A Dalmatian with measles.'
        },
        {
            question: 'What baseball team goes best with milk?',
            answer: 'The Baltimore Oreos.'
        },
        {
            question: 'What bear likes to go out in the rain?',
            answer: 'Drizzly bears.'
        },
        {
            question: 'What bird is the greatest artist?',
            answer: 'Leonardo da Finchy.'
        },
        {
            question: 'What bird shows up at every meal?',
            answer: 'A swallow.'
        },
        {
            question: 'What birds always get out of breath when migrating?',
            answer: 'Puffins.'
        },
        {
            question: 'What bug caused the computer to crash?',
            answer: 'The Inter-gnat.'
        },
        {
            question: 'What buzzes, is black and yellow, and goes along the sides of flowers?',
            answer: 'Bee-line.'
        },
        {
            question: 'What did one plate say to the other?',
            answer: 'Lunch is on me.'
        }
    ];
    function getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 1);
        const diff = date - start;
        return Math.floor(diff / 86400000) + 1;
    }

    function seededIndex(date, salt, size) {
        // Stable per day while still varying by content type.
        const dayKey = `${date.getFullYear()}-${getDayOfYear(date)}-${salt}`;
        let hash = 0;
        for (let i = 0; i < dayKey.length; i++) {
            hash = (hash * 31 + dayKey.charCodeAt(i)) >>> 0;
        }
        return hash % size;
    }

    function updateDailyRevelations(now = new Date()) {
        if (!txtDailyQuote || !txtDailyQuoteAuthor || !txtDailyRiddle || !txtDailyJoke) {
            return;
        }

        const quote = dailyQuotes[seededIndex(now, 'quote', dailyQuotes.length)];
        const riddle = dailyRiddles[seededIndex(now, 'riddle', dailyRiddles.length)];
        const joke = dailyJokes[seededIndex(now, 'joke', dailyJokes.length)];

        txtDailyQuote.textContent = quote.text;
        txtDailyQuoteAuthor.textContent = `- ${quote.author}`;
        txtDailyRiddle.textContent = riddle.question;
        currentRiddleAnswer = riddle.answer;
        if (btnRiddleReveal) {
            btnRiddleReveal.textContent = 'Reveal';
            btnRiddleReveal.classList.remove('revealed');
        }
        txtDailyJoke.textContent = joke.question;
        currentJokeAnswer = joke.answer;
        if (txtDailyJokeAnswer) {
            txtDailyJokeAnswer.textContent = '';
            txtDailyJokeAnswer.classList.remove('revealed');
        }
        if (btnJokeReveal) {
            btnJokeReveal.textContent = 'Reveal';
            btnJokeReveal.classList.remove('revealed');
        }
    }

    async function refreshDashboardData({ refreshRevelations = false } = {}) {
        if (isDashboardRefreshing) {
            return;
        }

        isDashboardRefreshing = true;

        try {
            await fetchWeather();
            if (refreshRevelations) {
                updateDailyRevelations(new Date());
            }
        } finally {
            isDashboardRefreshing = false;
        }
    }

    if (btnRiddleReveal) {
        btnRiddleReveal.addEventListener('click', () => {
            if (!currentRiddleAnswer) return;
            const isRevealed = btnRiddleReveal.classList.contains('revealed');
            if (isRevealed) {
                btnRiddleReveal.textContent = 'Reveal';
                btnRiddleReveal.classList.remove('revealed');
            } else {
                btnRiddleReveal.textContent = currentRiddleAnswer;
                btnRiddleReveal.classList.add('revealed');
            }
        });
    }

    if (btnJokeReveal) {
        btnJokeReveal.addEventListener('click', () => {
            if (!currentJokeAnswer) return;
            const isRevealed = btnJokeReveal.classList.contains('revealed');
            if (isRevealed) {
                btnJokeReveal.textContent = 'Reveal';
                btnJokeReveal.classList.remove('revealed');
            } else {
                btnJokeReveal.textContent = currentJokeAnswer;
                btnJokeReveal.classList.add('revealed');
            }
        });
    }

    updateAlarmStatusText();

    // Initial data boot
    await loadDailyQuotesFromJson();
    const initialHouse = getDailyRandomHouse(new Date());
    applyHouseVisuals(initialHouse);
    await refreshDashboardData({ refreshRevelations: true });

    if (btnForecastDaily) {
        btnForecastDaily.addEventListener('click', () => setForecastMode('daily'));
    }
    if (btnForecastHourly) {
        btnForecastHourly.addEventListener('click', () => setForecastMode('hourly'));
    }
    if (btnForecastTomorrow) {
        btnForecastTomorrow.addEventListener('click', () => setForecastMode('tomorrow'));
    }
    if (refreshBadge) {
        refreshBadge.addEventListener('click', () => {
            refreshDashboardData({ refreshRevelations: true });
        });
    }

    // Weather refresh cadence
    setInterval(() => {
        refreshDashboardData();
    }, 5 * 60 * 1000);

    // Refresh revelations right after midnight
    setInterval(() => {
        const now = new Date();
        if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() < 2) {
            updateDailyRevelations(now);
        }
    }, 1000);

    // Initial Lucide pass for static icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});


