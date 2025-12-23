__test__ = False
from .settings import *

# Testlerde hızlı ve güvenli DB
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Testlerde mail gerçekten gitmesin
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# (İstersen) debug açık kalsın
DEBUG = True
