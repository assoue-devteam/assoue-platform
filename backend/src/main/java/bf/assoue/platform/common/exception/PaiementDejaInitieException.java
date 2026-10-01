package bf.assoue.platform.common.exception;

public class PaiementDejaInitieException extends RuntimeException {

    public PaiementDejaInitieException(Long commandeId) {
        super("Un paiement est déjà en cours pour la commande " + commandeId + " — reprenez le paiement existant");
    }

}
