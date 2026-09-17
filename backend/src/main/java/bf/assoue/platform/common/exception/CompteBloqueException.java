package bf.assoue.platform.common.exception;

public class CompteBloqueException extends RuntimeException {

    public CompteBloqueException() {
        super("Compte bloqué après 3 tentatives de connexion échouées");
    }

}
