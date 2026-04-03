import React, { useState } from 'react';
import { useAuth } from '../logic/AuthContext';

export const AuthForm: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const endpoint = isLogin ? '/neon_v1/auth/login' : '/neon_v1/auth/register';
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error);
            
            if (isLogin) {
                login(data.token, data.user);
            } else {
                setIsLogin(true);
                alert('Регистрация успешна! Теперь войдите.');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-container" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', 
            justifyContent: 'center', minHeight: '100vh', background: '#0a0a0a',
            padding: '2rem', fontFamily: 'monospace'
        }}>
            <div className="auth-card" style={{
                background: '#111', border: '1px solid #0ff', padding: '2.5rem',
                width: '100%', maxWidth: '400px', boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)'
            }}>
                <h2 style={{ 
                    color: '#0ff', 
                    textAlign: 'center', 
                    textTransform: 'uppercase', 
                    letterSpacing: '4px',
                    whiteSpace: 'nowrap',
                    fontSize: '1.2rem'
                }}>
                    {isLogin ? '[ ИНИЦИАЛИЗАЦИЯ_СЕССИИ ]' : '[ СОЗДАНИЕ_ЛИЧНОСТИ ]'}
                </h2>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
                    <div className="form-group">
                        <label style={{ color: '#0ff', display: 'block', marginBottom: '0.5rem' }}>ИМЯ_ПОЛЬЗОВАТЕЛЯ:</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ width: '100%', background: '#000', border: '1px solid #0ff', color: '#fff', padding: '0.8rem' }}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label style={{ color: '#0ff', display: 'block', marginBottom: '0.5rem' }}>ПАРОЛЬ:</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', background: '#000', border: '1px solid #0ff', color: '#fff', padding: '0.8rem' }}
                            required
                        />
                    </div>
                    
                    {error && <div style={{ color: '#f0f', fontSize: '0.8rem' }}>{`ERROR: ${error}`}</div>}
                    
                    <button type="submit" style={{
                        background: '#0ff', color: '#000', border: 'none', padding: '1rem', 
                        fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase'
                    }}>
                        {isLogin ? 'Вход' : 'Регистрация'}
                    </button>
                </form>
                
                <p style={{ color: '#666', textAlign: 'center', marginTop: '2rem', fontSize: '0.8rem' }}>
                    {isLogin ? "Нет личности?" : "Уже есть личность?"} {' '}
                    <span 
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ color: '#0ff', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        {isLogin ? 'Регистрация' : 'Вход'}
                    </span>
                </p>
            </div>
        </div>
    );
};
