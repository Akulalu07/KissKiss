package main

import (

	"github.com/labstack/echo/v4"
)

func main() {
	e := echo.New()

	e.Static("/", "static")

	e.GET("/", func(c echo.Context) error {
		return c.File("static/index.html")
	})

	e.Logger.Fatal(e.Start("0.0.0.0:8081"))
}
