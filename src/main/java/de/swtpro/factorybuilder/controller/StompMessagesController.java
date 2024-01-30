package de.swtpro.factorybuilder.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class StompMessagesController {

    
    @Autowired
    SimpMessagingTemplate simpMessagingTemplate;

    @MessageMapping("/messaging")
    @SendTo("/info/{factoryId}")
    public Message send(final Message message) throws Exception{
        return message; 
    }

}