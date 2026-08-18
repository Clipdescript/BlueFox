import React, { useState } from 'react';
import { MdArrowBack, MdCheck, MdClose, MdContrast, MdDarkMode, MdImage, MdLightMode, MdPalette, MdUpload } from 'react-icons/md';
import { useTheme } from '../utils/theme.js';
import '../styles/personalization.css';

const LIGHT_DEFAULT_TAB_COLOR = '#f3f2f0';
const DARK_DEFAULT_TAB_COLOR = '#1d2026';

const BASE_TAB_STYLES = [
  { label: 'Défaut clair', color: '#f3f2f0', accent: '#a6a7ab' },
  { label: 'Défaut sombre', color: '#1d2026', accent: '#7c8492' },
  { label: 'Bleu clair', color: '#e8f1ff', accent: '#2563eb' },
  { label: 'Gris clair', color: '#f1f3f4', accent: '#8a919a' },
  { label: 'Blanc', color: '#ffffff', accent: '#c6cbd2' },
  { label: 'Sable', color: '#fff4df', accent: '#d79b43' },
  { label: 'Jaune doux', color: '#fff9cf', accent: '#d6b31e' },
  { label: 'Pêche', color: '#fff0e8', accent: '#e58d67' },
  { label: 'Rose clair', color: '#fceff3', accent: '#d77c9b' },
  { label: 'Corail clair', color: '#ffe8e6', accent: '#e36f68' },
  { label: 'Vert clair', color: '#eaf7ef', accent: '#69ad83' },
  { label: 'Menthe', color: '#e5f8f2', accent: '#51ab9a' },
  { label: 'Bleu ciel', color: '#e5f6ff', accent: '#55a8d2' },
  { label: 'Lavande claire', color: '#f1edff', accent: '#8d7bc8' }
];

const hslToHex = (hue, saturation, lightness) => {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs((2 * l) - 1)) * s;
  const segment = (hue / 60) % 2;
  const second = chroma * (1 - Math.abs(segment - 1));
  const [red, green, blue] = hue < 60
    ? [chroma, second, 0]
    : hue < 120
      ? [second, chroma, 0]
      : hue < 180
        ? [0, chroma, second]
        : hue < 240
          ? [0, second, chroma]
          : hue < 300
            ? [second, 0, chroma]
            : [chroma, 0, second];
  const match = l - (chroma / 2);
  return `#${[red, green, blue].map((channel) => Math.round((channel + match) * 255).toString(16).padStart(2, '0')).join('')}`;
};

const PALETTE_HUE_NAMES = ['Rouge', 'Orange', 'Jaune', 'Vert citron', 'Vert', 'Turquoise', 'Cyan', 'Bleu', 'Indigo', 'Violet', 'Magenta', 'Rose'];
const PALETTE_TONE_NAMES = ['brumeux', 'pâle', 'clair', 'doux', 'frais', 'vif', 'éclatant', 'profond', 'nocturne'];

// 108 additional named tones keep the large palette readable and provide hex
// values that Electron can apply to the native Windows title-bar overlay.
const EXTRA_TAB_STYLES = Array.from({ length: 108 }, (_, index) => {
  const hueIndex = index % 12;
  const toneIndex = Math.floor(index / 12);
  const hue = hueIndex * 30;
  const lightness = 95 - (toneIndex * 7);
  const accentLightness = Math.max(28, lightness - 18);
  return {
    label: `${PALETTE_HUE_NAMES[hueIndex]} ${PALETTE_TONE_NAMES[toneIndex]}`,
    color: hslToHex(hue, 72, lightness),
    accent: hslToHex(hue, 72, accentLightness)
  };
});

const TAB_STYLES = [...BASE_TAB_STYLES, ...EXTRA_TAB_STYLES];

const image = (label, id) => ({
  label,
  url: `url("https://images.unsplash.com/${id}?auto=format&fit=crop&w=1800&q=95")`
});

const imageSet = (label, ids) => ids.map((id, index) => image(`${label} ${String(index + 1).padStart(2, '0')}`, id));

const LEGACY_IMAGE_CATEGORIES = [
  {
    label: 'Artistes des îles du Pacifique et d’Asie',
    cover: image('Artistes des îles du Pacifique et d’Asie', 'photo-1531058020387-3be344556be6'),
    images: imageSet('Océans et îles', [
      'photo-1507525428034-b723cf961d3e', 'photo-1544551763-46a013bb70d5', 'photo-1516690561799-46d8f74f9abf',
      'photo-1497250681960-ef046c08a56e', 'photo-1500530855697-b586d89ba3ee', 'photo-1501785888041-af3ef285b470',
      'photo-1473116763249-2faaef81ccda', 'photo-1510414842594-a61c69b5ae57', 'photo-1500534623283-312aade485b7',
      'photo-1520250497591-112f2f40a3f4', 'photo-1540541338287-41700207dee6', 'photo-1513836279014-a89f7a76ae86',
      'photo-1511497584788-876760111969', 'photo-1470252649378-9c29740c9fa8', 'photo-1531058020387-3be344556be6',
      'photo-1534528741775-53994a69daeb', 'photo-1518709268805-4e9042af9f23', 'photo-1490750967868-88aa4486c946',
      'photo-1541701494587-cb58502866ab', 'photo-1549490349-8643362247b5', 'photo-1579783902614-a3fb3927b6a5',
      'photo-1561214115-f2f134cc4912', 'photo-1507525428034-b723cf961d3e', 'photo-1544551763-46a013bb70d5',
      'photo-1516690561799-46d8f74f9abf', 'photo-1500530855697-b586d89ba3ee', 'photo-1497250681960-ef046c08a56e',
      'photo-1501785888041-af3ef285b470', 'photo-1510414842594-a61c69b5ae57', 'photo-1520250497591-112f2f40a3f4'
    ])
  },
  {
    label: 'Artistes amérindiens',
    cover: image('Artistes amérindiens', 'photo-1549490349-8643362247b5'),
    images: imageSet('Motifs et terres rouges', [
      'photo-1513364776144-60967b0f800f', 'photo-1547891654-e66ed7ebb968', 'photo-1541701494587-cb58502866ab',
      'photo-1561214115-f2f134cc4912', 'photo-1579783902614-a3fb3927b6a5', 'photo-1549490349-8643362247b5',
      'photo-1518005020951-eccb494ad742', 'photo-1557682250-33bd709cbe85', 'photo-1557682260-967a4f6a9c6b',
      'photo-1550859492-d5da9d8e45f3', 'photo-1531058020387-3be344556be6', 'photo-1577083288073-40892c0860a4',
      'photo-1561839561-b13bcfe95249', 'photo-1578301978018-3005759f48f7', 'photo-1513475382585-d06e58bcb0e0',
      'photo-1534528741775-53994a69daeb', 'photo-1518709268805-4e9042af9f23', 'photo-1490750967868-88aa4486c946',
      'photo-1497250681960-ef046c08a56e', 'photo-1544551763-46a013bb70d5', 'photo-1516690561799-46d8f74f9abf',
      'photo-1500530855697-b586d89ba3ee', 'photo-1470252649378-9c29740c9fa8', 'photo-1541701494587-cb58502866ab',
      'photo-1513364776144-60967b0f800f', 'photo-1547891654-e66ed7ebb968', 'photo-1561214115-f2f134cc4912',
      'photo-1579783902614-a3fb3927b6a5', 'photo-1549490349-8643362247b5', 'photo-1518005020951-eccb494ad742'
    ])
  },
  {
    label: 'Illustrations contemporaines',
    cover: image('Artistes LGBTQ+', 'photo-1531058020387-3be344556be6'),
    images: imageSet('Illustrations et couleurs', [
      'photo-1531058020387-3be344556be6', 'photo-1534528741775-53994a69daeb', 'photo-1518709268805-4e9042af9f23',
      'photo-1500530855697-b586d89ba3ee', 'photo-1490750967868-88aa4486c946', 'photo-1561214115-f2f134cc4912',
      'photo-1549490349-8643362247b5', 'photo-1541701494587-cb58502866ab', 'photo-1513364776144-60967b0f800f',
      'photo-1579783902614-a3fb3927b6a5', 'photo-1557682250-33bd709cbe85', 'photo-1557682260-967a4f6a9c6b',
      'photo-1550859492-d5da9d8e45f3', 'photo-1518005020951-eccb494ad742', 'photo-1547891654-e66ed7ebb968',
      'photo-1577083288073-40892c0860a4', 'photo-1561839561-b13bcfe95249', 'photo-1578301978018-3005759f48f7',
      'photo-1513475382585-d06e58bcb0e0', 'photo-1497250681960-ef046c08a56e', 'photo-1516690561799-46d8f74f9abf',
      'photo-1544551763-46a013bb70d5', 'photo-1470252649378-9c29740c9fa8', 'photo-1507525428034-b723cf961d3e',
      'photo-1462331940025-496dfbfc7564', 'photo-1502134249126-9f3755a50d78', 'photo-1518709268805-4e9042af9f23',
      'photo-1531058020387-3be344556be6', 'photo-1534528741775-53994a69daeb', 'photo-1561214115-f2f134cc4912'
    ])
  },
  {
    label: 'Artistes latino',
    cover: image('Artistes latino', 'photo-1490750967868-88aa4486c946'),
    images: imageSet('Couleurs latines et florales', [
      'photo-1490750967868-88aa4486c946', 'photo-1500530855697-b586d89ba3ee', 'photo-1541701494587-cb58502866ab',
      'photo-1518709268805-4e9042af9f23', 'photo-1497250681960-ef046c08a56e', 'photo-1513364776144-60967b0f800f',
      'photo-1549490349-8643362247b5', 'photo-1531058020387-3be344556be6', 'photo-1534528741775-53994a69daeb',
      'photo-1579783902614-a3fb3927b6a5', 'photo-1518005020951-eccb494ad742', 'photo-1557682250-33bd709cbe85',
      'photo-1557682260-967a4f6a9c6b', 'photo-1550859492-d5da9d8e45f3', 'photo-1547891654-e66ed7ebb968',
      'photo-1577083288073-40892c0860a4', 'photo-1561839561-b13bcfe95249', 'photo-1578301978018-3005759f48f7',
      'photo-1513475382585-d06e58bcb0e0', 'photo-1544551763-46a013bb70d5', 'photo-1516690561799-46d8f74f9abf',
      'photo-1507525428034-b723cf961d3e', 'photo-1501785888041-af3ef285b470', 'photo-1500534623283-312aade485b7',
      'photo-1470252649378-9c29740c9fa8', 'photo-1531058020387-3be344556be6', 'photo-1490750967868-88aa4486c946',
      'photo-1497250681960-ef046c08a56e', 'photo-1518709268805-4e9042af9f23', 'photo-1513364776144-60967b0f800f'
    ])
  },
  {
    label: 'Artistes noirs',
    cover: image('Artistes noirs', 'photo-1541701494587-cb58502866ab'),
    images: imageSet('Art contemporain et formes', [
      'photo-1541701494587-cb58502866ab', 'photo-1579783902614-a3fb3927b6a5', 'photo-1549490349-8643362247b5',
      'photo-1513364776144-60967b0f800f', 'photo-1561214115-f2f134cc4912', 'photo-1547891654-e66ed7ebb968',
      'photo-1531058020387-3be344556be6', 'photo-1518005020951-eccb494ad742', 'photo-1557682250-33bd709cbe85',
      'photo-1557682260-967a4f6a9c6b', 'photo-1550859492-d5da9d8e45f3', 'photo-1577083288073-40892c0860a4',
      'photo-1561839561-b13bcfe95249', 'photo-1578301978018-3005759f48f7', 'photo-1513475382585-d06e58bcb0e0',
      'photo-1534528741775-53994a69daeb', 'photo-1518709268805-4e9042af9f23', 'photo-1490750967868-88aa4486c946',
      'photo-1497250681960-ef046c08a56e', 'photo-1544551763-46a013bb70d5', 'photo-1516690561799-46d8f74f9abf',
      'photo-1500530855697-b586d89ba3ee', 'photo-1470252649378-9c29740c9fa8', 'photo-1507525428034-b723cf961d3e',
      'photo-1501785888041-af3ef285b470', 'photo-1500534623283-312aade485b7', 'photo-1462331940025-496dfbfc7564',
      'photo-1502134249126-9f3755a50d78', 'photo-1541701494587-cb58502866ab', 'photo-1579783902614-a3fb3927b6a5'
    ])
  },
  {
    label: 'Paysages',
    cover: image('Paysages', 'photo-1464822759023-fed622ff2c3b'),
    images: imageSet('Montagnes, lacs et horizons', [
      'photo-1474044159687-1ee9f3a51722', 'photo-1464822759023-fed622ff2c3b', 'photo-1500534623283-312aade485b7',
      'photo-1501785888041-af3ef285b470', 'photo-1509316785289-025f5b846b35', 'photo-1507525428034-b723cf961d3e',
      'photo-1470071459604-3b5ec3a7fe05', 'photo-1441974231531-c6227db76b6e', 'photo-1472214103451-9374bd1c798e',
      'photo-1469474968028-56623f02e42e', 'photo-1501854140801-50d01698950b', 'photo-1511497584788-876760111969',
      'photo-1513836279014-a89f7a76ae86', 'photo-1448375240586-882707db888b', 'photo-1473445361085-b9a07f55608b',
      'photo-1535378917042-10a22c95931a', 'photo-1500530855697-b586d89ba3ee', 'photo-1497250681960-ef046c08a56e',
      'photo-1518173946687-a4c8892bbd9f', 'photo-1510414842594-a61c69b5ae57', 'photo-1520250497591-112f2f40a3f4',
      'photo-1540541338287-41700207dee6', 'photo-1500534623283-312aade485b7', 'photo-1501785888041-af3ef285b470',
      'photo-1464822759023-fed622ff2c3b', 'photo-1474044159687-1ee9f3a51722', 'photo-1509316785289-025f5b846b35',
      'photo-1472214103451-9374bd1c798e', 'photo-1469474968028-56623f02e42e', 'photo-1501854140801-50d01698950b'
    ])
  },
  {
    label: 'Textures',
    cover: image('Textures', 'photo-1518005020951-eccb494ad742'),
    images: imageSet('Textures et matières', [
      'photo-1518005020951-eccb494ad742', 'photo-1531058020387-3be344556be6', 'photo-1557682250-33bd709cbe85',
      'photo-1557682260-967a4f6a9c6b', 'photo-1549490349-8643362247b5', 'photo-1513364776144-60967b0f800f',
      'photo-1579783902614-a3fb3927b6a5', 'photo-1541701494587-cb58502866ab', 'photo-1547891654-e66ed7ebb968',
      'photo-1561214115-f2f134cc4912', 'photo-1550859492-d5da9d8e45f3', 'photo-1577083288073-40892c0860a4',
      'photo-1561839561-b13bcfe95249', 'photo-1578301978018-3005759f48f7', 'photo-1513475382585-d06e58bcb0e0',
      'photo-1534528741775-53994a69daeb', 'photo-1518709268805-4e9042af9f23', 'photo-1490750967868-88aa4486c946',
      'photo-1497250681960-ef046c08a56e', 'photo-1500530855697-b586d89ba3ee', 'photo-1470252649378-9c29740c9fa8',
      'photo-1507525428034-b723cf961d3e', 'photo-1501785888041-af3ef285b470', 'photo-1500534623283-312aade485b7',
      'photo-1518005020951-eccb494ad742', 'photo-1557682250-33bd709cbe85', 'photo-1557682260-967a4f6a9c6b',
      'photo-1549490349-8643362247b5', 'photo-1513364776144-60967b0f800f', 'photo-1541701494587-cb58502866ab'
    ])
  },
  {
    label: 'Vie',
    cover: image('Vie', 'photo-1535378917042-10a22c95931a'),
    images: imageSet('Nature et vivant', [
      'photo-1535378917042-10a22c95931a', 'photo-1500530855697-b586d89ba3ee', 'photo-1518709268805-4e9042af9f23',
      'photo-1497250681960-ef046c08a56e', 'photo-1448375240586-882707db888b', 'photo-1473445361085-b9a07f55608b',
      'photo-1470071459604-3b5ec3a7fe05', 'photo-1441974231531-c6227db76b6e', 'photo-1472214103451-9374bd1c798e',
      'photo-1469474968028-56623f02e42e', 'photo-1501854140801-50d01698950b', 'photo-1511497584788-876760111969',
      'photo-1513836279014-a89f7a76ae86', 'photo-1518173946687-a4c8892bbd9f', 'photo-1510414842594-a61c69b5ae57',
      'photo-1501785888041-af3ef285b470', 'photo-1509316785289-025f5b846b35', 'photo-1507525428034-b723cf961d3e',
      'photo-1490750967868-88aa4486c946', 'photo-1497250681960-ef046c08a56e', 'photo-1500534623283-312aade485b7',
      'photo-1520250497591-112f2f40a3f4', 'photo-1540541338287-41700207dee6', 'photo-1535378917042-10a22c95931a',
      'photo-1448375240586-882707db888b', 'photo-1473445361085-b9a07f55608b', 'photo-1518709268805-4e9042af9f23',
      'photo-1500530855697-b586d89ba3ee', 'photo-1470071459604-3b5ec3a7fe05', 'photo-1441974231531-c6227db76b6e'
    ])
  },
  {
    label: 'Terre',
    cover: image('Terre', 'photo-1446776811953-b23d57bd21aa'),
    images: imageSet('Terre et cosmos', [
      'photo-1446776811953-b23d57bd21aa', 'photo-1614728263952-84ea256f9679', 'photo-1534791547706-6c9c8c8e0e31',
      'photo-1462331940025-496dfbfc7564', 'photo-1502134249126-9f3755a50d78', 'photo-1500534623283-312aade485b7',
      'photo-1446776811953-b23d57bd21aa', 'photo-1614728263952-84ea256f9679', 'photo-1534791547706-6c9c8c8e0e31',
      'photo-1462331940025-496dfbfc7564', 'photo-1502134249126-9f3755a50d78', 'photo-1518709268805-4e9042af9f23',
      'photo-1531058020387-3be344556be6', 'photo-1507525428034-b723cf961d3e', 'photo-1501785888041-af3ef285b470',
      'photo-1464822759023-fed622ff2c3b', 'photo-1474044159687-1ee9f3a51722', 'photo-1509316785289-025f5b846b35',
      'photo-1470071459604-3b5ec3a7fe05', 'photo-1441974231531-c6227db76b6e', 'photo-1472214103451-9374bd1c798e',
      'photo-1469474968028-56623f02e42e', 'photo-1501854140801-50d01698950b', 'photo-1511497584788-876760111969',
      'photo-1513836279014-a89f7a76ae86', 'photo-1510414842594-a61c69b5ae57', 'photo-1520250497591-112f2f40a3f4',
      'photo-1540541338287-41700207dee6', 'photo-1446776811953-b23d57bd21aa', 'photo-1462331940025-496dfbfc7564'
    ])
  },
  {
    label: 'Art',
    cover: image('Art', 'photo-1541701494587-cb58502866ab'),
    images: imageSet('Peintures et créations', [
      'photo-1541701494587-cb58502866ab', 'photo-1513364776144-60967b0f800f', 'photo-1561214115-f2f134cc4912',
      'photo-1579783902614-a3fb3927b6a5', 'photo-1549490349-8643362247b5', 'photo-1518005020951-eccb494ad742',
      'photo-1557682250-33bd709cbe85', 'photo-1557682260-967a4f6a9c6b', 'photo-1550859492-d5da9d8e45f3',
      'photo-1531058020387-3be344556be6', 'photo-1547891654-e66ed7ebb968', 'photo-1577083288073-40892c0860a4',
      'photo-1561839561-b13bcfe95249', 'photo-1578301978018-3005759f48f7', 'photo-1513475382585-d06e58bcb0e0',
      'photo-1534528741775-53994a69daeb', 'photo-1518709268805-4e9042af9f23', 'photo-1490750967868-88aa4486c946',
      'photo-1497250681960-ef046c08a56e', 'photo-1500530855697-b586d89ba3ee', 'photo-1470252649378-9c29740c9fa8',
      'photo-1507525428034-b723cf961d3e', 'photo-1501785888041-af3ef285b470', 'photo-1500534623283-312aade485b7',
      'photo-1541701494587-cb58502866ab', 'photo-1513364776144-60967b0f800f', 'photo-1561214115-f2f134cc4912',
      'photo-1579783902614-a3fb3927b6a5', 'photo-1549490349-8643362247b5', 'photo-1518005020951-eccb494ad742'
    ])
  },
  {
    label: 'Paysages urbains',
    cover: image('Paysages urbains', 'photo-1477959858617-67f85cf4f1df'),
    images: imageSet('Villes et architectures', [
      'photo-1477959858617-67f85cf4f1df', 'photo-1519608487953-e999c86e7455', 'photo-1487958449943-2429e8be8625',
      'photo-1480714378408-67cf0d13bc1b', 'photo-1519501025264-65ba15a82390', 'photo-1494526585095-c41746248156',
      'photo-1449824913935-59a10b8d2000', 'photo-1496568816309-51d7c20e3b21', 'photo-1496588152823-86ff7695e68f',
      'photo-1479839672679-a46483c0e7c8', 'photo-1511818966892-d7d671e672a2', 'photo-1486406146926-c627a92ad1ab',
      'photo-1497366811353-6870744d04b2', 'photo-1487958449943-2429e8be8625', 'photo-1480714378408-67cf0d13bc1b',
      'photo-1519501025264-65ba15a82390', 'photo-1494526585095-c41746248156', 'photo-1477959858617-67f85cf4f1df',
      'photo-1519608487953-e999c86e7455', 'photo-1449824913935-59a10b8d2000', 'photo-1496568816309-51d7c20e3b21',
      'photo-1496588152823-86ff7695e68f', 'photo-1479839672679-a46483c0e7c8', 'photo-1511818966892-d7d671e672a2',
      'photo-1486406146926-c627a92ad1ab', 'photo-1497366811353-6870744d04b2', 'photo-1477959858617-67f85cf4f1df',
      'photo-1487958449943-2429e8be8625', 'photo-1519501025264-65ba15a82390', 'photo-1494526585095-c41746248156'
    ])
  },
  {
    label: 'Formes géométriques',
    cover: image('Formes géométriques', 'photo-1557682250-33bd709cbe85'),
    images: imageSet('Géométrie et couleurs', [
      'photo-1557682250-33bd709cbe85', 'photo-1557682260-967a4f6a9c6b', 'photo-1550859492-d5da9d8e45f3',
      'photo-1518005020951-eccb494ad742', 'photo-1487958449943-2429e8be8625', 'photo-1541701494587-cb58502866ab',
      'photo-1513364776144-60967b0f800f', 'photo-1561214115-f2f134cc4912', 'photo-1579783902614-a3fb3927b6a5',
      'photo-1549490349-8643362247b5', 'photo-1547891654-e66ed7ebb968', 'photo-1577083288073-40892c0860a4',
      'photo-1561839561-b13bcfe95249', 'photo-1578301978018-3005759f48f7', 'photo-1513475382585-d06e58bcb0e0',
      'photo-1531058020387-3be344556be6', 'photo-1534528741775-53994a69daeb', 'photo-1518709268805-4e9042af9f23',
      'photo-1490750967868-88aa4486c946', 'photo-1497250681960-ef046c08a56e', 'photo-1500530855697-b586d89ba3ee',
      'photo-1470252649378-9c29740c9fa8', 'photo-1507525428034-b723cf961d3e', 'photo-1501785888041-af3ef285b470',
      'photo-1557682250-33bd709cbe85', 'photo-1557682260-967a4f6a9c6b', 'photo-1550859492-d5da9d8e45f3',
      'photo-1518005020951-eccb494ad742', 'photo-1487958449943-2429e8be8625', 'photo-1541701494587-cb58502866ab'
    ])
  }
];

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image source returned ${response.status}`);
  return response.json();
};

const toRemoteImage = (label, imageUrl, sourceUrl) => ({
  label: label || 'Image sans titre',
  url: `url("${imageUrl}")`,
  sourceUrl
});

const uniqueRemoteImages = (items) => Array.from(new Map(items.filter((item) => item?.url).map((item) => [item.url, item])).values()).slice(0, 30);

const loadMetImages = async () => {
  const queries = ['Asian art', 'African art', 'Latin American art', 'historical art'];
  const searchResults = await Promise.all(queries.map((query) => fetchJson(`https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(query)}&hasImages=true&isPublicDomain=true`)));
  const objectIds = Array.from(new Set(searchResults.flatMap((result) => (result.objectIDs || []).slice(0, 20)))).slice(0, 60);
  const objects = await Promise.all(objectIds.map((id) => fetchJson(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`)));
  return uniqueRemoteImages(objects.map((item) => toRemoteImage(item.title, item.primaryImage, item.objectURL)));
};


const loadWikimediaImages = async (queries, blockedTitle = /painting|dessin|map|carte|plan|flag|drapeau|portrait/i) => {
  const results = await Promise.all(queries.map((query) => fetchJson(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=30&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1800&format=json&origin=*`)));
  const images = results.flatMap((result) => Object.values(result.query?.pages || {}).map((page) => {
    const info = page.imageinfo?.[0];
    const title = page.title?.replace(/^File:/, '') || '';
    if ((!info?.thumburl && !info?.url) || blockedTitle.test(title)) return null;
    return toRemoteImage(title, info.thumburl || info.url, info.descriptionurl);
  }));
  return uniqueRemoteImages(images);
};

const loadEiffelImages = () => loadWikimediaImages([
  'Eiffel Tower Paris', 'Tour Eiffel Paris', 'Eiffel Tower night', 'Eiffel Tower Seine'
]);

const loadEgyptianMonumentImages = () => loadWikimediaImages([
  'Egypt pyramids Giza', 'Egyptian temple Luxor', 'Abu Simbel Egypt', 'Egyptian obelisk',
  'Karnak temple Egypt', 'Valley of the Kings Egypt', 'Egyptian monument desert', 'Cairo historic monument'
], /painting|dessin|map|carte|plan|flag|drapeau|portrait|logo|statue|sculpture|diagram/i);

const loadNationalParkImages = () => loadWikimediaImages([
  'national park landscape', 'national park waterfall', 'national park mountain', 'national park forest'
]);

const loadFlowerImages = () => loadWikimediaImages([
  'rose flower photography', 'tulip flower photography', 'cherry blossom flower',
  'lavender flower field', 'orchid flower macro', 'sunflower field photography',
  'peony flower', 'lotus flower', 'wildflowers meadow', 'botanical garden flowers',
  'beautiful flowers nature', 'flower macro photography', 'tropical flowers'
], /painting|dessin|map|carte|plan|flag|drapeau|portrait|logo|statue|sculpture|illustration|artificial|fake|plastic|bouquet arrangement/i);

const loadVeniceImages = () => loadWikimediaImages([
  'Venice Italy Grand Canal', 'Venice gondola', 'Venice Rialto Bridge', 'Venice St Mark Basilica',
  'Venice architecture', 'Venice lagoon', 'Venice sunset', 'Venice night photography'
], /painting|dessin|map|carte|plan|flag|drapeau|portrait|logo|statue|sculpture|diagram|advertisement/i);

const loadMarineImages = () => loadWikimediaImages([
  'ocean landscape', 'coral reef', 'whale ocean', 'dolphin ocean', 'sea turtle ocean',
  'underwater photography', 'blue ocean waves', 'marine wildlife'
], /painting|dessin|map|carte|plan|flag|drapeau|portrait|logo|statue|sculpture|shipwreck|diagram/i);

const loadWaterfallImages = () => loadWikimediaImages([
  'waterfall landscape', 'Iguazu Falls', 'Victoria Falls', 'Niagara Falls',
  'waterfall forest', 'mountain waterfall', 'beautiful waterfall nature'
], /painting|dessin|map|carte|plan|flag|drapeau|portrait|logo|statue|sculpture|diagram/i);

const loadNasaImages = async () => {
  const queries = ['planet', 'galaxy', 'nebula', 'moon surface', 'earth from space'];
  const results = await Promise.all(queries.map((query) => fetchJson(`https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&page_size=30`)));
  const blockedTitle = /astronaut|people|person|portrait|crew|human|model|man |woman /i;
  const imageSets = results.map((data) => (data.collection?.items || []).map((item) => {
    const metadata = item.data?.[0] || {};
    const imageLink = item.links?.find((link) => link.render === 'image')?.href;
    if (!imageLink || blockedTitle.test(`${metadata.title || ''} ${metadata.description || ''}`)) return null;
    return toRemoteImage(metadata.title, imageLink, `https://images.nasa.gov/details/${metadata.nasa_id}`);
  }).filter(Boolean));
  const balancedImages = [];
  for (let index = 0; index < 30; index += 1) imageSets.forEach((set) => { if (set[index]) balancedImages.push(set[index]); });
  return uniqueRemoteImages(balancedImages);
};

const IMAGE_CATEGORIES = [
  {
    label: 'The Met · Art du monde',
    cover: 'linear-gradient(135deg, #6f3f2d, #d6a45e)',
    loader: loadMetImages,
    sourceLabel: 'The Metropolitan Museum of Art — Open Access'
  },
  {
    label: 'Wikimedia Commons · Tour Eiffel et Paris',
    cover: 'linear-gradient(135deg, #193b59, #d39c5c)',
    loader: loadEiffelImages,
    sourceLabel: 'Wikimedia Commons — fichiers originaux et licences affichées'
  },
  {
    label: 'Wikimedia Commons · Monuments égyptiens',
    cover: 'linear-gradient(135deg, #5e351f, #d8ae65)',
    loader: loadEgyptianMonumentImages,
    sourceLabel: 'Wikimedia Commons — pyramides, temples et monuments d’Égypte'
  },
  {
    label: 'Wikimedia Commons · Parcs nationaux',
    cover: 'linear-gradient(135deg, #173f35, #7eaf6d)',
    loader: loadNationalParkImages,
    sourceLabel: 'Wikimedia Commons — paysages et parcs protégés'
  },
  {
    label: 'Wikimedia Commons · Fleurs',
    cover: 'linear-gradient(135deg, #6b285d, #e8a45e)',
    loader: loadFlowerImages,
    sourceLabel: 'Wikimedia Commons — fleurs, jardins et photographies botaniques'
  },
  {
    label: 'Wikimedia Commons · Venise',
    cover: 'linear-gradient(135deg, #153c56, #d59b63)',
    loader: loadVeniceImages,
    sourceLabel: 'Wikimedia Commons — canaux, palais et monuments de Venise'
  },
  {
    label: 'Wikimedia Commons · Océans et vie marine',
    cover: 'linear-gradient(135deg, #063b59, #35a9bd)',
    loader: loadMarineImages,
    sourceLabel: 'Wikimedia Commons — photographies de mers et de faune marine'
  },
  {
    label: 'Wikimedia Commons · Cascades et chutes d’eau',
    cover: 'linear-gradient(135deg, #154b43, #75c5d1)',
    loader: loadWaterfallImages,
    sourceLabel: 'Wikimedia Commons — paysages naturels et cascades'
  },
  {
    label: 'NASA · Planètes et univers',
    cover: 'linear-gradient(135deg, #081b3a, #2877b5 52%, #e58e47)',
    loader: loadNasaImages,
    sourceLabel: 'NASA Images — planètes, galaxies et univers'
  }
];

const formatBackground = (value) => `${value} center / cover no-repeat`;

const PersonalizationPanel = ({ isOpen, homeBackground, setHomeBackground, tabColor, onTabColorChange, resolvedTheme = 'light', onClose }) => {
  const [activeSection, setActiveSection] = useState('tabs');
  const [activeCategory, setActiveCategory] = useState(null);
  const [categoryImages, setCategoryImages] = useState({});
  const [loadingCategory, setLoadingCategory] = useState(null);
  const [galleryError, setGalleryError] = useState(false);
  const [customTabColor, setCustomTabColor] = useState(/^#[0-9a-f]{6}$/i.test(tabColor || '') ? tabColor : '#2563eb');
  const { mode, setMode } = useTheme();

  React.useEffect(() => {
    if (/^#[0-9a-f]{6}$/i.test(tabColor || '')) setCustomTabColor(tabColor);
  }, [tabColor]);

  const handleCustomTabColor = (event) => {
    const nextColor = event.target.value;
    setCustomTabColor(nextColor);
    onTabColorChange(nextColor);
  };
  const isCustomTabColor = tabColor === customTabColor && !TAB_STYLES.some((style) => style.color === tabColor);

  const selectBackgroundImage = (event) => {
    const [file] = event.target.files || [];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setHomeBackground(`url("${reader.result}") center / cover no-repeat`);
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const selectedCategory = IMAGE_CATEGORIES.find((category) => category.label === activeCategory);
  const selectedImages = selectedCategory ? categoryImages[selectedCategory.label] || [] : [];
  const loadCategoryImages = async (category, showLoading = false) => {
    if (categoryImages[category.label]) return categoryImages[category.label];
    if (showLoading) setLoadingCategory(category.label);

    try {
      const images = await category.loader();
      setCategoryImages((current) => ({ ...current, [category.label]: images }));
      return images;
    } catch {
      if (showLoading) setGalleryError(true);
      return [];
    } finally {
      if (showLoading) setLoadingCategory(null);
    }
  };
  const openCategory = async (category) => {
    setActiveCategory(category.label);
    setGalleryError(false);
    await loadCategoryImages(category, true);
  };
  React.useEffect(() => {
    if (!isOpen) return;
    IMAGE_CATEGORIES.forEach((category) => { void loadCategoryImages(category); });
  }, [isOpen]);
  const defaultTabColor = resolvedTheme === 'dark' ? DARK_DEFAULT_TAB_COLOR : LIGHT_DEFAULT_TAB_COLOR;
  const availableTabStyles = Array.from(new Map((resolvedTheme === 'dark'
    ? TAB_STYLES
    : TAB_STYLES.filter((style) => style.label !== 'Défaut sombre')).map((style) => [style.color.toLowerCase(), style])).values());

  return (
    <div className={`bluefox-personalization-panel ${isOpen ? 'is-open' : 'is-closed'}`} role="presentation">
      <aside className="bluefox-personalization-sidebar" aria-hidden={!isOpen} aria-label="Personnaliser la page d’accueil">
        <header className="bluefox-personalization-header">
          <div className="bluefox-personalization-heading">
            {selectedCategory ? <button type="button" className="bluefox-personalization-back" onClick={() => setActiveCategory(null)} aria-label="Retour aux catégories"><MdArrowBack /></button> : <MdPalette aria-hidden="true" />}
            <span>{selectedCategory ? selectedCategory.label : 'Personnaliser'}</span>
          </div>
          <button type="button" onClick={onClose} className="bluefox-personalization-close" aria-label="Fermer la personnalisation" title="Fermer"><MdClose aria-hidden="true" /></button>
        </header>

        <div className="bluefox-personalization-content">
          {!selectedCategory ? (
            <>
              <h1 className="bluefox-personalization-title">Apparence</h1>
              <p className="bluefox-personalization-intro">Choisissez les couleurs du navigateur et le fond de votre page Nouvel onglet.</p>
              <div className="bluefox-theme-selector" role="group" aria-label="Choisir le thème de BlueFox">
                {[
                  { value: 'light', label: 'Clair', icon: MdLightMode },
                  { value: 'dark', label: 'Sombre', icon: MdDarkMode },
                  { value: 'system', label: 'Appareil', icon: MdContrast }
                ].map(({ value, label, icon: Icon }) => (
                  <button type="button" key={value} onClick={() => setMode(value)} className={mode === value ? 'is-active' : ''} aria-pressed={mode === value}>
                    <Icon aria-hidden="true" /><span>{label}</span>
                  </button>
                ))}
              </div>
              <div className="bluefox-settings-switcher bluefox-personalization-tabs" role="tablist" aria-label="Options de personnalisation">
                <button type="button" role="tab" aria-selected={activeSection === 'tabs'} className={activeSection === 'tabs' ? 'is-active' : ''} onClick={() => setActiveSection('tabs')}><MdPalette aria-hidden="true" /> Onglets</button>
                <button type="button" role="tab" aria-selected={activeSection === 'images'} className={activeSection === 'images' ? 'is-active' : ''} onClick={() => setActiveSection('images')}><MdImage aria-hidden="true" /> Fonds de page</button>
              </div>

              {activeSection === 'tabs' ? (
                <section className="bluefox-personalization-section" role="tabpanel">
                  <div className="bluefox-section-heading"><h2>Choisir un style d’onglet</h2><p>La couleur s’applique à la barre des onglets et aux contrôles de la fenêtre.</p></div>
                  <div className="bluefox-tab-palette-toolbar">
                    <span><strong>{availableTabStyles.length}</strong> couleurs disponibles</span>
                    <span>Choisissez une teinte ou créez la vôtre</span>
                  </div>
                  <div className="bluefox-tab-style-grid">
                    {availableTabStyles.map((style) => (
                      <button key={style.color} type="button" className={`bluefox-tab-style-choice ${tabColor === style.color ? 'is-selected' : ''}`} onClick={() => onTabColorChange(style.color)} aria-label={`Choisir ${style.label}`} title={style.label}>
                        <span className={`bluefox-tab-color-swatch ${tabColor === style.color ? 'is-selected' : ''}`} style={{ '--swatch-color': style.color, '--swatch-accent': style.accent }}>
                          <i />
                          {tabColor === style.color && <MdCheck className="bluefox-tab-color-check" aria-hidden="true" />}
                        </span>
                        <span className="bluefox-tab-style-label">{style.label}</span>
                      </button>
                    ))}
                  </div>
                  <label className={`bluefox-custom-tab-color ${isCustomTabColor ? 'is-selected' : ''}`}>
                    <span className="bluefox-custom-tab-color-preview" style={{ '--custom-tab-color': customTabColor }} />
                    <span className="bluefox-custom-tab-color-copy"><strong>Ma couleur</strong><small>{customTabColor.toUpperCase()}</small></span>
                    <input type="color" value={customTabColor} onChange={handleCustomTabColor} aria-label="Choisir une couleur personnalisée" />
                    {isCustomTabColor && <MdCheck aria-hidden="true" />}
                  </label>
                  <button type="button" className="bluefox-reset-control" onClick={() => onTabColorChange(defaultTabColor)}>Réinitialiser les onglets</button>
                </section>
              ) : (
                <section className="bluefox-personalization-section" role="tabpanel">
                  <div className="bluefox-section-heading"><h2>Fond de la page d’accueil</h2><p>Choisissez une collection puis une image de haute qualité pour votre nouvel onglet.</p></div>
                  <div className="bluefox-category-grid">
                    {IMAGE_CATEGORIES.map((category) => (
                      <button key={category.label} type="button" className="bluefox-category-choice" onClick={() => { void openCategory(category); }} aria-label={`Ouvrir la catégorie ${category.label}`}>
                        <span className="bluefox-category-cover" style={{ backgroundImage: categoryImages[category.label]?.[0]?.url || category.cover.url || category.cover }} />
                        <span className="bluefox-category-label">{category.label}</span>
                      </button>
                    ))}
                  </div>
                  <label className="bluefox-import-background"><MdUpload aria-hidden="true" /><span>Importer une image</span><input type="file" accept="image/*" onChange={selectBackgroundImage} /></label>
                  <button type="button" className="bluefox-reset-control" onClick={() => setHomeBackground('')}>Réinitialiser le fond de la page</button>
                </section>
              )}
            </>
          ) : (
            <section className="bluefox-gallery-section" role="tabpanel">
              <div className="bluefox-gallery-heading"><div><h2>{selectedCategory.label}</h2><p>{selectedCategory.sourceLabel}</p></div><span className="bluefox-gallery-toggle" aria-hidden="true"><i /></span></div>
              {loadingCategory === selectedCategory.label ? (
                <div className="bluefox-gallery-loading">Chargement des images officielles…</div>
              ) : galleryError ? (
                <div className="bluefox-gallery-loading">Cette source n’est pas disponible pour le moment.</div>
              ) : (
                <div className="bluefox-gallery-grid">
                  {selectedImages.map((item) => (
                    <button key={item.url} type="button" className={`bluefox-gallery-choice ${homeBackground === formatBackground(item.url) ? 'is-selected' : ''}`} onClick={() => setHomeBackground(formatBackground(item.url))} aria-label={`Choisir ${item.label}`} title={item.sourceUrl || item.label}>
                      <span style={{ backgroundImage: item.url }} />
                      {homeBackground === formatBackground(item.url) && <MdCheck aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </aside>
    </div>
  );
};

export default PersonalizationPanel;
