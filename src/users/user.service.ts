import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './models/user.model';
import { UserDto } from '../users/dto/user.dto';
import * as bcrypt from 'bcryptjs';
import { S3Provider } from './providers/s3.provider';
import {
  PaginatedResponse,
  PaginationOptions,
  paginate,
} from 'src/_helpers/pagination.helper';
import { UpdateUserDto } from './dto/updateUser.dto';
import { EmailService } from 'src/emails/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel,
    private readonly emailService: EmailService,
    private readonly s3Proider: S3Provider,
  ) {}

  async create(user: UserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(
      user.password,
      Number(process.env.CRYPTO_SALT),
    );
    const createdUser = new this.userModel({
      ...user,
      password: hashedPassword,
      emailVerified: false,
      accountDeleted: false,
    });
    await createdUser.save();

    return createdUser.toObject();
  }

  async findAll(page = 1, pageSize = 10): Promise<User[]> {
    const skip = (page - 1) * pageSize;
    return this.userModel
      .find({}, { password: 0 })
      .skip(skip)
      .limit(pageSize)
      .exec();
  }

  async searchByUsername(
    paginationOptions: PaginationOptions,
    usernamePattern: string,
  ): Promise<PaginatedResponse<User>> {
    let filter: any = { accountDeleted: false };
    if (usernamePattern) {
      const regexPattern = new RegExp(`^${usernamePattern}`, 'i');
      filter = { name: { $regex: regexPattern }, ...filter };
    }

    return (await paginate(this.userModel, filter, paginationOptions, {
      password: 0,
    })) as unknown as Promise<PaginatedResponse<User>>;
  }

  async findOne(id: string): Promise<User> {
    return this.userModel.findById(id, { password: 0 });
  }

  async findByEmail(
    email: string,
    projection = { password: 0 } as any,
  ): Promise<User> {
    return this.userModel.findOne({ email }, projection);
  }

  async update(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const userToUpdate = await this.findOne(userId);

    if (!userToUpdate) {
      throw new NotFoundException('User was not found!');
    }

    if (updateUserDto.email && updateUserDto.email !== userToUpdate.email) {
      const exist = await this.findByEmail(updateUserDto.email);
      if (exist) {
        throw new ConflictException(
          `User with email: ${updateUserDto.email} is already exist!`,
        );
      }
      userToUpdate.emailVerified = false;
      await this.emailService.sendEmailVerificationEmail(updateUserDto.email);
    }
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        Number(process.env.CRYPTO_SALT),
      );
      await this.emailService.sendPasswordChangedNotification(
        updateUserDto.email ? updateUserDto.email : userToUpdate.email,
      );
    }

    return this.userModel.findByIdAndUpdate(userId, updateUserDto, {
      new: true,
      projection: { password: 0 },
    });
  }

  async remove(id): Promise<boolean> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.email = '';
    user.accountDeleted = true;
    await user.save();

    return true;
  }

  async uploadProfilePicture(
    userId: string,
    file,
  ): Promise<{ imageUrl: string }> {
    const user: User = await this.findOne(userId);

    const oldImgUrl = user.profilePicture;
    const imageUrl = await this.s3Proider.uploadFile(
      'pictures/users/' + userId,
      file,
      'image',
      file.mimetype,
    );
    user.profilePicture = imageUrl;
    await user.save();

    if (oldImgUrl) this.s3Proider.deleteFile(oldImgUrl);

    return { imageUrl };
  }

  async resetPassword(id: string, newPassword: string): Promise<boolean> {
    newPassword = await bcrypt.hash(
      newPassword,
      Number(process.env.CRYPTO_SALT),
    );

    await this.userModel.findByIdAndUpdate(id, {
      password: newPassword,
    });

    return true;
  }
}
