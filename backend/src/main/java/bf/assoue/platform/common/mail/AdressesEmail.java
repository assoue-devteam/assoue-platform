package bf.assoue.platform.common.mail;

public final class AdressesEmail {

    private AdressesEmail() {
    }

    public static String masquer(String email) {
        if (email == null || email.isBlank()) {
            return "***";
        }
        int at = email.indexOf('@');
        if (at <= 0) {
            return "***";
        }
        String domaine = email.substring(at + 1);
        return email.charAt(0) + "***@" + domaine;
    }
}
