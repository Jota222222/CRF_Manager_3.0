import React, { useState, useRef, useEffect } from 'react';
import { Player, ChatMessage } from '../types';
import { getTacticalAdvice } from '../services/geminiService';
import { Bot, Send, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AICoachProps {
  players: Player[];
}

export const AICoach: React.FC<AICoachProps> = ({ players }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'Olá! Sou o teu treinador adjunto virtual. Como posso ajudar com a tática da equipa hoje?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const responseText = await getTacticalAdvice(userMessage.text, players);

    const aiMessage: ChatMessage = {
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMessage]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-3xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar rounded-xl bg-white p-4 shadow-sm border border-gray-100 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 opacity-80 text-xs">
                {msg.role === 'model' ? <Bot size={14} /> : <User size={14} />}
                <span>{msg.role === 'model' ? 'Treinador IA' : 'Tu'}</span>
              </div>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 rounded-2xl p-3 rounded-bl-none animate-pulse text-sm">
              A pensar na tática...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunta sobre táticas, treinos ou jogadas..."
          className="w-full p-4 pr-12 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none shadow-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};