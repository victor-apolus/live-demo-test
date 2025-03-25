import { useNavigate } from 'react-router-dom';

function Welcome() {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/agents');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-apolus-white p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-apolus-blue mb-6">Bem-vindo à Linha Delfus</h1>
        
        <p className="text-apolus-gray mb-8">
          Selecione o especialista jurídico com quem deseja conversar. Cada Delfus é especializado em uma área específica do Direito, pronto para auxiliar você.
        </p>
        
        <button
          onClick={handleContinue}
          className="btn-primary w-full py-3 text-lg"
        >
          Selecionar Delfus
        </button>
      </div>
    </div>
  );
}

export default Welcome;
