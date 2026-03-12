import { NavLink, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import PracticePage from "./pages/PracticePage";
import BankPage from "./pages/BankPage";
import WrongbookPage from "./pages/WrongbookPage";
import DecomposePage from "./pages/DecomposePage";

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">可信考试 Micro Drills</div>
        <nav>
          <NavLink to="/">首页</NavLink>
          <NavLink to="/practice">练习</NavLink>
          <NavLink to="/bank">题库</NavLink>
          <NavLink to="/wrongbook">错题</NavLink>
          <NavLink to="/decompose">拆解</NavLink>
        </nav>
      </header>
      <main className="page-wrap">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/bank" element={<BankPage />} />
          <Route path="/wrongbook" element={<WrongbookPage />} />
          <Route path="/decompose" element={<DecomposePage />} />
        </Routes>
      </main>
    </div>
  );
}
