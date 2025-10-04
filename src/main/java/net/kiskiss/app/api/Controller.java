package net.kiskiss.app.api;

import net.kiskiss.app.model.Data;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class Controller {

    @PostMapping("/api/route")
    public void getPoint(@RequestBody Data point){
        System.out.println(point.toString());
    }

}
