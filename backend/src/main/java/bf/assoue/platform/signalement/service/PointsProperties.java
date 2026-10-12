package bf.assoue.platform.signalement.service;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "assoue.points")
public class PointsProperties {

    private boolean actif = false;
    private int pointsParSignalement = 10;
    private int plafondJournalier = 3;
    private int plafondReductionPourcent = 50;
}