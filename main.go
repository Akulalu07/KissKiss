package main

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

func main() {
	e := echo.New()

	e.Static("/", "static")

	e.GET("/", func(c echo.Context) error {
		return c.File("static/index.html")
	})
	e.POST("/api/route", func(c echo.Context) error {
		var data Data
		if err := c.Bind(&data); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		route := getRoute(data)
		return c.JSON(http.StatusOK, route)
	})

	e.Logger.Fatal(e.Start("0.0.0.0:8080"))
}
