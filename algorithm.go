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

	"go.uber.org/zap"
)

var sugar *zap.SugaredLogger

// инициализация логгера (вызвать до старта HTTP‑сервера)
func init() {
	logger, _ := zap.NewProduction()
	sugar = logger.Sugar()
}

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
			sugar.Infow("Пробуем приоритет", "index", idx, "type", typeStr, "alias", alias)

			name := findLocationByType(alias, last)
			if name == "" {
				sugar.Warnw("findLocationByType ничего не вернул", "category", alias)
				continue
			}

			next := getPointFromName(name, data.City, last)
			if next.X < 0 || next.Y < 0 {
				continue
			}

			skip := false
			for _, v := range visited {
				if distanceMeters(v, next) < 50 {
					skip = true
					break
				}
			}
			if skip {
				sugar.Infow("Точка уже посещалась — пропускаем", "name", name, "coords", next)
				continue
			}

			dist, mins := routeSegmentInfo(last, next, data.Speed)
			sugar.Infow("Сегмент", "distance_m", dist, "duration_min", mins)

			if mins > timeLeft {
				sugar.Infow("Не помещается во время", "alias", alias, "remain_min", timeLeft)
				continue
			}

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
			sugar.Infow("Приоритеты закончились или нет времени",
				"remain_min", timeLeft,
				"points", len(route.Points))
			break
		}
	}

	// кольцевой маршрут
	if data.Loop && len(route.Points) > 1 {
		start := data.Point
		last := route.Points[len(route.Points)-1]
		backDist, backMins := routeSegmentInfo(last, start, data.Speed)
		sugar.Infow("Дорога назад", "distance_m", backDist, "duration_min", backMins)

		if backMins <= timeLeft {
			route.Points = append(route.Points, start)
			totalDistance += backDist
			totalTime += backMins
			timeLeft -= backMins
			sugar.Info("Кольцо замкнуто — добавлена стартовая точка")
		} else {
			sugar.Warn("Времени на обратный путь не хватило — кольцо не замкнуто")
		}
	}

	sugar.Infow("Результат маршрута",
		"points", len(route.Points),
		"distance_km", totalDistance/1000,
		"duration_min", totalTime,
		"time_left_min", timeLeft,
	)

	return route
}

// ---------- ПОИСК ОБЪЕКТОВ ----------

func findLocationByType(priorityType string, start Point) string {
	base := "https://catalog.api.2gis.com/3.0/items"
	params := url.Values{}
	params.Set("q", priorityType)
	params.Set("region_id", "32")
	params.Set("location", fmt.Sprintf("%f,%f", start.Y, start.X))
	params.Set("radius", "10000")
	params.Set("suggest_type", "object")
	params.Set("key", "e50d3992-8076-47d8-bc3c-9add5a142f20")

	reqURL := fmt.Sprintf("%s?%s", base, params.Encode())
	resp, err := http.Get(reqURL)
	if err != nil {
		sugar.Errorw("Запрос findLocationByType", "error", err)
		return ""
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		sugar.Errorw("HTTP", "status", resp.StatusCode, "body", string(body))
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
		sugar.Errorw("Парсинг findLocationByType", "error", err)
		return ""
	}
	if len(parsed.Result.Items) > 0 {
		return parsed.Result.Items[0].Name
	}
	return ""
}

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
		sugar.Errorw("Запрос getPointFromName", "error", err)
		return Point{X: -1, Y: -1}
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		sugar.Errorw("HTTP getPointFromName", "status", resp.StatusCode, "body", string(body))
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
		sugar.Errorw("Парсинг getPointFromName", "error", err)
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

// ---------- РАСЧЁТ СЕГМЕНТОВ ----------

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
		sugar.Errorw("Routing API", "error", err)
		return 0, 0
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		sugar.Errorw("Routing API HTTP", "status", resp.StatusCode, "body", string(raw))
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
		sugar.Errorw("Парсинг Routing API", "error", err)
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
	sugar.Warn("Пустой ответ Routing API")
	return 0, 0
}

// ---------- МАТЕМАТИКА ----------

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

func haversine(a, b Point) float64 {
	return distanceMeters(a, b)
}
