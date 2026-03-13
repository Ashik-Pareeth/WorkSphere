package com.ucocs.worksphere.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String secretKey;

    public Key getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String userName, List<String> roles) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", roles); // Store as a JSON Array: ["ROLE_MANAGER", "ROLE_ADMIN"]
        return createToken(claims, userName);
    }

    private String createToken(Map<String, Object> claims, String userName) {
        return Jwts.builder()
                .setClaims(claims) // <--- Add the map here!
                .setSubject(userName)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10)) // 10 hours
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateOfferToken(String email, String offerId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("offerId", offerId);
        claims.put("type", "OFFER_RESPONSE");
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24 * 7)) // 7 days
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Boolean validateOfferToken(String token, String expectedEmail, String expectedOfferId) {
        try {
            Claims claims = extractAllClaims(token);
            String tokenEmail = claims.getSubject();
            String tokenOfferId = claims.get("offerId", String.class);
            String tokenType = claims.get("type", String.class);

            return "OFFER_RESPONSE".equals(tokenType) &&
                    expectedEmail.equals(tokenEmail) &&
                    expectedOfferId.equals(tokenOfferId) &&
                    !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignKey())
                .build().parseClaimsJws(token)
                .getBody();
    }

    public String extractUserName(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUserName(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}
