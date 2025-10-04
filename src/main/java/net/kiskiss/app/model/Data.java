package net.kiskiss.app.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import net.kiskiss.app.api.Point;

import java.util.HashMap;

@Getter
@AllArgsConstructor
public class Data {

    private final Point point;

    private final HashMap<PriorityType, Integer> priority;

    private final int minutes;

}
