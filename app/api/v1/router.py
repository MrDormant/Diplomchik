from fastapi import APIRouter

from app.api.v1.endpoints import admin, auth_users, calculate, projects, public, requests, showcase, solutions

api_router = APIRouter()

api_router.include_router(public.router, tags=["public"])
api_router.include_router(auth_users.router, tags=["auth"])
api_router.include_router(calculate.router, tags=["calculator"])
api_router.include_router(projects.router, tags=["projects"])
api_router.include_router(requests.router, tags=["requests"])
api_router.include_router(solutions.router, tags=["solutions"])
api_router.include_router(showcase.router, tags=["showcase"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
