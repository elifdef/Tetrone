import { createContext, useState, useContext, useCallback } from 'react';
import GlobalModal from '../components/common/GlobalModal';
import i18n from '../i18n';
import "../components/common/modals.css";

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: null, // 'confirm', 'prompt', 'password', 'custom'
        message: '',
        placeholder: '',
        inputValue: '',
        btnSubmit: '',
        btnCancel: '',
        allowEmptyPrompt: false,
        resolve: null,
        customContent: null
    });

    const closeAndReset = () => {
        setModalState(prev => ({ ...prev, isOpen: false, inputValue: '', customContent: null }));
    };

    const openConfirm = useCallback((message, btnYes = i18n.t('common.yes'), btnNo = i18n.t('common.no')) => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true, type: 'confirm', message, btnSubmit: btnYes, btnCancel: btnNo, resolve, inputValue: '', customContent: null
            });
        });
    }, []);

    const openPrompt = useCallback((message, placeholder = '', allowEmpty = false, btnSubmit = i18n.t('common.save'), btnCancel = i18n.t('common.cancel')) => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true, type: 'prompt', message, placeholder, allowEmptyPrompt: allowEmpty, btnSubmit, btnCancel, resolve, inputValue: '', customContent: null
            });
        });
    }, []);

    const openPassword = useCallback((message = i18n.t('settings.enter_password_confirm'), btnSubmit = i18n.t('common.confirm')) => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true, type: 'password', message, placeholder: '••••••••', allowEmptyPrompt: false, btnSubmit, btnCancel: i18n.t('common.cancel'), resolve, inputValue: '', customContent: null
            });
        });
    }, []);

    const openCustom = useCallback((customContent) => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true, type: 'custom', resolve, customContent, inputValue: ''
            });
        });
    }, []);

    return (
        <ModalContext.Provider value={{ openConfirm, openPrompt, openPassword, openCustom, closeModal: closeAndReset }}>
            {children}

            <GlobalModal
                isOpen={modalState.isOpen}
                onClose={closeAndReset}
                type={modalState.type}
                message={modalState.message}
                placeholder={modalState.placeholder}
                inputValue={modalState.inputValue}
                setInputValue={(val) => setModalState(prev => ({ ...prev, inputValue: val }))}
                btnSubmit={modalState.btnSubmit}
                btnCancel={modalState.btnCancel}
                allowEmptyPrompt={modalState.allowEmptyPrompt}
                onResolve={modalState.resolve}
            >
                {modalState.customContent}
            </GlobalModal>
        </ModalContext.Provider>
    );
};