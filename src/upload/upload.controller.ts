import {
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          //   new MaxFileSizeValidator({ maxSize: 1000 }),
          //   new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return await this.uploadService.upload(file.originalname, file.buffer);
  }

  //   @Throttle({ default: { limit: 3, ttl: 60 } })
  @Get()
  async getAllFiles() {
    return await this.uploadService.listFiles();
  }

  @Get(':filename')
  async getFile(@Param('filename') fileName: string, @Res() res: Response) {
    const fileStream = await this.uploadService.getFile(fileName);
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    fileStream.pipe(res);
  }

  @Delete(':filename')
  async delete(@Param('filename') fileName: string) {
    await this.uploadService.deleteFile(fileName);
    return { message: 'File deleted successfully.' };
  }
}
