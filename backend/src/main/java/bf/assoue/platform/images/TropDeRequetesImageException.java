package bf.assoue.platform.images;

/** Trop d'uploads traités en parallèle : le client doit réessayer un instant plus tard (429). */
public class TropDeRequetesImageException extends RuntimeException {

    public TropDeRequetesImageException() {
        super("Réessayez dans un instant.");
    }
}
