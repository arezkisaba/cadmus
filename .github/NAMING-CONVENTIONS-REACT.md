# Conventions de nommage et de style React (JS/TS/TSX)

- Toujours utiliser les fonctions fléchées pour les composants React **et pour toutes les fonctions internes à ces composants**
- PascalCase pour les composants React et leurs fichiers (ex: `MyComponent.tsx`)
- Props de composants : camelCase
- Privilégier TypeScript (.tsx)
- Privilégier l’utilisation de hooks personnalisés pour la logique réutilisable
- Privilégier la composition de composants plutôt que l’héritage
- Les messages de console/log doivent être en anglais
- Aucun commentaire dans le code source
- Respecter toutes les conventions générales du fichier NAMING-CONVENTIONS-JSTS.md

## Exemples
```tsx
// Correct
export const MyComponent: React.FC = () => {
  const handleClick = (): void => {
    // ...
  };
  return <button onClick={handleClick}>Hello</button>;
};

// Incorrect
function mycomponent() { // function classique et nom incorrect
  function handleClick() { // function classique interne
    // ...
  }
  return <button onClick={handleClick}>Hi</button>;
}
```
