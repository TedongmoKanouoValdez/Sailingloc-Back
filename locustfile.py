from locust import HttpUser, task
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'test', 'performances'))

from auth import HelloWorldUser
from profile_test import ClientProfileTestUser