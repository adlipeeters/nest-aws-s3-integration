import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

type FileGroup = {
  [folder: string]: string[] | FileGroup;
};

@Injectable()
export class UploadService {
  private readonly s3Client = new S3Client({
    // region: this.configService.getOrThrow('AWS_S3_REGION'),
    region: this.configService.getOrThrow('WAS_S3_REGION'),
    endpoint: this.configService.getOrThrow('WAS_ENDPOINT'),
    credentials: {
      accessKeyId: this.configService.getOrThrow('WAS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.getOrThrow('WAS_SECRET_ACCESS_KEY'),
    },
  });

  private readonly BUCKET_NAME = 'nest-uploader';

  constructor(private readonly configService: ConfigService) {}

  async upload(fileName: string, file: Buffer) {
    const response = await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.BUCKET_NAME,
        // Key: `${'test/test2/' + fileName}`,
        Key: `${fileName}`,
        Body: file,
      }),
    );

    return response;
  }

  async getFile(path: string): Promise<Readable> {
    const data = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: path,
      }),
    );
    console.log(data);
    return data.Body as Readable;
  }

  groupByFolder(files: string[]): FileGroup {
    const result: FileGroup = {};

    for (const file of files) {
      const parts = file.split('/');
      let currentLevel = result;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        if (i === parts.length - 1) {
          if (!currentLevel[part]) {
            if (typeof currentLevel === 'object') {
              currentLevel[part] = [];
            } else {
              (currentLevel as string[]).push(part);
            }
          }
        } else {
          if (!currentLevel[part]) {
            currentLevel[part] = {};
          }
          currentLevel = currentLevel[part] as FileGroup;
        }
      }
    }

    return result;
  }

  async listFiles(): Promise<any> {
    const { Contents } = await this.s3Client.send(
      new ListObjectsV2Command({
        Bucket: this.BUCKET_NAME,
      }),
    );

    const fileNames = Contents.map((item) => item.Key);

    return this.groupByFolder(fileNames);
  }

  async deleteFile(filePath: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: filePath,
      }),
    );
  }
}
