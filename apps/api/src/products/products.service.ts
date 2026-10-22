import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { KyselyService } from '../database/kysely.service';
import { Product } from '../database/schema';
import * as path from 'path';
import * as crypto from 'crypto';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

@Injectable()
export class ProductsService {
  constructor(@Inject(KyselyService) private readonly db: KyselyService) {}

  async listProducts(userId?: string): Promise<Product[]> {
    if (userId) {
      const userProducts = await this.db
        .selectFrom('products')
        .selectAll()
        .where('user_id', '=', userId)
        .orderBy('created_at', 'desc')
        .execute();

      if (userProducts.length > 0) {
        return userProducts;
      }
    }

    return await this.db
      .selectFrom('products')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!product) {
      throw new NotFoundException(`Mahsulot topilmadi: ${id}`);
    }

    return product;
  }

  async createProduct(dto: {
    userId: string;
    title: string;
    category: string;
    priceUzs: number;
    discountBadge?: string;
    imageUrl: string;
  }): Promise<Product> {
    const title = (dto.title || '').trim().slice(0, 160);
    if (!title) {
      throw new BadRequestException('Mahsulot nomi kiritilishi shart');
    }

    const category = (dto.category || 'Boshqa').trim().slice(0, 60);
    const price = Math.max(0, Math.min(Number(dto.priceUzs) || 0, 100_000_000_000));

    const imageUrl = (dto.imageUrl || '').trim();
    if (!imageUrl || (!imageUrl.startsWith('https://') && !imageUrl.startsWith('http://'))) {
      throw new BadRequestException('Yaroqli rasm URL manzili kiritilishi shart');
    }

    const discountBadge = dto.discountBadge ? dto.discountBadge.trim().slice(0, 40) : null;

    const product = await this.db
      .insertInto('products')
      .values({
        user_id: dto.userId,
        title,
        category,
        price_uzs: price,
        discount_badge: discountBadge,
        image_url: imageUrl,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return product;
  }

  async getPresignedUploadUrl(filename: string, fileType: string) {
    if (!filename || typeof filename !== 'string') {
      throw new BadRequestException('Fayl nomi kiritilmadi');
    }

    if (!fileType || typeof fileType !== 'string') {
      throw new BadRequestException('Fayl turi (MIME) kiritilmadi');
    }

    const normalizedMime = fileType.toLowerCase().trim();
    const expectedExt = ALLOWED_MIME_TYPES[normalizedMime];
    if (!expectedExt) {
      throw new BadRequestException('Faqat rasm fayllari (JPEG, PNG, WebP) qabul qilinadi');
    }

    const safeBase = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const rawExt = path.extname(safeBase).toLowerCase();
    const finalExt = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : expectedExt;

    const randomKey = crypto.randomBytes(16).toString('hex');
    const key = `products/${Date.now()}-${randomKey}${finalExt}`;

    return {
      uploadUrl: `https://storage.tasvir.ai/upload/${key}`,
      publicUrl: `https://storage.tasvir.ai/${key}`,
      key,
      fileType: normalizedMime,
    };
  }
}
