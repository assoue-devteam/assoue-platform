package bf.assoue.platform.stock.service;

import bf.assoue.platform.commerce.model.Commande;
import bf.assoue.platform.commerce.model.LigneCommande;
import bf.assoue.platform.common.exception.RequeteInvalideException;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import bf.assoue.platform.stock.model.ReservationStock;
import bf.assoue.platform.stock.model.StockProduit;
import bf.assoue.platform.stock.repository.ReservationStockRepository;
import bf.assoue.platform.stock.repository.StockProduitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationStockService {

    private final StockProduitRepository stockProduitRepository;
    private final ReservationStockRepository reservationStockRepository;

    /** Retire les unités disponibles sous verrou et en conserve la trace par commande. */
    @Transactional
    public void reserver(Commande commande) {
        if (!reservationStockRepository.findByCommandeId(commande.getId()).isEmpty()) {
            return;
        }

        Map<Long, Integer> quantitesParProduit = commande.getLignes().stream()
                .collect(Collectors.groupingBy(ligne -> ligne.getProduit().getId(),
                        Collectors.summingInt(LigneCommande::getQuantite)));

        for (Map.Entry<Long, Integer> ligne : quantitesParProduit.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .toList()) {
            StockProduit stock = stockProduitRepository.findByProduitIdForUpdate(ligne.getKey())
                    .orElseThrow(() -> new RessourceIntrouvableException(
                            "Aucun stock trouvé pour le produit " + ligne.getKey()));
            if (stock.getQuantite() < ligne.getValue()) {
                throw new RequeteInvalideException("Stock insuffisant pour le produit " + ligne.getKey());
            }
            stock.setQuantite(stock.getQuantite() - ligne.getValue());
            stockProduitRepository.save(stock);

            reservationStockRepository.save(ReservationStock.builder()
                    .commande(commande)
                    .produit(stock.getProduit())
                    .quantite(ligne.getValue())
                    .build());
        }
    }

    /** La vente est finalisée : les unités ont déjà été sorties du stock disponible. */
    @Transactional
    public void consommer(Long commandeId) {
        reservationStockRepository.deleteByCommandeId(commandeId);
    }

    /** Une invoice définitivement échouée rend les unités disponibles à nouveau. */
    @Transactional
    public void liberer(Long commandeId) {
        List<ReservationStock> reservations = reservationStockRepository.findByCommandeId(commandeId).stream()
                .sorted(Comparator.comparing(reservation -> reservation.getProduit().getId()))
                .toList();
        for (ReservationStock reservation : reservations) {
            StockProduit stock = stockProduitRepository.findByProduitIdForUpdate(reservation.getProduit().getId())
                    .orElseThrow(() -> new RessourceIntrouvableException(
                            "Aucun stock trouvé pour le produit " + reservation.getProduit().getId()));
            stock.setQuantite(stock.getQuantite() + reservation.getQuantite());
            stockProduitRepository.save(stock);
        }
        reservationStockRepository.deleteByCommandeId(commandeId);
    }
}
