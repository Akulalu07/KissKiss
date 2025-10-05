package main

type Point struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type Data struct {
	Point    Point             `json:"point"`
	Priority map[string]string `json:"priority"`
	Minutes  int               `json:"minutes"`
	Speed    int               `json:"speed"`
	City     string            `json:"city"`
	Loop     bool              `json:"loop"`
}

type Route struct {
	Points []Point `json:"points"`
}
