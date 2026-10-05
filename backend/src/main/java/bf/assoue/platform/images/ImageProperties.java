package bf.assoue.platform.images;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.EnvironmentAware;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Dossier de stockage configurable par {@code ASSOUE_IMAGES_DIR}. En production
 * le chemin absolu est obligatoire et le dossier doit déjà exister (volume à
 * monter, voir README) : sinon échec clair au démarrage. Hors production, le
 * dossier est créé s'il manque (dev, tests) : seul un chemin inexploitable échoue.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "assoue.images")
public class ImageProperties implements EnvironmentAware {

    private Path dossier = Path.of("uploads");
    private int largeurMax = 9000;
    private int hauteurMax = 9000;
    private long pixelsMax = 50_000_000L;
    private int tailleCoteMax = 1600;

    private Environment environnement;

    @Override
    public void setEnvironment(Environment environnement) {
        this.environnement = environnement;
    }

    @jakarta.annotation.PostConstruct
    void verifier() {
        boolean prod = environnement != null && environnement.acceptsProfiles(Profiles.of("prod"));
        if (prod && !dossier.isAbsolute()) {
            throw new IllegalStateException(
                    "ASSOUE_IMAGES_DIR doit être un chemin absolu en production (volume à monter, voir README).");
        }
        if (!Files.isDirectory(dossier)) {
            if (prod) {
                throw new IllegalStateException(
                        "Dossier d'images introuvable : " + dossier + " (montez le volume, voir README).");
            }
            try {
                Files.createDirectories(dossier);
            } catch (java.io.IOException ex) {
                throw new IllegalStateException("Dossier d'images impossible à créer : " + dossier, ex);
            }
        }
        if (!Files.isWritable(dossier)) {
            throw new IllegalStateException("Dossier d'images non accessible en écriture : " + dossier);
        }
    }
}
