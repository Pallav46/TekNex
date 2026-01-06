package com.teknex.crm.controller;

import com.teknex.crm.dto.ChatMessageRequest;
import com.teknex.crm.model.Chat;
import com.teknex.crm.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
@CrossOrigin(origins = "*")
public class ChatController {
    
    @Autowired
    private ChatService chatService;
    
    @GetMapping("/deal/{dealId}")
    public ResponseEntity<List<Chat>> getChatsByDealId(@PathVariable String dealId) {
        List<Chat> chats = chatService.getChatsByDealId(dealId);
        return ResponseEntity.ok(chats);
    }
    
    @GetMapping("/deal/{dealId}/sales")
    public ResponseEntity<Chat> getSalesExecutiveChat(@PathVariable String dealId) {
        Chat chat = chatService.getSalesExecutiveChatByDealId(dealId);
        return ResponseEntity.ok(chat);
    }
    
    @PostMapping("/message")
    public ResponseEntity<Chat> addMessage(@Valid @RequestBody ChatMessageRequest request) {
        Chat chat = chatService.addMessage(request);
        return ResponseEntity.ok(chat);
    }
    
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Chat>> getChatsByCustomer(@PathVariable Long customerId) {
        List<Chat> chats = chatService.getChatsByCustomer(customerId);
        return ResponseEntity.ok(chats);
    }
    
    @GetMapping("/sales-executive/{salesExecutiveId}")
    public ResponseEntity<List<Chat>> getChatsBySalesExecutive(@PathVariable Long salesExecutiveId) {
        List<Chat> chats = chatService.getChatsBySalesExecutive(salesExecutiveId);
        return ResponseEntity.ok(chats);
    }
}
