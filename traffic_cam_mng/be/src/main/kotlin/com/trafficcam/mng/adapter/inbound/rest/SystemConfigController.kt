package com.trafficcam.mng.adapter.inbound.rest

import com.trafficcam.mng.application.service.ConfigResponse
import com.trafficcam.mng.application.service.SystemConfigService
import com.trafficcam.mng.common.response.ApiResponse
import com.trafficcam.mng.common.security.UserPrincipal
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/system-config")
class SystemConfigController(private val configService: SystemConfigService) {

    @GetMapping
    fun getAll(): ApiResponse<Map<String, List<ConfigResponse>>> =
        ApiResponse.ok(configService.getAll(), "CONFIG_LIST", "Config retrieved")

    @GetMapping("/{key}")
    fun getByKey(@PathVariable key: String): ApiResponse<ConfigResponse> =
        ApiResponse.ok(configService.getByKey(key), "CONFIG_DETAIL", "Config retrieved")

    @PutMapping("/{key}")
    fun update(
        @AuthenticationPrincipal p: UserPrincipal,
        @PathVariable key: String,
        @RequestBody body: Map<String, String>,
    ): ApiResponse<ConfigResponse> =
        ApiResponse.ok(configService.update(key, body["value"] ?: "", p.userId), "CONFIG_UPDATED", "Config updated")

    @GetMapping("/public/enabled-sources")
    fun enabledSources(): ApiResponse<List<String>> =
        ApiResponse.ok(configService.getEnabledSources(), "CONFIG_SOURCES", "Enabled sources")

    @GetMapping("/public/oauth-providers")
    fun oauthProviders(): ApiResponse<Map<String, Boolean>> =
        ApiResponse.ok(configService.getOauthProviders(), "CONFIG_OAUTH", "OAuth providers")

    @GetMapping("/public/firebase")
    fun firebase(): ApiResponse<Map<String, String>> =
        ApiResponse.ok(configService.getFirebaseConfig(), "CONFIG_FIREBASE", "Firebase config")
}
