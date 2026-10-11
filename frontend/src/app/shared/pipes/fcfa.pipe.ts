import { Pipe, PipeTransform } from '@angular/core';
import { formaterNombreFr } from '../nombres';

@Pipe({ name: 'fcfa', standalone: true })
export class FcfaPipe implements PipeTransform {
  transform(montant: number | null | undefined): string {
    if (montant == null) return '';
    // Le backend stocke les prix en NUMERIC(10,0) : jamais de décimales.
    // Espace insécable U+00A0 avant FCFA (le séparateur de milliers U+202F vient
    // de formatNumber) : fromCharCode car no-irregular-whitespace interdit le littéral.
    return `${formaterNombreFr(montant)}${String.fromCharCode(0xa0)}FCFA`;
  }
}
