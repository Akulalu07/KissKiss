package net.kiskiss.app.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import net.kiskiss.app.api.Point;

import java.util.HashMap;

@Getter
@AllArgsConstructor
@lombok.Data
public class Data {

    private final Point point;

    private final HashMap<Integer, PriorityType> priority;

    private final int minutes;

    private final int speed;

    private final String city;

}