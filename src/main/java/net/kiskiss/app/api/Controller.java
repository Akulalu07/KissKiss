package net.kiskiss.app.api;

import net.kiskiss.app.model.Data;
import net.kiskiss.app.route.Algorithm;
import net.kiskiss.app.route.Route;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*")
public class Controller {

    private final Algorithm algorithm;

    public Controller() {
        this.algorithm = new Algorithm();
    }

    @PostMapping("/api/route")
    public ResponseEntity<Route> getPoint(@RequestBody Data data){
        System.out.println(data.toString());
        System.out.println(data.getPoint().toString());

        return ResponseEntity.ok().body(algorithm.getRoute(data));
    }

}
