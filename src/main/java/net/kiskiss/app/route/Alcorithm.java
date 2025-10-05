package net.kiskiss.app.route;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Random;
import net.kiskiss.app.api.Point;
import net.kiskiss.app.model.Data;
import net.kiskiss.app.model.PriorityType;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

public class Alcorithm {

    public Route getRoute(Data data) {
        HashMap<Integer, PriorityType> priority = data.getPriority();

        Point startPoint = data.getPoint();

        Route route = new Route();
        route.addPoint(startPoint);
        int time = data.getMinutes();

        int priorityIndex = 5;
        boolean isPriorityLessThanZero = false;
        while (time > 0) {
            if (isPriorityLessThanZero) priorityIndex = new Random().nextInt(
                1,
                5
            );

            Point nextDestination = getPointFromName(
                findLocationByType(
                    priority.get(priorityIndex),
                    route.getPoints().getLast()
                ),
                data.getCity()
            );

            System.out.println(
                "КООРДИНАТЫ: " +
                    route.getPoints().getLast().getX() +
                    ", " +
                    route.getPoints().getLast().getY()
            );
            time -= timeBetweenTwoPoints(
                route.getPoints().getLast(),
                nextDestination,
                data.getSpeed()
            );

            if (time > 0) route.addPoint(nextDestination);
            else break;

            if (--priorityIndex <= 0) isPriorityLessThanZero = true;
        }

        return route;
    }

    private String findLocationByType(PriorityType type, Point startPoint) {
        RestTemplate restTemplate = new RestTemplate();

        String url = "https://catalog.api.2gis.com/3.0/items";

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
            .queryParam("q", type.getAlias())
            .queryParam("location", startPoint.getY() + "," + startPoint.getX())
            .queryParam("suggest_type", "object")
            .queryParam("key", "e50d3992-8076-47d8-bc3c-9add5a142f20")
            .queryParam("X-App-Id", "ru.gishackathon.app03");

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                builder.toUriString(),
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                String responseBody = response.getBody();

                ObjectMapper objectMapper = new ObjectMapper();
                JsonNode root = objectMapper.readTree(responseBody);

                JsonNode items = root.path("result").path("items");
                if (items.isArray() && !items.isEmpty()) {
                    return items.get(0).path("name").asText();
                } else {
                    return null;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    //    public static void main(String[] args) {
    //        findLocationByType(PriorityType.GREEN_VALLEY, new  Point(55.755800,37.617300)).var;
    //    }

    private Point getPointFromName(String name, String city) {
        if (name == null || name.isBlank()) return new Point(-1, -1);

        RestTemplate restTemplate = new RestTemplate();

        String url = "https://catalog.api.2gis.com/3.0/items";

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
            .queryParam("q", city + " " + name)
            .queryParam("fields", "items.point")
            .queryParam("key", "e50d3992-8076-47d8-bc3c-9add5a142f20")
            .queryParam("X-App-Id", "ru.gishackathon.app03");

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                builder.toUriString(),
                String.class
            );
            if (response.getStatusCode().is2xxSuccessful()) {
                ObjectMapper objectMapper = new ObjectMapper();
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode items = root.path("result").path("items");

                if (items.isArray() && !items.isEmpty()) {
                    JsonNode point = items.get(0).path("point");
                    double lat = point.path("lat").asDouble();
                    double lon = point.path("lon").asDouble();
                    return new Point(lat, lon);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return new Point(-1, -1);
    }

    private int timeBetweenTwoPoints(
        Point startPoint,
        Point endPoint,
        int speed
    ) {
        RestTemplate restTemplate = new RestTemplate();

        // Базовый URL роутинга 2GIS
        String url =
            "https://routing.api.2gis.com/routing/7.0.0/global?key=e50d3992-8076-47d8-bc3c-9add5a142f20";

        // Формируем тело запроса в том виде, как требует API 2GIS
        String requestBody = String.format(
            """
            {
                "points": [
                    {
                        "type": "walking",
                        "lon": %f,
                        "lat": %f
                    },
                    {
                        "type": "walking",
                        "lon": %f,
                        "lat": %f
                    }
                ],
                "transport": "walking",
                "params": {
                    "pedestrian": { "use_instructions": false }
                },
                "filters": [
                    "dirt_road",
                    "ferry",
                    "highway",
                    "ban_stairway"
                ],
                "output": "summary",
                "locale": "ru",
                "need_altitudes": true
            }
            """,
            startPoint.getX(),
            startPoint.getY(),
            endPoint.getX(),
            endPoint.getY()
        );

        // Заголовки для HTTP-запроса
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-App-Id", "ru.gishackathon.app03");

        // Объединяем тело и заголовки в единый объект запроса
        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        try {
            // Отправляем POST-запрос
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                String.class
            );

            String responseBody = response.getBody();

            if (responseBody == null || responseBody.isBlank()) {
                System.err.println(
                    "Routing API вернул пустой ответ. start=" +
                        startPoint +
                        " end=" +
                        endPoint
                );
                return -1;
            }

            if (response.getStatusCode().is2xxSuccessful()) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(responseBody);

                if ("OK".equals(root.path("status").asText())) {
                    JsonNode result = root.path("result");
                    if (result.isArray() && !result.isEmpty()) {
                        int lengthMeters = result.get(0).path("length").asInt();

                        // Преобразуем длину маршрута в примерное время
                        // speed — это твоя скорость (метров в минуту)
                        return lengthMeters / speed;
                    }
                } else {
                    System.err.println("Routing API error: " + responseBody);
                }
            } else {
                System.err.println(
                    "Routing API HTTP ошибка " + response.getStatusCode()
                );
            }
        } catch (Exception e) {
            System.err.println("Ошибка вызова Routing API:");
            e.printStackTrace();
        }

        return -1;
    }
}
