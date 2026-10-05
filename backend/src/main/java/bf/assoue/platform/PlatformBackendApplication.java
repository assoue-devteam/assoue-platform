package bf.assoue.platform;

import bf.assoue.platform.images.ImageProperties;
import bf.assoue.platform.paiement.service.PaydunyaProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({PaydunyaProperties.class, ImageProperties.class})
public class PlatformBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(PlatformBackendApplication.class, args);
    }

}
