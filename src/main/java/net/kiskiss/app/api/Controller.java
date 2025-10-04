package net.kiskiss.app.api;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class Controller {

    @PostMapping
    public void getPoint(@RequestBody Point point){
        System.out.println(point);
    }

}
