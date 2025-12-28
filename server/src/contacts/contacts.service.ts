import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../entities/contact.entity';
import { CreateContactDto, ContactResponseDto } from '../common/dto/contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
  ) {}

  async create(createContactDto: CreateContactDto): Promise<ContactResponseDto> {
    try {
      const contact = this.contactRepository.create(createContactDto);
      const savedContact = await this.contactRepository.save(contact);
      
      return {
        id: savedContact.id,
        name: savedContact.name,
        email: savedContact.email,
        subject: savedContact.subject,
        message: savedContact.message,
        createdAt: savedContact.createdAt,
      };
    } catch (error) {
      throw new Error(`Failed to create contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findAll(): Promise<ContactResponseDto[]> {
    try {
      const contacts = await this.contactRepository.find({
        order: { createdAt: 'DESC' },
      });

      return contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message,
        createdAt: contact.createdAt,
      }));
    } catch (error) {
      throw new Error(`Failed to retrieve contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findOne(id: string): Promise<ContactResponseDto | null> {
    try {
      const contact = await this.contactRepository.findOne({ where: { id } });
      
      if (!contact) {
        return null;
      }

      return {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message,
        createdAt: contact.createdAt,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

