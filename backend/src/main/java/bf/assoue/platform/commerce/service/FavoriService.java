package bf.assoue.platform.commerce.service;

import bf.assoue.platform.auth.model.Utilisateur;
import bf.assoue.platform.auth.repository.UtilisateurRepository;
import bf.assoue.platform.commerce.dto.ProduitResponse;
import bf.assoue.platform.commerce.model.Favori;
import bf.assoue.platform.commerce.model.Produit;
import bf.assoue.platform.commerce.repository.FavoriRepository;
import bf.assoue.platform.commerce.repository.ProduitRepository;
import bf.assoue.platform.common.exception.RessourceIntrouvableException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriService {

    private final FavoriRepository favoriRepository;
    private final ProduitRepository produitRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ProduitService produitService;

    @Transactional(readOnly = true)
    public List<ProduitResponse> lister(String emailClient) {
        return favoriRepository.findByClientEmailOrderByDateAjoutDesc(emailClient).stream()
                .map(favori -> produitService.versReponse(favori.getProduit()))
                .toList();
    }

    /** Idempotent : un double clic sur le cœur ne crée pas de doublon. */
    @Transactional
    public void ajouter(Long produitId, String emailClient) {
        Utilisateur client = utilisateurRepository.findByEmail(emailClient)
                .orElseThrow(() -> new RessourceIntrouvableException("Utilisateur introuvable : " + emailClient));
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RessourceIntrouvableException("Produit introuvable : " + produitId));
        if (favoriRepository.existsByClientIdAndProduitId(client.getId(), produitId)) {
            return;
        }
        favoriRepository.save(Favori.builder().client(client).produit(produit).build());
    }

    @Transactional
    public void retirer(Long produitId, String emailClient) {
        favoriRepository.deleteByClientEmailAndProduitId(emailClient, produitId);
    }

}
