//Данные городов России с координатами центров

const citiesData = {
    "moscow": {
        name: "Москва",
        coordinates: { lat: 55.7558, lng: 37.6173 },
        center: [37.6173, 55.7558]
    },
    "saint-petersburg": {
        name: "Санкт-Петербург",
        coordinates: { lat: 59.9343, lng: 30.3351 },
        center: [30.3351, 59.9343]
    },
    "novosibirsk": {
        name: "Новосибирск",
        coordinates: { lat: 55.0084, lng: 82.9357 },
        center: [82.9357, 55.0084]
    },
    "yekaterinburg": {
        name: "Екатеринбург",
        coordinates: { lat: 56.8389, lng: 60.6057 },
        center: [60.6057, 56.8389]
    },
    "kazan": {
        name: "Казань",
        coordinates: { lat: 55.7961, lng: 49.1064 },
        center: [49.1064, 55.7961]
    },
    "nizhny-novgorod": {
        name: "Нижний Новгород",
        coordinates: { lat: 56.3269, lng: 44.0059 },
        center: [44.0059, 56.3269]
    },
    "chelyabinsk": {
        name: "Челябинск",
        coordinates: { lat: 55.1644, lng: 61.4368 },
        center: [61.4368, 55.1644]
    },
    "samara": {
        name: "Самара",
        coordinates: { lat: 53.1959, lng: 50.1002 },
        center: [50.1002, 53.1959]
    },
    "omsk": {
        name: "Омск",
        coordinates: { lat: 54.9885, lng: 73.3242 },
        center: [73.3242, 54.9885]
    },
    "rostov-on-don": {
        name: "Ростов-на-Дону",
        coordinates: { lat: 47.2225, lng: 39.7188 },
        center: [39.7188, 47.2225]
    },
    "ufa": {
        name: "Уфа",
        coordinates: { lat: 54.7351, lng: 55.9587 },
        center: [55.9587, 54.7351]
    },
    "krasnoyarsk": {
        name: "Красноярск",
        coordinates: { lat: 56.0153, lng: 92.8932 },
        center: [92.8932, 56.0153]
    },
    "voronezh": {
        name: "Воронеж",
        coordinates: { lat: 51.6615, lng: 39.2003 },
        center: [39.2003, 51.6615]
    },
    "perm": {
        name: "Пермь",
        coordinates: { lat: 58.0105, lng: 56.2294 },
        center: [56.2294, 58.0105]
    },
    "volgograd": {
        name: "Волгоград",
        coordinates: { lat: 48.7194, lng: 44.5018 },
        center: [44.5018, 48.7194]
    },
    "krasnodar": {
        name: "Краснодар",
        coordinates: { lat: 45.0355, lng: 38.9753 },
        center: [38.9753, 45.0355]
    },
    "saratov": {
        name: "Саратов",
        coordinates: { lat: 51.5336, lng: 46.0343 },
        center: [46.0343, 51.5336]
    },
    "tyumen": {
        name: "Тюмень",
        coordinates: { lat: 57.1530, lng: 65.5343 },
        center: [65.5343, 57.1530]
    },
    "tolyatti": {
        name: "Тольятти",
        coordinates: { lat: 53.5078, lng: 49.4204 },
        center: [49.4204, 53.5078]
    },
    "izhevsk": {
        name: "Ижевск",
        coordinates: { lat: 56.8526, lng: 53.2115 },
        center: [53.2115, 56.8526]
    },
    "barnaul": {
        name: "Барнаул",
        coordinates: { lat: 53.3548, lng: 83.7699 },
        center: [83.7699, 53.3548]
    },
    "ulyanovsk": {
        name: "Ульяновск",
        coordinates: { lat: 54.3142, lng: 48.4031 },
        center: [48.4031, 54.3142]
    },
    "vladivostok": {
        name: "Владивосток",
        coordinates: { lat: 43.1155, lng: 131.8855 },
        center: [131.8855, 43.1155]
    },
    "yaroslavl": {
        name: "Ярославль",
        coordinates: { lat: 57.6261, lng: 39.8845 },
        center: [39.8845, 57.6261]
    },
    "irkutsk": {
        name: "Иркутск",
        coordinates: { lat: 52.2864, lng: 104.2807 },
        center: [104.2807, 52.2864]
    },
    "khabarovsk": {
        name: "Хабаровск",
        coordinates: { lat: 48.4802, lng: 135.0719 },
        center: [135.0719, 48.4802]
    },
    "makhachkala": {
        name: "Махачкала",
        coordinates: { lat: 42.9849, lng: 47.5047 },
        center: [47.5047, 42.9849]
    },
    "tomsk": {
        name: "Томск",
        coordinates: { lat: 56.4846, lng: 84.9482 },
        center: [84.9482, 56.4846]
    },
    "orenburg": {
        name: "Оренбург",
        coordinates: { lat: 51.7682, lng: 55.0969 },
        center: [55.0969, 51.7682]
    },
    "kemerovo": {
        name: "Кемерово",
        coordinates: { lat: 55.3547, lng: 86.0873 },
        center: [86.0873, 55.3547]
    },
    "sochi": {
        name: "Сочи",
        coordinates: { lat: 43.5855, lng: 39.7231 },
        center: [39.7231, 43.5855]
    },
    "vladimir": {
        name: "Владимир",
        coordinates: { lat: 56.1290, lng: 40.4066 },
        center: [40.4066, 56.1290]
    },
    "smolensk": {
        name: "Смоленск",
        coordinates: { lat: 54.7826, lng: 32.0453 },
        center: [32.0453, 54.7826]
    },
    "kursk": {
        name: "Курск",
        coordinates: { lat: 51.7304, lng: 36.1926 },
        center: [36.1926, 51.7304]
    },
    "kaliningrad": {
        name: "Калининград",
        coordinates: { lat: 54.7104, lng: 20.4522 },
        center: [20.4522, 54.7104]
    },
    "tver": {
        name: "Тверь",
        coordinates: { lat: 56.8587, lng: 35.9176 },
        center: [35.9176, 56.8587]
    },
    "lipetsk": {
        name: "Липецк",
        coordinates: { lat: 52.6088, lng: 39.5992 },
        center: [39.5992, 52.6088]
    },
    "penza": {
        name: "Пенза",
        coordinates: { lat: 53.1951, lng: 45.0183 },
        center: [45.0183, 53.1951]
    },
    "astrakhan": {
        name: "Астрахань",
        coordinates: { lat: 46.3497, lng: 48.0408 },
        center: [48.0408, 46.3497]
    },
    "kirov": {
        name: "Киров",
        coordinates: { lat: 58.6035, lng: 49.6680 },
        center: [49.6680, 58.6035]
    },
    "novokuznetsk": {
        name: "Новокузнецк",
        coordinates: { lat: 53.7576, lng: 87.1360 },
        center: [87.1360, 53.7576]
    },
    "tula": {
        name: "Тула",
        coordinates: { lat: 54.1931, lng: 37.6173 },
        center: [37.6173, 54.1931]
    },
    "sterlitamak": {
        name: "Стерлитамак",
        coordinates: { lat: 53.6306, lng: 55.9316 },
        center: [55.9316, 53.6306]
    },
    "kaluga": {
        name: "Калуга",
        coordinates: { lat: 54.5136, lng: 36.2612 },
        center: [36.2612, 54.5136]
    },
    "custom": {
        name: "Другой город",
        coordinates: { lat: 55.7558, lng: 37.6173 },
        center: [37.6173, 55.7558]
    }
};