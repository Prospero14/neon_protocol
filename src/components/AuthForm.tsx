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
        const cleanUsername = username.trim();
        const cleanPassword = password;
        if (!cleanUsername || !cleanPassword) {
            setError('Введите логин и пароль.');
            return;
        }
        
        const endpoint = isLogin ? '/neon_v1/auth/login' : '/neon_v1/auth/register';
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: cleanUsername, password: cleanPassword })
            });
            
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Server returned non-JSON: ${text.slice(0, 50)}... [Status ${response.status}]`);
            }
            
            if (!response.ok) throw new Error(data.error || 'Identity initialization failed.');
            
            if (isLogin) {
                login(data.token, data.user);
            } else {
                setIsLogin(true);
                alert('Регистрация успешна! Теперь войдите.');
            }
        } catch (err: any) {
            console.error('Auth Submit Error:', err);
            setError(err.message);
        }
    };

    return (
        <div className="auth-container" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', 
            justifyContent: 'center', minHeight: '100vh',
            background: 'radial-gradient(circle at 20% 20%, rgba(0,255,255,0.08), transparent 35%), radial-gradient(circle at 80% 10%, rgba(255,128,0,0.06), transparent 30%), linear-gradient(180deg, #06080d 0%, #090d14 45%, #07090f 100%)',
            padding: '2rem', fontFamily: 'monospace',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 3px, transparent 7px)',
                opacity: 0.35
            }} />
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '34vh', pointerEvents: 'none',
                background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.35) 20%, rgba(0,0,0,0.75) 100%)'
            }} />
            <div style={{
                position: 'absolute', left: '-4%', bottom: '8%', width: '58%', height: '16%',
                borderTop: '1px solid rgba(0,255,255,0.28)', borderRight: '1px solid rgba(0,255,255,0.16)',
                transform: 'skewX(-22deg)', opacity: 0.6, pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute', right: '-6%', bottom: '13%', width: '52%', height: '14%',
                borderTop: '1px solid rgba(255,160,0,0.25)', borderLeft: '1px solid rgba(255,160,0,0.12)',
                transform: 'skewX(20deg)', opacity: 0.5, pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute', top: '9%', left: '7%', color: 'rgba(0,255,255,0.42)',
                letterSpacing: '0.3em', fontSize: '0.78rem', textTransform: 'uppercase', pointerEvents: 'none'
            }}>
                OCTOBERLINE // МОСКВА_КИБЕРПАНК
            </div>
            <div style={{
                position: 'absolute', top: '13%', left: '7%', color: 'rgba(255,255,255,0.24)',
                letterSpacing: '0.15em', fontSize: '0.62rem', textTransform: 'uppercase', pointerEvents: 'none'
            }}>
                Октябрьская Линия — доступ к контуру
            </div>
            <div className="auth-card" style={{
                background: 'rgba(8, 12, 18, 0.82)', border: '1px solid #0ff', padding: '2.5rem',
                width: '100%', maxWidth: '420px', boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)',
                backdropFilter: 'blur(3px)', zIndex: 2
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
