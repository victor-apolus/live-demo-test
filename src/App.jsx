import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AgentSelection from './pages/AgentSelection';
import Chat from './pages/Chat';
import { UserProvider } from './context/UserContext';

function App() {
  return (
    <UserProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/agents" element={<AgentSelection />} />
          <Route path="/chat/:agentId" element={<Chat />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </UserProvider>
  );
}

export default App;
