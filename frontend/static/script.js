// Основные переменные для карты
let map;
let markers = [];
const API_KEY = 'f416cc08-f627-4ac9-8709-aa1a86b0a7d4';
const moscow = [37.6173, 55.7558]; // Москва! [долгота, широта]

// Переменные для хранения данных маршрута
let routeData = {
    coordinates: { lat: 55.7558, lng: 37.6173 },
    priorities: {
        "walking": { name: "Пеший маршрут", value: 0 },
        "food": { name: "Еда", value: 0 },
        "green": { name: "Зеленая тропа", value: 0 },
        "culture": { name: "Памятники, музеи, монументы", value: 0 },
        "infrastructure": { name: "Современная инфраструктура", value: 0 }
    },
    time: { hours: 1, minutes: 30 }
};

// Функция обновления статуса
function updateStatus(message, type) {
    const status = document.getElementById('status');
    if (status) {
        status.textContent = message;
        status.className = `status ${type}`;
    }
    console.log(`Статус: ${message}`);
}

// Инициализация карты
function initMap() {
    try {
        updateStatus('Загружаем API карт...', 'loading');
        
        // Проверяем загрузилась ли библиотека
        if (typeof mapgl === 'undefined') {
            throw new Error('Библиотека карт 2GIS не загрузилась');
        }

        updateStatus('Создаем карту Москвы с твоим ключом...', 'loading');

        // Создаем карту с настоящим ключом - ЦЕНТР МОСКВЫ!
        map = new mapgl.Map('map-container', {
            center: moscow, // Москва!
            zoom: 13,
            key: API_KEY
        });

        // Обработчик успешной загрузки карты
        map.on('load', () => {
            updateStatus('🎉 Карта 2GIS Москвы успешно загружена! Теперь можно похакать!', 'success');
            
            // Добавляем стартовый маркер в МОСКВЕ!
            addMarker(moscow, '🎯 Эпицентр хакатона в Москве! Тут все сходят с ума');
            
            // Обработчик клика по карте
            map.on('click', (event) => {
                const coords = [event.lngLat.lng, event.lngLat.lat];
                const funnyMessages = [
                    "🤯 Тут я сломал мозг в Москве",
                    "🐛 Здесь был баг на Красной площади",
                    "💥 Взрыв нейронов в метро",
                    "🆘 SOS! Помогите! Я в Москве!",
                    "👻 Призрак кода в Охотном ряду",
                    "💀 Код не работает как пробки на Садовом",
                    "🎯 Метка паники у Кремля",
                    "🚨 Критическая ситуация в ЦАО"
                ];
                const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
                addMarker(coords, `${randomMessage}\nКоординаты: ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`);
            });
        });

        // Обработчик ошибок карты
        map.on('error', (error) => {
            updateStatus('❌ Ошибка карты: ' + error.message, 'error');
        });

    } catch (error) {
        updateStatus('💥 Ошибка инициализации: ' + error.message, 'error');
        console.error('Детали ошибки:', error);
    }
}

// Функция добавления маркера
function addMarker(coordinates = null, label = 'Новая точка хакатона в Москве') {
    if (!map) {
        updateStatus('Карта еще не загрузилась!', 'error');
        return;
    }
    
    // Если координаты не указаны, генерируем случайные рядом с МОСКВОЙ
    const coords = coordinates || [
        moscow[0] + (Math.random() - 0.5) * 0.02, // долгота
        moscow[1] + (Math.random() - 0.5) * 0.02  // широта
    ];
    
    try {
        const marker = new mapgl.Marker(map, {
            coordinates: coords,
            label: label,
            icon: 'https://docs.2gis.com/img/dot-marker.svg'
        });
        
        markers.push(marker);
        updateStatus(`✅ Добавлен маркер в Москве: ${label.split('\n')[0]}`, 'success');
        
    } catch (error) {
        updateStatus('❌ Ошибка добавления маркера: ' + error.message, 'error');
    }
}

// ===== ФУНКЦИОНАЛ СЕКЦИИ "О СЕРВИСЕ" =====

// Инициализация функционала секции "О сервисе"
function initRouteSection() {
    console.log('🚀 Инициализация секции маршрута...');
    
    // 1. Координаты - обработчик кнопки
    document.getElementById('set-coordinates-btn').addEventListener('click', setCoordinatesOnMap);
    
    // 2. Приоритеты - обработчики ползунков
    initPrioritySliders();
    
    // 3. Время - обработчики кнопок +/-
    initTimeControls();
    
    // 4. Кнопка построения маршрута
    document.getElementById('build-route-btn').addEventListener('click', buildRoute);
    
    console.log('✅ Секция маршрута инициализирована');
}

// 1. Функция установки координат на карте
function setCoordinatesOnMap() {
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    
    const lat = parseFloat(latInput.value);
    const lng = parseFloat(lngInput.value);
    
    if (isNaN(lat) || isNaN(lng)) {
        updateStatus('❌ Введите корректные координаты!', 'error');
        return;
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        updateStatus('❌ Координаты вне допустимого диапазона!', 'error');
        return;
    }
    
    // Сохраняем координаты
    routeData.coordinates = { lat, lng };
    
    // Добавляем маркер на карту
    if (map) {
        addMarker([lng, lat], `🎯 Начало маршрута\nШирота: ${lat}\nДолгота: ${lng}`);
        map.setCenter([lng, lat]);
        map.setZoom(15);
    }
    
    updateStatus(`✅ Координаты установлены: ${lat}, ${lng}`, 'success');
}

// 2. Функция инициализации ползунков приоритетов
function initPrioritySliders() {
    const sliders = document.querySelectorAll('.priority-slider');
    
    sliders.forEach(slider => {
        const priorityKey = slider.getAttribute('data-priority');
        const valueDisplay = slider.nextElementSibling;
        
        // Устанавливаем начальное значение
        valueDisplay.textContent = slider.value;
        routeData.priorities[priorityKey].value = parseInt(slider.value);
        
        // Обработчик изменения ползунка
        slider.addEventListener('input', function() {
            const value = parseInt(this.value);
            valueDisplay.textContent = value;
            routeData.priorities[priorityKey].value = value;
            
            // Меняем цвет ползунка
            updateSliderColor(this, value);
            
            console.log(`🎯 Приоритет "${routeData.priorities[priorityKey].name}" изменен на: ${value}`);
        });
        
        // Инициализируем цвет
        updateSliderColor(slider, parseInt(slider.value));
    });
}

// Функция обновления цвета ползунка
function updateSliderColor(slider, value) {
    // Убираем старые классы
    slider.className = 'priority-slider';
    
    // Добавляем класс в зависимости от значения
    if (value === 0) {
        slider.classList.add('priority-0');
    } else if (value <= 3) {
        slider.classList.add('priority-low');
    } else if (value <= 6) {
        slider.classList.add('priority-medium');
    } else {
        slider.classList.add('priority-high');
    }
}

// 3. Функция инициализации управления временем
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
    
    // Кнопка применения времени
    document.getElementById('apply-time-btn').addEventListener('click', function() {
        const hours = parseInt(hoursInput.value) || 0;
        const minutes = parseInt(minutesInput.value) || 0;
        
        routeData.time = { hours, minutes };
        updateStatus(`⏰ Время установлено: ${hours}ч ${minutes}мин`, 'success');
    });
    
    // Инициализируем отображение времени
    updateTimeDisplay();
}

// Обновление отображения времени
function updateTimeDisplay() {
    const hours = parseInt(document.getElementById('hours').value) || 0;
    const minutes = parseInt(document.getElementById('minutes').value) || 0;
    
    let displayText = '';
    if (hours > 0) {
        displayText += `${hours} час${getRussianEnding(hours, ['', 'а', 'ов'])} `;
    }
    if (minutes > 0) {
        displayText += `${minutes} минут${getRussianEnding(minutes, ['а', 'ы', ''])}`;
    }
    if (hours === 0 && minutes === 0) {
        displayText = '0 минут';
    }
    
    document.getElementById('total-time').textContent = displayText.trim();
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

// 4. Функция построения маршрута
function buildRoute() {
    console.log('🚀 Начинаем построение маршрута...', routeData);
    
    // Проверяем данные
    if (!routeData.coordinates) {
        updateStatus('❌ Сначала установите координаты!', 'error');
        return;
    }
    
    // Собираем активные приоритеты (только те, что > 0)
    const activePriorities = Object.entries(routeData.priorities)
        .filter(([_, data]) => data.value > 0)
        .sort(([_, a], [__, b]) => b.value - a.value) // Сортируем по убыванию
        .map(([key, data]) => `${data.value}/10 - ${data.name}`);
    
    // Формируем сводку
    const summaryHTML = `
        <h4>📋 Сводка по маршруту:</h4>
        <div class="route-summary-item">
            <strong>📍 Начальная точка:</strong><br>
            Широта: ${routeData.coordinates.lat}<br>
            Долгота: ${routeData.coordinates.lng}
        </div>
        <div class="route-summary-item">
            <strong>⏰ Время в пути:</strong> ${routeData.time.hours}ч ${routeData.time.minutes}мин
        </div>
        <div class="route-summary-item">
            <strong>🎯 Приоритеты:</strong><br>
            ${activePriorities.length > 0 ? activePriorities.join('<br>') : 'Приоритеты не установлены'}
        </div>
        <div class="route-summary-item">
            <strong>📊 Статус:</strong> <span style="color: #27ae60;">Маршрут построен успешно! 🎉</span>
        </div>
    `;
    
    // Показываем сводку
    document.getElementById('route-summary').innerHTML = summaryHTML;
    
    // Показываем на карте (демо-функция)
    if (map) {
        // Очищаем старые маркеры
        markers.forEach(marker => marker.destroy());
        markers = [];
        
        // Добавляем маркер начала маршрута
        addMarker(
            [routeData.coordinates.lng, routeData.coordinates.lat], 
            `🚀 Начало маршрута\nВремя: ${routeData.time.hours}ч ${routeData.time.minutes}мин\nПриоритеты: ${activePriorities.length}`
        );
        
        // Добавляем точки маршрута в зависимости от приоритетов
        addRoutePointsByPriority();
    }
    
    updateStatus('🎉 Маршрут успешно построен! Смотри сводку ниже.', 'success');
}

// Функция добавления точек маршрута в зависимости от приоритетов
function addRoutePointsByPriority() {
    const baseLng = routeData.coordinates.lng;
    const baseLat = routeData.coordinates.lat;
    
    // Определяем типы точек на основе приоритетов
    const pointTypes = [];
    
    if (routeData.priorities.food.value > 0) {
        pointTypes.push('🍕 Еда');
    }
    if (routeData.priorities.culture.value > 0) {
        pointTypes.push('🏛️ Культура');
    }
    if (routeData.priorities.green.value > 0) {
        pointTypes.push('🌳 Природа');
    }
    if (routeData.priorities.infrastructure.value > 0) {
        pointTypes.push('🏢 Инфраструктура');
    }
    if (routeData.priorities.walking.value > 0) {
        pointTypes.push('🚶 Пеший маршрут');
    }
    
    // Создаем демо-точки
    const demoPoints = [
        { lng: baseLng + 0.005, lat: baseLat + 0.003, type: pointTypes[0] || '📍 Точка 1' },
        { lng: baseLng + 0.01, lat: baseLat - 0.002, type: pointTypes[1] || '📍 Точка 2' },
        { lng: baseLng + 0.008, lat: baseLat - 0.006, type: pointTypes[2] || '📍 Точка 3' },
        { lng: baseLng + 0.012, lat: baseLat - 0.004, type: '🏁 Конец маршрута' }
    ];
    
    demoPoints.forEach((point, index) => {
        setTimeout(() => {
            addMarker(
                [point.lng, point.lat], 
                `${point.type}\nЭтап ${index + 1}`
            );
        }, index * 500);
    });
    
    // Центрируем карту на маршруте
    setTimeout(() => {
        map.setCenter([baseLng + 0.006, baseLat]);
        map.setZoom(14);
    }, demoPoints.length * 500);
}

// Функция поиска "кафе" в МОСКВЕ (демо-функция)
function findCafe() {
    if (!map) {
        updateStatus('Карта еще не загрузилась!', 'error');
        return;
    }
    
    updateStatus('🔍 Ищем места для передышки в Москве...', 'loading');
    
    // Демо-данные "кафе" в МОСКВЕ
    const cafes = [
        { 
            coords: [37.6173, 55.7558], // Красная площадь
            name: '☕ Кофейня "У Кремля"',
            desc: 'Пьем кофе и смотрим на Спасскую башню'
        },
        { 
            coords: [37.6092, 55.7539], // Охотный ряд
            name: '🍕 Кафе "Код и Пельмени"',
            desc: 'Пишем код и едим пельмени у ГУМа'
        },
        { 
            coords: [37.6254, 55.7580], // Тверская
            name: '🥤 Бар "Московский JavaScript"',
            desc: 'Обсуждаем асинхронность на Тверской'
        },
        { 
            coords: [37.6321, 55.7610], // Пушкинская площадь
            name: '🍔 Фастфуд "Баги на Пушкинской"',
            desc: 'Исправляешь баги - получаешь бургер'
        },
        { 
            coords: [37.6005, 55.7480], // Павелецкая
            name: '🍩 Пончиковая "React"',
            desc: 'Пончики + React = счастье'
        },
        { 
            coords: [37.6464, 55.7659], // Садовое кольцо
            name: '☕ Кофе "В пробках"',
            desc: 'Пьем кофе пока стоим в пробке'
        }
    ];
    
    // Добавляем маркеры кафе с задержкой для анимации
    cafes.forEach((cafe, index) => {
        setTimeout(() => {
            addMarker(cafe.coords, `${cafe.name}\n${cafe.desc}`);
        }, index * 500);
    });
    
    setTimeout(() => {
        updateStatus('✅ Найдено 6 московских мест для спасения!', 'success');
    }, cafes.length * 500);
}

// Функция показа известных мест Москвы
function showMoscowPlaces() {
    if (!map) return;
    
    updateStatus('🏛️ Показываю известные места Москвы...', 'loading');
    
    const moscowPlaces = [
        {
            coords: [37.6230, 55.7539], // Красная площадь
            name: '🏛️ Красная площадь',
            desc: 'Тут Минин и Пожарский стояли'
        },
        {
            coords: [37.6173, 55.7517], // Кремль
            name: '🏰 Московский Кремль',
            desc: 'Тут Путин работает'
        },
        {
            coords: [37.6049, 55.7413], // Парк Горького
            name: '🌳 Парк Горького',
            desc: 'Тут все бегают и катаются на великах'
        },
        {
            coords: [37.6558, 55.7903], // ВДНХ
            name: '🎪 ВДНХ',
            desc: 'Тут фонтан и ракета'
        },
        {
            coords: [37.6790, 55.7241], // МГУ
            name: '🎓 МГУ',
            desc: 'Тут умные люди'
        },
        {
            coords: [37.5345, 55.8304], // Сколково
            name: '💡 Сколково',
            desc: 'Тут инновации и стартапы'
        },
        {
            coords: [37.5530, 55.7030], // Москва-Сити
            name: '🏙️ Москва-Сити',
            desc: 'Тут небоскребы и богатые'
        },
        {
            coords: [37.6184, 55.7337], // Храм Христа Спасителя
            name: '⛪ Храм Христа Спасителя',
            desc: 'Тут молятся за успешный деплой'
        }
    ];
    
    // Очищаем старые маркеры
    markers.forEach(marker => {
        try {
            marker.destroy();
        } catch (error) {
            console.error('Ошибка удаления маркера:', error);
        }
    });
    markers = [];
    
    // Добавляем новые маркеры
    moscowPlaces.forEach((place, index) => {
        setTimeout(() => {
            addMarker(place.coords, `${place.name}\n${place.desc}`);
        }, index * 300);
    });
    
    // Центрируем карту на Москве
    map.setCenter(moscow);
    map.setZoom(11);
    
    setTimeout(() => {
        updateStatus('✅ Показаны известные места Москвы!', 'success');
    }, moscowPlaces.length * 300);
}

// Функция сброса карты
function resetMap() {
    if (!map) return;
    
    if (confirm('Точно сбросить карту? Все маркеры пропадут!')) {
        // Удаляем все маркеры
        markers.forEach(marker => {
            try {
                marker.destroy();
            } catch (error) {
                console.error('Ошибка удаления маркера:', error);
            }
        });
        markers = [];
        
        // Возвращаем карту в начальное положение - МОСКВА!
        map.setCenter(moscow);
        map.setZoom(13);
        
        // Добавляем начальный маркер в МОСКВЕ
        setTimeout(() => {
            addMarker(moscow, '🔄 Карта сброшена! Начинаем заново в Москве!');
        }, 500);
        
        updateStatus('🗑️ Карта очищена! Начинаем сначала в Москве!', 'success');
    }
}

// Плавная прокрутка для навигации
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Инициализация сайта с картой МОСКВЫ...');
    
    // Инициализируем карту
    initMap();
    
    // Инициализируем секцию маршрута
    initRouteSection();
    
    // Назначаем обработчики кнопок карты
    document.getElementById('add-marker-btn').addEventListener('click', function() {
        addMarker();
    });
    
    document.getElementById('find-cafe-btn').addEventListener('click', findCafe);
    document.getElementById('moscow-places-btn').addEventListener('click', showMoscowPlaces);
    document.getElementById('reset-map-btn').addEventListener('click', resetMap);
    
    // Обработчики для кнопок в герое
    document.querySelector('.btn-primary').addEventListener('click', function() {
        updateStatus('🤷‍♀️ Чук нежно нет - и правда ничего нет!', 'loading');
        setTimeout(() => {
            updateStatus('Но маршрут и карта МОСКВЫ работают! 🎉', 'success');
        }, 2000);
    });
    
    document.querySelector('.btn-secondary').addEventListener('click', function() {
        document.querySelector('#about').scrollIntoView({
            behavior: 'smooth'
        });
    });
    
    console.log('✅ Сайт с картой МОСКВЫ и маршрутом инициализирован! Удачи на хакатоне!');
});

// Глобальные функции для отладки
window.debugMap = function() {
    console.log('🔧 Отладочная информация:');
    console.log('- Карта:', map ? '✅ Загружена' : '❌ Не загружена');
    console.log('- Маркеры:', markers.length);
    console.log('- API ключ:', API_KEY);
    console.log('- Центр карты:', moscow);
    console.log('- Данные маршрута:', routeData);
};

// Автоматический вызов отладки при ошибках
window.onerror = function(message, source, lineno, colno, error) {
    console.error('💥 Глобальная ошибка:', error);
    updateStatus('💥 Произошла ошибка: ' + message, 'error');
};