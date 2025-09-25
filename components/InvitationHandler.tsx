import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { FamilyInvitation } from '../types';

const InvitationHandler: React.FC = () => {
    const { currentUser, acceptInvitation } = useAuth();
    const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const unsubscribe = db.collection('invitations')
            .where('toEmail', '==', currentUser.email)
            .where('status', '==', 'pending')
            .onSnapshot(snapshot => {
                const fetchedInvitations: FamilyInvitation[] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as FamilyInvitation));
                setInvitations(fetchedInvitations);
                setLoading(false);
            }, error => {
                console.error("Error fetching invitations: ", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [currentUser]);

    const handleAccept = async (invitation: FamilyInvitation) => {
        try {
            await acceptInvitation(invitation.id, invitation.familyId);
            // The list will update automatically via the snapshot listener
        } catch (error) {
            console.error("Failed to accept invitation:", error);
            // Optionally show an error to the user
        }
    };

    const handleDecline = async (invitationId: string) => {
        try {
            await db.collection('invitations').doc(invitationId).update({ status: 'declined' });
            // The list will update automatically via the snapshot listener
        } catch (error) {
            console.error("Failed to decline invitation:", error);
        }
    };

    if (loading || invitations.length === 0) {
        return null;
    }

    return (
        <div className="sticky top-0 z-20 mb-4">
            {invitations.map(inv => (
                 <div key={inv.id} className="bg-blue-800 border-l-4 border-blue-400 text-white p-4 rounded-lg shadow-lg animate-fade-in-down flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm sm:text-base text-center sm:text-left">
                        <span className="font-bold">{inv.fromUserName}</span> đã mời bạn tham gia không gian gia đình của họ.
                    </p>
                    <div className="flex-shrink-0 flex gap-3">
                        <button
                            onClick={() => handleAccept(inv)}
                            className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-md hover:bg-green-600 transition-colors"
                        >
                            Chấp nhận
                        </button>
                        <button
                            onClick={() => handleDecline(inv.id)}
                            className="px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-md hover:bg-gray-500 transition-colors"
                        >
                            Từ chối
                        </button>
                    </div>
                </div>
            ))}
            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default InvitationHandler;