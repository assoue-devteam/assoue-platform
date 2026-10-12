@echo off
rem Lance le backend en local (hot reload) avec les variables de ../.env et le profil dev.
cd /d "%~dp0"
for /f "usebackq eol=# tokens=1,* delims==" %%a in ("..\.env") do set "%%a=%%b"
set SPRING_PROFILES_ACTIVE=dev
rem La base Docker est exposee sur POSTGRES_PORT, pas forcement 5432.
set "POSTGRES_URL=jdbc:postgresql://localhost:%POSTGRES_PORT%/%POSTGRES_DB%"
rem Le conteneur backend occupe le port 8080.
docker stop assoue-backend >nul 2>&1
call "%~dp0mvnw.cmd" spring-boot:run
