import fetchClient from '../api/client';

const supportService = {
    getCategories: () => fetchClient('/support/categories'),
    getTickets: (page = 1) => fetchClient(`/support/tickets?page=${page}`),
    
    getTicket: (id) => fetchClient(`/support/tickets/${id}`),
    replyToTicket: (id, message) => fetchClient(`/support/tickets/${id}/reply`, {
        method: 'POST',
        body: { message }
    }),

    createTicket: (formData) => fetchClient('/support/tickets', {
        method: 'POST',
        body: formData
    })
};

export default supportService;