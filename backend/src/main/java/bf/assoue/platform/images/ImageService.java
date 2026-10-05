package bf.assoue.platform.images;

import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.web.servlet.MultipartProperties;
import org.springframework.stereotype.Service;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.UUID;

/**
 * Validation serveur des images (la validation cliente n'est qu'un confort) :
 * taille, type réel par magic bytes, dimensions lues avant décodage complet
 * (protection contre les bombes de décompression), décodage effectif, puis
 * réencodage via ImageIO — ce qui supprime EXIF/GPS et tout contenu annexe
 * piégé. Seuls JPEG et PNG sont acceptés : ImageIO ne lit pas WebP sans plugin.
 */
@Service
@RequiredArgsConstructor
public class ImageService {

    /** Préfixe servi par {@link ImageController} pour construire l'URL d'affichage. */
    public static final String CHEMIN_PUBLIC = "/api/images/";

    private static final byte[] SIGNATURE_JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] SIGNATURE_PNG =
            {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    private final StockageImage stockage;
    private final ImageProperties proprietes;
    private final MultipartProperties multipart;

    /** Enregistre l'image réencodée et renvoie sa clé (UUID + extension détectée). */
    public String enregistrer(MultipartFile fichier) {
        if (fichier == null || fichier.isEmpty()) {
            throw new RequeteInvalideException("Envoyez un fichier image (JPEG ou PNG, 5 Mo au plus).");
        }
        DataSize tailleMax = multipart.getMaxFileSize();
        if (fichier.getSize() > tailleMax.toBytes()) {
            throw new ImageTropLourdeException("L'image dépasse " + formaterLimite(tailleMax) + ".");
        }
        byte[] octets = lireOctets(fichier);
        boolean png = typeDetecte(octets);
        byte[] reencode = decoderEtReencoder(octets, png);
        String cle = UUID.randomUUID() + (png ? ".png" : ".jpg");
        stockage.enregistrer(cle, reencode);
        return cle;
    }

    public FichierImage lire(String cle) {
        if (!CleImage.valide(cle)) {
            throw new RessourceIntrouvableException("Image introuvable.");
        }
        return new FichierImage(stockage.lire(cle), CleImage.contentType(cle));
    }

    public void supprimer(String cle) {
        if (cle != null) {
            stockage.supprimer(cle);
        }
    }

    /** Une clé fournie dans un formulaire doit exister (upload préalable), sinon 400. */
    public String validerCleExistante(String cle) {
        if (cle == null) {
            return null;
        }
        if (!CleImage.valide(cle) || !stockage.existe(cle)) {
            throw new RequeteInvalideException("Image introuvable : envoyez-la d'abord avec l'envoi d'image.");
        }
        return cle;
    }

    /** true = PNG, false = JPEG ; sinon le Content-Type et l'extension clients ne comptent pas. */
    private static boolean typeDetecte(byte[] octets) {
        if (commencePar(octets, SIGNATURE_JPEG)) {
            return false;
        }
        if (commencePar(octets, SIGNATURE_PNG)) {
            return true;
        }
        throw new ImageInvalideException("Format accepté : JPEG ou PNG.");
    }

    private static boolean commencePar(byte[] octets, byte[] signature) {
        if (octets.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if (octets[i] != signature[i]) {
                return false;
            }
        }
        return true;
    }

    private byte[] decoderEtReencoder(byte[] octets, boolean png) {
        try (ImageInputStream entree = ImageIO.createImageInputStream(new ByteArrayInputStream(octets))) {
            Iterator<ImageReader> lecteurs = ImageIO.getImageReaders(entree);
            if (!lecteurs.hasNext()) {
                throw new ImageInvalideException("Format accepté : JPEG ou PNG.");
            }
            ImageReader lecteur = lecteurs.next();
            try {
                lecteur.setInput(entree);
                String format = lecteur.getFormatName().toLowerCase();
                boolean formatPng = format.contains("png");
                // Le type du lecteur doit confirmer les magic bytes (fichier menteur refusé).
                if (formatPng != png || (!format.contains("jpeg") && !format.contains("jpg") && !formatPng)) {
                    throw new ImageInvalideException("Format accepté : JPEG ou PNG.");
                }
                int largeur = lecteur.getWidth(0);
                int hauteur = lecteur.getHeight(0);
                if (largeur <= 0 || hauteur <= 0
                        || largeur > proprietes.getLargeurMax() || hauteur > proprietes.getHauteurMax()) {
                    throw new RequeteInvalideException("Image trop grande : "
                            + proprietes.getLargeurMax() + " × " + proprietes.getHauteurMax()
                            + " pixels au plus.");
                }
                if ((long) largeur * hauteur > proprietes.getPixelsMax()) {
                    throw new RequeteInvalideException("Image trop grande : "
                            + proprietes.getPixelsMax() + " pixels au plus.");
                }
                BufferedImage image = lecteur.read(0);
                if (image == null) {
                    throw new ImageInvalideException("Le fichier n'est pas une image lisible.");
                }
                ByteArrayOutputStream sortie = new ByteArrayOutputStream();
                if (!ImageIO.write(image, formatPng ? "png" : "JPEG", sortie)) {
                    throw new ImageInvalideException("Le fichier n'est pas une image lisible.");
                }
                return sortie.toByteArray();
            } finally {
                lecteur.dispose();
            }
        } catch (IOException ex) {
            throw new ImageInvalideException("Le fichier n'est pas une image lisible.");
        }
    }

    private static byte[] lireOctets(MultipartFile fichier) {
        try {
            return fichier.getBytes();
        } catch (IOException ex) {
            throw new RequeteInvalideException("Envoi d'image illisible.");
        }
    }

    public static String formaterLimite(DataSize tailleMax) {
        long mega = tailleMax.toMegabytes();
        return mega >= 1 ? mega + " Mo" : tailleMax.toKilobytes() + " Ko";
    }
}
