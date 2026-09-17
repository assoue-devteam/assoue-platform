package bf.assoue.platform.commerce.controller;

import bf.assoue.platform.commerce.dto.CategorieResponse;
import bf.assoue.platform.commerce.repository.CategorieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategorieController {

    private final CategorieRepository categorieRepository;

    @GetMapping
    public List<CategorieResponse> lister() {
        return categorieRepository.findAll().stream().map(CategorieResponse::depuis).toList();
    }

}
