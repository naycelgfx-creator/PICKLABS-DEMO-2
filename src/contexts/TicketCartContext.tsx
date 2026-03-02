import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface TicketCartItem {
    id: string; // The player ID
    name: string;
    league: string;
    logo: string;
    type?: string;     // e.g., 'Moneyline', 'Over 25.5 Pts'
    odds?: string;     // e.g., '+140'
    stake?: number;
}

interface TicketCartContextType {
    cartItems: TicketCartItem[];
    isCartOpen: boolean;
    addToCart: (item: TicketCartItem) => void;
    removeFromCart: (playerId: string) => void;
    toggleCart: () => void;
    clearCart: () => void;
}

const TicketCartContext = createContext<TicketCartContextType | undefined>(undefined);

export const TicketCartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<TicketCartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load from localStorage on mount (optional but good idea)
    useEffect(() => {
        const saved = localStorage.getItem('picklabs-ticket-cart');
        if (saved) {
            try {
                setCartItems(JSON.parse(saved));
            } catch (err) {
                console.error('Failed to parse cart JSON', err);
            }
        }
    }, []);

    // Save to localStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('picklabs-ticket-cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const toggleCart = () => setIsCartOpen(prev => !prev);

    const addToCart = (item: TicketCartItem) => {
        setCartItems(prev => {
            if (prev.some(pick => pick.id === item.id)) {
                // Option 1: Alert the user
                // alert('Player is already in your ticket!');
                return prev;
            }
            return [...prev, item];
        });
        // Auto-open cart to show visual confirmation
        setIsCartOpen(true);
    };

    const removeFromCart = (playerId: string) => {
        setCartItems(prev => prev.filter(pick => pick.id !== playerId));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    return (
        <TicketCartContext.Provider
            value={{ cartItems, isCartOpen, addToCart, removeFromCart, toggleCart, clearCart }}
        >
            {children}
        </TicketCartContext.Provider>
    );
};

export const useTicketCart = () => {
    const context = useContext(TicketCartContext);
    if (!context) {
        throw new Error('useTicketCart must be used within a TicketCartProvider');
    }
    return context;
};
