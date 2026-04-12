package com.trafficcam.mng.common.config

import com.trafficcam.mng.common.exception.UnauthorizedException
import com.trafficcam.mng.common.security.JwtTokenProvider
import org.springframework.context.annotation.Configuration
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.config.ChannelRegistration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import org.springframework.messaging.support.MessageHeaderAccessor
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer

@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig(
    private val jwtTokenProvider: JwtTokenProvider,
) : WebSocketMessageBrokerConfigurer {

    override fun configureMessageBroker(registry: MessageBrokerRegistry) {
        registry.enableSimpleBroker("/topic", "/user")
        registry.setApplicationDestinationPrefixes("/app")
        registry.setUserDestinationPrefix("/user")
    }

    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*")
            .withSockJS()
    }

    override fun configureClientInboundChannel(registration: ChannelRegistration) {
        registration.interceptors(object : ChannelInterceptor {
            override fun preSend(message: Message<*>, channel: MessageChannel): Message<*>? {
                val accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor::class.java)
                    ?: return message

                if (StompCommand.CONNECT == accessor.command) {
                    val token = accessor.getFirstNativeHeader("Authorization")?.removePrefix("Bearer ")
                    if (token.isNullOrBlank() || !jwtTokenProvider.validateToken(token)) {
                        throw UnauthorizedException("WS_INVALID_TOKEN", "Invalid or missing token")
                    }
                    accessor.sessionAttributes?.put("userId", jwtTokenProvider.getUserIdFromToken(token))
                    accessor.sessionAttributes?.put("role", jwtTokenProvider.getRoleFromToken(token))
                }

                if (StompCommand.SUBSCRIBE == accessor.command) {
                    val destination = accessor.destination ?: return message
                    val userId = accessor.sessionAttributes?.get("userId") as? String
                    val role = accessor.sessionAttributes?.get("role") as? String
                    if (userId == null) throw UnauthorizedException("WS_NO_SESSION", "Not authenticated")

                    val notifPrefix = "/topic/notifications/"
                    if (destination.startsWith(notifPrefix)) {
                        val targetUserId = destination.removePrefix(notifPrefix)
                        val isAdmin = role in listOf("SYSTEM_ADMIN", "SUPER_ADMIN", "ADMIN")
                        if (targetUserId != userId && !isAdmin) {
                            throw UnauthorizedException("WS_FORBIDDEN", "Cannot subscribe to other user's notifications")
                        }
                    }
                }

                return message
            }
        })
    }
}
