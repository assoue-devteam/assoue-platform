package bf.assoue.platform.auth.service;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimiterIp {

    private final int maxRequetes;
    private final Duration fenetre;
    private final Map<String, Compteur> compteurs = new ConcurrentHashMap<>();

    public RateLimiterIp(MotDePasseOublieProperties proprietes) {
        this.maxRequetes = proprietes.getRateLimitIpMax();
        this.fenetre = Duration.ofSeconds(proprietes.getRateLimitIpFenetreSecondes());
    }

    public synchronized boolean autoriser(String ip) {
        nettoyer();
        Compteur compteur = compteurs.computeIfAbsent(ip, k -> new Compteur(Instant.now()));
        if (compteur.debut.plus(fenetre).isBefore(Instant.now())) {
            compteur.debut = Instant.now();
            compteur.nombre = 0;
        }
        if (compteur.nombre >= maxRequetes) {
            return false;
        }
        compteur.nombre++;
        return true;
    }

    private void nettoyer() {
        if (compteurs.size() > 1000) {
            Instant limite = Instant.now().minus(fenetre);
            compteurs.entrySet().removeIf(e -> e.getValue().debut.isBefore(limite));
        }
    }

    private static class Compteur {
        Instant debut;
        int nombre;

        Compteur(Instant debut) {
            this.debut = debut;
            this.nombre = 0;
        }
    }
}
