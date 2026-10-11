package bf.assoue.platform.common.mail;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AdressesEmailTest {

    @Test
    void masquer_masqueLaPartieLocale() {
        assertThat(AdressesEmail.masquer("awa@example.com")).isEqualTo("a***@example.com");
    }

    @Test
    void masquer_gereEmailInvalide() {
        assertThat(AdressesEmail.masquer("")).isEqualTo("***");
        assertThat(AdressesEmail.masquer(null)).isEqualTo("***");
        assertThat(AdressesEmail.masquer("pasunemail")).isEqualTo("***");
    }
}
