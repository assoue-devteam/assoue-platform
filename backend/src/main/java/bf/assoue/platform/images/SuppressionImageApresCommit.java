package bf.assoue.platform.images;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Suppression de l'ancien fichier après commit : si la transaction annule,
 * l'ancienne image reste référencée et ne doit pas disparaître. Hors
 * transaction (tests), suppression immédiate.
 */
@Component
@RequiredArgsConstructor
public class SuppressionImageApresCommit {

    private final StockageImage stockage;

    public void supprimer(String cle) {
        if (cle == null) {
            return;
        }
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    stockage.supprimer(cle);
                }
            });
        } else {
            stockage.supprimer(cle);
        }
    }
}
