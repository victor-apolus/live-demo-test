import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const agents = [
  {
    id: 'contratos',
    name: 'Agente Contratos',
    description: 'Especializado em assuntos contratuais e negociações',
    icon: '📝'
  },
  {
    id: 'trabalhista',
    name: 'Agente Trabalhista',
    description: 'Especializado em direito trabalhista e recursos humanos',
    icon: '👷'
  },
  {
    id: 'civel',
    name: 'Agente Cível',
    description: 'Especializado em direito civil e processos relacionados',
    icon: '⚖️'
  }
];

function AgentSelection() {
  const navigate = useNavigate();
  const { user, selectAgent } = useUser();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleAgentSelect = (agent) => {
    selectAgent(agent);
    navigate(`/chat/${agent.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Selecione um Agente</h1>
        <p className="text-gray-600">Escolha o agente especialista para sua consulta</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleAgentSelect(agent)}
          >
            <div className="p-6">
              <div className="text-4xl mb-4">{agent.icon}</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{agent.name}</h2>
              <p className="text-gray-600">{agent.description}</p>
            </div>
            <div className="bg-blue-50 px-6 py-3 flex justify-end">
              <span className="text-blue-600 font-medium">Selecionar →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AgentSelection;
