import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto, ContactResponseDto } from '../common/dto/contact.dto';

@Controller('contacts')
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createContactDto: CreateContactDto,
  ): Promise<{ message: string; data: ContactResponseDto }> {
    const data = await this.contactsService.create(createContactDto);
    return {
      message: 'Contact form submitted successfully',
      data,
    };
  }

  @Get()
  async findAll(): Promise<ContactResponseDto[]> {
    return this.contactsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ContactResponseDto> {
    const contact = await this.contactsService.findOne(id);
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    return contact;
  }
}

