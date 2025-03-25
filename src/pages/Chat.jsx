import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';

// Agent definitions with production webhooks
const agentDefinitions = {
  bancario: {
    id: 'bancario',
    name: 'Delfus Bancário',
    icon: '💼',
    webhook: 'https://n8nwebh.apolus.ai/webhook/live-demo-bancario',
    placeholder: 'Pergunte sobre contratos bancários, crédito ou questões financeiras...'
  },
  trabalhista: {
    id: 'trabalhista',
    name: 'Delfus Trabalhista',
    icon: '👷',
    webhook: 'https://n8nwebh.apolus.ai/webhook/live-demo-trabalhista',
    placeholder: 'Digite sua dúvida sobre direitos trabalhistas ou processos laborais...'
  },
  oab: {
    id: 'oab',
    name: 'Delfus Processo Disciplinar OAB',
    icon: '⚖️',
    webhook: 'https://n8nwebh.apolus.ai/webhook/live-demo-ted-oab',
    placeholder: 'Faça sua pergunta sobre ética ou processo disciplinar OAB...'
  }
};

// Constants for timing
const LONG_REQUEST_WARNING_TIME = 30000; // 30 seconds
const MAX_REQUEST_WAIT_TIME = 300000; // 5 minutes (longer than the 3-4 minutes mentioned)

function Chat() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { selectedAgent, selectAgent } = useUser();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLongRequest, setIsLongRequest] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const [sessionId, setSessionId] = useState(() => {
    // Try to get existing sessionId from localStorage, or generate a new one
    const savedSessionId = localStorage.getItem(`sessionId-${agentId}`);
    return savedSessionId || uuidv4();
  });
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const messageRefs = useRef({});
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // If we have an agentId from URL but no selectedAgent in context
    if (agentId && (!selectedAgent || selectedAgent.id !== agentId)) {
      const agent = agentDefinitions[agentId];
      if (agent) {
        selectAgent(agent);
        
        // If agent ID changed, generate a new session ID
        const savedSessionId = localStorage.getItem(`sessionId-${agentId}`);
        if (!savedSessionId) {
          const newSessionId = uuidv4();
          setSessionId(newSessionId);
          localStorage.setItem(`sessionId-${agentId}`, newSessionId);
        }
      } else {
        navigate('/agents');
      }
    }

    // Load chat history from localStorage
    const savedHistory = localStorage.getItem(`chatHistory-${agentId}`);
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }

    // Cleanup function to abort any pending requests when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [agentId, selectedAgent, navigate, selectAgent]);

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

  const addTypingIndicator = () => {
    const typingMessage = {
      id: 'typing-indicator',
      sender: 'bot',
      text: 'Pensando...',
      timestamp: new Date().toISOString(),
      isTyping: true
    };
    
    setChatHistory(prev => {
      // Remove previous typing indicator if it exists
      const filteredHistory = prev.filter(msg => msg.id !== 'typing-indicator');
      return [...filteredHistory, typingMessage];
    });
  };

  const removeTypingIndicator = () => {
    setChatHistory(prev => prev.filter(msg => msg.id !== 'typing-indicator'));
  };

  const updateTypingIndicator = (text) => {
    setChatHistory(prev => {
      const updatedHistory = prev.map(msg => {
        if (msg.id === 'typing-indicator') {
          return { ...msg, text };
        }
        return msg;
      });
      return updatedHistory;
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString()
    };
    
    const newHistory = [...chatHistory.filter(msg => msg.id !== 'typing-indicator'), userMessage];
    setChatHistory(newHistory);
    saveHistory(newHistory);
    
    const currentMessage = message;
    setMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    setLoading(true);
    setIsLongRequest(false);
    
    // Add typing indicator
    addTypingIndicator();

    // Set up a timer for long-running request warning
    const longRequestTimer = setTimeout(() => {
      setIsLongRequest(true);
      updateTypingIndicator('Ainda estou processando sua pergunta... Isso pode levar alguns minutos...');
    }, LONG_REQUEST_WARNING_TIME);

    // Set a maximum request time
    const requestTimeoutTimer = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, MAX_REQUEST_WAIT_TIME);

    try {
      const agent = agentDefinitions[agentId];
      if (!agent || !agent.webhook) {
        throw new Error('Webhook URL not found for this agent');
      }

      // Updated request format to use sessionId and chatInput
      const requestData = {
        sessionId: sessionId,
        chatInput: currentMessage
      };
      
      console.log('Sending webhook request:', requestData);
      
      const response = await fetch(agent.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData),
        signal: signal,
        // Set to a very long timeout
        timeout: MAX_REQUEST_WAIT_TIME
      });
      
      // Clear timers
      clearTimeout(longRequestTimer);
      clearTimeout(requestTimeoutTimer);
      
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
      
      if (data.response) {
        botReply = data.response;
      } else if (data.output) {
        botReply = data.output;
      } else if (data.reply) {
        botReply = data.reply;
      } else if (data.message) {
        botReply = data.message;
      } else if (data.text) {
        botReply = data.text;
      } else if (data.content) {
        botReply = data.content;
      } else if (typeof data === 'string') {
        botReply = data;
      }

      // Remove typing indicator
      removeTypingIndicator();

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
      
      // Clear timers
      clearTimeout(longRequestTimer);
      clearTimeout(requestTimeoutTimer);
      
      // Remove typing indicator
      removeTypingIndicator();
      
      let errorMessage;
      if (error.name === 'AbortError') {
        errorMessage = {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'A resposta está demorando mais do que o esperado. Por favor, tente uma pergunta mais simples ou tente novamente mais tarde.',
          timestamp: new Date().toISOString(),
          isError: true
        };
      } else {
        errorMessage = {
          id: Date.now() + 1,
          sender: 'bot',
          text: `Erro ao processar a resposta: ${error.message}. Por favor, tente novamente.`,
          timestamp: new Date().toISOString(),
          isError: true
        };
      }
      
      const updatedHistory = [...newHistory, errorMessage];
      setChatHistory(updatedHistory);
      saveHistory(updatedHistory);
    } finally {
      setLoading(false);
      setIsLongRequest(false);
      abortControllerRef.current = null;
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
    // Cancel any ongoing request before navigating away
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    navigate('/agents');
  };

  const clearChat = () => {
    setChatHistory([]);
    localStorage.removeItem(`chatHistory-${agentId}`);
    
    // Generate a new session ID when clearing chat
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    localStorage.setItem(`sessionId-${agentId}`, newSessionId);
  };

  const handleKeyDown = (e) => {
    // Send message on Ctrl+Enter or Command+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSendMessage(e);
    }
  };

  if (!selectedAgent) {
    return null; // Will redirect in useEffect
  }

  const currentAgent = agentDefinitions[agentId] || selectedAgent;

  return (
    <div className="flex flex-col h-screen bg-apolus-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="text-apolus-gray hover:text-apolus-blue flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Voltar
          </button>
          <div className="flex items-center">
            <span className="text-xl mr-2">{currentAgent.icon}</span>
            <h1 className="text-lg font-medium text-apolus-blue">Conversando com {currentAgent.name}</h1>
          </div>
          <button
            onClick={clearChat}
            className="text-sm text-apolus-gray hover:text-red-600 flex items-center"
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
            <div className="text-center py-10 text-apolus-gray">
              <p>Envie uma mensagem para iniciar a conversa com o {currentAgent.name}.</p>
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
                      ? 'bg-apolus-blue text-white' 
                      : msg.isError 
                        ? 'bg-red-100 text-red-800' 
                        : msg.isTyping
                        ? 'bg-gray-100 text-gray-800 shadow'
                        : msg.isSimulated
                        ? 'bg-yellow-50 text-gray-800 shadow border border-yellow-200'
                        : 'bg-white text-gray-800 shadow hover:shadow-md'
                  } ${selectedText === msg.id ? 'ring-2 ring-apolus-blue' : ''} ${
                    msg.sender === 'bot' && !msg.isTyping ? 'cursor-pointer transition-all duration-200 ease-in-out' : ''
                  }`}
                  onClick={msg.sender === 'bot' && !msg.isTyping ? () => handleSelectText(msg.id, msg.text) : undefined}
                >
                  {/* Typing indicator */}
                  {msg.isTyping ? (
                    <div className="flex items-center">
                      <span className="mr-2">{msg.text}</span>
                      <span className="typing-dots flex space-x-1">
                        <span className="w-2 h-2 bg-apolus-gray rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-apolus-gray rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                        <span className="w-2 h-2 bg-apolus-gray rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></span>
                      </span>
                    </div>
                  ) : msg.sender === 'bot' ? (
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
                          a: ({node, ...props}) => <a className="text-apolus-blue underline" {...props} />,
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
                    <span className={`text-xs ${msg.sender === 'user' ? 'text-blue-200' : 'text-apolus-gray'}`}>
                      {!msg.isTyping && new Date(msg.timestamp).toLocaleTimeString()}
                      {msg.isSimulated && ' (simulado)'}
                    </span>
                    
                    {/* Copy indicator that appears when text is selected */}
                    {(msg.sender === 'bot' && selectedText === msg.id && !msg.isTyping) && (
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
                placeholder={currentAgent.placeholder || "Digite sua mensagem..."}
                className="w-full p-3 pr-24 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-apolus-blue resize-none min-h-[50px] max-h-[200px] overflow-y-auto"
                disabled={loading}
                rows="1"
              />
              <div className="absolute bottom-2 right-2 flex items-center">
                <span className="text-xs text-apolus-gray mr-2">
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
