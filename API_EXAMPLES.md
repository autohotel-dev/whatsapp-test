# 📝 Ejemplos de Uso de API - Auto Hotel Luxor

URL Base: `https://tu-app.onrender.com`

---

## 🚀 QUICK START - Los 5 Endpoints Esenciales

### 1️⃣ Dashboard General
```bash
curl https://tu-app.onrender.com/api/dashboard/summary
```

### 2️⃣ Lista de Reservas
```bash
curl https://tu-app.onrender.com/api/reservations
```

### 3️⃣ Reservas Pendientes de Pago
```bash
curl https://tu-app.onrender.com/api/reservations?status=pending_payment
```

### 4️⃣ Ver Usuario Específico
```bash
curl https://tu-app.onrender.com/api/users/2462636547
```

### 5️⃣ Estadísticas de Reservas
```bash
curl https://tu-app.onrender.com/api/reservations/stats
```

---

## 📊 EJEMPLOS POR CATEGORÍA

### 🏨 RESERVAS

#### Ver todas las reservas
```javascript
fetch('https://tu-app.onrender.com/api/reservations')
  .then(res => res.json())
  .then(data => console.log(data));
```

#### Filtrar reservas por estado
```javascript
// Reservas confirmadas
fetch('https://tu-app.onrender.com/api/reservations?status=confirmed')

// Reservas pendientes de pago
fetch('https://tu-app.onrender.com/api/reservations?status=pending_payment')

// Reservas con pago recibido
fetch('https://tu-app.onrender.com/api/reservations?status=payment_received')
```

#### Filtrar reservas por fecha
```javascript
// Reservas de hoy
const today = new Date().toISOString().split('T')[0];
fetch(`https://tu-app.onrender.com/api/reservations?startDate=${today}&endDate=${today}`)

// Reservas del mes
const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString().split('T')[0];
fetch(`https://tu-app.onrender.com/api/reservations?startDate=${startOfMonth}`)
```

#### Ver reservas de un cliente
```javascript
fetch('https://tu-app.onrender.com/api/reservations/user/2462636547')
  .then(res => res.json())
  .then(data => {
    console.log(`Cliente tiene ${data.total} reservas`);
    console.log(data.reservations);
  });
```

#### Actualizar estado de reserva
```javascript
// Confirmar una reserva
fetch('https://tu-app.onrender.com/api/reservations/674xxx/status', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'confirmed' })
})
  .then(res => res.json())
  .then(data => console.log('Reserva confirmada:', data));
```

#### Obtener estadísticas de reservas
```javascript
fetch('https://tu-app.onrender.com/api/reservations/stats')
  .then(res => res.json())
  .then(data => {
    console.log('Total de reservas:', data.stats.total);
    console.log('Revenue total:', data.stats.totalRevenue);
    console.log('Por estado:', data.stats.byStatus);
    console.log('Por paquete:', data.stats.byPackage);
  });
```

---

### 👥 USUARIOS

#### Ver todos los usuarios
```javascript
fetch('https://tu-app.onrender.com/api/users?limit=100')
  .then(res => res.json())
  .then(data => console.log(`Total usuarios: ${data.total}`));
```

#### Ver usuario específico
```javascript
fetch('https://tu-app.onrender.com/api/users/2462636547')
  .then(res => res.json())
  .then(data => {
    console.log('Usuario:', data.user);
    console.log('Reservas del usuario:', data.reservations);
  });
```

#### Filtrar usuarios por segmento
```javascript
// Usuarios VIP
fetch('https://tu-app.onrender.com/api/users?segmentation=vip')

// Usuarios frecuentes
fetch('https://tu-app.onrender.com/api/users?segmentation=frequent')

// Usuarios nuevos
fetch('https://tu-app.onrender.com/api/users?segmentation=new')
```

#### Estadísticas de usuarios
```javascript
fetch('https://tu-app.onrender.com/api/users/stats')
  .then(res => res.json())
  .then(data => {
    console.log('Total usuarios:', data.stats.total);
    console.log('Por segmento:', data.stats.bySegmentation);
    console.log('Lead score promedio:', data.stats.averageLeadScore);
  });
```

---

### 💬 MENSAJES

#### Ver mensajes de un usuario
```javascript
fetch('https://tu-app.onrender.com/api/messages/user/2462636547?limit=50')
  .then(res => res.json())
  .then(data => {
    console.log(`Total mensajes: ${data.total}`);
    data.messages.forEach(msg => {
      console.log(`[${msg.direction}] ${msg.text}`);
    });
  });
```

#### Estadísticas de mensajes
```javascript
fetch('https://tu-app.onrender.com/api/messages/stats')
  .then(res => res.json())
  .then(data => {
    console.log('Total mensajes:', data.stats.total);
    console.log('Entrantes:', data.stats.byDirection.incoming);
    console.log('Salientes:', data.stats.byDirection.outgoing);
    console.log('Top intenciones:', data.stats.topIntents);
  });
```

---

### 🔔 NOTIFICACIONES

#### Ver notificaciones no leídas
```javascript
fetch('https://tu-app.onrender.com/api/notifications/unread')
  .then(res => res.json())
  .then(data => {
    console.log(`Notificaciones sin leer: ${data.total}`);
    data.notifications.forEach(notif => {
      console.log(`[${notif.type}] ${notif.message.substring(0, 50)}...`);
    });
  });
```

#### Marcar notificación como leída
```javascript
fetch('https://tu-app.onrender.com/api/notifications/674xxx/read', {
  method: 'PUT'
})
  .then(res => res.json())
  .then(data => console.log('Notificación marcada como leída'));
```

#### Filtrar notificaciones por tipo
```javascript
// Solo notificaciones de reservas al hotel
fetch('https://tu-app.onrender.com/api/notifications?type=reservation_hotel')

// Solo confirmaciones a clientes
fetch('https://tu-app.onrender.com/api/notifications?type=reservation_confirmation')
```

---

### 📊 DASHBOARD Y ANALYTICS

#### Dashboard completo
```javascript
fetch('https://tu-app.onrender.com/api/dashboard/summary')
  .then(res => res.json())
  .then(data => {
    const { summary } = data;
    
    // Hoy
    console.log('📅 HOY:');
    console.log(`  Reservas: ${summary.today.reservations}`);
    console.log(`  Nuevos usuarios: ${summary.today.newUsers}`);
    console.log(`  Revenue: $${summary.today.revenue.toLocaleString()}`);
    
    // Semana
    console.log('📅 ESTA SEMANA:');
    console.log(`  Reservas: ${summary.week.reservations}`);
    console.log(`  Revenue: $${summary.week.revenue.toLocaleString()}`);
    
    // Mes
    console.log('📅 ESTE MES:');
    console.log(`  Reservas: ${summary.month.reservations}`);
    console.log(`  Revenue: $${summary.month.revenue.toLocaleString()}`);
    
    // Métricas
    console.log('📈 MÉTRICAS:');
    console.log(`  Paquete más popular: ${summary.topPackage}`);
    console.log(`  Habitación más popular: ${summary.topRoom}`);
    console.log(`  Tasa de conversión: ${summary.conversionRate}%`);
  });
```

#### Métricas en tiempo real
```javascript
fetch('https://tu-app.onrender.com/api/analytics/realtime')
  .then(res => res.json())
  .then(data => {
    console.log('⚡ TIEMPO REAL:');
    console.log(`  Mensajes últimos 5 min: ${data.realtime.messagesLast5Min}`);
    console.log(`  Reservas pendientes: ${data.realtime.pendingReservations}`);
    console.log(`  BD conectada: ${data.realtime.dbConnected ? '✅' : '❌'}`);
    console.log(`  Uptime: ${Math.floor(data.realtime.uptime / 60)} minutos`);
  });
```

---

### 🔍 BÚSQUEDA

#### Búsqueda global
```javascript
// Buscar por nombre
fetch('https://tu-app.onrender.com/api/search?q=Ricardo')

// Buscar por teléfono
fetch('https://tu-app.onrender.com/api/search?q=2462636547')

// Buscar solo en usuarios
fetch('https://tu-app.onrender.com/api/search?q=Ricardo&type=users')

// Buscar solo en reservas
fetch('https://tu-app.onrender.com/api/search?q=LXR&type=reservations')
```

---

## 🎨 EJEMPLOS PARA REACT/NEXT.JS

### Hook personalizado para Dashboard
```javascript
import { useState, useEffect } from 'react';

function useDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('https://tu-app.onrender.com/api/dashboard/summary')
      .then(res => res.json())
      .then(data => {
        setData(data.summary);
        setLoading(false);
      });
  }, []);
  
  return { data, loading };
}

// Uso en componente
function Dashboard() {
  const { data, loading } = useDashboard();
  
  if (loading) return <div>Cargando...</div>;
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Reservas hoy: {data.today.reservations}</p>
      <p>Revenue hoy: ${data.today.revenue}</p>
    </div>
  );
}
```

### Componente de Reservas
```javascript
function ReservationsList() {
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState('all');
  
  useEffect(() => {
    const url = filter === 'all' 
      ? 'https://tu-app.onrender.com/api/reservations'
      : `https://tu-app.onrender.com/api/reservations?status=${filter}`;
      
    fetch(url)
      .then(res => res.json())
      .then(data => setReservations(data.reservations));
  }, [filter]);
  
  const handleConfirm = async (id) => {
    await fetch(`https://tu-app.onrender.com/api/reservations/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' })
    });
    // Recargar reservas
    setFilter(filter);
  };
  
  return (
    <div>
      <select onChange={(e) => setFilter(e.target.value)}>
        <option value="all">Todas</option>
        <option value="pending_payment">Pendientes de pago</option>
        <option value="payment_received">Pago recibido</option>
        <option value="confirmed">Confirmadas</option>
      </select>
      
      {reservations.map(res => (
        <div key={res._id}>
          <h3>{res.customerName}</h3>
          <p>Estado: {res.status}</p>
          <p>Monto: ${res.totalAmount}</p>
          {res.status === 'payment_received' && (
            <button onClick={() => handleConfirm(res._id)}>
              Confirmar Reserva
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔄 POLLING (Actualización Automática)

### Actualizar dashboard cada 30 segundos
```javascript
function DashboardRealtime() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    const fetchStats = () => {
      fetch('https://tu-app.onrender.com/api/analytics/realtime')
        .then(res => res.json())
        .then(data => setStats(data.realtime));
    };
    
    // Cargar inmediatamente
    fetchStats();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <h2>En Tiempo Real</h2>
      <p>Mensajes últimos 5 min: {stats?.messagesLast5Min}</p>
      <p>Reservas pendientes: {stats?.pendingReservations}</p>
    </div>
  );
}
```

---

## 📱 EJEMPLOS PARA MÓVIL (React Native)

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';

function ReservationsScreen() {
  const [reservations, setReservations] = useState([]);
  
  useEffect(() => {
    fetch('https://tu-app.onrender.com/api/reservations?limit=20')
      .then(res => res.json())
      .then(data => setReservations(data.reservations));
  }, []);
  
  return (
    <View>
      <FlatList
        data={reservations}
        keyExtractor={item => item._id}
        renderItem={({item}) => (
          <View>
            <Text>{item.customerName}</Text>
            <Text>{item.status}</Text>
            <Text>${item.totalAmount}</Text>
          </View>
        )}
      />
    </View>
  );
}
```

---

## 🎯 TIPS PARA OPTIMIZACIÓN

### 1. Usar paginación
```javascript
// Primera página
fetch('https://tu-app.onrender.com/api/reservations?limit=20&offset=0')

// Segunda página
fetch('https://tu-app.onrender.com/api/reservations?limit=20&offset=20')

// Tercera página
fetch('https://tu-app.onrender.com/api/reservations?limit=20&offset=40')
```

### 2. Cachear resultados
```javascript
const cache = new Map();

async function fetchWithCache(url, ttl = 60000) {
  if (cache.has(url)) {
    const { data, timestamp } = cache.get(url);
    if (Date.now() - timestamp < ttl) {
      return data;
    }
  }
  
  const res = await fetch(url);
  const data = await res.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}
```

### 3. Cargar datos en paralelo
```javascript
async function loadDashboard() {
  const [summary, reservations, users] = await Promise.all([
    fetch('https://tu-app.onrender.com/api/dashboard/summary').then(r => r.json()),
    fetch('https://tu-app.onrender.com/api/reservations?limit=10').then(r => r.json()),
    fetch('https://tu-app.onrender.com/api/users/stats').then(r => r.json())
  ]);
  
  return { summary, reservations, users };
}
```

---

**🚀 Todos estos endpoints están listos para usar después del deploy.**
