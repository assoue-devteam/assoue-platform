package bf.assoue.platform.common.security;

import bf.assoue.platform.auth.service.JwtService;
import bf.assoue.platform.auth.service.UtilisateurDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String PREFIXE_BEARER = "Bearer ";

    private final JwtService jwtService;
    private final UtilisateurDetailsService utilisateurDetailsService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String enTeteAuth = request.getHeader("Authorization");

        if (enTeteAuth == null || !enTeteAuth.startsWith(PREFIXE_BEARER)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = enTeteAuth.substring(PREFIXE_BEARER.length());

        try {
            String email = jwtService.extraireEmail(token);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = utilisateurDetailsService.loadUserByUsername(email);

                if (jwtService.estValide(token, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (io.jsonwebtoken.JwtException | IllegalArgumentException ex) {
            // Token invalide/expiré/malformé : on laisse la requête continuer non authentifiée,
            // les règles d'autorisation renverront 401/403 plus loin dans la chaîne.
        }

        filterChain.doFilter(request, response);
    }

}
