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
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.UUID;

/**
 * Validation serveur des images (la validation cliente n'est qu'un confort) :
 * taille, type réel par magic bytes, dimensions lues avant décodage complet
 * (protection contre les bombes de décompression), orientation EXIF appliquée
 * aux pixels, redimensionnement au plus grand côté 1600 px, puis réencodage
 * via ImageIO — ce qui supprime EXIF/GPS et tout contenu annexe piégé.
 * Seuls JPEG et PNG sont acceptés : ImageIO ne lit pas WebP sans plugin.
 *
 * Limites d'entrée réalistes pour un envoi non redimensionné (photo smartphone
 * jusqu'à 48 MP, 3 à 8 Mo) : un décodage 48 MP occupe ~150 Mo transitoires
 * (48 M pixels × 3-4 octets), acceptable pour un envoi admin peu concurrent ;
 * la sortie, elle, ne dépasse jamais 1600 px de côté.
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
            throw new RequeteInvalideException("Envoyez un fichier image (JPEG ou PNG, "
                    + formaterLimite(multipart.getMaxFileSize()) + " au plus).");
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
                // Orientation EXIF appliquée aux pixels avant que le réencodage
                // ne supprime les métadonnées (sinon un portrait s'affiche couché),
                // puis mise à l'échelle au plus grand côté configuré.
                BufferedImage normale = appliquerOrientation(image, png ? 1 : orientationExif(octets));
                BufferedImage finale = mettreALechelle(normale, png && normale.getColorModel().hasAlpha());
                ByteArrayOutputStream sortie = new ByteArrayOutputStream();
                if (!ImageIO.write(finale, formatPng ? "png" : "JPEG", sortie)) {
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

    /**
     * Orientation EXIF (tag 0x0112) lue dans le segment APP1 du JPEG, 1 si
     * absente ou illisible. Lecture manuelle volontaire : ImageIO (JDK) ignore
     * l'orientation au décodage, et on évite une dépendance pour un seul tag.
     * Le redimensionnement client la normalise déjà (createImageBitmap) ; ceci
     * couvre les envois directs à l'API.
     */
    static int orientationExif(byte[] jpeg) {
        int i = 2; // après SOI FF D8
        while (i + 4 < jpeg.length) {
            if ((jpeg[i] & 0xFF) != 0xFF) {
                return 1;
            }
            int marqueur = jpeg[i + 1] & 0xFF;
            if (marqueur == 0xDA || marqueur == 0xD9) {
                return 1; // données compressées ou fin : plus de métadonnées
            }
            int longueur = ((jpeg[i + 2] & 0xFF) << 8) | (jpeg[i + 3] & 0xFF);
            if (longueur < 2 || i + 2 + longueur > jpeg.length) {
                return 1;
            }
            if (marqueur == 0xE1 && longueur > 8
                    && jpeg[i + 4] == 'E' && jpeg[i + 5] == 'x' && jpeg[i + 6] == 'i' && jpeg[i + 7] == 'f'
                    && jpeg[i + 8] == 0 && jpeg[i + 9] == 0) {
                int orientation = orientationTiff(jpeg, i + 10, longueur - 8);
                if (orientation >= 1 && orientation <= 8) {
                    return orientation;
                }
                return 1;
            }
            i += 2 + longueur;
        }
        return 1;
    }

    private static int orientationTiff(byte[] donnees, int debut, int taille) {
        if (taille < 8) {
            return 1;
        }
        boolean petitBout;
        if (donnees[debut] == 'I' && donnees[debut + 1] == 'I') {
            petitBout = true;
        } else if (donnees[debut] == 'M' && donnees[debut + 1] == 'M') {
            petitBout = false;
        } else {
            return 1;
        }
        if (lire2(donnees, debut + 2, petitBout) != 42) {
            return 1;
        }
        int ifd = debut + lire4(donnees, debut + 4, petitBout);
        if (ifd < debut || ifd + 2 > debut + taille) {
            return 1;
        }
        int entrees = lire2(donnees, ifd, petitBout);
        for (int e = 0; e < entrees; e++) {
            int pos = ifd + 2 + e * 12;
            if (pos + 12 > debut + taille) {
                return 1;
            }
            if (lire2(donnees, pos, petitBout) == 0x0112 && lire2(donnees, pos + 2, petitBout) == 3) {
                return lire2(donnees, pos + 8, petitBout);
            }
        }
        return 1;
    }

    private static int lire2(byte[] donnees, int pos, boolean petitBout) {
        int a = donnees[pos] & 0xFF;
        int b = donnees[pos + 1] & 0xFF;
        return petitBout ? (b << 8) | a : (a << 8) | b;
    }

    private static int lire4(byte[] donnees, int pos, boolean petitBout) {
        int a = donnees[pos] & 0xFF;
        int b = donnees[pos + 1] & 0xFF;
        int c = donnees[pos + 2] & 0xFF;
        int d = donnees[pos + 3] & 0xFF;
        return petitBout ? (d << 24) | (c << 16) | (b << 8) | a : (a << 24) | (b << 16) | (c << 8) | d;
    }

    /** Applique l'orientation EXIF aux pixels (matrices standard, 5-8 permutent largeur/hauteur). */
    static BufferedImage appliquerOrientation(BufferedImage image, int orientation) {
        if (orientation < 2 || orientation > 8) {
            return image;
        }
        int largeur = image.getWidth();
        int hauteur = image.getHeight();
        boolean permute = orientation >= 5;
        AffineTransform transformation = switch (orientation) {
            case 2 -> new AffineTransform(-1, 0, 0, 1, largeur, 0);
            case 3 -> new AffineTransform(-1, 0, 0, -1, largeur, hauteur);
            case 4 -> new AffineTransform(1, 0, 0, -1, 0, hauteur);
            case 5 -> new AffineTransform(0, 1, 1, 0, 0, 0);
            case 6 -> new AffineTransform(0, 1, -1, 0, hauteur, 0);
            case 7 -> new AffineTransform(0, -1, -1, 0, hauteur, largeur);
            default -> new AffineTransform(0, -1, 1, 0, 0, largeur);
        };
        BufferedImage sortie = new BufferedImage(
                permute ? hauteur : largeur, permute ? largeur : hauteur,
                image.getType() == 0 ? BufferedImage.TYPE_INT_RGB : image.getType());
        Graphics2D dessin = sortie.createGraphics();
        dessin.drawImage(image, transformation, null);
        dessin.dispose();
        return sortie;
    }

    /** Plus grand côté ramené à la limite configurée (rapport conservé, jamais agrandi). */
    private BufferedImage mettreALechelle(BufferedImage image, boolean garderAlpha) {
        int largeur = image.getWidth();
        int hauteur = image.getHeight();
        int max = Math.max(largeur, hauteur);
        int limite = proprietes.getTailleCoteMax();
        if (max <= limite) {
            return image;
        }
        double echelle = (double) limite / max;
        int nouvelleLargeur = Math.max(1, (int) Math.round(largeur * echelle));
        int nouvelleHauteur = Math.max(1, (int) Math.round(hauteur * echelle));
        int type = garderAlpha ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        BufferedImage sortie = new BufferedImage(nouvelleLargeur, nouvelleHauteur, type);
        Graphics2D dessin = sortie.createGraphics();
        dessin.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
                RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        if (!garderAlpha) {
            dessin.setColor(Color.WHITE);
            dessin.fillRect(0, 0, nouvelleLargeur, nouvelleHauteur);
        }
        dessin.drawImage(image, 0, 0, nouvelleLargeur, nouvelleHauteur, null);
        dessin.dispose();
        return sortie;
    }

    public static String formaterLimite(DataSize tailleMax) {
        long mega = tailleMax.toMegabytes();
        return mega >= 1 ? mega + " Mo" : tailleMax.toKilobytes() + " Ko";
    }
}
