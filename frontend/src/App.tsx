import 'reflect-metadata';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Layout } from './components/layout';
import { ThemeProvider } from './components/theme-provider';
import { CategoriesPage } from './features/categories/pages/CategoriesPage';
import { FlashcardReviewPage } from './features/flashcards/pages/FlashcardReviewPage';
import { SettingsPage } from './features/settings/pages/SettingsPage';
import { SongDetailPage } from './features/songs/pages/SongDetailPage';
import { SongsPage } from './features/songs/pages/SongsPage';

export const App: React.FC = () => {
    return (
        <ThemeProvider defaultTheme="dark">
            <Router>
                <Layout>
                    <Routes>
                        <Route path="/" element={<CategoriesPage />} />
                        <Route path="/review/:categoryId" element={<FlashcardReviewPage />} />
                        <Route path="/songs" element={<SongsPage />} />
                        <Route path="/songs/:trackId" element={<SongDetailPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="*" element={<CategoriesPage />} />
                    </Routes>
                </Layout>
            </Router>
        </ThemeProvider>
    );
};
