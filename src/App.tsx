import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RecipeListPage } from './pages/RecipeListPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { Footer } from './components/Footer';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RecipeListPage />} />
        <Route path="/recept/:slug" element={<RecipeDetailPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
