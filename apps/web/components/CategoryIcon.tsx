import {
  Backpack,
  BookOpen,
  Calculator,
  Drop,
  Files,
  FolderSimple,
  HighlighterCircle,
  Package,
  PaintBrush,
  PenNib,
  Stamp,
} from '@phosphor-icons/react/ssr';
import type { IconProps } from '@phosphor-icons/react';
import type { ComponentType } from 'react';

/** Ikon jenis barang per lorong (slug induk atau anak). Dipakai bila foto barang belum ada. */
const BY_SLUG: Record<string, ComponentType<IconProps>> = {
  'pulpen-pensil': PenNib,
  pulpen: PenNib,
  'pensil-mekanik': PenNib,
  'pensil-kayu': PenNib,
  koreksi: PenNib,
  'spidol-stabilo': HighlighterCircle,
  spidol: HighlighterCircle,
  stabilo: HighlighterCircle,
  'buku-album': BookOpen,
  'buku-tulis': BookOpen,
  album: BookOpen,
  'buku-ekspedisi': BookOpen,
  kertas: Files,
  'binder-map': FolderSimple,
  binder: FolderSimple,
  'map-seminar': FolderSimple,
  'hekter-stempel': Stamp,
  hekter: Stamp,
  stempel: Stamp,
  'tembak-harga': Stamp,
  'crayon-cat-lem': PaintBrush,
  crayon: PaintBrush,
  'cat-poster': PaintBrush,
  lem: PaintBrush,
  'fancy-kotak-pensil': Backpack,
  'kotak-pensil': Backpack,
  parcel: Backpack,
  kalkulator: Calculator,
  tinta: Drop,
};

export function CategoryIcon({ slug, ...props }: { slug: string | null | undefined } & IconProps) {
  const Icon = (slug && BY_SLUG[slug]) || Package;
  return <Icon {...props} />;
}
