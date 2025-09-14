from locust import HttpUser, task, between
import uuid
import time

class HelloWorldUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        self.generate_new_email()
        self.password = "Motdepasse@123"
        self.registered = False
        self.auth_token = None
        self.auth_headers = {}
        print(f"Nouvel utilisateur: {self.email}")

    def generate_new_email(self):
        self.email = f"test_{uuid.uuid4().hex[:8]}@example.com"

    @task(3)
    def register(self):
        print(f"Tentative register pour: {self.email}")
        try:
            with self.client.post("/api/auth/register", 
                json={
                    "nom": "John",
                    "prenom": "Doe",
                    "email": self.email,
                    "password": self.password,
                    "role": "CLIENT"
                },
                catch_response=True,
                name="register",
                timeout=10
            ) as response:
                
                print(f"Réponse: status={response.status_code}, text={response.text}")
                
                if response.status_code in [200, 201]:
                    self.registered = True
                    response.success()
                    print(f"Inscription réussie: {self.email}")
                    # On attend un tout petit peu avant de login
                    time.sleep(0.5)
                elif response.status_code == 409:
                    self.generate_new_email()
                    response.failure("Email déjà utilisé - nouvel email généré")
                else:
                    response.failure(f"Failed: {response.status_code}")
        except Exception as e:
            print(f"ERREUR CONNEXION: {type(e).__name__}: {e}")
            self.generate_new_email()

    @task(1)
    def login(self):
        if not self.registered:
            print("Login skip - pas encore inscrit")
            return
            
        print(f"Tentative login pour: {self.email}")
        try:
            with self.client.post("/api/auth/login", 
                json={
                    "email": self.email,
                    "password": self.password
                },
                catch_response=True,
                name="login"
            ) as response:
                
                if response.status_code == 200:
                    response.success()
                    data = response.json()
                    self.auth_token = data.get("token")
                    self.auth_headers = {
                        "Authorization": f"Bearer {self.auth_token}",
                        "Content-Type": "application/json"
                    }
                    print(f"Connexion réussie: {self.email}")
                else:
                    print(f"Échec connexion: {response.status_code} - {response.text}")
                    response.failure(f"Login failed: {response.status_code}")
        except Exception as e:
            print(f"Erreur login: {type(e).__name__} - {e}")
