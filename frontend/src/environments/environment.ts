export const environment = {
  production: false,
  // Relatif pour passer par proxy.conf.json en dev (sinon CORS vers :8080).
  apiUrl: '/api',
  // Inscriptions aux événements : « Participer » ouvre WhatsApp avec un message
  // prérempli. Chiffres uniquement, indicatif 226 inclus (ex. '22654958282').
  whatsappNumero: '22654958282'
};
