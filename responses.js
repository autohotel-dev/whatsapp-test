module.exports = {
    default: {
        message: `🌟 *¡Bienvenido a Auto Hotel Luxor!* 🌟

*¿En qué podemos ayudarte hoy?* 👇

*🏨 HABITACIONES Y RESERVAS*
- 🛌 *"Habitaciones"* - Conoce nuestros tipos de habitación
- 💰 *"Precios"* - Consulta nuestras tarifas
- 🎀 *"Paquetes"* - Paquetes de decoración especial
- 📸 *"Fotos"* - Galería de habitaciones decoradas
- 📅 *"Reservar"* - Haz tu reserva ahora

*🏨 SERVICIOS E INFORMACIÓN*
- ⭐ *"Servicios"* - Conoce nuestras comodidades
- 🕒 *"Horarios"* - Nuestro horario de atención
- 📍 *"Ubicación"* - Cómo llegar y datos de contacto
- 💫 *"Exclusivos"* - Experiencias personalizadas

*📌 POLÍTICAS IMPORTANTES*
- 🎀 *Habitaciones Decoradas*: Reserva con 2 días de anticipación
- 🚪 *Habitaciones Estándar*: Sujetas a disponibilidad

Escribe la *palabra clave* de tu interés para más información.`
    },

    habitaciones: {
        message: `🏨 **Tipos de Habitaciones Disponibles:**

- 🛏 **Master Suite Junior** 
  - Habitación de torre (Hotel)

- 🛌 **Master Suite** 
  - Habitación sencilla

- 🛁 **Master Suite con Jaccuzzi** 
  - Habitación sencilla con jaccuzzi 

- ♨️ **Master Suite con Jaccuzzi y Sauna** 
  - Habitación con jaccuzzi y sauna

- 🏊 **Master Suite con Alberca** 
  - Habitación con alberca

Escribe "precios" para ver los precios de las habitaciones o "menu" para ver nuevamente las opciones.`,
        image: 'https://autohoteluxor.com/src/images/galeria/Master%20suite%20%20Sauna%20y%20Jacuzzi.jpg'
    },

    precios: {
        message: `💰 **Tarifas por horas y/o noche:**

- Master Suite Junior: $520 MXN para 2 👥 personas 
  - 🕒 Hora extra $110 MXN 
  - 🕒 4 Horas extra $270 MXN 
  - 👤 Persona extra $180 MXN 
  - 👥 Máximo 3 personas

- Master Suite: $600 MXN para 2 👥 personas 
  - 🕒 Hora extra $120 MXN 
  - 🕒 4 Horas extra $300 MXN 
  - 👤 Persona extra $200 MXN 
  - 👥 Máximo 3 personas

- Master Suite con Jaccuzzi: $900 MXN para 2 👥 personas 
  - 🕒 Hora extra $210 MXN 
  - 🕒 4 Horas extra $440 MXN 
  - 👤 Persona extra $300 MXN 
  - 👥 Máximo 4 personas

- Master Suite con Jaccuzzi y Sauna: $1240 MXN para 2 👥 personas 
  - 🕒 Hora extra $260 MXN 
  - 🕒 4 Horas extra $600 MXN 
  - 👤 Persona extra $300 MXN 
  - 👥 Máximo 4 personas

- Master Suite con Alberca: $1990 MXN para 2 👥 personas 
  - 🕒 Hora extra $260 MXN 
  - 🕒 4 Horas extra $1000 MXN 
  - 👤 Persona extra $380 MXN 
  - 👥 Máximo 10 personas

*Incluye internet gratis, amenidades, servicio de habitación y servicio de comida*`,
        image: 'https://autohoteluxor.com/src/images/galeria/Master%20suite%20Sauna%20y%20Jacuzzi.jpg'
    },

    servicios: {
        message: `⭐ **Servicios del Hotel:**

- 🏊 Alberca
- 🍽️ Servicio de comida y bebida (Servicio de habitación)
- ♨️ Sauna
- 🛁 Jaccuzzi
- 📶 WiFi gratis
- 🅿️ Estacionamiento (Cochera)
- 🚕 Servicio de taxis
- 🧼 Amenidades

Escribe "menu" para ver nuevamente las opciones.`
    },

    horarios: {
        message: `🕒 **Horarios:**

- Domingo a partir de las 06:00 am a Viernes a las 06:00 am, estancia de 12 Horas.

- Viernes a partir de las 06:00 am a Domingo a las 06:00 am, estancia de 8 Horas.

- Servicio de desayunos: 8:00 - 12:00

- Servicio de comida de Lunes a Sabado de 14:00 - 20:00 y Domingo de 14:00 - 19:00

- Servicio de snacks de Lunes a Domingo de 22:00 - 4:00

Escribe "menu" para ver nuevamente las opciones.`
    },

    ubicacion: {
        message: `📍 **Ubicación:**

🏨 Auto Hotel Luxor
🌊 Av. Prol. Boulevard Bernardo Quintana, 1000B
🏖️ Col. Ind. Benito Juárez, CP 76120, Querétaro, México

📞 Teléfono: +52 442 210 3292
🌐 Website: https://autohoteluxor.com

¿Necesitas indicaciones para llegar?
Da click en el botón "Ver en Google Maps"`,
        buttons: [
            {
                type: 'url',
                title: '📍 Ver en Google Maps',
                url: 'https://maps.app.goo.gl/9xUHkBxyATFhE5Fr6'
            }
        ]
    },

    reservar: {
        message: `🎉 ¡Excelente! Te ayudo a reservar tu habitación.

Vamos a necesitar:
1. 🏨 Tipo de habitación
2. 📅 Fecha de reservación  
3. 👥 Número de personas
4. 📝 Tus datos de contacto

*Presiona el botón "Reservar Ahora" para comenzar*`
    },

    exclusivos: {
        message: `💫 **Servicios Exclusivos**

Para información sobre nuestros servicios premium y experiencias personalizadas, te invitamos a:

📞 **Contactar directamente a recepción: 442 210 3292 o al 0 estando en su habitación**
📍 **Solicitar información en nuestro mostrador**

Nuestro equipo te atenderá de manera discreta y profesional para proporcionarte todos los detalles sobre las opciones disponibles.

*Atención confidencial y personalizada*`
    },

    // Respuestas rápidas
    gracias: "¡Gracias por contactarnos! ¿En qué más podemos ayudarte? 😊",
    hola: "¡Hola! Bienvenido a Auto Hotel Luxor. ¿En qué puedo ayudarte hoy? 😊",
    ayuda: "Escribe 'menu' para ver las opciones disponibles o cuéntame en qué necesitas ayuda."
};