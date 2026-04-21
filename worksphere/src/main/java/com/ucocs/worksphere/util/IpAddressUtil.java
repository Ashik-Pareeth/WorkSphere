package com.ucocs.worksphere.util;

import jakarta.servlet.http.HttpServletRequest;
import lombok.experimental.UtilityClass;

/**
 * Utility for extracting client IP address from HTTP requests.
 * Checks X-Forwarded-For and X-Real-IP headers before falling back to remote
 * address.
 */
@UtilityClass
public class IpAddressUtil {

    public String getClientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        // Check X-Forwarded-For header (proxy/load balancer)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        // Check X-Real-IP header
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        // Fall back to remote address
        return request.getRemoteAddr();
    }
}
