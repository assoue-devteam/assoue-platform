package bf.assoue.platform.images;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.env.MockEnvironment;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Échec clair au démarrage : dossier manquant, non inscriptible, relatif en production. */
class ImagePropertiesTest {

    @TempDir
    private Path dossier;

    @Test
    void dossierManquant_echoueAuDemarrage() {
        ImageProperties proprietes = new ImageProperties();
        proprietes.setEnvironment(new MockEnvironment());
        proprietes.setDossier(dossier.resolve("absent"));

        assertThatThrownBy(proprietes::verifier)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("introuvable");
    }

    @Test
    void cheminRelatifEnProduction_echoueAuDemarrage() {
        ImageProperties proprietes = new ImageProperties();
        MockEnvironment environnement = new MockEnvironment();
        environnement.setActiveProfiles("prod");
        proprietes.setEnvironment(environnement);
        proprietes.setDossier(Path.of("uploads"));

        assertThatThrownBy(proprietes::verifier)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("absolu");
    }
}
