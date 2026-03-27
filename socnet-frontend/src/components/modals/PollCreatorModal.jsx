import React from 'react';
import { useTranslation } from 'react-i18next';
import PollCreator from '../post/components/PollCreator';

export default function PollCreatorModal({ isOpen, onClose, pollData, onSave }) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="tetrone-modal-overlay" onClick={onClose}>
            <div className="tetrone-modal-dialog" onClick={e => e.stopPropagation()}>

                <div className="tetrone-modal-header">
                    <h3>{t('poll.create_title')}</h3>
                    <button className="tetrone-modal-close" onClick={onClose}>✖</button>
                </div>

                <div className="tetrone-modal-body">
                    <PollCreator
                        initialData={pollData}
                        onSave={onSave}
                        onCancel={onClose}
                    />
                </div>

            </div>
        </div>
    );
}