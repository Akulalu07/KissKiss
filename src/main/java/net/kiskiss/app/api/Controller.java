package net.kiskiss.app.api;

import net.kiskiss.app.model.Data;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*")
public class Controller {

    @PostMapping("/api/route")
    public void getPoint(@RequestBody Data point){
        System.out.println(point.toString());
        System.out.println(point.getPoint().getX());
        System.out.println(point.getPoint().getY());
    }

}
