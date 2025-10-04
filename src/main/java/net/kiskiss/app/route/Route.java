package net.kiskiss.app.route;

import lombok.Getter;
import net.kiskiss.app.api.Point;

import java.util.LinkedList;

@Getter
public class Route {

    private final LinkedList<Point> points;

    public Route() {
        this.points = new  LinkedList<>();
    }

    public void addPoint(Point point) {
        this.points.add(point);
    }

}