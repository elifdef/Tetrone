import { createContext, useState, useContext, useCallback } from 'react';
import ActionModal from '../components/common/ActionModal';
import i18n from '../i18n';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: null,
        message: '',
        placeholder: '',
        btnSubmit: '',
        btnCancel: '',
        resolve: null,
        emptyInput: false
    });

    const openConfirm = useCallback((message, btnYes = i18n.t('common.yes'), btnNo = i18n.t('common.no')) => {
        return new Promise((resolve) => {
            setModalState({ isOpen: true, type: 'confirm', message, btnSubmit: btnYes, btnCancel: btnNo, resolve });
        });
    }, []);

    const openPrompt = useCallback((message, placeholder = '', emptyInput = false, btnSubmit = i18n.t('common.yes'), btnCancel = i18n.t('common.no')) => {
        return new Promise((resolve) => {
            setModalState({ isOpen: true, type: 'prompt', message, placeholder, btnSubmit, btnCancel, resolve, emptyInput });
        });
    }, []);

    const handleClose = () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <ModalContext.Provider value={{ openConfirm, openPrompt }}>
            {children}

            <ActionModal
                isOpen={modalState.isOpen}
                onClose={handleClose}
                type={modalState.type}
                message={modalState.message}
                placeholder={modalState.placeholder}
                btnSubmit={modalState.btnSubmit}
                btnCancel={modalState.btnCancel}
                onResolve={modalState.resolve}
            />
        </ModalContext.Provider>
    );
};