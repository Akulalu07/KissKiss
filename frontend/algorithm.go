package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/url"
	"time"
)

// getRoute — основной алгоритм построения маршрута
func getRoute(data Data) Route {
	rand.Seed(time.Now().UnixNano())

	route := Route{Points: []Point{data.Point}}
	timeLeft := data.Minutes
	totalDistance := 0.0 // метры
	totalTime := 0.0     // минуты

	// словарь для подстановки «человеческих» русских названий
	priorityAlias := map[string]string{
		"PEDESTRIAN":          "Набережная",
		"FOOD":                "Кафе",
		"GREEN_VALLEY":        "Парк",
		"ATTRACTIONS":         "Памятник",
		"MODERN_ARCHITECTURE": "Торговый центр",
	}

	priorityIndex := 5
	isPriorityLessThanZero := false

	for timeLeft > 0 {
		if isPriorityLessThanZero {
			priorityIndex = rand.Intn(5) + 1
		}

		typeStr := data.Priority[fmt.Sprintf("%d", priorityIndex)]
		last := route.Points[len(route.Points)-1]

		// Берём alias на русском
		queryWord := priorityAlias[typeStr]
		if queryWord == "" {
			queryWord = typeStr // fallback: вдруг что‑то новое добавили
		}

		fmt.Printf("→ ищу тип: %s (%s)\n", typeStr, queryWord)
		name := findLocationByType(queryWord, last)
		fmt.Println("⤷ найдено имя:", name)
		if name == "" {
			fmt.Println("⚠️  findLocationByType ничего не вернул, пропускаем категорию")
			priorityIndex--
			if priorityIndex <= 0 {
				isPriorityLessThanZero = true
			}
			continue
		}

		next := getPointFromName(name, data.City)
		fmt.Printf("⤷ координаты: %.6f, %.6f\n", next.X, next.Y)

		distance, travelMinutes := routeSegmentInfo(last, next, data.Speed)
		fmt.Printf("⤷ сегмент: %.1f м, %.1f мин\n", distance, travelMinutes)

		timeLeft -= int(travelMinutes)
		totalDistance += distance
		totalTime += travelMinutes

		if timeLeft > 0 {
			route.Points = append(route.Points, next)
		} else {
			break
		}

		priorityIndex--
		if priorityIndex <= 0 {
			isPriorityLessThanZero = true
		}
	}

	fmt.Printf("\n⏱️  Итог: %d точек, %.2f км, %.1f мин\n",
		len(route.Points),
		totalDistance/1000,
		totalTime,
	)

	respPreview, _ := json.MarshalIndent(struct {
		Message  string  `json:"message"`
		Points   []Point `json:"points"`
		Distance float64 `json:"distance_km"`
		Duration float64 `json:"duration_min"`
	}{
		Message:  "✅ Маршрут построен успешно",
		Points:   route.Points,
		Distance: totalDistance / 1000,
		Duration: totalTime,
	}, "", "  ")
	fmt.Println("Ответ фронту:\n", string(respPreview))

	return route
}

// findLocationByType ищет имя ближайшего объекта нужного типа
func findLocationByType(priorityType string, start Point) string {
	base := "https://catalog.api.2gis.com/3.0/items"
	params := url.Values{}
	params.Set("q", priorityType)
	params.Set("location", fmt.Sprintf("%f,%f", start.Y, start.X))
	params.Set("suggest_type", "object")
	params.Set("key", "e50d3992-8076-47d8-bc3c-9add5a142f20")

	reqURL := fmt.Sprintf("%s?%s", base, params.Encode())
	fmt.Println("🌐 findLocationByType:", reqURL)

	resp, err := http.Get(reqURL)
	if err != nil {
		fmt.Println("Ошибка findLocationByType:", err)
		return ""
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		fmt.Println("HTTP", resp.Status)
		return ""
	}

	var parsed struct {
		Result struct {
			Items []struct {
				Name string `json:"name"`
			} `json:"items"`
		} `json:"result"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		fmt.Println("Ошибка парсинга findLocationByType:", err)
		return ""
	}
	if len(parsed.Result.Items) > 0 {
		return parsed.Result.Items[0].Name
	}
	return ""
}

// getPointFromName получает координаты по названию и городу
func getPointFromName(name, city string) Point {
	if name == "" {
		return Point{X: -1, Y: -1}
	}

	base := "https://catalog.api.2gis.com/3.0/items"
	params := url.Values{}
	params.Set("q", fmt.Sprintf("%s %s", city, name))
	params.Set("fields", "items.point")
	params.Set("key", "e50d3992-8076-47d8-bc3c-9add5a142f20")

	reqURL := fmt.Sprintf("%s?%s", base, params.Encode())
	resp, err := http.Get(reqURL)
	if err != nil {
		fmt.Println("Ошибка getPointFromName:", err)
		return Point{X: -1, Y: -1}
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		fmt.Println("HTTP", resp.Status)
		return Point{X: -1, Y: -1}
	}

	var parsed struct {
		Result struct {
			Items []struct {
				Point struct {
					Lat float64 `json:"lat"`
					Lon float64 `json:"lon"`
				} `json:"point"`
			} `json:"items"`
		} `json:"result"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		fmt.Println("Ошибка парсинга getPointFromName:", err)
		return Point{X: -1, Y: -1}
	}
	if len(parsed.Result.Items) > 0 {
		p := parsed.Result.Items[0].Point
		return Point{X: p.Lat, Y: p.Lon}
	}
	return Point{X: -1, Y: -1}
}

// routeSegmentInfo обращается к routing API и возвращает длину/время сегмента
func routeSegmentInfo(start, end Point, speed int) (float64, float64) {
	urlStr := "https://routing.api.2gis.com/routing/7.0.0/global?key=e50d3992-8076-47d8-bc3c-9add5a142f20"

	body := map[string]any{
		"points": []map[string]any{
			{"type": "stop", "lon": start.Y, "lat": start.X},
			{"type": "stop", "lon": end.Y, "lat": end.X},
		},
		"transport": "walking",
		"params": map[string]any{
			"pedestrian": map[string]bool{"use_instructions": false},
		},
		"filters":        []string{"dirt_road", "ferry", "highway", "ban_stairway"},
		"output":         "summary",
		"locale":         "ru",
		"need_altitudes": true,
	}
	jsonData, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, urlStr, bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-App-Id", "ru.gishackathon.app03")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Ошибка Routing API:", err)
		return 0, 0
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		fmt.Println("HTTP", resp.Status)
		return 0, 0
	}

	var parsed struct {
		Status string `json:"status"`
		Result []struct {
			Length   float64 `json:"length"`
			Duration float64 `json:"duration"`
		} `json:"result"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		fmt.Println("Ошибка парсинга Routing API:", err)
		return 0, 0
	}

	if parsed.Status == "OK" && len(parsed.Result) > 0 {
		length := parsed.Result[0].Length          // метры
		duration := parsed.Result[0].Duration / 60 // секунды → минуты
		if duration == 0 {
			if speed == 0 {
				speed = 5 // км/ч по умолчанию
			}
			metersPerMinute := (float64(speed) * 1000) / 60
			duration = length / metersPerMinute
		}
		return length, duration
	}

	fmt.Println("⚠️  Routing API пустой ответ")
	return 0, 0
}
