package bf.assoue.platform.images;

import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.autoconfigure.web.servlet.MultipartProperties;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.util.unit.DataSize;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.zip.CRC32;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Validation serveur des images, sans contexte Spring : le stockage disque est
 * réel (dossier temporaire), seul le multipart est simulé.
 */
class ImageServiceTest {

    @TempDir
    private Path dossier;

    private ImageProperties proprietes;
    private MultipartProperties multipart;
    private ImageService service;

    @BeforeEach
    void preparer() {
        proprietes = new ImageProperties();
        proprietes.setDossier(dossier);
        multipart = new MultipartProperties();
        service = new ImageService(new StockageDisqueImage(proprietes), proprietes, multipart);
    }

    @Test
    void jpegValide_estReencodeEtStocke() throws Exception {
        String cle = service.enregistrer(fichier("photo.jpg", "image/jpeg", jpeg(8, 6)));

        assertThat(cle).matches(CleImage.REGEX_CHEMIN);
        assertThat(cle).endsWith(".jpg");
        byte[] stocke = Files.readAllBytes(dossier.resolve(cle));
        assertThat(stocke[0]).isEqualTo((byte) 0xFF);
        assertThat(stocke[1]).isEqualTo((byte) 0xD8);
        assertThat(stocke[2]).isEqualTo((byte) 0xFF);
    }

    @Test
    void pngValide_gardeLePng() throws Exception {
        String cle = service.enregistrer(fichier("photo.png", "image/png", png(8, 6)));

        assertThat(cle).endsWith(".png");
        byte[] stocke = Files.readAllBytes(dossier.resolve(cle));
        assertThat(new String(stocke, 1, 3, StandardCharsets.US_ASCII)).isEqualTo("PNG");
    }

    @Test
    void contenuTexteAvecExtensionJpg_estRefuse() {
        MockMultipartFile fauxJpg = fichier("photo.jpg", "image/jpeg",
                "ceci n'est pas une image".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> service.enregistrer(fauxJpg))
                .isInstanceOf(ImageInvalideException.class)
                .hasMessageContaining("JPEG ou PNG");
    }

    @Test
    void extensionEtContentTypeClients_sontIgnores() throws Exception {
        // Octets JPEG mais nom et type annoncés PNG : c'est le contenu qui décide.
        String cle = service.enregistrer(fichier("photo.png", "image/png", jpeg(4, 4)));

        assertThat(cle).endsWith(".jpg");
    }

    @Test
    void jpegTronque_estRefuse() {
        byte[] tronque = new byte[103];
        tronque[0] = (byte) 0xFF;
        tronque[1] = (byte) 0xD8;
        tronque[2] = (byte) 0xFF;

        assertThatThrownBy(() -> service.enregistrer(fichier("photo.jpg", "image/jpeg", tronque)))
                .isInstanceOf(ImageInvalideException.class);
    }

    @Test
    void fichierVide_estRefuse() {
        assertThatThrownBy(() -> service.enregistrer(fichier("vide.jpg", "image/jpeg", new byte[0])))
                .isInstanceOf(RequeteInvalideException.class);
    }

    @Test
    void fichierTropGros_estRefuseCoteService() {
        multipart.setMaxFileSize(DataSize.ofKilobytes(1));

        assertThatThrownBy(() -> service.enregistrer(fichier("gros.jpg", "image/jpeg", new byte[2048])))
                .isInstanceOf(ImageTropLourdeException.class)
                .hasMessageContaining("dépasse");
    }

    @Test
    void dimensionsExcessives_sontRefuseesAvantDecodage() {
        // Seul l'en-tête IHDR : aucun pixel à décoder, le refus vient des dimensions.
        assertThatThrownBy(() -> service.enregistrer(fichier("grand.png", "image/png", pngEnteteSeule(5000, 10))))
                .isInstanceOf(RequeteInvalideException.class)
                .hasMessageContaining("trop grande");
    }

    @Test
    void tropDePixels_estRefuse() {
        // 3500 × 3500 dans les dimensions max, mais 12,25 M pixels > 12 M.
        assertThatThrownBy(() -> service.enregistrer(fichier("lourd.png", "image/png", pngEnteteSeule(3500, 3500))))
                .isInstanceOf(RequeteInvalideException.class)
                .hasMessageContaining("pixels");
    }

    @Test
    void cleInconnue_estRefuseeALaValidationEtALaLecture() {
        assertThatThrownBy(() -> service.validerCleExistante("11111111-2222-3333-4444-555555555555.jpg"))
                .isInstanceOf(RequeteInvalideException.class);
        assertThatThrownBy(() -> service.lire("11111111-2222-3333-4444-555555555555.jpg"))
                .isInstanceOf(RessourceIntrouvableException.class);
        assertThatThrownBy(() -> service.lire("../pirate.jpg"))
                .isInstanceOf(RessourceIntrouvableException.class);
    }

    private static MockMultipartFile fichier(String nom, String contentType, byte[] contenu) {
        return new MockMultipartFile("fichier", nom, contentType, contenu);
    }

    private static byte[] jpeg(int largeur, int hauteur) throws IOException {
        return image("JPEG", largeur, hauteur);
    }

    private static byte[] png(int largeur, int hauteur) throws IOException {
        return image("png", largeur, hauteur);
    }

    private static byte[] image(String format, int largeur, int hauteur) throws IOException {
        BufferedImage dessin = new BufferedImage(largeur, hauteur, BufferedImage.TYPE_INT_RGB);
        dessin.setRGB(0, 0, 0xE4002B);
        ByteArrayOutputStream sortie = new ByteArrayOutputStream();
        ImageIO.write(dessin, format, sortie);
        return sortie.toByteArray();
    }

    /** PNG réduit à sa signature + IHDR (CRC correct) + IEND : dimensions sans pixels. */
    private static byte[] pngEnteteSeule(int largeur, int hauteur) throws IOException {
        ByteArrayOutputStream sortie = new ByteArrayOutputStream();
        sortie.write(new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A});
        ByteArrayOutputStream ihdr = new ByteArrayOutputStream();
        ecrireEntier(ihdr, largeur);
        ecrireEntier(ihdr, hauteur);
        ihdr.write(new byte[]{8, 2, 0, 0, 0});
        ecrireMorceau(sortie, "IHDR", ihdr.toByteArray());
        ecrireMorceau(sortie, "IEND", new byte[0]);
        return sortie.toByteArray();
    }

    private static void ecrireMorceau(ByteArrayOutputStream sortie, String type, byte[] donnees) throws IOException {
        ecrireEntier(sortie, donnees.length);
        byte[] nom = type.getBytes(StandardCharsets.US_ASCII);
        sortie.write(nom);
        sortie.write(donnees);
        CRC32 crc = new CRC32();
        crc.update(nom);
        crc.update(donnees);
        ecrireEntier(sortie, (int) crc.getValue());
    }

    private static void ecrireEntier(ByteArrayOutputStream sortie, int valeur) {
        sortie.write((valeur >>> 24) & 0xFF);
        sortie.write((valeur >>> 16) & 0xFF);
        sortie.write((valeur >>> 8) & 0xFF);
        sortie.write(valeur & 0xFF);
    }
}
