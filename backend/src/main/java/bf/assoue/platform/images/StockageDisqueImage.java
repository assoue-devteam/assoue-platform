package bf.assoue.platform.images;

import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

import static java.nio.file.StandardOpenOption.CREATE_NEW;

/**
 * Première implémentation sur disque local. Le dossier n'est jamais servi en
 * statique (aucune exécution possible) : seule l'API lit et renvoie les octets.
 */
@Component
@RequiredArgsConstructor
public class StockageDisqueImage implements StockageImage {

    private final ImageProperties proprietes;

    @Override
    public void enregistrer(String cle, byte[] contenu) {
        try {
            Files.write(resoudre(cle), contenu, CREATE_NEW);
        } catch (IOException ex) {
            throw new UncheckedIOException("Enregistrement de l'image impossible.", ex);
        }
    }

    @Override
    public void supprimer(String cle) {
        try {
            Files.deleteIfExists(resoudre(cle));
        } catch (IOException ex) {
            throw new UncheckedIOException("Suppression de l'image impossible.", ex);
        }
    }

    @Override
    public boolean existe(String cle) {
        return CleImage.valide(cle) && Files.isRegularFile(resoudre(cle));
    }

    @Override
    public byte[] lire(String cle) {
        Path cible = resoudre(cle);
        if (!Files.isRegularFile(cible)) {
            throw new RessourceIntrouvableException("Image introuvable.");
        }
        try {
            return Files.readAllBytes(cible);
        } catch (IOException ex) {
            throw new UncheckedIOException("Lecture de l'image impossible.", ex);
        }
    }

    /**
     * Double garde anti path traversal (la première est la regex {@link CleImage}
     * au contrôleur) : le chemin résolu doit rester dans le dossier de stockage,
     * sinon 404 sans révéler le système de fichiers.
     */
    private Path resoudre(String cle) {
        if (!CleImage.valide(cle)) {
            throw new RessourceIntrouvableException("Image introuvable.");
        }
        Path racine = proprietes.getDossier().toAbsolutePath().normalize();
        Path cible = racine.resolve(cle).normalize();
        if (!cible.startsWith(racine)) {
            throw new RessourceIntrouvableException("Image introuvable.");
        }
        return cible;
    }
}
