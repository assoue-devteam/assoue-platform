package bf.assoue.platform.images;

/** Fichier au-delà de la taille max (5 Mo) vu côté service → 413, message en français. */
public class ImageTropLourdeException extends RuntimeException {

    public ImageTropLourdeException(String message) {
        super(message);
    }
}
