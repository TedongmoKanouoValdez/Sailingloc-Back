from locust import HttpUser, task, between
import uuid
import random

class ClientProfileTestUser(HttpUser):
    """
    Utilisateur CLIENT test - Accès uniquement à son propre profil
    """
    
    wait_time = between(3, 8)  # Temps réaliste entre les actions
    
    def on_start(self):
        """Initialisation à chaque nouvel utilisateur virtuel"""
        self.user_id = f"client_{uuid.uuid4().hex[:8]}"
        self.email = f"{self.user_id}@example.com"
        self.password = "Motdepasse@123"
        self.first_name = "Jean"
        self.last_name = "Dupont"
        self.auth_token = None
        self.is_authenticated = False
        self.my_user_id = None
        
        # Premier : s'inscrire et se connecter
        if self.register_user():
            self.login_user()

    def register_user(self):
        """Inscription du client - Debug version"""
        url = "/api/auth/register"
        print(f"Tentative d'inscription sur: {url}")
        
        with self.client.post(url, 
            json={
                "nom": self.last_name,
                "prenom": self.first_name,
                "email": self.email,
                "password": self.password,
                "role": "CLIENT"
            },
            catch_response=True,
            name="client_register"
        ) as response:
            
            print(f"Response: {response.status_code} - {response.text}")
            
            if response.status_code in [200, 201]:
                print(f"Client inscrit: {self.email}")
                return True
            else:
                print(f"Echec inscription: {response.status_code} - URL: {url}")
                return False
   
    def login_user(self):
        """Connexion du client - Route /api/auth/login"""
        with self.client.post("/api/auth/login", 
            json={
                "email": self.email,
                "password": self.password
            },
            catch_response=True,
            name="client_login"
        ) as response:
            
            if response.status_code == 200:
                self.auth_token = response.json().get("token")
                self.client.headers = {
                    "Authorization": f"Bearer {self.auth_token}",
                    "Content-Type": "application/json"
                }
                self.is_authenticated = True
                print(f"Client connecte: {self.email}")
                return True
            else:
                print(f"Echec connexion client: {response.status_code}")
                return False

    # ==================== SEULEMENT LE PROFIL DE UTILISATEUR CONNECTE ====================

    @task(8)  # 80% - Consultation très fréquente
    def get_my_profile(self):
        """GET /api/utilisateur/me - Mon propre profil"""
        if self.is_authenticated:
            with self.client.get("/api/utilisateur/me", 
                               name="01_client_view_my_profile",
                               catch_response=True) as response:
                
                if response.status_code == 200:
                    self.user_data = response.json()  # Sauvegarde les données
                    response.success()
                    print("Client a consulte son profil")
                else:
                    response.failure(f"Echec consultation profil: {response.status_code}")

    @task(2)  # 20% - Modification de son profil
    def update_my_profile(self):
        """PUT /api/utilisateur/:id - avec debug complet"""
        if self.is_authenticated and hasattr(self, 'user_data'):
            
            user_id = self.user_data.get('id')
            if not user_id:
                print("Impossible de modifier: ID utilisateur non trouve")
                return
            
            new_first_name = random.choice(["Marie", "Sophie", "Julie", "Alice", "Celine"])
            new_last_name = random.choice(["Martin", "Dubois", "Leroy", "Garcia", "Navarro"])
            
            update_data = {
                "nom": new_last_name,
                "prenom": new_first_name,
                "email": self.email
            }
            
            url = f"/api/utilisateurs/{user_id}"
            print(f"Tentative PUT {url} avec donnees: {update_data}")
            
            with self.client.put(url, 
                                 json=update_data,
                                 name="02_client_update_my_profile",
                                 catch_response=True) as response:
                
                print(f"Response PUT: {response.status_code}")
                print(f"Response text: {response.text[:100]}...")
                
                if response.status_code in [200, 201]:
                    response.success()
                    print(f"Modification reussie: {new_first_name} {new_last_name}")
                else:
                    print(f"Echec detaille: {response.status_code} - {response.text}")
                    response.failure(f"Echec: {response.status_code}")

    # ==================== TENTATIVES D'ACCÈS INTERDITS ====================

    @task(1)  # 10% - Tentative d'accès à d'autres profils (devrait échouer)
    def try_access_other_profile(self):
        """Tentative d'accès à un autre profil (devrait retourner 403)"""
        if self.is_authenticated:
            other_user_id = random.randint(100, 200)  # ID qui n'est pas le sien
            
            with self.client.get(f"/api/utilisateur/{other_user_id}", 
                               name="03_client_try_access_other",
                               catch_response=True) as response:
                
                # Pour un client, accéder à d'autres profils devrait échouer (403 ou 404)
                if response.status_code == 403 or response.status_code == 404:
                    response.success()  # C'est le comportement attendu !
                    print(f"Accès interdit à l'utilisateur {other_user_id} (comportement normal)")
                elif response.status_code == 200:
                    response.failure("Le client a accédé à un autre profil (anormal!)")
                else:
                    response.failure(f"Statut inattendu: {response.status_code}")

    @task(1)  # 10% - Tentative de liste utilisateurs (interdit)
    def try_list_all_users(self):
        """Tentative de liste tous les utilisateurs (interdit pour client)"""
        if self.is_authenticated:
            with self.client.get("/api/utilisateurs/", 
                               name="04_client_try_list_users",
                               catch_response=True) as response:
                
                # Un client ne devrait pas pouvoir lister tous les utilisateurs
                if response.status_code == 403:
                    response.success()  # Comportement normal
                    print("Liste utilisateurs interdite (normal)")
                elif response.status_code == 200:
                    response.failure("Client a listé tous les utilisateurs (anormal!)")
                else:
                    response.failure(f"Statut inattendu: {response.status_code}")

    def on_stop(self):
        """Nettoyage à la fin de la session"""
        if self.is_authenticated:
            print(f"Session client terminee: {self.email}")