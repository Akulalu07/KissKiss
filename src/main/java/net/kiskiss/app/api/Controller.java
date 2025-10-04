package net.kiskiss.app.api;

import net.kiskiss.app.model.Data;
import net.kiskiss.app.route.Alcorithm;
import net.kiskiss.app.route.Route;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*")
public class Controller {

    private final Alcorithm algorithm;

    public Controller() {
        this.algorithm = new Alcorithm();
    }

    @PostMapping("/api/route")
    public ResponseEntity<Route> getPoint(@RequestBody Data data){
        return ResponseEntity.ok().body(algorithm.getRoute(data));
    }

}
