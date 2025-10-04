// script.js - Основной скрипт приложения

// Основные переменные для карты
let map;
let markers = [];
const API_KEY = 'f416cc08-f627-4ac9-8709-aa1a86b0a7d4';
const moscow = [37.6173, 55.7558];

// Данные маршрута
let routeData = {
    city: "moscow",
    coordinates: { lat: 55.7558, lng: 37.6173 },
    priorities: {
        "walking": { name: "Пеший маршрут", value: 3 },
        "food": { name: "Еда", value: 2 },
        "green": { name: "Зеленая тропа", value: 1 },
        "culture": { name: "Памятники, музеи, монументы", value: 4 },
        "infrastructure": { name: "Современная инфраструктура", value: 5 },
        "speed": { name: "Скорость маршрута", value: 3 }
    },
    time: { hours: 1, minutes: 30 },
    loop: true
};

// Функция обновления статуса
function updateStatus(message, type = 'info') {
    const status = document.getElementById('status');
    if (status) {
        status.textContent = message;
        status.className = `status ${type}`;
    }
    console.log(`Статус: ${message}`);
}

// Функция изменения города
function changeCity(cityId) {
    console.log('🔄 Меняем город на:', cityId);
    
    const city = citiesData[cityId];
    if (!city) {
        console.error('❌ Город не найден:', cityId);
        return false;
    }
    
    // Обновляем данные маршрута
    routeData.city = cityId;
    routeData.coordinates = { 
        lat: city.coordinates.lat, 
        lng: city.coordinates.lng 
    };
    
    console.log('📌 Новые координаты:', routeData.coordinates);
    
    // Обновляем поля ввода координат в карточке "Начало маршрута"
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    
    console.log('🔍 Найдены поля ввода:', { latInput: !!latInput, lngInput: !!lngInput });
    
    if (latInput && lngInput) {
        latInput.value = city.coordinates.lat.toFixed(6);
        lngInput.value = city.coordinates.lng.toFixed(6);
        console.log('✅ Поля ввода обновлены:', latInput.value, lngInput.value);
    } else {
        console.error('❌ Поля ввода координат не найдены!');
    }
    
    // Обновляем отображение координат в карточке выбора города
    const coordsDisplay = document.getElementById('city-coordinates-display');
    if (coordsDisplay) {
        coordsDisplay.textContent = `${city.coordinates.lat.toFixed(4)}, ${city.coordinates.lng.toFixed(4)}`;
        console.log('✅ Отображение координат обновлено');
    }
    
    // Обновляем карту если она уже инициализирована
    if (map) {
        map.setCenter(city.center);
        map.setZoom(12);
        
        // Очищаем старые маркеры и добавляем новый
        clearMarkers();
        addMarker(city.center);
        console.log('✅ Карта обновлена');
    }
    
    updateStatus(`🏙️ Город изменен на: ${city.name}. Координаты установлены в начало маршрута`, 'success');
    return true;
}

// Инициализация выбора города
function initCitySelect() {
    const citySelect = document.getElementById('city-select');
    if (!citySelect) {
        console.error('Элемент выбора города не найден');
        return;
    }
    
    citySelect.addEventListener('change', function() {
        const selectedCity = this.value;
        changeCity(selectedCity);
    });
    
    // Устанавливаем начальное значение и ФОРСИРУЕМ обновление координат
    citySelect.value = routeData.city;
    changeCity(routeData.city);
    
    console.log('✅ Выбор города инициализирован');
}

// Инициализация карты
function initMap() {
    try {
        updateStatus('Загружаем API карт...', 'loading');
        
        if (typeof mapgl === 'undefined') {
            throw new Error('Библиотека карт 2GIS не загрузилась');
        }

        console.log('🔑 Используем API ключ:', API_KEY);
        
        map = new mapgl.Map('map-container', {
            center: moscow,
            zoom: 13,
            key: API_KEY
        });

        map.on('load', () => {
            console.log('✅ Карта 2GIS загружена');
            
            // ДОБАВЛЯЕМ ОБРАБОТЧИК КЛИКА ПО КАРТЕ
            map.on('click', function(event) {
                const coordinates = [event.lngLat.lng, event.lngLat.lat];
                setStartPointFromMap(coordinates);
            });
        });

        // Обработчик ошибок карты
        map.on('error', (error) => {
            console.error('❌ Ошибка карты 2GIS:', error);
        });

    } catch (error) {
        console.error('💥 Ошибка инициализации:', error);
        updateStatus('💥 Ошибка инициализации: ' + error.message, 'error');
    }
}

// Улучшенная функция добавления маркера
function addMarker(coordinates = null) {
    if (!map) {
        console.error('❌ Карта не инициализирована');
        return null;
    }
    
    try {
        console.log('🔄 Пытаемся добавить маркер 2GIS с координатами:', coordinates);
        
        const marker = new mapgl.Marker(map, {
            coordinates: coordinates
        });
        
        markers.push(marker);
        console.log('✅ Маркер 2GIS успешно добавлен');
        return marker;
    } catch (error) {
        console.error('❌ Ошибка добавления маркера 2GIS:', error);
        createAlternativeMarker(coordinates);
        return null;
    }
}

// Функция создания альтернативного маркера
function createAlternativeMarker(coordinates) {
    console.log('🔄 Создаем альтернативный маркер');
    const [lng, lat] = coordinates;
    
    const mapContainer = document.getElementById('map-container');
    
    // Удаляем старый альтернативный маркер
    const oldMarker = document.getElementById('alternative-marker');
    if (oldMarker) {
        oldMarker.remove();
    }
    
    // Создаем новый маркер
    const marker = document.createElement('div');
    marker.id = 'alternative-marker';
    marker.className = 'alternative-marker';
    marker.style.left = '50%';
    marker.style.top = '50%';
    
    mapContainer.style.position = 'relative';
    mapContainer.appendChild(marker);
    
    console.log('✅ Альтернативный маркер создан');
}

// Функция установки начальной точки с карты
function setStartPointFromMap(coordinates) {
    console.log('📍 Устанавливаем точку с координатами:', coordinates);
    const [lng, lat] = coordinates;
    
    // Сохраняем координаты
    routeData.coordinates = { lat, lng };
    
    // Обновляем поля ввода
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    if (latInput && lngInput) {
        latInput.value = lat.toFixed(6);
        lngInput.value = lng.toFixed(6);
        console.log('✅ Поля ввода обновлены');
    }
    
    // Меняем город на "Другой город" при ручном выборе точки на карте
    const citySelect = document.getElementById('city-select');
    if (citySelect && citySelect.value !== 'custom') {
        citySelect.value = 'custom';
        routeData.city = 'custom';
    }
    
    // Показываем на карте
    if (map) {
        // Очищаем старые маркеры
        clearMarkers();
        
        // Добавляем маркер начальной точки
        const marker = addMarker([lng, lat]);
        
        // Центрируем карту на выбранной точке
        map.setCenter([lng, lat]);
        map.setZoom(15);
    }
    
    updateStatus(`📍 Начальная точка установлена: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'success');
}

// Функция очистки маркеров
function clearMarkers() {
    console.log('🗑️ Очищаем маркеры');
    
    // Очищаем маркеры 2GIS
    markers.forEach(marker => {
        try {
            marker.destroy();
        } catch (error) {
            console.log('Ошибка при удалении маркера 2GIS:', error);
        }
    });
    markers = [];
    
    // Очищаем альтернативный маркер
    const altMarker = document.getElementById('alternative-marker');
    if (altMarker) {
        altMarker.remove();
    }
}

// ===== ФУНКЦИИ ДЛЯ РАБОТЫ С ПОЛЬЗОВАТЕЛЬСКИМ ВВОДОМ =====

// 1. Установка координат из полей ввода ИЛИ с карты
function setCoordinatesFromInput() {
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    
    if (!latInput || !lngInput) {
        updateStatus('❌ Поля координат не найдены', 'error');
        return false;
    }

    const lat = parseFloat(latInput.value.replace(',', '.'));
    const lng = parseFloat(lngInput.value.replace(',', '.'));
    
    // Валидация координат
    if (isNaN(lat) || isNaN(lng)) {
        updateStatus('❌ Введите числа в поля координат', 'error');
        return false;
    }

    if (lat < -90 || lat > 90) {
        updateStatus('❌ Широта должна быть от -90 до 90', 'error');
        return false;
    }

    if (lng < -180 || lng > 180) {
        updateStatus('❌ Долгота должна быть от -180 до 180', 'error');
        return false;
    }

    // Сохраняем координаты
    routeData.coordinates = { lat, lng };
    
    // Меняем город на "Другой город" при ручном вводе координат
    const citySelect = document.getElementById('city-select');
    if (citySelect && citySelect.value !== 'custom') {
        citySelect.value = 'custom';
        routeData.city = 'custom';
    }
    
    // Обновляем отображение координат города
    const coordsDisplay = document.getElementById('city-coordinates-display');
    if (coordsDisplay) {
        coordsDisplay.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    
    // Показываем на карте
    if (map) {
        // Очищаем старые маркеры
        markers.forEach(marker => marker.destroy());
        markers = [];
        
        // Добавляем маркер начальной точки
        addMarker([lng, lat]);
        
        // Центрируем карту на координатах
        map.setCenter([lng, lat]);
        map.setZoom(15);
    }

    updateStatus(`✅ Координаты установлены: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'success');
    return true;
}

// 2. Установка времени из полей ввода
function setTimeFromInput() {
    const hoursInput = document.getElementById('hours');
    const minutesInput = document.getElementById('minutes');
    
    if (!hoursInput || !minutesInput) {
        updateStatus('❌ Поля времени не найдены', 'error');
        return false;
    }

    const hours = parseInt(hoursInput.value);
    const minutes = parseInt(minutesInput.value);
    
    // Валидация времени
    if (isNaN(hours) || isNaN(minutes)) {
        updateStatus('❌ Введите числа в поля времени', 'error');
        return false;
    }

    if (hours < 0 || hours > 23) {
        updateStatus('❌ Часы должны быть от 0 до 23', 'error');
        return false;
    }

    if (minutes < 0 || minutes > 59) {
        updateStatus('❌ Минуты должны быть от 0 до 59', 'error');
        return false;
    }

    if (hours === 0 && minutes === 0) {
        updateStatus('❌ Время маршрута не может быть 0', 'error');
        return false;
    }

    // Сохраняем время
    routeData.time = { hours, minutes };
    
    // Обновляем отображение
    updateTimeDisplay();
    
    updateStatus(`✅ Время установлено: ${hours}ч ${minutes}мин`, 'success');
    return true;
}

// 3. Установка приоритетов из полей ввода с проверкой уникальности
function setPrioritiesFromInput() {
    const priorities = ['walking', 'food', 'green', 'culture', 'infrastructure', 'speed'];
    const usedValues = new Set();
    let hasErrors = false;

    priorities.forEach(priority => {
        const input = document.querySelector(`[data-priority="${priority}"]`);
        if (!input) {
            console.error(`Ползунок приоритета ${priority} не найден`);
            hasErrors = true;
            return;
        }

        const value = parseInt(input.value);
        
        // Валидация приоритета (0-5)
        if (isNaN(value)) {
            updateStatus(`❌ Приоритет "${routeData.priorities[priority].name}" должен быть числом`, 'error');
            hasErrors = true;
            return;
        }

        if (value < 0 || value > 5) {
            updateStatus(`❌ Приоритет "${routeData.priorities[priority].name}" должен быть от 0 до 5`, 'error');
            hasErrors = true;
            return;
        }

        // Проверка уникальности ненулевых значений (кроме скорости)
        if (priority !== 'speed' && value !== 0 && usedValues.has(value)) {
            updateStatus(`❌ Приоритет "${value}" уже используется. Все ненулевые приоритеты должны быть уникальными!`, 'error');
            hasErrors = true;
            return;
        }

        if (value !== 0 && priority !== 'speed') {
            usedValues.add(value);
        }

        // Сохраняем значение
        routeData.priorities[priority].value = value;
        
        // Обновляем отображение ползунка
        updateSliderDisplay(priority, value);
    });

    if (hasErrors) {
        return false;
    }

    updateStatus('✅ Все приоритеты установлены (уникальные значения от 0 до 5)', 'success');
    return true;
}

// 4. Установка типа маршрута (зацикленный/линейный)
function setLoopFromInput() {
    const loopYes = document.querySelector('input[name="loop-route"][value="yes"]');
    const loopNo = document.querySelector('input[name="loop-route"][value="no"]');
    
    if (!loopYes || !loopNo) {
        console.error('Радио-кнопки зацикленного маршрута не найдены');
        return false;
    }
    
    routeData.loop = loopYes.checked;
    
    const loopType = routeData.loop ? 'зацикленный' : 'линейный';
    updateStatus(`✅ Тип маршрута установлен: ${loopType}`, 'success');
    return true;
}

// Обновление отображения ползунка
function updateSliderDisplay(priority, value) {
    const slider = document.querySelector(`[data-priority="${priority}"]`);
    const valueDisplay = slider ? slider.nextElementSibling : null;
    
    if (valueDisplay) {
        valueDisplay.textContent = value;
        valueDisplay.title = getPriorityDescription(value);
    }
    if (slider) {
        slider.value = value;
        updateSliderColor(slider, value);
    }
}

// Функция для описания важности
function getPriorityDescription(value) {
    const descriptions = {
        0: "Не важно",
        1: "Совсем не важно", 
        2: "Слабо важно",
        3: "Средне важно",
        4: "Очень важно",
        5: "Критически важно"
    };
    return descriptions[value] || "Не определено";
}

// Функция для описания скорости
function getSpeedDescription(value) {
    const descriptions = {
        0: "Очень медленно (расслабленная прогулка)",
        1: "Медленно",
        2: "Средне-медленно", 
        3: "Средний темп",
        4: "Быстро",
        5: "Очень быстро (энергичная ходьба)"
    };
    return descriptions[value] || "Средний темп";
}

// Обновление цвета ползунка для шкалы 0-5
function updateSliderColor(slider, value) {
    slider.className = 'priority-slider';
    
    const colorClasses = {
        0: 'priority-0',
        1: 'priority-1',
        2: 'priority-2', 
        3: 'priority-3',
        4: 'priority-4',
        5: 'priority-5'
    };
    
    slider.classList.add(colorClasses[value] || 'priority-0');
}

// Обновление отображения времени
function updateTimeDisplay() {
    const hours = routeData.time.hours;
    const minutes = routeData.time.minutes;
    
    let displayText = '';
    if (hours > 0) {
        displayText += `${hours} час${getRussianEnding(hours, ['', 'а', 'ов'])} `;
    }
    if (minutes > 0) {
        displayText += `${minutes} минут${getRussianEnding(minutes, ['а', 'ы', ''])}`;
    }
    
    const timeDisplay = document.getElementById('total-time');
    if (timeDisplay) {
        timeDisplay.textContent = displayText.trim();
    }
}

// Функция для русских окончаний
function getRussianEnding(number, endings) {
    number = number % 100;
    if (number >= 11 && number <= 19) {
        return endings[2];
    }
    number = number % 10;
    if (number === 1) {
        return endings[0];
    }
    if (number >= 2 && number <= 4) {
        return endings[1];
    }
    return endings[2];
}

// ===== ОСНОВНАЯ ФУНКЦИЯ ПОСТРОЕНИЯ МАРШРУТА =====

function buildRoute() {
    console.log('🚀 Начинаем построение маршрута...', routeData);
    
    // Проверяем все данные
    if (!validateAllData()) {
        return;
    }
    
    // Устанавливаем тип маршрута
    if (!setLoopFromInput()) {
        updateStatus('❌ Ошибка при установке типа маршрута', 'error');
        return;
    }
    
    // Дополнительная проверка уникальности приоритетов
    if (!validatePriorityUniqueness()) {
        return;
    }
    
    // Отправляем данные на сервер
    sendRouteDataToServer();
}

// Функция отправки данных маршрута на сервер
function sendRouteDataToServer() {
    updateStatus('📡 Отправляем данные на сервер...', 'loading');
    
    const serverData = {
        point: {
            x: routeData.coordinates.lat,
            y: routeData.coordinates.lng
        },
        priority: {
            FOOD: routeData.priorities.food.value,
            PEDESTRIAN: routeData.priorities.walking.value,
            MODERN_ARCHITECTURE: routeData.priorities.infrastructure.value,
            ATTRACTIONS: routeData.priorities.culture.value,
            GREEN_VALLEY: routeData.priorities.green.value,
            SPEED: routeData.priorities.speed.value
        },
        minutes: routeData.time.hours * 60 + routeData.time.minutes,
        loop: routeData.loop
    };
    
    console.log('📤 Отправляем данные:', serverData);
    
    // Пробуем разные подходы
    attemptServerRequest(serverData);
}

function attemptServerRequest(serverData) {
    const attempts = [
        {
            name: 'Прямое соединение',
            url: 'http://127.0.0.1:8080/api/route',
            options: {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(serverData)
            }
        },
        {
            name: 'Localhost',
            url: 'http://localhost:8080/api/route',
            options: {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(serverData)
            }
        },
        {
            name: 'Без CORS',
            url: 'http://127.0.0.1:8080/api/route',
            options: {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(serverData),
                mode: 'no-cors'
            }
        }
    ];
    
    tryAttempts(attempts, 0, serverData);
}

function tryAttempts(attempts, index, serverData) {
    if (index >= attempts.length) {
        // Все попытки провалились
        console.log('🎭 Переходим в демо-режим');
        updateStatus('🔶 Демо-режим: данные сохранены локально', 'info');
        
        // Сохраняем данные локально для демо
        saveLocalRouteData(serverData);
        showRouteSummary();
        buildRouteOnMap();
        return;
    }
    
    const attempt = attempts[index];
    console.log(`🔄 Попытка ${index + 1}: ${attempt.name}`);
    
    updateStatus(`📡 ${attempt.name}...`, 'loading');
    
    fetch(attempt.url, attempt.options)
    .then(response => {
        if (attempt.options.mode === 'no-cors') {
            // В режиме no-cors мы не можем прочитать ответ, но запрос отправлен
            console.log('✅ Запрос отправлен (no-cors mode)');
            updateStatus('✅ Данные отправлены (режим no-cors)', 'success');
            handleServerResponse({message: "Данные получены сервером (no-cors режим)"});
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data) {
            console.log('✅ Сервер ответил:', data);
            updateStatus('✅ Данные успешно отправлены!', 'success');
            handleServerResponse(data);
        }
    })
    .catch(error => {
        console.log(`❌ ${attempt.name} failed:`, error.message);
        
        // Пробуем следующую попытку
        setTimeout(() => {
            tryAttempts(attempts, index + 1, serverData);
        }, 500);
    });
}

// Функция для сохранения данных локально (демо-режим)
function saveLocalRouteData(serverData) {
    // Сохраняем в localStorage
    localStorage.setItem('lastRouteData', JSON.stringify(serverData));
    localStorage.setItem('lastRouteTimestamp', new Date().toISOString());
    
    // Сохраняем в глобальной переменной для использования в generateRoutePoints
    window.lastRouteData = serverData;
    
    console.log('💾 Данные сохранены локально:', serverData);
}

// Функция обработки ответа от сервера
function handleServerResponse(serverResponse) {
    console.log('🔄 Обрабатываем ответ сервера:', serverResponse);
    
    // Показываем сводку с данными, которые отправили
    showRouteSummary();
    
    // Добавляем информацию от сервера
    showServerResponseSummary(serverResponse);
    
    // Строим маршрут на карте
    buildRouteOnMap();
}

// Функция для отображения сводки с ответом сервера
function showServerResponseSummary(serverResponse) {
    const summaryElement = document.getElementById('route-summary');
    
    let serverInfoHTML = '';
    
    if (serverResponse.message) {
        serverInfoHTML = `
            <div class="server-response" style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 10px; border-left: 5px solid #4CAF50;">
                <h4>📡 Ответ сервера:</h4>
                <div class="server-message" style="font-weight: bold; color: #2e7d32;">${serverResponse.message}</div>
                ${serverResponse.route ? '<div class="route-info">✅ Маршрут получен от сервера</div>' : ''}
                ${serverResponse.points ? `<div class="points-info">📍 Точек интереса: ${serverResponse.points.length}</div>` : ''}
            </div>
        `;
    }
    
    // Добавляем информацию от сервера к существующей сводке
    const existingSummary = summaryElement.innerHTML;
    summaryElement.innerHTML = existingSummary + serverInfoHTML;
}

// Проверка всех данных
function validateAllData() {
    // Проверяем координаты
    if (!routeData.coordinates || !routeData.coordinates.lat || !routeData.coordinates.lng) {
        updateStatus('❌ Сначала установите координаты начала маршрута', 'error');
        return false;
    }
    
    // Проверяем время
    if (routeData.time.hours === 0 && routeData.time.minutes === 0) {
        updateStatus('❌ Установите время маршрута', 'error');
        return false;
    }
    
    // Проверяем, что есть хотя бы один приоритет > 0 (кроме скорости)
    const hasActivePriorities = Object.entries(routeData.priorities)
        .filter(([key]) => key !== 'speed')
        .some(([_, data]) => data.value > 0);
    
    if (!hasActivePriorities) {
        updateStatus('❌ Установите хотя бы один приоритет больше 0', 'error');
        return false;
    }
    
    return true;
}

// Проверка уникальности приоритетов
function validatePriorityUniqueness() {
    const usedValues = new Set();
    const priorities = Object.entries(routeData.priorities)
        .filter(([key]) => key !== 'speed'); // Исключаем скорость из проверки уникальности
    
    for (let [_, priority] of priorities) {
        if (priority.value !== 0) {
            if (usedValues.has(priority.value)) {
                updateStatus(`❌ Ошибка: приоритет "${priority.value}" используется несколько раз. Все ненулевые приоритеты должны быть уникальными!`, 'error');
                return false;
            }
            usedValues.add(priority.value);
        }
    }
    return true;
}

// Показать улучшенную сводку маршрута
function showRouteSummary() {
    const activePriorities = Object.entries(routeData.priorities)
        .filter(([key, data]) => data.value > 0 && key !== 'speed')
        .sort(([_, a], [__, b]) => b.value - a.value)
        .map(([key, data]) => {
            const importance = getPriorityDescription(data.value);
            return `${data.value} - ${data.name} (${importance})`;
        });
    
    // Определяем главный приоритет
    const mainPriority = activePriorities.length > 0 ? activePriorities[0].split(' - ')[1] : 'не определен';
    
    const speedDescription = getSpeedDescription(routeData.priorities.speed.value);
    const loopType = routeData.loop ? '🔁 Зацикленный (вернуться к началу)' : '➡️ Линейный (закончить в другой точке)';
    const cityName = citiesData[routeData.city]?.name || 'Не выбран';
    
    const summaryHTML = `
        <h4>📋 Ваш персонализированный маршрут</h4>
        <div class="route-summary-item">
            <strong>🏙️ Город:</strong> ${cityName}
        </div>
        <div class="route-summary-item">
            <strong>📍 Начальная точка:</strong><br>
            Широта: ${routeData.coordinates.lat.toFixed(6)}<br>
            Долгота: ${routeData.coordinates.lng.toFixed(6)}
        </div>
        <div class="route-summary-item">
            <strong>⏰ Продолжительность:</strong> ${routeData.time.hours}ч ${routeData.time.minutes}мин
        </div>
        <div class="route-summary-item">
            <strong>🚶 Скорость маршрута:</strong> ${routeData.priorities.speed.value} - ${speedDescription}
        </div>
        <div class="route-summary-item">
            <strong>🔄 Тип маршрута:</strong> ${loopType}
        </div>
        <div class="route-summary-item">
            <strong>🎯 Главный приоритет:</strong> ${mainPriority}
        </div>
        <div class="route-summary-item">
            <strong>📊 Шкала важности:</strong><br>
            ${activePriorities.length > 0 ? activePriorities.join('<br>') : 'Приоритеты не установлены'}
        </div>
        <div class="priority-scale-info">
            <small>📝 Шкала: 0-не важно, 1-совсем не важно, 2-слабо важно, 3-средне важно, 4-очень важно, 5-критически важно</small>
        </div>
    `;
    
    document.getElementById('route-summary').innerHTML = summaryHTML;
}

// Построение маршрута на карте
function buildRouteOnMap() {
    if (!map) return;
    
    // Очищаем старые маркеры
    markers.forEach(marker => marker.destroy());
    markers = [];
    
    const baseLng = routeData.coordinates.lng;
    const baseLat = routeData.coordinates.lat;
    
    // Добавляем начальную точку
    addMarker([baseLng, baseLat]);
    
    // Центрируем карту
    map.setCenter([baseLng, baseLat]);
    map.setZoom(14);
}

// Функция сброса карты
function resetMap() {
    if (!map) return;
    
    if (confirm('Точно сбросить карту? Все маркеры пропадут!')) {
        markers.forEach(marker => marker.destroy());
        markers = [];
        map.setCenter(moscow);
        map.setZoom(13);
        updateStatus('🗑️ Карта очищена!', 'success');
    }
}

// Функция отдаления карты
function zoomOutMap() {
    if (map) {
        map.setZoom(11);
        updateStatus('🔍 Карта отдалена', 'success');
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

function initRouteSection() {
    console.log('🚀 Инициализация секции маршрута...');
    
    // Инициализация выбора города (ДОБАВЬТЕ ЭТУ СТРОКУ ПЕРВОЙ)
    initCitySelect();
    
    // Обработчики для кнопок установки данных
    document.getElementById('set-coordinates-btn').addEventListener('click', setCoordinatesFromInput);
    document.getElementById('apply-time-btn').addEventListener('click', setTimeFromInput);
    document.getElementById('build-route-btn').addEventListener('click', buildRoute);
    
    // Обработчики ползунков приоритетов
    initPrioritySliders();
    
    // Обработчики времени
    initTimeControls();
    
    // Обработчики для зацикленного маршрута
    initLoopControls();
    
    console.log('✅ Секция маршрута инициализирована');
}

// Инициализация ползунков приоритетов
function initPrioritySliders() {
    const sliders = document.querySelectorAll('.priority-slider');
    
    sliders.forEach(slider => {
        const priorityKey = slider.getAttribute('data-priority');
        
        // Устанавливаем начальное значение
        slider.value = routeData.priorities[priorityKey].value;
        updateSliderDisplay(priorityKey, routeData.priorities[priorityKey].value);
        
        // Обработчик изменения ползунка
        slider.addEventListener('input', function() {
            const value = parseInt(this.value);
            updateSliderDisplay(priorityKey, value);
        });
    });
}

// Инициализация управления временем
function initTimeControls() {
    const hoursInput = document.getElementById('hours');
    const minutesInput = document.getElementById('minutes');
    
    // Обработчики кнопок +/- 
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            const isPlus = this.classList.contains('plus');
            const input = document.getElementById(type);
            
            let value = parseInt(input.value);
            
            if (isPlus) {
                value = type === 'hours' ? Math.min(value + 1, 23) : Math.min(value + 1, 59);
            } else {
                value = type === 'hours' ? Math.max(value - 1, 0) : Math.max(value - 1, 0);
            }
            
            input.value = value;
            updateTimeDisplay();
        });
    });
    
    // Обработчики прямого ввода
    hoursInput.addEventListener('input', updateTimeDisplay);
    minutesInput.addEventListener('input', updateTimeDisplay);
    
    // Инициализируем отображение времени
    updateTimeDisplay();
}

// Инициализация управления зацикленным маршрутом
function initLoopControls() {
    const loopRadios = document.querySelectorAll('input[name="loop-route"]');
    
    loopRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                const loopType = this.value === 'yes' ? 'зацикленный' : 'линейный';
                console.log(`🔄 Тип маршрута изменен на: ${loopType}`);
            }
        });
    });
    
    // Устанавливаем значение по умолчанию
    document.querySelector('input[name="loop-route"][value="yes"]').checked = true;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Инициализация приложения...');
    
    // Проверка что citiesData загружен
    if (typeof citiesData === 'undefined') {
        console.error('❌ cities.js не загружен!');
        updateStatus('❌ Ошибка: файл с городами не загружен', 'error');
    } else {
        console.log('✅ cities.js загружен, городов:', Object.keys(citiesData).length);
    }
    
    initMap();
    initRouteSection();
    
    // Обработчики кнопок карты
    document.getElementById('moscow-places-btn').addEventListener('click', zoomOutMap);
    document.getElementById('reset-map-btn').addEventListener('click', resetMap);
    
    // Обработчик для кнопки в герое
    document.querySelector('.btn-secondary').addEventListener('click', function() {
        document.querySelector('#about').scrollIntoView({
            behavior: 'smooth'
        });
    });
    
    console.log('✅ Приложение инициализировано!');
});
