import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact, ContactDocument } from '../entities/contact.entity';
import { CreateContactDto, ContactResponseDto } from '../common/dto/contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name)
    private contactModel: Model<ContactDocument>,
  ) {}

  async create(createContactDto: CreateContactDto): Promise<ContactResponseDto> {
    try {
      const savedContact = await this.contactModel.create(createContactDto);

      return {
        id: savedContact.id,
        name: savedContact.name,
        email: savedContact.email,
        mobile: savedContact.mobile,
        message: savedContact.message,
        createdAt: savedContact.createdAt!,
      };
    } catch (error) {
      throw new Error(`Failed to create contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findAll(): Promise<ContactResponseDto[]> {
    try {
      const contacts = await this.contactModel
        .find()
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      return contacts.map((contact) => ({
        id: contact._id.toString(),
        name: contact.name,
        email: contact.email,
        mobile: contact.mobile,
        message: contact.message,
        createdAt: contact.createdAt!,
      }));
    } catch (error) {
      throw new Error(`Failed to retrieve contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findOne(id: string): Promise<ContactResponseDto | null> {
    try {
      const contact = await this.contactModel.findById(id).lean().exec();

      if (!contact) {
        return null;
      }

      return {
        id: contact._id.toString(),
        name: contact.name,
        email: contact.email,
        mobile: contact.mobile,
        message: contact.message,
        createdAt: contact.createdAt!,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
