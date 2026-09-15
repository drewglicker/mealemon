import { Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import Explore from './pages/Explore'
import RecipeDetail from './pages/RecipeDetail'
import MealPlan from './pages/MealPlan'
import Groceries from './pages/Groceries'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Explore />} />
        <Route path="/recipe/:slug" element={<RecipeDetail />} />
        <Route path="/meal-plan" element={<MealPlan />} />
        <Route path="/groceries" element={<Groceries />} />
      </Route>
    </Routes>
  )
}
