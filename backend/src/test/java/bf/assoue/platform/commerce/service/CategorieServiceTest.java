package bf.assoue.platform.commerce.service;

import bf.assoue.platform.commerce.dto.CategorieResponse;
import bf.assoue.platform.commerce.model.Categorie;
import bf.assoue.platform.commerce.repository.CategorieRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategorieServiceTest {

    @Mock
    private CategorieRepository categorieRepository;

    @InjectMocks
    private CategorieService categorieService;

    @Test
    void lister_retourneToutesLesCategories() {
        Categorie cat1 = Categorie.builder().id(1L).nom("Mobilier").description("Meubles").build();
        Categorie cat2 = Categorie.builder().id(2L).nom("Mode").description("Vêtements").build();

        when(categorieRepository.findAll()).thenReturn(List.of(cat1, cat2));

        List<CategorieResponse> result = categorieService.lister();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).nom()).isEqualTo("Mobilier");
        assertThat(result.get(1).nom()).isEqualTo("Mode");
    }

}
