package com.teknex.crm.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {
    
    @Bean
    public NewTopic salesExecutiveMatchTopic() {
        return TopicBuilder.name("sales-executive-match-request")
                .partitions(1)
                .replicas(1)
                .build();
    }
    
    @Bean
    public NewTopic salesExecutiveMatchResponseTopic() {
        return TopicBuilder.name("sales-executive-match-response")
                .partitions(1)
                .replicas(1)
                .build();
    }
    
    @Bean
    public NewTopic healthScoreTopic() {
        return TopicBuilder.name("health-score-request")
                .partitions(1)
                .replicas(1)
                .build();
    }
    
    @Bean
    public NewTopic healthScoreResponseTopic() {
        return TopicBuilder.name("health-score-response")
                .partitions(1)
                .replicas(1)
                .build();
    }
}
