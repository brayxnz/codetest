# CodeNest

> Aplicación móvil/PWA desarrollada con **React Native**, **Expo** y **Supabase**, construida como proyecto de aprendizaje y práctica de desarrollo full-stack.

## Descripción

CodeNest es una aplicación creada en **Expo Snack / Expo CLI** que integra un frontend en React Native con un backend basado en Supabase (base de datos PostgreSQL, autenticación y APIs en tiempo real). El proyecto busca poner en práctica conceptos de arquitectura de software, diseño de bases de datos, consumo de APIs y despliegue de aplicaciones móviles y web (PWA).

## Tabla de contenidos

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Ejecución del proyecto](#ejecución-del-proyecto)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Base de datos](#base-de-datos)
- [Despliegue](#despliegue)
- [Roadmap](#roadmap)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)

## Características

- Interfaz construida con React Native y componentes reutilizables.
- Backend gestionado con Supabase (PostgreSQL + Auth + Storage/Realtime según se necesite).
- Soporte para ejecución como aplicación móvil (Expo Go / build nativo) y como PWA.
- Autenticación de usuarios mediante Supabase Auth.
- Consultas y mutaciones a base de datos mediante `@supabase/supabase-js`.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React Native, Expo |
| Backend / BaaS | Supabase (PostgreSQL, Auth, Edge Functions) |
| Lenguaje | JavaScript |
| Control de versiones | Git / GitHub |
| Entorno de desarrollo | Visual Studio Code, Node.js, npm |
| Despliegue | Expo (EAS) / Vercel (para la versión web) |

## Requisitos previos

Antes de instalar el proyecto asegúrate de tener:

- [Node.js](https://nodejs.org/) (v18 o superior recomendado)
- npm o yarn
- [Expo CLI](https://docs.expo.dev/get-started/installation/) instalado globalmente (`npm install -g expo-cli`) o uso vía `npx expo`
- Una cuenta y proyecto creado en [Supabase](https://supabase.com/)
- Git

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/<tu-usuario>/codenest.git

# Entrar a la carpeta del proyecto
cd codenest

# Instalar dependencias
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las credenciales de tu proyecto de Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<tu-clave-anon-o-publishable>
```

> **Importante:** nunca subas el archivo `.env` al repositorio. Verifica que esté incluido en tu `.gitignore`.

## Ejecución del proyecto

```bash
# Iniciar el servidor de desarrollo de Expo
npx expo start
```

Desde la terminal podrás:

- Escanear el código QR con la app **Expo Go** para probar en un dispositivo físico.
- Presionar `a` para abrir en un emulador de Android.
- Presionar `i` para abrir en un simulador de iOS (requiere macOS).
- Presionar `w` para abrir la versión web / PWA en el navegador.

## Estructura del proyecto

```
codenest/
├── assets/            # Imágenes, íconos y recursos estáticos
├── components/        # Componentes reutilizables de React Native
├── screens/           # Pantallas / vistas de la aplicación
├── navigation/        # Configuración de navegación (React Navigation)
├── services/          # Lógica de conexión a Supabase y APIs externas
├── hooks/             # Custom hooks de React
├── utils/             # Funciones auxiliares
├── App.js             # Punto de entrada de la aplicación
├── app.json           # Configuración de Expo
├── package.json
└── .env               # Variables de entorno (no versionado)
```

> Ajusta esta estructura a la organización real de tu repositorio.

## Base de datos

El backend utiliza Supabase como proveedor de base de datos PostgreSQL. Se recomienda documentar aquí:

- Tablas principales del esquema (`users`, `posts`, `plans`, etc.).
- Políticas de **Row Level Security (RLS)** activas.
- Funciones y *Edge Functions* desplegadas, si aplica.
- Relación con integraciones externas (por ejemplo, Stripe para pagos y webhooks).

Puedes generar el esquema actualizado ejecutando en el SQL Editor de Supabase:

```sql
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public';
```

## Despliegue

- **App móvil:** compilación con [EAS Build](https://docs.expo.dev/build/introduction/) para generar binarios de Android/iOS.
- **Versión web / PWA:** despliegue en [Vercel](https://vercel.com/) usando `npx expo export:web` o la configuración de exportación web de Expo.

## Roadmap

- [ ] Autenticación completa con Supabase Auth (correo, redes sociales).
- [ ] Integración de planes y pagos con Stripe.
- [ ] Soporte offline / sincronización de datos.
- [ ] Mejoras de UI/UX y modo oscuro.
- [ ] Pruebas automatizadas (unitarias e integración).

## Contribuciones

Las contribuciones son bienvenidas. Para colaborar:

1. Haz un fork del repositorio.
2. Crea una rama para tu funcionalidad (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commit (`git commit -m 'Agrega nueva funcionalidad'`).
4. Sube tu rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.
