from django.contrib import admin
from django.urls import path
from django.http import JsonResponse

def health(request):
    return JsonResponse({"status": "ok", "service": "fitware", "version": "0.1.0"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
]