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
 * Dossier de stockage configurable par {@code ASSOUE_IMAGES_DIR}. Échec clair
 * au démarrage si le dossier n'existe pas ou n'est pas accessible en écriture ;
 * en production le chemin absolu est obligatoire (volume à monter, voir README).
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
        if (environnement != null && environnement.acceptsProfiles(Profiles.of("prod")) && !dossier.isAbsolute()) {
            throw new IllegalStateException(
                    "ASSOUE_IMAGES_DIR doit être un chemin absolu en production (volume à monter, voir README).");
        }
        if (!Files.isDirectory(dossier)) {
            throw new IllegalStateException(
                    "Dossier d'images introuvable : " + dossier + " (créez-le ou fixez ASSOUE_IMAGES_DIR).");
        }
        if (!Files.isWritable(dossier)) {
            throw new IllegalStateException("Dossier d'images non accessible en écriture : " + dossier);
        }
    }
}
