import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const agents = [
  {
    id: 'bancario',
    name: 'Delfus Bancário',
    description: 'Especialista em Direito Bancário, contratos financeiros e sistema financeiro nacional.',
    icon: '💼',
    iconEmoji: '💼',
    webhook: 'https://n8nwebh.apolus.ai/webhook/live-demo-bancario',
    placeholder: 'Pergunte sobre contratos bancários, crédito ou questões financeiras...'
  },
  {
    id: 'trabalhista',
    name: 'Delfus Trabalhista',
    description: 'Especialista em Direito Trabalhista, relações de trabalho e recursos humanos.',
    icon: '👷',
    iconEmoji: '👷',
    webhook: 'https://n8nwebh.apolus.ai/webhook/live-demo-trabalhista',
    placeholder: 'Digite sua dúvida sobre direitos trabalhistas ou processos laborais...'
  },
  {
    id: 'oab',
    name: 'Delfus Processo Disciplinar OAB',
    description: 'Especialista em Ética Profissional, procedimentos e processos disciplinares OAB.',
    icon: '⚖️',
    iconEmoji: '⚖️',
    webhook: 'https://n8nwebh.apolus.ai/webhook/live-demo-ted-oab',
    placeholder: 'Faça sua pergunta sobre ética ou processo disciplinar OAB...'
  }
];

function AgentSelection() {
  const navigate = useNavigate();
  const { selectAgent } = useUser();

  const handleAgentSelect = (agent) => {
    selectAgent(agent);
    navigate(`/chat/${agent.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl min-h-screen flex flex-col">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-apolus-blue mb-3">Selecione um Especialista</h1>
        <p className="text-apolus-gray text-lg">Escolha o Delfus especialista para sua consulta jurídica</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 flex-grow">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex flex-col bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 h-full"
          >
            {/* Card header with icon */}
            <div className="bg-apolus-blue/5 p-5 flex justify-center items-center">
              <div className="w-20 h-20 flex items-center justify-center text-5xl bg-white rounded-full shadow-sm">
                {agent.iconEmoji}
              </div>
            </div>
            
            {/* Card content */}
            <div className="p-6 flex-grow flex flex-col">
              <h2 className="text-xl font-bold text-apolus-blue mb-3">{agent.name}</h2>
              <p className="text-apolus-gray flex-grow">{agent.description}</p>
            </div>
            
            {/* Call to action */}
            <button 
              onClick={() => handleAgentSelect(agent)}
              className="w-full py-4 px-6 bg-apolus-blue text-white font-medium hover:bg-apolus-blue/90 transition-colors flex items-center justify-center gap-2"
            >
              <span>Selecionar</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AgentSelection;
