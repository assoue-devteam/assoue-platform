import { Pipe, PipeTransform } from '@angular/core';
import { resoudreUrlImage } from './image.service';

/** [src] des photos produit/événement : https legacy ou /api/images/{cle} résolu. */
@Pipe({ name: 'srcImage', standalone: true })
export class SrcImagePipe implements PipeTransform {
  transform(url: string | null | undefined): string | null {
    return resoudreUrlImage(url);
  }
}
