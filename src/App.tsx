import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RecipeListPage } from './pages/RecipeListPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { Footer } from './components/Footer';
import { AuthGuard } from './components/AuthGuard';
import { LoginPage } from './pages/admin/LoginPage';
import { RecipeListAdminPage } from './pages/admin/RecipeListAdminPage';
import { RecipeFormPage } from './pages/admin/RecipeFormPage';

function App() {
  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">Hoppa till innehållet</a>
      <Routes>
        <Route path="/" element={<RecipeListPage />} />
        <Route path="/recept/:slug" element={<RecipeDetailPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<AuthGuard />}>
          <Route index element={<RecipeListAdminPage />} />
          <Route path="nytt" element={<RecipeFormPage />} />
          <Route path="redigera/:slug" element={<RecipeFormPage />} />
        </Route>
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
