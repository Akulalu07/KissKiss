package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"math/rand"
	"net/http"
	"net/url"
	"time"
)

// getRoute — основной маршрутный алгоритм
func getRoute(data Data) Route {
	rand.Seed(time.Now().UnixNano())

	route := Route{Points: []Point{data.Point}}
	timeLeft := float64(data.Minutes)
	totalDistance := 0.0
	totalTime := 0.0

	priorityAlias := map[string]string{
		"PEDESTRIAN":          "Набережная",
		"FOOD":                "Кафе",
		"GREEN_VALLEY":        "Парк",
		"ATTRACTIONS":         "Памятник",
		"MODERN_ARCHITECTURE": "Торговый центр",
	}

	usedPriorities := make(map[string]bool)
	visited := []Point{data.Point}

	for {
		if timeLeft <= 0 {
			break
		}

		foundNext := false

		// пробуем приоритеты от 5 к 1
		for idx := 5; idx >= 1; idx-- {
			typeStr := data.Priority[fmt.Sprintf("%d", idx)]
			if usedPriorities[typeStr] {
				continue
			}

			alias := priorityAlias[typeStr]
			if alias == "" {
				alias = typeStr
			}

			last := route.Points[len(route.Points)-1]
			fmt.Printf("→ пробуем приоритет %d: %s (%s)\n", idx, typeStr, alias)

			name := findLocationByType(alias, last)
			if name == "" {
				fmt.Println("⚠️  findLocationByType ничего не вернул, пропускаем категорию")
				continue
			}

			next := getPointFromName(name, data.City, last)
			if next.X < 0 || next.Y < 0 {
				continue
			}

			// не идти в уже посещённые (±50 м)
			skip := false
			for _, v := range visited {
				if distanceMeters(v, next) < 50 {
					skip = true
					break
				}
			}
			if skip {
				fmt.Println("⚠️  Точка уже посещалась, пропускаем:", next)
				continue
			}

			dist, mins := routeSegmentInfo(last, next, data.Speed)
			fmt.Printf("⤷ сегмент: %.1f м, %.1f мин\n", dist, mins)
			if mins > timeLeft {
				fmt.Println("⤷ Не влезает во время — пропускаем", alias)
				continue
			}

			// всё ок — добавляем
			route.Points = append(route.Points, next)
			visited = append(visited, next)
			timeLeft -= mins
			totalDistance += dist
			totalTime += mins
			usedPriorities[typeStr] = true
			foundNext = true
			break
		}

		if !foundNext {
			fmt.Println("⏹️  Все приоритеты пройдены или не осталось времени — завершаем")
			break
		}
	}

	fmt.Printf("\n⏱️  Итог: %d точек, %.2f км, %.1f мин, остаток %.1f мин\n",
		len(route.Points),
		totalDistance/1000,
		totalTime,
		timeLeft,
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

// findLocationByType — поиск ближайшего объекта указанного типа (по России)
func findLocationByType(priorityType string, start Point) string {
	base := "https://catalog.api.2gis.com/3.0/items"

	params := url.Values{}
	params.Set("q", priorityType)
	params.Set("region_id", "32") // Россия
	params.Set("location", fmt.Sprintf("%f,%f", start.Y, start.X))
	params.Set("radius", "10000")
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

// getPointFromName — получение координат по названию в пределах России
func getPointFromName(name, city string, start Point) Point {
	if name == "" {
		return Point{X: -1, Y: -1}
	}

	base := "https://catalog.api.2gis.com/3.0/items"
	params := url.Values{}
	params.Set("q", fmt.Sprintf("%s %s", city, name))
	params.Set("region_id", "32")
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

	if len(parsed.Result.Items) == 0 {
		return Point{X: -1, Y: -1}
	}

	best := parsed.Result.Items[0]
	minD := math.MaxFloat64
	for _, it := range parsed.Result.Items {
		current := Point{X: it.Point.Lat, Y: it.Point.Lon}
		d := haversine(start, current)
		if d < minD {
			minD = d
			best = it
		}
	}
	p := best.Point
	return Point{X: p.Lat, Y: p.Lon}
}

// routeSegmentInfo — обращение к Routing API и возврат длины/времени сегмента
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
		length := parsed.Result[0].Length
		duration := parsed.Result[0].Duration / 60
		if duration == 0 {
			if speed == 0 {
				speed = 5
			}
			metersPerMinute := (float64(speed) * 1000) / 60
			duration = length / metersPerMinute
		}
		return length, duration
	}

	fmt.Println("⚠️  Routing API пустой ответ")
	return 0, 0
}

// distanceMeters — быстрый haversine в метрах
func distanceMeters(a, b Point) float64 {
	const R = 6371000.0
	lat1 := a.X * math.Pi / 180
	lat2 := b.X * math.Pi / 180
	dlat := (b.X - a.X) * math.Pi / 180
	dlon := (b.Y - a.Y) * math.Pi / 180
	sinDLat := math.Sin(dlat / 2)
	sinDLon := math.Sin(dlon / 2)
	h := sinDLat*sinDLat + math.Cos(lat1)*math.Cos(lat2)*sinDLon*sinDLon
	return 2 * R * math.Asin(math.Sqrt(h))
}

// haversine — просто alias
func haversine(a, b Point) float64 {
	return distanceMeters(a, b)
}
