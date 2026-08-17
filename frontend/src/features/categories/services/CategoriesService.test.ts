import 'reflect-metadata';
import { stripLeadingArticle } from './CategoriesService';

describe('stripLeadingArticle', () => {
    it.each([
        ['the bus', 'bus'],
        ['an apple', 'apple'],
        ['a house', 'house'],
        ['Le chat', 'chat'],
        ['la maison', 'maison'],
        ['des fleurs', 'fleurs'],
        ['el perro', 'perro'],
        ['los niños', 'niños'],
        ['das Mädchen', 'Mädchen'],
        ['ein Hund', 'Hund'],
        ['il gatto', 'gatto'],
        ['uma casa', 'casa'],
        ['the quick brown fox', 'quick brown fox'],
        ['de la maison', 'maison'],
    ])('strips leading articles from "%s"', (input, expected) => {
        expect(stripLeadingArticle(input)).toBe(expected);
    });

    it('leaves words without articles unchanged', () => {
        expect(stripLeadingArticle('apple')).toBe('apple');
        expect(stripLeadingArticle('dessert')).toBe('dessert');
    });
});
