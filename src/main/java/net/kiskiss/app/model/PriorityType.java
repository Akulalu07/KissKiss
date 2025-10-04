package net.kiskiss.app.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum PriorityType {

    @JsonProperty("PEDESTRIAN") PEDESTRIAN,
    @JsonProperty("FOOD") FOOD,
    @JsonProperty("GREEN_VALLEY") GREEN_VALLEY,
    @JsonProperty("ATTRACTIONS") ATTRACTIONS,
    @JsonProperty("MODERN_ARCHITECTURE") MODERN_ARCHITECTURE

}