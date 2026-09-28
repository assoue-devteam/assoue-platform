package bf.assoue.platform.auth.service;

import bf.assoue.platform.auth.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Persiste un échec même lorsque le flux de connexion lève une exception. */
@Service
@RequiredArgsConstructor
public class EchecConnexionService {

    private final UtilisateurRepository utilisateurRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean enregistrer(String email, int limite) {
        return utilisateurRepository.incrementerTentativesEchouees(email, limite) == 1;
    }
}
