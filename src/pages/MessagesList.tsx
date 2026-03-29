import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { propertyService } from '../services/propertyService';
import type { Property, RentalContract, ContractMessage } from '../types';
import { MessageSquare, User, X } from 'lucide-react';

import ContractMessages from '../components/ContractMessages';

interface ChatItem {
    property: Property;
    contract: RentalContract;
    lastMessage?: ContractMessage;
}

const MessagesList: React.FC = () => {
    const { user } = useAuth();
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);

    useEffect(() => {
        const loadChats = async () => {
            if (!user) return;
            try {
                const results = await propertyService.getUserContractsWithChats(user.id);
                // Sort by last message date desc (if no message, put at bottom)
                results.sort((a, b) => {
                    const dateA = a.lastMessage?.createdAt || '';
                    const dateB = b.lastMessage?.createdAt || '';
                    return dateB.localeCompare(dateA);
                });
                setChats(results);
            } catch (error) {
                console.error("Error al cargar chats:", error);
            } finally {
                setLoading(false);
            }
        };

        loadChats();
    }, [user]);

    if (loading) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#5f6368' }}>
                Conectando con tus conversaciones...
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', color: '#202124' }}>Mis Mensajes</h2>
                    <p style={{ color: '#5f6368' }}>Tus conversaciones centralizadas con Inquilinos y Propietarios</p>
                </div>
            </div>

            {chats.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', border: '2px dashed #dadce0', backgroundColor: '#f8f9fa' }}>
                    <MessageSquare size={48} color="#bdc1c6" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
                    <p style={{ color: '#5f6368', fontSize: '1.1rem' }}>No tienes contratos activos con canales de mensajería disponibles.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {chats.map(chat => {
                        const isUnread = chat.lastMessage && chat.lastMessage.senderId !== user?.id; // Si el último en enviar NO fui yo

                        return (
                            <div 
                                key={chat.contract.id} 
                                className="card" 
                                style={{ 
                                    padding: '1.5rem', 
                                    cursor: 'pointer', 
                                    transition: 'all 0.2s', 
                                    border: isUnread ? '1px solid #1a73e8' : '1px solid #dadce0',
                                    backgroundColor: isUnread ? '#f8fafd' : '#fff'
                                }}
                                onClick={() => setSelectedChat(chat)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ 
                                            width: '48px', height: '48px', borderRadius: '50%', 
                                            backgroundColor: isUnread ? '#e8f0fe' : '#f1f3f4', 
                                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                                            color: isUnread ? '#1a73e8' : '#5f6368'
                                        }}>
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.3rem 0', color: isUnread ? '#1a73e8' : '#202124', fontWeight: isUnread ? 600 : 500, display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                {chat.property.name} 
                                                <span style={{fontSize: '0.85rem', color: '#5f6368', fontWeight: 400, backgroundColor: '#f1f3f4', padding: '2px 6px', borderRadius: '4px'}}>
                                                    👤 {chat.contract.tenantName || chat.contract.tenantEmail || 'Inquilino'}
                                                </span>
                                            </h3>
                                            <p style={{ margin: 0, color: '#5f6368', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                {chat.lastMessage ? (
                                                    <>
                                                        <span style={{ fontWeight: chat.lastMessage.senderId === user?.id ? 'normal' : 600 }}>
                                                            {chat.lastMessage.senderId === user?.id ? 'Tú: ' : 'El otro: '}
                                                        </span>
                                                        <span style={{ 
                                                            maxWidth: '300px', 
                                                            whiteSpace: 'nowrap', 
                                                            overflow: 'hidden', 
                                                            textOverflow: 'ellipsis',
                                                            color: isUnread ? '#202124' : '#5f6368'
                                                        }}>
                                                            {chat.lastMessage.text}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Sin historial de mensajes... (Toca para iniciar)</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                        {chat.lastMessage && (
                                            <span style={{ fontSize: '0.8rem', color: isUnread ? '#1a73e8' : '#bdc1c6', fontWeight: isUnread ? 600 : 'normal' }}>
                                                {new Date(chat.lastMessage.createdAt).toLocaleString()}
                                            </span>
                                        )}
                                        {isUnread && (
                                            <div style={{ backgroundColor: '#1a73e8', color: '#fff', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 600 }}>
                                                NUEVO
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        
            {/* Modal de Chat Rápido */}
            {selectedChat && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
                    <div className="card fade-in" style={{ width: '100%', maxWidth: '800px', backgroundColor: '#fff', position: 'relative', display: 'flex', flexDirection: 'column', padding: '1.5rem', maxHeight: '90vh' }}>
                        <button 
                            onClick={() => {
                                setSelectedChat(null);
                                // Forzar refresco ligero en vez de recargar chats si es necesario, 
                                // pero el websocket interno de ContractMessages los lee bien.
                            }}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368', zIndex: 10 }}
                        >
                            <X size={28} />
                        </button>
                        {/* Se renderiza el chat existente */}
                        <ContractMessages propertyId={selectedChat.property.id} contractId={selectedChat.contract.id!} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessagesList;
