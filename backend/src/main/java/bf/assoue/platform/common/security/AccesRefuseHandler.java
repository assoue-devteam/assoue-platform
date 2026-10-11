package bf.assoue.platform.common.security;

import bf.assoue.platform.common.exception.ErreurApi;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

import java.io.IOException;

/**
 * Authentifié mais rôle insuffisant : seul cas qui renvoie 403.
 * Un appel sans token (ou token expiré) passe par l'entry point (401), jamais ici.
 */
@Component
@RequiredArgsConstructor
public class AccesRefuseHandler implements AccessDeniedHandler {

    private final ObjectMapper mapper;

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException ex) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(response.getOutputStream(), ErreurApi.de(403, "Accès refusé : rôle insuffisant."));
    }
}
