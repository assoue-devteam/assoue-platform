package bf.assoue.platform.images;

/**
 * Clé d'une image uploadée : UUID généré côté serveur + extension du type
 * réellement détecté ({@code .jpg} ou {@code .png}). Le nom d'origine du
 * fichier client n'est jamais utilisé pour stocker.
 */
public final class CleImage {

    public static final String REGEX =
            "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(?:jpg|png)";

    public static final String REGEX_CHEMIN = "^" + REGEX + "$";

    private CleImage() {
    }

    public static boolean valide(String cle) {
        return cle != null && cle.matches(REGEX_CHEMIN);
    }

    /** Content-Type fixé par le serveur à partir de la clé, jamais du client. */
    public static String contentType(String cle) {
        return cle.endsWith(".png") ? "image/png" : "image/jpeg";
    }
}
