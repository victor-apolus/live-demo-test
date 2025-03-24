import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import ReactMarkdown from 'react-markdown';

// Updated webhook URL
const WEBHOOK_URL = 'https://n8nwebh.apolus.ai/webhook/teste-delfus';

function Chat() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { user, selectedAgent, selectAgent } = useUser();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const messageRefs = useRef({});

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // If we have an agentId from URL but no selectedAgent in context
    if (agentId && !selectedAgent) {
      // Fetch agent data based on agentId
      const agents = [
        { id: 'contratos', name: 'Agente Contratos', icon: '📝' },
        { id: 'trabalhista', name: 'Agente Trabalhista', icon: '👷' },
        { id: 'civel', name: 'Agente Cível', icon: '⚖️' }
      ];
      
      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        selectAgent(agent);
      } else {
        navigate('/agents');
      }
    }

    // Load chat history from localStorage
    const savedHistory = localStorage.getItem(`chatHistory-${agentId}`);
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, [user, agentId, selectedAgent, navigate, selectAgent]);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const saveHistory = (history) => {
    localStorage.setItem(`chatHistory-${agentId}`, JSON.stringify(history));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString()
    };
    
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    saveHistory(newHistory);
    
    const currentMessage = message;
    setMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    setLoading(true);

    try {
      const requestData = {
        agentId: agentId,
        message: currentMessage
      };
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        throw new Error('Invalid JSON response');
      }

      // Extract the bot's reply, checking various possible response formats
      let botReply = 'Desculpe, não consegui processar a resposta do servidor.';
      
      if (data.output) {
        botReply = data.output;
      } else if (data.reply) {
        botReply = data.reply;
      } else if (data.response) {
        botReply = data.response;
      } else if (data.message) {
        botReply = data.message;
      } else if (data.text) {
        botReply = data.text;
      } else if (data.content) {
        botReply = data.content;
      } else if (typeof data === 'string') {
        botReply = data;
      }

      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botReply,
        timestamp: new Date().toISOString()
      };

      const updatedHistory = [...newHistory, botMessage];
      setChatHistory(updatedHistory);
      saveHistory(updatedHistory);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: `Erro ao processar a resposta: ${error.message}. Por favor, tente novamente.`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      const updatedHistory = [...newHistory, errorMessage];
      setChatHistory(updatedHistory);
      saveHistory(updatedHistory);
    } finally {
      setLoading(false);
    }
  };

  // Method to get plain text content for selection
  const getPlainText = (markdownText) => {
    // Simple markdown to plain text conversion for common patterns
    return markdownText
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1')     // Italic
      .replace(/__(.*?)__/g, '$1')     // Underline
      .replace(/~~(.*?)~~/g, '$1')     // Strikethrough
      .replace(/```(.*?)```/g, '$1')   // Code blocks
      .replace(/`(.*?)`/g, '$1')       // Inline code
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1'); // Links
  };

  // New method to select text in a message
  const handleSelectText = (id, markdownText) => {
    const plainText = getPlainText(markdownText);
    
    // Try to create a text area and copy to clipboard
    const textarea = document.createElement('textarea');
    textarea.value = plainText;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    
    try {
      textarea.select();
      document.execCommand('copy');
      setSelectedText(id);
      setTimeout(() => setSelectedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      
      // Fallback: show the text selected in the UI
      if (messageRefs.current[id]) {
        const range = document.createRange();
        range.selectNodeContents(messageRefs.current[id]);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        setSelectedText(id);
        setTimeout(() => setSelectedText(null), 2000);
      }
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const handleBack = () => {
    navigate('/agents');
  };

  const clearChat = () => {
    setChatHistory([]);
    localStorage.removeItem(`chatHistory-${agentId}`);
  };

  const handleKeyDown = (e) => {
    // Send message on Ctrl+Enter or Command+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSendMessage(e);
    }
  };

  if (!user || !selectedAgent) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Voltar
          </button>
          <div className="flex items-center">
            <span className="text-xl mr-2">{selectedAgent.icon}</span>
            <h1 className="text-lg font-medium">{selectedAgent.name}</h1>
          </div>
          <button
            onClick={clearChat}
            className="text-sm text-gray-600 hover:text-red-600 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Limpar
          </button>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {chatHistory.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>Envie uma mensagem para iniciar a conversa com o {selectedAgent.name}.</p>
            </div>
          ) : (
            chatHistory.map((msg) => (
              <div 
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`rounded-lg px-4 py-3 max-w-[90%] md:max-w-[75%] relative ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : msg.isError 
                        ? 'bg-red-100 text-red-800' 
                        : msg.isSimulated
                        ? 'bg-yellow-50 text-gray-800 shadow border border-yellow-200'
                        : 'bg-white text-gray-800 shadow hover:shadow-md'
                  } ${selectedText === msg.id ? 'ring-2 ring-blue-400' : ''} ${
                    msg.sender === 'bot' ? 'cursor-pointer transition-all duration-200 ease-in-out' : ''
                  }`}
                  onClick={msg.sender === 'bot' ? () => handleSelectText(msg.id, msg.text) : undefined}
                >
                  {/* Use ReactMarkdown for bot messages only */}
                  {msg.sender === 'bot' ? (
                    <div ref={(el) => messageRefs.current[msg.id] = el} className="markdown-content">
                      <ReactMarkdown 
                        className="whitespace-pre-wrap break-words"
                        components={{
                          // Style components
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                          em: ({node, ...props}) => <em className="italic" {...props} />,
                          h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-base font-bold mb-1" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-2" {...props} />,
                          li: ({node, ...props}) => <li className="mb-1" {...props} />,
                          a: ({node, ...props}) => <a className="text-blue-600 underline" {...props} />,
                          code: ({node, inline, ...props}) => 
                            inline 
                              ? <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} />
                              : <code className="block bg-gray-100 p-2 rounded text-sm my-2 overflow-auto" {...props} />
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p 
                      ref={(el) => messageRefs.current[msg.id] = el}
                      className="whitespace-pre-wrap break-words"
                    >
                      {msg.text}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-xs ${msg.sender === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                      {msg.isSimulated && ' (simulado)'}
                    </span>
                    
                    {/* Copy indicator that appears when text is selected */}
                    {(msg.sender === 'bot' && selectedText === msg.id) && (
                      <span className="text-green-600 text-xs ml-2 flex items-center animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Texto copiado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
          <div className="flex flex-col">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="w-full p-3 pr-24 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[50px] max-h-[200px] overflow-y-auto"
                disabled={loading}
                rows="1"
              />
              <div className="absolute bottom-2 right-2 flex items-center">
                <span className="text-xs text-gray-400 mr-2">
                  {message.length > 0 ? 'Ctrl+Enter para enviar' : ''}
                </span>
                <button
                  type="submit"
                  className="btn-primary py-1 px-4 text-sm"
                  disabled={loading || !message.trim()}
                >
                  {loading ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Chat;
