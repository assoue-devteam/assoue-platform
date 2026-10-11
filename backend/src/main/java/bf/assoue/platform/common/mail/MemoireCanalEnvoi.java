package bf.assoue.platform.common.mail;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("test")
public class MemoireCanalEnvoi implements CanalEnvoi {

    private final List<MessageEmail> messages = Collections.synchronizedList(new ArrayList<>());

    @Override
    public void envoyer(MessageEmail message) {
        messages.add(message);
    }

    public List<MessageEmail> messagesEnvoyes() {
        return List.copyOf(messages);
    }

    public void vider() {
        messages.clear();
    }
}
