# TacticAI — Sistema Inteligente de Recomendación de Alineaciones de Fútbol

Aplicación que genera alineaciones recomendadas mediante inteligencia artificial para partidos de fútbol, basándose en las características de los jugadores.

## Inicio Rápido

### Requisitos
- **Docker** (v24.0+)
- **Docker Compose** (v2.20+)
- **Git**

### Instalación y Ejecución

```bash
# Clonar el repositorio
git clone https://github.com/slazaromar/tacticai.git
cd tacticai

# Iniciar la aplicación
docker compose up --build
```

### Acceso

| Servicio | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| API Backend | http://localhost:4000 |
| Motor de Recomendación | http://localhost:8000 |
| Documentación API | http://localhost:8000/docs |

### Credenciales de Prueba

```
Email:    admin@tacticai.com
Contraseña: Admin1234!
```

## Configuración y Resolución de Problemas

Para instrucciones detalladas de configuración y resolución de problemas, consulta [INSTALL.md](INSTALL.md).

## Arquitectura

- **Frontend**: SPA con React
- **Backend**: API REST con Node.js + Express
- **Motor de Recomendación**: FastAPI con puntuación ML
- **Base de Datos**: PostgreSQL con caché Redis
- **Infraestructura**: Docker Compose

### Prerrequisitos
- Docker y Docker Compose
- Node.js 18+
- Python 3.11+
- Git

### 1. Clonar el repositorio
```bash
git clone https://github.com/slazaromar/tacticai.git
cd tacticai
```

### 2. Iniciar todos los servicios
```bash
docker-compose up --build
```

### 4. Acceder a la aplicación
| Servicio | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Backend | http://localhost:4000 |
| Motor de Recomendación | http://localhost:8000 |
| Docs API (FastAPI) | http://localhost:8000/docs |
| pgAdmin | http://localhost:5050 |

---

## Autenticación

Autenticación basada en JWT con tokens de acceso (15 min) y tokens de refresco (7 días).

**Credenciales por defecto (desarrollo):**
- Email: `admin@tacticai.com`
- Contraseña: `Admin1234!`

---

## Algoritmo de Recomendación

El motor de recomendación puntúa a cada jugador disponible mediante una fórmula ponderada:

$$\text{Puntuación} = w_1 \cdot \text{PuntuaciónForma} + w_2 \cdot \text{PuntuaciónRol} + w_3 \cdot \text{PuntuaciónGlobal} + w_4 \cdot \text{PuntuaciónContrato}$$

| Factor | Peso | Descripción |
|--------|------|-------------|
| Puntuación de Forma | 40% | Rendimiento en partidos recientes (1–10) |
| Rol en el Equipo | 30% | Titular > Rotación > Reserva > Cantera |
| Puntuación Global | 20% | Calidad general del jugador (1–100) |
| Estabilidad del Contrato | 10% | Años restantes de contrato |

Los jugadores lesionados o sancionados son excluidos automáticamente.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, React Router v6, Axios, TailwindCSS |
| Backend | Node.js 18, Express 4, JWT, bcrypt |
| Recomendación | Python 3.11, FastAPI, Pandas, NumPy |
| Base de Datos | PostgreSQL 15 |
| Caché | Redis 7 |
| Infraestructura | AWS CloudFormation (ECS, RDS, ElastiCache, ALB) |
| Contenedores | Docker, Docker Compose |
| CI/CD | GitHub Actions |

---

## Flujo de Trabajo Git

```
main          ← versiones en producción
develop       ← rama de integración
feature/*     ← nuevas funcionalidades
fix/*         ← corrección de errores
hotfix/*      ← correcciones críticas en producción
```

---

## Infraestructura AWS

- **VPC** — Red aislada con subredes públicas/privadas en 2 zonas de disponibilidad
- **ECS Fargate** — Contenedores serverless para todos los servicios
- **RDS PostgreSQL** — Base de datos gestionada Multi-AZ
- **ElastiCache Redis** — Clúster Redis gestionado
- **ALB** — Balanceador de carga de aplicaciones con terminación SSL
- **ECR** — Registro de contenedores
- **Secrets Manager** — Almacenamiento seguro de credenciales

### Desplegar la Infraestructura (En desarrollo)

1 - Desplegar vpc.yml en AWS Cloudformation

2 - Desplegar databases.yml en AWS Cloudformation

3 - Desplegar ecs.yml en AWS Cloudformation

---

## Pruebas

```bash
# Pruebas del backend (instala dependencias automáticamente)
cd backend && npm test

# Pruebas del frontend (instala dependencias automáticamente)
cd frontend && npm test

# Pruebas del motor de recomendación (crea el venv y lo instala todo automáticamente)
cd motor-recomendacion && make test
```

