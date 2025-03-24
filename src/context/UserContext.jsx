import { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [selectedAgent, setSelectedAgent] = useState(() => {
    const savedAgent = localStorage.getItem('selectedAgent');
    return savedAgent ? JSON.parse(savedAgent) : null;
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setSelectedAgent(null);
    localStorage.removeItem('user');
    localStorage.removeItem('selectedAgent');
    localStorage.removeItem('chatHistory');
  };

  const selectAgent = (agent) => {
    setSelectedAgent(agent);
    localStorage.setItem('selectedAgent', JSON.stringify(agent));
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      login, 
      logout, 
      selectedAgent, 
      selectAgent 
    }}>
      {children}
    </UserContext.Provider>
  );
}
