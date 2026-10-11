package bf.assoue.platform.common.security;

import bf.assoue.platform.common.exception.ErreurApi;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

import java.io.IOException;

/**
 * Sans token ou token invalide/expiré sur une route protégée : 401 JSON au
 * format ErreurApi (RFC 6750, Bearer). Les routes publiques (GET catalogue,
 * images, événements...) ne passent jamais ici : le filtre laisse la requête
 * continuer non authentifiée et le permitAll répond 200.
 * /api/auth/login garde ses 401/423 métier via GlobalExceptionHandler.
 */
@Component
@RequiredArgsConstructor
public class EntreeAuthentification implements AuthenticationEntryPoint {

    private final ObjectMapper mapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException ex) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("WWW-Authenticate", "Bearer");
        mapper.writeValue(response.getOutputStream(), ErreurApi.de(401, "Authentification requise."));
    }
}
