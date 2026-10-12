package bf.assoue.platform.common.mail;

public final class ModelesEmail {

    private ModelesEmail() {
    }

    public static String html(String titre, String corps) {
        return "<!DOCTYPE html><html lang=\"fr\"><head><meta charset=\"utf-8\"></head>"
                + "<body style=\"font-family:system-ui,sans-serif;color:#1f2937;max-width:600px;margin:auto;padding:24px;\">"
                + "<h1 style=\"color:#166534;font-size:20px;\">AS'Soué</h1>"
                + "<h2 style=\"font-size:16px;\">" + titre + "</h2>"
                + "<div>" + corps + "</div>"
                + "<hr style=\"border:none;border-top:1px solid #d1d5db;margin:24px 0;\">"
                + "<p style=\"font-size:12px;color:#6b7280;\">AS'Soué — collecte et valorisation des déchets, Ouagadougou.</p>"
                + "</body></html>";
    }

    public static String texte(String titre, String corps) {
        return "AS'Soué\n\n" + titre + "\n\n" + corps + "\n\n---\nAS'Soué — Ouagadougou";
    }
}
