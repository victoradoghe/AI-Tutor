import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserProfile, UsageTracking } from '../types';
import UpgradeModal from '../components/UpgradeModal';

type FeatureType = 'flashcard_sets' | 'folders' | 'daily_messages' | 'quiz_modes';

interface SubscriptionContextType {
    tier: 'free' | 'pro';
    isPro: boolean;
    checkLimit: (feature: FeatureType, currentCount?: number) => boolean;
    showUpgradeModal: () => void;
    incrementMessageCount: () => Promise<void>;
    remainingMessages: number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};

interface SubscriptionProviderProps {
    user: UserProfile | null;
    onUpdateUser: (user: UserProfile) => Promise<void>;
    children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ user, onUpdateUser, children }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<{ title?: string, description?: string }>({});

    // Derived state
    const tier = user?.subscription_tier || 'free';
    const isPro = tier === 'pro';

    const checkLimit = (feature: FeatureType, currentCount: number = 0): boolean => {
        if (isPro) return true;

        switch (feature) {
            case 'flashcard_sets':
                // Free limit: 3 sets
                if (currentCount >= 3) {
                    setModalContent({ title: "Flashcard Sets Limit Reached", description: "Free users can only create 3 flashcard sets. Upgrade to create unlimited sets." });
                    setIsModalOpen(true);
                    return false;
                }
                return true;
            case 'folders':
                // Free limit: 2 folders
                if (currentCount >= 2) {
                    setModalContent({ title: "Folder Limit Reached", description: "Upgrade to Pro to create more folders and organize your content better." });
                    setIsModalOpen(true);
                    return false;
                }
                return true;
            case 'daily_messages':
                // Free limit: 10 messages
                // Logic handled in canSendMessage helper, but we wrap it here for consistency
                if (!user || user.usage === undefined) return true; // Safety check
                if ((user.usage.daily_messages ?? 0) >= 10) {
                    setModalContent({
                        title: "Daily Assessment Limit Reached",
                        description: "You have used your 10 free AI chats for today. Your limit will reset tomorrow. Upgrade to Pro for unlimited chats!"
                    });
                    setIsModalOpen(true);
                    return false;
                }
                return true;
            case 'quiz_modes':
                // Locked feature
                setModalContent({ title: "Premium Quiz Feature", description: "This quiz mode is available for Pro users only. deeper analysis and unlimited questions." });
                setIsModalOpen(true);
                return false;
            default:
                return true;
        }
    };

    const incrementMessageCount = async () => {
        if (!user || isPro) return;

        // We implement the increment logic locally here or reuse storage service
        // Reusing logic similar to storage.ts but since we have onUpdateUser prop:
        const today = new Date().toDateString();
        // Fallback if usage is undefined
        let newUsage: UsageTracking = user.usage ? { ...user.usage } : { daily_messages: 0, last_reset_date: today };

        if (newUsage.last_reset_date !== today) {
            newUsage = {
                daily_messages: 1,
                last_reset_date: today
            };
        } else {
            newUsage.daily_messages += 1;
        }

        console.log("Incrementing usage count to:", newUsage.daily_messages); // DEBUG LOG
        const updatedUser = { ...user, usage: newUsage };
        await onUpdateUser(updatedUser);
    };

    const remainingMessages = isPro ? 9999 : (user?.usage?.daily_messages !== undefined ? Math.max(0, 10 - user.usage.daily_messages) : 10);

    const handleUpgrade = async () => {
        if (!user) return;
        // Mock Upgrade
        const updatedUser: UserProfile = { ...user, subscription_tier: 'pro' };
        await onUpdateUser(updatedUser);
        setIsModalOpen(false);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Reset content on close to avoid stale state if opened elsewhere without setting content
        setTimeout(() => setModalContent({}), 300);
    };

    return (
        <SubscriptionContext.Provider value={{
            tier,
            isPro,
            checkLimit,
            showUpgradeModal: () => { setModalContent({}); setIsModalOpen(true); },
            incrementMessageCount,
            remainingMessages
        }}>
            {children}
            <UpgradeModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onUpgrade={handleUpgrade}
                title={modalContent.title}
                description={modalContent.description}
            />
        </SubscriptionContext.Provider>
    );
};
