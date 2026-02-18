import { useState, useEffect, useRef } from 'react';
import { Send, Menu, X, Plus, Search, MoreVertical, Paperclip, Smile, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { chatAPI, authAPI } from '../services/api';


export default function ChatApp({ user: initialUser }) {
    // State
    const [user, setUser] = useState(initialUser);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    // Loading & Error states
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [error, setError] = useState(null);
    
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch conversations on mount
    useEffect(() => {
        fetchConversations();
    }, []);

    // Fetch messages when active conversation changes
    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
        }
    }, [activeConversation]);

    // ==================== API CALLS ====================
    
    const fetchConversations = async () => {
        try {
            setLoadingConversations(true);
            setError(null);
            const response = await chatAPI.getConversations();
            setConversations(response.data.data || response.data);
            
            // Auto-select first conversation
            if (response.data.data?.length > 0 && !activeConversation) {
                setActiveConversation(response.data.data[0]);
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
            setError('Failed to load conversations. Please refresh the page.');
        } finally {
            setLoadingConversations(false);
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            setLoadingMessages(true);
            setError(null);
            const response = await chatAPI.getMessages(conversationId);
            setMessages(response.data.data || response.data);
            
            // Mark as read - don't fail if this errors
            try {
                await chatAPI.markAsRead(conversationId);
            } catch (readErr) {
                console.warn('Failed to mark as read:', readErr);
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
            setError('Failed to load messages.');
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !activeConversation || sendingMessage) return;

        const tempMessage = {
            id: `temp-${Date.now()}`,
            content: inputMessage,
            sender_id: user.id,
            conversation_id: activeConversation.id,
            created_at: new Date().toISOString(),
            isOptimistic: true,
        };

        setMessages(prev => [...prev, tempMessage]);
        setInputMessage('');

        try {
            setSendingMessage(true);
            // ⬇️ Updated: pass conversationId as first parameter
            const response = await chatAPI.sendMessage(activeConversation.id, {
                content: inputMessage,
            });

            setMessages(prev => 
                prev.map(msg => 
                    msg.id === tempMessage.id ? response.data.data : msg
                )
            );

            fetchConversations();
        } catch (err) {
            console.error('Error sending message:', err);
            setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
            setError('Failed to send message. Please try again.');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleTyping = () => {
        if (!activeConversation) return;

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Send typing indicator
        chatAPI.setTyping(activeConversation.id, true).catch(console.error);

        // Stop typing after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
            chatAPI.setTyping(activeConversation.id, false).catch(console.error);
        }, 3000);
    };

    const handleLogout = async () => {
        try {
            await authAPI.logout();
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    // ==================== RENDER ====================

    return (
        <div className="h-screen flex bg-gray-50">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden`}>
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <Plus className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                    {loadingConversations ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No conversations yet</p>
                            <button className="mt-2 text-primary-600 hover:underline text-sm">
                                Start a new chat
                            </button>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setActiveConversation(conv)}
                                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-l-4 ${
                                    activeConversation?.id === conv.id 
                                        ? 'bg-primary-50 border-primary-500' 
                                        : 'border-transparent'
                                }`}
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                                    {conv.name?.charAt(0) || '?'}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold text-gray-900 truncate">{conv.name || 'Unknown'}</h3>
                                        <span className="text-xs text-gray-500">
                                            {conv.updated_at ? new Date(conv.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-600 truncate">
                                            {conv.last_message?.body || 'No messages yet'}
                                        </p>
                                        {conv.unread_count > 0 && (
                                            <span className="ml-2 bg-primary-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* User Profile */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                        {activeConversation && (
                            <>
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {activeConversation.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{activeConversation.name || 'Unknown'}</h3>
                                    <p className="text-xs text-green-600">● Online</p>
                                </div>
                            </>
                        )}
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-800">
                            <AlertCircle className="w-5 h-5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {loadingMessages ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                        </div>
                    ) : !activeConversation ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Select a conversation to start chatting</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((message) => {
                            const isOwnMessage = message.sender?.id == user?.id;

                            return (
                                <div
                                    key={message.id}
                                    className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                >

                                    {/* 👤 Avatar – only for kausap */}
                                    {!isOwnMessage && (
                                        <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                            {message.sender?.name?.charAt(0) || '?'}
                                        </div>
                                    )}

                                    {/* 💬 Message bubble */}
                                    <div className={`max-w-[70%]`}>
                                        <div
                                            className={`rounded-2xl px-4 py-2 ${
                                                isOwnMessage
                                                    ? 'bg-primary-600 text-white rounded-br-none'
                                                    : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                                            } ${message.isOptimistic ? 'opacity-70' : ''}`}
                                        >
                                            <p className="text-sm">{message.content}</p>
                                        </div>

                                        <p className={`text-xs text-gray-500 mt-1 px-2 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                                            {new Date(message.created_at).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                            {message.isOptimistic && <span className="ml-1">●</span>}
                                        </p>
                                    </div>

                                </div>
                            );
                        })

                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                {activeConversation && (
                    <div className="bg-white border-t border-gray-200 p-4">
                        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                            <button
                                type="button"
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <Paperclip className="w-5 h-5 text-gray-600" />
                            </button>
                            
                            <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-primary-500 transition-all">
                                <textarea
                                    value={inputMessage}
                                    onChange={(e) => {
                                        setInputMessage(e.target.value);
                                        handleTyping();
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    rows="1"
                                    disabled={sendingMessage}
                                    className="w-full bg-transparent border-0 resize-none focus:ring-0 text-sm placeholder-gray-500 disabled:opacity-50"
                                />
                            </div>

                            <button
                                type="button"
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <Smile className="w-5 h-5 text-gray-600" />
                            </button>

                            <button
                                type="submit"
                                disabled={!inputMessage.trim() || sendingMessage}
                                className="p-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-colors"
                            >
                                {sendingMessage ? (
                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5 text-white" />
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}