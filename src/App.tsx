import { HashRouter, Routes, Route } from 'react-router-dom';
import { RecipeListPage } from './pages/RecipeListPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<RecipeListPage />} />
        <Route path="/recipes/:slug" element={<RecipeDetailPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
