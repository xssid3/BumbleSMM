import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockDB } from '@/services/mock-db';
import { useSoundNotification } from '@/hooks/useSoundNotification';

export const NotificationController = () => {
    const { user, isAdmin } = useAuth();
    const { notify } = useSoundNotification();

    useEffect(() => {
        if (!user) return;

        // Listen for Order Updates
        const orderSub = mockDB.subscribe('orders', (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;

            // ADMIN NOTIFICATIONS
            if (isAdmin) {
                if (eventType === 'INSERT') {
                    // New Order Placed
                    notify('New Order Received 🔔', `Order #${newRecord.id} by user userId:${newRecord.user_id}`);
                }
            }

            // USER NOTIFICATIONS
            if (!isAdmin && newRecord.user_id === user.id) {
                if (eventType === 'UPDATE' && oldRecord && oldRecord.status !== newRecord.status) {
                    // Order Status Changed
                    notify('Order Updated 📦', `Order #${newRecord.id} is now ${newRecord.status}`);
                }
                if (eventType === 'UPDATE' && newRecord.fulfillment_data && !oldRecord?.fulfillment_data) {
                    notify('Order Fulfilled ✅', `Order #${newRecord.id} has been delivered!`);
                }
            }
        });

        // Listen for Profile Updates (Balance)
        const profileSub = mockDB.subscribe('profiles', (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;

            // USER NOTIFICATIONS - Funds Added
            if (!isAdmin && newRecord.id === user.id) {
                if (eventType === 'UPDATE' && newRecord.balance > (oldRecord?.balance || 0)) {
                    const addedAmount = newRecord.balance - (oldRecord?.balance || 0);
                    notify('Funds Received 💰', `$${addedAmount.toFixed(2)} has been added to your balance.`);
                }
            }
        });

        return () => {
            orderSub.unsubscribe();
            profileSub.unsubscribe();
        };
    }, [user, isAdmin, notify]);

    return null; // Headless component
};
