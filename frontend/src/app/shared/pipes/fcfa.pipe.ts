import { Pipe, PipeTransform } from '@angular/core';
import { formatNumber } from '@angular/common';

@Pipe({ name: 'fcfa', standalone: true })
export class FcfaPipe implements PipeTransform {
  transform(montant: number | null | undefined): string {
    if (montant == null) return '';
    // Le backend stocke les prix en NUMERIC(10,0) : jamais de décimales.
    return `${formatNumber(montant, 'fr', '1.0-0')} FCFA`;
  }
}
