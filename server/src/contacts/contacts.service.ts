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
  }

  async findAll(): Promise<ContactResponseDto[]> {
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
  }

  async findOne(id: string): Promise<ContactResponseDto | null> {
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
  }
}

