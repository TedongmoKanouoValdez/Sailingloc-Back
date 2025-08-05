from locust import HttpUser, task
import uuid

class HelloWorldUser(HttpUser):
    @task
    def hello_world(self):
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        password = "Motdepasse@123"
        # 1. Inscription
        self.client.post("/api/auth/register", json={
            "nom": "John",
            "prenom": "Doe",
            "email": unique_email,
            "password": password,
            "role": "CLIENT"
        })

        # 2. Connexion
        self.client.post("/api/auth/login", json={
            "email": unique_email,
            "password": password
        })