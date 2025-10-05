package net.kiskiss.app.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public enum PriorityType {

    @JsonProperty("PEDESTRIAN") QUAY("Набережная"),
    @JsonProperty("FOOD") FOOD("Кафе"),
    @JsonProperty("GREEN_VALLEY") GREEN_VALLEY("Парк"),
    @JsonProperty("ATTRACTIONS") ATTRACTIONS("Памятник"),
    @JsonProperty("MODERN_ARCHITECTURE") MODERN_ARCHITECTURE("Торговый центр");

    private final String alias;

    PriorityType(String alias) {
        this.alias = alias;
    }

}