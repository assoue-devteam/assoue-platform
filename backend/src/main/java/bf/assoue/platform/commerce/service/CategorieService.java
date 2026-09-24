package bf.assoue.platform.commerce.service;

import bf.assoue.platform.commerce.dto.CategorieResponse;
import bf.assoue.platform.commerce.repository.CategorieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategorieService {

    private final CategorieRepository categorieRepository;

    @Transactional(readOnly = true)
    public List<CategorieResponse> lister() {
        return categorieRepository.findAll().stream()
                .map(CategorieResponse::depuis)
                .toList();
    }

}
