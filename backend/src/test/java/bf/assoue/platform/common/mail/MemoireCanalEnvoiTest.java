package bf.assoue.platform.common.mail;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MemoireCanalEnvoiTest {

    private MemoireCanalEnvoi canal;

    @BeforeEach
    void setUp() {
        canal = new MemoireCanalEnvoi();
    }

    @Test
    void envoyer_enregistreLeMessage() {
        MessageEmail message = new MessageEmail("a@exemple.com", "Sujet", "<p>html</p>", "texte");

        canal.envoyer(message);

        assertThat(canal.messagesEnvoyes()).containsExactly(message);
    }

    @Test
    void vider_effaceLesMessages() {
        canal.envoyer(new MessageEmail("a@exemple.com", "S", "h", "t"));

        canal.vider();

        assertThat(canal.messagesEnvoyes()).isEmpty();
    }
}
