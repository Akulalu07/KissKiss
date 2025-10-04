package net.kiskiss.app.route;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.kiskiss.app.api.Point;
import net.kiskiss.app.model.Data;
import net.kiskiss.app.model.PriorityType;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.Random;

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
            if (isPriorityLessThanZero)
                priorityIndex = new Random().nextInt(1, 5);

            Point nextDestination = getPointFromName(findLocationByType(priority.get(priorityIndex), route.getPoints().getLast()), data.getCity());

            System.out.println("КООРДИНАТЫ: " + route.getPoints().getLast().getX() + ", " + route.getPoints().getLast().getY());
            time -= timeBetweenTwoPoints(route.getPoints().getLast(), nextDestination, data.getSpeed());

            if (time > 0)
                route.addPoint(nextDestination);
            else break;

            if (--priorityIndex <= 0)
                isPriorityLessThanZero = true;
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
                    return items.get(new Random().nextInt(1, 5)).path("name").asText();
                } else {
                    return null;
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    private Point getPointFromName(String name, String city){
        RestTemplate restTemplate = new RestTemplate();

        String url = "https://catalog.api.2gis.com/3.0/items";

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                .queryParam("q", city + "," +  name)
                .queryParam("fields", "items.point")
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

                JsonNode items = root.path("result").path("items").path("point");
                if (items.isArray() && !items.isEmpty()) {
                    double lat = items.get(0).path("lat").asDouble();
                    double lon = items.get(0).path("lon").asDouble();
                    return new Point(lat, lon);
                } else {
                    return new Point(-1, -1);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return new Point(-1, -1);
    }

    private int timeBetweenTwoPoints(Point startPoint, Point endPoint, int speed) {
        RestTemplate restTemplate = new RestTemplate();

        String url = "https://routing.api.2gis.com/routing/7.0.0/global?key=e50d3992-8076-47d8-bc3c-9add5a142f20";

        String requestBody = String.format("""
                {
                  "points": [
                    {"type": "stop", "lon": %f, "lat": %f},
                    {"type": "stop", "lon": %f, "lat": %f}
                  ],
                  "locale": "ru",
                  "transport": "walking",
                  "route_mode": "fastest",
                  "traffic_mode": "jam"
                }
                """,
                startPoint.getX(), startPoint.getY(),
                endPoint.getX(), endPoint.getY()
        );

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-App-Id", "ru.gishackathon.app03");
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            String responseBody = response.getBody();
            if (responseBody == null || responseBody.isBlank()) {
                System.err.println("Routing API вернул пустой ответ. " +
                        "start=" + startPoint + " end=" + endPoint);
                return -1;
            }

            if (response.getStatusCode().is2xxSuccessful()) {
                ObjectMapper objectMapper = new ObjectMapper();
                JsonNode root = objectMapper.readTree(responseBody);

                if ("OK".equals(root.path("status").asText())) {
                    JsonNode result = root.path("result");
                    if (result.isArray() && !result.isEmpty()) {
                        return result.get(0).path("total_distance").asInt() / speed;
                    }
                } else {
                    System.err.println("Routing API error: " + responseBody);
                }
            } else {
                System.err.println("Routing API HTTP " + response.getStatusCode());
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return -1;
    }


}