import React, { useState, useEffect, useRef } from 'react';
import { propertyService } from '../services/propertyService';
import type { ContractMessage } from '../types';
import { useAuth } from '../context/AuthContext';
import { Send } from 'lucide-react';

interface Props {
    propertyId: string;
    contractId: string;
}

const ContractMessages: React.FC<Props> = ({ propertyId, contractId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ContractMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = propertyService.subscribeToContractMessages(propertyId, contractId, (msgs) => {
            setMessages(msgs);
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        return () => unsubscribe();
    }, [propertyId, contractId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        setSending(true);
        try {
            await propertyService.sendContractMessage(propertyId, contractId, {
                text: newMessage.trim(),
                senderId: user.id
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    if (!user) return null;

    return (
        <div className="card" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', height: '400px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#1a73e8', marginBottom: '1rem', borderBottom: '1px solid #dadce0', paddingBottom: '0.5rem' }}>
                💬 Mensajes del Contrato Vigente
            </h3>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#5f6368', marginTop: '2rem' }}>
                        No hay mensajes todavía. Comienza la conversación.
                    </div>
                ) : (
                    messages.map(msg => {
                        const isMine = msg.senderId === user.id;
                        return (
                            <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                                <div style={{ 
                                    maxWidth: '80%', 
                                    padding: '0.75rem 1rem', 
                                    borderRadius: '16px',
                                    borderBottomRightRadius: isMine ? '4px' : '16px',
                                    borderBottomLeftRadius: !isMine ? '4px' : '16px',
                                    backgroundColor: isMine ? '#1a73e8' : '#e8eaed',
                                    color: isMine ? '#fff' : '#202124',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ fontSize: '0.95rem', wordBreak: 'break-word' }}>{msg.text}</div>
                                    <div style={{ fontSize: '0.7rem', color: isMine ? '#e8f0fe' : '#5f6368', textAlign: 'right', marginTop: '4px' }}>
                                        {new Date(msg.createdAt).toLocaleString([], { hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <input 
                    type="text" 
                    className="input" 
                    placeholder="Escribe un mensaje..." 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    style={{ flex: 1 }}
                    disabled={sending}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} disabled={sending || !newMessage.trim()}>
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default ContractMessages;
