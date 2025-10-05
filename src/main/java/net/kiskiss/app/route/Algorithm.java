package net.kiskiss.app.route;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.kiskiss.app.api.Point;
import net.kiskiss.app.model.Data;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;

public class Algorithm {

    private static final String API_KEY = "e50d3992-8076-47d8-bc3c-9add5a142f20";
    private static final String ITEMS_URL = "https://catalog.api.2gis.com/3.0/items";
    private static final String ROUTING_URL = "https://routing.api.2gis.com/routing/7.0.0/global";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();
    private final Random random = new Random();

    private final Map<String, String> priorityAlias = Map.of(
            "PEDESTRIAN", "Набережная",
            "FOOD", "Кафе",
            "GREEN_VALLEY", "Парк",
            "ATTRACTIONS", "Памятник",
            "MODERN_ARCHITECTURE", "Торговый центр"
    );

    public Route getRoute(Data data) {
        random.setSeed(System.currentTimeMillis());

        Route route = new Route();
        Point current = data.getPoint();
        route.addPoint(current);

        int timeLeft = data.getMinutes();

        int priorityIndex = 5;
        boolean isPriorityLessThanZero = false;

        while (timeLeft > 0) {
            if (isPriorityLessThanZero) {
                priorityIndex = random.nextInt(5) + 1;
            }

            String typeStr = String.valueOf(data.getPriority().get(String.valueOf(priorityIndex)));
            Point last = route.getPoints().get(route.getPoints().size() - 1);

            String queryWord = priorityAlias.getOrDefault(typeStr, typeStr);

            String name = findLocationByType(queryWord, last);

            if (name.isEmpty()) {
                priorityIndex--;
                if (priorityIndex <= 0) isPriorityLessThanZero = true;
                continue;
            }

            Point next = getPointFromName(name, data.getCity());

            double[] segmentInfo = route(last, next, data.getSpeed());
            double distance = segmentInfo[0];
            double travelMinutes = segmentInfo[1];

            timeLeft -= (int) travelMinutes;

            if (timeLeft > 0) {
                route.addPoint(next);
            } else {
                break;
            }

            priorityIndex--;
            if (priorityIndex <= 0) isPriorityLessThanZero = true;
        }

        return route;
    }

    private String findLocationByType(String query, Point start) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(ITEMS_URL)
                .queryParam("q", query)
                .queryParam("location", start.getY() + "," + start.getX())
                .queryParam("suggest_type", "object")
                .queryParam("key", API_KEY);

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(builder.toUriString(), String.class);
            if (!response.getStatusCode().is2xxSuccessful()) return "";

            JsonNode items = mapper.readTree(response.getBody()).path("result").path("items");
            if (items.isArray() && items.size() > 0) {
                return items.get(0).path("name").asText("");
            }
        } catch (Exception ignored) {
        }
        return "";
    }

    private Point getPointFromName(String name, String city) {
        if (name.isEmpty()) return new Point(-1, -1);

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(ITEMS_URL)
                .queryParam("q", city + " " + name)
                .queryParam("fields", "items.point")
                .queryParam("key", API_KEY);

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(builder.toUriString(), String.class);
            if (!response.getStatusCode().is2xxSuccessful()) return new Point(-1, -1);

            JsonNode items = mapper.readTree(response.getBody()).path("result").path("items");
            if (items.isArray() && items.size() > 0) {
                JsonNode pointNode = items.get(0).path("point");
                double lat = pointNode.path("lat").asDouble(-1);
                double lon = pointNode.path("lon").asDouble(-1);
                return new Point(lat, lon);
            }
        } catch (Exception ignored) {
        }

        return new Point(-1, -1);
    }

    private double[] route(Point start, Point end, int speed) {
        Map<String, Object> body = new HashMap<>();
        List<Map<String, Object>> points = new ArrayList<>();
        points.add(Map.of("type", "stop", "lon", start.getY(), "lat", start.getX()));
        points.add(Map.of("type", "stop", "lon", end.getY(), "lat", end.getX()));
        body.put("points", points);
        body.put("transport", "walking");
        body.put("params", Map.of("pedestrian", Map.of("use_instructions", false)));
        body.put("filters", List.of("dirt_road", "ferry", "highway", "ban_stairway"));
        body.put("output", "summary");
        body.put("locale", "ru");
        body.put("need_altitudes", true);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-App-Id", "ru.gishackathon.app03");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(ROUTING_URL)
                    .queryParam("key", API_KEY);

            ResponseEntity<String> response = restTemplate.exchange(
                    builder.toUriString(), HttpMethod.POST, entity, String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) return new double[]{0, 0};

            JsonNode result = mapper.readTree(response.getBody());
            if ("OK".equals(result.path("status").asText()) && result.path("result").size() > 0) {
                double length = result.path("result").get(0).path("length").asDouble();
                double duration = result.path("result").get(0).path("duration").asDouble() / 60.0;
                if (duration == 0) {
                    if (speed == 0) speed = 5;
                    duration = length / ((speed * 1000.0) / 60.0);
                }
                return new double[]{length, duration};
            }
        } catch (Exception ignored) {
        }
        return new double[]{0, 0};
    }

}
