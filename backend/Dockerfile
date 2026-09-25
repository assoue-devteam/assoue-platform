FROM mcr.microsoft.com/openjdk/jdk:21-ubuntu

# Installer Maven
RUN apt-get update && apt-get install -y maven

WORKDIR /app

# Copier pom.xml et sources
COPY pom.xml .
COPY src ./src

# Exposer le port
EXPOSE 8080

# Lancer Spring Boot en mode dev
CMD ["mvn", "spring-boot:run"]
