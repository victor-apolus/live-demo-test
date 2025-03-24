import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

function Login() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useUser();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Por favor, insira um nome ou e-mail.');
      return;
    }
    
    login({ username });
    navigate('/agents');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Bem-vindo ao Delfus</h1>
          <p className="text-gray-600">Entre para acessar os agentes</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
              Nome ou E-mail
            </label>
            <input
              type="text"
              id="username"
              className="input-field"
              placeholder="Digite seu nome ou e-mail"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          
          <button
            type="submit"
            className="w-full btn-primary py-3"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
