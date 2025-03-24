import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

function Header() {
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-600">Delfus</h1>
        
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Olá, {user.username}</span>
            <button 
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-red-600"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
