package bf.assoue.platform.images;

/**
 * Stockage des images derrière une interface : aujourd'hui le disque local,
 * demain un stockage objet (S3-compatible) sans toucher le reste du code.
 * Seules des clés {@link CleImage} validées circulent ici, jamais de chemins.
 */
public interface StockageImage {

    void enregistrer(String cle, byte[] contenu);

    void supprimer(String cle);

    boolean existe(String cle);

    byte[] lire(String cle);
}
