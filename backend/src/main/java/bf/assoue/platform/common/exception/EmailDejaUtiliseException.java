package bf.assoue.platform.common.exception;

public class EmailDejaUtiliseException extends RuntimeException {

    public EmailDejaUtiliseException(String email) {
        super("Un compte existe déjà avec l'email " + email);
    }

}
