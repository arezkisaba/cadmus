# Conventions de nommage et de style C#

## Général
- Privilégier la synthaxe NET 10.0
- Utiliser PascalCase pour les classes, interfaces, méthodes, propriétés, événements, namespaces
- Utiliser camelCase pour les variables et les paramètres
- Préfixer les interfaces par un I (ex: `IService`)
- Préfixer les types génériques par T (ex: `TUser`)
- Fichiers : PascalCase correspondant au nom de la classe principale
- Fichiers de contrôleurs/services : PascalCase avec suffixe (ex: `UserController.cs`, `UserService.cs`)
- Constantes : PascalCase
- Dossiers : PascalCase ou kebab-case selon contexte
- Champs privés : _camelCase avec underscore initial
- Toujours indiquer le modificateur d'accès (public/private/protected/internal) sur les membres
- Les méthodes asynchrones doivent se terminer par "Async"
- Les méthodes privées doivent être regroupées dans une section `#region Private use`
- Les messages de log/console doivent être en anglais
- Privilégier la syntaxe async/await à .ContinueWith()
- Aucun commentaire dans le code source C# (préférer un code clair et des noms explicites)
- Interdiction du snake_case et des noms en majuscules pour variables/fonctions/classes (hors constantes globales exportées)

## Usings et organisation
- Grouper les usings par type (système, externes, internes)
- Utiliser des usings explicites, jamais de dynamic ou reflection

## Champs et propriétés
- Déclarer les champs privés en haut des classes, suivis des propriétés publiques

## Constructeurs
- Toujours placer le constructeur après les champs/propriétés

## Méthodes
- Grouper les méthodes publiques avant les méthodes privées
- Toujours indiquer le modificateur d'accès
- Les méthodes privées dans `#region Private use`

## Structures conditionnelles
- Toujours utiliser des accolades même pour une seule instruction
- Les accolades ouvrantes et fermantes doivent toujours être suivies d'un retour à la ligne
- Privilégier les if/else explicites, éviter les ternaires imbriqués

## Boucles
- Privilégier foreach, for, while selon le contexte
- Toujours utiliser des variables de boucle explicites (ex: item, index)

## Enums
- Utiliser PascalCase pour les noms d'enum et leurs membres

## Interfaces
- Préfixer par I (ex: `IService`)

## Exemple complet respectant toutes les conventions

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyApplication.Services
{
    public enum UserRole
    {
        Admin,
        User,
        Guest
    }

    public interface IUserData
    {
        int Id { get; set; }
        string Name { get; set; }
        UserRole Role { get; set; }
    }

    public class UserData : IUserData
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public UserRole Role { get; set; }
    }

    public interface IUserProfileService<TUser> where TUser : IUserData
    {
        Task<TUser> LoadDataAsync();
        UserRole GetUserRole();
    }

    public class UserProfileService : IUserProfileService<UserData>
    {
        private const int MaxRetryCount = 3;
        
        private readonly int _userId;
        private int _retryCount;

        public string UserName { get; set; }
        public bool IsActive { get; set; }

        public UserProfileService(string userName, int userId)
        {
            UserName = userName;
            _userId = userId;
            _retryCount = 0;
            IsActive = true;
        }

        public async Task<UserData> LoadDataAsync()
        {
            if (!IsActive)
            {
                return null;
            }

            var data = await FetchUserDataAsync();
            
            if (data != null)
            {
                await ProcessDataAsync(data);
            }

            return data;
        }

        public UserRole GetUserRole()
        {
            var roles = new List<UserRole> { UserRole.Admin, UserRole.User, UserRole.Guest };
            
            foreach (var role in roles)
            {
                if (CheckRole(role))
                {
                    return role;
                }
            }

            return UserRole.Guest;
        }

        #region Private use

        private async Task<UserData> FetchUserDataAsync()
        {
            if (_retryCount >= MaxRetryCount)
            {
                Console.WriteLine("Max retry count reached");
                return null;
            }

            _retryCount++;
            
            return new UserData
            {
                Id = _userId,
                Name = UserName,
                Role = UserRole.User
            };
        }

        private async Task ProcessDataAsync(UserData data)
        {
            var items = new[] { 1, 2, 3 };
            
            foreach (var item in items)
            {
                if (item > 1)
                {
                    Console.WriteLine("Processing item");
                }
            }
        }

        private bool CheckRole(UserRole role)
        {
            return role == UserRole.User;
        }

        #endregion
    }
}
```
