// ============================================================================
// OTONOM — H1.151 (Gemini Canvas — super calisiyor-3 tabanlı, tam uyumlu)
// Gemini AI Studio Canvas Uyumlu Versiyon
// Değişiklikler: Instagram/TikTok safe zone — altyazı h*0.72, SAFE_ZONE sabiti, pozisyon düzeltmeleri
// ============================================================================
// Akış: S1 → M1 analiz → 2 AI görsel → S2 → M2 analiz → 2 AI görsel → ...
// Sabit görsel sadece 1. sahneye atanır, medyayı anlatan 2 görsel AI üretir
// Çoklu blokta süre sınırı yok — doğal okuma hızında bitir
// Seslendirme daima %80, arka plan müzik daima %29
//
// === CHANGELOG ===
// H1.151: Bug fix release — Türkçe karakterli fonksiyon adı düzeltildi (fetchGazeteMansetleri), renderSonSozScene yorumAudioEnd atama fix, Gazete crop modal clipPath browser uyumluluğu (4-div overlay), bgmInitialized scope fix
// H1.150: Yorum+son söz birleşik render, ses bitişi garantili, boşluk fix korundu
// H1.149: Yorum bitmeden kapanışa geçme fix — yorum varsa sadece yorum okunur, AI son söz yok; tek medyada başlık yok; sahneler arası boşluk eklendi
// H1.148: Kelime bazlı zamanlama, sessizlik kırpma, fade 150ms, ses boşluğu 0.05sn
// H1.147: trUpper() Türkçe karakter fix, thumbnail maks 5sn, son söz tekrar önleme
// H1.146: Ekonomi enjeksiyonu kaldırıldı, validateTurkishText genişletildi
// H1.145: Clickbait ses bekleme kaldırıldı, haber'de kaynaklar sahnesi kaldırıldı
// H1.144: Clickbait kare fix (999→3), 4 bug fix (bgmInitialized, extractStatsHint, validateEconomyData, TDZ)
// H1.143: Orijinal

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, RotateCcw, UploadCloud, Music, Trash2, Volume2, Clock, Loader2, Copy, AlertCircle, Activity, Server, Database, ShieldCheck, ImagePlus, Smartphone, Clapperboard, Type, Palette, Globe, MessageSquare, Monitor, Filter, Wand2, CloudRain, ChevronDown, Film, FileText, Layers, RefreshCw, Share2, Check, Link2, Newspaper, Scissors, ExternalLink, Eye } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, deleteDoc } from 'firebase/firestore';

// Google Drive Müzik Kütüphanesi — Herkese açık klasörden stream
// Klasör: https://drive.google.com/drive/folders/1HGlMbZ2XW_2-dUTXaIx5zZYqgYOhN71Y
const GOOGLE_DRIVE_FOLDER_ID = '1HGlMbZ2XW_2-dUTXaIx5zZYqgYOhN71Y';
const GOOGLE_DRIVE_MUSIC_FALLBACK = [
    { id: '1fckmJ50fyjKPlNZjJ2NY7TtG36dz2gXV', name: 'Neden Bay Anderson Neden [HQ]' },
    { id: '1lbjT7fnxNA5gpt0O5T79IDGQZDUj7Vr3', name: 'Adaletin Bu Mu Dünya' },
    { id: '1CPwd7UlXRxaU80o4QG_oUS6M3LS0s_4v', name: 'Ağladım Anne' },
    { id: '1ctOL71yLEH8fZvfR6N1gkMNtJbfbFZ0B', name: 'Arar Buluruz' },
    { id: '1hyWxILLLF6Wai6hrij7MGRwXK52ou_kE', name: 'Atemlos Durch Die Nacht' },
    { id: '1_lUdXqcm6bDkgoTS-frg9BWy4r3KZQSd', name: 'Autobahn' },
    { id: '1TiAYJaa4yHP5Idy7EBOs8a71IJSDTY0u', name: 'Baller Los' },
    { id: '1eLcf9Xq3kUlBiJjdveD7C_UUGowEHtbs', name: 'Ben Yoruldum Hayat' },
    { id: '1ZKDdXyB1zHFptIkrZqDpzf4DUbd2lk8R', name: 'Benim Babam Fatih Kısaparmak' },
    { id: '1wqKH4NLpFte0bvJ9f5VDu0DiNXK7zx9A', name: 'Benim Sevdam Murattır' },
    { id: '1LXcQ31RzboqTC0tsCGq9OJ3PuyNLZ-jk', name: 'Big In Japan' },
    { id: '1PE41TiHdwxFPJxui4c-tIFyFnZY5Z_qv', name: 'Billie Jean Michael' },
    { id: '14byzbYGcpQ3Lcn7cMpwLOAsZS9NCfKLR', name: 'Bir Daha Gel Samsundan' },
    { id: '1WCOxgw2kDE5fgOfwE-IQe2qfGvFZBCi1', name: 'Bir Başkadır Benim Memleketim' },
    { id: '1S4V4-DV_5vsrqcIuHcc2lcCJOuZg-M1V', name: 'Bob Marley Sözü' },
    { id: '1EPxt8HjU_xD_hVI-IbBt_RIc_nf_WpXM', name: 'Bonİem Deri Ku' },
    { id: '1GRf_fmbdJDsiKed0--0g5ntdaDj7QpXC', name: 'Bonİem Rasputin' },
    { id: '1pjL3AHHRNOu8wColddhTPBzifWwgKSw6', name: 'Bozulma Sesi' },
    { id: '1TGiR7Mga_Hs19awI4BzHb9Uz2lYrRMIw', name: 'Breaking News Intro 368192' },
    { id: '1oVxOCcFTW0F4HEuIisNRwzFu3_wyv22b', name: 'Breaking News Intro 408079' },
    { id: '1ENd5gIFv8CxpIsNj9FpmnaUlrhF_xzLI', name: 'Breaking News Logo' },
    { id: '1UeoHs0B8VxShDkvwtQ3s7W6vWAS4lTOb', name: 'Bu Can Senin' },
    { id: '13vzuK7GtDhnzFtcHzet6CfvPjd1KxPLg', name: 'Bugün Vatan Haini Dedikleriniz' },
    { id: '1tjfWRwf9yablxOqPceHIHQyaRFseQqm2', name: 'By By Lorenz' },
    { id: '1ufZyYB0M7FBcAC1-psKWIknkmjRY1HBn', name: 'Bıraktım Geldim' },
    { id: '1YNO40g_xSKxZRlXsFcNfOim7sqYBPvc8', name: 'Care About Us Michael' },
    { id: '1zGC_bBm_N5jZ_cXGJ_HpXYP7GEEvjq3z', name: 'Çav Bella' },
    { id: '1LkDJVNtVDxGnccE7a5K1dF3ONlCMGKfZ', name: 'Cheri Cheri Lady' },
    { id: '1jza2hYRD_-QAAqPioYhUvu1IYQqwwmsZ', name: 'Dağlarımı Yazdın' },
    { id: '1aodeAR6lr--uEH20wnNenMWK4BrV7c1X', name: 'Deha Uzun' },
    { id: '1sPessumRxdR5eudd6oRsykugy2aN5lxc', name: 'Deha' },
    { id: '1CObBxFdjPP84h1G6Bo3PYPmshZvd7Wg7', name: 'Denizlerin Dalgasıyım' },
    { id: '1i-xgibUoNuM0p9a_P5F6PRqr0ojit82O', name: 'Devrim Müziği' },
    { id: '1jdjDI0tAXYIJ-jsj668xsEBvbKdLH9n5', name: 'Dingin Piyano' },
    { id: '1_lGFSL34j-4mB7CK3DELIlOrjYEolJ5f', name: 'Don Gel Bir Tanem' },
    { id: '1e4segU73qgsMCEl6dobRlH7s2slVeZj8', name: 'Ece Üner Emekli Vekiller' },
    { id: '1tYwQg5zRZVy03MbrFvb6azMpgPptXrqL', name: 'Epic News 60sn' },
    { id: '1SHw99FfHYnhd8rHxW1GlYl8HbaFN2eE2', name: 'Epic News Loop' },
    { id: '1QMwc58BKoGMpreZUUg3u9qRW-ojcGY8k', name: 'First Light On The Square' },
    { id: '1_dW9DhaTeuibtsbMRFMGRMsD4lBTx4hA', name: 'Forever Young' },
    { id: '1k-D1_2v6t9m0xicg3n7n69QyvsQJ2Cic', name: 'Gazete Bayısı Hasret' },
    { id: '17fQqVEtHWDu9HIhiJ80v2p-t0t5ewC0_', name: 'Gençligime Sevgilerimle' },
    { id: '1SqiR1z9lCqpTE5kq4D12815zAFo9VOPu', name: 'Gönül Dağı Neşet Ertaş' },
    { id: '1PYQjY-LaCczsLKqeu_fSvbQv6b8GJaQB', name: 'Great News Epic' },
    { id: '1OuzY26bX0XGZBLV0kWV5v9C87VZl6YS_', name: 'Gül Ki Güller Açsın' },
    { id: '15p9isCr_d4fJ5Q9-oj0llUqCNFKSXr_G', name: 'Gururla Bakıyorum Dünyaya' },
    { id: '1OpooQmoM73RVWdGja085EdDROLhRB-4X', name: 'Güzel Günler Göreceğiz' },
    { id: '1W_IGXst-ld5KORW2DIXdeHhzcnPVPlg2', name: 'Hakim Bey' },
    { id: '1x7KZlCtk3WfoUwXOsSv-1L6Kb5Ggm_P9', name: 'Haram Saltanatı' },
    { id: '13iuVl_o7lhut0B7WpkNY2TfbCv03kyDF', name: 'Hatıra Niyeter' },
    { id: '1PqnGpIDRXEEQ1hNSbBZttiZK4kZnc8Bk', name: 'Hodri Meydan' },
    { id: '1x8pVppkNi_8dvpMvyQYAqZN-xhKYfRr-', name: 'İnci Taneleri' },
    { id: '1tt8GuYplrXgmCuOnNZ3Z0miZVSHvi_Uj', name: 'İsveçli Filistin Şarkısı' },
    { id: '16d6Ye8ZnoMLICG0ABCi4N_u2PQNncSzJ', name: 'İsyan Ateş' },
    { id: '1H2Dl5X6np3M54ey8u9Z43s4jtheDrkGe', name: 'İzmir Marşı' },
    { id: '1K7WLsRZS_IMVf104isbkNFzc0dXxwY5M', name: 'İçerde Tık Tık Tık' },
    { id: '15WLlngwPYQjX_CxL-VT6yMnrLZdlg7rG', name: 'İçerde' },
    { id: '1hNVWXpxVQG9SXU23BHyuYVj3HM5ZuRb_', name: 'Kabede Hacılar Hu Der Allah' },
    { id: '1ZT9U7Xbn3WxnqBrIhK3ZJNLVvZGMHaUn', name: 'Lili Marleen' },
    { id: '11KeMcM87VUPFoP8ZBVz0oLM-uZ-dywVx', name: 'Lucenzo' },
    { id: '1uamxVWbe2A5enlu8AaSyuWv4Eg6x__N-', name: 'Major Tom' },
    { id: '1hEEgGkNaDYzQy_59RYjkyofvrPxr-9BX', name: 'Merdo' },
    { id: '1jzDATcfwfINACpXbwMKJM2ZjBzsIAO-X', name: 'Michael Tüm Şarkıları' },
    { id: '1N5xtO7fzW0qbvIsyTtTBLJTwzX7NNSEy', name: 'Minnet Eylemem' },
    { id: '1bXh7k-vc5wAamzvELdaQTLjNdSB69-tC', name: 'Annemize Türkü' },
];

// Runtime'da güncellenecek — fetch ile tüm parçaları tutar
let GOOGLE_DRIVE_MUSIC = [...GOOGLE_DRIVE_MUSIC_FALLBACK];

// Google Apps Script URL — deploy edildikten sonra buraya yazın
// script.google.com/macros/s/AKfycbx... formatında olacak
const GDRIVE_APPS_SCRIPT_URL = '';

// Google Drive klasöründen tüm müzikleri çek
// Öncelik: Apps Script > Proxy > Doğrudan Fetch > CORS Proxy > Fallback
const fetchGoogleDriveMusic = async () => {
    const cacheKey = 'gd_music_cache';
    const folderUrl = `https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}`;
    let allSongs = [...GOOGLE_DRIVE_MUSIC_FALLBACK]; // Her zaman fallback ile başla

    // 1. Cache varsa kullan (1 saat geçerli) — fallback ile birleştir
    try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.data && parsed.data.length > 0 && (Date.now() - parsed.ts < 3600000)) {
                const cachedIds = new Set(parsed.data.map(m => m.id));
                const missingFallback = GOOGLE_DRIVE_MUSIC_FALLBACK.filter(m => !cachedIds.has(m.id));
                allSongs = [...parsed.data, ...missingFallback];
                GOOGLE_DRIVE_MUSIC = allSongs;
                // Cache'de yeni şarkı varsa devam et, yoksa dön
                if (parsed.data.length >= GOOGLE_DRIVE_MUSIC_FALLBACK.length) return allSongs.length;
            }
        }
    } catch (e) {}

    // 2. Google Apps Script ile çek (CORS engeli yok — Google domain)
    if (GDRIVE_APPS_SCRIPT_URL) {
        try {
            const resp = await fetch(`${GDRIVE_APPS_SCRIPT_URL}?folderId=${GOOGLE_DRIVE_FOLDER_ID}`);
            if (resp.ok) {
                const data = await resp.json();
                if (Array.isArray(data) && data.length > 0) {
                    const existingIds = new Set(allSongs.map(m => m.id));
                    const newSongs = data.filter(f => f.id && f.name && !existingIds.has(f.id));
                    if (newSongs.length > 0) {
                        allSongs = [...allSongs, ...newSongs];
                        GOOGLE_DRIVE_MUSIC = allSongs;
                        try { sessionStorage.setItem(cacheKey, JSON.stringify({ data: allSongs, ts: Date.now() })); } catch (e) {}
                        addSystemLog(`Apps Script: ${newSongs.length} yeni şarkı eklendi. Toplam: ${allSongs.length}`, 'success');
                        return allSongs.length;
                    }
                }
            }
        } catch (e) { addSystemLog('Apps Script hatası: ' + e.message, 'warn'); }
    }

    // 3. Müzik proxy sunucusu ile çek
    const proxyUrl = await getMusicProxyUrl();
    if (proxyUrl) {
        try {
            const resp = await fetch(`${proxyUrl}/music/list/${GOOGLE_DRIVE_FOLDER_ID}`, {
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            if (resp.ok) {
                const data = await resp.json();
                if (Array.isArray(data) && data.length > 0) {
                    const existingIds = new Set(allSongs.map(m => m.id));
                    const newSongs = data.filter(f => f.id && f.name && !existingIds.has(f.id));
                    if (newSongs.length > 0) {
                        allSongs = [...allSongs, ...newSongs];
                        GOOGLE_DRIVE_MUSIC = allSongs;
                        try { sessionStorage.setItem(cacheKey, JSON.stringify({ data: allSongs, ts: Date.now() })); } catch (e) {}
                        return allSongs.length;
                    }
                }
            }
        } catch (e) {}
    }

    // 4. Doğrudan fetch + CORS proxy ile çek
    let html = '';
    try {
        const resp = await fetch(folderUrl);
        const text = await resp.text();
        if (text.length > 5000 && !text.includes('Sign in')) html = text;
    } catch (e) {}
    if (!html) {
        const proxies = [
            (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
            (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
            (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
        ];
        for (const proxy of proxies) {
            try {
                const resp = await fetch(proxy(folderUrl));
                const text = await resp.text();
                if (text.length > 5000 && !text.includes('Sign in')) { html = text; break; }
            } catch (e) {}
        }
    }
    if (html) {
        const existingIds = new Set(allSongs.map(m => m.id));
        const patterns = [
            /\["([a-zA-Z0-9_-]{25,})",\["([^"]+?\.(?:mp3|wav|ogg|m4a|flac|aac))"/gi,
            /"([a-zA-Z0-9_-]{25,})"[^}]*?"([^"]+?\.(?:mp3|wav|ogg|m4a|flac|aac))"/gi,
            /data-id="([a-zA-Z0-9_-]{25,})"[^>]*>([^<]+?\.(?:mp3|wav|ogg|m4a|flac|aac))/gi
        ];
        for (const regex of patterns) {
            let match;
            while ((match = regex.exec(html)) !== null) {
                const id = match[1];
                const name = match[2].replace(/\.[^.]+$/, '');
                if (!existingIds.has(id)) {
                    allSongs.push({ id, name });
                    existingIds.add(id);
                }
            }
        }
    }

    // Sonuçları kaydet ve döndür
    GOOGLE_DRIVE_MUSIC = allSongs;
    try { sessionStorage.setItem(cacheKey, JSON.stringify({ data: allSongs, ts: Date.now() })); } catch (e) {}
    return allSongs.length;
};

// ============================================================
// MÜZİK PROXY AYARLARI
// linkedin_server.py çalışırken bu URL'yi ngrok URL'nizle değiştirin
// Örnek: 'https://xxxx.ngrok-free.dev/music/proxy'
// Sunucu yoksa boş bırakın — doğrudan Google Drive denenir (CORS engeli olabilir)
// ============================================================
// Müzik proxy sunucu — otomatik algılama (localhost → ngrok → boş)
const MUSIC_PROXY_BASE = '';
const _detectMusicProxy = async () => {
    // 1. Localhost dene
    try { const r = await fetch('http://localhost:3000/music/list', { signal: AbortSignal.timeout(2000) }); if (r.ok) return 'http://localhost:3000'; } catch(e) {}
    // 2. ngrok dene
    try { const r = await fetch('https://impotence-powdery-replace.ngrok-free.dev/music/list', { headers: { 'ngrok-skip-browser-warning': 'true' }, signal: AbortSignal.timeout(5000) }); if (r.ok) return 'https://impotence-powdery-replace.ngrok-free.dev'; } catch(e) {}
    return '';
};
let _musicProxyUrl = '';
const getMusicProxyUrl = async () => {
    if (_musicProxyUrl) return _musicProxyUrl;
    _musicProxyUrl = await _detectMusicProxy();
    if (_musicProxyUrl) addSystemLog(`Müzik proxy bulundu: ${_musicProxyUrl}`, 'success');
    return _musicProxyUrl;
};

// ============================================================
// LİNKEDİN API SUNUCU AYARLARI
// linkedin_server.py çalışırken otomatik algılama
// ============================================================
let _linkedInServerUrl = '';
const getLinkedInServerUrl = async () => {
    if (_linkedInServerUrl) return _linkedInServerUrl;
    // 1. Localhost dene
    try { const r = await fetch('http://localhost:3000/', { signal: AbortSignal.timeout(2000) }); if (r.ok) { _linkedInServerUrl = 'http://localhost:3000'; addSystemLog('LinkedIn sunucu bulundu: localhost:3000', 'success'); return _linkedInServerUrl; } } catch(e) {}
    // 2. ngrok dene
    try { const r = await fetch('https://impotence-powdery-replace.ngrok-free.dev/', { headers: { 'ngrok-skip-browser-warning': 'true' }, signal: AbortSignal.timeout(5000) }); if (r.ok) { _linkedInServerUrl = 'https://impotence-powdery-replace.ngrok-free.dev'; addSystemLog('LinkedIn sunucu bulundu: ngrok', 'success'); return _linkedInServerUrl; } } catch(e) {}
    return '';
};

// LinkedIn API ile doğrudan paylaşım
const shareToLinkedInAPI = async (text, imageBase64 = null, linkUrl = null, linkTitle = null, videoBase64 = null) => {
    const baseUrl = await getLinkedInServerUrl();
    if (!baseUrl) throw new Error('LinkedIn sunucu bulunamadı — linkedin_server.py çalışıyor mu?');
    
    const body = { commentary: text };
    if (imageBase64) body.image_base64 = imageBase64;
    if (linkUrl) body.link_url = linkUrl;
    if (linkTitle) body.link_title = linkTitle;
    if (videoBase64) body.video_base64 = videoBase64;
    
    let r;
    if (videoBase64) {
        // Video'yu parçalara böl ve ngrok üzerinden gönder (1MB limit çözümü)
        const base64Data = videoBase64.includes(',') ? videoBase64.split(',')[1] : videoBase64;
        const byteChars = atob(base64Data);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
        const videoBlob = new Blob([byteArray], { type: 'video/mp4' });
        const totalSize = videoBlob.size;
        const chunkSize = 800 * 1024; // 800KB parçalar (ngrok 1MB altında)
        const totalChunks = Math.ceil(totalSize / chunkSize);
        const uploadId = 'vid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        
        addSystemLog('Video parçalı yükleme: ' + (totalSize / 1024 / 1024).toFixed(1) + ' MB, ' + totalChunks + ' parça', 'info');
        
        // Parçaları sırayla gönder
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, totalSize);
            const chunk = videoBlob.slice(start, end);
            const formData = new FormData();
            formData.append('upload_id', uploadId);
            formData.append('chunk_index', i.toString());
            formData.append('total_chunks', totalChunks.toString());
            formData.append('chunk', chunk, 'chunk_' + i + '.bin');
            
            const cr = await fetch(`${baseUrl}/linkedin/upload-chunk`, {
                method: 'POST',
                body: formData
            });
            if (!cr.ok) {
                const err = await cr.json().catch(() => ({}));
                throw new Error('Chunk ' + (i+1) + ' yükleme hatası: ' + (err.detail || cr.status));
            }
            addSystemLog('Parça ' + (i+1) + '/' + totalChunks + ' yüklendi', 'info');
        }
        
        // Birleştirilmiş videoyu LinkedIn'e yükle
        addSystemLog('Video LinkedIn\'e yükleniyor...', 'info');
        const shareForm = new FormData();
        shareForm.append('upload_id', uploadId);
        shareForm.append('commentary', text);
        r = await fetch(`${baseUrl}/linkedin/share-chunked`, {
            method: 'POST',
            body: shareForm
        });
    } else {
        r = await fetch(`${baseUrl}/linkedin/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    }
    
    if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || `LinkedIn API hatası: ${r.status}`);
    }
    return await r.json();
};

// Blob URL'yi base64'e çevir + boyut kontrolü
const blobUrlToBase64 = async (blobUrl) => {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    const sizeMB = (blob.size / 1024 / 1024).toFixed(1);
    addSystemLog('Video dosya boyutu: ' + sizeMB + ' MB', 'info');
    
    // 100MB üzeri videoyu reddet
    if (blob.size > 100 * 1024 * 1024) {
        throw new Error('Video çok büyük (' + sizeMB + ' MB). LinkedIn limiti 100MB.');
    }
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// Sunucu üzerinden müzik indir (CORS yok — sunucu tarafı fetch)
const fetchViaMusicProxy = async (fileId) => {
    const baseUrl = await getMusicProxyUrl();
    if (!baseUrl) throw new Error('Müzik proxy sunucusu bulunamadı');
    const proxyUrl = `${baseUrl}/music/proxy/${fileId}`;
    const r = await fetch(proxyUrl, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    if (!r.ok) throw new Error(`Proxy hatası: ${r.status}`);
    return r;
};

// Wikimedia Commons'tan gerçek görsel çek (Atatürk vb. — Imagen üretemez)
// Wikimedia CORS header verdiği için proxy'ye gerek yok, doğrudan fetch
const fetchWikimediaImages = async (query, limit = 3) => {
    try {
        const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=filetype:bitmap+${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1280&format=json`;
        const r = await fetch(searchUrl);
        if (!r.ok) return [];
        const data = await r.json();
        const images = [];
        const pages = data.query?.pages || {};
        for (const page of Object.values(pages)) {
            const ii = page.imageinfo?.[0];
            if (ii?.mime?.startsWith('image/')) {
                images.push(ii.thumburl || ii.url);
            }
        }
        return images;
    } catch (e) { return []; }
};

// Google Drive HTML sayfasından gerçek download URL'ini çıkar
const extractDriveDownloadUrl = (html) => {
    const actionMatch = html.match(/action="([^"]*drive\.usercontent\.google\.com[^"]*)"/);
    if (actionMatch) return actionMatch[1].replace(/&amp;/g, '&');
    const hrefMatch = html.match(/href="(\/uc\?export=download[^"]*)"/);
    if (hrefMatch) return 'https://drive.google.com' + hrefMatch[1].replace(/&amp;/g, '&');
    return null;
};

// CORS proxy listesi — son çare olarak denenir
const CORS_PROXIES = [
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

// ============================================================
// AI CLIENT — Fallback zinciri: NVIDIA (ücretsiz) → Gemini (ücretsiz eski modeller)
// Tüm metin üretimi önce NVIDIA'ya, başarısız olursa Gemini ücretsiz
// modellerine düşer. Görsel/TTS için ayrı uçlar (generateImage/generateAudio) kullanılır.
// ============================================================
const NV_CHAT_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
// Kullanıcı UI'dan model seçebilir; varsayılan ücretsiz nemotron.
let NV_MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct';
const setNvidiaModel = (m) => { NV_MODEL = m; };

// Gemini ücretsiz eski modeller (fallback). apiKey boşsa bu modeller de çalışmaz,
// ama kullanıcı Gemini key girerse devreye girer.
const GEMINI_FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest'];
const GEMINI_CHAT_URL = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// Metni NVIDIA'dan üret
const callNvidiaChat = async (systemPrompt, userPrompt, opts = {}) => {
    const key = getApiKey();
    if (!key) throw new Error('NVIDIA API anahtarı girilmemiş.');
    const body = {
        model: opts.model || NV_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: opts.temperature != null ? opts.temperature : 0.7,
        max_tokens: opts.max_tokens || 4096,
        top_p: opts.top_p != null ? opts.top_p : 0.9,
        stream: false
    };
    if (opts.json) body.response_format = { type: 'json_object' };
    const r = await fetch(NV_CHAT_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!r.ok) {
        const errText = await r.text().catch(() => '');
        throw new Error(`NVIDIA API hatası (${r.status}): ${errText.substring(0, 150)}`);
    }
    const data = await r.json();
    const content = data.choices?.[0]?.message?.content || '';
    return _parseAIContent(content, opts.json);
};

// Metni Gemini'den üret (fallback)
const callGeminiChat = async (systemPrompt, userPrompt, opts = {}) => {
    const key = getApiKey(); // Aynı UI alanı Gemini key olarak da kullanılabilir
    if (!key) throw new Error('Gemini API anahtarı girilmemiş.');
    const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: opts.temperature != null ? opts.temperature : 0.7, maxOutputTokens: opts.max_tokens || 4096 }
    };
    for (const model of (opts.geminiModels || GEMINI_FALLBACK_MODELS)) {
        try {
            const r = await fetch(GEMINI_CHAT_URL(model) + `?key=${key}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            if (!r.ok) continue;
            const data = await r.json();
            const content = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
            if (content) return _parseAIContent(content, opts.json);
        } catch (e) { /* sonraki modele geç */ }
    }
    throw new Error('Gemini fallback modelleri başarısız.');
};

// Ortak JSON temizleyici
const _parseAIContent = (content, isJson) => {
    if (!isJson) return content;
    try {
        let cleaned = content.trim();
        if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
        const s = cleaned.indexOf('{'); const e = cleaned.lastIndexOf('}');
        if (s !== -1 && e !== -1) cleaned = cleaned.substring(s, e + 1);
        return JSON.parse(cleaned);
    } catch (e) {
        addSystemLog('AI JSON parse hatası, ham metin döndürülüyor.', 'warn');
        return content;
    }
};

// ANA FALLBACK ZİNCİRİ: önce NVIDIA, sonra Gemini ücretsiz modelleri
const callAI = async (systemPrompt, userPrompt, opts = {}) => {
    try {
        const res = await callNvidiaChat(systemPrompt, userPrompt, opts);
        addSystemLog('Metin NVIDIA ile üretildi.', 'success');
        return res;
    } catch (nvErr) {
        addSystemLog('NVIDIA başarısız, Gemini ücretsiz modele geçiliyor: ' + nvErr.message, 'warn');
        try {
            const res = await callGeminiChat(systemPrompt, userPrompt, opts);
            addSystemLog('Metin Gemini fallback ile üretildi.', 'success');
            return res;
        } catch (gmErr) {
            throw new Error(`Tüm AI sağlayıcıları başarısız. NVIDIA: ${nvErr.message} | Gemini: ${gmErr.message}`);
        }
    }
};

const fetchWithCorsProxy = async (url) => {
    // 1. Müzik proxy sunucusu varsa önce onu dene (en güvenilir)
    const fileId = new URL(url).searchParams.get('id');
    const proxyUrl = await getMusicProxyUrl();
    if (proxyUrl && fileId) {
        try { return await fetchViaMusicProxy(fileId); } catch(e) {}
    }
    // 2. Doğrudan dene
    try {
        const r = await fetch(url);
        if (r.ok) {
            const ct = r.headers.get('content-type') || '';
            if (!ct.includes('text/html')) return r;
            const html = await r.text();
            const realUrl = extractDriveDownloadUrl(html);
            if (realUrl) { const r2 = await fetch(realUrl); if (r2.ok) return r2; }
        }
    } catch(e) {}
    // 3. Proxy'lerle dene
    for (const proxy of CORS_PROXIES) {
        try {
            const r = await fetch(proxy(url));
            if (r.ok) {
                const ct = r.headers.get('content-type') || '';
                if (!ct.includes('text/html')) return r;
            }
        } catch(e) {}
    }
    throw new Error('Müzik indirilemedi. Sunucu çalıştığından ve Google Drive dosyasının herkese açık olduğundan emin olun.');
};

// API anahtarı artık UI'dan girilir (sessionStorage). Kodda hardcoded değil.
// Önce UI'dan girilen NVIDIA key'ini oku, yoksa boş string döner.
const NV_API_KEY_STORAGE = 'ns_nvidiaKey';
const getApiKey = () => {
    try { return sessionStorage.getItem(NV_API_KEY_STORAGE) || ''; } catch (e) { return ''; }
};
const setApiKey = (k) => {
    try { if (k) sessionStorage.setItem(NV_API_KEY_STORAGE, k); else sessionStorage.removeItem(NV_API_KEY_STORAGE); } catch (e) {}
};

const SafeStorage = {
    memoryStore: {},
    getItem: (key) => { try { return localStorage.getItem(key); } catch (e) { return SafeStorage.memoryStore[key] || null; } },
    setItem: (key, value) => { try { localStorage.setItem(key, value); } catch (e) { SafeStorage.memoryStore[key] = value; } }
};

const _getAudioCtx = () => {
    if (!window._globalAudioCtx) {
        window._globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (window._globalAudioCtx.state === 'suspended') {
        window._globalAudioCtx.resume().catch(() => {});
    }
    return window._globalAudioCtx;
};

const _suspendAudioCtx = () => {
    if (window._globalAudioCtx && window._globalAudioCtx.state === 'running') {
        window._globalAudioCtx.suspend().catch(() => {});
    }
};

class EventBus {
    constructor() { this.listeners = {}; }
    on(event, callback) { if (!this.listeners[event]) this.listeners[event] = []; this.listeners[event].push(callback); }
    emit(event, data) { if (this.listeners[event]) this.listeners[event].forEach(cb => cb(data)); }
}
const sysEventBus = new EventBus();

const _logBuffer = [];
const _LOG_BUFFER_CAP = 500;
const addSystemLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString('tr-TR');
    const entry = { text, type, timestamp: time };
    _logBuffer.push(entry);
    if (_logBuffer.length > _LOG_BUFFER_CAP) _logBuffer.splice(0, _logBuffer.length - _LOG_BUFFER_CAP);
    sysEventBus.emit('SYS_LOG_ADD', entry);
    console.log(`[SYS_LOG] [${type.toUpperCase()}] ${text}`);
};
window.addSystemLog = addSystemLog;

const exportWorkflowLog = (jobState) => {
    const lines = ['=== AI News Studio Workflow Log ===', `Tarih: ${new Date().toLocaleString('tr-TR')}`, `Versiyon: v1.0`, ''];
    lines.push('--- Sistem Logları ---');
    for (const e of _logBuffer) lines.push(`[${e.timestamp}] [${e.type.toUpperCase()}] ${e.text}`);
    lines.push('');
    lines.push('--- Workflow State ---');
    lines.push(`Job ID: ${jobState?.jobId || 'N/A'}`);
    lines.push(`Status: ${jobState?.status || 'N/A'}`);
    lines.push(`Slides: ${jobState?.script?.videoSlides?.length || 0}`);
    lines.push(`ImageBlocks: ${jobState?.script?.imageBlocks?.length || 0}`);
    lines.push(`Images generated: ${jobState?.assets?.images?.filter(Boolean).length || 0}/${jobState?.assets?.images?.length || 0}`);
    lines.push(`Audio generated: ${jobState?.assets?.audio?.filter(Boolean).length || 0}/${jobState?.assets?.audio?.length || 0}`);
    lines.push(`Config: ${JSON.stringify(jobState?.config || {}, null, 2)}`);
    lines.push('');
    lines.push('--- Slide Details ---');
    for (const [i, s] of (jobState?.script?.videoSlides || []).entries()) {
        lines.push(`S${i + 1}: "${(s.spokenText || '').substring(0, 80)}..." img=${!!jobState?.assets?.images?.[i]} aud=${!!jobState?.assets?.audio?.[i]}`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `workflow_log_${Date.now()}.txt`;
    a.click();
};
window.exportWorkflowLog = exportWorkflowLog;

const getWPS = (lang) => ({ 'en': 2.5, 'es': 2.6, 'fr': 2.4, 'tr': 2.2, 'ar': 2.2, 'de': 2.0, 'ru': 2.0 }[lang] || 2.2);

const getDurationBounds = (dur) => {
    if (dur === '15') return { min: 15.0, max: 30.0 };
    if (dur === '30') return { min: 30.0, max: 60.0 };
    if (dur === '60') return { min: 60.0, max: 90.0 };
    if (dur === '90') return { min: 90.0, max: 120.0 };
    return { min: 0.0, max: 9999.0 };
};

let app, auth, db, appId;
const initFirebase = () => {
    try {
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
        if (Object.keys(firebaseConfig).length > 0) { app = initializeApp(firebaseConfig); auth = getAuth(app); db = getFirestore(app); appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; return true; }
    } catch (e) { console.warn("[INFRA] Firebase başlatılamadı, izole modda çalışılıyor."); }
    return false;
};
const isFirebaseActive = initFirebase();

const attemptSilentReauth = async () => {
    try {
        if (auth) {
            addSystemLog("Yetkilendirme anahtarı yenileniyor (Silent Re-Auth)...", "warn");
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
            else await signInAnonymously(auth);
            addSystemLog("Oturum anahtarı arka planda başarıyla tazelendi!", "success");
            return true;
        }
    } catch (e) { addSystemLog("Sessiz re-auth denemesi başarısız oldu: " + e.message, "error"); }
    return false;
};

const NetworkUtils = {
    fetchWithRetry: async (url, options, retries = 5) => {
        const delays = [1000, 2000, 4000, 8000, 16000];
        for (let i = 0; i < retries; i++) {
            try {
                const res = await fetch(url, options);
                if (res.ok) return res;
                if (res.status === 400 || res.status === 403 || res.status === 404) throw new Error(`HTTP_FAIL_${res.status}`);
                if (res.status === 401) {
                    addSystemLog(`Oturum hatası (401) algılandı, sessiz yenileme deneniyor...`, "warn");
                    const success = await attemptSilentReauth();
                    if (success) { addSystemLog(`Sessiz kimlik doğrulama tazelendi, istek yeniden deneniyor.`, "success"); continue; }
                    if (i === retries - 1) { sysEventBus.emit('AUTH_EXPIRED', true); throw new Error("Oturum süresi doldu (401)."); }
                    await new Promise(r => setTimeout(r, delays[i])); continue;
                }
                if (res.status === 429 || res.status >= 500) { addSystemLog(`Yavaşlık (HTTP ${res.status}). Yeniden deneme (${i + 1}/${retries}) - ${delays[i] / 1000}sn...`, "warn"); await new Promise(r => setTimeout(r, delays[i])); continue; }
                throw new Error(`HTTP Error ${res.status}`);
            } catch (err) {
                if (err.message.startsWith('HTTP_FAIL_') || err.message.includes('Oturum süresi doldu')) throw err;
                if (i === retries - 1) throw err;
                addSystemLog(`Bağlantı kesintisi. Yeniden deneniyor (${i + 1}/${retries}) - ${delays[i] / 1000}sn...`, "warn");
                await new Promise(r => setTimeout(r, delays[i]));
            }
        }
        throw new Error('fetchWithRetry: tüm denemeler başarısız');
    },
    loadImage: (src) => new Promise((resolve) => { if (!src) return resolve(null); if (typeof src !== 'string') { console.warn('loadImage: src string değil', typeof src); return resolve(null); } const img = new Image(); if (src.startsWith('http')) img.crossOrigin = "Anonymous"; img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = src; }),
    fileToBase64: (file) => new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.readAsDataURL(file); }),
    compressImage: (file) => new Promise((resolve) => {
        if (!file.type.startsWith('image/')) { const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.readAsDataURL(file); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width; let h = img.height; const maxW = 1080;
                if (w > maxW || h > maxW) {
                    if (w > h) { h = Math.round((h / w) * maxW); w = maxW; }
                    else { w = Math.round((w / h) * maxW); h = maxW; }
                }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'medium';
                ctx.drawImage(img, 0, 0, w, h);
                const res = canvas.toDataURL('image/jpeg', 0.7);
                canvas.width = 0; canvas.height = 0; // Release canvas texture buffer
                resolve(res);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    })
};

const ASSET_DB = 'AINewsSaaS_Assets_v5';
const STORE_MEDIA = 'media_cache';
const STORE_JOBS = 'temporal_jobs';
const LIB_STORE = 'musicLib';
const DIR_STORE = 'dirHandles';

class AssetManagerService {
    static async getDB() { return new Promise((resolve, reject) => { const req = indexedDB.open(ASSET_DB, 2); req.onupgradeneeded = (e) => { const db = e.target.result; if (!db.objectStoreNames.contains(STORE_MEDIA)) db.createObjectStore(STORE_MEDIA, { keyPath: 'id' }); if (!db.objectStoreNames.contains(STORE_JOBS)) db.createObjectStore(STORE_JOBS, { keyPath: 'jobId' }); if (!db.objectStoreNames.contains(LIB_STORE)) db.createObjectStore(LIB_STORE, { keyPath: 'id' }); if (!db.objectStoreNames.contains(DIR_STORE)) db.createObjectStore(DIR_STORE, { keyPath: 'id' }); }; req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
    static async saveMedia(id, data) { try { const db = await this.getDB(); const tx = db.transaction(STORE_MEDIA, 'readwrite'); tx.objectStore(STORE_MEDIA).put({ id, data, timestamp: Date.now() }); return new Promise(r => tx.oncomplete = () => r(true)); } catch (e) { return false; } }
    static async loadMedia(id) { try { const db = await this.getDB(); const tx = db.transaction(STORE_MEDIA, 'readonly'); const req = tx.objectStore(STORE_MEDIA).get(id); return new Promise(r => req.onsuccess = () => r(req.result?.data || null)); } catch (e) { return null; } }
    static async deleteMedia(id) { try { const db = await this.getDB(); const tx = db.transaction(STORE_MEDIA, 'readwrite'); tx.objectStore(STORE_MEDIA).delete(id); return new Promise(r => tx.oncomplete = () => r(true)); } catch (e) { return false; } }
    static async saveJobState(jobData) { try { const db = await this.getDB(); const tx = db.transaction(STORE_JOBS, 'readwrite'); tx.objectStore(STORE_JOBS).put(jobData); return new Promise(r => tx.oncomplete = () => r(true)); } catch (e) { return false; } }
    static async getPendingJob() { try { const db = await this.getDB(); const tx = db.transaction(STORE_JOBS, 'readonly'); const req = tx.objectStore(STORE_JOBS).getAll(); return new Promise(r => req.onsuccess = () => { const jobs = req.result || []; const pending = jobs.find(j => j.status !== 'COMPLETED' && j.status !== 'FAILED'); r(pending || null); }); } catch (e) { return null; } }
    static async clearJob(jobId) { try { const db = await this.getDB(); const tx = db.transaction(STORE_JOBS, 'readwrite'); tx.objectStore(STORE_JOBS).delete(jobId); } catch (e) { } }
    static async saveMusicToLib(musicObj) { try { const db = await this.getDB(); const tx = db.transaction(LIB_STORE, 'readwrite'); tx.objectStore(LIB_STORE).put(musicObj); return new Promise(r => tx.oncomplete = () => r(true)); } catch (e) { return false; } }
    static async getAllMusicFromLib() { try { const db = await this.getDB(); const tx = db.transaction(LIB_STORE, 'readonly'); const req = tx.objectStore(LIB_STORE).getAll(); return new Promise(r => req.onsuccess = () => r(req.result || [])); } catch (e) { return []; } }
    static async getMusicFromLib(id) { try { const db = await this.getDB(); const tx = db.transaction(LIB_STORE, 'readonly'); const req = tx.objectStore(LIB_STORE).get(id); return new Promise(r => req.onsuccess = () => r(req.result || null)); } catch (e) { return null; } }
    static async removeMusicFromLib(id) { try { const db = await this.getDB(); const tx = db.transaction(LIB_STORE, 'readwrite'); tx.objectStore(LIB_STORE).delete(id); return new Promise(r => tx.oncomplete = () => r(true)); } catch (e) { return false; } }
    static async saveDirHandle(handle) { try { const db = await this.getDB(); const tx = db.transaction(DIR_STORE, 'readwrite'); tx.objectStore(DIR_STORE).put({ id: 'musicDir', handle, name: handle.name, lastSync: Date.now() }); return new Promise(r => tx.oncomplete = () => r(true)); } catch (e) { return false; } }
    static async getDirHandle() { try { const db = await this.getDB(); const tx = db.transaction(DIR_STORE, 'readonly'); const req = tx.objectStore(DIR_STORE).get('musicDir'); return new Promise(r => req.onsuccess = () => r(req.result || null)); } catch (e) { return null; } }
    static async removeDirHandle() { try { const db = await this.getDB(); const tx = db.transaction(DIR_STORE, 'readwrite'); tx.objectStore(DIR_STORE).delete('musicDir'); return new Promise(r => tx.oncomplete = () => r(true)); } catch (e) { return false; } }
    // İndirilenler klasörü için directory handle
    static async saveDownloadsDirHandle(handle) { try { const db = await this.getDB(); const tx = db.transaction(DIR_STORE, 'readwrite'); tx.objectStore(DIR_STORE).put({ id: 'downloadsDir', handle, name: handle.name, timestamp: Date.now() }); return new Promise(r => tx.oncomplete = () => r(true)); } catch (e) { return false; } }
    static async getDownloadsDirHandle() { try { const db = await this.getDB(); const tx = db.transaction(DIR_STORE, 'readonly'); const req = tx.objectStore(DIR_STORE).get('downloadsDir'); return new Promise(r => req.onsuccess = () => r(req.result || null)); } catch (e) { return null; } }
}

const syncMusicFromDir = async (dirHandle, existingMusic) => {
    const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.wma'];
    const existingIds = new Set(existingMusic.map(m => m.id));
    let newCount = 0;
    try {
        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file' && audioExts.some(ext => entry.name.toLowerCase().endsWith(ext))) {
                const file = await entry.getFile();
                const id = "fm_" + file.name.replace(/[^a-zA-Z0-9]/g, '_') + "_" + file.size;
                if (existingIds.has(id)) continue;
                const b64 = await NetworkUtils.fileToBase64(file);
                await AssetManagerService.saveMusicToLib({ id, name: file.name, data: b64 });
                newCount++;
            }
        }
        if (dirHandle.name) {
            const db = await AssetManagerService.getDB();
            const tx = db.transaction(DIR_STORE, 'readwrite');
            tx.objectStore(DIR_STORE).put({ id: 'musicDir', handle: dirHandle, name: dirHandle.name, lastSync: Date.now() });
        }
    } catch (e) {
        console.warn("Otomatik senkronizasyon hatası:", e);
    }
    return newCount;
};

const analyzeQuoteEmotion = (text) => {
    const lower = text.toLowerCase();
    const mutluKelimeler = ['mutlu', 'sevinç', 'neşe', 'güle', 'eğlen', 'coşku', 'başarı', 'zafer', 'kazan', 'umut', 'güneş', 'aydınlık', 'güzel', 'sevgi', 'aşk', 'sev', 'tatlı', 'tat', 'bal', 'çiçek', 'bahar', 'yaz', 'dünya', 'yaşam', 'hayat'];
    const hüzünlüKelimeler = ['hüzün', 'üzgün', 'ağla', 'göz yaş', 'keder', 'acı', 'kayıp', 'ölüm', 'ayrılık', 'yalnız', 'yalnızlık', 'karanlık', 'gece', 'son', 'bitiş', 'veda', 'göç', 'hıçkırık', 'fırtına', 'yağmur', 'kış', 'soğuk', 'don', 'göz yaş'];
    const romantikKelimeler = ['aşk', 'sevda', 'sevgili', 'kalp', 'gönül', 'dudak', 'öp', 'sarı', 'kokla', 'tatlı', 'bal', 'gül', 'ay', 'yıldız', 'gece', 'rk', 'düş', 'rüya', 'özlem', 'bekle', 'hasret', 'vuslat', 'buluş'];
    let mutluSkor = 0, hüzünlüSkor = 0, romantikSkor = 0;
    mutluKelimeler.forEach(k => { if (lower.includes(k)) mutluSkor++; });
    hüzünlüKelimeler.forEach(k => { if (lower.includes(k)) hüzünlüSkor++; });
    romantikKelimeler.forEach(k => { if (lower.includes(k)) romantikSkor++; });
    const maxSkor = Math.max(mutluSkor, hüzünlüSkor, romantikSkor);
    if (maxSkor === 0) return 'notr';
    if (mutluSkor === maxSkor) return 'mutlu';
    if (hüzünlüSkor === maxSkor) return 'hüzünlü';
    return 'romantik';
};

const matchMusicToEmotion = (emotion, musicList) => {
    if (!musicList || musicList.length === 0) return null;
    const emotionKeywords = {
        'mutlu': ['happy', 'upbeat', 'energetic', 'pop', 'joy', 'dance', 'fun', 'bright', 'major', 'optimistic', 'mutlu', 'neşeli', 'coşkulu', 'eğlence'],
        'hüzünlü': ['sad', 'melancholy', 'emotional', 'piano', 'strings', 'slow', 'deep', 'minor', 'cry', 'sorrow', 'hüzün', 'üzüntü', 'agir', 'yavas', 'duygusal'],
        'romantik': ['romantic', 'love', 'soft', 'gentle', 'dream', 'ambient', 'chill', 'relax', 'calm', 'aşk', 'sevgi', 'roma', 'duygusal', 'yavas'],
        'notr': ['background', 'ambient', 'chill', 'lofi', 'calm', 'soft', 'neutral', 'minimal']
    };
    const keywords = emotionKeywords[emotion] || emotionKeywords['notr'];
    let bestMatch = null;
    let bestScore = -1;
    for (const track of musicList) {
        const name = (track.name || '').toLowerCase();
        let score = 0;
        for (const kw of keywords) {
            if (name.includes(kw)) score += 2;
        }
        const ext = name.split('.').pop();
        if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) score += 0.5;
        if (score > bestScore) { bestScore = score; bestMatch = track; }
    }
    if (bestScore <= 0) {
        const idx = Math.floor(Math.random() * musicList.length);
        return musicList[idx];
    }
    return bestMatch;
};

class LogicEngineService {
    
    
    static validateCurrency(text) {
        if (!text) return text;
        // Prevent $ for Turkish economic data
        if (text.indexOf('$') > -1 && (text.indexOf('aclik') > -1 || text.indexOf('asgari') > -1 || text.indexOf('emekli') > -1 || text.indexOf('yoksulluk') > -1 || text.indexOf('maas') > -1)) {
            text = text.replace(/\$/g, 'TL');
        }
        return text;
    }

    static validateTurkishText(text) {
        if (!text) return text;
        var fixes = {
            'Turkiye': 'T\u00FCrkiye', 'turkiye': 't\u00FCrkiye',
            'Istanbul': '\u0130stanbul', 'istanbul': 'istanbul',
            'Izmir': '\u0130zmir', 'izmir': 'izmir',
            'Ankara': 'Ankara', 'ankara': 'ankara',
            'asgari ucret': 'asgari \u00FCcret', 'Asgari Ucret': 'Asgari \u00FCcret',
            'issizlik': 'i\u015Fsizlik', 'Issizlik': '\u0130\u015Fsizlik',
            'buyume': 'b\u00FCy\u00FCme', 'Buyume': 'B\u00FCy\u00FCme',
            'doviz': 'd\u00F6viz', 'Doviz': 'D\u00F6viz',
            'borc': 'bor\u00E7', 'Borc': 'Bor\u00E7',
            'butce': 'b\u00FCt\u00E7e', 'Butce': 'B\u00FCt\u00E7e',
            'enflasyon': 'enflasyon', 'Enflasyon': 'Enflasyon',
            'faiz': 'faiz', 'Faiz': 'Faiz',
            'maas': 'maa\u015F', 'Maas': 'Maa\u015F',
            'ucurum': 'u\u00E7urum', 'Ucurum': 'U\u00E7urum',
            'yuzde': 'y\u00FCzde', 'Yuzde': 'Y\u00FCzde',
            'Turk': 'T\u00FCrk', 'turk': 't\u00FCrk',
            'Turkce': 'T\u00FCrk\u00E7e', 'turkce': 't\u00FCrk\u00E7e',
            'Aclik': 'A\u00E7l\u0131k', 'aclik': 'a\u00E7l\u0131k',
            'Yoksulluk': 'Yoksulluk', 'yoksulluk': 'yoksulluk',
            'Emekli': 'Emekli', 'emekli': 'emekli',
            'Memur': 'Memur', 'memur': 'memur',
            'isci': 'i\u015F\u00E7i', 'Isci': '\u0130\u015F\u00E7i',
            'ogretmen': '\u00F6\u011Fretmen', 'Ogretmen': '\u00D6\u011Fretmen',
            'doktor': 'doktor', 'Doktor': 'Doktor',
            'hemsire': 'hem\u015Fire', 'Hemsire': 'Hem\u015Fire',
            'muhendis': 'm\u00FChendis', 'Muhendis': 'M\u00FChendis',
            'avukat': 'avukat', 'Avukat': 'Avukat',
        };
        Object.keys(fixes).forEach(function(wrong) {
            text = text.split(wrong).join(fixes[wrong]);
        });
        return text;
    }

    static validateEconomyData(data) {
        var errors = [];
        if (!data || !data.videoSlides) return errors;
        data.videoSlides.forEach(function(slide, i) {
            var text = (slide.spokenText || '') + ' ' + (slide.topText || '');
            if (text.indexOf('Turkiye') > -1 || text.indexOf('turkiye') > -1) {
                errors.push('Sahne ' + (i+1) + ': Turkiye yerine T\u00FCrkiye yaz\u0131lmal\u0131');
            }
            if (text.indexOf('$') > -1 && (text.indexOf('a\u00E7l\u0131k') > -1 || text.indexOf('asgari') > -1 || text.indexOf('emekli') > -1)) {
                errors.push('Sahne ' + (i+1) + ': T\u00FCrk ekonomik verisi $ ile g\u00F6sterilmi\u015F, TL olmal\u0131');
            }
        });
        return errors;
    }

    static getEconomyDataPrompt() {
        return 'ZORUNLU EKONOMI VERILERI:\n' +
            'T\u00DCFE, TCMB Beklentisi, Politika Faizi, A\u00E7l\u0131k S\u0131n\u0131r\u0131, Yoksulluk S\u0131n\u0131r\u0131, ' +
            'Asgari \u00DCcret, Emekli Maa\u015F\u0131, Memur Maa\u015F\u0131, \u0130\u015F\u00E7i Maa\u015F\u0131, ' +
            'Dolar/TL, Euro/TL, Gram Alt\u0131n, \u00C7eyrek Alt\u0131n, \u0130\u015Fsizlik, B\u00FCy\u00FCme\n' +
            'KURALLAR: T\u00FCrk\u00E7e karakter, TL para birimi, 85.450 TL say\u0131 bi\u00E7imi, kaynak belirt\n';
    }

    static async analyzeContent(inputData, inputType, config) {
        addSystemLog('İçerik analiz ediliyor (NVIDIA)...', 'info');
        // NVIDIA chat API'si görsel girdiyi desteklemez; media/url girişleri metin-prompt'a düşürülür.
        if (!(inputType === 'prompt' || inputType === 'text' || inputType === 'url' || inputType === 'topic')) {
            if (inputType === 'media' && Array.isArray(inputData)) {
                addSystemLog('NVIDIA görsel girdiyi işleyemez; medya yerine açıklama metni kullanılacak.', 'warn');
                const descs = inputData.map(f => f.name || f.type || 'medya').join(', ');
                inputData = `Kullanıcı şu medyayı yükledi: ${descs}. Bu medya hakkında haber senaryosu üret.`;
                inputType = 'prompt';
            } else {
                inputType = 'prompt';
            }
        }

        if (config.tip === 'guzel_soz') {
            return LogicEngineService._buildGuzelSozScript(inputData, inputType, config);
        }
        if (config.tip === 'iddia_analizi') {
            return LogicEngineService._analyzeIddia(inputData, inputType, config);
        }
        let isUnlimited = config.duration === 'unlimited';
        let targetSec = isUnlimited ? 0 : (config.duration === '15' ? 30 : config.duration === '30' ? 60 : config.duration === '60' ? 90 : config.duration === '90' ? 120 : 60);
        let sceneCount = 4; let words = "80-95";
        const useForceExact = !isUnlimited;
        if (useForceExact) {
            const wps = getWPS(config.language);
            if (config.duration === '15') { sceneCount = 4; words = `${Math.floor(15 * wps)}-${Math.floor(25 * wps)}`; }
            else if (config.duration === '30') { sceneCount = 6; words = `${Math.floor(30 * wps)}-${Math.floor(52 * wps)}`; }
            else if (config.duration === '60') { sceneCount = 9; words = `${Math.floor(60 * wps)}-${Math.floor(82 * wps)}`; }
            else if (config.duration === '90') { sceneCount = 13; words = `${Math.floor(90 * wps)}-${Math.floor(112 * wps)}`; }
        } else { sceneCount = "İçeriğe göre en az 10, ortalama 18-25 sahne"; words = "İçeriği eksiksiz anlatacak kadar esnek"; }

        let styleInstruction = "Video stili: Tarafsız, analitik, ciddi ve keskin bir haber editörü.";
        if (config.videoStyle === 'prompt_output') styleInstruction = "Video stili: Özel Prompt Çıktısı. Kullanıcının girdiği metni doğrudan uygula.";

        let langInstruction = "BÜTÜN SENARYOYU TÜRKÇE YAZACAKSIN.";
        if (config.language === 'en') langInstruction = "BÜTÜN SENARYOYU İNGİLİZCE YAZACAKSIN.";
        if (config.language === 'fr') langInstruction = "BÜTÜN SENARYOYU FRANSIZCA YAZACAKSIN.";
        if (config.language === 'de') langInstruction = "BÜTÜN SENARYOYU ALMANCA YAZACAKSIN.";
        if (config.language === 'es') langInstruction = "BÜTÜN SENARYOYU İSPANYOLCA YAZACAKSIN.";
        if (config.language === 'ar') langInstruction = "BÜTÜN SENARYOYU ARAPÇA YAZACAKSIN.";
        if (config.language === 'ru') langInstruction = "BÜTÜN SENARYOYU RUSÇA YAZACAKSIN.";

        const isImageOutput = config.outputType === 'image';
        let timeConstraint = isUnlimited ? `SÜRE SINIRI YOKTUR. Olayı detaylıca anlat.` : `DİNAMİK KISITLAYICI: Videonun hedef süresi ${config.duration === '15' ? '15-30' : config.duration === '30' ? '30-60' : config.duration === '60' ? '60-90' : '90-120'} saniyedir. Maksimum ${words.split('-')[1]} KELİME.`;

        let dynamicRules = "";
        if (config.analysisMode === 'yorumsuz') {
            dynamicRules = `BİRİNCİ KURAL (SADECE HABER - YORUMSUZ): Girdiyi dikkatlice incele. SADECE haberi tarafsızca anlat. 5N1K kurallarını uygula. Kendi yorumunu katma.\nİKİNCİ KURAL: 'mediaBlackout.show' değerini false yap.\nÜÇÜNCÜ KURAL: 'sonSoz' alanını tekrarlama.\nDÖRDÜNCÜ KURAL: Her sahnenin 'spokenText' metni NOKTA İLE BİTEN BİR CÜMLE OLMALIDIR.\n${timeConstraint}`;
        } else if (config.analysisMode === 'deep_analysis') {
            dynamicRules = `BİRİNCİ KURAL (DERİN ANALİZ): 5N1K dengesini sorgula ve sosyolojik/ekonomik etkileri analiz et.\nİKİNCİ KURAL: Skandalsa 'mediaBlackout.show' true yap.\nÜÇÜNCÜ KURAL: 'sonSoz' alanını tekrarlama.\nDÖRDÜNCÜ KURAL: Her sahnenin 'spokenText' metni NOKTA İLE BİTEN BİR CÜMLE OLMALIDIR.\n${timeConstraint}`;
        } else {
            dynamicRules = `BİRİNCİ KURAL (HABER 5N1K): Girdiyi incele, 5N1K kuralına sadık kalarak özetle.\nİKİNCİ KURAL: Skandal değilse 'mediaBlackout.show' false yap.\nÜÇÜNCÜ KURAL: 'sonSoz' alanını tekrarlama.\nDÖRDÜNCÜ KURAL: Her sahnenin 'spokenText' metni NOKTA İLE BİTEN BİR CÜMLE OLMALIDIR.\n${timeConstraint}`;
        }

        let sonSozInstruction = "";
        if (!isImageOutput) sonSozInstruction = `\n\nYEDİNCİ KURAL (SON SÖZ): Konuya cuk diye oturan çok vurucu bir ATASÖZÜ veya ÖZLÜ SÖZ belirle. Bunu 'sonSoz' alanına kaydet.`;

        const sysPrompt = `Sen TikTok ve Instagram Reels için viral içerikler üreten profesyonel bir içerik üreticisisin. Karakterin: Zeki, gerçekleri söyleyen, 20 yaşında dertli bir genç.\n\nSENARYOYU ${isImageOutput ? 1 : sceneCount} SAHNE olacak şekilde böl!\nToplam konuşma metni ${words} kelime aralığında olmalıdır.\n\nDİL KURALI: ${langInstruction}\n${styleInstruction}\n${dynamicRules}\n\nSES DOSYASI KURALI: Eğer sana bir ses dosyası (audio) gönderildiyse, ÖNCELİKLE sesi dikkatle dinle ve konuşulan her kelimeyi yazıya dök (transkribe et). Transkripti analiz et ve haber senaryosunu bu transkript üzerinden üret. Müzik dosyası ise (konuşma yoksa), dosya adından ve müzik türünden anlam çıkarmaya çalış.\n\nEKONOMI KURALLARI (ekonomi haberi ise): Turkce karakter kullan, TL para birimi, sayi bicimi 85.450 TL, kaynak belirt (TUIK, TCMB, TURK-IS), aclik/yoksulluk siniri guncel olsun. Bilgi kartlari olustur: ENFLASYON %XX, ACLIK SINIRI XX.XXX TL.\n\nGAZETE BAŞLIKLARI: Görseldeki TÜM haber başlıklarını çıkar. Her başlık için:
- 'baslik': başlık metni
- 'aciklama': haberin 2-3 cümlelik özeti
- 'x': başlığın sol üst x koordinatı (0-100 arası yüzde)
- 'y': başlığın sol üst y koordinatı (0-100 arası yüzde)
- 'w': başlığın genişliği (0-100 arası yüzde)
- 'h': başlığın yüksekliği (0-100 arası yüzde)
En az 1, en fazla 15 başlık çıkar. Kalın siyah veya kırmızı yazı ile yazılan başlıkları al. Reklam, bulmaca, ilan HARİÇ.

KAPAK DİLİ: 'thumbnailText' ${config.language} dilinde olmalıdır. Clickbait başlık olmalıdır.\nGRAFİKLER: İstatistik yoksa 'chartData.show' false yap.\nGÖRSEL UYUMU: 'imagePrompts' alanına yazacağın İngilizce komutlar, spokenText'teki ana görsel unsurları birebir tanımlamalıdır. Kişi varsa yüz tanımlı, mekan varsa detaylı, nesne varsa belirgin olmalıdır. Her sahne için tek bir güçlü prompt yaz.\nSIFIR HALÜSİNASYON: Okuyamadıysan 'isContentUnreadable' true yap.\nATATÜRK HASSASİYETİ: 'Atatürk' geçerse 'imagePrompts' kısmına "Mustafa Kemal Atatürk, highly detailed, respectful portrait" ekle!${sonSozInstruction}\n\nDönüş ZORUNLU olarak JSON formatında olmalı.`;

        let userPrompt = "";
        let extractStatsHint = "Olayı tam anla ve KISA BİR ÖZET ver.";
        if (config.analysisMode === 'yorumsuz') extractStatsHint = "SADECE haberi tarafsızca oku.";

        if (inputType === 'prompt' || inputType === 'media') {
            userPrompt = `AŞAĞIDAKİ TALİMATI UYGULA:\n\n${inputData}\n\n${extractStatsHint}`;
        }
        else if (inputType === 'url') {
            userPrompt = `[KRİTİK GÖREV]: URL'yi araştır. \nURL: ${inputData}\n\nİçeriğe ulaştıysan haberi özetle. ${extractStatsHint}\nNOT: İnternet erişimin yoksa, bu URL hakkında makul bir haber senaryosu üret.`;
        }
        else {
            userPrompt = `Aşağıdaki konuyu araştır. Haberi özetle. \n\n${inputData}\n\n${extractStatsHint}`;
        }

        // NVIDIA chat completions ile JSON çıkışı
        try {
            const parsedData = await callAI(sysPrompt, userPrompt, { json: true, temperature: 0.7, max_tokens: 4096 });
            if (typeof parsedData === 'string') throw new Error('JSON ayrışmadı: ' + parsedData.substring(0, 100));
            if (parsedData.isContentUnreadable) throw new Error("Orijinal metne ulaşılamadı.");
            if (parsedData.videoSlides) {
                const errPatterns = [/görselde.*metin.*bulunmamaktadır/i, /no.*text.*found/i, /metin.*bulunamadı/i, /cannot.*read.*text/i];
                parsedData.videoSlides = parsedData.videoSlides.map(slide => {
                    if (slide.spokenText && errPatterns.some(p => p.test(slide.spokenText))) {
                        return { ...slide, spokenText: slide.topText || "Bu görseldeki içerik hakkında bilgi veriliyor." };
                    }
                    return slide;
                });
            }
            return parsedData;
        } catch (e) {
            if (e.message.includes('metne ulaşılamadı')) throw e;
            throw new Error(`NVIDIA analiz hatası: ${e.message}`);
        }
    }

    // Tek bir görsel için 2-3 sahne üretir (sıralı akış için)
    static async analyzeContentForImage(inputData, inputType, config, imageIndex, totalImages, previousContext) {
        addSystemLog(`Görsel ${imageIndex + 1}/${totalImages} için sahneler üretiliyor (NVIDIA)...`, 'info');
        // NVIDIA görsel girdiyi desteklemez
        if (inputType === 'media' && Array.isArray(inputData)) {
            const descs = inputData.map(f => f.name || f.type).join(', ');
            inputData = `Görsel açıklaması: ${descs}. Bu görseldeki haberi/konuyu detaylıca anlat.`;
            inputType = 'prompt';
        }

        let styleInstruction = "Video stili: Tarafsız, analitik, ciddi ve keskin bir haber editörü.";
        if (config.videoStyle === 'prompt_output') styleInstruction = "Video stili: Özel Prompt Çıktısı. Kullanıcının girdiği metni doğrudan uygula.";

        let langInstruction = "BÜTÜN SENARYOYU TÜRKÇE YAZACAKSIN.";
        if (config.language === 'en') langInstruction = "BÜTÜN SENARYOYU İNGİLİZCE YAZACAKSIN.";
        if (config.language === 'fr') langInstruction = "BÜTÜN SENARYOYU FRANSIZCA YAZACAKSIN.";
        if (config.language === 'de') langInstruction = "BÜTÜN SENARYOYU ALMANCA YAZACAKSIN.";
        if (config.language === 'es') langInstruction = "BÜTÜN SENARYOYU İSPANYOLCA YAZACAKSIN.";
        if (config.language === 'ar') langInstruction = "BÜTÜN SENARYOYU ARAPÇA YAZACAKSIN.";
        if (config.language === 'ru') langInstruction = "BÜTÜN SENARYOYU RUSÇA YAZACAKSIN.";

        let dynamicRules = "";
        if (config.analysisMode === 'yorumsuz') {
            dynamicRules = `BİRİNCİ KURAL (SADECE HABER - YORUMSUZ): Girdiyi dikkatlice incele. SADECE haberi tarafsızca anlat. 5N1K kurallarını uygula. Kendi yorumunu katma.\nİKİNCİ KURAL: 'mediaBlackout.show' değerini false yap.\nÜÇÜNCÜ KURAL: Her sahnenin 'spokenText' metni NOKTA İLE BİTEN BİR CÜMLE OLMALIDIR.`;
        } else if (config.analysisMode === 'deep_analysis') {
            dynamicRules = `BİRİNCİ KURAL (DERİN ANALİZ): 5N1K dengesini sorgula ve sosyolojik/ekonomik etkileri analiz et.\nİKİNCİ KURAL: Skandalsa 'mediaBlackout.show' true yap.\nÜÇÜNCÜ KURAL: Her sahnenin 'spokenText' metni NOKTA İLE BİTEN BİR CÜMLE OLMALIDIR.`;
        } else {
            dynamicRules = `BİRİNCİ KURAL (HABER 5N1K): Girdiyi incele, 5N1K kuralına sadık kalarak özetle.\nİKİNCİ KURAL: Skandal değilse 'mediaBlackout.show' false yap.\nÜÇÜNCÜ KURAL: Her sahnenin 'spokenText' metni NOKTA İLE BİTEN BİR CÜMLE OLMALIDIR.`;
        }

        const contextBlock = previousContext ? `\nÖNCEKİ BLOKLARIN ÖZETİ: ${previousContext}\nBu bilgileri tekrarlama, SADECE bu görsel/eğerseldeki yeni içeriğe odaklan.` : "";
        const isLastImage = imageIndex === totalImages - 1;
        const sonSozRule = isLastImage ? `\n\nYEDİNCİ KURAL (SON SÖZ): Konuya cuk diye oturan çok vurucu bir ATASÖZÜ veya ÖZLÜ SÖZ belirle. Bunu 'sonSoz' alanına kaydet.` : "";

        const sysPrompt = `Bu, ${totalImages} görsellik bir videonun ${imageIndex + 1}. bloğudur.\nSen TikTok ve Instagram Reels için viral içerikler üreten profesyonel bir içerik üreticisisin.\n\nSENARYOYU TAM OLARAK 2 SAHNE olacak şekilde böl! Görseldeki haberi/konuyu 2 farklı açıdan anlat.\nHer sahne bu görsele ait haberi anlatmalı.\nToplam konuşma metni bu blok için 30-50 kelime aralığında olmalıdır.\n\nDİL KURALI: ${langInstruction}\n${styleInstruction}\n${dynamicRules}\n${contextBlock}\n\nGAZETE BAŞLIKLARI: Görseldeki TÜM haber başlıklarını çıkar. Her başlık için:
- 'baslik': başlık metni
- 'aciklama': haberin 2-3 cümlelik özeti
- 'x': başlığın sol üst x koordinatı (0-100 arası yüzde)
- 'y': başlığın sol üst y koordinatı (0-100 arası yüzde)
- 'w': başlığın genişliği (0-100 arası yüzde)
- 'h': başlığın yüksekliği (0-100 arası yüzde)
En az 1, en fazla 15 başlık çıkar. Kalın siyah veya kırmızı yazı ile yazılan başlıkları al. Reklam, bulmaca, ilan HARİÇ.

KAPAK DİLİ: 'thumbnailText' ${config.language} dilinde olmalıdır. Clickbait başlık olmalıdır.\nGRAFİKLER: İstatistik yoksa 'chartData.show' false yap.\nGÖRSEL UYUMU: 'imagePrompts' alanına yazacağın İngilizce komutlar, spokenText'teki ana görsel unsurları birebir tanımlamalıdır.\nATATÜRK HASSASİYETİ: 'Atatürk' geçerse 'imagePrompts' kısmına "Mustafa Kemal Atatürk, highly detailed, respectful portrait" ekle!${sonSozRule}\n\nDönüş ZORUNLU olarak JSON formatında olmalı.`;

        let userPrompt = "";
        let extractStatsHint = "Olayı tam anla ve KISA BİR ÖZET ver.";
        if (config.analysisMode === 'yorumsuz') extractStatsHint = "SADECE haberi tarafsızca oku.";

        if (inputType === 'prompt' || inputType === 'media') {
            userPrompt = `AŞAĞIDAKİ TALİMATI UYGULA (Bu ${imageIndex + 1}/${totalImages} blok):\n\n${inputData}\n\n${extractStatsHint}`;
        } else if (inputType === 'url') {
            userPrompt = `URL'yi araştır (Bu ${imageIndex + 1}/${totalImages} blok):\nURL: ${inputData}\n${extractStatsHint}`;
        } else {
            userPrompt = `Konuyu araştır (Bu ${imageIndex + 1}/${totalImages} blok):\n${inputData}\n${extractStatsHint}`;
        }

        try {
            const parsedData = await callAI(sysPrompt, userPrompt, { json: true, temperature: 0.7, max_tokens: 2048 });
            if (typeof parsedData === 'string') throw new Error('JSON ayrışmadı');
            if (parsedData.isContentUnreadable) throw new Error("Orijinal metne ulaşılamadı.");
            if (parsedData.videoSlides) {
                const errPatterns = [/görselde.*metin.*bulunmamaktadır/i, /no.*text.*found/i, /metin.*bulunamadı/i, /cannot.*read.*text/i];
                parsedData.videoSlides = parsedData.videoSlides.map(slide => {
                    if (slide.spokenText && errPatterns.some(p => p.test(slide.spokenText))) {
                        return { ...slide, spokenText: slide.topText || "Bu görseldeki içerik hakkında bilgi veriliyor." };
                    }
                    return slide;
                });
            }
            addSystemLog(`Görsel ${imageIndex + 1} için ${parsedData.videoSlides?.length || 0} sahne üretildi.`, 'success');
            return parsedData;
        } catch (e) {
            if (e.message.includes('metne ulaşılamadı')) throw e;
            throw new Error(`JSON format hatası (Görsel ${imageIndex + 1}): ${e.message}`);
        }
    }

    
    static async _buildElestiriScript(inputData, inputType, config) {
        addSystemLog('Eleştiri analizi başlıyor...', 'info');
        // NVIDIA görsel girdiyi desteklemez
        if (inputType === 'media' && Array.isArray(inputData)) {
            const descs = inputData.map(f => f.name || f.type).join(', ');
            inputData = `Medya açıklaması: ${descs}. Bu içeriği analiz et.`;
            inputType = 'prompt';
        }

        // 1. İçeriği analiz et
        let parts = [];
        let contentText = '';

        if (inputType === 'prompt' || inputType === 'text' || inputType === 'media') {
            contentText = typeof inputData === 'string' ? inputData : '';
            parts = [{ text: `Aşağıdaki içeriği analiz et:\n\n${contentText}` }];
        } else if (inputType === 'url') {
            parts = [{ text: `Bu URL'deki içeriği araştır ve analiz et: ${inputData}` }];
        }

        // 2. Türkiye gerçekleri ile karşılaştırmalı analiz
        const sysPrompt = `Sen bir Türk medya eleştirmeni ve fact-checker'sın. Görevin:

1. Verilen içeriği dikkatle analiz et
2. İçerideki iddiaları, savunulan görüşleri tespit et
3. Her iddiayı Türkiye'nin GÜNCEL GERÇEKLERİ ile karşılaştır

GÜNCEL VERİ ZORUNLULUĞU (2026):
- En güncel TÜİK verilerini kullan (Mayıs-Haziran 2026)
- En güncel TCMB verilerini kullan (Haziran 2026)
- En güncel Hazine verilerini kullan
- Verilerin tarihini BELİRT (örn: "TÜİK Haziran 2026 verilerine göre...")
- Eski veri kullanma, güncel olanı bul

KAYNAKLAR (her sahne sonunda link ekle):
- TÜİK: https://data.tuik.gov.tr
- TCMB: https://www.tcmb.gov.tr
- Hazine: https://www.hmb.gov.tr
- DİSK-AR: https://disk.org.tr/arastirma/
- IMF: https://www.imf.org
- Dünya Bankası: https://data.worldbank.org

ELE ALINACAK KONULAR:
- Ekonomi: Enflasyon (TÜFE/ÜFE), faiz, döviz kuru (USD/TRY), dış borç, GSMH, işsizlik, asgari ücret
- Sosyal: Yoksulluk oranı, gelir dağılımı (Gini), açlık/yoksulluk sınırı, ultra zengin vs fakir sayısı
- Eğitim: PISA sonuçları, öğretmen maaşları
- Sağlık: OECD karşılaştırmaları

ÇIKTI FORMATI:
- Her sahne: İDDİA → GERÇEK → KAYNAK (link ile)
- Doğruysa: Örneklerle destekle
- Yanlışsa: Resmi verilerle çürüt + kaynak linki
- Tarih belirt (örn: "Haziran 2026")
- Tarafsız ve objektif ol

SON SAHNE (KAYNAKLAR LİSTESİ):
- Tüm kaynakları listele (başlık + URL + tarih)

KURALLAR:
- 'dezenformasyon' kelimesini kullanma
- 5N1K kuralına uy
- Her sahne NOKTA ile biten cümle olmalı
- Clickbait: sansasyonel ama doğru`

        const userPrompt = parts.map(p => p.text).join('\n');
        try {
            const parsedData = await callAI(sysPrompt, userPrompt, { json: true, temperature: 0.5, max_tokens: 4096 });
            if (typeof parsedData === 'string') throw new Error('JSON ayrışmadı');
            if (parsedData.isContentUnreadable) throw new Error("İçerik okunamadı.");
            addSystemLog(`Eleştiri analizi tamamlandı: ${parsedData.videoSlides?.length || 0} sahne.`, 'success');
            return parsedData;
        } catch (e) {
            if (e.message.includes('okunamadı')) throw e;
            throw new Error(`JSON format hatası: ${e.message}`);
        }
    }


    
    static async _analyzeIddia(inputData, inputType, config) {
        addSystemLog('İddia Analizi başlıyor (NVIDIA)...', 'info');
        // NVIDIA görsel girdiyi desteklemez
        if (inputType === 'media' && Array.isArray(inputData)) {
            var descs = inputData.map(function(f) { return f.name || f.type; }).join(', ');
            inputData = 'Medya açıklaması: ' + descs + '. İçindeki doğrulanabilir iddiaları çıkar.';
            inputType = 'prompt';
        }

        var parts = [];
        if (inputType === 'media') {
            parts = [{ text: 'Aşağıdaki metindeki doğrulanabilir iddiaları çıkar: ' + (typeof inputData === 'string' ? inputData : '') }];
        } else if (inputType === 'prompt' || inputType === 'text') {
            parts = [{ text: 'Aşağıdaki metindeki doğrulanabilir iddiaları çıkar: ' + (typeof inputData === 'string' ? inputData : '') }];
        } else if (inputType === 'url') {
            parts = [{ text: 'Bu URL icindeki icerigi arastir. Dogrulanabilir iddialari cikar: ' + inputData }];
        }

        var sysPrompt = 'Sen bir fact-check ve ekonomi analiz uzmanisin. ASAGIDAKI GUNCEL VERILERI MUTLAKA KULLAN (Haziran 2026):\n\nGUNCEL EKONOMI VERILERI (Haziran 2026):\n- Aclik Siniri: 35.759 TL (dort kisilik aile, TÜRK-İŞ Haziran 2026)\n- Yoksulluk Siniri: 116.478 TL (dort kisilik aile, TÜRK-İŞ Haziran 2026)\n- Asgari Ucret: 28.075 TL (net, Ocak 2026)\n- En Dusuk Emekli Maasi: 23.552 TL\n- TÜFE Yillik: %32.11 (Haziran 2026, TÜİK)\n- TÜFE Aylik: %0.99 (Haziran 2026, TÜİK)\n- TCMB Yil Sonu Beklenti: %29\n- TCMB Politika Faizi: %37\n- Dolar/TL: 47.05 (16 Temmuz 2026)\n- Euro/TL: 54.07 (16 Temmuz 2026)\n- Gram Altin: 6.222 TL (16 Temmuz 2026)\n- Ceyrek Altin: 10.223 TL (16 Temmuz 2026)\n- Issizlik: %8.2\n\nNOT: Bu veriler TÜRK-İŞ ve TÜİK resmi verileridir. Video iceriginde MUTLAKA bu rakamlari net olarak goster. Rakamlar buyuk puntolarla yazilsin, arka plandaki goruntunun ustunde net gorunsun. Tarih belirt: Haziran 2026.\n\nKURALLAR:\n1. Rakamlar NET ve BUYUK yazilacak (arka planda net gorunecek)\n2. TL olarak yaz (dolar degil)\n3. Tarih belirt: Haziran 2026\n4. Kaynak belirt: TÜRK-İŞ, TÜIK\n5. Grafik varsa goster\n6. Google Search ile guncel veri bulabilirsin\n\n Gorev:\n\n1. Icerikteki DOGRULANABILIR cumleleri cikar (yorum, hakaret, kisisel gorus HARIC).\n2. Her iddiayi ayri kart yap.\n3. Her iddiayi bagimsiz analiz et.\n4. Resmi kaynaklarla karsilastir.\n5. Degerlendirme etiketi ver: Dogru, Kisman Dogru, Eksik Baglam, Yanlis, Dogrulanamiyor.\n6. Guven skoru hesapla (0-100).\n7. Kanitlari listele (kaynak + URL + veri + TARIH).\n8. Video senaryosu olustur: Hook(5sn) -> Iddia -> Aciklama -> Kanitlar -> Sonuc -> Kapanis.\n9. Kalite kontrol yap.\n\nZORUNLU EKONOMI VERILERI (video iceriginde MUTLAKA yazilacak):\n- Enflasyon: Guncel TÜFE (yillik %), aylik %, TARIHI ile birlikte\n- TCMB Yil Sonu Enflasyon Beklentisi: % kac, gerceklesen: % kac\n- Politika Faizi: % kac\n- Acik Siniri: XXXXX TL (TARIHI: Haziran 2026 gibi, TÜRK-İŞ)\n- Yoksulluk Siniri: XXXXX TL (TARIHI ile)\n- Acik Siniri altinda kac kisi: X milyon\n- Yoksulluk siniri altinda kac kisi: X milyon\n- Asgari Ucret: XXXXX TL (net)\n- En Dusuk Emekli Maasi: XXXXX TL\n- Ortalama Memur Maasi: XXXXX TL\n- Ortalama Isci Maasi: XXXXX TL\n- Dolar/TL: XX.XX TL\n- Euro/TL: XX.XX TL\n- Gram Altin: XXXXX TL\n- Ceyrek Altin: XXXXX TL\n- Issizlik Orani: % X.X\n- Buyume (GDP): % X.X\n- Gini Katsayisi: 0.XXX\n\nKURALLAR:\n1. Tum rakamlar NET TL olarak yazilacak (orn: 26.500 TL, $ degil)\n2. Tarih belirtilecek (orn: TÜİK Haziran 2026 verilerine gore...)\n3. Eski veri kullanma, en guncel veriyi bul (en fazla 1-2 ay onceki)\n4. Enflasyon icin hem gerceklesen hem beklenti yaz\n5. Aclik/yoksulluk siniri MUTLAKA TL olarak ve tarihle birlikte yaz\n6. Kac kisi acik/yoksulluk siniri altinda MUTLAKA yaz\n7. Sayi bicimi: 26.500 TL (nokta binlik ayrac)\n8. Grafik varsa goster (enflasyon trendi, dolar kuru degisimi vb)\n9. Kaynak belirt: TÜİK, TCMB, TÜRK-İŞ, OECD\n\nHer sahne NOKTA ile biten cumle olmali. Donus ZORUNLU JSON.';

        var payload = {
            contents: [{ role: 'user', parts: parts }],
            systemInstruction: { parts: [{ text: sysPrompt }] },
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'OBJECT',
                    properties: {
                        isContentUnreadable: { type: 'BOOLEAN' },
                        videoSlides: { type: 'ARRAY', items: { type: 'OBJECT', properties: { topText: { type: 'STRING' }, spokenText: { type: 'STRING' }, imagePrompts: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['topText', 'spokenText', 'imagePrompts'] } },
                        thumbnailText: { type: 'STRING' },
                        sonSoz: { type: 'STRING' },
                        lastQuote: { type: 'STRING' },
                        thumbnailImagePrompt: { type: 'STRING' },
                        iddialar: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
                            iddia: { type: 'STRING' },
                            durum: { type: 'STRING' },
                            guvenSkoru: { type: 'NUMBER' },
                            analiz: { type: 'STRING' },
                            kanitlar: { type: 'ARRAY', items: { type: 'OBJECT', properties: { kaynak: { type: 'STRING' }, url: { type: 'STRING' }, veri: { type: 'STRING' } }, required: ['kaynak', 'veri'] } },
                            sonuc: { type: 'STRING' }
                        }, required: ['iddia', 'durum', 'guvenSkoru', 'analiz', 'kanitlar', 'sonuc'] } },
                        mediaBlackout: { type: 'OBJECT', properties: { show: { type: 'BOOLEAN' }, percentageCovered: { type: 'NUMBER' }, percentageIgnored: { type: 'NUMBER' }, mediaNames: { type: 'ARRAY', items: { type: 'STRING' } }, explanation: { type: 'STRING' } }, required: ['show', 'percentageCovered', 'percentageIgnored', 'mediaNames', 'explanation'] }
                    },
                    required: ['isContentUnreadable', 'videoSlides', 'thumbnailText', 'sonSoz', 'lastQuote', 'thumbnailImagePrompt', 'iddialar', 'mediaBlackout']
                }
            },
            tools: [{ google_search: {} }]
        };

        var userPrompt = parts.map(function(p) { return p.text; }).join('\n');
        try {
            var parsedData = await callAI(sysPrompt, userPrompt, { json: true, temperature: 0.3, max_tokens: 4096 });
            if (typeof parsedData === 'string') throw new Error('JSON ayrışmadı');
            if (parsedData.isContentUnreadable) throw new Error('Icerik okunamadi.');
            addSystemLog('Iddia Analizi tamamlandi: ' + (parsedData.iddialar ? parsedData.iddialar.length : 0) + ' iddia.', 'success');
            return parsedData;
        } catch (e) {
            if (e.message.includes('okunamadi')) throw e;
            throw new Error('JSON format hatasi: ' + e.message);
        }
    }


    static getGuzelSozAnalysis(quoteText) {
        // Theme detection
        var themes = {
            'sabir': ['sabır', 'bekle', 'zaman', 'dayan'],
            'azim': ['azim', 'çaba', 'gayret', 'mücadele', 'vazgeçme'],
            'başarı': ['başarı', 'kazan', 'hedef', 'zafer'],
            'hayat': ['hayat', 'yaşam', 'ömür', 'nefes'],
            'mutluluk': ['mutluluk', 'sevinç', 'neşe', 'gülümse'],
            'sevgi': ['sevgi', 'aşk', 'kalp', 'sev'],
            'anne': ['anne', 'annem', 'ana'],
            'baba': ['baba', 'babam'],
            'dostluk': ['dost', 'arkadaş', 'kardeş'],
            'inanç': ['inanç', 'iman', 'tanrı', 'allah'],
            'umut': ['umut', 'beklenti', 'gelecek'],
            'özgürlük': ['özgürlük', 'hür', 'serbest'],
            'cesaret': ['cesaret', 'korkusuz', 'yiğit'],
            'zaman': ['zaman', 'vakit', 'dakika', 'saat'],
            'bilgelik': ['bilgi', 'bilge', 'akıl', 'hikmet'],
            'yalnızlık': ['yalnız', 'tek', 'kimsesiz'],
            'huzur': ['huzur', 'sükunet', 'dingin'],
            'şükür': ['şükür', 'minnet', 'hamd'],
            'doğa': ['doğa', 'ağaç', 'deniz', 'güneş', 'yıldız']
        };
        
        var detectedTheme = 'hayat';
        var maxScore = 0;
        var textLower = quoteText.toLowerCase();
        
        Object.keys(themes).forEach(function(theme) {
            var score = 0;
            themes[theme].forEach(function(keyword) {
                if (textLower.indexOf(keyword) > -1) score++;
            });
            if (score > maxScore) {
                maxScore = score;
                detectedTheme = theme;
            }
        });
        
        // Emotion detection
        var emotions = {
            'hüzün': ['hüzün', 'acı', 'gözyaşı', 'ağla', 'keder'],
            'umut': ['umut', 'bekle', 'gelecek', 'iyi'],
            'aşk': ['aşk', 'sevgi', 'kalp', 'sev'],
            'nefret': ['nefret', 'kin', 'öfke'],
            'korku': ['korku', 'kork', 'tehlike'],
            'sevinç': ['sevinç', 'mutlu', 'gül', 'neşe'],
            'öfke': ['öfke', 'kız', 'sinir'],
            'gurur': ['gurur', 'onur', 'şeref'],
            'özlem': ['özlem', 'hasret', 'bekle']
        };
        
        var detectedEmotion = 'umut';
        maxScore = 0;
        Object.keys(emotions).forEach(function(emo) {
            var score = 0;
            emotions[emo].forEach(function(keyword) {
                if (textLower.indexOf(keyword) > -1) score++;
            });
            if (score > maxScore) {
                maxScore = score;
                detectedEmotion = emo;
            }
        });
        
        // Style detection based on theme
        var styleMap = {
            'sabir': 'minimal', 'azim': 'dark', 'başarı': 'luxury',
            'hayat': 'nature', 'mutluluk': 'warm', 'sevgi': 'romantic',
            'umut': 'light', 'cesaret': 'epik', 'bilgelik': 'vintage',
            'yalnızlık': 'film_noir', 'huzur': 'nature', 'doğa': 'nature',
            'zaman': 'minimal', 'inanc': 'spiritual', 'dostluk': 'warm'
        };
        
        var detectedStyle = styleMap[detectedTheme] || 'cinematic';
        
        // Music selection
        var musicMap = {
            'sabir': 'soft piano', 'azim': 'motivational', 'başarı': 'cinematic orchestral',
            'hayat': 'contemplative piano', 'mutluluk': 'upbeat', 'sevgi': 'romantic piano',
            'anne': 'warm orchestral', 'baba': 'strong strings', 'umut': 'soft piano',
            'cesaret': 'epic cinematic', 'doğa': 'nature sounds', 'bilgelik': 'meditation',
            'yalnızlık': 'melancholic piano', 'huzur': 'ambient', 'şükür': 'light strings',
            'zaman': 'minimal piano', 'inanc': 'spiritual ambient', 'dostluk': 'warm acoustic'
        };
        
        var suggestedMusic = musicMap[detectedTheme] || 'contemplative piano';
        
        // Color palette
        var paletteMap = {
            'sabir': { ana: '#2c3e50', ikincil: '#34495e', vurgu: '#3498db', yazi: '#ecf0f1', arka: '#1a252f' },
            'azim': { ana: '#1a1a2e', ikincil: '#16213e', vurgu: '#e94560', yazi: '#ffffff', arka: '#0f0f23' },
            'başarı': { ana: '#2d1b69', ikincil: '#11001c', vurgu: '#ffd700', yazi: '#ffffff', arka: '#0a0015' },
            'hayat': { ana: '#1b4332', ikincil: '#2d6a4f', vurgu: '#95d5b2', yazi: '#ffffff', arka: '#081c15' },
            'sevgi': { ana: '#4a0e0e', ikincil: '#6b1d1d', vurgu: '#ff6b6b', yazi: '#ffffff', arka: '#1a0505' },
            'umut': { ana: '#1a365d', ikincil: '#2a4a7f', vurgu: '#63b3ed', yazi: '#ffffff', arka: '#0f1f3d' },
            'hüzün': { ana: '#2d3748', ikincil: '#4a5568', vurgu: '#a0aec0', yazi: '#e2e8f0', arka: '#1a202c' },
            'doğa': { ana: '#22543d', ikincil: '#276749', vurgu: '#68d391', yazi: '#ffffff', arka: '#1a3a2a' },
        };
        
        var palette = paletteMap[detectedTheme] || { ana: '#1a1a2e', ikincil: '#16213e', vurgu: '#e94560', yazi: '#ffffff', arka: '#0f0f23' };
        
        return {
            tema: detectedTheme,
            duygu: detectedEmotion,
            stil: detectedStyle,
            muzik: suggestedMusic,
            palet: palette,
            enerji: detectedEmotion === 'cesaret' || detectedEmotion === 'öfke' ? 80 : 40,
            pozitiflik: detectedEmotion === 'umut' || detectedEmotion === 'sevinç' ? 80 : 50
        };
    }

    static getGuzelSozImagePrompts(quoteText, analysis) {
        var tema = analysis.tema || 'hayat';
        var stil = analysis.stil || 'cinematic';
        var duygu = analysis.duygu || 'umut';
        
        return [
            'Ultra realistic ' + stil + ' style, ' + tema + ' theme, 8K HDR, professional lighting, depth of field, film color grading, golden ratio composition, volumetric light, photorealistic masterpiece.',
            'Cinematic emotional shot, ' + duygu + ' feeling, ' + stil + ' aesthetic, dramatic lighting, 8K HDR, award winning photography, professional color grading, bokeh background.',
            'Symbolic powerful image, ' + tema + ' concept, ' + stil + ' style, epic composition, 8K HDR, volumetric light, cinematic depth, masterpiece quality.'
        ];
    }

static async _buildGuzelSozScript(inputData, inputType, config) {
        // Felsefi video formülü: HOOK → LEAD → DÜŞÜNÜR SÖZLERİ → CTA → HASHTAGS
        let topicText = "";

        // Metin çıkarma — girdi türüne göre
        if (typeof inputData === 'string') {
            topicText = inputData.trim();
            addSystemLog(`Metin girdisi: ${topicText.length} karakter`, 'info');
        } else if (Array.isArray(inputData) && inputData.length > 0) {
            const videoFile = inputData.find(f => f.type?.startsWith('video/'));
            const imageFile = inputData.find(f => f.type?.startsWith('image/'));

            // OCR yardımcı fonksiyonları
            const splitIntoStrips = (srcB64, stripCount) => new Promise((resolve) => {
                const img = new Image(); img.crossOrigin = "Anonymous";
                img.onload = () => {
                    const strips = []; const stripH = Math.ceil(img.height / stripCount);
                    for (let i = 0; i < stripCount; i++) {
                        const c = document.createElement('canvas'); c.width = img.width; c.height = stripH;
                        const cx = c.getContext('2d'); cx.fillStyle = 'white'; cx.fillRect(0, 0, c.width, c.height);
                        cx.drawImage(img, 0, i * stripH, img.width, stripH, 0, 0, img.width, stripH);
                        strips.push(c.toDataURL('image/jpeg', 0.95).split(',')[1]);
                    }
                    resolve(strips);
                };
                img.onerror = () => resolve([srcB64]);
                img.src = 'data:image/jpeg;base64,' + srcB64;
            });

            // NVIDIA ücretsiz chat API'si görsel girdiyi desteklemez; OCR yapılamaz.
            // Bu fonksiyon görsel tabanlı metin çıkaramaz, boş döner (fallback devreye girer).
            const runOcr = async (b64Data) => {
                addSystemLog('Görsel OCR NVIDIA ile desteklenmiyor; metin çıkarılmayacak.', 'warn');
                return "";
            };

            const _unusedOcrModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest'];

            if (videoFile) {
                addSystemLog('Video karesi çıkarılıyor...', 'info');
                const frameB64 = await new Promise((resolve) => {
                    const video = document.createElement('video'); video.muted = true; video.playsInline = true;
                    const raw = videoFile.data.includes(',') ? videoFile.data.split(',')[1] : videoFile.data;
                    const ab = new ArrayBuffer(atob(raw).length); const ia = new Uint8Array(ab);
                    for (let i = 0; i < ab.byteLength; i++) ia[i] = atob(raw).charCodeAt(i);
                    video.src = URL.createObjectURL(new Blob([ab], { type: videoFile.type || 'video/mp4' }));
                    video.onloadeddata = () => { video.currentTime = Math.min(1, video.duration * 0.1); };
                    video.onseeked = () => {
                        try {
                            const c = document.createElement('canvas'); c.width = video.videoWidth || 640; c.height = video.videoHeight || 480;
                            c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
                            URL.revokeObjectURL(video.src); resolve(c.toDataURL('image/jpeg', 0.9).split(',')[1]);
                        } catch (e) { URL.revokeObjectURL(video.src); resolve(null); }
                    };
                    video.onerror = () => { URL.revokeObjectURL(video.src); resolve(null); };
                    setTimeout(() => { URL.revokeObjectURL(video.src); resolve(null); }, 10000);
                });
                if (frameB64) topicText = await runOcr(frameB64) || "";
                if (!topicText) topicText = videoFile.name?.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, '') || "Özgürlük";
            } else if (imageFile) {
                addSystemLog('Görsel OCR başlıyor...', 'info');
                const b64Data = imageFile.data.split(',')[1] || imageFile.data;
                topicText = await runOcr(b64Data) || "";
                if (!topicText) topicText = imageFile.name.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, '') || "Adalet";
            } else {
                topicText = inputData[0].name?.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, '') || "Hayatın anlamı";
            }
        }

        // OCR hata mesajlarını filtrele
        const errorPatterns = [/görselde\s+(herhangi\s+)?bir\s+metin\s+bulunmamaktadır/i, /bu\s+görselde\s+metin\s+yok/i, /no\s+text\s+found/i, /görselde\s+yazı\s+bulunamadı/i, /metin\s+bulunamadı/i, /cannot\s+(read|find|detect)\s+text/i, /ocr\s+(failed|error|başarısız)/i];
        if (errorPatterns.some(p => p.test(topicText))) {
            if (inputType === 'media' && Array.isArray(inputData) && inputData[0]?.name) topicText = inputData[0].name.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, '');
            else topicText = "Hayatın anlamı";
            addSystemLog('OCR hata mesajı filtrelendi, dosya adı kullanıldı.', 'warn');
        }
        if (!topicText || topicText.length < 3) topicText = "Hayatın anlamı";
        addSystemLog(`Konu: "${topicText.substring(0, 80)}..."`, 'info');

        // Gemini'ya felsefi senaryo prompt'u gönder
        const philosopherPrompt = `Sen felsefe, etik, siyaset bilimi, kitle psikolojisi ve kişisel gelişim konularında uzman, dijital dünyada (TikTok/Reels) geniş kitlelere hitap eden profesyonel bir içerik üreticisisin.

Konu başlığı: "${topicText}"

Aşağıdaki yapıya KESİNLİKLE sadık kalarak bir video senaryosu üret:

1. VURUCU BAŞLIK (hook): İlk 3 saniyede izleyicinin dikkatini çekecek, kışkırtıcı, merak uyandırıcı ve sorgulayıcı bir başlık. "Adalet Güçlüler İçin Mi Çalışıyor?" veya "Bir Diktatörün 7 İşareti" gibi.

2. GİRİŞ (lead): Konunun özünü, toplum veya birey üzerindeki etkisini anlatan 1-2 cümlelik güçlü bir giriş.

3. DÜŞÜNÜR SÖZLERİ (quotes): Konuyla doğrudan ilişkili, tarihe yön vermiş en az 3, en fazla 4 farklı filozof/düşünürün (Locke, Tocqueville, Mill, Sokrates, Platon, Nietzsche, Epiktetos, İbn Haldun, Machiavelli, Hannah Arendt, vb.) çarpıcı sözlerini listele. Her düşünür için:
   - name: Düşünürün adı
   - quote: Sözü (Türkçe, 1-2 cümle)
   - emphasis: Sözün taşıdığı derin anlamı açıklayan kısa vurgu (1 cümle)

4. KAPANIŞ (cta): İzleyiciyi yorum yapmaya davet eden derin, ucu açık bir soru.

5. ETİKETLER: En az 8 hashtag ve 5 anahtar kelime (SEO uyumlu).

Dil ve ton: Ciddi, entelektüel, eleştirel, nesnel ama provokatif ve akıcı. Süslü ve gereksiz uzun cümlelerden kaçın; mesajı net ve vurucu ver. BÜTÜN METİN TÜRKÇE OLMALI.

JSON formatında dön.`;

        addSystemLog('NVIDIA felsefi senaryo üretiliyor...', 'info');
        let hook = "", lead = "", quotes = [], cta = "", hashtags = [], keywords = [];
        try {
            const parsed = await callAI('Sen bir felsefe içerik uzmanısın. Yanıtını geçerli JSON olarak ver.', philosopherPrompt, { json: true, temperature: 0.85, max_tokens: 2048 });
            if (typeof parsed !== 'string') {
                hook = parsed.hook || "";
                lead = parsed.lead || "";
                quotes = parsed.quotes || [];
                cta = parsed.cta || "";
                hashtags = parsed.hashtags || [];
                keywords = parsed.keywords || [];
                addSystemLog(`✓ Senaryo üretildi: ${quotes.length} düşünür, ${hashtags.length} etiket`, 'success');
            }
        } catch (e) { addSystemLog(`NVIDIA senaryo hatası: ${e.message}`, 'warn'); }

        // Fallback — AI yanıt vermezse
        if (!hook) {
            hook = `${topicText} Üzerine Düşündürücü Bir Yolculuk`;
            lead = `Bu konu, yüzyıllardır filozofların kafasını kurcalayan temel bir soru. Peki bugün ne kadar geçerli?`;
            quotes = [
                { name: "Sokrates", quote: "Sorgulanmamış bir hayat, yaşanmaya değmez.", emphasis: "Sorgulama cesareti olmadan gerçek bilgiye ulaşılamaz." },
                { name: "Platon", quote: "Adaletsiz bir düzen, en büyük suçtur.", emphasis: "Güçlü olanın adaleti tanımlaması, adaletsizliğin kendisidir." },
                { name: "Nietzsche", quote: "Uzun süre uçuruma bakan, uçurumun da ona bacağını unutmamalı.", emphasis: "Kötülüğü incelerken, onun bir parçası olma tehlikesi her zaman vardır." }
            ];
            cta = `Sizce bu konu günümüz dünyasında ne kadar geçerli? Görüşlerinizi yorumlarda paylaşın.`;
            hashtags = ['#felsefe', '#düşünürler', '#sokrates', '#platon', '#nietzsche', '#adalet', '#özgürlük', '#düşündürücü', '#entelijansiya', '#tiktokfelsefe'];
            keywords = ['felsefe', 'düşünürler', 'adalet', 'özgürlük', 'toplum'];
            addSystemLog('Fallback senaryo kullanıldı.', 'warn');
        }

        // Görsel promptları üret — her sahne için
        const imagePromptBase = [
            `A dramatic cinematic scene representing: ${hook}. Dark moody lighting, thought-provoking atmosphere, symbolic composition.`,
            `An intellectual scene with books, ancient columns, and soft golden light representing wisdom and knowledge.`,
            ...quotes.map((q, i) => `A portrait-style cinematic scene of ${q.name} era, ${q.name}'s philosophy represented visually. Dark background, dramatic lighting, symbolic elements.`),
            `A powerful closing scene: a single figure looking at the horizon, contemplative mood, golden hour light, representing the question of human nature.`
        ];

        const videoSlides = [];
        // Slide 0: HOOK — Kışkırtıcı başlık
        videoSlides.push({ _slideType: 'HOOK', topText: hook, spokenText: hook, imagePrompts: [imagePromptBase[0]] });
        // Slide 1: LEAD — Kısa giriş
        videoSlides.push({ _slideType: 'LEAD', topText: '', spokenText: lead, imagePrompts: [imagePromptBase[1]] });
        // Slide 2-N: DÜŞÜNÜR SÖZLERİ
        quotes.forEach((q, i) => {
            videoSlides.push({ _slideType: 'QUOTE', topText: q.name, spokenText: `${q.name} şöyle demiş: ${q.quote} ${q.emphasis || ''}`, imagePrompts: [imagePromptBase[i + 2] || imagePromptBase[1]], _emphasis: q.emphasis || '', _quoteText: q.quote });
        });
        // Slide N+1: CTA — Etkileşim çağrısı
        const hashtagStr = hashtags.slice(0, 10).map(h => h.startsWith('#') ? h : '#' + h).join(' ');
        videoSlides.push({ _slideType: 'CTA', topText: '', spokenText: cta, imagePrompts: [imagePromptBase[imagePromptBase.length - 1]], _hashtags: hashtagStr });

        // Atatürk tespiti
        const ataturkKeywords = ['atatürk', 'mustafa kemal', 'samsun', 'kurtuluş', 'cumhuriyet', 'bağımsızlık', 'milli mücadele'];
        const fullText = (hook + ' ' + lead + ' ' + quotes.map(q => q.quote).join(' ')).toLowerCase();
        const isAtaturkRelated = ataturkKeywords.some(kw => fullText.includes(kw));

        return {
            isContentUnreadable: false,
            videoSlides,
            thumbnailText: hook.length > 100 ? hook.substring(0, 100) + '...' : hook,
            sonSoz: "",
            lastQuote: cta,
            thumbnailImagePrompt: imagePromptBase[0],
            tiktokTitle: hook.substring(0, 60),
            tiktokDescription: lead,
            tiktokHashtags: hashtags.slice(0, 10).map(h => h.startsWith('#') ? h : '#' + h),
            _suggestedMusic: isAtaturkRelated ? 'gd_14byzbYGcpQ3Lcn7cMpwLOAsZS9NCfKLR' : null,
            _isAtaturkRelated: isAtaturkRelated,
            _realImageUrls: [],
            mediaBlackout: { show: false, percentageCovered: 0, percentageIgnored: 0, mediaNames: [], explanation: "" },
            chartData: { show: false, type: "bar", title: "", note: "", items: [] },
            _isGuzelSoz: true,
            _emotion: 'notr',
            _sceneCount: videoSlides.length,
            _hook: hook,
            _lead: lead,
            _quotes: quotes,
            _cta: cta,
            _hashtags: hashtags,
            _keywords: keywords
        };
    }
}

class MediaSynthesisService {
    static generateProceduralFallback(prompt, imageStyle) {
        const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1024; const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(512, 512, 50, 512, 512, 600); grad.addColorStop(0, '#1e1b4b'); grad.addColorStop(0.5, '#0f172a'); grad.addColorStop(1, '#020617'); ctx.fillStyle = grad; ctx.fillRect(0, 0, 1024, 1024);
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)'; ctx.lineWidth = 1;
        for (let x = 0; x < 1024; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1024); ctx.stroke(); }
        for (let y = 0; y < 1024; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; ctx.font = "bold 24px 'Inter', Arial"; ctx.textAlign = 'center'; ctx.fillText("OTONOM", 512, 950);
        return canvas.toDataURL('image/jpeg', 0.85);
    }

    static generateQuoteFallback(quoteText, emotion) {
        const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1024; const ctx = canvas.getContext('2d');
        const colorMap = {
            'mutlu': { bg1: '#fbbf24', bg2: '#f59e0b', accent: '#fcd34d', glow: '#fef3c7' },
            'hüzünlü': { bg1: '#3b82f6', bg2: '#1d4ed8', accent: '#93c5fd', glow: '#dbeafe' },
            'romantik': { bg1: '#ec4899', bg2: '#be185d', accent: '#f9a8d4', glow: '#fce7f3' },
            'notr': { bg1: '#6366f1', bg2: '#4338ca', accent: '#a5b4fc', glow: '#e0e7ff' }
        };
        const colors = colorMap[emotion] || colorMap['notr'];
        const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
        grad.addColorStop(0, colors.bg1); grad.addColorStop(0.5, colors.bg2); grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 1024, 1024);
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 1024; const y = Math.random() * 1024; const r = 50 + Math.random() * 150;
            const circleGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
            circleGrad.addColorStop(0, colors.accent + '40'); circleGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = circleGrad; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
        const words = quoteText.split(/\s+/).filter(w => w.length > 3).slice(0, 5);
        ctx.fillStyle = colors.glow + '30'; ctx.font = "bold 80px Georgia, serif"; ctx.textAlign = 'center';
        words.forEach((word, i) => {
            const x = 150 + (i % 3) * 250; const y = 300 + Math.floor(i / 3) * 200;
            ctx.save(); ctx.translate(x, y); ctx.rotate((Math.random() - 0.5) * 0.3);
            ctx.fillText(word.substring(0, 8), 0, 0); ctx.restore();
        });
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.font = "bold 120px Georgia, serif"; ctx.textAlign = 'center';
        ctx.fillText('"', 150, 250); ctx.fillText('"', 900, 850);
        return canvas.toDataURL('image/jpeg', 0.9);
    }

    static async generateImage(prompt, imageStyle = 'cinematic', resolution = '4K', isGuzelSoz = false, emotion = 'notr', quoteText = '') {
        let resText = "8k resolution, highly detailed";
        if (resolution === '1K') resText = "1080p resolution, clear and sharp";
        if (resolution === '2K') resText = "4k resolution, high quality";
        const stylePrefixes = {
            'watercolor': `Abstract watercolor painting style, soft and artistic, ${resText}`,
            'sketch': `Pencil sketch drawing, black and white, ${resText}`,
            'oil_painting': `Classic oil painting style, ${resText}`,
            'minimalist': `Minimalist illustration, clean lines, ${resText}`,
            'cyberpunk': `Cyberpunk, futuristic, neon lights, ${resText}`,
            'retro': `Retro vintage style, 80s aesthetic, ${resText}`,
            '3d_render': `High quality 3D render, unreal engine 5 style, ${resText}`,
            'anime': `High quality anime style, Studio Ghibli inspired, ${resText}`
        };
        let stylePrefix = stylePrefixes[imageStyle] || `Cinematic, photorealistic, ${resText}`;
        const excludeStyles = ['watercolor', 'sketch', 'oil_painting', 'retro', 'anime'];
        if (!excludeStyles.includes(imageStyle)) stylePrefix += `, subtle AI neural network elements, neon accents`;

        const contextLabel = isGuzelSoz ? 'quote illustration' : 'news context';
        const fullPrompt = `${stylePrefix}, ${contextLabel}: ${prompt}. Safe, no text, no violence.`;
        addSystemLog(`Görsel aranıyor: "${prompt.substring(0, 40)}..."`, 'info');
        // 1. Wikimedia Commons'tan gerçek görsel çek (ücretsiz, telifsiz)
        try {
            const images = await fetchWikimediaImages(prompt, 3);
            if (images && images.length > 0) {
                addSystemLog(`Wikimedia'dan ${images.length} görsel bulundu.`, 'success');
                return images[0];
            }
        } catch (err) { addSystemLog('Wikimedia görsel araması başarısız: ' + err.message, 'warn'); }
        // 2. Gemini ücretsiz model ile görsel üret (key varsa)
        try {
            const key = getApiKey();
            if (key) {
                for (const model of GEMINI_FALLBACK_MODELS) {
                    try {
                        const r = await fetch(GEMINI_CHAT_URL(model) + `?key=${key}`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } })
                        });
                        if (r.ok) {
                            const d = await r.json();
                            const base64 = d.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
                            if (base64) { addSystemLog(`Gemini (${model}) ile görsel üretildi.`, 'success'); return `data:image/jpeg;base64,${base64}`; }
                        }
                    } catch (e) {}
                }
            }
        } catch (err) { addSystemLog('Gemini görsel üretimi başarısız: ' + err.message, 'warn'); }
        // 3. Procedural fallback
        if (isGuzelSoz && quoteText) {
            addSystemLog('Quote uyumlu fallback görsel üretiliyor...', 'warn');
            return this.generateQuoteFallback(quoteText, emotion);
        }
        return this.generateProceduralFallback(prompt, imageStyle);
    }

    static async generateAudio(text, voice) {
        if (!text || voice === 'none') return null;
        // Metni temizle — Türkçe karakterler korunur, sadece sorunlu işaretler kaldırılır
        let cleanText = text.replace(/[*_#"']/g, '').replace(/\.\.\./g, ', ').replace(/\n/g, ' ').replace(/[:;/\\|{}[\]<>^~`]/g, ', ').replace(/\s+/g, ' ').trim();
        if (cleanText.length < 2) return null;
        const estDuration = Math.max(2.0, (cleanText.split(/\s+/).length / 2.5));

        // 1. Gemini ücretsiz TTS (key varsa) — gerçek WAV ses döndürür
        const key = getApiKey();
        if (key) {
            try {
                const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${key}`;
                const gPayload = { contents: [{ parts: [{ text: cleanText }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice || 'Charon' } } } } };
                const gr = await fetch(gUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(gPayload) });
                if (gr.ok) {
                    const gd = await gr.json();
                    const b64 = gd.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                    if (b64) {
                        let sampleRate = 24000;
                        const bin = atob(b64); const pcm = new Uint8Array(bin.length);
                        for (let i = 0; i < bin.length; i++) pcm[i] = bin.charCodeAt(i);
                        const wav = new ArrayBuffer(44 + pcm.length); const v = new DataView(wav);
                        const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
                        ws(0, 'RIFF'); v.setUint32(4, 36 + pcm.length, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, pcm.length, true);
                        new Uint8Array(wav, 44).set(pcm);
                        addSystemLog(`Seslendirme Gemini TTS ile üretildi.`, 'success');
                        return { wavBuffer: wav, sampleRate };
                    }
                }
            } catch (e) { addSystemLog('Gemini TTS başarısız, Web Speech\'e düşülüyor: ' + e.message, 'warn'); }
        }

        // 2. Fallback: Web Speech API (tarayıcıda çalınır, WAV yok)
        addSystemLog(`Seslendirme Web Speech API ile yapılacak (${estDuration.toFixed(1)}sn tahmini): "${cleanText.substring(0, 40)}..."`, 'info');
        return {
            wavBuffer: null,
            sampleRate: 24000,
            speechText: cleanText,
            useWebSpeech: true,
            estDuration
        };
    }

    // Web Speech API ile metni seslendirip bitiş callback'i çağırır
    static speakWithWebSpeech(text, voice, onEnd) {
        return new Promise((resolve) => {
            try {
                if (typeof window === 'undefined' || !window.speechSynthesis) {
                    addSystemLog('Tarayıcı seslendirme desteklemiyor.', 'warn');
                    if (onEnd) onEnd();
                    return resolve(null);
                }
                const u = new SpeechSynthesisUtterance(text);
                u.lang = 'tr-TR';
                const voices = window.speechSynthesis.getVoices();
                const trVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('tr'));
                if (trVoice) u.voice = trVoice;
                u.rate = 1.0; u.pitch = 1.0;
                u.onend = () => { if (onEnd) onEnd(); resolve(true); };
                u.onerror = () => { if (onEnd) onEnd(); resolve(null); };
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(u);
            } catch (e) {
                addSystemLog('Web Speech hatası: ' + e.message, 'warn');
                if (onEnd) onEnd();
                resolve(null);
            }
        });
    }
}

class AmbientAudioService {
    static createNoiseBuffer(audioCtx, type = 'white') {
        const bufferSize = audioCtx.sampleRate * 5; const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate); const data = buffer.getChannelData(0); let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) { const white = Math.random() * 2 - 1; if (type === 'brown') { data[i] = (lastOut + (0.02 * white)) / 1.02; lastOut = data[i]; data[i] *= 3.5; } else { data[i] = white * 0.5; } }
        return buffer;
    }
    static getAmbientNode(audioCtx, type) {
        const noiseBuffer = this.createNoiseBuffer(audioCtx, type === 'fire' ? 'brown' : 'white');
        const noiseSource = audioCtx.createBufferSource(); noiseSource.buffer = noiseBuffer; noiseSource.loop = true;
        const filter = audioCtx.createBiquadFilter(); const gain = audioCtx.createGain();
        if (type === 'rain') { filter.type = 'lowpass'; filter.frequency.value = 800; gain.gain.value = 0.3; noiseSource.connect(filter).connect(gain); }
        else if (type === 'waves') { filter.type = 'lowpass'; filter.frequency.value = 400; const lfo = audioCtx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.1; const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 1.5; gain.gain.value = 0.3; lfo.connect(lfoGain).connect(gain.gain); lfo.start(); noiseSource.connect(filter).connect(gain); }
        else return null;
        noiseSource.start(0); return { source: noiseSource, gainNode: gain };
    }
}

// Türkçe büyük harf dönüşümü — ı→I, i→İ
const trUpper = (str) => str.replace(/ı/g, 'I').replace(/i/g, 'İ').toUpperCase();

const RenderWorkerService = {
    // Instagram Reels / TikTok güvenli alan sınırları (canvas %)
    SAFE_ZONE: { topUnsafe: 0.08, subtitleY: 0.72, bottomUnsafe: 0.78, rightUnsafeStart: 0.86 },
    wrapText: (ctx, text, maxWidth) => { if (!text) return []; const words = text.split(" "); const lines = []; let currentLine = words[0]; for (let i = 1; i < words.length; i++) { if (ctx.measureText(currentLine + " " + words[i]).width < maxWidth) currentLine += " " + words[i]; else { lines.push(currentLine); currentLine = words[i]; } } lines.push(currentLine); return lines; },
    // Kelime bazlı zamanlama — her kelime için start/end
    calculateWordTimings: (text, audioDuration) => {
        if (!text || !audioDuration) return [];
        const words = text.replace(/\n/g, ' ').split(/\s+/).filter(Boolean);
        if (words.length === 0) return [];
        const totalChars = words.reduce((sum, w) => sum + w.length, 0);
        const safeDur = Math.max(audioDuration, 0.1);
        const timePerChar = safeDur / Math.max(totalChars, 1);
        const timings = [];
        let currentTime = 0;
        for (const word of words) {
            const wordDur = word.length * timePerChar;
            timings.push({ word, start: currentTime, end: currentTime + wordDur });
            currentTime += wordDur;
        }
        return timings;
    },
    // Altyazı: kelime bazlı zamanlamadan 2'li gruplar oluştur
    calculateSubtitles: (text, exactAudioDur) => {
        const wordTimings = RenderWorkerService.calculateWordTimings(text, exactAudioDur);
        if (wordTimings.length === 0) return [];
        const subs = [];
        for (let i = 0; i < wordTimings.length; i += 2) {
            const w1 = wordTimings[i];
            const w2 = wordTimings[i + 1];
            subs.push({
                text: w2 ? (w1.word + ' ' + w2.word) : w1.word,
                startSec: w1.start,
                endSec: w2 ? w2.end : w1.end
            });
        }
        return subs;
    },
    // Altyazı: wordTimings array'inden doğrudan oluştur (scale edilmemiş gerçek ses zamanlaması)
    _subsFromWordTimings: (wordTimings) => {
        if (!wordTimings || wordTimings.length === 0) return [];
        const subs = [];
        for (let i = 0; i < wordTimings.length; i += 2) {
            const w1 = wordTimings[i];
            const w2 = wordTimings[i + 1];
            subs.push({
                text: w2 ? (w1.word + ' ' + w2.word) : w1.word,
                startSec: w1.start,
                endSec: w2 ? w2.end : w1.end
            });
        }
        return subs;
    },
    // Sessizlik tespiti ve kırpma
    trimSilence: (audioBuffer, threshold = 0.01) => {
        if (!audioBuffer || !audioBuffer.getChannelData) return audioBuffer;
        const data = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        // Baştaki sessizliği bul
        let firstSound = 0;
        for (let i = 0; i < data.length; i++) {
            if (Math.abs(data[i]) > threshold) { firstSound = i; break; }
        }
        // Sondaki sessizliği bul
        let lastSound = data.length - 1;
        for (let i = data.length - 1; i >= 0; i--) {
            if (Math.abs(data[i]) > threshold) { lastSound = i; break; }
        }
        // 50ms tolerans ekle (fade için)
        const toleranceSamples = Math.round(sampleRate * 0.05);
        firstSound = Math.max(0, firstSound - toleranceSamples);
        lastSound = Math.min(data.length - 1, lastSound + toleranceSamples);
        // Kırpılmış uzunluk — en az %50'sini koru
        const newLength = lastSound - firstSound + 1;
        if (newLength < data.length * 0.5 || newLength <= 0) return audioBuffer;
        const ctx = new OfflineAudioContext(audioBuffer.numberOfChannels, newLength, sampleRate);
        const newBuffer = ctx.createBuffer(audioBuffer.numberOfChannels, newLength, sampleRate);
        for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
            const src = audioBuffer.getChannelData(ch);
            const dst = newBuffer.getChannelData(ch);
            for (let i = 0; i < newLength; i++) dst[i] = src[firstSound + i];
        }
        return newBuffer;
    },
    drawImageContain: (ctx, img, w, h) => { const imgRatio = img.width / img.height; const canvasRatio = w / h; let drawW = w, drawH = h, offsetX = 0, offsetY = 0; if (imgRatio > canvasRatio) { drawH = w / imgRatio; offsetY = (h - drawH) / 2; } else { drawW = h * imgRatio; offsetX = (w - drawW) / 2; } ctx.fillStyle = "black"; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, offsetX, offsetY, drawW, drawH); },
    drawImageCover: (ctx, img, w, h) => { const imgRatio = img.width / img.height; const canvasRatio = w / h; let drawW = w, drawH = h, offsetX = 0, offsetY = 0; if (imgRatio > canvasRatio) { drawW = h * imgRatio; offsetX = (w - drawW) / 2; } else { drawH = w / imgRatio; offsetY = (h - drawH) / 2; } ctx.fillStyle = "black"; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, offsetX, offsetY, drawW, drawH); },
    drawThumbnail: (ctx, img, text, w, h, fontFamily, sourceName, config) => {
        // 1. Siyah arka plan + görsel
        ctx.fillStyle = "black"; ctx.fillRect(0, 0, w, h);
        if (img) RenderWorkerService.drawImageContain(ctx, img, w, h);

        // 2. Gradient overlay
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "rgba(0,0,0,0.92)");
        grad.addColorStop(0.12, "rgba(0,0,0,0.20)");
        grad.addColorStop(0.80, "rgba(0,0,0,0.20)");
        grad.addColorStop(1, "rgba(0,0,0,0.92)");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

        // 3. Tarih
        const now = new Date();
        const dateLocale = ({ tr:'tr-TR', en:'en-US', fr:'fr-FR', de:'de-DE', es:'es-ES', ar:'ar-SA', ru:'ru-RU' })[config?.language || 'tr'] || 'tr-TR';
        const dateStr = now.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
        const dayStr = now.toLocaleDateString(dateLocale, { weekday: 'long' });
        const dateLine = trUpper(dateStr + " " + dayStr);

        const cx = w / 2;

        // 4. ÜST SİYAH BAR — Anadolu Ajansı formatı
        const barH = Math.round(h * 0.125);
        let sourceFontSize = Math.round(h * 0.022) + 4; // 2 punto daha büyütüldü
        let dateFontSize = Math.round(h * 0.018) + 4;   // 2 punto daha büyütüldü
        const spacing = 3; // Kaynak adı ve tarih arası 3 punto boşluk
        // Taşma kontrolü — bar yüksekliğine sığdır
        const totalTextH = sourceFontSize + 14 + spacing + dateFontSize;
        if (totalTextH > barH * 0.9) {
            const scale = (barH * 0.9) / totalTextH;
            sourceFontSize = Math.floor(sourceFontSize * scale);
            dateFontSize = Math.floor(dateFontSize * scale);
        }

        // Siyah bar (tam genişlik)
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, w, barH);

        // Kırmızı kutu — sadece yazı kadar genişlik
        if (sourceName) {
            ctx.font = `900 ${sourceFontSize}px ${fontFamily}`;
            const textW = ctx.measureText(trUpper(sourceName)).width;
            const redBoxW = textW + 24; // Padding: sadece yazı kadar + minimal padding
            const redBoxH = sourceFontSize + 14;
            const redBoxX = cx - redBoxW / 2;
            const redBoxY = Math.round(barH * 0.38);
            const radius = redBoxH / 2;

            ctx.fillStyle = "#E30A17";
            ctx.beginPath();
            ctx.moveTo(redBoxX + radius, redBoxY);
            ctx.lineTo(redBoxX + redBoxW - radius, redBoxY);
            ctx.arc(redBoxX + redBoxW - radius, redBoxY + radius, radius, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(redBoxX + radius, redBoxY + redBoxH);
            ctx.arc(redBoxX + radius, redBoxY + radius, radius, Math.PI / 2, -Math.PI / 2);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "#FFFFFF";
            ctx.font = `900 ${sourceFontSize}px ${fontFamily}`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(trUpper(sourceName), cx, redBoxY + redBoxH / 2);
        }

        // Tarih — kırmızı kutunun altında, 3 punto boşluk
        const dateY = sourceName ? (Math.round(barH * 0.38) + sourceFontSize + 14 + spacing + dateFontSize / 2) : barH * 0.78;
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `900 ${dateFontSize}px ${fontFamily}`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(dateLine, cx, dateY);

        // 5. ANA BAŞLIK — görselin ortasında
        const titleAreaTop = barH + h * 0.02;
        const titleAreaBottom = h * RenderWorkerService.SAFE_ZONE.bottomUnsafe;
        const titleAreaH = titleAreaBottom - titleAreaTop;

        let thumbFontSize = w > 800 ? 110 : 80;
        ctx.font = `900 ${thumbFontSize}px ${fontFamily}`;
        let lines = RenderWorkerService.wrapText(ctx, trUpper(text || "ŞOK HABER!"), w * 0.88);
        let lh = thumbFontSize * 1.12;

        while (lines.length * lh > titleAreaH && thumbFontSize > 28) {
            thumbFontSize -= 4;
            ctx.font = `900 ${thumbFontSize}px ${fontFamily}`;
            lines = RenderWorkerService.wrapText(ctx, trUpper(text || "ŞOK HABER!"), w * 0.90);
            lh = thumbFontSize * 1.12;
        }

        if (lines.length * lh > titleAreaH) lh = titleAreaH / lines.length;

        const totalTitleH = lines.length * lh;
        const titleStartY = titleAreaTop + (titleAreaH - totalTitleH) / 2;

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,1)";
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 10;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";

        lines.forEach((l, i) => {
            const y = titleStartY + (i * lh) + (lh / 2);
            ctx.lineWidth = Math.max(4, thumbFontSize * 0.22);
            ctx.strokeStyle = "#000000";
            ctx.lineJoin = "round";
            ctx.strokeText(l, cx, y);
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(l, cx, y);
        });

        ctx.restore();
    },
    drawStar: (ctx, cx, cy, spikes, outerRadius, innerRadius, color = "#FFFFFF") => { let rot = (Math.PI / 2) * 3; let step = Math.PI / spikes; ctx.beginPath(); ctx.moveTo(cx, cy - outerRadius); for (let i = 0; i < spikes; i++) { let x = cx + Math.cos(rot) * outerRadius; let y = cy + Math.sin(rot) * outerRadius; ctx.lineTo(x, y); rot += step; x = cx + Math.cos(rot) * innerRadius; y = cy + Math.sin(rot) * innerRadius; ctx.lineTo(x, y); rot += step; } ctx.lineTo(cx, cy - outerRadius); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); },
    renderGuzelSoz: async (jobData, canvasElement, w, h, cx, fontFamily) => {
        // Felsefi video render: HOOK → LEAD → QUOTE(s) → CTA
        addSystemLog('Felsefi video render başlıyor...', 'info');
        const slides = jobData.script.videoSlides || [];
        const FPS = 30;

        canvasElement.width = w; canvasElement.height = h;
        const ctx = canvasElement.getContext('2d');
        addSystemLog(`Canvas: ${w}x${h}, ${slides.length} sahne`, 'info');

        // Ses setup
        const audioCtx = _getAudioCtx();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
        const audioDest = audioCtx ? audioCtx.createMediaStreamDestination() : null;
        const silentOsc = audioCtx.createOscillator(); const silentGain = audioCtx.createGain(); silentGain.gain.value = 0.001; silentOsc.connect(silentGain); silentGain.connect(audioDest); silentOsc.start();

        // Her slaytın ses süresini hesapla
        const getAudioDur = (audioData, text) => {
            if (audioData?.wavBuffer) {
                let byteLength = 0;
                if (audioData.wavBuffer instanceof ArrayBuffer) byteLength = audioData.wavBuffer.byteLength;
                else if (audioData.wavBuffer.buffer instanceof ArrayBuffer) byteLength = audioData.wavBuffer.buffer.byteLength;
                if (byteLength > 44) return (byteLength - 44) / (24000 * 2);
            }
            const wc = (text || "").trim().split(/\s+/).filter(Boolean).length;
            return Math.max(2.0, wc / 2.2);
        };

        // Her slayt için süre hesapla (minimum 3 saniye)
        const slideDurations = slides.map((slide, i) => {
            const audioData = jobData.assets.audio[i];
            const audioDur = getAudioDur(audioData, slide.spokenText);
            const slideType = slide._slideType || 'QUOTE';
            // HOOK: 3-4 saniye, LEAD: 4-6 saniye, QUOTE: ses süresi + buffer, CTA: 5-7 saniye
            if (slideType === 'HOOK') return Math.max(3.5, Math.min(audioDur + 1.0, 5.0));
            if (slideType === 'LEAD') return Math.max(4.0, Math.min(audioDur + 1.5, 8.0));
            if (slideType === 'CTA') return Math.max(5.0, Math.min(audioDur + 2.0, 10.0));
            return Math.max(4.0, audioDur + 1.5); // QUOTE
        });

        // Intro (1 siyah kare) + outro (2 saniye siyah) süreleri
        const introDur = 1.0;
        const outroDur = 2.0;
        const totalDuration = slideDurations.reduce((a, b) => a + b, 0) + introDur + outroDur;
        const totalFrames = Math.round(totalDuration * FPS);
        addSystemLog(`Toplam süre: ${totalDuration.toFixed(1)}sn (${slides.length} sahne + intro/outro)`, 'info');

        // Slayt kare aralıklarını hesapla
        let frameOffset = Math.round(introDur * FPS);
        const slideFrameRanges = slideDurations.map((dur) => {
            const start = frameOffset;
            const end = frameOffset + Math.round(dur * FPS);
            frameOffset = end;
            return { start, end };
        });

        // Ses çalma — her slayt için
        const playSlideAudio = async (index) => {
            const audioData = jobData.assets.audio[index];
            if (!audioData?.wavBuffer) return;
            try {
                let bufferCopy;
                if (audioData.wavBuffer instanceof ArrayBuffer) bufferCopy = audioData.wavBuffer.slice(0);
                else if (audioData.wavBuffer.buffer instanceof ArrayBuffer) bufferCopy = audioData.wavBuffer.buffer.slice(0);
                else bufferCopy = audioData.wavBuffer;
                const audioBuf = await audioCtx.decodeAudioData(bufferCopy);
                const source = audioCtx.createBufferSource(); source.buffer = audioBuf;
                source.playbackRate.value = 1.0;
                const gain = audioCtx.createGain(); gain.gain.value = 0.85;
                source.connect(gain); gain.connect(audioDest); source.start(0);
            } catch (e) { addSystemLog(`Slayt ${index} ses hatası: ${e.message}`, 'warn'); }
        };

        // Müzik setup
        let bgmSource, masterGain;
        let ambientSound = jobData.preferences.ambientSound || 'none';
        if (ambientSound === 'none') {
            try {
                const allMusic = await AssetManagerService.getAllMusicFromLib();
                if (allMusic.length > 0) { ambientSound = allMusic[0].id; addSystemLog(`Müzik otomatik: ${allMusic[0].name}`, 'info'); }
            } catch (e) {}
        }
        if (ambientSound !== 'none') {
            if (['rain', 'wind', 'waves', 'fire'].includes(ambientSound)) {
                try {
                    const ambientObj = AmbientAudioService.getAmbientNode(audioCtx, ambientSound);
                    if (ambientObj) { bgmSource = ambientObj.source; masterGain = audioCtx.createGain(); masterGain.gain.value = 0.25; ambientObj.gainNode.connect(masterGain); masterGain.connect(audioDest); }
                } catch (e) {}
            } else {
                try {
                    const track = await AssetManagerService.getMusicFromLib(ambientSound);
                    if (track?.data) {
                        const raw = track.data.includes(',') ? track.data.split(',')[1] : track.data;
                        const ab = new ArrayBuffer(atob(raw).length); const ia = new Uint8Array(ab);
                        for (let i = 0; i < ab.byteLength; i++) ia[i] = atob(raw).charCodeAt(i);
                        const buf = await audioCtx.decodeAudioData(await (await fetch(URL.createObjectURL(new Blob([ab], { type: 'audio/mpeg' })))).arrayBuffer());
                        if (!bgmSource) { bgmSource = audioCtx.createBufferSource(); bgmSource.buffer = buf; bgmSource.loop = true; }
                        masterGain = audioCtx.createGain(); masterGain.gain.value = 0.25;
                        bgmSource.connect(masterGain); masterGain.connect(audioDest); bgmSource.start(0);
                        addSystemLog('Müzik yüklendi: ' + track.name, 'success');
                    }
                } catch (e) { addSystemLog('Müzik hatası: ' + e.message, 'warn'); }
            }
        }

        // MediaRecorder setup
        const stream = canvasElement.captureStream(FPS);
        const videoTrack = stream.getVideoTracks()[0];
        if (audioDest) audioDest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
        let mimeType = 'video/webm; codecs=vp8,opus';
        if (jobData.config.videoFormat === 'mp4') {
            if (MediaRecorder.isTypeSupported('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')) mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
            else if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1200000, audioBitsPerSecond: 128000 });
        const chunks = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.start(100);

        // Görselleri yükle
        const images = jobData.assets.images.filter(img => img);
        const loadedImages = [];
        for (const imgData of images) {
            const img = await NetworkUtils.loadImage(imgData);
            if (img) loadedImages.push(img);
        }
        if (loadedImages.length === 0) loadedImages.push(null);
        addSystemLog(`${loadedImages.length} görsel yüklendi.`, 'info');

        // Timer Worker
        const timerWorkerCode = `let interval; self.onmessage = function(e) { if (e.data === 'start') interval = setInterval(() => self.postMessage('tick'), 25); if (e.data === 'stop') clearInterval(interval); };`;
        const timerWorker = new Worker(URL.createObjectURL(new Blob([timerWorkerCode], { type: 'application/javascript' })));
        timerWorker.postMessage('start');
        let frameResolvers = [];
        timerWorker.onmessage = () => { const r = frameResolvers; frameResolvers = []; r.forEach(fn => fn()); };
        const nextFrame = () => new Promise(resolve => frameResolvers.push(resolve));

        sysEventBus.emit('PROGRESS', { step: 'RENDER', percent: 30, text: 'Felsefi video render ediliyor...' });

        const kenBurnsDir = Math.floor(Math.random() * 4);
        let lastSlideIndex = -1;
        // Her slayt için rastgele Ken Burns yönü
        const slideKenBurns = slides.map(() => Math.floor(Math.random() * 4));

        // Metin çizim yardımcı fonksiyonu
        const drawOutlinedText = (text, x, y, fontSize, color = "#FFFFFF", outlineColor = "#000000", outlineWidth = 5) => {
            ctx.font = `bold ${fontSize}px ${fontFamily}`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.lineWidth = outlineWidth; ctx.strokeStyle = outlineColor; ctx.lineJoin = "round";
            ctx.strokeText(text, x, y);
            ctx.fillStyle = color;
            ctx.fillText(text, x, y);
        };

        // Wrap text yardımcı fonksiyonu
        const wrapAndDraw = (text, x, y, maxWidth, fontSize, color = "#FFFFFF", lineHeight = null) => {
            const lh = lineHeight || fontSize * 1.5;
            ctx.font = `bold ${fontSize}px ${fontFamily}`;
            const lines = RenderWorkerService.wrapText(ctx, text, maxWidth);
            const totalH = lines.length * lh;
            const startY = y - totalH / 2;
            lines.forEach((line, i) => {
                drawOutlinedText(line, x, startY + (i * lh) + lh / 2, fontSize, color);
            });
            return lines.length;
        };

        for (let frame = 0; frame < totalFrames; frame++) {
            const elapsed = frame / FPS;
            ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, w, h);

            // Intro/outro: siyah kare
            const introFrames = Math.round(introDur * FPS);
            const isIntro = frame < introFrames;
            const isOutro = frame >= totalFrames - Math.round(outroDur * FPS);

            if (!isIntro && !isOutro) {
                // Geçerli slaytı bul
                let currentSlideIdx = -1;
                for (let i = 0; i < slideFrameRanges.length; i++) {
                    if (frame >= slideFrameRanges[i].start && frame < slideFrameRanges[i].end) {
                        currentSlideIdx = i; break;
                    }
                }

                if (currentSlideIdx >= 0 && currentSlideIdx < slides.length) {
                    const slide = slides[currentSlideIdx];
                    const slideType = slide._slideType || 'QUOTE';
                    const imgIdx = Math.min(currentSlideIdx, loadedImages.length - 1);
                    const range = slideFrameRanges[currentSlideIdx];
                    const slideElapsed = (frame - range.start) / FPS;
                    const slideDuration = slideDurations[currentSlideIdx];
                    const slideProgress = (frame - range.start) / (range.end - range.start);

                    // Ses tetikleme — yeni slayta geçişte
                    if (currentSlideIdx !== lastSlideIndex) {
                        lastSlideIndex = currentSlideIdx;
                        playSlideAudio(currentSlideIdx);
                    }

                    // Ken Burns arka plan görseli
                    if (loadedImages[imgIdx]) {
                        const kbDir = slideKenBurns[currentSlideIdx];
                        const t = slideProgress;
                        const zoom = 1.0 + 0.1 * t;
                        const panX = [-0.04, 0.04, 0, 0][kbDir] * w * t;
                        const panY = [0, 0, -0.04, 0.04][kbDir] * h * t;
                        ctx.save();
                        ctx.translate(w / 2 + panX, h / 2 + panY);
                        ctx.scale(zoom, zoom);
                        const img = loadedImages[imgIdx];
                        const imgRatio = img.width / img.height;
                        const canRatio = w / h;
                        let sx, sy, sw, sh;
                        if (imgRatio > canRatio) { sh = img.height; sw = sh * canRatio; sx = (img.width - sw) / 2; sy = 0; }
                        else { sw = img.width; sh = sw / canRatio; sx = 0; sy = (img.height - sh) / 2; }
                        ctx.drawImage(img, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
                        ctx.restore();
                    }

                    // Overlay gradient
                    const ov = ctx.createLinearGradient(0, 0, 0, h);
                    ov.addColorStop(0, "rgba(0,0,0,0.6)"); ov.addColorStop(0.3, "rgba(0,0,0,0.2)");
                    ov.addColorStop(0.7, "rgba(0,0,0,0.2)"); ov.addColorStop(1, "rgba(0,0,0,0.7)");
                    ctx.fillStyle = ov; ctx.fillRect(0, 0, w, h);

                    // Fade in/out animasyonu
                    const fadeIn = Math.min(1, slideElapsed / 0.5);
                    const fadeOut = slideProgress > 0.85 ? 1 - ((slideProgress - 0.85) / 0.15) : 1;
                    ctx.globalAlpha = Math.max(0, Math.min(1, fadeIn * fadeOut));

                    // Slayt tipine göre render
                    if (slideType === 'HOOK') {
                        // VURUCU BAŞLIK — büyük, merkez, dramatik
                        const hookText = slide.spokenText || slide.topText;
                        const fontSize = w > 800 ? 52 : 40;
                        wrapAndDraw(hookText, cx, h * 0.45, w * 0.85, fontSize, "#FFD700");
                        // Altın çizgi dekorasyonu
                        ctx.strokeStyle = "rgba(255, 215, 0, 0.4)"; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.moveTo(w * 0.15, h * 0.62); ctx.lineTo(w * 0.85, h * 0.62); ctx.stroke();
                    }
                    else if (slideType === 'LEAD') {
                        // GİRİŞ — orta boy, beyaz, merkez
                        const leadText = slide.spokenText;
                        const fontSize = w > 800 ? 36 : 28;
                        wrapAndDraw(leadText, cx, h * 0.45, w * 0.82, fontSize, "#E2E8F0");
                    }
                    else if (slideType === 'QUOTE') {
                        // DÜŞÜNÜR SÖZÜ — isim üstte, söz ortada, vurgu altta
                        const nameText = slide.topText;
                        const quoteText = slide._quoteText || slide.spokenText;
                        const emphasis = slide._emphasis || "";

                        // Düşünür adı — altın, üst kısım
                        const nameFontSize = w > 800 ? 38 : 30;
                        drawOutlinedText(nameText, cx, h * 0.18, nameFontSize, "#FFD700", "#000000", 4);

                        // Alt çizgi
                        ctx.strokeStyle = "rgba(255, 215, 0, 0.3)"; ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(w * 0.25, h * 0.25); ctx.lineTo(w * 0.75, h * 0.25); ctx.stroke();

                        // Büyük tırnak işareti
                        ctx.fillStyle = "rgba(255, 215, 0, 0.15)"; ctx.font = `bold ${w > 800 ? 120 : 90}px Georgia, serif`;
                        ctx.textAlign = "left"; ctx.fillText('"', w * 0.08, h * 0.45);

                        // Söz metni — beyaz, merkez
                        const quoteFontSize = w > 800 ? 34 : 26;
                        wrapAndDraw(quoteText, cx, h * 0.47, w * 0.78, quoteFontSize, "#FFFFFF");

                        // Vurgu — küçük, gri, alt kısım
                        if (emphasis) {
                            const emphFontSize = w > 800 ? 22 : 18;
                            ctx.globalAlpha = Math.max(0, Math.min(0.8, fadeIn * fadeOut));
                            wrapAndDraw(emphasis, cx, h * 0.73, w * 0.75, emphFontSize, "#94A3B8");
                        }
                    }
                    else if (slideType === 'CTA') {
                        // KAPANIŞ — soru + hashtag'ler
                        const ctaText = slide.spokenText;
                        const hashtags = slide._hashtags || "";

                        // Soru
                        const ctaFontSize = w > 800 ? 34 : 26;
                        wrapAndDraw(ctaText, cx, h * 0.35, w * 0.82, ctaFontSize, "#E2E8F0");

                        // Hashtag'ler — alt kısım, küçük, mavi
                        if (hashtags) {
                            const hashFontSize = w > 800 ? 20 : 16;
                            ctx.globalAlpha = Math.max(0, Math.min(0.7, fadeIn * fadeOut));
                            wrapAndDraw(hashtags, cx, h * 0.70, w * 0.9, hashFontSize, "#60A5FA");
                        }

                        // "Yorumlarınızı bekliyorum" alt çizgisi
                        const subFontSize = w > 800 ? 24 : 20;
                        ctx.globalAlpha = Math.max(0, Math.min(0.9, fadeIn * fadeOut));
                        drawOutlinedText("💬 Görüşlerinizi yorumlarda paylaşın", cx, h * 0.76, subFontSize, "#A78BFA");
                    }

                    ctx.globalAlpha = 1;
                }
            }

            if (videoTrack && videoTrack.requestFrame) videoTrack.requestFrame();
            if (frame % 30 === 0) {
                const pct = Math.min(90, 30 + ((frame / totalFrames) * 60));
                sysEventBus.emit('PROGRESS', { step: 'RENDER', percent: pct, text: `${elapsed.toFixed(1)}sn / ${totalDuration.toFixed(1)}sn` });
            }
            await nextFrame();
        }

        // Temizlik
        if (bgmSource) try { bgmSource.stop(); } catch(e){}
        if (masterGain) masterGain.disconnect();
        silentOsc.stop(); silentOsc.disconnect();
        timerWorker.postMessage('stop'); timerWorker.terminate();

        addSystemLog('Recorder durduruluyor...', 'info');
        const videoPromise = new Promise((resolve, reject) => {
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                addSystemLog(`Video hazır: ${(blob.size / 1024).toFixed(0)}KB, ${totalDuration.toFixed(1)}sn`, blob.size > 0 ? 'success' : 'error');
                if (blob.size === 0) return reject(new Error("Video oluşturulamadı."));
                resolve(URL.createObjectURL(blob));
            };
        });
        if (recorder.state !== 'inactive') {
            try { recorder.requestData(); } catch(e){}
            await new Promise(r => setTimeout(r, 200));
            recorder.stop();
        }
        stream.getTracks().forEach(t => t.stop());
        return await videoPromise;
    },
    executeRender: async (jobData, canvasElement, preferences) => {
        // Ekonomi verisi doğrulama
                    // Türkçe karakter düzeltmesi — her zaman uygula
                    if (jobData.script) {
                        if (jobData.script.thumbnailText) jobData.script.thumbnailText = LogicEngineService.validateTurkishText(jobData.script.thumbnailText);
                        if (jobData.script.sonSoz) jobData.script.sonSoz = LogicEngineService.validateTurkishText(jobData.script.sonSoz);
                        if (jobData.script.lastQuote) jobData.script.lastQuote = LogicEngineService.validateTurkishText(jobData.script.lastQuote);
                        if (jobData.script.videoSlides) {
                            jobData.script.videoSlides.forEach(function(slide) {
                                if (slide.spokenText) slide.spokenText = LogicEngineService.validateTurkishText(slide.spokenText);
                                if (slide.topText) slide.topText = LogicEngineService.validateTurkishText(slide.topText);
                            });
                        }
                    }
                    
                    var econErrors = LogicEngineService.validateEconomyData(jobData.script);
                    if (econErrors.length > 0) {
                        addSystemLog('Ekonomi uyarilari: ' + econErrors.join(', '), 'warn');
                    }
                    
                    addSystemLog('Video render başlatılıyor...', 'info');
        const aspectRatio = jobData.config.aspectRatio || '9:16';
        const w = aspectRatio === '16:9' ? 1280 : aspectRatio === '1:1' ? 1080 : 720;
        const h = aspectRatio === '16:9' ? 720 : aspectRatio === '1:1' ? 1080 : 1280;
        const cx = w / 2;
        canvasElement.width = w; canvasElement.height = h;
        const ctx = canvasElement.getContext('2d');
        ctx.fillStyle = "#0B0F19"; ctx.fillRect(0, 0, w, h);

        if (jobData.config.outputType === 'image') {
            sysEventBus.emit('PROGRESS', { step: 'RENDER', percent: 90, text: 'Görsel Paketleniyor...' });
            const promptImageToUse = jobData.assets.images[0] || jobData.assets.thumbnail;
            if (promptImageToUse) { const sImg = await NetworkUtils.loadImage(promptImageToUse); if (sImg) RenderWorkerService.drawImageContain(ctx, sImg, w, h); }
            return new Promise((resolve) => { canvasElement.toBlob((blob) => resolve(URL.createObjectURL(blob)), 'image/png'); });
        }

        if (jobData.script._isGuzelSoz) {
            let fontFamily = "'Inter', 'Arial Black', Arial, sans-serif";
            if (jobData.config.fontStyle === 'classic') fontFamily = "Georgia, 'Times New Roman', serif";
            if (jobData.config.fontStyle === 'typewriter') fontFamily = "'Courier New', Courier, monospace";
            return RenderWorkerService.renderGuzelSoz(jobData, canvasElement, w, h, cx, fontFamily);
        }

        const targetDurStr = jobData.config.duration || '30'; const isUnlimited = targetDurStr === 'unlimited';
        // Birden fazla blok varsa süre sınırı yok — doğal okuma hızında bitir
        const hasMultipleBlocks = (jobData.script.imageBlocks || []).length > 1;
        const useForceExact = !isUnlimited && !hasMultipleBlocks;
        const bounds = getDurationBounds(targetDurStr); const limitSec = useForceExact ? bounds.max : 9999;
        let globalRenderedSec = 0;
        const getAudioDur = (audioData, fallbackText) => {
            if (audioData?.useWebSpeech && audioData?.estDuration) return audioData.estDuration;
            if (audioData?.wavBuffer) { let byteLength = 0; if (audioData.wavBuffer instanceof ArrayBuffer) byteLength = audioData.wavBuffer.byteLength; else if (audioData.wavBuffer.buffer instanceof ArrayBuffer) byteLength = audioData.wavBuffer.buffer.byteLength; else if (audioData.wavBuffer.byteLength) byteLength = audioData.wavBuffer.byteLength; if (byteLength > 44) { const sampleRate = audioData.sampleRate || 24000; return (byteLength - 44) / (sampleRate * 2); } }
            const wordsCount = (fallbackText || "").trim().split(/\s+/).filter(Boolean).length; if (wordsCount === 0) return 0.5; return Math.max(1.0, wordsCount / getWPS(jobData.config.language));
        };

        let rawKapakDur = Math.min(jobData.assets.thumbnailAudio ? (getAudioDur(jobData.assets.thumbnailAudio, jobData.script.thumbnailText) + 0.5) : 1.5, 5.0); // Maksimum 5 saniye
        let rawSonSozDur = jobData.script.sonSoz ? (getAudioDur(jobData.assets.sonSozAudio, jobData.script.sonSoz) + 0.05) : 0;
        // Yorum süresini son söz süresine ekle — yorum bitmeden kapanışa geçmesin
        if (jobData.config.yorum && jobData.config.yorum.trim().length > 0 && jobData.assets.yorumAudio) {
            const yorumWords = jobData.config.yorum.trim().split(/\s+/).filter(Boolean).length;
            const yorumExtra = Math.max(1.0, yorumWords / getWPS(jobData.config.language || 'tr')) + 0.3;
            rawSonSozDur += yorumExtra;
        }
        let rawOutroDur = Math.max(7.0, getAudioDur(jobData.assets.outroAudio, jobData.script.lastQuote) + 0.5); // Min 7sn — animasyonlar için
        let rawSlideSecs = jobData.script.videoSlides.map((s, i) => getAudioDur(jobData.assets.audio[i], s.spokenText) + 0.02);
        let rawCushion = 0.03;
        let totalNaturalSec = rawKapakDur + rawSonSozDur + rawOutroDur + rawCushion + rawSlideSecs.reduce((a, b) => a + b, 0);
        let scaleFactor = 1.0;
        if (hasMultipleBlocks) { addSystemLog(`Çoklu blok: Süre sınırı yok. Doğal okuma hızı (${totalNaturalSec.toFixed(1)}sn).`, 'info'); }
        else if (useForceExact) { if (totalNaturalSec > bounds.max) { scaleFactor = bounds.max / totalNaturalSec; addSystemLog(`Süre limitine sığdırılıyor (${scaleFactor.toFixed(2)}x)...`, "warn"); } else if (totalNaturalSec < bounds.min) { scaleFactor = bounds.min / totalNaturalSec; addSystemLog(`Minimum süre yakalanıyor (${scaleFactor.toFixed(2)}x)...`, "warn"); } }

        const timerWorkerCode = `let interval; self.onmessage = function(e) { if (e.data === 'start') interval = setInterval(() => self.postMessage('tick'), 25); if (e.data === 'stop') clearInterval(interval); };`;
        const timerWorkerBlob = new Blob([timerWorkerCode], { type: 'application/javascript' });
        const timerWorker = new Worker(URL.createObjectURL(timerWorkerBlob)); timerWorker.postMessage('start');
        let frameResolvers = [];
        timerWorker.onmessage = () => { const resolvers = frameResolvers; frameResolvers = []; resolvers.forEach(r => r()); };
        const nextFrame = () => new Promise(resolve => { frameResolvers.push(resolve); });

        const audioCtx = _getAudioCtx(); if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
        const audioDest = audioCtx ? audioCtx.createMediaStreamDestination() : null;
        const silentOsc = audioCtx.createOscillator(); const silentGain = audioCtx.createGain(); silentGain.gain.value = 0.001; silentOsc.connect(silentGain); silentGain.connect(audioDest); silentOsc.start();
        const keepAliveOsc = audioCtx.createOscillator(); const keepAliveGain = audioCtx.createGain(); keepAliveGain.gain.value = 0.00001; keepAliveOsc.connect(keepAliveGain); keepAliveGain.connect(audioCtx.destination); keepAliveGain.connect(audioDest); keepAliveOsc.start();

        let fontFamily = "'Inter', 'Arial Black', Arial, sans-serif";
        if (jobData.config.fontStyle === 'classic') fontFamily = "Georgia, 'Times New Roman', serif";
        if (jobData.config.fontStyle === 'typewriter') fontFamily = "'Courier New', Courier, monospace";

        const FPS = 30; const stream = canvasElement.captureStream(FPS); const videoTrack = stream.getVideoTracks()[0];
        const audioTracks = audioDest ? audioDest.stream.getAudioTracks() : [];
        const combinedStream = new MediaStream([...stream.getVideoTracks(), ...audioTracks]);
        let mimeType = 'video/webm; codecs="vp8, opus"';
        if (jobData.config.videoFormat === 'mp4') { if (MediaRecorder.isTypeSupported('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')) mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'; else if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4'; }
        if (!MediaRecorder.isTypeSupported(mimeType)) { mimeType = 'video/webm;codecs=vp8,opus'; if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm'; }

        const playAudio = async (audioData, requestedDuration = null, fallbackText = "") => {
            if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume().catch(() => {});
            let baseExactDur = getAudioDur(audioData, fallbackText);
            let audioEndPromise = null;
            let wordTimings = [];
            if (audioData?.useWebSpeech && audioData?.speechText) {
                // Web Speech API ile seslendirme (NVIDIA TTS yok)
                addSystemLog('Web Speech ile seslendiriliyor: ' + audioData.speechText.substring(0, 30) + '...', 'info');
                audioEndPromise = MediaSynthesisService.speakWithWebSpeech(audioData.speechText, jobData.preferences?.narratorVoice);
                baseExactDur = audioData.estDuration || baseExactDur;
            } else if (audioData?.wavBuffer && audioCtx) {
                try {
                    let bufferCopy; if (audioData.wavBuffer instanceof ArrayBuffer) bufferCopy = audioData.wavBuffer.slice(0); else if (audioData.wavBuffer.buffer instanceof ArrayBuffer) bufferCopy = audioData.wavBuffer.buffer.slice(0); else if (typeof audioData.wavBuffer === 'object') { const uint8 = new Uint8Array(Object.values(audioData.wavBuffer)); bufferCopy = uint8.buffer.slice(0); } else bufferCopy = audioData.wavBuffer;
                    let audioBuf = await audioCtx.decodeAudioData(bufferCopy);
                    // Sessizliği kırp — baştaki ve sondaki
                    audioBuf = RenderWorkerService.trimSilence(audioBuf);
                    const source = audioCtx.createBufferSource(); source.buffer = audioBuf;
                    // scaleFactor'ı ses hızına uygula — video süresini değil
                    source.playbackRate.value = scaleFactor;
                    const gain = audioCtx.createGain(); gain.gain.value = 0.8; // Narrator %80
                    source.connect(gain); gain.connect(audioDest); source.start(0);
                    baseExactDur = Math.min(audioBuf.duration, 180.0);
                    audioEndPromise = new Promise(resolve => { source.onended = resolve; });
                } catch (e) { console.warn("Ses decode hatası:", e); }
            }
            // Video süresi = ses süresi / scaleFactor
            const scaledAudioDur = baseExactDur / scaleFactor;
            // Kelime bazlı zamanlama — scale edilmiş süreye göre (altyazı senkronu için)
            wordTimings = RenderWorkerService.calculateWordTimings(fallbackText, scaledAudioDur);
            let totalDur = requestedDuration !== null ? requestedDuration : (scaledAudioDur + 0.02);
            return { exactDur: scaledAudioDur, totalDur, audioEndPromise, wordTimings };
        };

        const renderSonSozScene = async (text, audioData, duration, isSingleMedia = false) => {
            let startT = performance.now(); const safeText = text || "";
            const lang = jobData.config.language || 'tr';
            const hasYorum = jobData.config.yorum && jobData.config.yorum.trim().length > 0;
            // Yorum varsa: AI son söz yok, sadece yorum sesi ve metni
            // Yorum yoksa: normal son söz sesi ve metni
            const effectiveText = hasYorum ? jobData.config.yorum : safeText;
            const effectiveAudio = hasYorum ? jobData.assets.yorumAudio : audioData;
            const sonSozResult = await playAudio(effectiveAudio, hasYorum ? null : duration, effectiveText);
            const sonSozAudioEnd = sonSozResult.audioEndPromise;
            const sonSozFrames = Math.max(1, Math.round(sonSozResult.totalDur * FPS));
            const totalFrames = sonSozFrames;
            let yorumAudioEnd = hasYorum ? sonSozAudioEnd : null;
            // Son söz sahnesi öncesi 1 boş kare — sahneler arası net geçiş
            ctx.fillStyle = "black"; ctx.fillRect(0, 0, w, h);
            if (videoTrack && videoTrack.requestFrame) videoTrack.requestFrame();
            await nextFrame();
            for (let frame = 0; frame < totalFrames; frame++) {
                if (useForceExact && globalRenderedSec >= limitSec) break;
                ctx.fillStyle = "#030712"; ctx.fillRect(0, 0, w, h / 2);
                // Başlık sadece çoklu medyada gösterilir — yorumdan bağımsız
                if (!isSingleMedia) {
                    let headerText = "SON SÖZ"; if (lang === 'de') headerText = "SCHLUSSWORT"; else if (lang === 'en') headerText = "FINAL WORDS"; else if (lang === 'fr') headerText = "MOT DE LA FIN"; else if (lang === 'es') headerText = "ÚLTIMAS PALABRAS"; else if (lang === 'ar') headerText = "الكلمة الأخيرة"; else if (lang === 'ru') headerText = "ПОСЛЕСЛОВİЕ";
                    ctx.fillStyle = "#E11D48"; ctx.font = `900 ${w > 800 ? 54 : 44}px ${fontFamily}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(trUpper(headerText), cx, h * 0.08);
                }
                if (hasYorum) {
                    // Yorum varsa: sadece yorum metnini göster (AI son söz yok)
                    const yorumFontSize = w > 800 ? 48 : 34;
                    ctx.font = `900 ${yorumFontSize}px ${fontFamily}`;
                    const yorumLines = RenderWorkerService.wrapText(ctx, jobData.config.yorum, w * 0.85);
                    const yorumLh = yorumFontSize * 1.35;
                    const yorumTotalH = yorumLines.length * yorumLh + 35;
                    const yorumStartY = h / 2 - yorumTotalH - 5;
                    ctx.fillStyle = "#2563EB"; ctx.font = `900 ${w > 800 ? 36 : 26}px ${fontFamily}`; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText("YORUM", cx, yorumStartY);
                    ctx.font = `900 ${yorumFontSize}px ${fontFamily}`; ctx.fillStyle = "white";
                    yorumLines.forEach((line, idx) => { ctx.fillText(line, cx, yorumStartY + 35 + (idx * yorumLh)); });
                } else {
                    // Yorum yoksa normal son söz metnini göster
                    let bodyFontSize = w > 800 ? 42 : 30; ctx.font = `900 ${bodyFontSize}px ${fontFamily}`; let lines = RenderWorkerService.wrapText(ctx, text, w * 0.85);
                    const maxAllowedY = h / 2 - 35;
                    const lh = bodyFontSize * 1.35; while ((h * 0.16 + lines.length * lh) > maxAllowedY && bodyFontSize > 16) { bodyFontSize -= 2; ctx.font = `900 ${bodyFontSize}px ${fontFamily}`; lines = RenderWorkerService.wrapText(ctx, text, w * 0.85); }
                    ctx.fillStyle = "#F3F4F6"; ctx.textAlign = "center"; ctx.textBaseline = "top"; const startY = h * 0.16; lines.forEach((line, idx) => { ctx.fillText(line, cx, startY + (idx * bodyFontSize * 1.35)); });
                }
                const fX = 0, fY = h / 2, fW = w, fH = h / 2; ctx.save();
                switch (lang.toLowerCase()) {
                    case 'tr': { ctx.fillStyle = "#E30A17"; ctx.fillRect(fX, fY, fW, fH); const centerX = fX + fW / 2; const centerY = fY + fH / 2; const rOuter = fH * 0.28; const rInner = fH * 0.22; const shiftX = fH * 0.08; ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(centerX - shiftX / 2, centerY, rOuter, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#E30A17"; ctx.beginPath(); ctx.arc(centerX - shiftX / 2 + shiftX, centerY, rInner, 0, Math.PI * 2); ctx.fill(); RenderWorkerService.drawStar(ctx, centerX + fH * 0.16, centerY, 5, fH * 0.10, fH * 0.04, "#FFFFFF"); break; }
                    case 'de': { const sH = fH / 3; ctx.fillStyle = "#000000"; ctx.fillRect(fX, fY, fW, sH); ctx.fillStyle = "#DD0000"; ctx.fillRect(fX, fY + sH, fW, sH); ctx.fillStyle = "#FFCE00"; ctx.fillRect(fX, fY + sH * 2, fW, sH); break; }
                    case 'en': { ctx.fillStyle = "#012169"; ctx.fillRect(fX, fY, fW, fH); ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = fH * 0.1; ctx.beginPath(); ctx.moveTo(fX, fY); ctx.lineTo(fX + fW, fY + fH); ctx.moveTo(fX + fW, fY); ctx.lineTo(fX, fY + fH); ctx.stroke(); ctx.strokeStyle = "#C8102E"; ctx.lineWidth = fH * 0.04; ctx.beginPath(); ctx.moveTo(fX, fY); ctx.lineTo(fX + fW, fY + fH); ctx.moveTo(fX + fW, fY); ctx.lineTo(fX, fY + fH); ctx.stroke(); ctx.fillStyle = "#FFFFFF"; const cwW = fW * 0.16; const cwH = fH * 0.16; ctx.fillRect(fX + fW / 2 - cwW / 2, fY, cwW, fH); ctx.fillRect(fX, fY + fH / 2 - cwH / 2, fW, cwH); ctx.fillStyle = "#C8102E"; const rcwW = fW * 0.10; const rcwH = fH * 0.10; ctx.fillRect(fX + fW / 2 - rcwW / 2, fY, rcwW, fH); ctx.fillRect(fX, fY + fH / 2 - rcwH / 2, fW, rcwH); break; }
                    case 'fr': { const sW = fW / 3; ctx.fillStyle = "#00209F"; ctx.fillRect(fX, fY, sW, fH); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(fX + sW, fY, sW, fH); ctx.fillStyle = "#F63847"; ctx.fillRect(fX + sW * 2, fY, sW, fH); break; }
                    case 'es': { const rH = fH / 4; const yH = fH / 2; ctx.fillStyle = "#C60B1E"; ctx.fillRect(fX, fY, fW, rH); ctx.fillStyle = "#F1BF00"; ctx.fillRect(fX, fY + rH, fW, yH); ctx.fillStyle = "#C60B1E"; ctx.fillRect(fX, fY + rH + yH, fW, rH); break; }
                    case 'ru': { const sH = fH / 3; ctx.fillStyle = "#FFFFFF"; ctx.fillRect(fX, fY, fW, sH); ctx.fillStyle = "#0039A6"; ctx.fillRect(fX, fY + sH, fW, sH); ctx.fillStyle = "#D52B1E"; ctx.fillRect(fX, fY + sH * 2, fW, sH); break; }
                    case 'ar': { const rW = fW * 0.22; ctx.fillStyle = "#E01E37"; ctx.fillRect(fX, fY, rW, fH); const restW = fW - rW; const sH = fH / 3; ctx.fillStyle = "#107C41"; ctx.fillRect(fX + rW, fY, restW, sH); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(fX + rW, fY + sH, restW, sH); ctx.fillStyle = "#000000"; ctx.fillRect(fX + rW, fY + sH * 2, restW, sH); break; }
                    default: { ctx.fillStyle = "#111827"; ctx.fillRect(fX, fY, fW, fH); break; }
                }
                ctx.restore(); globalRenderedSec += 1 / FPS; if (videoTrack && videoTrack.requestFrame) videoTrack.requestFrame(); await nextFrame();
            }
            if (sonSozAudioEnd) await sonSozAudioEnd;
            if (yorumAudioEnd) await yorumAudioEnd;
            addSystemLog(`Son söz sahnesi render edildi.`, 'success');
        };

        const renderScene = async (imgObj, text, audioData, duration, isThumbnail = false, isOutro = false, topText = null, slideIndex = -1, chartData = null, transition = 'none', useContain = false, zoomCoords = null) => {
            let startT = performance.now(); const { exactDur, totalDur, audioEndPromise, wordTimings } = await playAudio(audioData, duration, text);
            // Altyazı — wordTimings'den oluştur (gerçek ses zamanlaması, scale edilmemiş)
            const subs = (isThumbnail || isOutro || wordTimings.length === 0) ? [] : RenderWorkerService._subsFromWordTimings(wordTimings);
            const totalFrames = Math.max(1, Math.round(totalDur * FPS));
            const transitionFrames = Math.min(5, Math.floor(totalFrames * 0.3)); // ~150ms fade
            // Ken Burns yönü — bir kez hesapla, her karede rastgele değil
            const kbPanDirX = (Math.random() - 0.5) * 20;
            const kbPanDirY = (Math.random() - 0.5) * 20;
            for (let frame = 0; frame < totalFrames; frame++) {
                if (useForceExact && globalRenderedSec >= limitSec) break;
                const progress = frame / totalFrames; const elapsedSec = frame / FPS;
                const activeSub = subs.find(s => elapsedSec >= s.startSec && elapsedSec < s.endSec)?.text || "";
                ctx.fillStyle = "black"; ctx.fillRect(0, 0, w, h);

                // Transition effect
                let alpha = 1;
                let offsetX = 0;
                if (transition === 'fadeIn' && frame < transitionFrames) {
                    alpha = frame / transitionFrames;
                } else if (transition === 'fadeOut' && frame > totalFrames - transitionFrames) {
                    alpha = (totalFrames - frame) / transitionFrames;
                } else if (transition === 'crossfade' && frame < transitionFrames) {
                    alpha = frame / transitionFrames;
                } else if (transition === 'slideIn' && frame < transitionFrames) {
                    offsetX = w * (1 - frame / transitionFrames);
                } else if (transition === 'slideOut' && frame > totalFrames - transitionFrames) {
                    offsetX = -w * ((frame - (totalFrames - transitionFrames)) / transitionFrames);
                }

                ctx.save();
                ctx.globalAlpha = alpha;
                if (offsetX !== 0) ctx.translate(offsetX, 0);

                if (imgObj) {
                    // Zoom koordinatları varsa o bölgeye zoom yap
                    if (zoomCoords) {
                        const z = zoomCoords;
                        const zx = (z.x / 100) * imgObj.width;
                        const zy = (z.y / 100) * imgObj.height;
                        const zw = (z.w / 100) * imgObj.width;
                        const zh = (z.h / 100) * imgObj.height;
                        
                        // Ken Burns efekti: zoom + hafif pan (sabit yön)
                        const t = progress;
                        const zoom = 1.0 + 0.15 * t;
                        const panX = kbPanDirX * t;
                        const panY = kbPanDirY * t;
                        
                        ctx.save();
                        ctx.translate(w / 2 + panX, h / 2 + panY);
                        ctx.scale(zoom, zoom);
                        
                        // Kırpılmış bölgeyi çiz
                        const scale = Math.max(w / zw, h / zh);
                        const drawW = zw * scale;
                        const drawH = zh * scale;
                        ctx.drawImage(imgObj, zx, zy, zw, zh, -drawW / 2, -drawH / 2, drawW, drawH);
                        ctx.restore();
                    } else if (useContain) { 
                        RenderWorkerService.drawImageContain(ctx, imgObj, w, h); 
                    } else { 
                        RenderWorkerService.drawImageCover(ctx, imgObj, w, h); 
                    }
                }
                if (isThumbnail) { RenderWorkerService.drawThumbnail(ctx, imgObj, text, w, h, fontFamily, jobData.config.sourceName, jobData.config); }
                else if (!isOutro) {
                    const grad = ctx.createLinearGradient(0, h * 0.45, 0, h); grad.addColorStop(0, "transparent"); grad.addColorStop(1, "rgba(0,0,0,0.95)"); ctx.fillStyle = grad; ctx.fillRect(0, h * 0.45, w, h * 0.55);
                    if (topText) {
                        let topFontSize = w > 800 ? 46 : 38;
                        ctx.font = `900 ${topFontSize}px ${fontFamily}`;
                        let lines = RenderWorkerService.wrapText(ctx, topText, w * 0.85);
                        const maxLines = jobData.script._isGuzelSoz ? 10 : 5;
                        while (lines.length > maxLines && topFontSize > 18) {
                            topFontSize -= 2;
                            ctx.font = `900 ${topFontSize}px ${fontFamily}`;
                            lines = RenderWorkerService.wrapText(ctx, topText, w * 0.85);
                        }
                        const lh = topFontSize * 1.3;
                        const boxH = lines.length * lh + 30;
                        const boxW = Math.min(w * 0.92, w * 0.85 + 80);
                        const boxX = cx - (boxW / 2);
                        const boxY = h * 0.06;
                        ctx.fillStyle = "rgba(0,0,0,0.75)";
                        ctx.beginPath();
                        if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxW, boxH, 16);
                        else ctx.rect(boxX, boxY, boxW, boxH);
                        ctx.fill();
                        ctx.fillStyle = "#FFD700";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        lines.forEach((line, i) => { ctx.fillText(line.trim(), cx, boxY + (boxH / 2) - ((lines.length - 1) * lh / 2) + (i * lh)); });
                    }
                    if (jobData.config.sourceName && slideIndex > 0) {
                        const srcText = jobData.config.sourceName;
                        const srcFontSize = w > 800 ? 50 : 40;
                        ctx.font = `900 ${srcFontSize}px 'Inter', Arial`;
                        const textW = ctx.measureText(srcText).width;
                        const bubbleW = textW + 60;
                        const bubbleH = srcFontSize + 40;
                        const bubbleX = w - bubbleW - 16;
                        const bubbleY = 16;
                        ctx.fillStyle = "#DC2626";
                        ctx.beginPath();
                        const bR = bubbleH / 2;
                        ctx.moveTo(bubbleX + bR, bubbleY);
                        ctx.lineTo(bubbleX + bubbleW - bR, bubbleY);
                        ctx.arc(bubbleX + bubbleW - bR, bubbleY + bR, bR, -Math.PI / 2, Math.PI / 2);
                        ctx.lineTo(bubbleX + bR, bubbleY + bubbleH);
                        ctx.arc(bubbleX + bR, bubbleY + bR, bR, Math.PI / 2, -Math.PI / 2);
                        ctx.closePath();
                        ctx.fill();
                        ctx.beginPath();
                        ctx.moveTo(bubbleX + 20, bubbleY + bubbleH);
                        ctx.lineTo(bubbleX + 10, bubbleY + bubbleH + 14);
                        ctx.lineTo(bubbleX + 35, bubbleY + bubbleH);
                        ctx.fill();
                        ctx.fillStyle = "white";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText(srcText, bubbleX + bubbleW / 2, bubbleY + bubbleH / 2);
                    }
                    if (activeSub && jobData.config.subtitles !== 'off') { let subFontSize = w > 800 ? 65 : 50; ctx.font = `900 ${subFontSize}px ${fontFamily}`; let displaySub = activeSub.trim(); while (ctx.measureText(displaySub).width > w * 0.95 && subFontSize > 30) { subFontSize -= 2; ctx.font = `900 ${subFontSize}px ${fontFamily}`; } const subTextW = ctx.measureText(displaySub).width; const subPadX = 20; const subPadY = 8; const subBoxW = subTextW + subPadX * 2; const subBoxH = subFontSize + subPadY * 2; const subBoxX = cx - subBoxW / 2; const subBoxY = h * RenderWorkerService.SAFE_ZONE.subtitleY - subBoxH / 2; ctx.fillStyle = "#2563EB"; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(subBoxX, subBoxY, subBoxW, subBoxH, 8); else ctx.rect(subBoxX, subBoxY, subBoxW, subBoxH); ctx.fill(); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "white"; ctx.fillText(displaySub, cx, h * RenderWorkerService.SAFE_ZONE.subtitleY); }
                }
                if (isOutro) {
                    // === HAREKETLI KAPANIŞ SAHNESİ (H1.141) ===
                    const outroElapsed = elapsedSec;
                    const outroDur = totalDur;

                    // 1. Koyu mor gradyan arka plan
                    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
                    bgGrad.addColorStop(0, '#0a0015');
                    bgGrad.addColorStop(0.4, '#1a0533');
                    bgGrad.addColorStop(0.7, '#0f0a2e');
                    bgGrad.addColorStop(1, '#050010');
                    ctx.fillStyle = bgGrad;
                    ctx.fillRect(0, 0, w, h);

                    // 2. Bokeh parçacıkları (20 adet, persistent)
                    if (!window._outroParticles || window._outroParticles.length === 0) {
                        window._outroParticles = [];
                        for (let p = 0; p < 20; p++) {
                            window._outroParticles.push({
                                x: Math.random() * w,
                                y: Math.random() * h,
                                r: 8 + Math.random() * 35,
                                speed: 0.3 + Math.random() * 0.8,
                                phase: Math.random() * Math.PI * 2,
                                alpha: 0.05 + Math.random() * 0.15,
                                hue: Math.random() > 0.5 ? 270 : 320
                            });
                        }
                    }
                    window._outroParticles.forEach(p => {
                        const py = ((p.y - outroElapsed * p.speed * 30) % h + h) % h;
                        const pulse = 1 + 0.2 * Math.sin(outroElapsed * 1.5 + p.phase);
                        const grad = ctx.createRadialGradient(p.x, py, 0, p.x, py, p.r * pulse);
                        grad.addColorStop(0, `hsla(${p.hue}, 80%, 60%, ${p.alpha})`);
                        grad.addColorStop(0.6, `hsla(${p.hue}, 80%, 40%, ${p.alpha * 0.4})`);
                        grad.addColorStop(1, 'transparent');
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.arc(p.x, py, p.r * pulse * 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    });

                    // 3. Başlık satırları — fade-in + slide-up animasyonu
                    // Dil bazlı outro başlığı
                    const lang = jobData?.config?.language || 'tr';
                    const outroTexts = {
                        tr: ["Abone olmayı,", "beğenmeyi ve", "paylaşmayı", "ihmal etmeyin."],
                        en: ["Don't forget to", "subscribe, like", "and share."],
                        fr: ["N'oubliez pas de", "vous abonner,", "aimer et partager."],
                        de: ["Vergessen Sie nicht", "zu abonnieren, liken", "und zu teilen."],
                        es: ["No olvides", "suscribirte, dar", "me gusta y compartir."],
                        ar: ["لا تنسَ", "الاشتراك والإعجاب", "والمشاركة."],
                        ru: ["Не забудьте", "подписаться, лайкнуть", "и поделиться."]
                    };
                    const titleLines = outroTexts[lang] || outroTexts['tr'];
                    let titleFontSize = w > 800 ? 52 : 38;
                    const titleLh = titleFontSize * 1.5;
                    const titleStartY = h * 0.22;

                    titleLines.forEach((line, i) => {
                        const lineDelay = i * 0.35;
                        const lineProgress = Math.max(0, Math.min(1, (outroElapsed - lineDelay) / 0.5));
                        const fadeAlpha = lineProgress;
                        const slideOffset = (1 - lineProgress) * 40;

                        ctx.save();
                        ctx.globalAlpha = fadeAlpha;
                        ctx.font = `800 ${titleFontSize}px ${fontFamily}`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';

                        // Altın gradient gölge
                        const tg = ctx.createLinearGradient(cx - w * 0.4, 0, cx + w * 0.4, 0);
                        tg.addColorStop(0, '#FFD700');
                        tg.addColorStop(0.3, '#FFA500');
                        tg.addColorStop(0.7, '#FFD700');
                        tg.addColorStop(1, '#FFC107');

                        const yPos = titleStartY + i * titleLh + slideOffset;

                        // Gölge
                        ctx.shadowColor = 'rgba(255, 165, 0, 0.6)';
                        ctx.shadowBlur = 20;
                        ctx.shadowOffsetY = 4;

                        // Siyah outline
                        ctx.lineWidth = titleFontSize * 0.25;
                        ctx.strokeStyle = '#000';
                        ctx.lineJoin = 'round';
                        ctx.strokeText(line, cx, yPos);

                        // Altın gradient iç
                        ctx.fillStyle = tg;
                        ctx.fillText(line, cx, yPos);

                        ctx.restore();
                    });

                    // 4. CTA butonları — slide-in + nabız animasyonu
                    // Dil bazlı CTA buton etiketleri
                    const ctaLabels = {
                        tr: { sub: 'Abone Ol', like: 'Beğen', share: 'Paylaş' },
                        en: { sub: 'Subscribe', like: 'Like', share: 'Share' },
                        fr: { sub: "S'abonner", like: 'Aimer', share: 'Partager' },
                        de: { sub: 'Abonnieren', like: 'Liken', share: 'Teilen' },
                        es: { sub: 'Suscribir', like: 'Me gusta', share: 'Compartir' },
                        ar: { sub: 'اشتراك', like: 'إعجاب', share: 'مشاركة' },
                        ru: { sub: 'Подписка', like: 'Лайк', share: 'Поделиться' }
                    };
                    const cta = ctaLabels[lang] || ctaLabels['tr'];
                    const buttons = [
                        { label: cta.sub, icon: 'bell', delay: 1.8, color1: '#E30A17', color2: '#FF4444' },
                        { label: cta.like, icon: 'heart', delay: 2.2, color1: '#E91E63', color2: '#FF5C8A' },
                        { label: cta.share, icon: 'share', delay: 2.6, color1: '#2196F3', color2: '#64B5F6' }
                    ];

                    const btnAreaY = h * 0.58;
                    const btnRadius = Math.min(w * 0.12, 55);
                    const btnSpacing = btnRadius * 3.2;
                    const btnStartX = cx - btnSpacing;

                    buttons.forEach((btn, i) => {
                        const bx = btnStartX + i * btnSpacing;
                        const by = btnAreaY;

                        const btnProgress = Math.max(0, Math.min(1, (outroElapsed - btn.delay) / 0.4));
                        const slideFrom = (1 - btnProgress) * 80;
                        const fadeAlpha = btnProgress;

                        // Nabız efekti (geldikten sonra)
                        const pulseTime = Math.max(0, outroElapsed - btn.delay - 0.5);
                        const pulse = 1 + 0.06 * Math.sin(pulseTime * 3);

                        ctx.save();
                        ctx.globalAlpha = fadeAlpha;

                        // Buton dairesi — gradyan
                        const btnGrad = ctx.createRadialGradient(bx, by + slideFrom, 0, bx, by + slideFrom, btnRadius * pulse);
                        btnGrad.addColorStop(0, btn.color2);
                        btnGrad.addColorStop(1, btn.color1);
                        ctx.fillStyle = btnGrad;
                        ctx.shadowColor = btn.color1 + '88';
                        ctx.shadowBlur = 20;
                        ctx.beginPath();
                        ctx.arc(bx, by + slideFrom, btnRadius * pulse, 0, Math.PI * 2);
                        ctx.fill();

                        // İkon (canvas ile çiz)
                        ctx.fillStyle = '#FFFFFF';
                        ctx.shadowBlur = 0;
                        const iconSize = btnRadius * 0.45;
                        const iy = by + slideFrom;

                        if (btn.icon === 'bell') {
                            // Çan ikonu
                            ctx.beginPath();
                            ctx.arc(bx, iy - iconSize * 0.2, iconSize * 0.5, Math.PI, 0);
                            ctx.lineTo(bx + iconSize * 0.6, iy + iconSize * 0.3);
                            ctx.lineTo(bx - iconSize * 0.6, iy + iconSize * 0.3);
                            ctx.closePath();
                            ctx.fill();
                            ctx.fillRect(bx - iconSize * 0.15, iy + iconSize * 0.35, iconSize * 0.3, iconSize * 0.15);
                        } else if (btn.icon === 'heart') {
                            // Kalp ikonu
                            const hx = bx, hy = iy - iconSize * 0.1;
                            const hr = iconSize * 0.3;
                            ctx.beginPath();
                            ctx.arc(hx - hr * 0.6, hy - hr * 0.3, hr * 0.6, 0, Math.PI * 2);
                            ctx.arc(hx + hr * 0.6, hy - hr * 0.3, hr * 0.6, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.beginPath();
                            ctx.moveTo(hx - hr * 1.1, hy);
                            ctx.lineTo(hx, hy + hr * 1.2);
                            ctx.lineTo(hx + hr * 1.1, hy);
                            ctx.fill();
                        } else if (btn.icon === 'share') {
                            // Paylaş ikonu (bağlantı)
                            ctx.lineWidth = iconSize * 0.15;
                            ctx.strokeStyle = '#FFFFFF';
                            ctx.lineCap = 'round';
                            // Sol halka
                            ctx.beginPath();
                            ctx.arc(bx - iconSize * 0.25, iy, iconSize * 0.25, Math.PI * 0.7, Math.PI * 2.3);
                            ctx.stroke();
                            // Sağ halka
                            ctx.beginPath();
                            ctx.arc(bx + iconSize * 0.25, iy, iconSize * 0.25, -Math.PI * 0.3, Math.PI * 1.3);
                            ctx.stroke();
                        }

                        // Etiket
                        ctx.font = `700 ${Math.round(btnRadius * 0.28)}px ${fontFamily}`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'top';
                        ctx.fillStyle = '#FFFFFF';
                        ctx.shadowColor = 'rgba(0,0,0,0.5)';
                        ctx.shadowBlur = 4;
                        ctx.fillText(btn.label, bx, by + slideFrom + btnRadius * pulse + 8);

                        ctx.restore();
                    });

                    // 5. Disclaimer — gradient çizgi + fade-in yazı
                    const discDelay = 3.5;
                    const discAlpha = Math.max(0, Math.min(1, (outroElapsed - discDelay) / 0.8));
                    const discH = Math.max(100, h * 0.15);
                    const discY = h - discH;

                    ctx.save();
                    ctx.globalAlpha = discAlpha;

                    // Gradient çizgi
                    const lineGrad = ctx.createLinearGradient(0, 0, w, 0);
                    lineGrad.addColorStop(0, 'transparent');
                    lineGrad.addColorStop(0.3, 'rgba(225,29,72,0.5)');
                    lineGrad.addColorStop(0.7, 'rgba(225,29,72,0.5)');
                    lineGrad.addColorStop(1, 'transparent');
                    ctx.strokeStyle = lineGrad;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(0, discY);
                    ctx.lineTo(w, discY);
                    ctx.stroke();

                    // Disclaimer metni
                    ctx.fillStyle = 'rgba(241,245,249,0.8)';
                    const discFontSize = w > 800 ? 22 : 16;
                    ctx.font = `600 ${discFontSize}px 'Inter', Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const discTexts = {
                        tr: "Gemini bir yapay zeka modeli olduğu için kişiler de dahil olmak üzere farklı konular hakkında yanlış bilgi verebilir.",
                        en: "As an AI model, Gemini may provide inaccurate information about various topics, including people.",
                        fr: "En tant que modèle d'IA, Gemini peut fournir des informations inexactes sur divers sujets, y compris les personnes.",
                        de: "Als KI-Modell kann Gemini ungenaue Informationen zu verschiedenen Themen liefern, einschließlich Personen.",
                        es: "Como modelo de IA, Gemini puede proporcionar información inexacta sobre diversos temas, incluidas las personas.",
                        ar: "كنموذج ذكاء اصطناعي، قد يوفر Gemini معلومات غير دقيقة حول مواضيع مختلفة، بما في ذلك الأشخاص.",
                        ru: "Как модель ИИ, Gemini может предоставить неточную информацию по различным темам, включая людей."
                    };
                    const discTxt = discTexts[lang] || discTexts['tr'];
                    const discLines = RenderWorkerService.wrapText(ctx, discTxt, w * 0.88);
                    const discLh = discFontSize * 1.5;
                    const discTextStartY = discY + (discH / 2) - (((discLines.length - 1) * discLh) / 2);
                    discLines.forEach((line, idx) => {
                        ctx.fillText(line.trim(), cx, discTextStartY + idx * discLh);
                    });

                    ctx.restore();

                    // Parçacıkları temizle (sahne bittiğinde)
                    if (progress > 0.95) window._outroParticles = [];
                }
                ctx.restore();
                globalRenderedSec += 1 / FPS; if (videoTrack && videoTrack.requestFrame) videoTrack.requestFrame(); await nextFrame();
            }
            // Ses bitene kadar bekle — sonraki sahne başlamasın
            if (audioEndPromise) await audioEndPromise;
            addSystemLog(`Sahne ${isThumbnail ? 'kapak' : isOutro ? 'kapanış' : slideIndex} render edildi.`, 'success');
        };

        try {
            let bgmSource, bgmNode, masterGain;
            const loadBGM = async (musicId) => {
                if (bgmSource) { try { bgmSource.stop(); bgmSource.disconnect(); } catch(e){} }
                if (bgmNode) { try { bgmNode.disconnect(); } catch(e){} }
                if (masterGain) { try { masterGain.disconnect(); } catch(e){} }
                bgmSource = null; bgmNode = null; masterGain = null;
                let bgmInitialized = false;
                if (!musicId || musicId === 'none') return;
                const ambientTypes = ['rain', 'wind', 'waves', 'fire'];
                if (ambientTypes.includes(musicId)) {
                    const ambientObj = AmbientAudioService.getAmbientNode(audioCtx, musicId);
                    if (ambientObj) {
                        bgmSource = ambientObj.source;
                        bgmNode = ambientObj.gainNode;
                        masterGain = audioCtx.createGain();
                        masterGain.gain.value = 0.3;
                        bgmNode.connect(masterGain);
                        masterGain.connect(audioDest);
                    }
                } else if (musicId.startsWith('gd_')) {
                    try {
                        const savedUrl = await AssetManagerService.loadMedia('CUSTOM_MUSIC');
                        if (savedUrl) {
                            let res;
                            if (savedUrl.startsWith('data:') || savedUrl.startsWith('blob:')) { res = await fetch(savedUrl); }
                            else { res = await fetchWithCorsProxy(savedUrl); }
                            const buf = await audioCtx.decodeAudioData(await res.arrayBuffer());
                            if (!bgmInitialized) { bgmSource = audioCtx.createBufferSource(); bgmSource.buffer = buf; bgmSource.loop = true; bgmInitialized = true; }
                            masterGain = audioCtx.createGain();
                            masterGain.gain.value = 0.3;
                            bgmSource.connect(masterGain); masterGain.connect(audioDest); bgmSource.start(0);
                        }
                    } catch (e) { console.warn("Google Drive müziği okunamadı", e); }
                } else {
                    try {
                        const track = await AssetManagerService.getMusicFromLib(musicId);
                        if (track && track.data) {
                            const raw = track.data.includes(',') ? track.data.split(',')[1] : track.data;
                            const byteString = atob(raw); const ab = new ArrayBuffer(byteString.length); const ia = new Uint8Array(ab);
                            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                            const blob = new Blob([ab], { type: 'audio/mpeg' });
                            const musicUrl = URL.createObjectURL(blob);
                            const res = await fetch(musicUrl);
                            const buf = await audioCtx.decodeAudioData(await res.arrayBuffer());
                            if (!bgmInitialized) { bgmSource = audioCtx.createBufferSource(); bgmSource.buffer = buf; bgmSource.loop = true; bgmInitialized = true; }
                            masterGain = audioCtx.createGain();
                            masterGain.gain.value = 0.3;
                            bgmSource.connect(masterGain); masterGain.connect(audioDest); bgmSource.start(0);
                        }
                    } catch (e) { console.warn("Müzik okunamadı", e); }
                }
            };
            let bgmInitialized = false;
            const initialBgmId = jobData.script._bgmId || preferences.ambientSound || 'none';
            addSystemLog(`Render BGM: ${initialBgmId} (script._bgmId: ${jobData.script._bgmId || 'yok'})`, 'info');
            await loadBGM(initialBgmId);

            const tImg = await NetworkUtils.loadImage(jobData.assets.thumbnail);
            const customOutroData = await AssetManagerService.loadMedia('CUSTOM_OUTRO');
            const outroImg = await NetworkUtils.loadImage(customOutroData || jobData.assets.outroImage);

            if (tImg) { RenderWorkerService.drawThumbnail(ctx, tImg, jobData.script.thumbnailText, w, h, fontFamily, jobData.config.sourceName, jobData.config); if (videoTrack && videoTrack.requestFrame) videoTrack.requestFrame(); for (let i = 0; i < 3; i++) await nextFrame(); }

            const recorder = new MediaRecorder(combinedStream, { mimeType, audioBitsPerSecond: 192000, videoBitsPerSecond: 2000000 });
            const chunks = []; recorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data); }; recorder.start(100);

            sysEventBus.emit('PROGRESS', { step: 'RENDER', percent: 10, text: 'Clickbait Kapak Oluşturuluyor...' });
            await renderScene(tImg, jobData.script.thumbnailText, jobData.assets.thumbnailAudio, rawKapakDur, true, false, null, 0, null, jobData.config.transition);

            // Sadece bloğun 1. sahnesi sabit görsel kullanır (S1 gösterimi)
            // 2. ve 3. sahneler AI görseli kullanır
            const slideIsCustom = [];
            const blocks = jobData.script.imageBlocks || [];
            let gIdx = 0;
            for (const block of blocks) {
                if (block.imageType === 'custom') {
                    slideIsCustom[gIdx] = true; // Sadece 1. sahne
                }
                gIdx += block.videoSlides.length;
            }

            const WINDOW_SIZE = 5;
                // İlk WINDOW_SIZE görseli önceden yükle — sahneler arası gecikmeyi önle
                const preloadedImages = [];
                for (let pi = 0; pi < Math.min(WINDOW_SIZE, jobData.script.videoSlides.length); pi++) {
                    preloadedImages[pi] = await NetworkUtils.loadImage(jobData.assets.images[pi]) || tImg;
                }
                for (let i = 0; i < jobData.script.videoSlides.length; i++) {
                if (useForceExact && globalRenderedSec >= limitSec) break;
                const slide = jobData.script.videoSlides[i];
                sysEventBus.emit('PROGRESS', { step: 'RENDER', percent: Math.min(80, 20 + ((i + 1) / jobData.script.videoSlides.length) * 60), text: `Sahne ${i + 1} Render Ediliyor...` });
                // BAŞLIKLAR sahnesi image yükleme atla
                const isBasliklarScene = slide._isBasliklarList && slide._basliklar;
                // Önceden yüklenmiş görseli kullan, yoksa yükle
                const sImg = isBasliklarScene ? null : (preloadedImages[i] || await NetworkUtils.loadImage(jobData.assets.images[i]) || tImg);
                // Sonraki görseli arka planda önceden yükle
                const nextIdx = i + 1;
                if (nextIdx < jobData.script.videoSlides.length && !preloadedImages[nextIdx] && !jobData.script.videoSlides[nextIdx]._isBasliklarList) {
                    NetworkUtils.loadImage(jobData.assets.images[nextIdx]).then(img => { preloadedImages[nextIdx] = img || tImg; }).catch(() => {});
                }
                const isCustomImg = !!slideIsCustom[i];
                // BAŞLIKLAR sahnesi — özel render
                    if (slide._isBasliklarList && slide._basliklar) {
                        const { exactDur, totalDur, audioEndPromise } = await playAudio(jobData.assets.audio[i], null, slide.spokenText);
                        const totalFrames = Math.max(1, Math.round(totalDur * FPS));
                        
                        for (let frame = 0; frame < totalFrames; frame++) {
                            if (useForceExact && globalRenderedSec >= limitSec) break;
                            const elapsedSec = frame / FPS;
                            
                            // Mor arka plan
                            const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
                            bgGrad.addColorStop(0, '#0a0015');
                            bgGrad.addColorStop(0.4, '#1a0533');
                            bgGrad.addColorStop(1, '#050010');
                            ctx.fillStyle = bgGrad;
                            ctx.fillRect(0, 0, w, h);
                            
                            // Başlık
                            const titleFontSize = w > 800 ? 60 : 45;
                            ctx.font = `900 ${titleFontSize}px ${fontFamily}`;
                            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                            ctx.fillStyle = '#FFD700';
                            ctx.shadowColor = 'rgba(255, 165, 0, 0.6)'; ctx.shadowBlur = 20;
                            ctx.fillText(slide.topText, cx, h * 0.08);
                            ctx.shadowBlur = 0;
                            
                            // Kırmızı çizgi
                            ctx.strokeStyle = '#E30A17'; ctx.lineWidth = 3;
                            ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.12); ctx.lineTo(w * 0.9, h * 0.12); ctx.stroke();
                            
                            // Başlıklar
                            const basliklar = slide._basliklar;
                            let listFontSize = w > 800 ? 42 : 32;
                            ctx.font = `700 ${listFontSize}px ${fontFamily}`;
                            const availableH = h * 0.75;
                            let totalLines = 0;
                            basliklar.forEach(b => { totalLines += RenderWorkerService.wrapText(ctx, b.baslik, w * 0.85).length + 0.5; });
                            while (totalLines * listFontSize * 1.6 > availableH && listFontSize > 18) {
                                listFontSize -= 2; ctx.font = `700 ${listFontSize}px ${fontFamily}`;
                                totalLines = 0; basliklar.forEach(b => { totalLines += RenderWorkerService.wrapText(ctx, b.baslik, w * 0.85).length + 0.5; });
                            }
                            const finalLineHeight = listFontSize * 1.6;
                            let currentY = h * 0.16;
                            basliklar.forEach((b, idx) => {
                                ctx.font = `900 ${listFontSize}px ${fontFamily}`; ctx.fillStyle = '#E30A17'; ctx.textAlign = 'left';
                                ctx.fillText(`${idx + 1}.`, w * 0.05, currentY);
                                ctx.font = `700 ${listFontSize}px ${fontFamily}`; ctx.fillStyle = '#FFFFFF';
                                const lines = RenderWorkerService.wrapText(ctx, b.baslik, w * 0.8);
                                lines.forEach((line, lineIdx) => { ctx.fillText(line, w * 0.1, currentY + lineIdx * finalLineHeight); });
                                currentY += lines.length * finalLineHeight + finalLineHeight * 0.5;
                            });
                            
                            globalRenderedSec += 1 / FPS;
                            if (videoTrack && videoTrack.requestFrame) videoTrack.requestFrame();
                            await nextFrame();
                        }
                        if (audioEndPromise) await audioEndPromise;
                        addSystemLog(`BAŞLIKLAR sahnesi render edildi.`, 'success');
                    } else if (slide._isKaynaklar && slide._kaynaklar) {
                        // KAYNAKLAR sahnesi — özel render
                        const { exactDur, totalDur, audioEndPromise } = await playAudio(jobData.assets.audio[i], null, slide.spokenText);
                        const totalFrames = Math.max(1, Math.round(totalDur * FPS));
                        
                        for (let frame = 0; frame < totalFrames; frame++) {
                            if (useForceExact && globalRenderedSec >= limitSec) break;
                            
                            // Siyah arka plan
                            ctx.fillStyle = '#030712';
                            ctx.fillRect(0, 0, w, h);
                            
                            // Başlık
                            ctx.font = `900 ${w > 800 ? 50 : 38}px ${fontFamily}`;
                            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                            ctx.fillStyle = '#E30A17';
                            ctx.fillText('KAYNAKLAR', cx, h * 0.06);
                            
                            // Çizgi
                            ctx.strokeStyle = '#E30A17'; ctx.lineWidth = 2;
                            ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.09); ctx.lineTo(w * 0.9, h * 0.09); ctx.stroke();
                            
                            // Kaynaklar listesi
                            const kaynaklar = slide._kaynaklar;
                            let listFontSize = w > 800 ? 28 : 22;
                            ctx.font = `700 ${listFontSize}px ${fontFamily}`;
                            let currentY = h * 0.13;
                            
                            kaynaklar.forEach((k, idx) => {
                                // Başlık
                                ctx.fillStyle = '#FFD700';
                                ctx.textAlign = 'left';
                                ctx.font = `700 ${listFontSize}px ${fontFamily}`;
                                ctx.fillText(`${idx + 1}. ${k.baslik}`, w * 0.05, currentY);
                                currentY += listFontSize * 1.2;
                                
                                // URL
                                ctx.fillStyle = '#60A5FA';
                                ctx.font = `400 ${listFontSize * 0.8}px ${fontFamily}`;
                                ctx.fillText(k.url, w * 0.08, currentY);
                                currentY += listFontSize * 1.0;
                                
                                // Tarih (varsa)
                                if (k.tarih) {
                                    ctx.fillStyle = '#9CA3AF';
                                    ctx.font = `400 ${listFontSize * 0.7}px ${fontFamily}`;
                                    ctx.fillText(k.tarih, w * 0.08, currentY);
                                    currentY += listFontSize * 0.8;
                                }
                                
                                currentY += listFontSize * 0.5; // Boşluk
                            });
                            
                            globalRenderedSec += 1 / FPS;
                            if (videoTrack && videoTrack.requestFrame) videoTrack.requestFrame();
                            await nextFrame();
                        }
                        if (audioEndPromise) await audioEndPromise;
                        addSystemLog('KAYNAKLAR sahnesi render edildi.', 'success');
                    } else {
                        await renderScene(sImg, slide.spokenText, jobData.assets.audio[i], rawSlideSecs[i], false, false, slide.topText, i + 1, jobData.script.chartData, jobData.config.transition, isCustomImg, slide._zoomCoords || null);
                    }
                // Sliding window: serbest bırakılan görselleri temizle
                if (i >= WINDOW_SIZE) {
                    const releaseIdx = i - WINDOW_SIZE;
                    jobData.assets.images[releaseIdx] = null;
                    jobData.assets.audio[releaseIdx] = null;
                }
            }

            // Tüm slaytların spokenText'inden son sözü çıkar (tekrar önlemi)
            if (jobData.script.sonSoz && jobData.script.videoSlides.length > 0) {
                const sonSozRegex = new RegExp(jobData.script.sonSoz.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                let removedCount = 0;
                jobData.script.videoSlides.forEach(function(slide) {
                    if (slide.spokenText && sonSozRegex.test(slide.spokenText)) {
                        slide.spokenText = slide.spokenText.replace(sonSozRegex, '').replace(/\s+/g, ' ').trim();
                        removedCount++;
                    }
                });
                if (removedCount > 0) addSystemLog(`Son söz ${removedCount} slayttan çıkarıldı (tekrar önlemi).`, 'info');
            }

            // Son söz sahnesi — daima render et (yorum varsa yorum, yoksa son söz)
            const hasYorumForScene = jobData.config.yorum && jobData.config.yorum.trim().length > 0;
            if ((jobData.script.sonSoz || hasYorumForScene) && (!useForceExact || globalRenderedSec < limitSec)) {
                sysEventBus.emit('PROGRESS', { step: 'RENDER', percent: 85, text: 'Son Söz Sahnesi Render Ediliyor...' });
                const isSingleMedia = (jobData.imageQueue || []).length <= 1;
                await renderSonSozScene(jobData.script.sonSoz || '', jobData.assets.sonSozAudio, rawSonSozDur, isSingleMedia);
            }
            if (!useForceExact || globalRenderedSec < limitSec) { sysEventBus.emit('PROGRESS', { step: 'RENDER', percent: 90, text: 'Kapanış Render Ediliyor...' }); await renderScene(outroImg, jobData.script.lastQuote, jobData.assets.outroAudio, rawOutroDur, false, true, null, 99, null, jobData.config.transition); }

            if (bgmSource) { try { bgmSource.stop(); bgmSource.disconnect(); } catch(e){} } if (bgmNode) { try { bgmNode.disconnect(); } catch(e){} } if (masterGain) { try { masterGain.disconnect(); } catch(e){} }
            silentOsc.stop(); silentOsc.disconnect(); keepAliveOsc.stop(); keepAliveOsc.disconnect(); keepAliveGain.disconnect();

            try { const totalFrames = Math.floor(rawCushion * scaleFactor * FPS); for (let i = 0; i < totalFrames; i++) { if (useForceExact && globalRenderedSec >= limitSec) break; globalRenderedSec += 1 / FPS; await nextFrame(); } } catch (e) { console.warn("Kapanış bekleme hatası:", e); }

            timerWorker.postMessage('stop'); timerWorker.terminate();

            return new Promise((resolve, reject) => {
                recorder.onstop = () => { const blob = new Blob(chunks, { type: mimeType }); if (blob.size === 0) return reject(new Error("Video oluşturulamadı (0 Bayt).")); resolve(URL.createObjectURL(blob)); };
                if (recorder.state !== 'inactive') { try { recorder.requestData(); } catch (e) { } setTimeout(() => recorder.stop(), 100); } else resolve(URL.createObjectURL(new Blob(chunks, { type: mimeType })));
            });
        } catch (e) { if (typeof timerWorker !== 'undefined') timerWorker.terminate(); throw new Error(`Render failed: ${e.message}`); }
    }
};

class WorkflowCoordinator {
    constructor() { this.jobId = null; this.state = {}; }
    async updateProgress(percent, text, step) { const safePercent = Math.min(100, Math.max(0, Math.round(percent))); this.state.progress = safePercent; this.state.statusText = text; await AssetManagerService.saveJobState(this.state); sysEventBus.emit('PROGRESS', { step, percent: safePercent, text }); }
    async startWorkflow(inputData, inputType, config, preferences, canvasRef) {
        this.jobId = "job_" + Date.now();
        const customImages = config.customSceneImages || [];
        const uploadedMedia = (inputType === 'media' && Array.isArray(inputData)) ? inputData : [];
        const allImages = [];
        if (customImages.length > 0 && uploadedMedia.length > 0) {
            // Her sabit görsel için 1 medya eşleştir: S1+M1, S2+M2, S3+M3
            const pairCount = Math.min(customImages.length, uploadedMedia.length, 10);
            for (let i = 0; i < pairCount; i++) {
                allImages.push({ type: 'custom', data: customImages[i], mediaItem: uploadedMedia[i] });
            }
            addSystemLog(`Eşleştirme: ${pairCount} blok (S1+M1, S2+M2, ...)`, 'info');
        } else if (customImages.length > 0) {
            for (const img of customImages) allImages.push({ type: 'custom', data: img });
        } else {
            for (const m of uploadedMedia) allImages.push({ type: 'uploaded', data: m });
        }
        this.state = { jobId: this.jobId, status: 'INIT', inputData, inputType, config, preferences,
            script: { imageBlocks: [], thumbnailText: '', lastQuote: '', sonSoz: '', thumbnailImagePrompt: '', _isGuzelSoz: false },
            assets: { images: [], audio: [], thumbnail: null, thumbnailAudio: null, sonSozAudio: null, yorumAudio: null, outroAudio: null, blackoutAudio: null },
            imageQueue: allImages, processedImageCount: 0, progress: 0 };
        await AssetManagerService.saveJobState(this.state);
        return this.resumeWorkflow(canvasRef);
    }
    async resumeWorkflow(canvasRef) {
        try {
            if (!this.state || !this.state.jobId) { const saved = await AssetManagerService.getPendingJob(); if (saved) this.state = saved; else throw new Error("Bekleyen işlem bulunamadı."); }
            sysEventBus.emit('WORKFLOW_STATE', { status: 'RUNNING', job: this.state });

            if (this.state.status === 'INIT') {
                // Güzel söz modu → eski akış (değişmedi)
                if (this.state.config.tip === 'guzel_soz' || this.state.config.tip === 'iddia_analizi') {
                    let startT = performance.now();
                    const tipLabel = 'Güzel Söz';
                    await this.updateProgress(10, `${tipLabel} yapılıyor...`, 'LOGIC');
                    const script = await LogicEngineService.analyzeContent(this.state.inputData, this.state.inputType, this.state.config);
                    this.state.script = script;
                    this.state.status = 'GENERATING_ASSETS';
                    await AssetManagerService.saveJobState(this.state);
                    addSystemLog(`${tipLabel} tamamlandı (${((performance.now() - startT) / 1000).toFixed(1)}s).`, 'success');
                } else {
                    // YENİ AKIŞ: Her görsel için sırayla sahne üret
                    const queue = this.state.imageQueue || [];
                    const totalImages = queue.length;
                    if (totalImages === 0) throw new Error("İşlenecek görsel bulunamadı. Lütfen en az bir sabit görsel veya medya yükleyin.");

                    addSystemLog(`Toplam ${totalImages} görsel işlenecek.`, 'info');
                    let previousContext = "";

                    for (let i = this.state.processedImageCount || 0; i < totalImages; i++) {
                        const imgItem = queue[i];
                        const blockNum = i + 1;
                        await this.updateProgress(5 + (blockNum / totalImages) * 35, `Blok ${blockNum}/${totalImages} analiz ediliyor...`, 'LOGIC');

                        let blockResult;
                        try {
                            if (imgItem.type === 'custom' && imgItem.mediaItem) {
                                blockResult = await LogicEngineService.analyzeContentForImage([imgItem.mediaItem], 'media', this.state.config, i, totalImages, previousContext);
                            } else if (imgItem.type === 'custom' && imgItem.data) {
                                blockResult = await LogicEngineService.analyzeContentForImage([{ data: imgItem.data, type: 'image/png' }], 'media', this.state.config, i, totalImages, previousContext);
                            } else if (imgItem.type === 'uploaded' && imgItem.data) {
                                blockResult = await LogicEngineService.analyzeContentForImage([imgItem.data], 'media', this.state.config, i, totalImages, previousContext);
                            } else {
                                blockResult = await LogicEngineService.analyzeContentForImage(this.state.inputData, this.state.inputType, this.state.config, i, totalImages, previousContext);
                            }
                        } catch (e) {
                            addSystemLog(`Blok ${blockNum} analiz hatası: ${e.message}`, 'error');
                            blockResult = { videoSlides: [], thumbnailText: '', thumbnailImagePrompt: '' };
                        }

                        if (i === 0) {
                            if (!this.state.script.thumbnailText) { this.state.script.thumbnailText = blockResult.thumbnailText || ''; }
                            this.state.script.thumbnailImagePrompt = blockResult.thumbnailImagePrompt || '';
                        }
                        if (blockResult.sonSoz) this.state.script.sonSoz = blockResult.sonSoz;
                        if (blockResult.kaynaklar && blockResult.kaynaklar.length > 0) {
                            this.state.script._kaynaklar = blockResult.kaynaklar;
                            addSystemLog(`${blockResult.kaynaklar.length} kaynak eklendi.`, 'success');
                        }
                        if (blockResult.lastQuote) this.state.script.lastQuote = blockResult.lastQuote;

                        // Normal slide'ları her zaman ekle (başlık olsa bile)
                        this.state.script.imageBlocks.push({
                            imageIndex: i,
                            imageType: imgItem.type,
                            customImage: imgItem.type === 'custom' ? imgItem.data : null,
                            videoSlides: blockResult.videoSlides || []
                        });

                        // Başlıkları topla — sadece birden fazla görsel varsa
                        if (queue.length > 1 && blockResult.gazeteBasliklari && blockResult.gazeteBasliklari.length > 0) {
                            if (!this.state.script._allBasliklar) this.state.script._allBasliklar = [];
                            this.state.script._allBasliklar.push(...blockResult.gazeteBasliklari);
                            addSystemLog(`Görsel ${blockNum}: ${blockResult.gazeteBasliklari.length} başlık çıkarıldı.`, 'success');
                        }

                        const slideTexts = (blockResult.videoSlides || []).map(s => s.spokenText).join(' ');
                        previousContext = `Blok ${blockNum}: ${slideTexts.substring(0, 200)}...`;

                        this.state.processedImageCount = i + 1;
                        await AssetManagerService.saveJobState(this.state);
                        addSystemLog(`Blok ${blockNum}/${totalImages} tamamlandı (${(blockResult.videoSlides || []).length} sahne).`, 'success');
                    }

                    // SENARYO KONTROLÜ: Başlıklar sayfası oluşturulsun mu?
                    const allBasliklar = this.state.script._allBasliklar || [];
                    const totalImages2 = queue.length;

                    if (allBasliklar.length >= 1 && queue.length > 1) {
                        // SENARYO 2 veya 3: TÜM başlıklardan ortak clickbait başlık oluştur
                        const allHeadlines = allBasliklar.map(b => b.baslik).join('. ');
                        try {
                            const clickbaitText = await callAI(
                                'Sen bir sosyal medya editörüsün. SADECE başlık üretirsin, başka metin yazmazsın.',
                                `Bu haber başlıklarından en etkileyici, clickbait bir tek başlık oluştur (maksimum 10 kelime, büyük harfler, sansasyonel):\n\n${allHeadlines}\n\nSADECE başlığı yaz.`,
                                { temperature: 0.9, max_tokens: 60 }
                            );
                            if (clickbaitText && clickbaitText.trim().length > 3) {
                                this.state.script.thumbnailText = trUpper(clickbaitText.trim());
                                addSystemLog(`Ortak clickbait başlık: "${clickbaitText}"`, 'success');
                            }
                        } catch (e) {
                            addSystemLog(`Clickbait API hatası: ${e.message}`, 'warn');
                        }
                        
                        // Fallback: API başarısız olursa başlıklardan clickbait oluştur
                        if (!this.state.script.thumbnailText || this.state.script.thumbnailText.length < 5) {
                            var headlines = allBasliklar.map(function(b) { return b.baslik; });
                            var longest = headlines.reduce(function(a, b) { return a.length > b.length ? a : b; }, '');
                            this.state.script.thumbnailText = trUpper(longest);
                            addSystemLog('Fallback clickbait: ' + longest, 'info');
                        }

                        // BAŞLIKLAR sayfası + her başlık için ayrı sahne
                        const sourceLabel = trUpper(this.state.config?.sourceName || 'Gazete');
                        const basliklarList = allBasliklar.slice(0, 10).map(b => b.baslik).join('. '); // Max 10 başlık
                        const ozetSpoken = `${sourceLabel} başlıklarında bugün ${allBasliklar.length} önemli başlık var. ${basliklarList}.`;

                        // BAŞLIKLAR sayfasını EN BAŞA ekle (thumbnail'dan sonra)
                        this.state.script.imageBlocks.unshift({
                            imageIndex: 0,
                            imageType: 'ai',
                            customImage: null,
                            videoSlides: [{
                                topText: `${sourceLabel} BAŞLIKLARI`,
                                spokenText: ozetSpoken,
                                imagePrompts: [this.state.script.thumbnailImagePrompt || 'Turkish newspaper front page'],
                                _isBasliklarList: true,
                                _basliklar: allBasliklar
                            }]
                        });

                        // Her başlık için ayrı sahne ekle
                        allBasliklar.forEach((baslik, idx) => {
                            this.state.script.imageBlocks.push({
                                imageIndex: 0,
                                imageType: 'custom',
                                customImage: (typeof queue[0]?.data === "string" ? queue[0]?.data : null) || (typeof queue[0]?.customImage === "string" ? queue[0]?.customImage : null),
                                videoSlides: [{
                                    topText: trUpper(baslik.baslik),
                                    spokenText: `${baslik.baslik}. ${baslik.aciklama}.`,
                                    imagePrompts: [],
                                    
                                }]
                            });
                        });

                        addSystemLog(`BAŞLIKLAR sayfası oluşturuldu: ${allBasliklar.length} başlık.`, 'success');
                    } else {
                        // SENARYO 1: Tek başlık, başka görsel yok → BAŞLIKLAR sayfası yok
                        addSystemLog('Tek başlık, BAŞLIKLAR sayfası atlandı.', 'info');
                    }

                    // Kaynaklar sahnesi oluştur (Son Söz'den önce) — haber modunda atla
                    if (this.state.config.tip !== 'haber' && this.state.script._kaynaklar && this.state.script._kaynaklar.length > 0) {
                        const kaynaklarText = this.state.script._kaynaklar.map(k => `${k.baslik}: ${k.url}`).join('\n');
                        const kaynaklarSpoken = "Kaynaklar ve referanslar. " + this.state.script._kaynaklar.map(k => k.baslik).join('. ') + ".";
                        this.state.script.imageBlocks.push({
                            imageIndex: 0,
                            imageType: 'ai',
                            customImage: null,
                            videoSlides: [{
                                topText: 'KAYNAKLAR',
                                spokenText: kaynaklarSpoken,
                                imagePrompts: ['A clean list of official sources and references on dark background'],
                                _isKaynaklar: true,
                                _kaynaklar: this.state.script._kaynaklar
                            }]
                        });
                        addSystemLog('Kaynaklar sahnesi eklendi.', 'success');
                    }

                    // Kaynaklar sahnesi (Son Söz'den önce)
                    if (this.state.script && this.state.script.iddialar && this.state.script.iddialar.length > 0) {
                        var allKaynaklar = [];
                        this.state.script.iddialar.forEach(function(iddia) {
                            if (iddia.kanitlar) {
                                iddia.kanitlar.forEach(function(k) {
                                    if (k.kaynak && allKaynaklar.indexOf(k.kaynak) === -1) {
                                        allKaynaklar.push(k.kaynak);
                                    }
                                });
                            }
                        });
                        if (allKaynaklar.length > 0) {
                            var kaynaklarSpoken = "Kaynaklar ve referanslar. " + allKaynaklar.join(". ") + ".";
                            this.state.script.imageBlocks.push({
                                imageIndex: 0, imageType: 'ai', customImage: null,
                                videoSlides: [{ topText: 'KAYNAKLAR', spokenText: kaynaklarSpoken, imagePrompts: ['A clean list of official sources and references on dark background, professional infographic style'] }]
                            });
                            addSystemLog('Kaynaklar sahnesi eklendi: ' + allKaynaklar.length + ' kaynak.', 'success');
                        }
                    }

                    // Tüm blokları düz videoSlides dizisine çevir// Tüm blokları düz videoSlides dizisine çevir (render için)
                    this.state.script.videoSlides = [];
                    for (const block of this.state.script.imageBlocks) {
                        this.state.script.videoSlides.push(...block.videoSlides);
                    }
                    addSystemLog(`INIT tamamlandı: ${this.state.script.imageBlocks.length} blok, ${this.state.script.videoSlides.length} sahne.`, 'success');
                    addSystemLog(`Blok detayları: ${this.state.script.imageBlocks.map((b, i) => `B${i + 1}=${b.videoSlides.length}s`).join(', ')}`, 'info');

                    this.state.status = 'GENERATING_ASSETS';
                    await AssetManagerService.saveJobState(this.state);
                }
            }
            if (this.state.status === 'GENERATING_ASSETS') {
                await this.updateProgress(30, 'Medya ve Sesler Sentezleniyor...', 'ASSETS');
                const imgStyle = this.state.config.imageStyle || 'cinematic'; const imgRes = this.state.config.resolution || '4K';

                if (this.state.script._isGuzelSoz) {
                    addSystemLog('Güzel söz modu: görseller ve ses üretiliyor...', 'info');
                    const slideCount = this.state.script._sceneCount || 3;
                    const quoteTextForImage = this.state.script.videoSlides[0]?.spokenText || "";
                    const emotionForImage = this.state.script._emotion || analyzeQuoteEmotion(quoteTextForImage);
                    const realUrls = this.state.script._realImageUrls || [];

                    for (let i = 0; i < slideCount; i++) {
                        const slide = this.state.script.videoSlides[i];
                        if (!this.state.assets.images[i]) {
                            try {
                                // Gerçek görsel varsa onu kullan (Atatürk vb.)
                                if (realUrls[i]) {
                                    addSystemLog(`  Görsel ${i + 1}: Gerçek görsel kullanılıyor...`, 'info');
                                    this.state.assets.images[i] = realUrls[i];
                                } else {
                                    this.state.assets.images[i] = await MediaSynthesisService.generateImage(
                                        slide.imagePrompts?.[0] || "Artistic background",
                                        imgStyle, imgRes, true, emotionForImage, quoteTextForImage
                                    );
                                }
                                addSystemLog(`  Görsel ${i + 1}/${slideCount} tamamlandı.`, 'success');
                            } catch (e) {
                                addSystemLog(`  Görsel ${i + 1} hatası, fallback kullanılıyor.`, 'warn');
                                this.state.assets.images[i] = this.state.assets.thumbnail;
                            }
                        }
                    }

                    if (!this.state.assets.audio[0]) {
                        this.state.assets.audio[0] = await MediaSynthesisService.generateAudio(
                            this.state.script.videoSlides[0].spokenText,
                            this.state.preferences.narratorVoice
                        );
                    }
                    if (!this.state.assets.thumbnail) this.state.assets.thumbnail = this.state.assets.images[0];

                    const allMusic = await AssetManagerService.getAllMusicFromLib();
                    if (allMusic.length > 0) {
                        const matchedTrack = matchMusicToEmotion(emotionForImage, allMusic);
                        const chosenTrack = matchedTrack || allMusic[Math.floor(Math.random() * allMusic.length)];
                        addSystemLog(`Müzik seçildi: ${chosenTrack.name} (duygu: ${emotionForImage})`, 'success');
                        this.state.script._bgmId = chosenTrack.id;
                        this.state.script._bgmName = chosenTrack.name;
                        this.state.preferences.ambientSound = chosenTrack.id;
                        this.state.preferences.customBgMusicName = chosenTrack.name;
                        this.state.preferences.customBgMusicId = chosenTrack.id;
                    } else {
                        addSystemLog('Müzik kütüphanesi boş, müzik eklenmedi.', 'warn');
                    }

                    await this.updateProgress(70, 'Güzel söz hazır...', 'ASSETS');
                } else {
                if (!this.state.assets.thumbnail) { addSystemLog('Kapak resmi çizimi...', 'info'); this.state.assets.thumbnail = await MediaSynthesisService.generateImage(this.state.script.thumbnailImagePrompt || "Dramatic news event", imgStyle, imgRes); addSystemLog('Kapak resmi tamamlandı.', 'success'); }

                const customImages = this.state.config.customSceneImages || [];
                this.state.customImageCount = customImages.length;

                // Sabit görsel SADECE bloğun 1. sahnesine atanır (S1 gösterimi)
                // 2. ve 3. sahneler AI tarafından üretilir (M1'i anlatan görseller)
                const blocks = this.state.script.imageBlocks || [];
                let globalIdx = 0;
                for (let b = 0; b < blocks.length; b++) {
                    const block = blocks[b];
                    const blockSlideCount = block.videoSlides.length;
                    const blockCustomImg = block.customImage || customImages[b];
                    if (block.imageType === 'custom' && blockCustomImg) {
                        this.state.assets.images[globalIdx] = blockCustomImg;
                        addSystemLog(`Blok ${b + 1}: Sabit görsel 1. sahneye atandı. Kalan ${blockSlideCount - 1} sahne AI üretilecek.`, 'info');
                    }
                    globalIdx += blockSlideCount;
                }

                const CHUNK_SIZE = 3;
                addSystemLog(`ASSETS fase: ${this.state.script.videoSlides.length} sahne, ${CHUNK_SIZE}'lü chunk.`, 'info');
                for (let i = 0; i < this.state.script.videoSlides.length; i += CHUNK_SIZE) {
                    const chunk = this.state.script.videoSlides.slice(i, i + CHUNK_SIZE);
                    addSystemLog(`Sahneler ${i + 1}-${Math.min(i + CHUNK_SIZE, this.state.script.videoSlides.length)} işleniyor...`, 'info');
                    const chunkPromises = chunk.map(async (slide, idx) => {
                        const actualIndex = i + idx;
                        const computedPrompt = slide.imagePrompts?.[0] || slide.topText || slide.spokenText || "News event";
                        const imgPromise = this.state.assets.images[actualIndex] ? Promise.resolve(this.state.assets.images[actualIndex]) : MediaSynthesisService.generateImage(computedPrompt, imgStyle, imgRes).then(res => res || this.state.assets.thumbnail);
                        const audPromise = this.state.assets.audio[actualIndex] ? Promise.resolve(this.state.assets.audio[actualIndex]) : MediaSynthesisService.generateAudio(slide.spokenText, this.state.preferences.narratorVoice);
                        const [imgResData, audResData] = await Promise.all([imgPromise, audPromise]);
                        this.state.assets.images[actualIndex] = imgResData;
                        this.state.assets.audio[actualIndex] = audResData;
                    });
                    await Promise.all(chunkPromises);
                    const currentProgress = Math.min(i + CHUNK_SIZE, this.state.script.videoSlides.length);
                    await this.updateProgress(40 + (currentProgress / this.state.script.videoSlides.length) * 30, `Sahneler ${currentProgress}/${this.state.script.videoSlides.length}...`, 'ASSETS');
                }
                }

                const extraAudioPromises = [];
                // Clickbait seslendirme
                if (!this.state.assets.thumbnailAudio) {
                    // Clickbait seslendirme: tarih + kaynak adı + başlık
                    const now = new Date();
                    const dateLocale = ({ tr:'tr-TR', en:'en-US', fr:'fr-FR', de:'de-DE', es:'es-ES', ar:'ar-SA', ru:'ru-RU' })[this.state.config?.language || 'tr'] || 'tr-TR';
                    const dateStr = now.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
                    const dayStr = now.toLocaleDateString(dateLocale, { weekday: 'long' });
                    const sourceName = this.state.config?.sourceName || '';
                    const headline = this.state.script.thumbnailText || '';
                    const clickbaitText = [dateStr + " " + dayStr, sourceName, headline].filter(Boolean).join('. ') + '.';
                    extraAudioPromises.push(MediaSynthesisService.generateAudio(clickbaitText, this.state.preferences.narratorVoice).then(res => { this.state.assets.thumbnailAudio = res; addSystemLog('Clickbait seslendirme hazır: ' + clickbaitText.substring(0, 60) + '...', 'success'); }));
                }
                if (!this.state.script._isGuzelSoz) {
                    if (this.state.script.sonSoz && !this.state.assets.sonSozAudio) extraAudioPromises.push(MediaSynthesisService.generateAudio(this.state.script.sonSoz, this.state.preferences.narratorVoice).then(res => { this.state.assets.sonSozAudio = res; }));
                    if (this.state.config.yorum && this.state.config.yorum.trim() && !this.state.assets.yorumAudio) extraAudioPromises.push(MediaSynthesisService.generateAudio(this.state.config.yorum, this.state.preferences.narratorVoice).then(res => { this.state.assets.yorumAudio = res; }));
                    if (!this.state.assets.outroAudio) {
                        const quotePrefix = this.state.script.lastQuote ? `${this.state.script.lastQuote} ` : "";
                        let defaultOutroText = "Abone olmayı, beğenmeyi ve paylaşmayı ihmal etmeyin.";
                        if (this.state.config.language === 'en') defaultOutroText = "Don't forget to subscribe, like, and share.";
                        else if (this.state.config.language === 'fr') defaultOutroText = "N'oubliez pas de vous abonner, d'aimer et de partager.";
                        else if (this.state.config.language === 'de') defaultOutroText = "Vergessen Sie nicht zu abonnieren, zu liken und zu teilen.";
                        else if (this.state.config.language === 'es') defaultOutroText = "No olvides suscribirte, dar me gusta y compartir.";
                        else if (this.state.config.language === 'ar') defaultOutroText = "لا تنس الاشتراك والإعجاب والمشاركة.";
                        else if (this.state.config.language === 'ru') defaultOutroText = "Не забудьте подписаться, поставить лайк.";
                        extraAudioPromises.push(MediaSynthesisService.generateAudio(`${quotePrefix}${defaultOutroText}`, this.state.preferences.narratorVoice).then(res => { this.state.assets.outroAudio = res; }));
                    }
                }
                await Promise.all(extraAudioPromises);
                const imgCount = this.state.assets.images.filter(Boolean).length;
                const audCount = this.state.assets.audio.filter(Boolean).length;
                addSystemLog(`ASSETS tamamlandı: ${imgCount}/${this.state.script.videoSlides.length} görsel, ${audCount}/${this.state.script.videoSlides.length} ses.`, imgCount === this.state.script.videoSlides.length ? 'success' : 'warn');
                this.state.status = 'READY_TO_RENDER';
                await AssetManagerService.saveJobState(this.state);
            }
            if (this.state.status === 'READY_TO_RENDER') {
                await this.updateProgress(80, 'Video Paketleniyor...', 'RENDER');
                const renderResult = await RenderWorkerService.executeRender(this.state, canvasRef.current, this.state.preferences);
                this.state.status = 'COMPLETED'; this.state.videoUrl = typeof renderResult === 'string' ? renderResult : renderResult.url;
                await AssetManagerService.saveJobState(this.state); await AssetManagerService.clearJob(this.jobId);
                sysEventBus.emit('WORKFLOW_STATE', { status: 'COMPLETED', job: this.state });
                try { exportWorkflowLog(this.state); } catch (e) { console.warn('Log export hatası:', e); }
                return this.state.videoUrl;
            }
        } catch (e) { this.state.status = 'FAILED'; this.state.error = e.message; await AssetManagerService.saveJobState(this.state); sysEventBus.emit('WORKFLOW_STATE', { status: 'FAILED', job: this.state }); throw e; }
    }
}

const VOICE_OPTIONS = [
    { id: 'Aoede', label: 'Aoede', gender: 'Female', age: 'Young', category: 'Corporate & Narration' },
    { id: 'Puck', label: 'Puck', gender: 'Male', age: 'Child', category: 'Anime & Animation' },
    { id: 'Kore', label: 'Kore', gender: 'Female', age: 'Middle-aged', category: 'Documentary' },
    { id: 'Charon', label: 'Charon', gender: 'Male', age: 'Elderly', category: 'Audiobooks & Novels' },
    { id: 'Zephyr', label: 'Zephyr', gender: 'Male', age: 'Young', category: 'Commercials & Trailers' },
    { id: 'Fenrir', label: 'Fenrir', gender: 'Male', age: 'Middle-aged', category: 'Games & RPG' },
    { id: 'Leda', label: 'Leda', gender: 'Female', age: 'Middle-aged', category: 'Corporate & Narration' },
    { id: 'Orus', label: 'Orus (Erkek - Resmi)', gender: 'Male', age: 'Middle-aged', category: 'Documentary' }
];

const CustomSelect = ({ value, onChange, options, icon: Icon, className }) => {
    const [isOpen, setIsOpen] = useState(false); const ref = useRef(null);
    useEffect(() => { const handleClickOutside = (event) => { if (ref.current && !ref.current.contains(event.target)) setIsOpen(false); }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);
    const getSelectedLabel = () => { for (const opt of options) { if (opt.options) { const found = opt.options.find(o => o.value === value); if (found) return found.label; } else if (opt.value === value) return opt.label; } return value; };
    const getSelectedColor = () => { for (const opt of options) { if (opt.options) { const found = opt.options.find(o => o.value === value); if (found?.color) return found.color; } else if (opt.value === value && opt.color) return opt.color; } return 'text-white'; };
    return (
        <div ref={ref} className={`relative flex items-center w-full ${className || ''}`} onClick={() => setIsOpen(!isOpen)}>
            {Icon && <Icon size={18} className="text-indigo-400 shrink-0 mr-3" />}
            <div className={`flex-1 flex items-center justify-between text-sm font-bold cursor-pointer truncate ${getSelectedColor()}`}>
                <span className="truncate pr-2">{getSelectedLabel()}</span>
                <ChevronDown size={16} className={`transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''} text-slate-400`} />
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-[200] max-h-64 overflow-y-auto py-1">
                    {options.map((opt, idx) => {
                        if (opt.options) {
                            return (<div key={idx}>{opt.label && <div className="px-3 py-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">{opt.label}</div>}{opt.options.map(subOpt => (<div key={subOpt.value} className={`px-3 py-2 text-sm cursor-pointer transition-colors ${value === subOpt.value ? 'bg-blue-600 text-white' : `hover:bg-blue-600 hover:text-white ${subOpt.color || 'text-slate-200'}`}`} onClick={(e) => { e.stopPropagation(); onChange(subOpt.value); setIsOpen(false); }}>{subOpt.label}</div>))}</div>);
                        }
                        return (<div key={opt.value} className={`px-3 py-2 text-sm cursor-pointer transition-colors ${value === opt.value ? 'bg-blue-600 text-white' : `hover:bg-blue-600 hover:text-white ${opt.color || 'text-slate-200'}`}`} onClick={(e) => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); }}>{opt.label}</div>);
                    })}
                </div>
            )}
        </div>
    );
};

// ============================================================================
// MAIN APP — VOLUME MIXER & REFERENCE IMAGE SECTIONS REMOVED
// ============================================================================
export default function App() {
    const [user, setUser] = useState(null);
    const [authExpired, setAuthExpired] = useState(false);
    const isLoadedRef = useRef(false);
    const logEndRef = useRef(null);
    const musicFileInputRef = useRef(null);

    const [activeTab, setActiveTab] = useState(() => { const saved = SafeStorage.getItem('ns_activeTab'); return saved === 'image' ? 'media' : (saved || 'media'); });
    const [textInput, setTextInput] = useState(() => SafeStorage.getItem('ns_textInput') || '');

    // === GAZETE TAKİP STATE ===
    const [gazeteItems, setGazeteItems] = useState([]);           // gazete manşet listesi
    const [gazeteLoading, setGazeteLoading] = useState(false);    // yükleme durumu
    const [gazeteError, setGazeteError] = useState('');            // hata mesajı
    const [gazeteCropModal, setGazeteCropModal] = useState(null); // {src, name} — crop açık mı
    const [gazeteSource, setGazeteSource] = useState('gazeteoku'); // kaynak site
    const gazeteCanvasRef = useRef(null);                          // crop canvas ref

    const [config, setConfig] = useState(() => {
        const savedConfig = JSON.parse(SafeStorage.getItem('ns_config')) || {};
        return { duration: '30', aspectRatio: '9:16', videoStyle: 'cinematic', fontStyle: 'modern', imageStyle: 'watercolor', language: 'tr', subtitles: 'on', resolution: '4K', transition: 'none', outputType: 'video', analysisMode: 'yorumsuz', videoFormat: 'mp4', tip: 'haber', sourceName: '', yorum: '', ...savedConfig };
    });

    const [prefs, setPrefs] = useState(() => {
        const savedPrefs = JSON.parse(SafeStorage.getItem('ns_prefs')) || {};
        return { narratorVoice: 'Charon', narratorVolume: 0.8, backgroundMusicVolume: 0.3, ambientSound: 'none', customBgMusicName: '', customBgMusicId: '', ...savedPrefs };
    });

    const [voiceFilters, setVoiceFilters] = useState(() => { const saved = JSON.parse(SafeStorage.getItem('ns_voiceFilters')) || {}; return { gender: 'Any', age: 'Any', category: 'Any', ...saved }; });
    const [showFilters, setShowFilters] = useState(false);
    const [sysLogs, setSysLogs] = useState([]);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [pendingJob, setPendingJob] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const filteredVoices = VOICE_OPTIONS.filter(v => {
        if (voiceFilters.gender !== 'Any' && v.gender !== voiceFilters.gender) return false;
        if (voiceFilters.age !== 'Any' && v.age !== voiceFilters.age) return false;
        if (voiceFilters.category !== 'Any' && v.category !== voiceFilters.category) return false;
        return true;
    });

    useEffect(() => { if (filteredVoices.length > 0 && !filteredVoices.find(v => v.id === prefs.narratorVoice)) setPrefs(p => ({ ...p, narratorVoice: filteredVoices[0].id })); }, [voiceFilters]);

    const [uiState, setUiState] = useState({ isProcessing: false, statusText: '', percent: 0, error: '', videoUrl: null, showDevMenu: false, selectedMediaFiles: [] });

    // NVIDIA API key + model (sessionStorage'da tutulur, kodda hardcoded değil)
    const [apiKeyInput, setApiKeyInput] = useState(() => getApiKey());
    const [nvidiaModel, setNvidiaModel] = useState(() => NV_MODEL);
    const [showApiKeyPanel, setShowApiKeyPanel] = useState(() => !getApiKey());
    const saveApiKey = () => {
        setApiKey(apiKeyInput.trim());
        const m = nvidiaModel.trim() || NV_MODEL;
        setNvidiaModel(m);
        addSystemLog('NVIDIA API anahtarı kaydedildi.', 'success');
        setShowApiKeyPanel(false);
    };

    const [studioMedia, setStudioMedia] = useState({ outroUrl: null, musicLoaded: false, musicName: '', musicId: '', musicList: [], customSceneImages: [], isLoading: true, statusMsg: 'Bulut Kontrol Ediliyor...', syncedFolderName: '' });
    const [musicSearchQuery, setMusicSearchQuery] = useState('');

    const canvasRef = useRef(null);
    const workflowRef = useRef(new WorkflowCoordinator());
    const _previewAudioRef = useRef(null); // Müzik önizleme için audio ref

    const getTargetSeconds = (dur) => { if (dur === 'unlimited') return 0; if (dur === '15') return 30; if (dur === '30') return 60; if (dur === '60') return 90; if (dur === '90') return 120; return 60; };
    const targetSecUI = getTargetSeconds(config.duration);
    const maxWordsUI = config.duration === 'unlimited' ? 'Sınırsız' : Math.floor((targetSecUI - 1.5) * getWPS(config.language));

    const ambientOptions = [
        { value: 'none', label: '🔇 Arka Ses Yok', color: 'text-slate-300' },
        { label: 'Atmosfer', options: [
            { value: 'rain', label: '🌧️ Yağmur', color: 'text-blue-300' },
            { value: 'wind', label: '🌬️ Rüzgar', color: 'text-slate-300' },
            { value: 'waves', label: '🌊 Dalgalar', color: 'text-cyan-300' },
            { value: 'fire', label: '🔥 Şömine', color: 'text-orange-300' },
        ]}
    ];
    // Yerel müzikler (IndexedDB'den)
    const filteredMusicList = studioMedia.musicList.filter(m => !musicSearchQuery || m.name.toLowerCase().includes(musicSearchQuery.toLowerCase()));
    if (filteredMusicList.length > 0) ambientOptions.push({ label: 'Müziklerim', options: filteredMusicList.map(m => ({ value: m.id, label: `🎵 ${m.name.replace(/\.[^.]+$/, '')}`, color: 'text-violet-400' })) });
    // Google Drive müzikleri (hardcode listesi)
    const filteredGDMusic = GOOGLE_DRIVE_MUSIC.filter(m => !musicSearchQuery || m.name.toLowerCase().includes(musicSearchQuery.toLowerCase()));
    if (filteredGDMusic.length > 0) ambientOptions.push({ label: `☁️ Google Drive (${filteredGDMusic.length})`, options: filteredGDMusic.map(m => ({ value: `gd_${m.id}`, label: `🎶 ${m.name}`, color: 'text-emerald-400' })) });

    const voiceOptions = [
        { value: 'none', label: '🔇 Ses Yok', color: 'text-rose-400 font-bold' },
        ...filteredVoices.map(v => ({ value: v.id, label: v.label }))
    ];
    if (filteredVoices.length === 0) voiceOptions.push({ value: '', label: 'Kriter Uyumsuz', color: 'text-slate-500' });

    const SOCIAL_PLATFORMS = [
        { id: 'x', name: 'X (Twitter)', color: '#1DA1F2', loginUrl: 'https://x.com/login', shareUrl: 'https://x.com/intent/post' },
        { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', loginUrl: 'https://www.linkedin.com/login', shareUrl: 'https://www.linkedin.com/feed/compose/' },
        { id: 'facebook', name: 'Facebook', color: '#1877F2', loginUrl: 'https://www.facebook.com/login', shareUrl: 'https://www.facebook.com/sharer/sharer.php' },
        { id: 'instagram', name: 'Instagram', color: '#E4405F', loginUrl: 'https://www.instagram.com/accounts/login/', shareUrl: 'https://www.instagram.com/' },
        { id: 'tiktok', name: 'TikTok', color: '#000000', loginUrl: 'https://www.tiktok.com/login', shareUrl: 'https://www.tiktok.com/' },
        { id: 'pinterest', name: 'Pinterest', color: '#BD081C', loginUrl: 'https://pinterest.com/login/', shareUrl: 'https://pinterest.com/pin/create/button/' },
        { id: 'bluesky', name: 'Bluesky', color: '#0085FF', loginUrl: 'https://bsky.app/', shareUrl: 'https://bsky.app/' }
    ];
    const [connectedPlatforms, setConnectedPlatforms] = useState(() => {
        const saved = JSON.parse(SafeStorage.getItem('ns_connectedPlatforms')) || {};
        return saved;
    });
    const [shareTargets, setShareTargets] = useState(() => {
        const saved = JSON.parse(SafeStorage.getItem('ns_shareTargets')) || {};
        return saved;
    });
    const [showSharePanel, setShowSharePanel] = useState(false);
    const togglePlatform = (platformId) => {
        setConnectedPlatforms(prev => {
            const next = { ...prev, [platformId]: !prev[platformId] };
            SafeStorage.setItem('ns_connectedPlatforms', JSON.stringify(next));
            if (!next[platformId]) setShareTargets(prev => { const n = { ...prev }; delete n[platformId]; SafeStorage.setItem('ns_shareTargets', JSON.stringify(n)); return n; });
            return next;
        });
    };
    const toggleShareTarget = (platformId) => {
        setShareTargets(prev => {
            const next = { ...prev, [platformId]: !prev[platformId] };
            SafeStorage.setItem('ns_shareTargets', JSON.stringify(next));
            return next;
        });
    };
    const openPlatformConnect = (platform) => {
        const popup = window.open(platform.loginUrl, platform.name, 'width=600,height=700,scrollbars=yes');
        addSystemLog(`${platform.name} giriş sayfası açıldı. Oturum açın, otomatik olarak bağlanacaksınız.`, 'info');
        const checker = setInterval(() => {
            try {
                if (popup.closed) {
                    clearInterval(checker);
                    togglePlatform(platform.id);
                    addSystemLog(`${platform.name} bağlantısı tamamlandı!`, 'success');
                }
            } catch (e) { clearInterval(checker); }
        }, 800);
    };

    // Seçili platformlarda sıralı paylaşım (popup blocker azaltır)
    const shareToSelectedPlatforms = async () => {
        const title = workflowRef.current?.state?.script?.thumbnailText || 'Video';
        // Hiç platform seçilmemişse hepsini paylaş
        const hasSelection = Object.values(shareTargets).some(v => v);
        const selected = hasSelection 
            ? SOCIAL_PLATFORMS.filter(p => shareTargets[p.id])
            : SOCIAL_PLATFORMS;
        
        if (selected.length === 0) { 
            addSystemLog("Paylaşılacak platform bulunamadı!", 'warn'); 
            return; 
        }
        
        addSystemLog(`${selected.length} platformda paylaşım açılıyor...`, 'info');
        
        for (let i = 0; i < selected.length; i++) {
            const platform = selected[i];
            let url = '';
            
            // blob URL paylaşılamaz, sadece başlık paylaşılır
            if (platform.id === 'x') 
                url = `https://x.com/intent/post?text=${encodeURIComponent(title)}`;
            else if (platform.id === 'linkedin') {
                // LinkedIn API ile doğrudan paylaşım
                try {
                    addSystemLog('LinkedIn API ile paylaşılıyor...', 'info');
                    const result = await shareToLinkedInAPI(title);
                    addSystemLog('LinkedIn\'de paylaşıldı! ✅', 'success');
                    if (i < selected.length - 1) await new Promise(r => setTimeout(r, 500));
                    continue; // popup açma, API ile paylaşıldı
                } catch (e) {
                    addSystemLog('LinkedIn API hatası, compose açılıyor: ' + e.message, 'warn');
                    url = `https://www.linkedin.com/feed/compose/?text=${encodeURIComponent(title)}`;
                }
            }
            else if (platform.id === 'pinterest') 
                url = `https://pinterest.com/pin/create/button/?description=${encodeURIComponent(title)}`;
            else if (platform.id === 'bluesky') 
                url = `https://bsky.app/intent/compose?text=${encodeURIComponent(title)}`;
            else if (platform.id === 'facebook') 
                url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(title)}`;
            else if (platform.id === 'instagram') 
                url = 'https://www.instagram.com/';
            else if (platform.id === 'tiktok') 
                url = 'https://www.tiktok.com/upload';
            
            if (url) {
                window.open(url, platform.name, 'width=700,height=700');
                if (i < selected.length - 1) await new Promise(r => setTimeout(r, 500));
            }
        }
        
        addSystemLog(`${selected.length} platform açıldı. Videoyu manuel olarak yükleyin.`, 'success');
    };

    // Linki clipboard'a kopyala (sadece başlık, blob URL paylaşılamaz)
    // Otomatik video kaydetme (direk indirme, dosya adı = haber başlığı)
    const autoSaveVideo = async (videoUrl, title, videoFormat) => {
        if (!videoUrl || !videoUrl.startsWith('blob:')) {
            addSystemLog('Geçersiz video URL, kaydetme atlandı.', 'warn');
            return;
        }

        addSystemLog('Video kaydediliyor...', 'info');

        try {
            const response = await fetch(videoUrl);
            const blob = await response.blob();
            // Uzantı: config'deki videoFormat tercih et, yoksa blob type'dan algıla
            const ext = videoFormat === 'mp4' ? '.mp4' : (blob.type.includes('mp4') ? '.mp4' : '.webm');
            const safeName = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "_").toLowerCase();
            const fileName = `${safeName}${ext}`;

            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
            addSystemLog(`Video indirildi: ${fileName}`, 'success');
        } catch (e) {
            addSystemLog('Video indirme hatası: ' + e.message, 'error');
        }
    };

    const copyShareLink = async () => {
        const title = workflowRef.current?.state?.script?.thumbnailText || 'Video';
        try {
            await navigator.clipboard.writeText(title);
            addSystemLog('Başlık panoya kopyalandı!', 'success');
        } catch (e) {
            const textarea = document.createElement('textarea');
            textarea.value = title;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            addSystemLog('Başlık panoya kopyalandı!', 'success');
        }
    };

    // Native share (mobilde cihaz paylaşımı - sadece başlık)
    const nativeShare = async () => {
        const title = workflowRef.current?.state?.script?.thumbnailText || 'Video';
        try {
            await navigator.share({ title: title, text: title });
            addSystemLog('Paylaşım tamamlandı!', 'success');
        } catch (e) {
            if (e.name !== 'AbortError') addSystemLog('Paylaşım hatası: ' + e.message, 'error');
        }
    };

    const shareToPlatform = async (platform, title, videoUrl) => {
        let url = '';
        if (platform.id === 'x') { url = `https://x.com/intent/post?text=${encodeURIComponent(title + ' ' + videoUrl)}`; }
        else if (platform.id === 'linkedin') {
            // LinkedIn API ile doğrudan paylaşım
            try {
                addSystemLog('LinkedIn API ile paylaşılıyor...', 'info');
                await shareToLinkedInAPI(title);
                addSystemLog('LinkedIn\'de paylaşıldı! ✅', 'success');
                return; // popup açma
            } catch (e) {
                addSystemLog('LinkedIn API hatası, compose açılıyor: ' + e.message, 'warn');
                url = `https://www.linkedin.com/feed/compose/?text=${encodeURIComponent(title)}`;
            }
        }
        else if (platform.id === 'facebook') { url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(title)}&u=${encodeURIComponent(videoUrl)}`; }
        else if (platform.id === 'pinterest') { url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(videoUrl)}&description=${encodeURIComponent(title)}`; }
        else if (platform.id === 'tiktok') { url = 'https://www.tiktok.com/upload'; }
        else if (platform.id === 'instagram') { url = 'https://www.instagram.com/'; }
        else if (platform.id === 'bluesky') { url = `https://bsky.app/intent/compose?text=${encodeURIComponent(title + ' ' + videoUrl)}`; }
        if (url) window.open(url, '_blank', 'width=700,height=700');
    };

    useEffect(() => { SafeStorage.setItem('ns_activeTab', activeTab); }, [activeTab]);
    useEffect(() => { SafeStorage.setItem('ns_textInput', textInput); }, [textInput]);
    useEffect(() => { SafeStorage.setItem('ns_config', JSON.stringify(config)); }, [config]);
    useEffect(() => { SafeStorage.setItem('ns_prefs', JSON.stringify(prefs)); }, [prefs]);
    useEffect(() => { SafeStorage.setItem('ns_voiceFilters', JSON.stringify(voiceFilters)); }, [voiceFilters]);

    useEffect(() => { let interval; if (uiState.isProcessing) { setElapsedSeconds(0); const start = performance.now(); interval = setInterval(() => { setElapsedSeconds(((performance.now() - start) / 1000).toFixed(1)); }, 100); } else clearInterval(interval); return () => clearInterval(interval); }, [uiState.isProcessing]);

    useEffect(() => {
        sysEventBus.on('SYS_LOG_ADD', (log) => setSysLogs(prev => [...prev, log]));
        sysEventBus.on('SYS_LOG_CLEAR', () => sysEventBus.emit('SYS_LOG_CLEAR_DONE'));
        sysEventBus.on('SYS_LOG_CLEAR_DONE', () => setSysLogs([]));
        sysEventBus.on('PROGRESS', (data) => { const p = Math.min(100, Math.max(0, Math.round(data.percent || 0))); setUiState(prev => ({ ...prev, percent: p, statusText: data.text || prev.statusText })); });
        sysEventBus.on('WORKFLOW_STATE', (data) => {
            if (data.status === 'FAILED') setUiState(prev => ({ ...prev, isProcessing: false, error: data.job.error }));
            if (data.status === 'COMPLETED') {
                setUiState(prev => ({ ...prev, isProcessing: false, percent: 100, statusText: 'Tamamlandı!', videoUrl: data.job.videoUrl }));
                // Otomatik video + log indir (H1.141)
                autoSaveVideo(data.job.videoUrl, data.job.script?.thumbnailText || 'video', data.job.config?.videoFormat);
                try { exportWorkflowLog(data.job); } catch (e) { console.warn('Log export hatası:', e); }
            }
        });
        sysEventBus.on('AUTH_EXPIRED', () => setAuthExpired(true));
    }, []);

    useEffect(() => { if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [sysLogs]);

    useEffect(() => {
        const loadLocalMusic = async () => {
            try {
                // Sunucu otomatik algılama
                const detectedUrl = await getMusicProxyUrl();
                if (detectedUrl) addSystemLog(`Sunucu bulundu: ${detectedUrl}`, 'success');
                else addSystemLog('Müzik proxy sunucusu bulunamadı — CORS proxy kullanılacak', 'warn');

                // Google Drive klasöründen müzikleri otomatik keşfet
                const gdCount = await fetchGoogleDriveMusic();
                addSystemLog(`Google Drive: ${gdCount} müzik bulundu.`, 'info');

                const allMusic = await AssetManagerService.getAllMusicFromLib();
                setStudioMedia(s => ({ ...s, musicList: [...allMusic], isLoading: false, statusMsg: 'Yerel Mod' }));
                if (allMusic.length > 0) {
                    addSystemLog(`${allMusic.length} müzik IndexedDB'den yüklendi.`, 'success');
                } else {
                    addSystemLog("Müzik kütüphanesi boş. Klasör seçerek müzik ekleyin.", 'info');
                }
                // Varsayılan müzik seçimi: müzik varsa ve hiçbiri seçili değilse ilk müziği seç
                const savedPrefs = JSON.parse(SafeStorage.getItem('ns_prefs')) || {};
                if (allMusic.length > 0 && (!savedPrefs.ambientSound || savedPrefs.ambientSound === 'none')) {
                    const firstTrack = allMusic[0];
                    setPrefs(p => ({ ...p, ambientSound: firstTrack.id, customBgMusicName: firstTrack.name, customBgMusicId: firstTrack.id }));
                    addSystemLog(`Otomatik seçim: ${firstTrack.name}`, 'info');
                }
                if (savedPrefs.ambientSound && !['none', 'rain', 'wind', 'waves', 'fire'].includes(savedPrefs.ambientSound)) {
                    const track = allMusic.find(m => m.id === savedPrefs.ambientSound);
                    if (track && track.data) {
                        const raw = track.data.includes(',') ? track.data.split(',')[1] : track.data;
                        const byteString = atob(raw);
                        const ab = new ArrayBuffer(byteString.length);
                        const ia = new Uint8Array(ab);
                        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                        const blob = new Blob([ab], { type: 'audio/mpeg' });
                        const url = URL.createObjectURL(blob);
                        await AssetManagerService.saveMedia('CUSTOM_MUSIC', url);
                    }
                }
                const savedDir = await AssetManagerService.getDirHandle();
                if (savedDir && savedDir.handle) {
                    try {
                        const permission = await savedDir.handle.requestPermission({ mode: 'read' });
                        if (permission === 'granted') {
                            addSystemLog(`Otomatik müzik senkronizasyonu: ${savedDir.name}`, 'info');
                            const currentMusic = await AssetManagerService.getAllMusicFromLib();
                            const newCount = await syncMusicFromDir(savedDir.handle, currentMusic);
                            if (newCount > 0) {
                                const updated = await AssetManagerService.getAllMusicFromLib();
                                setStudioMedia(s => ({ ...s, musicList: updated }));
                                addSystemLog(`${newCount} yeni müzik otomatik eklendi. Toplam: ${updated.length}`, 'success');
                            }
                        }
                    } catch (e) {
                        console.warn("Otomatik senkronizasyon hatası:", e);
                    }
                }
            } catch (e) { setStudioMedia(s => ({ ...s, isLoading: false, statusMsg: 'Yerel Mod' })); }
        };
        loadLocalMusic();
    }, []);

    const saveToFirestore = async (updates) => { if (!user || !isFirebaseActive) return; try { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'user_assets', 'main'), updates, { merge: true }); } catch (error) { if (!error.message?.includes('offline')) console.warn("Firestore kayıt hatası"); } };
    const uploadChunks = async (prefix, b64Data) => { if (!user || !isFirebaseActive) return 0; const chunkSize = 800000; const chunksCount = Math.ceil(b64Data.length / chunkSize); try { for (let i = 0; i < chunksCount; i++) { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'asset_chunks', `${prefix}_${i}`), { data: b64Data.substring(i * chunkSize, (i + 1) * chunkSize), index: i }); } return chunksCount; } catch (e) { return 0; } };
    const downloadChunks = async (prefix, chunksCount) => { if (!user || !isFirebaseActive) return null; let b64Data = ""; try { for (let i = 0; i < chunksCount; i++) { let chunkSnap = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'asset_chunks', `${prefix}_${i}`)); if (!chunkSnap.exists()) chunkSnap = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'music_chunks', `${prefix}_${i}`)); if (chunkSnap.exists()) b64Data += chunkSnap.data().data; else return null; } return b64Data; } catch (e) { return null; } };

    useEffect(() => {
        if (!isFirebaseActive) { return; }
        const initAuth = async () => { try { if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token); else await signInAnonymously(auth); } catch (e) { } };
        initAuth();
        const unsubAuth = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u && !isLoadedRef.current) {
                try { const snap = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'user_assets', 'settings')); if (snap.exists()) { const d = snap.data(); if (d.config) setConfig(c => ({ ...c, ...d.config })); if (d.prefs) { if (!d.prefs.ambientSound) d.prefs.ambientSound = d.selectedBgmId || 'none'; setPrefs(p => ({ ...p, ...d.prefs })); } if (d.voiceFilters) setVoiceFilters(f => ({ ...f, ...d.voiceFilters })); if (d.activeTab) setActiveTab(d.activeTab); if (d.textInput) setTextInput(d.textInput); } } catch (e) { }
                isLoadedRef.current = true;
            }
        });
        return () => unsubAuth();
    }, []);

    useEffect(() => {
        if (!user || !isFirebaseActive || !isLoadedRef.current) return;
        const timer = setTimeout(() => { try { setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'user_assets', 'settings'), { config, prefs, voiceFilters, activeTab, textInput, lastUpdated: Date.now() }, { merge: true }).catch(() => { }); } catch (e) { } }, 800);
        return () => clearTimeout(timer);
    }, [config, prefs, voiceFilters, activeTab, textInput, user]);

    useEffect(() => {
        if (!user || !isFirebaseActive) { setStudioMedia(s => ({ ...s, isLoading: false, statusMsg: 'Yerel Mod' })); return; }
        const preloadLocal = async () => {
            const localOutro = await AssetManagerService.loadMedia('CUSTOM_OUTRO');
            const csi = [];
            for (let i = 0; i < 999; i++) { const img = await AssetManagerService.loadMedia("CUSTOM_SCENE_IMG_" + i); if (img) csi.push(img); }
            const allMusics = await AssetManagerService.getAllMusicFromLib();
            const savedDir = await AssetManagerService.getDirHandle();
            setStudioMedia(s => ({ ...s, outroUrl: s.outroUrl || localOutro, musicList: s.musicList.length > 0 ? s.musicList : allMusics, customSceneImages: csi, isLoading: false, statusMsg: localOutro ? 'Yerel Bellek Aktif' : s.statusMsg, syncedFolderName: savedDir?.name || '' }));
            if (savedDir && savedDir.handle) {
                try {
                    const permission = await savedDir.handle.requestPermission({ mode: 'read' });
                    if (permission === 'granted') {
                        addSystemLog(`Otomatik müzik senkronizasyonu: ${savedDir.name}`, 'info');
                        const newCount = await syncMusicFromDir(savedDir.handle, allMusics);
                        if (newCount > 0) {
                            const updated = await AssetManagerService.getAllMusicFromLib();
                            setStudioMedia(s => ({ ...s, musicList: updated }));
                            addSystemLog(`${newCount} yeni müzik otomatik eklendi. Toplam: ${updated.length}`, 'success');
                        } else {
                            addSystemLog(`Müzikler senkronize. Toplam: ${allMusics.length}`, 'success');
                        }
                    } else {
                        addSystemLog("Klasör izni yenilenemedi, elle seçim gerekiyor.", 'warn');
                        await AssetManagerService.removeDirHandle();
                    }
                } catch (e) {
                    console.warn("Otomatik senkronizasyon hatası:", e);
                    addSystemLog("Otomatik senkronizasyon başarısız.", 'warn');
                }
            }
        };
        preloadLocal();
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'user_assets', 'main');
        const unsubscribe = onSnapshot(docRef, async (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                let updates = {};
                // Müzik listesini SADECE yerelde müzik yoksa Firebase'den yükle (overwrite önleme)
                const localMusicCount = (await AssetManagerService.getAllMusicFromLib()).length;
                if (localMusicCount === 0 && data.bgmList && data.bgmList.length > 0) {
                    updates.musicList = data.bgmList;
                    addSystemLog(`Firebase'den ${data.bgmList.length} müzik senkronize edildi.`, 'info');
                }
                let localOutro = await AssetManagerService.loadMedia('CUSTOM_OUTRO');
                if (data.outroChunksCount) { if (!localOutro) { localOutro = await downloadChunks('outro', data.outroChunksCount); if (localOutro) await AssetManagerService.saveMedia('CUSTOM_OUTRO', localOutro); } updates.outroUrl = localOutro; }
                else if (data.backCover) { updates.outroUrl = data.backCover; if (!localOutro) await AssetManagerService.saveMedia('CUSTOM_OUTRO', data.backCover); }
                else if (data.outroChunksCount === null || data.backCover === null) { updates.outroUrl = null; await AssetManagerService.deleteMedia('CUSTOM_OUTRO'); }
                else updates.outroUrl = localOutro;
                if (data.selectedBgmId) { const trackList = updates.musicList || (await AssetManagerService.getAllMusicFromLib()); const track = trackList.find(m => m.id === data.selectedBgmId); if (track) { let localMusic = await AssetManagerService.getMusicFromLib(data.selectedBgmId); if (!localMusic && track.chunksCount) { const cloudData = await downloadChunks(track.id, track.chunksCount); if (cloudData) { localMusic = { id: track.id, name: track.name, data: cloudData }; await AssetManagerService.saveMusicToLib(localMusic); } } if (localMusic) { await AssetManagerService.saveMedia('CUSTOM_MUSIC', localMusic.data); updates.musicLoaded = true; updates.musicName = track.name; updates.musicId = track.id; } } }
                else if (data.selectedBgmId === null) { updates.musicLoaded = false; updates.musicName = ''; updates.musicId = ''; await AssetManagerService.deleteMedia('CUSTOM_MUSIC'); }
                updates.isLoading = false; if (!updates.statusMsg || updates.statusMsg.includes('İndiriliyor')) updates.statusMsg = 'Bulutla Senkronize (Aktif)';
                setStudioMedia(s => ({ ...s, ...updates }));
            } else {
                const syncLocalToCloud = async () => { let updates = {}; const localOutro = await AssetManagerService.loadMedia('CUSTOM_OUTRO'); if (localOutro) updates.outroChunksCount = await uploadChunks('outro', localOutro); const db = await AssetManagerService.getDB(); const tx = db.transaction(LIB_STORE, 'readonly'); const req = tx.objectStore(LIB_STORE).getAll(); req.onsuccess = async () => { const allMusics = req.result || []; if (allMusics.length > 0) updates.bgmList = allMusics.map(m => ({ id: m.id, name: m.name, chunksCount: Math.ceil(m.data.length / 800000) })); const savedPrefs = JSON.parse(SafeStorage.getItem('ns_prefs')) || {}; if (savedPrefs.ambientSound && savedPrefs.ambientSound !== 'none') updates.selectedBgmId = savedPrefs.ambientSound; if (Object.keys(updates).length > 0) await setDoc(docRef, updates, { merge: true }); }; };
                syncLocalToCloud(); setStudioMedia(s => ({ ...s, isLoading: false, statusMsg: 'Yerel Bellek Senkronize' }));
            }
        }, () => setStudioMedia(s => ({ ...s, isLoading: false, statusMsg: 'Yerel Mod' })));
        return () => unsubscribe();
    }, [user]);

    const handleOutroUpload = async (e) => { const file = e.target.files?.[0]; if (!file) return; setStudioMedia(s => ({ ...s, isLoading: true, statusMsg: 'Kapak Yükleniyor...' })); const b64 = await NetworkUtils.compressImage(file); await AssetManagerService.saveMedia('CUSTOM_OUTRO', b64); const chunksCount = await uploadChunks('outro', b64); await saveToFirestore({ outroChunksCount: chunksCount, backCover: null }); setStudioMedia(s => ({ ...s, outroUrl: b64, isLoading: false, statusMsg: 'Bulutla Senkronize' })); };
    const handleOutroDelete = async () => { await AssetManagerService.deleteMedia('CUSTOM_OUTRO'); setStudioMedia(s => ({ ...s, outroUrl: null })); await saveToFirestore({ outroChunksCount: null, backCover: null }); };
    const handleCustomSceneImagesUpload = async (e) => { const files = Array.from(e.target.files); if (!files.length) return; const availableSlots = 999 - (studioMedia.customSceneImages?.length || 0); const filesToProcess = files.slice(0, availableSlots); const newB64s = []; for (let file of filesToProcess) { if (file.type.startsWith('image/')) { const b64 = await NetworkUtils.compressImage(file); newB64s.push(b64); } } const updatedImages = [...(studioMedia.customSceneImages || []), ...newB64s].slice(0, 5); for (let i = 0; i < updatedImages.length; i++) await AssetManagerService.saveMedia("CUSTOM_SCENE_IMG_" + i, updatedImages[i]); setStudioMedia(s => ({ ...s, customSceneImages: updatedImages })); const newMediaFiles = newB64s.map((b64, i) => ({ name: `SabitGorsel_${Date.now()}_${i}.jpg`, type: 'image/jpeg', data: b64 })); if (newMediaFiles.length > 0) setUiState(prev => ({ ...prev, selectedMediaFiles: [...prev.selectedMediaFiles, ...newMediaFiles] })); e.target.value = null; };
    const handleCustomSceneImageDelete = async (idx) => { const updated = studioMedia.customSceneImages.filter((_, i) => i !== idx); for (let i = 0; i < 999; i++) await AssetManagerService.deleteMedia("CUSTOM_SCENE_IMG_" + i); for (let i = 0; i < updated.length; i++) await AssetManagerService.saveMedia("CUSTOM_SCENE_IMG_" + i, updated[i]); setStudioMedia(s => ({ ...s, customSceneImages: updated })); };
    const deleteMusic = async () => { try { const as = prefs.ambientSound; if (as && !['none', 'rain', 'wind', 'waves', 'fire'].includes(as)) { const oldUrl = await AssetManagerService.loadMedia('CUSTOM_MUSIC'); if (oldUrl && oldUrl.startsWith('blob:')) URL.revokeObjectURL(oldUrl); await AssetManagerService.deleteMedia('CUSTOM_MUSIC'); if (!as.startsWith('gd_')) { await AssetManagerService.removeMusicFromLib(as); const updatedList = studioMedia.musicList.filter(m => m.id !== as); await saveToFirestore({ bgmList: updatedList, selectedBgmId: null }); } setPrefs(p => ({ ...p, ambientSound: 'none' })); } } catch (e) { } };
    const handleFolderSelect = async () => {
        if (musicFileInputRef.current) musicFileInputRef.current.click();
    };
    const handleFolderSelectLegacy = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.wma'];
        const audioFiles = files.filter(f => audioExts.some(ext => f.name.toLowerCase().endsWith(ext)));
        if (!audioFiles.length) { addSystemLog("Seçilen dosyalarda ses dosyası bulunamadı.", "warn"); return; }
        addSystemLog(`${audioFiles.length} müzik dosyası bulundu, IndexedDB'ye kaydediliyor...`, 'info');
        let savedCount = 0;
        for (const file of audioFiles) {
            const id = "fm_" + file.name.replace(/[^a-zA-Z0-9]/g, '_') + "_" + file.size;
            const existing = await AssetManagerService.getMusicFromLib(id);
            if (existing) continue;
            const b64 = await NetworkUtils.fileToBase64(file);
            await AssetManagerService.saveMusicToLib({ id, name: file.name, data: b64 });
            savedCount++;
        }
        const allMusic = await AssetManagerService.getAllMusicFromLib();
        setStudioMedia(s => ({ ...s, musicList: [...allMusic] }));
        addSystemLog(`${savedCount} yeni müzik kaydedildi. Toplam: ${allMusic.length} müzik`, 'success');
        e.target.value = null;
    };
    const clearSyncedFolder = async () => {
        await AssetManagerService.removeDirHandle();
        setStudioMedia(s => ({ ...s, syncedFolderName: '' }));
        addSystemLog("Otomatik senkronizasyon kaldırıldı.", 'info');
    };
    // Müzik önizleme - 8 saniye çalar
    const playMusicPreview = (url) => {
        try {
            if (_previewAudioRef.current) { _previewAudioRef.current.pause(); _previewAudioRef.current = null; }
            const audio = new Audio(url);
            audio.volume = 0.5;
            _previewAudioRef.current = audio;
            audio.play().catch(() => {});
            setTimeout(() => { if (_previewAudioRef.current === audio) { audio.pause(); _previewAudioRef.current = null; } }, 8000);
        } catch (e) {}
    };

    const handleFolderMusicSelect = async (musicId) => {
        if (prefs.ambientSound === musicId) { setPrefs(p => ({ ...p, ambientSound: 'none' })); return; }
        // Google Drive müziği seçildiyse
        if (musicId.startsWith('gd_')) {
            const driveId = musicId.substring(3);
            const gdTrack = GOOGLE_DRIVE_MUSIC.find(m => m.id === driveId);
            if (!gdTrack) { addSystemLog("Google Drive müziği bulunamadı", 'error'); return; }
            addSystemLog(`Google Drive'dan indiriliyor: ${gdTrack.name}...`, 'info');
            const oldUrl = await AssetManagerService.loadMedia('CUSTOM_MUSIC');
            if (oldUrl && oldUrl.startsWith('blob:')) URL.revokeObjectURL(oldUrl);
            try {
                // Google Drive'dan ses verisini indir (CORS proxy ile)
                addSystemLog(`İndirme başlatılıyor: ${driveId}...`, 'info');
                const streamUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
                const resp = await fetchWithCorsProxy(streamUrl);
                const audioBlob = await resp.blob();
                // HTML sayfası döndüyse kontrol et (Google Drive virüs tarama)
                if (audioBlob.size < 1000 || (audioBlob.type && audioBlob.type.includes('text/html'))) {
                    // Küçük dosya veya HTML — muhtemelen hala confirmation sayfası
                    const text = await audioBlob.text();
                    if (text.includes('<html') || text.includes('<!DOCTYPE')) {
                        throw new Error('Google Drive indirme onayı gerekiyor. Dosyayı tarayıcıda açıp manuel indirin veya dosyanın herkese açık olduğundan emin olun.');
                    }
                }
                const reader = new FileReader();
                const b64 = await new Promise((resolve, reject) => {
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(audioBlob);
                });
                // IndexedDB'ye kaydet (render sırasında fetch gerekmez)
                await AssetManagerService.saveMedia('CUSTOM_MUSIC', b64);
                setPrefs(p => ({ ...p, ambientSound: musicId, customBgMusicName: gdTrack.name, customBgMusicId: musicId }));
                // Önizleme için blob URL oluştur ve çal
                const previewUrl = URL.createObjectURL(audioBlob);
                playMusicPreview(previewUrl);
                addSystemLog(`Google Drive müziği indirildi: ${gdTrack.name} (${(audioBlob.size / 1024).toFixed(0)}KB)`, 'success');
            } catch (e) {
                addSystemLog(`Google Drive müzik indirme hatası: ${e.message}`, 'error');
            }
            return;
        }
        // Yerel müzik seçildiyse (IndexedDB)
        const track = await AssetManagerService.getMusicFromLib(musicId);
        if (!track || !track.data) { addSystemLog("Müzik bulunamadı", 'error'); return; }
        addSystemLog(`Müzik hazırlanıyor: ${track.name}`, 'info');
        const oldUrl = await AssetManagerService.loadMedia('CUSTOM_MUSIC');
        if (oldUrl && oldUrl.startsWith('blob:')) URL.revokeObjectURL(oldUrl);
        const raw = track.data.includes(',') ? track.data.split(',')[1] : track.data;
        const byteString = atob(raw);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        await AssetManagerService.saveMedia('CUSTOM_MUSIC', url);
        setPrefs(p => ({ ...p, ambientSound: musicId, customBgMusicName: track.name, customBgMusicId: musicId }));
        playMusicPreview(url); // Önizleme çal
        addSystemLog(`Müzik hazır: ${track.name}`, 'success');
    };
    const processSelectedFiles = async (files) => { if (!files || files.length === 0) return; if (files.length > 999) { setUiState(prev => ({ ...prev, error: "Sınır yok seçebilirsiniz." })); return; } const validFiles = files.filter(f => f.size <= 50 * 1024 * 1024); try { setUiState(prev => ({ ...prev, isProcessing: true, statusText: "Dosyalar işleniyor..." })); const processedFiles = await Promise.all(validFiles.map(async (file) => { const base64 = await NetworkUtils.fileToBase64(file); return { name: file.name, type: file.type, data: base64 }; })); setUiState(prev => ({ ...prev, selectedMediaFiles: processedFiles, error: '', isProcessing: false, statusText: "" })); } catch (error) { setUiState(prev => ({ ...prev, error: "Dosya okuma hatası.", isProcessing: false, statusText: "" })); } };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); processSelectedFiles(Array.from(e.dataTransfer.files)); };

    const handleExecuteStart = async (files = null, forceOutputType = null) => {
        sysEventBus.emit('SYS_LOG_CLEAR');
        const aCtx = _getAudioCtx(); if (aCtx.state === 'suspended') aCtx.resume().catch(() => {});
        const outType = forceOutputType || config.outputType; if (forceOutputType) setConfig(prev => ({ ...prev, outputType: forceOutputType }));
        setUiState(prev => ({ ...prev, isProcessing: true, percent: 0, statusText: 'Workflow Başlatılıyor...', error: '', videoUrl: null }));
        addSystemLog('İş akışı başlatıldı.', 'info');
        try {
            let inputData = textInput;
            let inputType = activeTab;
            const runConfig = { ...config, outputType: outType, customSceneImages: studioMedia.customSceneImages };
            // Atatürk içerikli güzel söz → otomatik müzik seçimi
            if (config.tip === 'guzel_soz' && textInput.trim()) {
                const ataturkKW = ['atatürk', 'mustafa kemal', 'samsun', 'kurtuluş', 'cumhuriyet', 'bağımsızlık', 'milli mücadele', 'inkılap', 'devrim', 'paşa', 'gazi', 'anıtkabir', '19 mayıs'];
                if (ataturkKW.some(kw => textInput.toLowerCase().includes(kw)) && prefs.ambientSound !== 'gd_14byzbYGcpQ3Lcn7cMpwLOAsZS9NCfKLR') {
                    addSystemLog('Atatürk içerikli söz → "Bir Daha Gel Samsundan" müziği otomatik seçildi.', 'success');
                    await handleFolderMusicSelect('gd_14byzbYGcpQ3Lcn7cMpwLOAsZS9NCfKLR');
                }
            }
            if (config.tip === 'guzel_soz') {
                const targetFiles = files || uiState.selectedMediaFiles;
                if (textInput.trim()) {
                    inputData = textInput;
                    inputType = 'text';
                } else if (targetFiles && targetFiles.length > 0) {
                    inputData = targetFiles;
                    inputType = 'media';
                } else {
                    throw new Error("Güzel söz için metin veya resim girin.");
                }
            } else if (activeTab === 'media' || activeTab === 'gazete') {
                const targetFiles = files || uiState.selectedMediaFiles;
                if (targetFiles && targetFiles.length > 0) { inputData = targetFiles; inputType = 'media'; }
                else throw new Error("En az bir dosya seçin.");
            } else {
                // prompt/url sekmesindeyken medya dosyası (ses/görsel/video) varsa onu da kullan
                const targetFiles = files || uiState.selectedMediaFiles;
                if (targetFiles && targetFiles.length > 0) {
                    const hasAudio = targetFiles.some(f => f.type?.startsWith('audio'));
                    if (hasAudio) {
                        // Ses dosyası varsa — transkribe + analiz için medya olarak gönder
                        inputData = targetFiles;
                        inputType = 'media';
                        addSystemLog('Ses dosyası algılandı — transkribe edilecek ve analiz edilecek.', 'info');
                    } else if (textInput.trim()) {
                        // Metin + görsel varsa, metni gönder (görsel AI üretimi için kullanılır)
                        inputData = textInput;
                        inputType = 'prompt';
                    }
                }
            }
            await workflowRef.current.startWorkflow(inputData, inputType, runConfig, prefs, canvasRef);
        } catch (e) { addSystemLog(`Hata: ${e.message}`, 'error'); setUiState(prev => ({ ...prev, isProcessing: false, error: e.message })); }
    };

    const handleExecuteResume = async () => { const aCtx = _getAudioCtx(); if (aCtx.state === 'suspended') aCtx.resume().catch(() => {}); setUiState({ isProcessing: true, percent: workflowRef.current.state.progress || 0, statusText: 'Sürdürülüyor...', error: '', videoUrl: null, showDevMenu: uiState.showDevMenu }); addSystemLog('Workflow sürdürülüyor...', 'warn'); try { await workflowRef.current.resumeWorkflow(canvasRef); } catch (e) { addSystemLog(`Kurtarma hatası: ${e.message}`, 'error'); setUiState(prev => ({ ...prev, isProcessing: false, error: e.message })); } };

    const handleQuickReRender = async () => { const activeJob = workflowRef.current.state; if (!activeJob || !activeJob.script || activeJob.status !== 'COMPLETED') { setUiState(prev => ({ ...prev, error: "Önce video oluşturun." })); return; } setUiState(prev => ({ ...prev, isProcessing: true, percent: 10, statusText: 'Yeniden Paketleniyor...' })); addSystemLog("Hızlı yeniden paketleme...", "info"); try { const outputUrl = await RenderWorkerService.executeRender(activeJob, canvasRef.current, prefs); setUiState(prev => ({ ...prev, isProcessing: false, percent: 100, videoUrl: outputUrl })); addSystemLog("Tamamlandı!", "success"); } catch (err) { addSystemLog(`Hata: ${err.message}`, "error"); setUiState(prev => ({ ...prev, isProcessing: false, error: "Başarısız: " + err.message })); } };

    const handleSilentRecovery = async () => { setUiState(prev => ({ ...prev, isProcessing: true, statusText: "Oturum yenileniyor..." })); const success = await attemptSilentReauth(); if (success) { setAuthExpired(false); setUiState(prev => ({ ...prev, isProcessing: false, statusText: "" })); addSystemLog("Oturum tazelendi.", "success"); } else setUiState(prev => ({ ...prev, isProcessing: false, error: "Yenileme başarısız. F5 ile yenileyin." })); };

    // === GAZETE TAKİP FONKSİYONLARI ===

    // gazeteoku.com'dan manşetleri çek (CORS proxy ile)
    const fetchGazeteMansetleri = async () => {
        setGazeteLoading(true);
        setGazeteError('');
        setGazeteItems([]);
        try {
            const proxies = [
                (u) => 'https://corsproxy.io/?' + encodeURIComponent(u),
                (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
                (u) => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u),
            ];
            let html = '';
            // 1. Doğrudan fetch dene
            try {
                const r = await fetch('https://www.gazeteoku.com/gazeteler');
                if (r.ok) { const t = await r.text(); if (t.length > 5000 && !t.includes('Access Denied')) html = t; }
            } catch(e) {}
            // 2. CORS proxy ile dene
            if (!html) {
                for (const proxyFn of proxies) {
                    try {
                        const proxyUrl = proxyFn('https://www.gazeteoku.com/gazeteler');
                        const r = await fetch(proxyUrl);
                        if (r.ok) { const t = await r.text(); if (t.length > 5000 && !t.includes('Access Denied')) { html = t; break; } }
                    } catch(e) {}
                }
            }
            if (!html) throw new Error('Gazete manşetleri yüklenemedi. Ağ bağlantınızı kontrol edin.');
            // img etiketlerinden gazete bilgilerini çıkar
            const regex = /<img[^>]+(?:src="([^"]+)"[^>]+alt="([^"]+)"|alt="([^"]+)"[^>]+src="([^"]+)")/gi;
            const items = [];
            const seen = new Set();
            let match;
            while ((match = regex.exec(html)) !== null) {
                const src = (match[1] || match[4] || '').trim();
                const name = (match[2] || match[3] || '').trim();
                if (name.length > 2 && src && !seen.has(name) && src.includes('storage/files/images')) {
                    seen.add(name);
                    items.push({ name, src: src.startsWith('http') ? src : 'https://i.gazeteoku.com' + src });
                }
            }
            if (items.length === 0) throw new Error('Gazete bulunamadı. Sayfa yapısı değişmiş olabilir.');
            setGazeteItems(items);
            addSystemLog(items.length + ' gazete manşeti yüklendi.', 'success');
        } catch (e) {
            setGazeteError(e.message);
            addSystemLog('Gazete yükleme hatası: ' + e.message, 'error');
        } finally {
            setGazeteLoading(false);
        }
    };

    // Crop modal aç
    const openCropModal = (src, name) => {
        setGazeteCropModal({ src, name });
    };

    // Canvas'tan crop yapıp medya listesine aktar
    const applyCrop = (cropDataUrl, gazeteName) => {
        const newFile = {
            name: gazeteName + '_crop.png',
            type: 'image/png',
            data: cropDataUrl
        };
        setUiState(prev => ({
            ...prev,
            selectedMediaFiles: [...(prev.selectedMediaFiles || []), newFile]
        }));
        setGazeteCropModal(null);
        setActiveTab('media');
        addSystemLog('Crop medyaya aktarıldı: ' + gazeteName, 'success');
    };

    // Tam gazete görselini doğrudan medyaya aktar (crop olmadan)
    const addFullImageToMedia = async (src, name) => {
        try {
            setGazeteLoading(true);
            // Görseli canvas'a yükle ve data URL'e çevir
            const img = new Image();
            img.crossOrigin = 'anonymous';
            const dataUrl = await new Promise((resolve, reject) => {
                img.onload = () => {
                    const c = document.createElement('canvas');
                    c.width = img.naturalWidth;
                    c.height = img.naturalHeight;
                    c.getContext('2d').drawImage(img, 0, 0);
                    resolve(c.toDataURL('image/jpeg', 0.92));
                };
                img.onerror = () => reject(new Error('Görsel yüklenemedi: ' + name));
                img.src = src;
            });
            const newFile = { name: name + '.jpg', type: 'image/jpeg', data: dataUrl };
            setUiState(prev => ({
                ...prev,
                selectedMediaFiles: [...(prev.selectedMediaFiles || []), newFile]
            }));
            setActiveTab('media');
            addSystemLog('Tam sayfa medyaya aktarıldı: ' + name, 'success');
        } catch (e) {
            addSystemLog('Aktarma hatası: ' + e.message, 'error');
        } finally {
            setGazeteLoading(false);
        }
    };

    // === CROP MODAL BİLEŞENİ ===
    const GazeteCropModal = ({ src, name, onClose, onCrop }) => {
        const containerRef = useRef(null);
        const imgRef = useRef(null);
        const [imgLoaded, setImgLoaded] = useState(false);
        const [selection, setSelection] = useState(null); // {startX, startY, endX, endY}
        const [isDragging, setIsDragging] = useState(false);
        const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

        // Görsel yüklendiğinde boyutları al
        const handleImageLoad = (e) => {
            const img = e.target;
            setImgSize({ w: img.offsetWidth, h: img.offsetHeight });
            setImgLoaded(true);
        };

        // Mouse koordinatlarını container-relative'a çevir
        const getRelPos = (e) => {
            const rect = containerRef.current.getBoundingClientRect();
            return {
                x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
                y: Math.max(0, Math.min(e.clientY - rect.top, rect.height))
            };
        };

        const handleMouseDown = (e) => {
            e.preventDefault();
            const pos = getRelPos(e);
            setSelection({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
            setIsDragging(true);
        };

        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const pos = getRelPos(e);
            setSelection(prev => ({ ...prev, endX: pos.x, endY: pos.y }));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        // Touch desteği
        const getTouchPos = (e) => {
            const touch = e.touches[0] || e.changedTouches[0];
            const rect = containerRef.current.getBoundingClientRect();
            return {
                x: Math.max(0, Math.min(touch.clientX - rect.left, rect.width)),
                y: Math.max(0, Math.min(touch.clientY - rect.top, rect.height))
            };
        };

        const handleTouchStart = (e) => {
            const pos = getTouchPos(e);
            setSelection({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
            setIsDragging(true);
        };

        const handleTouchMove = (e) => {
            if (!isDragging) return;
            const pos = getTouchPos(e);
            setSelection(prev => ({ ...prev, endX: pos.x, endY: pos.y }));
        };

        const handleTouchEnd = () => setIsDragging(false);

        // Crop'u uygula
        const doCrop = () => {
            if (!selection || !imgRef.current) return;
            const img = imgRef.current;
            const dispW = img.offsetWidth;
            const dispH = img.offsetHeight;
            const natW = img.naturalWidth;
            const natH = img.naturalHeight;

            // Seçim koordinatlarını normalize et
            const x1 = Math.min(selection.startX, selection.endX);
            const y1 = Math.min(selection.startY, selection.endY);
            const x2 = Math.max(selection.startX, selection.endX);
            const y2 = Math.max(selection.startY, selection.endY);

            // Minimum boyut kontrolü
            if (x2 - x1 < 10 || y2 - y1 < 10) return;

            // Display → natural boyut dönüşümü
            const scaleX = natW / dispW;
            const scaleY = natH / dispH;
            const cropX = Math.round(x1 * scaleX);
            const cropY = Math.round(y1 * scaleY);
            const cropW = Math.round((x2 - x1) * scaleX);
            const cropH = Math.round((y2 - y1) * scaleY);

            // Canvas'ta crop yap
            const canvas = document.createElement('canvas');
            canvas.width = cropW;
            canvas.height = cropH;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            const dataUrl = canvas.toDataURL('image/png');
            onCrop(dataUrl, name);
        };

        // Seçim dikdörtgeninin stilleri
        const selStyle = selection ? {
            left: Math.min(selection.startX, selection.endX) + 'px',
            top: Math.min(selection.startY, selection.endY) + 'px',
            width: Math.abs(selection.endX - selection.startX) + 'px',
            height: Math.abs(selection.endY - selection.startY) + 'px',
        } : null;

        return (
            <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col items-center justify-center p-4" onClick={onClose}>
                <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-4 max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    {/* Başlık */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Scissors size={18} className="text-indigo-400" />
                            <span className="text-white font-bold text-sm">{name}</span>
                        </div>
                        <div className="flex gap-2">
                            {selection && (Math.abs(selection.endX - selection.startX) > 10) && (
                                <button onClick={doCrop} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                                    <Check size={14} /> Crop'u Kullan
                                </button>
                            )}
                            <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">✕ Kapat</button>
                        </div>
                    </div>
                    {/* Talimat */}
                    <p className="text-slate-400 text-[11px] mb-2">🖱️ Fare ile gazete üzerinde bir alan seçin, sonra "Crop'u Kullan" butonuna tıklayın.</p>
                    {/* Görsel + Seçim alanı */}
                    <div ref={containerRef} className="relative flex-1 overflow-auto rounded-xl bg-black/50 select-none"
                        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
                        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                        style={{ cursor: 'crosshair', touchAction: 'none' }}>
                        <img ref={imgRef} src={src} crossOrigin="anonymous" onLoad={handleImageLoad}
                            className="w-full h-auto block" alt={name} draggable={false} />
                        {/* Seçim dikdörtgeni */}
                        {selection && imgLoaded && (
                            <>
                                {/* Karartılmış overlay - 4 div ile maske (clipPath yerine daha uyumlu) */}
                                <div className="absolute inset-0 pointer-events-none">
                                    {/* Üst */}
                                    <div className="absolute left-0 right-0 top-0 bg-black/50" style={{ bottom: `calc(100% - ${selStyle.top})` }} />
                                    {/* Alt */}
                                    <div className="absolute left-0 right-0 bottom-0 bg-black/50" style={{ top: `calc(${selStyle.top} + ${selStyle.height})` }} />
                                    {/* Sol */}
                                    <div className="absolute left-0 top-0 bottom-0 bg-black/50" style={{ top: selStyle.top, bottom: `calc(100% - ${selStyle.top} - ${selStyle.height})`, right: `calc(100% - ${selStyle.left})` }} />
                                    {/* Sağ */}
                                    <div className="absolute right-0 top-0 bottom-0 bg-black/50" style={{ top: selStyle.top, bottom: `calc(100% - ${selStyle.top} - ${selStyle.height})`, left: `calc(${selStyle.left} + ${selStyle.width})` }} />
                                </div>
                                {/* Seçim kutusu */}
                                <div className="absolute border-2 border-emerald-400 bg-emerald-400/10 pointer-events-none"
                                    style={selStyle}>
                                    <div className="absolute -top-5 left-0 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                        {Math.round(Math.abs(selection.endX - selection.startX))}×{Math.round(Math.abs(selection.endY - selection.startY))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // === GAZETELER ARASI GEÇİŞ İÇİN GALERİ MODU ===
    const [gazeteGalleryView, setGazeteGalleryView] = useState('grid'); // 'grid' | 'single'
    const [gazeteCurrentIdx, setGazeteCurrentIdx] = useState(0);

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans p-3 md:p-4 relative overflow-hidden">
            <div className="max-w-3xl mx-auto">
                {/* NVIDIA API KEY PANELİ */}
                {showApiKeyPanel && (
                    <div className="mb-4 p-4 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck size={18} className="text-amber-400" />
                            <h2 className="text-sm font-bold text-amber-300">NVIDIA API Anahtarı Gerekli</h2>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">NVIDIA (önce) veya Gemini ücretsiz API key girin. Anahtar tarayıcınızda (sessionStorage) saklanır, koda gömülmez. NVIDIA başarısız olursa otomatik Gemini'ye düşer.</p>
                        <input
                            type="password"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder="nvapi-..."
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white mb-2 focus:outline-none focus:border-amber-400"
                        />
                        <input
                            type="text"
                            value={nvidiaModel}
                            onChange={(e) => setNvidiaModel(e.target.value)}
                            placeholder="nvidia/llama-3.1-nemotron-70b-instruct"
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white mb-3 focus:outline-none focus:border-amber-400"
                        />
                        <button
                            onClick={saveApiKey}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2 rounded-lg text-sm transition-colors"
                        >Kaydet ve Devam Et</button>
                    </div>
                )}
                {!showApiKeyPanel && (
                    <button
                        onClick={() => setShowApiKeyPanel(true)}
                        className="mb-3 flex items-center gap-2 text-xs text-slate-400 hover:text-amber-300 transition-colors"
                    ><ShieldCheck size={14} /> API Key: {apiKeyInput ? '•••••• ' + apiKeyInput.slice(-4) : 'yok'} (değiştir)</button>
                )}

                <div className="text-center mb-4 flex items-center justify-center gap-3">
                    <h1 className="text-xl md:text-3xl font-black tracking-tight text-white whitespace-nowrap">OTONOM</h1>
                    <div className="bg-indigo-900/40 border-2 border-indigo-500/50 px-3 py-1.5 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                    <p className="text-indigo-300 text-[10px] md:text-xs font-black tracking-widest uppercase">
                             Hermes H1.151 <span className="mx-1 text-white">•</span> One-Page
                         </p>
                    </div>
                </div>

                {pendingJob && (
                    <div className="mb-6 bg-amber-500/10 border-2 border-amber-500/30 p-4 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-amber-400">
                            <AlertCircle size={20} className="shrink-0 animate-pulse" />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider">Yarım Kalan İşlem</p>
                                <p className="text-xs text-slate-300">Son render kurtarılabilir.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={async () => { await AssetManagerService.clearJob(pendingJob.jobId); setPendingJob(null); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition">Yoksay</button>
                            <button onClick={() => { workflowRef.current.state = pendingJob; setPendingJob(null); handleExecuteResume(); }} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition">Devam Et</button>
                        </div>
                    </div>
                )}

                {/* ARKA PLAN SESİ */}
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-3 mb-4 shadow-lg">
                    <div className="bg-black/40 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between relative">
                        <div className="flex items-center gap-3 w-full">
                            <div className={`w-10 h-10 rounded border ${(prefs.ambientSound && prefs.ambientSound !== 'none') ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'} flex items-center justify-center shrink-0`}><CloudRain size={18} /></div>
                            <div className="w-full flex-1 pr-2">
                                <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Arka Plan Sesi</p>
                                <CustomSelect value={prefs.ambientSound || "none"} onChange={(val) => { if (['rain', 'wind', 'waves', 'fire', 'none'].includes(val)) { setPrefs({ ...prefs, ambientSound: val }); if (val === 'none') { AssetManagerService.loadMedia('CUSTOM_MUSIC').then(u => { if (u && u.startsWith('blob:')) URL.revokeObjectURL(u); }); AssetManagerService.deleteMedia('CUSTOM_MUSIC'); } } else { handleFolderMusicSelect(val); } }} options={ambientOptions} />
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0 relative z-10">
                            {(prefs.ambientSound && !['none', 'rain', 'wind', 'waves', 'fire'].includes(prefs.ambientSound)) && <button onClick={deleteMusic} className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-500 p-2 rounded-lg transition"><Trash2 size={16} /></button>}
                            <button onClick={handleFolderSelect} className="bg-violet-600 hover:bg-violet-500 text-white px-3 md:px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition whitespace-nowrap">MÜZİK KLASÖRÜ SEÇ</button>
                            <input ref={musicFileInputRef} type="file" webkitdirectory="true" directory="true" multiple accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac,.wma" className="hidden" onChange={handleFolderSelectLegacy} />
                        </div>
                    </div>
                    {studioMedia.musicList.length > 0 && (
                        <div className="mt-2">
                            <input type="text" placeholder="Müzik ara..." value={musicSearchQuery} onChange={e => setMusicSearchQuery(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-500 transition" />
                        </div>
                    )}
                    {studioMedia.syncedFolderName && (
                        <div className="mt-2 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                                <RefreshCw size={12} className="text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
                                <span className="text-[10px] text-emerald-400 font-bold">Otomatik: {studioMedia.syncedFolderName}</span>
                            </div>
                            <button onClick={clearSyncedFolder} className="text-[10px] text-slate-400 hover:text-rose-400 transition">Kaldır</button>
                        </div>
                    )}
                    {studioMedia.musicList.length === 0 && (
                        <p className="text-[9px] text-slate-500 mt-1.5 text-center">Müzik klasörü seçin — tüm müzikler otomatik yüklenir</p>
                    )}
                </div>

                {/* ANA İÇERİK */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 md:p-4 shadow-2xl relative z-10 mb-4">
                    <div className="flex flex-col sm:flex-row gap-2 bg-black/30 p-1.5 rounded-xl mb-4 flex-wrap">
                        <button onClick={() => setActiveTab('text')} className={`flex-1 min-w-[120px] py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Metin / Haber</button>
                        <button onClick={() => setActiveTab('url')} className={`flex-1 min-w-[120px] py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Haber Linki</button>
                        <button onClick={() => setActiveTab('media')} className={`flex-1 min-w-[120px] py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'media' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Medya Analizi</button>
                        <button onClick={() => setActiveTab('prompt')} className={`flex-1 min-w-[120px] py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'prompt' ? 'bg-fuchsia-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Serbest Prompt</button>
                        <button onClick={() => { setActiveTab('gazete'); if (gazeteItems.length === 0) fetchGazeteMansetleri(); }} className={`flex-1 min-w-[120px] py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'gazete' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}><Newspaper size={14} /> Gazete Takip</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 font-bold">
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Clock} value={config.duration} onChange={(val) => setConfig({ ...config, duration: val })} options={[{ value: 'unlimited', label: '∞ Sınırsız', color: 'text-emerald-400 font-bold' }, { value: '15', label: '15-30s' }, { value: '30', label: '30-60s' }, { value: '60', label: '60-90s' }, { value: '90', label: '90-120s' }]} />
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Smartphone} value={config.aspectRatio || '9:16'} onChange={(val) => setConfig({ ...config, aspectRatio: val })} options={[{ value: '9:16', label: 'Dikey (9:16)' }, { value: '16:9', label: 'Yatay (16:9)' }, { value: '1:1', label: 'Kare (1:1)' }]} />
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Clapperboard} value={config.videoStyle || 'explainer'} onChange={(val) => setConfig({ ...config, videoStyle: val })} options={[{ value: 'news_flash', label: 'Haber Bülteni' }, { value: 'cinematic', label: 'Sinematik' }, { value: 'explainer', label: 'Açıklayıcı' }, { value: 'weekly_roundup', label: 'Haftalık Özet' }, { value: 'prompt_output', label: 'Custom Prompt', color: 'text-fuchsia-400 font-bold' }]} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Palette} value={config.imageStyle || 'cinematic'} onChange={(val) => setConfig({ ...config, imageStyle: val })} options={[{ value: 'watercolor', label: 'Sulu Boya' }, { value: 'sketch', label: 'Karakalem' }, { value: 'oil_painting', label: 'Yağlı Boya' }, { value: 'cinematic', label: 'Gerçekçi' }, { value: 'minimalist', label: 'Minimalist' }, { value: 'cyberpunk', label: 'Cyberpunk' }, { value: 'retro', label: 'Retro' }, { value: '3d_render', label: '3D Render' }, { value: 'anime', label: 'Anime' }]} />
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center gap-3">
                            <Monitor size={16} className="text-indigo-400 shrink-0" />
                            <div className="flex gap-2 w-full">{['1K', '2K', '4K'].map(res => (<button key={res} onClick={() => setConfig({ ...config, resolution: res })} className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${config.resolution === res ? 'bg-slate-200 text-slate-900' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'}`}>{res}</button>))}</div>
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Activity} value={config.transition || 'none'} onChange={(val) => setConfig({ ...config, transition: val })} options={[{ value: 'none', label: 'Yok' }, { value: 'crossfade', label: 'Karışır' }, { value: 'fadeIn', label: 'Yavaşça Belirme' }, { value: 'fadeOut', label: 'Yavaşça Kaybolma' }, { value: 'slideIn', label: 'Kayarak Giriş' }, { value: 'slideOut', label: 'Kayarak Çıkış' }]} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Clapperboard} value={config.tip || 'haber'} onChange={(val) => setConfig({ ...config, tip: val })} options={[{ value: 'haber', label: 'Haber', color: 'text-emerald-400 font-bold' }, { value: 'guzel_soz', label: 'Güzel Söz', color: 'text-amber-400 font-bold' }, { value: 'iddia_analizi', label: 'İddia Analizi', color: 'text-cyan-400 font-bold' }]} />
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Globe} value={config.language || 'tr'} onChange={(val) => setConfig({ ...config, language: val })} options={[{ value: 'tr', label: 'Türkçe' }, { value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }, { value: 'de', label: 'Deutsch' }, { value: 'es', label: 'Español' }, { value: 'ar', label: 'العربية' }, { value: 'ru', label: 'Русский' }]} />
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={MessageSquare} value={config.subtitles || 'on'} onChange={(val) => setConfig({ ...config, subtitles: val })} options={[{ value: 'on', label: 'Altyazı: Açık' }, { value: 'off', label: 'Altyazı: Kapalı' }]} />
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Type} value={config.analysisMode || 'yorumsuz'} onChange={(val) => setConfig({ ...config, analysisMode: val })} options={[{ value: 'yorumsuz', label: 'Yorumsuz' }, { value: 'visibility', label: 'Görünürlük' }, { value: 'deep_analysis', label: 'Derin Analiz', color: 'text-fuchsia-400 font-bold' }]} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Film} value={config.videoFormat || 'webm'} onChange={(val) => setConfig({ ...config, videoFormat: val })} options={[{ value: 'webm', label: 'WebM' }, { value: 'mp4', label: 'MP4' }]} />
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center relative">
                            <div className="flex items-center gap-2 w-full">
                                <CustomSelect icon={Volume2} value={prefs.narratorVoice} onChange={(val) => setPrefs({ ...prefs, narratorVoice: val })} options={voiceOptions} />
                                <button onClick={(e) => { e.stopPropagation(); setShowFilters(!showFilters); }} className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider transition-colors shrink-0"><Filter size={12} /> Filtreler</button>
                            </div>
                            {showFilters && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[200] p-3 space-y-3">
                                    <div><div className="text-[9px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">Gender</div><div className="flex gap-1.5">{['Any', 'Male', 'Female'].map(g => (<button key={g} onClick={() => setVoiceFilters({ ...voiceFilters, gender: g })} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${voiceFilters.gender === g ? 'bg-slate-200 text-slate-900 border-slate-200' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>{g}</button>))}</div></div>
                                    <div><div className="text-[9px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">Age</div><div className="flex flex-wrap gap-1.5">{['Any', 'Child', 'Young', 'Middle-aged', 'Elderly'].map(a => (<button key={a} onClick={() => setVoiceFilters({ ...voiceFilters, age: a })} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${voiceFilters.age === a ? 'bg-slate-200 text-slate-900 border-slate-200' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>{a}</button>))}</div></div>
                                    <div><div className="text-[9px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">Category</div><div className="flex flex-wrap gap-1.5">{['Any', 'Games & RPG', 'Audiobooks & Novels', 'Anime & Animation', 'Documentary', 'Commercials & Trailers', 'Corporate & Narration'].map(c => (<button key={c} onClick={() => setVoiceFilters({ ...voiceFilters, category: c })} className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all border ${voiceFilters.category === c ? 'bg-slate-200 text-slate-900 border-slate-200' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>{c}</button>))}</div></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* KAYNAK ADI + SABİT GÖRSEL + YORUM */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="bg-black/30 p-2 rounded-xl border border-slate-800 flex items-center justify-center">
                            {studioMedia.customSceneImages && studioMedia.customSceneImages[0] ? (
                                <img src={studioMedia.customSceneImages[0]} className="w-full h-10 object-cover rounded-lg" alt="Sabit" />
                            ) : (
                                <div className="text-[8px] text-slate-600 font-bold uppercase">Görsel Yok</div>
                            )}
                        </div>
                        <div className="bg-black/30 p-1.5 rounded-xl border border-slate-800">
                            <div className="flex items-center gap-2">
                                <CustomSelect icon={null} value={config.sourceName || ''} onChange={(val) => setConfig({ ...config, sourceName: val })} options={[
                                    { value: '', label: 'Kaynak Yok', color: 'text-slate-500' },
                                    { label: 'Sosyal Medya', options: [
                                        { value: 'X', label: 'X (Twitter)' }, { value: 'TikTok', label: 'TikTok' }, { value: 'Instagram', label: 'Instagram' }, { value: 'Facebook', label: 'Facebook' }
                                    ]},
                                    { label: 'Gazeteler', options: [
                                        { value: 'Sabah', label: 'Sabah' }, { value: 'Hürriyet', label: 'Hürriyet' }, { value: 'Sözcü', label: 'Sözcü' }, { value: 'Milliyet', label: 'Milliyet' }, { value: 'Posta', label: 'Posta' }, { value: 'Habertürk', label: 'Habertürk' }, { value: 'Fanatik', label: 'Fanatik' }, { value: 'Takvim', label: 'Takvim' }, { value: 'Türkiye Gazetesi', label: 'Türkiye Gazetesi' }, { value: 'Yeni Şafak', label: 'Yeni Şafak' }, { value: 'Cumhuriyet', label: 'Cumhuriyet' }, { value: 'Birgün', label: 'Birgün' }, { value: 'Aydınlık', label: 'Aydınlık' }, { value: 'Yeniçağ', label: 'Yeniçağ' }, { value: 'Evrensel', label: 'Evrensel' }, { value: 'Karar', label: 'Karar' }, { value: 'Diriliş Postası', label: 'Diriliş Postası' }, { value: 'Milat', label: 'Milat' }, { value: 'Korkusuz', label: 'Korkusuz' }, { value: 'Dünya', label: 'Dünya' }, { value: 'Yeni Birlik', label: 'Yeni Birlik' }, { value: 'Milli Gazete', label: 'Milli Gazete' }, { value: 'Tavır', label: 'Tavır' }, { value: 'Nefes', label: 'Nefes' }, { value: 'Akşam', label: 'Akşam' }, { value: 'Gazete Pencere', label: 'Gazete Pencere' }, { value: 'Nasıl Bir Ekonomi', label: 'Nasıl Bir Ekonomi' }, { value: 'Yeni Mesaj', label: 'Yeni Mesaj' }, { value: 'Analiz', label: 'Analiz' }, { value: 'Bugün', label: 'Bugün' }, { value: 'Yeni Asya', label: 'Yeni Asya' }, { value: 'Fotomaç', label: 'Fotomaç' }
                                    ]}
                                ]} className="flex-1" />
                            </div>
                            <input
                                type="text"
                                value={config.sourceName || ''}
                                onChange={(e) => setConfig({ ...config, sourceName: e.target.value })}
                                placeholder="Manuel kaynak adı yaz..."
                                className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600 font-bold mt-1.5 px-1 py-1 border-t border-slate-700/50"
                            />
                        </div>
                        <div className="bg-black/30 p-2 rounded-xl border border-slate-800">
                            <textarea value={config.yorum || ''} onChange={(e) => setConfig({ ...config, yorum: e.target.value })} placeholder="Yorum (2-3 satır)" className="w-full bg-transparent text-[10px] text-slate-200 outline-none placeholder:text-slate-600 font-bold resize-none h-8 leading-tight" rows={2} />
                        </div>
                    </div>

                    {/* SABİT GÖRSELLER + MEDYA — yan yana */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        {/* SABİT GÖRSELLER */}
                        <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-2.5 shadow-lg">
                            <h2 className="text-[10px] font-black text-cyan-400 mb-1 flex items-center gap-1.5"><Layers size={12} /> SABİT GÖRSELLER (SINIRSIZ)</h2>
                            <div className="flex flex-wrap gap-2">
                                {studioMedia.customSceneImages && studioMedia.customSceneImages.map((img, idx) => (
                                    <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700 shadow-md group">
                                        <img src={img} className="w-full h-full object-cover" alt={`Sabit ${idx}`} />
                                        <button onClick={() => handleCustomSceneImageDelete(idx)} className="absolute top-0.5 right-0.5 bg-rose-500/80 group-hover:opacity-100 hover:bg-rose-500 text-white p-0.5 rounded transition opacity-0 shadow-lg"><Trash2 size={10} /></button>
                                        <div className="absolute bottom-0 left-0 bg-black/70 w-full text-center text-[7px] font-bold py-0.5 text-cyan-400 backdrop-blur-sm tracking-wider">S{idx + 1}</div>
                                    </div>
                                ))}
                                {(!studioMedia.customSceneImages || studioMedia.customSceneImages.length < 999) && (
                                    <label className="w-14 h-14 rounded-lg border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center justify-center cursor-pointer transition text-cyan-400">
                                        <UploadCloud size={16} className="mb-0.5 opacity-80" /><span className="text-[7px] font-bold uppercase tracking-wider opacity-80">Ekle</span>
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleCustomSceneImagesUpload} />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* MEDYA YÜKLE */}
                        <div className="bg-black/30 border border-slate-800 rounded-xl p-2.5 shadow-lg">
                            <h2 className="text-[10px] font-black text-indigo-400 mb-1 flex items-center gap-1.5"><FileText size={12} /> MEDYA YÜKLE</h2>
                            <div className="flex flex-wrap gap-2">
                                {uiState.selectedMediaFiles && uiState.selectedMediaFiles.slice(0, 5).map((file, idx) => (
                                    <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700 shadow-md group">
                                        {file.type.startsWith('image') ? <img src={file.data} className="w-full h-full object-cover" alt={`Medya ${idx}`} /> : <div className="w-full h-full flex items-center justify-center text-[7px] font-bold text-indigo-400 bg-slate-900">{file.name.split('.').pop().toUpperCase()}</div>}
                                        <button onClick={() => setUiState(prev => ({ ...prev, selectedMediaFiles: prev.selectedMediaFiles.filter((_, i) => i !== idx) }))} className="absolute top-0.5 right-0.5 bg-rose-500/80 group-hover:opacity-100 hover:bg-rose-500 text-white p-0.5 rounded transition opacity-0 shadow-lg"><Trash2 size={10} /></button>
                                        <div className="absolute bottom-0 left-0 bg-black/70 w-full text-center text-[7px] font-bold py-0.5 text-indigo-400 backdrop-blur-sm tracking-wider">M{idx + 1}</div>
                                    </div>
                                ))}
                                <label className="w-14 h-14 rounded-lg border-2 border-dashed border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-500/10 flex flex-col items-center justify-center cursor-pointer transition text-indigo-400">
                                    <UploadCloud size={16} className="mb-0.5 opacity-80" /><span className="text-[7px] font-bold uppercase tracking-wider opacity-80">Ekle</span>
                                    <input type="file" multiple accept="*/*" className="hidden" onChange={(e) => { processSelectedFiles(Array.from(e.target.files)); e.target.value = null; }} />
                                </label>
                                {uiState.selectedMediaFiles.length > 5 && <div className="w-14 h-14 rounded-lg bg-slate-800/50 flex items-center justify-center text-[9px] text-slate-400 font-bold border border-slate-700">+{uiState.selectedMediaFiles.length - 5}</div>}
                            </div>
                        </div>
                    </div>

                    {/* === GAZETE TAKİP GALERİSİ === */}
                    {activeTab === 'gazete' && (
                        <div className="mb-3">
                            {/* Kaynak seçici + Yenile */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex-1 flex gap-1.5">
                                    {[{id:'gazeteoku', label:'Gazeteoku (25+ Gazete)'}, {id:'aydinlik', label:'Aydınlık'}, {id:'yenimesaj', label:'Yeni Mesaj'}].map(src => (
                                        <button key={src.id} onClick={() => { setGazeteSource(src.id); }}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${gazeteSource === src.id ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-500'}`}>
                                            {src.label}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={fetchGazeteManşetleri} disabled={gazeteLoading}
                                    className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 border border-slate-700">
                                    {gazeteLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Yenile
                                </button>
                            </div>

                            {/* Hata mesajı */}
                            {gazeteError && (
                                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-xs font-bold mb-3 flex items-center gap-2">
                                    <AlertCircle size={14} /> {gazeteError}
                                </div>
                            )}

                            {/* Yükleniyor */}
                            {gazeteLoading && (
                                <div className="text-center py-12">
                                    <Loader2 size={32} className="text-emerald-400 animate-spin mx-auto mb-3" />
                                    <p className="text-slate-400 text-sm font-bold">Gazete manşetleri yükleniyor...</p>
                                </div>
                            )}

                            {/* Galeri Grid */}
                            {!gazeteLoading && gazeteItems.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">{gazeteItems.length} gazete bulundu</span>
                                        <div className="flex gap-1">
                                            <button onClick={() => setGazeteGalleryView('grid')} className={`p-1.5 rounded-lg text-[10px] ${gazeteGalleryView === 'grid' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'}`}>▦</button>
                                            <button onClick={() => setGazeteGalleryView('single')} className={`p-1.5 rounded-lg text-[10px] ${gazeteGalleryView === 'single' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'}`}>☐</button>
                                        </div>
                                    </div>

                                    {gazeteGalleryView === 'grid' ? (
                                        /* GRID GÖRÜNÜMÜ — küçük kartlar */
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-[50vh] overflow-y-auto p-1">
                                            {gazeteItems.map((item, idx) => (
                                                <div key={idx} className="group relative bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-emerald-500/50 transition-all cursor-pointer"
                                                    onClick={() => { setGazeteCurrentIdx(idx); setGazeteGalleryView('single'); }}>
                                                    <img src={item.src} crossOrigin="anonymous" className="w-full h-auto block" alt={item.name} loading="lazy" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-1.5">
                                                        <span className="text-white text-[8px] font-bold text-center leading-tight">{item.name}</span>
                                                    </div>
                                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                                        <button onClick={(e) => { e.stopPropagation(); openCropModal(item.src, item.name); }}
                                                            className="bg-indigo-600 hover:bg-indigo-500 text-white p-1 rounded-md shadow-lg" title="Crop yap">
                                                            <Scissors size={10} />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); addFullImageToMedia(item.src, item.name); }}
                                                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded-md shadow-lg" title="Tam sayfa ekle">
                                                            <Check size={10} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        /* TEKLİ GÖRÜNÜM — büyük önizleme */
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-2">
                                                <button onClick={() => setGazeteCurrentIdx(Math.max(0, gazeteCurrentIdx - 1))} disabled={gazeteCurrentIdx === 0}
                                                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white px-3 py-1.5 rounded-lg text-xs font-bold">← Önceki</button>
                                                <span className="text-white text-sm font-bold">{gazeteItems[gazeteCurrentIdx]?.name} <span className="text-slate-500">({gazeteCurrentIdx + 1}/{gazeteItems.length})</span></span>
                                                <button onClick={() => setGazeteCurrentIdx(Math.min(gazeteItems.length - 1, gazeteCurrentIdx + 1))} disabled={gazeteCurrentIdx >= gazeteItems.length - 1}
                                                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Sonraki →</button>
                                            </div>
                                            <div className="relative bg-black/50 rounded-xl overflow-hidden border border-slate-700/50">
                                                <img src={gazeteItems[gazeteCurrentIdx]?.src} crossOrigin="anonymous" className="w-full h-auto block" alt={gazeteItems[gazeteCurrentIdx]?.name} />
                                                {/* Overlay butonlar */}
                                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                                                    <button onClick={() => openCropModal(gazeteItems[gazeteCurrentIdx]?.src, gazeteItems[gazeteCurrentIdx]?.name)}
                                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-500/30">
                                                        <Scissors size={14} /> Crop Yap
                                                    </button>
                                                    <button onClick={() => addFullImageToMedia(gazeteItems[gazeteCurrentIdx]?.src, gazeteItems[gazeteCurrentIdx]?.name)}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/30">
                                                        <Check size={14} /> Tam Sayfa Ekle
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Boş durum */}
                            {!gazeteLoading && gazeteItems.length === 0 && !gazeteError && (
                                <div className="text-center py-12">
                                    <Newspaper size={48} className="text-slate-700 mx-auto mb-3" />
                                    <p className="text-slate-500 text-sm font-bold">Gazete manşetleri yüklenmedi</p>
                                    <p className="text-slate-600 text-xs mt-1">Yukarıdaki "Yenile" butonuna tıklayın</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CROP MODAL */}
                    {gazeteCropModal && (
                        <GazeteCropModal
                            src={gazeteCropModal.src}
                            name={gazeteCropModal.name}
                            onClose={() => setGazeteCropModal(null)}
                            onCrop={applyCrop}
                        />
                    )}

                    {/* METİN GİRİŞİ (text/URL/prompt için) */}
                    {activeTab !== 'media' && activeTab !== 'gazete' && (
                        <textarea value={textInput} onChange={e => setTextInput(e.target.value)} placeholder={(config.tip === 'guzel_soz' || config.tip === 'iddia_analizi') ? (activeTab === 'url' ? "Konu linkini yapıştırın..." : "Konu başlığı yazın... (Örn: 'Özgürlüğün Bedeli', 'Adalet Güçlüler İçin Mi?')") : (activeTab === 'url' ? "Haber linkini yapıştırın..." : "Haberi yazın veya araştırılacak gündemi verin...")} className={`w-full h-20 bg-black/30 border rounded-xl p-3 text-sm outline-none mb-3 text-slate-200 resize-none transition-all relative z-0 ${activeTab === 'prompt' ? 'border-fuchsia-500/50 focus:border-fuchsia-500' : 'border-slate-800 focus:border-indigo-500'}`} />
                    )}

                    <div className="flex justify-between items-center mb-3 px-2">
                        {config.tip === 'iddia_analizi' ? (
                            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-500/20">İddia Analizi — Fact Check + Video Üretimi</span>
                        ) : config.tip === 'guzel_soz' ? (
                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">Felsefi Video — Hook + Düşünür Sözleri + CTA</span>
                        ) : (<><span className="text-xs text-slate-500 flex items-center gap-1"><Type size={12} /> Dil: {getWPS(config.language)} kelime/sn</span>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">Hedef: ~{maxWordsUI} kelime</span></>)}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 relative z-0">
                        <button onClick={() => handleExecuteStart(uiState.selectedMediaFiles, 'image')} disabled={uiState.isProcessing || ((config.tip === 'guzel_soz' || config.tip === 'iddia_analizi') ? (!textInput.trim() && uiState.selectedMediaFiles.length === 0) : ((activeTab === 'media' || activeTab === 'gazete') ? uiState.selectedMediaFiles.length === 0 : !textInput.trim()))} className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-slate-200 py-2.5 md:py-3 rounded-full font-medium text-xs transition-all border border-slate-700 flex items-center justify-center gap-2">
                            {uiState.isProcessing && config.outputType === 'image' ? <><Loader2 size={16} className="animate-spin" /> İŞLENİYOR...</> : <><ImagePlus size={16} /> {config.tip === 'iddia_analizi' ? 'İddia Analizi Yap' : (config.tip === 'guzel_soz' || config.tip === 'iddia_analizi') ? 'Kart Oluştur' : 'Görsel oluştur'}</>}
                        </button>
                        <button onClick={() => handleExecuteStart(uiState.selectedMediaFiles, 'video')} disabled={uiState.isProcessing || ((config.tip === 'guzel_soz' || config.tip === 'iddia_analizi') ? (!textInput.trim() && uiState.selectedMediaFiles.length === 0) : ((activeTab === 'media' || activeTab === 'gazete') ? uiState.selectedMediaFiles.length === 0 : !textInput.trim()))} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 disabled:text-indigo-400 text-white py-2.5 md:py-3 rounded-full font-bold text-xs transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                            {uiState.isProcessing && config.outputType === 'video' ? <><Loader2 size={16} className="animate-spin" /> İŞLENİYOR...</> : <>{config.tip === 'iddia_analizi' ? <><Eye size={16} /> İddia Analizi</> : (config.tip === 'guzel_soz' || config.tip === 'iddia_analizi') ? <><Wand2 size={16} /> Güzel Söz Oluştur</> : <><Clapperboard size={16} /> Video oluştur</>}</>}
                        </button>
                    </div>
                </div>

                {/* HATA */}
                {uiState.error && (
                    <div className="mt-6 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex gap-3 text-rose-400 text-sm font-medium items-start">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <div><strong className="block mb-1">Hata</strong>{String(uiState.error)}</div>
                    </div>
                )}

                {/* ÇIKTI */}
                {uiState.videoUrl && (
                    <div className="mt-8 bg-slate-900 border border-emerald-900/50 p-6 rounded-3xl shadow-2xl text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold mb-4">
                            <ShieldCheck size={14} /> {(config.tip === 'guzel_soz' || config.tip === 'iddia_analizi') ? 'GÜZEL SÖZ OLUŞTURULDU' : (config.outputType === 'image' ? 'GÖRSEL OLUŞTURULDU' : 'VIDEO OLUŞTURULDU')}
                        </div>
                        {config.outputType === 'image' ? <img src={uiState.videoUrl} className="w-full max-w-md mx-auto rounded-2xl shadow-lg ring-1 ring-white/10 object-cover" alt="Output" /> : <video src={uiState.videoUrl} controls autoPlay className="w-full max-w-md mx-auto rounded-2xl shadow-lg ring-1 ring-white/10" />}
                        <div className="mt-4 flex justify-center gap-3 flex-wrap">
                            <button onClick={() => { const a = document.createElement('a'); a.href = uiState.videoUrl; const rawTitle = workflowRef.current?.state?.script?.thumbnailText || 'video'; const ext = config.outputType === 'image' ? '.png' : (config.videoFormat === 'mp4' ? '.mp4' : '.webm'); a.download = rawTitle.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "_").toLowerCase() + ext; a.click(); }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"><Download size={14} /> İNDİR</button>
                            <button onClick={() => setShowSharePanel(!showSharePanel)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"><Share2 size={14} /> PAYLAŞ</button>
                            <button onClick={async () => { setUiState(prev => ({ ...prev, videoUrl: null, selectedMediaFiles: [], percent: 0, statusText: '', error: '' })); setConfig(prev => ({ ...prev, yorum: '' })); for (let i = 0; i < 999; i++) await AssetManagerService.deleteMedia("CUSTOM_SCENE_IMG_" + i); setStudioMedia(s => ({ ...s, customSceneImages: [] })); }} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"><RotateCcw size={14} /> {(config.tip === 'guzel_soz' || config.tip === 'iddia_analizi') ? 'YENİ SÖZ' : 'YENİ HABER'}</button>
                        </div>

                        {showSharePanel && (
                            <div className="mt-4 bg-slate-800 border border-slate-700 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-white">Sosyal Medya Paylaşımı</h3>
                                    <button onClick={() => setShowSharePanel(false)} className="text-slate-400 hover:text-white">✕</button>
                                </div>
                                {/* Hızlı seçim butonları: X, TikTok, Instagram, Facebook */}
                                <div className="flex gap-2 mb-3">
                                    {['x', 'tiktok', 'instagram', 'facebook'].map(pid => {
                                        const p = SOCIAL_PLATFORMS.find(pl => pl.id === pid);
                                        return (
                                            <button key={pid} onClick={() => toggleShareTarget(pid)}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${shareTargets[pid] ? 'bg-indigo-500/30 border-indigo-500/60 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                                                {p.name.split(' ')[0]}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                                    {SOCIAL_PLATFORMS.map(platform => (
                                        <div key={platform.id} className={`p-3 rounded-xl border cursor-pointer transition-all ${shareTargets[platform.id] ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`} onClick={() => toggleShareTarget(platform.id)}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }} />
                                                <span className="text-xs font-bold text-white">{platform.name}</span>
                                            </div>
                                            {connectedPlatforms[platform.id] && <span className="text-[10px] text-emerald-400 mt-1 block">Bağlı</span>}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={shareToSelectedPlatforms} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Share2 size={14} /> Seçilenlerde Paylaş</button>
                                    <button onClick={copyShareLink} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-xs font-bold"><Copy size={14} /></button>
                                    {typeof navigator !== 'undefined' && navigator.share && <button onClick={nativeShare} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold">Cihazda Paylaş</button>}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* İŞLEM EKRANI */}
            {uiState.isProcessing && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-lg p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden text-center">
                        <div className="absolute top-0 left-0 h-1 bg-indigo-600 transition-all duration-300 animate-pulse" style={{ width: `${uiState.percent}%` }}></div>
                        <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4"><Loader2 size={28} className="text-indigo-400 animate-spin" /></div>
                        <h2 className="text-5xl font-black text-white mb-2">{Math.round(uiState.percent)}%</h2>
                        <p className="text-indigo-400 font-bold text-sm mb-3 uppercase tracking-widest">{uiState.statusText}</p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-mono mb-4 border border-slate-700/50"><Clock size={12} /> Geçen: {elapsedSeconds}sn</div>
                        {sysLogs && sysLogs.length > 0 && (
                            <div className="mt-4 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-left font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto space-y-1.5">
                                {sysLogs.map((log, idx) => { let c = "text-slate-400"; if (log.type === "success") c = "text-emerald-400 font-bold"; if (log.type === "warn") c = "text-amber-400 font-bold"; if (log.type === "error") c = "text-rose-400 font-bold animate-pulse"; return (<div key={idx} className={`flex items-start gap-2 ${c}`}><span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span><span className="break-all">{log.text}</span></div>); })}
                                <div ref={logEndRef} />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* OTURUM HATASI */}
            {authExpired && (
                <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[9999] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border-2 border-red-500/40 w-full max-w-md p-8 rounded-3xl shadow-2xl text-center">
                        <h2 className="text-2xl font-black text-white mb-3">OTURUM SÜRESİ DOLDU</h2>
                        <p className="text-slate-400 text-sm mb-6">Lütfen sayfayı yenileyin.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleSilentRecovery} className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"><ShieldCheck size={16} /> OTURUMU YENİLE</button>
                            <button onClick={() => setAuthExpired(false)} className="w-full bg-slate-800 text-slate-300 font-bold py-3 rounded-xl text-xs">GÖZARDI ET</button>
                            <button onClick={() => window.location.reload()} className="w-full bg-red-600/20 text-red-400 font-bold py-3 rounded-xl text-xs border border-red-500/30">SAYFAYI YENİLE (F5)</button>
                        </div>
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} style={{ position: 'fixed', top: '-10000px', left: '-10000px', zIndex: -50 }} />
        </div>
    );
}