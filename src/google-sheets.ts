/**
 * Google Sheets & Workspace Integration for Shantik Scrapbook
 * Follows workspace-integration skill: client-side Firebase Auth, in-memory token cache,
 * and user confirmation for all mutating operations.
 */
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  type User
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App & Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

// In-memory token cache as strictly required by workspace-integration guidelines
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface WishlistItem {
  row: number;
  dateAdded: string;
  title: string;
  category: string;
  notes: string;
  status: 'Rencana' | 'Terwujud ♡';
}

export interface AlbumExportData {
  number: string;
  title: string;
  tag: string;
  date: string;
  mood: string;
  count: string;
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If user is restored without in-memory token, trigger failure so user can sign in and obtain token
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token Google Workspace');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

// ==========================================
// GOOGLE SHEETS & DRIVE API CLIENT METHODS
// ==========================================

const SPREADSHEET_TITLE = 'Shantik - Buku Kenangan & Wishlist Cinta ♡';
const LOCAL_STORAGE_SHEET_KEY = 'shantik_google_sheet_id';

/**
 * Searches user's Google Drive for existing Shantik spreadsheet, or creates a new one.
 */
export const getOrCreateSpreadsheet = async (): Promise<{ id: string; url: string; isNew: boolean }> => {
  const token = getAccessToken();
  if (!token) throw new Error('Harap masuk dengan akun Google terlebih dahulu.');

  // Check cached ID in localStorage
  const savedId = localStorage.getItem(LOCAL_STORAGE_SHEET_KEY);
  if (savedId) {
    try {
      const verifyRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${savedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (verifyRes.ok) {
        const meta = await verifyRes.json();
        return { id: savedId, url: meta.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${savedId}`, isNew: false };
      }
    } catch {
      // Fall through to search/create
    }
  }

  // Search Drive for file with this title
  try {
    const q = encodeURIComponent(`name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const found = searchData.files[0];
        localStorage.setItem(LOCAL_STORAGE_SHEET_KEY, found.id);
        return { id: found.id, url: found.webViewLink || `https://docs.google.com/spreadsheets/d/${found.id}`, isNew: false };
      }
    }
  } catch (err) {
    console.warn('Drive search warning:', err);
  }

  // Create brand new Google Sheet with two sheets: 'Wishlist & Date Ideas' and 'Album Kenangan'
  const createPayload = {
    properties: {
      title: SPREADSHEET_TITLE,
      locale: 'id_ID',
      autoRecalc: 'ON_CHANGE',
    },
    sheets: [
      {
        properties: {
          title: 'Wishlist & Impian Berdua',
          gridProperties: { rowCount: 100, columnCount: 6, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Album Kenangan Scrapbook',
          gridProperties: { rowCount: 50, columnCount: 7, frozenRowCount: 1 },
        },
      },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Gagal membuat Google Spreadsheet: ${errText}`);
  }

  const sheetData = await createRes.json();
  const newId = sheetData.spreadsheetId;
  const newUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${newId}`;
  localStorage.setItem(LOCAL_STORAGE_SHEET_KEY, newId);

  // Initialize header rows
  await initializeSheetHeaders(newId, token);

  return { id: newId, url: newUrl, isNew: true };
};

const initializeSheetHeaders = async (spreadsheetId: string, token: string) => {
  const wishlistHeader = [
    ['No', 'Tanggal Dibuat', 'Ide Kencan & Impian', 'Kategori', 'Catatan Manis', 'Status'],
    [1, '11 Nov 2026', 'Piknik santai di taman sore hari bawa bekal buatan sendiri', 'Santai & Alam', 'Duduk cerita tanpa terburu-buru sambil lihat senja', 'Rencana'],
    [2, '11 Nov 2026', 'Makan es krim gelato favorit di akhir pekan', 'Kuliner', 'Cari rasa yang belum pernah dicoba berdua', 'Terwujud ♡'],
    [3, '11 Nov 2026', 'Belajar masak resep baru bareng di dapur', 'Rumah & Masak', 'Sambil dengerin playlist lagu romantis favorit kita', 'Rencana'],
  ];

  const albumHeader = [
    ['No Album', 'Kode Album', 'Judul Kenangan', 'Momen / Tag', 'Tanggal & Lokasi', 'Suasana Hati (Mood)', 'Jumlah Foto/Video'],
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Wishlist & Impian Berdua'!A1:F4?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: wishlistHeader }),
  });

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Album Kenangan Scrapbook'!A1:G1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: albumHeader }),
  });
};

/**
 * Reads wishlist items from the Google Spreadsheet
 */
export const readWishlistItems = async (spreadsheetId: string): Promise<WishlistItem[]> => {
  const token = getAccessToken();
  if (!token) throw new Error('Token akses tidak tersedia.');

  const range = encodeURIComponent("'Wishlist & Impian Berdua'!A2:F100");
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Gagal membaca data dari Google Sheets.');
  }

  const data = await res.json();
  const rows = data.values || [];

  return rows.map((row: string[], idx: number) => ({
    row: idx + 2, // 1-indexed, starting after header
    dateAdded: row[1] || '',
    title: row[2] || '',
    category: row[3] || 'Lainnya',
    notes: row[4] || '',
    status: (row[5] === 'Terwujud ♡' ? 'Terwujud ♡' : 'Rencana') as 'Rencana' | 'Terwujud ♡',
  })).filter((item: WishlistItem) => item.title.trim().length > 0);
};

/**
 * Appends a new wishlist item into Google Sheets
 */
export const appendWishlistItem = async (
  spreadsheetId: string,
  item: { title: string; category: string; notes: string }
): Promise<void> => {
  const token = getAccessToken();
  if (!token) throw new Error('Token akses tidak tersedia.');

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const range = encodeURIComponent("'Wishlist & Impian Berdua'!A:F");
  const rowData = [
    '=ROW()-1',
    todayStr,
    item.title,
    item.category,
    item.notes,
    'Rencana',
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [rowData] }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gagal menambahkan item ke Google Sheets: ${err}`);
  }
};

/**
 * Updates status of a wishlist item (e.g. to 'Terwujud ♡')
 */
export const updateWishlistItemStatus = async (
  spreadsheetId: string,
  rowNumber: number,
  newStatus: 'Rencana' | 'Terwujud ♡'
): Promise<void> => {
  const token = getAccessToken();
  if (!token) throw new Error('Token akses tidak tersedia.');

  const range = encodeURIComponent(`'Wishlist & Impian Berdua'!F${rowNumber}`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [[newStatus]] }),
    }
  );

  if (!res.ok) {
    throw new Error('Gagal memperbarui status di Google Sheets.');
  }
};

/**
 * Exports all 9 memory albums from the scrapbook into the Google Spreadsheet
 */
export const exportAlbumsToSheets = async (
  spreadsheetId: string,
  albums: AlbumExportData[]
): Promise<void> => {
  const token = getAccessToken();
  if (!token) throw new Error('Token akses tidak tersedia.');

  const header = [
    ['No Album', 'Judul Kenangan', 'Momen / Tag', 'Tanggal & Lokasi', 'Suasana Hati (Mood)', 'Jumlah Foto/Video', 'Terakhir Diekspor'],
  ];

  const nowStr = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  const rows = albums.map(a => [
    a.number,
    a.title,
    a.tag,
    a.date,
    a.mood,
    a.count,
    nowStr,
  ]);

  const allValues = [...header, ...rows];

  const range = encodeURIComponent("'Album Kenangan Scrapbook'!A1:G20");
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: allValues }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gagal mengekspor album ke Google Sheets: ${err}`);
  }
};

// Expose on window for easy access from index.html
(window as any).ShantikSheets = {
  initAuth,
  googleSignIn,
  googleSignOut,
  getAccessToken,
  getOrCreateSpreadsheet,
  readWishlistItems,
  appendWishlistItem,
  updateWishlistItemStatus,
  exportAlbumsToSheets,
};
window.dispatchEvent(new CustomEvent('shantik-sheets-ready'));
