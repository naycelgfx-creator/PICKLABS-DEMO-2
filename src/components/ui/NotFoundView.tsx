import React from 'react';

export const NotFoundView: React.FC = () => {
    return (
        <div style={{
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '20px',
            textAlign: 'center',
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 50
        }}>
            <div style={{
                maxWidth: '500px',
                backgroundColor: '#1e293b',
                padding: '40px',
                borderRadius: '12px',
                border: '1px solid #334155',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }}>
                <h1 style={{
                    fontSize: '80px',
                    fontWeight: 900,
                    color: '#ef4444',
                    margin: 0,
                    letterSpacing: '5px'
                }}>404</h1>
                <h2 style={{
                    marginTop: '10px',
                    fontSize: '24px'
                }}>Bad Beat. This page doesn't exist.</h2>
                <p style={{
                    color: '#94a3b8',
                    lineHeight: 1.6,
                    marginBottom: '30px'
                }}>
                    The line must have moved, because the page you are looking for has been taken off the board. Let's get you back to the value plays.
                </p>

                <a href="/"
                    style={{
                        display: 'inline-block',
                        padding: '14px 28px',
                        backgroundColor: '#10b981',
                        color: '#000',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        transition: 'background-color 0.2s ease, transform 0.1s ease'
                    }}
                    onMouseOver={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#059669';
                        (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
                    }}
                    onMouseOut={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#10b981';
                        (e.currentTarget as HTMLAnchorElement).style.color = '#000';
                    }}
                    onClick={(e) => {
                        e.preventDefault();
                        window.location.href = '/';
                    }}
                >
                    Return to Dashboard
                </a>
            </div>
        </div>
    );
};
