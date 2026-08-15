# Conventions de nommage et de style JS/TS/JSX/TSX

## Général
- Privilégier TypeScript (.ts/.tsx) au JavaScript (.js/.jsx)
- Utiliser PascalCase pour les classes, interfaces, types, propriétés, événements, namespaces
- Utiliser camelCase pour les variables, les méthodes et les paramètres
- Préfixer les interfaces par un I (ex: `IService`)
- Préfixer les types génériques par T (ex: `TUser`)
- Fichiers de services, hooks, utilitaires : camelCase ou kebab-case (ex: `useFetch.ts`, `api-client.ts`)
- Fichiers de composants React : PascalCase (ex: `UserProfile.tsx`)
- Constantes globales exportées : MAJUSCULES_UNDERSCORE, sinon camelCase
- Dossiers : kebab-case uniquement
- Champs privés : camelCase sans underscore initial
- Toujours indiquer le modificateur (private/protected/public) sur les membres
- Les méthodes asynchrones ne doivent pas se terminer par "Async"
- Les méthodes privées doivent être regroupées dans une section `// #region Private use`
- Les messages de console doivent être affichés en anglais
- Privilégier la syntaxe async/await plutôt que .then()
- Aucun commentaire dans le code source JS/TS/JSX/TSX (ni `//`, ni `/* ... */`)
- Interdiction du snake_case et des noms en majuscules pour variables/fonctions/classes (hors constantes globales exportées)

## Imports et organisation
- Grouper les imports par type (librairies externes, internes, styles)
- Utiliser des imports explicites, jamais de require

## Champs et propriétés
- Déclarer les champs privés en haut des classes, suivis des propriétés publiques

## Constructeurs
- Toujours placer le constructeur après les champs/propriétés

## Méthodes
- Grouper les méthodes publiques avant les méthodes privées
- Toujours indiquer le modificateur d'accès
- Les méthodes privées dans `// #region Private use`

## Structures conditionnelles
- Toujours utiliser des accolades même pour une seule instruction
- Les accolades ouvrantes et fermantes doivent toujours être suivies d'un retour à la ligne
- Privilégier les if/else explicites, éviter les ternaires imbriqués

## Boucles
- Privilégier for...of, forEach, map, filter, reduce selon le contexte
- Toujours utiliser des variables de boucle explicites (ex: item, index)

## Enums
- Utiliser PascalCase pour les noms d'enum et leurs membres

## Interfaces
- Préfixer par I (ex: `IUserData`)

## Exemple complet respectant toutes les conventions

```ts
import { EventEmitter } from "events";

enum UserRole {
	Admin,
	User,
	Guest
}

interface IUserData {
	id: number;
	name: string;
	role: UserRole;
}

type TUserId = number;

const MAX_RETRY_COUNT = 3;

class UserProfileService {
	private userId: TUserId;
	private retryCount: number;

	public userName: string;
	public isActive: boolean;

	constructor(userName: string, userId: TUserId) {
		this.userName = userName;
		this.userId = userId;
		this.retryCount = 0;
		this.isActive = true;
	}

	public async loadData(): Promise<IUserData | null> {
		if (!this.isActive) {
			return null;
		}

		const data = await this.fetchUserData();
		
		if (data) {
			await this.processData(data);
		}

		return data;
	}

	public getUserRole(): UserRole {
		const roles = [UserRole.Admin, UserRole.User, UserRole.Guest];
		
		for (const role of roles) {
			if (this.checkRole(role)) {
				return role;
			}
		}

		return UserRole.Guest;
	}

	// #region Private use

	private async fetchUserData(): Promise<IUserData | null> {
		if (this.retryCount >= MAX_RETRY_COUNT) {
			console.log("Max retry count reached");
			return null;
		}

		this.retryCount++;
		
		return {
			id: this.userId,
			name: this.userName,
			role: UserRole.User
		};
	}

	private async processData(data: IUserData): Promise<void> {
		const items = [1, 2, 3];
		
		items.forEach((item) => {
			if (item > 1) {
				console.log("Processing item");
			}
		});
	}

	private checkRole(role: UserRole): boolean {
		return role === UserRole.User;
	}

	// #endregion
}
```
