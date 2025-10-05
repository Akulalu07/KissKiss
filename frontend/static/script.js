// script.js - Основной скрипт приложения

// Основные переменные для карты

let map;
let markers = [];
let routePoints = []; // Массив для точек маршрута от сервера
let routeLines = []; // Массив для линий маршрута
const API_KEY = 'f416cc08-f627-4ac9-8709-aa1a86b0a7d4';
const moscow = [37.6173, 55.7558];

// Данные маршрута
let routeData = {
    city: "moscow",
    coordinates: { lat: 55.7558, lng: 37.6173 },
    priorities: {
        "walking": { name: "Набережная", value: 3 },
        "food": { name: "Еда", value: 2 },
        "green": { name: "Парк", value: 1 },
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


// Функция для отображения точек маршрута на карте
function displayRoutePoints(points) {
    if (!map) {
        console.error('❌ Карта не инициализирована');
        return;
    }
    
    console.log('🔄 Отображаем точки маршрута:', points);
    
    // Очищаем предыдущие маркеры и линии
    clearRouteFromMap();
    
    // Сохраняем точки маршрута
    routePoints = points;
    
    if (!points || points.length === 0) {
        updateStatus('❌ Нет точек для отображения', 'error');
        return;
    }
    
    // Создаем маркеры для каждой точки
    points.forEach((point, index) => {
        try {
            const coordinates = [point.lat, point.lng];
            
            // Создаем маркер
            const marker = new mapgl.Marker(map, {
                coordinates: coordinates,
                icon: createRoutePointIcon(index + 1), // Иконка с номером точки
                size: [30, 30]
            });
            
            markers.push(marker);
            
            console.log(`✅ Точка ${index + 1} добавлена:`, coordinates);
            
        } catch (error) {
            console.error(`❌ Ошибка при создании маркера точки ${index + 1}:`, error);
        }
    });
    
    // Создаем линии маршрута между точками
    createRouteLines(points);
    
    // Центрируем карту на маршруте
    centerMapOnRoute(points);
    
    updateStatus(`✅ Маршрут отображен: ${points.length} точек`, 'success');
}

// Функция для создания иконки с номером точки
function createRoutePointIcon(number) {
    // Создаем canvas для иконки
    const canvas = document.createElement('canvas');
    const size = 30;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Рисуем круг
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Добавляем номер
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number.toString(), size/2, size/2);
    
    return canvas.toDataURL();
}

// Функция для создания линий между точками маршрута
function createRouteLines(points) {
    if (!map || points.length < 2) return;
    
    try {
        // Создаем полилинию через все точки
        const polyline = new mapgl.Polyline(map, {
            coordinates: points.map(point => [point.lng, point.lat]),
            color: '#3498db',
            width: 4
        });
        
        routeLines.push(polyline);
        console.log('✅ Линия маршрута создана');
        
    } catch (error) {
        console.error('❌ Ошибка при создании линии маршрута:', error);
    }
}

// Функция для центрирования карты на маршруте
function centerMapOnRoute(points) {
    if (!map || points.length === 0) return;
    
    // Вычисляем bounding box всех точек
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Центрируем карту на середине маршрута
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Вычисляем zoom чтобы вместить все точки
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 13;
    if (maxDiff < 0.01) zoom = 15;
    else if (maxDiff < 0.02) zoom = 14;
    else if (maxDiff > 0.1) zoom = 11;
    else if (maxDiff > 0.05) zoom = 12;
    
    map.setCenter([centerLng, centerLat]);
    map.setZoom(zoom);
    
    console.log('✅ Карта центрирована на маршруте');
}

// Функция для очистки маршрута с карты
function clearRouteFromMap() {
    console.log('🗑️ Очищаем маршрут с карты');
    
    // Очищаем маркеры точек маршрута
    markers.forEach(marker => {
        try {
            marker.destroy();
        } catch (error) {
            console.log('Ошибка при удалении маркера:', error);
        }
    });
    markers = [];
    
    // Очищаем линии маршрута
    routeLines.forEach(line => {
        try {
            line.destroy();
        } catch (error) {
            console.log('Ошибка при удалении линии:', error);
        }
    });
    routeLines = [];
    
    routePoints = [];
}









// Функция обработки ответа от сервера
function handleServerResponse(serverResponse) {
    console.log('🔄 Обрабатываем ответ сервера:', serverResponse);
    
    // Показываем сводку с данными, которые отправили
    showRouteSummary();
    
    // Добавляем информацию от сервера
    showServerResponseSummary(serverResponse);
    
    // Обрабатываем точки маршрута от сервера
    processRoutePointsFromServer(serverResponse);
}

// Функция для обработки точек маршрута от сервера
function processRoutePointsFromServer(serverResponse) {
    if (serverResponse.points && Array.isArray(serverResponse.points)) {
        console.log('📍 Получены точки маршрута от сервера:', serverResponse.points);
        
        // Преобразуем точки в нужный формат
        const routePoints = serverResponse.points.map(point => {
            // Предполагаем, что сервер присылает точки в формате {lat, lng} или {x, y}
            if (point.lat !== undefined && point.lng !== undefined) {
                return { lat: point.lat, lng: point.lng };
            } else if (point.x !== undefined && point.y !== undefined) {
                return { lat: point.x, lng: point.y }; // Исправлено: x=lat, y=lng
            } else if (point[0] !== undefined && point[1] !== undefined) {
                return { lng: point[0] , lat: point[1]}; // Если массив [lng, lat]
            }
            return null;
        }).filter(point => point !== null);
        
        if (routePoints.length > 0) {
            // Отображаем точки на карте
            displayRoutePoints(routePoints);
        } else {
            // Если точек нет, строим демо-маршрут
            buildRouteOnMap();
        }
        
    } else {
        console.log('📍 Точки маршрута не получены, строим демо-маршрут');
        // Строим демо-маршрут вокруг начальной точки
        buildRouteOnMap();
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

    if (hours < 0 || hours > 4) { // Изменено с 23 на 4
        updateStatus('❌ Часы должны быть от 0 до 4', 'error');
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

    // Проверка общего времени (не более 4 часов)
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes > 240) { // 4 часа = 240 минут
        updateStatus('❌ Общее время маршрута не может превышать 4 часа', 'error');
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
        
        // Валидация приоритета (1-5 для обычных, 0-5 для скорости)
        if (isNaN(value)) {
            updateStatus(`❌ Приоритет "${routeData.priorities[priority].name}" должен быть числом`, 'error');
            hasErrors = true;
            return;
        }

        if (priority !== 'speed') {
            // Для обычных приоритетов: 1-5
            if (value < 1 || value > 5) {
                updateStatus(`❌ Приоритет "${routeData.priorities[priority].name}" должен быть от 1 до 5`, 'error');
                hasErrors = true;
                return;
            }
        } else {
            // Для скорости: 0-5
            if (value < 0 || value > 5) {
                updateStatus(`❌ Приоритет "${routeData.priorities[priority].name}" должен быть от 0 до 5`, 'error');
                hasErrors = true;
                return;
            }
        }

        // Проверка уникальности ненулевых значений (кроме скорости)
        if (priority !== 'speed' && usedValues.has(value)) {
            updateStatus(`❌ Приоритет "${value}" уже используется. Все приоритеты должны быть уникальными!`, 'error');
            hasErrors = true;
            return;
        }

        if (priority !== 'speed') {
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

    updateStatus('✅ Все приоритеты установлены (уникальные значения от 1 до 5)', 'success');
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
// Функция для описания скорости
function getSpeedDescription(value) {
    const speedKmph = convertSpeedToKmph(value);
    const descriptions = {
        0: `Очень медленно (${speedKmph} км/ч) - расслабленная прогулка`,
        1: `Медленно (${speedKmph} км/ч) - неспешный темп`,
        2: `Средне-медленно (${speedKmph} км/ч) - комфортная ходьба`, 
        3: `Средний темп (${speedKmph} км/ч) - обычная прогулка`,
        4: `Быстро (${speedKmph} км/ч) - энергичная ходьба`,
        5: `Очень быстро (${speedKmph} км/ч) - спортивный темп`
    };
    return descriptions[value] || `Средний темп (${convertSpeedToKmph(value)} км/ч)`;
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
// Функция отправки данных маршрута на сервер
// Функция отправки данных маршрута на сервер
function sendRouteDataToServer() {
    updateStatus('📡 Отправляем данные на сервер...', 'loading');
    
    // Преобразуем скорость в км/ч
    const speedValue = convertSpeedToKmph(routeData.priorities.speed.value);
    
    const serverData = {
        point: {
            x: routeData.coordinates.lat,
            y: routeData.coordinates.lng
        },
        priority: {
            [routeData.priorities.green.value]: "GREEN_VALLEY",
            [routeData.priorities.culture.value]: "ATTRACTIONS",
            [routeData.priorities.infrastructure.value]: "MODERN_ARCHITECTURE",
            [routeData.priorities.walking.value]: "PEDESTRIAN",
            [routeData.priorities.food.value]: "FOOD"
        },
        city: routeData.city,
        speed: speedValue,
        minutes: routeData.time.hours * 60 + routeData.time.minutes,
        loop: routeData.loop
    };
    
    console.log('📤 Отправляем данные:', serverData);
    console.log('🏙️ Город:', routeData.city);
    console.log('🚶 Скорость преобразована:', routeData.priorities.speed.value, '→', speedValue, 'км/ч');
    
    // Пробуем разные подходы
    attemptServerRequest(serverData);
}



// Функция преобразования числового значения скорости в км/ч
function convertSpeedToKmph(speedValue) {
    const speedMap = {
        0: 1,   // 0 → 1 км/ч
        1: 2,   // 1 → 2 км/ч
        2: 3,   // 2 → 3 км/ч
        3: 5,   // 3 → 5 км/ч
        4: 10,  // 4 → 10 км/ч
        5: 15   // 5 → 15 км/ч
    };
    
    return speedMap[speedValue] || 5; // По умолчанию 5 км/ч
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
// Функция для сохранения данных локально (демо-режим)
function saveLocalRouteData(serverData) {
    // Добавляем информацию о скорости для отладки
    serverData.speedDebug = {
        value: routeData.priorities.speed.value,
        kmph: convertSpeedToKmph(routeData.priorities.speed.value),
        description: getSpeedDescription(routeData.priorities.speed.value)
    };
    
    // Сохраняем в localStorage
    localStorage.setItem('lastRouteData', JSON.stringify(serverData));
    localStorage.setItem('lastRouteTimestamp', new Date().toISOString());
    
    // Сохраняем в глобальной переменной для использования в generateRoutePoints
    window.lastRouteData = serverData;
    
    console.log('💾 Данные сохранены локально:', serverData);
    console.log('🚶 Скорость сохранена:', serverData.speedDebug);
}

// Функция обработки ответа от сервера
// Функция обработки ответа от сервера
function handleServerResponse(serverResponse) {
    console.log('🔄 Обрабатываем ответ сервера:', serverResponse);
    
    // Показываем сводку с данными, которые отправили
    showRouteSummary();
    
    // Добавляем информацию от сервера
    showServerResponseSummary(serverResponse);
    
    // Обрабатываем точки маршрута от сервера
    processRoutePointsFromServer(serverResponse);
}

// Функция для обработки точек маршрута от сервера
function processRoutePointsFromServer(serverResponse) {
    if (serverResponse.points && Array.isArray(serverResponse.points)) {
        console.log('📍 Получены точки маршрута от сервера:', serverResponse.points);
        
        // Преобразуем точки в нужный формат
        const routePoints = serverResponse.points.map(point => {
            // Предполагаем, что сервер присылает точки в формате {lat, lng} или {x, y}
            if (point.lat !== undefined && point.lng !== undefined) {
                return { lat: point.lat, lng: point.lng };
            } else if (point.x !== undefined && point.y !== undefined) {
                return { lat: point.y, lng: point.x }; // Если сервер использует x,y
            } else if (point[0] !== undefined && point[1] !== undefined) {
                return { lat: point[1], lng: point[0] }; // Если массив [lng, lat]
            }
            return null;
        }).filter(point => point !== null);
        
        if (routePoints.length > 0) {
            // Отображаем точки на карте
            displayRoutePoints(routePoints);
        } else {
            // Если точек нет, строим демо-маршрут
            buildRouteOnMap();
        }
        
    } else {
        console.log('📍 Точки маршрута не получены, строим демо-маршрут');
        // Строим демо-маршрут вокруг начальной точки
        buildRouteOnMap();
    }
}

// Функция для отображения сводки с ответом сервера
// Функция для отображения сводки с ответом сервера
function showServerResponseSummary(serverResponse) {
    const summaryElement = document.getElementById('route-summary');
    
    let serverInfoHTML = '';
    let pointsInfo = '';
    
    if (serverResponse.points && Array.isArray(serverResponse.points)) {
        pointsInfo = `
            <div class="points-details" style="margin-top: 15px; padding: 10px; background: #e8f4fd; border-radius: 8px;">
                <h5>📍 Детали маршрута:</h5>
                <div style="font-size: 0.9rem;">
                    <strong>Количество точек:</strong> ${serverResponse.points.length}<br>
                    <strong>Протяженность:</strong> ${serverResponse.distance ? serverResponse.distance + ' км' : 'расчет...'}<br>
                    <strong>Время в пути:</strong> ${serverResponse.duration ? serverResponse.duration + ' мин' : 'расчет...'}
                </div>
            </div>
        `;
    }
    
    if (serverResponse.message) {
        serverInfoHTML = `
            <div class="server-response" style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 10px; border-left: 5px solid #4CAF50;">
                <h4>📡 Ответ сервера:</h4>
                <div class="server-message" style="font-weight: bold; color: #2e7d32;">${serverResponse.message}</div>
                ${serverResponse.route ? '<div class="route-info">✅ Маршрут получен от сервера</div>' : ''}
                ${pointsInfo}
            </div>
        `;
    }
    
    // Добавляем информацию от сервера к существующей сводке
    const existingSummary = summaryElement.innerHTML;
    summaryElement.innerHTML = existingSummary + serverInfoHTML;
}

// Проверка всех данных
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
    
    // Проверяем, что все приоритеты установлены (1-5)
    const priorities = Object.entries(routeData.priorities)
        .filter(([key]) => key !== 'speed');
    
    for (let [key, priority] of priorities) {
        if (priority.value < 1 || priority.value > 5) {
            updateStatus(`❌ Приоритет "${priority.name}" должен быть от 1 до 5`, 'error');
            return false;
        }
    }
    
    return true;
}

// Проверка уникальности приоритетов
function validatePriorityUniqueness() {
    const usedValues = new Set();
    const priorities = Object.entries(routeData.priorities)
        .filter(([key]) => key !== 'speed'); // Исключаем скорость из проверки уникальности
    
    for (let [_, priority] of priorities) {
        if (usedValues.has(priority.value)) {
            updateStatus(`❌ Ошибка: приоритет "${priority.value}" используется несколько раз. Все приоритеты должны быть уникальными!`, 'error');
            return false;
        }
        usedValues.add(priority.value);
    }
    return true;
}

// Показать улучшенную сводку маршрута
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
    
    const speedValue = routeData.priorities.speed.value;
    const speedKmph = convertSpeedToKmph(speedValue);
    const speedDescription = getSpeedDescription(speedValue);
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
            <strong>🚶 Скорость маршрута:</strong> ${speedValue} - ${speedDescription}
        </div>
        <div class="route-summary-item">
            <strong>📏 Расчетная скорость:</strong> ${speedKmph} км/ч
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
// Инициализация управления временем
function initTimeControls() {
    const hoursInput = document.getElementById('hours');
    const minutesInput = document.getElementById('minutes');
    
    // Устанавливаем максимальные значения
    hoursInput.max = 4; // Ограничение 4 часа
    minutesInput.max = 59;
    
    // Обработчики кнопок +/- 
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            const isPlus = this.classList.contains('plus');
            const input = document.getElementById(type);
            
            let value = parseInt(input.value);
            
            if (isPlus) {
                if (type === 'hours') {
                    // Проверяем общее время при увеличении часов
                    const currentHours = parseInt(hoursInput.value);
                    const currentMinutes = parseInt(minutesInput.value);
                    if (currentHours < 4 || (currentHours === 4 && currentMinutes === 0)) {
                        value = Math.min(value + 1, 4);
                    }
                } else {
                    // Для минут проверяем общее время
                    const currentHours = parseInt(hoursInput.value);
                    const currentMinutes = parseInt(minutesInput.value);
                    const totalMinutes = currentHours * 60 + (currentMinutes + 1);
                    if (totalMinutes <= 240) {
                        value = Math.min(value + 1, 59);
                    }
                }
            } else {
                value = type === 'hours' ? Math.max(value - 1, 0) : Math.max(value - 1, 0);
            }
            
            input.value = value;
            updateTimeDisplay();
        });
    });
    
    // Обработчики прямого ввода с валидацией
    hoursInput.addEventListener('input', function() {
        let value = parseInt(this.value) || 0;
        if (value > 4) {
            this.value = 4;
            value = 4;
        }
        
        // Проверяем общее время
        const minutes = parseInt(minutesInput.value) || 0;
        const totalMinutes = value * 60 + minutes;
        if (totalMinutes > 240) {
            // Автоматически корректируем минуты если превышено время
            const maxMinutes = 240 - (value * 60);
            minutesInput.value = Math.min(minutes, maxMinutes);
        }
        
        updateTimeDisplay();
    });
    
    minutesInput.addEventListener('input', function() {
        let value = parseInt(this.value) || 0;
        if (value > 59) {
            this.value = 59;
            value = 59;
        }
        
        // Проверяем общее время
        const hours = parseInt(hoursInput.value) || 0;
        const totalMinutes = hours * 60 + value;
        if (totalMinutes > 240) {
            // Автоматически корректируем часы если превышено время
            const maxHours = Math.floor((240 - value) / 60);
            hoursInput.value = maxHours;
            this.value = 240 - (maxHours * 60);
        }
        
        updateTimeDisplay();
    });
    
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


// // Построение маршрута на карте (демо-режим)
// function buildRouteOnMap() {
//     if (!map) return;
    
//     console.log('🎭 Строим демо-маршрут');
    
//     // Очищаем старые маркеры
//     clearRouteFromMap();
    
//     const baseLng = routeData.coordinates.lng;
//     const baseLat = routeData.coordinates.lat;
//     // Создаем демо-точки маршрута вокруг начальной точки
//     const demoPoints = [
//         { lat: baseLat, lng: baseLng }, // Начальная точка
//         { lat: baseLat + 0.005, lng: baseLng + 0.005 },
//         { lat: baseLat + 0.008, lng: baseLng - 0.003 },
//         { lat: baseLat + 0.003, lng: baseLng - 0.008 },
//         { lat: baseLat - 0.004, lng: baseLng - 0.005 },
//         { lat: baseLat - 0.006, lng: baseLng + 0.002 }
//     ];
    
//     // Отображаем демо-точки
//     displayRoutePoints(demoPoints);
    
//     updateStatus('🎭 Демо-режим: маршрут построен с тестовыми точками', 'info');
// }
