import { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const [selectedAgent, setSelectedAgent] = useState(() => {
    const savedAgent = localStorage.getItem('selectedAgent');
    return savedAgent ? JSON.parse(savedAgent) : null;
  });

  const selectAgent = (agent) => {
    setSelectedAgent(agent);
    localStorage.setItem('selectedAgent', JSON.stringify(agent));
  };

  return (
    <UserContext.Provider value={{ 
      selectedAgent, 
      selectAgent 
    }}>
      {children}
    </UserContext.Provider>
  );
}
