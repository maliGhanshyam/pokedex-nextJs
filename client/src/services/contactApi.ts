import api from './api';

export interface CreateContactDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  message: string;
  data: {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: string;
  };
}

export const contactApi = {
  submitContact: async (data: CreateContactDto): Promise<ContactResponse> => {
    const response = await api.post<ContactResponse>('/contacts', data);
    return response.data;
  },
};

