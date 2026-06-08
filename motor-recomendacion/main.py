import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.configuracion import configuracion
from app.api.routes         import alineacion

app = FastAPI(
    title="TacticAI — Motor de Recomendación",
    description=(
        "Servicio FastAPI que genera alineaciones de fútbol óptimas a partir "
        "del análisis de los datos de los jugadores."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[configuracion.BACKEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(alineacion.router, prefix="/api/v1", tags=["alineacion"])


@app.get("/health", tags=["salud"])
def salud():
    return {"estado": "ok", "servicio": "motor-recomendacion"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=configuracion.DEPURAR,
        log_level="debug" if configuracion.DEPURAR else "info",
    )
