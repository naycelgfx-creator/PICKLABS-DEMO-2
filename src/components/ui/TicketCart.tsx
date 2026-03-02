import React from 'react';
import { useTicketCart } from '../../contexts/TicketCartContext';
import './TicketCart.css'; // We'll put the specific styles here

export const TicketCart: React.FC = () => {
    const { cartItems, isCartOpen, toggleCart, removeFromCart } = useTicketCart();

    return (
        <>
            {/* THE FLOATING BUTTON */}
            <button id="floating-cart-btn" onClick={toggleCart}>
                Ticket <span id="cart-count">{cartItems.length}</span>
            </button>

            {/* THE BACKGROUND DIMMER */}
            <div
                id="cart-overlay"
                className={isCartOpen ? 'open' : ''}
                onClick={toggleCart}
            ></div>

            {/* THE SLIDING CART PANEL */}
            <div id="picklabs-cart" className={`sliding-cart ${isCartOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h2>Your Ticket</h2>
                    <button className="close-btn" onClick={toggleCart}>✕</button>
                </div>

                <div id="cart-items-container">
                    {cartItems.length === 0 ? (
                        <div id="empty-cart-msg" className="empty-state">
                            <p>Your ticket is empty.</p>
                            <span style={{ fontSize: '12px', color: '#A0A0A5' }}>Tap a player to build your edge.</span>
                        </div>
                    ) : (
                        cartItems.map(pick => (
                            <div key={pick.id} className="cart-item">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <img src={pick.logo} alt={pick.name} style={{ width: '30px', borderRadius: '4px' }} />
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '14px', color: '#fff' }}>{pick.name}</h4>
                                        <span style={{ fontSize: '11px', color: '#A0A0A5', textTransform: 'uppercase' }}>
                                            {pick.league}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFromCart(pick.id)}
                                    style={{ background: 'none', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: '18px' }}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="cart-footer">
                    <form
                        id="bet-cart-form"
                        action="/submit_ticket"
                        method="POST"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (cartItems.length > 0) alert('Ticket Checkout logic executing!');
                        }}
                    >
                        <button
                            type="submit"
                            id="complete-btn"
                            className="checkout-btn"
                            disabled={cartItems.length === 0}
                            style={{ opacity: cartItems.length === 0 ? 0.5 : 1, width: '100%', padding: '15px', borderRadius: '8px', background: '#2EFA6B', color: '#000', fontWeight: 'bold', border: 'none', cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer', fontSize: '16px' }}
                        >
                            Complete Ticket 🚀
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};
