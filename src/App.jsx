import { HashRouter, Route, Routes} from 'react-router'
import './App.css'
import Home from './components/Home'
import AboutMe from './components/AboutMe'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

function App() {
  return <HashRouter>
      <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutMe />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
  </HashRouter>
}

export default App
