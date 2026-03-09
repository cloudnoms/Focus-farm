import React, { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const FOCUS_DURATION = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;
const COINS_PER_SESSION = 10;
const GRID_SIZE = 8;

// ─── SVG SPRITES ─────────────────────────────────────────────────────────────
// Pixel-art inspired SVGs in a Stardew Valley style

const SVG = {
  // ── TOMATO STAGES ──
  tomato_0: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><rect x="7" y="11" width="2" height="3" fill="#8B6914"/><ellipse cx="8" cy="10" rx="3" ry="2" fill="#a0784e"/><rect x="6" y="9" width="4" height="2" fill="#c8a96e"/></svg>),
  tomato_1: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><rect x="7" y="10" width="2" height="4" fill="#5a8a2e"/><ellipse cx="8" cy="9" rx="2" ry="3" fill="#6aaa3e"/><rect x="6" y="7" width="4" height="2" fill="#7aca4e"/><rect x="5" y="6" width="6" height="2" fill="#5a8a2e"/></svg>),
  tomato_2: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><rect x="7" y="11" width="2" height="3" fill="#5a8a2e"/><rect x="4" y="4" width="8" height="8" rx="1" fill="#6aaa3e"/><rect x="5" y="3" width="6" height="7" fill="#7aca4e"/><rect x="3" y="6" width="10" height="4" fill="#6aaa3e"/><rect x="6" y="2" width="4" height="3" fill="#5a8a2e"/></svg>),
  tomato_3: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><rect x="7" y="12" width="2" height="2" fill="#5a8a2e"/><rect x="6" y="2" width="4" height="2" fill="#5a8a2e"/><ellipse cx="8" cy="9" rx="5" ry="5" fill="#c0392b"/><ellipse cx="8" cy="8" rx="4" ry="4" fill="#e74c3c"/><rect x="7" y="4" width="2" height="3" fill="#27ae60"/><ellipse cx="10" cy="7" rx="1" ry="1" fill="#ff6b6b"/></svg>),

  // ── CORN STAGES ──
  corn_0: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><rect x="7" y="11" width="2" height="3" fill="#8B6914"/><ellipse cx="8" cy="10" rx="3" ry="2" fill="#a0784e"/><rect x="6" y="9" width="4" height="2" fill="#c8a96e"/></svg>),
  corn_1: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><rect x="7" y="6" width="2" height="8" fill="#5a8a2e"/><rect x="4" y="9" width="5" height="2" rx="1" fill="#7aca4e"/><rect x="7" y="7" width="5" height="2" rx="1" fill="#6aaa3e"/></svg>),
  corn_2: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><rect x="7" y="3" width="2" height="11" fill="#5a8a2e"/><rect x="3" y="8" width="6" height="2" rx="1" fill="#7aca4e"/><rect x="7" y="5" width="6" height="2" rx="1" fill="#6aaa3e"/><rect x="3" y="11" width="5" height="2" rx="1" fill="#7aca4e"/><rect x="6" y="2" width="3" height="3" fill="#8aea5e"/></svg>),
  corn_3: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><rect x="7" y="2" width="2" height="12" fill="#5a8a2e"/><rect x="3" y="6" width="5" height="2" rx="1" fill="#7aca4e"/><rect x="8" y="8" width="5" height="2" rx="1" fill="#6aaa3e"/><rect x="5" y="4" width="3" height="7" rx="1" fill="#f1c40f"/><rect x="5" y="5" width="1" height="1" fill="#f6c90e"/><rect x="6" y="6" width="1" height="1" fill="#f6c90e"/><rect x="5" y="7" width="1" height="1" fill="#f6c90e"/><rect x="6" y="8" width="1" height="1" fill="#f6c90e"/><rect x="5" y="9" width="1" height="1" fill="#f6c90e"/><rect x="7" y="2" width="2" height="3" fill="#8aea5e"/></svg>),

  // ── POTATO STAGES ──
  potato_0: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><rect x="7" y="11" width="2" height="3" fill="#8B6914"/><ellipse cx="8" cy="10" rx="3" ry="2" fill="#a0784e"/></svg>),
  potato_1: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><rect x="7" y="8" width="2" height="6" fill="#5a8a2e"/><rect x="4" y="6" width="4" height="4" rx="2" fill="#7aca4e"/><rect x="8" y="7" width="4" height="3" rx="1" fill="#6aaa3e"/></svg>),
  potato_2: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><rect x="7" y="7" width="2" height="7" fill="#5a8a2e"/><rect x="3" y="4" width="5" height="5" rx="2" fill="#7aca4e"/><rect x="8" y="5" width="5" height="4" rx="2" fill="#6aaa3e"/><rect x="5" y="3" width="3" height="3" rx="1" fill="#8aea5e"/></svg>),
  potato_3: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><rect x="7" y="5" width="2" height="5" fill="#5a8a2e"/><rect x="3" y="3" width="4" height="4" rx="2" fill="#7aca4e"/><rect x="9" y="3" width="4" height="4" rx="2" fill="#6aaa3e"/><ellipse cx="5" cy="11" rx="3" ry="2" fill="#c8a050"/><ellipse cx="10" cy="12" rx="2" ry="1.5" fill="#b8903e"/><ellipse cx="8" cy="13" rx="2" ry="1.5" fill="#d4b060"/><rect x="4" y="10" width="2" height="1" fill="#e8c870" opacity="0.6"/></svg>),

  // ── CABBAGE STAGES ──
  cabbage_0: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><rect x="7" y="11" width="2" height="3" fill="#8B6914"/><ellipse cx="8" cy="10" rx="3" ry="2" fill="#a0784e"/></svg>),
  cabbage_1: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><rect x="7" y="10" width="2" height="4" fill="#5a8a2e"/><ellipse cx="8" cy="9" rx="3" ry="3" fill="#6aaa3e"/><ellipse cx="8" cy="8" rx="2" ry="2" fill="#7aca4e"/></svg>),
  cabbage_2: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><ellipse cx="8" cy="10" rx="5" ry="4" fill="#27ae60"/><ellipse cx="8" cy="9" rx="4" ry="3" fill="#2ecc71"/><ellipse cx="8" cy="8" rx="3" ry="3" fill="#3edd82"/><rect x="5" y="7" width="6" height="2" fill="#2ecc71" opacity="0.5"/></svg>),
  cabbage_3: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><ellipse cx="8" cy="10" rx="6" ry="4" fill="#1a8a48"/><ellipse cx="8" cy="9" rx="5" ry="3.5" fill="#27ae60"/><ellipse cx="8" cy="8" rx="4" ry="3" fill="#2ecc71"/><ellipse cx="8" cy="7" rx="3" ry="2.5" fill="#3edd82"/><ellipse cx="8" cy="7" rx="2" ry="1.5" fill="#55f09a"/><rect x="4" y="8" width="8" height="1" fill="#27ae60" opacity="0.4"/><rect x="5" y="6" width="6" height="1" fill="#2ecc71" opacity="0.4"/></svg>),

  // ── CHICKEN STAGES ──
  chicken_0: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><ellipse cx="8" cy="10" rx="4" ry="5" fill="#f5f0d8"/><ellipse cx="8" cy="9" rx="3" ry="4" fill="#fffde8"/><ellipse cx="9" cy="8" rx="1" ry="1" fill="#f5f0d8" opacity="0.6"/></svg>),
  chicken_1: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><ellipse cx="8" cy="11" rx="4" ry="3" fill="#f6c90e"/><ellipse cx="8" cy="7" rx="3" ry="3" fill="#f6c90e"/><ellipse cx="9" cy="6" rx="2" ry="2" fill="#ffe066"/><rect x="7" y="9" width="2" height="3" fill="#f6c90e"/><rect x="6" y="9" width="2" height="1" fill="#e8aa00"/><rect x="10" y="9" width="2" height="1" fill="#e8aa00"/><rect x="7" y="6" width="2" height="1" fill="#e8722e"/><ellipse cx="10" cy="6" rx="1" ry="1" fill="#2c2c2c"/></svg>),
  chicken_2: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><rect x="4" y="9" width="8" height="5" rx="2" fill="#f5f0e0"/><ellipse cx="8" cy="9" rx="4" ry="4" fill="#f5f0e0"/><ellipse cx="11" cy="7" rx="3" ry="3" fill="#f5f0e0"/><rect x="9" y="6" width="4" height="4" fill="#f5f0e0"/><rect x="6" y="13" width="2" height="2" fill="#e8722e"/><rect x="9" y="13" width="2" height="2" fill="#e8722e"/><rect x="10" y="7" width="3" height="2" fill="#e8722e"/><ellipse cx="12" cy="6" rx="1" ry="1" fill="#2c2c2c"/><rect x="11" y="5" width="2" height="1" fill="#cc3333"/></svg>),

  // ── PIG STAGES ──
  pig_0: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><ellipse cx="8" cy="11" rx="4" ry="3" fill="#f4a0b0"/><ellipse cx="8" cy="8" rx="3" ry="3" fill="#f4a0b0"/><ellipse cx="8" cy="9" rx="2" ry="2" fill="#ffb8c8"/><rect x="5" y="13" width="2" height="2" fill="#f4a0b0"/><rect x="9" y="13" width="2" height="2" fill="#f4a0b0"/><ellipse cx="8" cy="7" rx="2" ry="1.5" fill="#ffb8c8"/><ellipse cx="7" cy="7" rx="0.5" ry="0.7" fill="#c0607e"/><ellipse cx="9" cy="7" rx="0.5" ry="0.7" fill="#c0607e"/><ellipse cx="5" cy="7" rx="1.5" ry="1.5" fill="#f4a0b0"/><ellipse cx="11" cy="7" rx="1.5" ry="1.5" fill="#f4a0b0"/><ellipse cx="6" cy="6" rx="0.8" ry="0.8" fill="#2c2c2c"/></svg>),
  pig_1: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><ellipse cx="8" cy="11" rx="6" ry="4" fill="#f4a0b0"/><ellipse cx="8" cy="8" rx="4" ry="4" fill="#f4a0b0"/><ellipse cx="8" cy="9" rx="3" ry="3" fill="#ffb8c8"/><rect x="3" y="13" width="2" height="3" fill="#f4a0b0"/><rect x="6" y="13" width="2" height="3" fill="#f4a0b0"/><rect x="9" y="13" width="2" height="3" fill="#f4a0b0"/><rect x="12" y="13" width="2" height="3" fill="#f4a0b0"/><ellipse cx="11" cy="8" rx="2" ry="2" fill="#ffb8c8"/><ellipse cx="10" cy="7" rx="0.7" ry="1" fill="#c0607e"/><ellipse cx="12" cy="7" rx="0.7" ry="1" fill="#c0607e"/><ellipse cx="4" cy="8" rx="1.5" ry="1.5" fill="#f4a0b0"/><ellipse cx="6" cy="6" rx="1" ry="1" fill="#2c2c2c"/></svg>),

  // ── COW STAGES ──
  cow_0: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><ellipse cx="8" cy="11" rx="4" ry="3" fill="#f5f0e8"/><ellipse cx="8" cy="8" rx="3" ry="3" fill="#f5f0e8"/><rect x="4" y="5" width="2" height="2" fill="#f5f0e8"/><rect x="10" y="5" width="2" height="2" fill="#f5f0e8"/><rect x="4" y="3" width="1" height="2" fill="#f5f0e8"/><rect x="11" y="3" width="1" height="2" fill="#f5f0e8"/><rect x="5" y="13" width="2" height="2" fill="#f5f0e8"/><rect x="9" y="13" width="2" height="2" fill="#f5f0e8"/><ellipse cx="5" cy="7" rx="1" ry="1" fill="#2c2c2c"/><rect x="3" y="9" width="3" height="2" rx="1" fill="#e8b0b0"/></svg>),
  cow_1: (<svg viewBox="0 0 16 16" width="100%" height="100%" style={{imageRendering:"pixelated"}}><ellipse cx="8" cy="11" rx="6" ry="4" fill="#f5f0e8"/><ellipse cx="8" cy="8" rx="5" ry="4" fill="#f5f0e8"/><rect x="2" y="5" width="3" height="3" fill="#f5f0e8"/><rect x="11" y="5" width="3" height="3" fill="#f5f0e8"/><rect x="2" y="3" width="2" height="3" fill="#f5f0e8"/><rect x="12" y="3" width="2" height="3" fill="#f5f0e8"/><rect x="3" y="13" width="2" height="3" fill="#f5f0e8"/><rect x="6" y="14" width="2" height="2" fill="#f5f0e8"/><rect x="9" y="14" width="2" height="2" fill="#f5f0e8"/><rect x="12" y="13" width="2" height="3" fill="#f5f0e8"/><ellipse cx="4" cy="7" rx="1.5" ry="1.5" fill="#2c2c2c" opacity="0.8"/><ellipse cx="6" cy="6" rx="1" ry="1" fill="#2c2c2c"/><rect x="1" y="10" width="4" height="3" rx="1" fill="#e8b0b0"/><rect x="2" y="11" width="1" height="2" fill="#c87070"/><rect x="4" y="11" width="1" height="2" fill="#c87070"/><ellipse cx="10" cy="8" rx="2" ry="2" fill="#8B6914" opacity="0.3"/></svg>),

  // ── SHOP ICONS (larger versions) ──
  shopTomato: (<svg viewBox="0 0 32 32" width="48" height="48" style={{imageRendering:"pixelated"}}><rect x="14" y="4" width="4" height="4" fill="#27ae60"/><rect x="12" y="6" width="8" height="2" fill="#27ae60"/><ellipse cx="16" cy="20" rx="10" ry="10" fill="#c0392b"/><ellipse cx="16" cy="18" rx="8" ry="8" fill="#e74c3c"/><ellipse cx="19" cy="15" rx="2" ry="2" fill="#ff6b6b"/></svg>),
  shopCorn: (<svg viewBox="0 0 32 32" width="48" height="48" style={{imageRendering:"pixelated"}}><rect x="14" y="2" width="4" height="6" fill="#27ae60"/><rect x="10" y="10" width="12" height="18" rx="6" fill="#f39c12"/><rect x="10" y="10" width="12" height="18" rx="6" fill="#f1c40f" opacity="0.7"/><rect x="11" y="12" width="2" height="2" fill="#f6c90e"/><rect x="14" y="12" width="2" height="2" fill="#f6c90e"/><rect x="17" y="12" width="2" height="2" fill="#f6c90e"/><rect x="11" y="15" width="2" height="2" fill="#f6c90e"/><rect x="14" y="15" width="2" height="2" fill="#f6c90e"/><rect x="17" y="15" width="2" height="2" fill="#f6c90e"/><rect x="11" y="18" width="2" height="2" fill="#f6c90e"/><rect x="14" y="18" width="2" height="2" fill="#f6c90e"/><rect x="17" y="18" width="2" height="2" fill="#f6c90e"/><rect x="8" y="12" width="4" height="8" rx="2" fill="#27ae60"/><rect x="20" y="14" width="4" height="8" rx="2" fill="#27ae60"/></svg>),
  shopPotato: (<svg viewBox="0 0 32 32" width="48" height="48" style={{imageRendering:"pixelated"}}><rect x="12" y="4" width="4" height="6" fill="#27ae60"/><rect x="8" y="6" width="6" height="4" rx="2" fill="#6aaa3e"/><ellipse cx="16" cy="20" rx="9" ry="7" fill="#c8a050"/><ellipse cx="16" cy="19" rx="7" ry="6" fill="#d4b060"/><ellipse cx="12" cy="17" rx="2" ry="1.5" fill="#b8903e"/><ellipse cx="19" cy="21" rx="1.5" ry="1" fill="#b8903e"/></svg>),
  shopCabbage: (<svg viewBox="0 0 32 32" width="48" height="48" style={{imageRendering:"pixelated"}}><ellipse cx="16" cy="20" rx="12" ry="8" fill="#1a8a48"/><ellipse cx="16" cy="18" rx="10" ry="7" fill="#27ae60"/><ellipse cx="16" cy="16" rx="8" ry="6" fill="#2ecc71"/><ellipse cx="16" cy="14" rx="6" ry="5" fill="#3edd82"/><ellipse cx="16" cy="13" rx="4" ry="3" fill="#55f09a"/><rect x="8" y="16" width="16" height="2" fill="#27ae60" opacity="0.4"/><rect x="10" y="12" width="12" height="2" fill="#2ecc71" opacity="0.4"/></svg>),
  shopChicken: (<svg viewBox="0 0 32 32" width="48" height="48" style={{imageRendering:"pixelated"}}><rect x="8" y="18" width="16" height="10" rx="4" fill="#f5f0e0"/><ellipse cx="16" cy="16" rx="8" ry="8" fill="#f5f0e0"/><ellipse cx="22" cy="12" rx="6" ry="6" fill="#f5f0e0"/><rect x="20" y="10" width="8" height="8" fill="#f5f0e0"/><rect x="12" y="26" width="4" height="4" fill="#e8722e"/><rect x="18" y="26" width="4" height="4" fill="#e8722e"/><rect x="22" y="12" width="6" height="4" fill="#e8722e"/><ellipse cx="26" cy="11" rx="2" ry="2" fill="#2c2c2c"/><rect x="24" y="8" width="5" height="3" fill="#cc3333"/></svg>),
  shopPig: (<svg viewBox="0 0 32 32" width="48" height="48" style={{imageRendering:"pixelated"}}><ellipse cx="16" cy="22" rx="12" ry="8" fill="#f4a0b0"/><ellipse cx="16" cy="16" rx="9" ry="9" fill="#f4a0b0"/><ellipse cx="16" cy="17" rx="7" ry="7" fill="#ffb8c8"/><rect x="6" y="10" width="5" height="5" rx="2" fill="#f4a0b0"/><rect x="21" y="10" width="5" height="5" rx="2" fill="#f4a0b0"/><ellipse cx="22" cy="15" rx="4" ry="4" fill="#ffb8c8"/><ellipse cx="20" cy="14" rx="1.5" ry="2" fill="#c0607e"/><ellipse cx="24" cy="14" rx="1.5" ry="2" fill="#c0607e"/><ellipse cx="11" cy="13" rx="2" ry="2" fill="#2c2c2c"/><rect x="6" y="28" width="4" height="4" fill="#f4a0b0"/><rect x="12" y="28" width="4" height="4" fill="#f4a0b0"/><rect x="18" y="28" width="4" height="4" fill="#f4a0b0"/><rect x="24" y="28" width="4" height="4" fill="#f4a0b0"/></svg>),
  shopCow: (<svg viewBox="0 0 32 32" width="48" height="48" style={{imageRendering:"pixelated"}}><ellipse cx="16" cy="22" rx="12" ry="8" fill="#f5f0e8"/><ellipse cx="16" cy="16" rx="10" ry="8" fill="#f5f0e8"/><rect x="4" y="10" width="6" height="6" rx="2" fill="#f5f0e8"/><rect x="22" y="10" width="6" height="6" rx="2" fill="#f5f0e8"/><rect x="4" y="6" width="4" height="6" rx="2" fill="#f5f0e8"/><rect x="24" y="6" width="4" height="6" rx="2" fill="#f5f0e8"/><rect x="6" y="28" width="4" height="4" fill="#f5f0e8"/><rect x="12" y="28" width="4" height="4" fill="#f5f0e8"/><rect x="18" y="28" width="4" height="4" fill="#f5f0e8"/><rect x="24" y="28" width="4" height="4" fill="#f5f0e8"/><ellipse cx="9" cy="14" rx="3" ry="3" fill="#2c2c2c" opacity="0.8"/><ellipse cx="12" cy="12" rx="2" ry="2" fill="#2c2c2c"/><rect x="2" y="20" width="8" height="6" rx="2" fill="#e8b0b0"/><rect x="3" y="22" width="2" height="4" fill="#c87070"/><rect x="7" y="22" width="2" height="4" fill="#c87070"/><ellipse cx="20" cy="17" rx="4" ry="3" fill="#8B6914" opacity="0.25"/></svg>),

  // ── COIN ──
  coin: (<svg viewBox="0 0 16 16" width="20" height="20" style={{imageRendering:"pixelated"}}><ellipse cx="8" cy="8" rx="7" ry="7" fill="#f39c12"/><ellipse cx="8" cy="7" rx="6" ry="6" fill="#f6c90e"/><ellipse cx="8" cy="7" rx="4" ry="4" fill="#f39c12" opacity="0.4"/><rect x="7" y="4" width="2" height="6" fill="#f39c12" opacity="0.6"/></svg>),
};

// ─── DATA ─────────────────────────────────────────────────────────────────────
const CROPS = {
  tomato:  { name: "Tomato",  shopIcon: "shopTomato",  price: 20, stageKeys: ["tomato_0","tomato_1","tomato_2","tomato_3"],     color: "#e74c3c" },
  corn:    { name: "Corn",    shopIcon: "shopCorn",    price: 30, stageKeys: ["corn_0","corn_1","corn_2","corn_3"],             color: "#f1c40f" },
  potato:  { name: "Potato",  shopIcon: "shopPotato",  price: 30, stageKeys: ["potato_0","potato_1","potato_2","potato_3"],    color: "#8B6914" },
  cabbage: { name: "Cabbage", shopIcon: "shopCabbage", price: 40, stageKeys: ["cabbage_0","cabbage_1","cabbage_2","cabbage_3"],color: "#27ae60" },
};

const ANIMALS = {
  chicken: { name: "Chicken", shopIcon: "shopChicken", price: 80,  stageKeys: ["chicken_0","chicken_1","chicken_2"] },
  pig:     { name: "Pig",     shopIcon: "shopPig",     price: 120, stageKeys: ["pig_0","pig_1"] },
  cow:     { name: "Cow",     shopIcon: "shopCow",     price: 200, stageKeys: ["cow_0","cow_1"] },
};

const MILESTONES = [
  { sessions: 5,  label: "River unlocked", emoji: "🏞️" },
  { sessions: 15, label: "Barn built",      emoji: "🏚️" },
  { sessions: 30, label: "Orchard planted", emoji: "🌳" },
  { sessions: 50, label: "Pond added",      emoji: "🏝️" },
];

const ACHIEVEMENTS = [
  { id: "first_session", label: "First Focus",  desc: "Complete your first session", emoji: "🌟", condition: s => s.totalSessions >= 1 },
  { id: "ten_sessions",  label: "On A Roll",     desc: "Complete 10 sessions",        emoji: "🔥", condition: s => s.totalSessions >= 10 },
  { id: "streak_3",      label: "Streak Master", desc: "3-day streak",                emoji: "⚡", condition: s => s.streak >= 3 },
  { id: "first_harvest", label: "First Harvest", desc: "Grow a crop to full maturity",emoji: "🌾", condition: s => s.harvests >= 1 },
  { id: "first_animal",  label: "Farmer",        desc: "Add an animal to your farm",  emoji: "🐾", condition: s => s.animals >= 1 },
];

// ─── DEFAULT STATE ─────────────────────────────────────────────────────────────
const defaultState = () => ({
  coins: 50, totalSessions: 0, todaySessions: 0, streak: 1,
  lastActiveDate: new Date().toDateString(),
  harvests: 0, animals: 0,
  inventory: { tomato: 2, corn: 1 },
  grid: Array(GRID_SIZE * GRID_SIZE).fill(null),
  unlockedAchievements: [], selectedItem: null,
});

// ─── HOOKS ────────────────────────────────────────────────────────────────────
function useLocalStorage(key, init) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? { ...init, ...JSON.parse(stored) } : init;
    } catch { return init; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
}

// ─── AUDIO ────────────────────────────────────────────────────────────────────
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    if (type === "start") {
      // Two soft ascending tones — gentle "let's go"
      [[440, 0], [554, 0.15]].forEach(([freq, delay]) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + delay + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.4);
      });
    }

    if (type === "pause") {
      // Soft descending tone — "taking a breath"
      [[440, 0], [330, 0.12]].forEach(([freq, delay]) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + delay + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.35);
      });
    }

    if (type === "complete") {
      // Cheerful 4-note ascending chime — session done!
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.18 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.5);
        osc.start(ctx.currentTime + i * 0.18); osc.stop(ctx.currentTime + i * 0.18 + 0.6);
      });
    }

    if (type === "plant") {
      // Soft plop — satisfying placement
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    }

    if (type === "buy") {
      // Coin clink
      [800, 1000].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "triangle"; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.2);
        osc.start(ctx.currentTime + i * 0.06); osc.stop(ctx.currentTime + i * 0.06 + 0.25);
      });
    }
  } catch {}
}

// ─── COIN DISPLAY ──────────────────────────────────────────────────────────────
function CoinDisplay({ coins, pulse }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: "rgba(255,220,100,0.18)", border: "1.5px solid #f6c90e",
      borderRadius: 20, padding: "5px 14px", fontFamily: "'Fredoka One', cursive",
      fontSize: 18, color: "#b8860b", transition: "transform 0.2s",
      transform: pulse ? "scale(1.18)" : "scale(1)",
    }}>
      <span style={{display:"inline-flex",verticalAlign:"middle"}}>{SVG.coin}</span>
      {coins}
    </div>
  );
}

// ─── PROGRESS RING ─────────────────────────────────────────────────────────────
function ProgressRing({ progress, sessionType }) {
  const r = 88, circ = 2 * Math.PI * r;
  const colors = { focus: "#5a8a4e", break: "#6aabcc", longbreak: "#9b59b6" };
  const c = colors[sessionType] || "#5a8a4e";
  return (
    <svg width={200} height={200} style={{ filter: `drop-shadow(0 0 18px ${c}55)` }}>
      <circle cx={100} cy={100} r={r} fill="none" stroke="#e8e0d5" strokeWidth={10} />
      <circle cx={100} cy={100} r={r} fill="none" stroke={c} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s linear", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
      />
    </svg>
  );
}

// ─── TIMER SCREEN ──────────────────────────────────────────────────────────────
function TimerScreen({ appState, onSessionComplete }) {
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [running, setRunning] = useState(false);
  const [sessionType, setSessionType] = useState("focus");
  const [sessionCount, setSessionCount] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const intervalRef = useRef(null);
  const durations = { focus: FOCUS_DURATION, break: SHORT_BREAK, longbreak: LONG_BREAK };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(intervalRef.current); setRunning(false); handleComplete(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, sessionType]);

  function handleComplete() {
    playSound("complete");
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 2200);
    if (sessionType === "focus") {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      onSessionComplete(newCount);
      const next = newCount % 4 === 0 ? "longbreak" : "break";
      setTimeout(() => { setSessionType(next); setTimeLeft(durations[next]); }, 1800);
    } else {
      setTimeout(() => { setSessionType("focus"); setTimeLeft(FOCUS_DURATION); }, 1200);
    }
  }

  function handleToggle() { const next = !running; setRunning(next); playSound(next ? "start" : "pause"); }
  function handleReset() { setRunning(false); setTimeLeft(durations[sessionType]); playSound("pause"); }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const label = sessionType === "focus" ? "Focus Time" : sessionType === "break" ? "Short Break" : "Long Break";
  const themes = {
    focus:     { bg: "linear-gradient(160deg, #f0ece3 0%, #e8f5e0 100%)", accent: "#5a8a4e" },
    break:     { bg: "linear-gradient(160deg, #e8f4fb 0%, #ddeeff 100%)", accent: "#6aabcc" },
    longbreak: { bg: "linear-gradient(160deg, #f3eeff 0%, #e8ddf8 100%)", accent: "#9b59b6" },
  };
  const theme = themes[sessionType];

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: theme.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, transition: "background 0.8s ease" }}>
      {celebrate && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 99 }}>
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: `${10 + Math.random() * 80}%`, top: "-10%", fontSize: 28, animation: `fall${i % 3} 2s ease-in forwards`, animationDelay: `${Math.random() * 0.6}s` }}>
              {["🌟", "✨", "🍀", "🌸", "💛", "🪙"][i % 6]}
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 13, letterSpacing: 3, color: theme.accent, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 13, color: "#999", letterSpacing: 1 }}>Session {sessionCount + 1} • Streak 🔥 {appState.streak}</div>
      </div>

      <div style={{ position: "relative", width: 200, height: 200, margin: "16px 0" }}>
        <ProgressRing progress={(durations[sessionType] - timeLeft) / durations[sessionType]} sessionType={sessionType} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 46, color: "#3a3020", lineHeight: 1, textShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>{mins}:{secs}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button onClick={handleToggle} style={{ background: theme.accent, color: "#fff", border: "none", borderRadius: 24, padding: "13px 36px", fontFamily: "'Fredoka One', cursive", fontSize: 18, cursor: "pointer", boxShadow: `0 4px 18px ${theme.accent}44`, transition: "transform 0.1s" }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>
          {running ? "⏸ Pause" : "▶ Start"}
        </button>
        <button onClick={handleReset} style={{ background: "transparent", border: `1.5px solid ${theme.accent}`, color: theme.accent, borderRadius: 24, padding: "13px 22px", fontFamily: "'Fredoka One', cursive", fontSize: 16, cursor: "pointer" }}>↺ Reset</button>
        {sessionType !== "focus" && (
          <button onClick={() => { setRunning(false); setSessionType("focus"); setTimeLeft(FOCUS_DURATION); playSound("pause"); }} style={{ background: "transparent", border: `1.5px solid ${theme.accent}`, color: theme.accent, borderRadius: 24, padding: "13px 18px", fontFamily: "'Fredoka One', cursive", fontSize: 14, cursor: "pointer" }}>⏭ Skip</button>
        )}
      </div>

      <div style={{ marginTop: 32, display: "flex", gap: 8 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: i < sessionCount % 4 ? theme.accent : "#ddd", transition: "background 0.4s" }} />)}
      </div>
      <div style={{ marginTop: 20, fontFamily: "'Nunito', sans-serif", fontSize: 13, color: "#aaa" }}>
        Complete a session to earn <span style={{ color: "#b8860b" }}>10 coins</span> & grow your farm
      </div>
      <style>{`
        @keyframes fall0 { to { transform: translateY(110vh) rotate(360deg); opacity: 0; } }
        @keyframes fall1 { to { transform: translateY(110vh) rotate(-200deg); opacity: 0; } }
        @keyframes fall2 { to { transform: translateY(110vh) rotate(520deg); opacity: 0; } }
      `}</style>
    </div>
  );
}

// ─── FARM TILE ─────────────────────────────────────────────────────────────────
function FarmTile({ tile, index, isSelected, onPlace }) {
  const [hovered, setHovered] = useState(false);

  const getSprite = () => {
    if (!tile) return null;
    if (tile.type === "crop") {
      const crop = CROPS[tile.id];
      if (!crop) return null;
      return SVG[crop.stageKeys[Math.min(tile.stage, crop.stageKeys.length - 1)]] || null;
    }
    if (tile.type === "animal") {
      const animal = ANIMALS[tile.id];
      if (!animal) return null;
      return SVG[animal.stageKeys[Math.min(tile.stage, animal.stageKeys.length - 1)]] || null;
    }
    return null;
  };

  const sprite = getSprite();
  const isEmpty = !tile;
  const isHarvest = tile?.type === "crop" && CROPS[tile.id] && tile.stage >= CROPS[tile.id].stageKeys.length - 1;
  const isFullGrown = tile?.type === "animal" && ANIMALS[tile.id] && tile.stage >= ANIMALS[tile.id].stageKeys.length - 1;

  return (
    <div onClick={() => onPlace(index)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", aspectRatio: "1",
        background: isEmpty ? (hovered && isSelected ? "rgba(90,138,78,0.25)" : "#c8a96e22") : isHarvest ? "rgba(255,200,50,0.18)" : isFullGrown ? "rgba(100,200,100,0.15)" : "rgba(255,255,255,0.12)",
        border: isEmpty && hovered && isSelected ? "2px dashed #5a8a4e" : isHarvest ? "2px solid #f6c90e88" : "1.5px solid rgba(139,100,20,0.12)",
        borderRadius: 8,
        cursor: isSelected && isEmpty ? "pointer" : "default",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.2s, transform 0.15s",
        transform: hovered && isSelected && isEmpty ? "scale(1.05)" : "scale(1)",
        position: "relative", overflow: "hidden", padding: 2,
      }}>
      {sprite && (
        <div style={{ width: "100%", height: "100%", animation: tile?.type === "animal" ? "sway 3s ease-in-out infinite" : tile?.type === "crop" ? "cropSway 4s ease-in-out infinite" : "none" }}>
          {sprite}
        </div>
      )}
      {isHarvest && <div style={{ position: "absolute", top: -3, right: -3, width: 10, height: 10, background: "#f6c90e", borderRadius: "50%", border: "2px solid #fff", animation: "pulse 1.5s infinite" }} />}
    </div>
  );
}

// ─── FARM SCREEN ───────────────────────────────────────────────────────────────
function FarmScreen({ appState, setAppState }) {
  const { grid, inventory, selectedItem } = appState;
  const [notification, setNotification] = useState(null);

  function handleSelectItem(id, type) {
    setAppState(s => ({ ...s, selectedItem: s.selectedItem?.id === id ? null : { id, type } }));
  }

  function handlePlaceTile(index) {
    if (!selectedItem || grid[index]) return;
    const itemKey = selectedItem.id;
    if (!inventory[itemKey] || inventory[itemKey] < 1) { showNotif("No more in inventory!"); return; }
    const newGrid = [...grid];
    newGrid[index] = { type: selectedItem.type, id: itemKey, stage: 0, placedAt: Date.now() };
    const newInv = { ...inventory, [itemKey]: inventory[itemKey] - 1 };
    if (newInv[itemKey] <= 0) delete newInv[itemKey];
    setAppState(s => ({ ...s, grid: newGrid, inventory: newInv, selectedItem: null, animals: selectedItem.type === "animal" ? s.animals + 1 : s.animals }));
    playSound("plant");
    showNotif(`${(CROPS[itemKey] || ANIMALS[itemKey])?.name} placed! 🌱`);
  }

  function showNotif(msg) { setNotification(msg); setTimeout(() => setNotification(null), 2200); }

  const unlocked = MILESTONES.filter(m => appState.totalSessions >= m.sessions);
  const inventoryItems = Object.entries(inventory).map(([id, qty]) => {
    const crop = CROPS[id]; const animal = ANIMALS[id];
    return { id, qty, ...(crop || animal), type: crop ? "crop" : "animal" };
  });

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "linear-gradient(160deg, #e8f5e0 0%, #f5efe0 100%)", padding: 20 }}>
      {notification && (
        <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", background: "#fff", border: "1.5px solid #5a8a4e", borderRadius: 16, padding: "10px 22px", fontFamily: "'Fredoka One', cursive", fontSize: 15, color: "#5a8a4e", zIndex: 200, boxShadow: "0 4px 20px #00000022", animation: "fadeIn 0.2s ease" }}>
          {notification}
        </div>
      )}
      {unlocked.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {unlocked.map(m => <div key={m.sessions} style={{ background: "rgba(255,255,255,0.7)", borderRadius: 12, padding: "4px 12px", fontSize: 12, fontFamily: "'Nunito', sans-serif", color: "#5a8a4e", border: "1px solid #5a8a4e33" }}>{m.emoji} {m.label}</div>)}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: 4, background: "linear-gradient(135deg, #c8a96e44, #a0784022)", borderRadius: 20, padding: 12, border: "2px solid rgba(139,100,20,0.18)", boxShadow: "inset 0 2px 12px rgba(139,100,20,0.08), 0 4px 24px rgba(0,0,0,0.06)", maxWidth: 480, margin: "0 auto 20px" }}>
        {grid.map((tile, i) => <FarmTile key={i} tile={tile} index={i} isSelected={!!selectedItem} onPlace={handlePlaceTile} />)}
      </div>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 16, color: "#6b4c1e", marginBottom: 8 }}>
          🎒 Inventory
          {selectedItem && <span style={{ fontSize: 12, color: "#5a8a4e", marginLeft: 8 }}>Tap a tile to place {(CROPS[selectedItem.id] || ANIMALS[selectedItem.id])?.name}</span>}
        </div>
        {inventoryItems.length === 0
          ? <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: "#aaa", padding: "16px 0" }}>Your inventory is empty. Visit the Shop! 🛒</div>
          : <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {inventoryItems.map(item => (
                <div key={item.id} onClick={() => handleSelectItem(item.id, item.type)} style={{ background: selectedItem?.id === item.id ? "#5a8a4e" : "#fff", border: selectedItem?.id === item.id ? "2px solid #5a8a4e" : "1.5px solid #ddd", borderRadius: 14, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Fredoka One', cursive", color: selectedItem?.id === item.id ? "#fff" : "#444", transition: "all 0.15s", transform: selectedItem?.id === item.id ? "scale(1.04)" : "scale(1)" }}>
                  <div style={{ width: 32, height: 32 }}>{SVG[item.shopIcon]}</div>
                  <div><div style={{ fontSize: 14 }}>{item.name}</div><div style={{ fontSize: 11, opacity: 0.7 }}>×{item.qty}</div></div>
                </div>
              ))}
            </div>
        }
      </div>
      <style>{`
        @keyframes sway { 0%,100%{transform:translateX(-2px)} 50%{transform:translateX(2px)} }
        @keyframes cropSway { 0%,100%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeIn { from{opacity:0;transform:translate(-50%,-8px)} to{opacity:1;transform:translate(-50%,0)} }
      `}</style>
    </div>
  );
}

// ─── SHOP SCREEN ───────────────────────────────────────────────────────────────
function ShopScreen({ appState, setAppState }) {
  const [tab, setTab] = useState("crops");
  const [bought, setBought] = useState(null);

  function buy(id, price) {
    if (appState.coins < price) { setBought({ id, success: false }); setTimeout(() => setBought(null), 1500); return; }
    setAppState(s => ({ ...s, coins: s.coins - price, inventory: { ...s.inventory, [id]: (s.inventory[id] || 0) + 1 } }));
    playSound("buy");
    setBought({ id, success: true });
    setTimeout(() => setBought(null), 1200);
  }

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "linear-gradient(160deg, #fef9f0 0%, #f0ece3 100%)", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28, color: "#6b4c1e", margin: 0 }}>🌿 Seed Shop</h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", color: "#999", fontSize: 14, margin: "4px 0 0" }}>Spend your coins to grow your farm</p>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
        {["crops","animals"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? "#5a8a4e" : "#fff", color: tab === t ? "#fff" : "#5a8a4e", border: "1.5px solid #5a8a4e", borderRadius: 20, padding: "8px 22px", fontFamily: "'Fredoka One', cursive", fontSize: 15, cursor: "pointer" }}>
            {t === "crops" ? "🌱 Seeds" : "🐾 Animals"}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14, maxWidth: 560, margin: "0 auto" }}>
        {Object.entries(tab === "crops" ? CROPS : ANIMALS).map(([id, item]) => {
          const wasBought = bought?.id === id;
          return (
            <div key={id} style={{ background: "#fff", borderRadius: 20, padding: 20, textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: wasBought ? `2px solid ${bought.success ? "#5a8a4e" : "#e74c3c"}` : "1.5px solid #eee", transition: "all 0.2s", transform: wasBought ? "scale(1.04)" : "scale(1)" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>{SVG[item.shopIcon]}</div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 16, color: "#3a3020", marginBottom: 2 }}>{item.name}</div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: "#aaa", marginBottom: 10 }}>In inventory: {appState.inventory[id] || 0}</div>
              <button onClick={() => buy(id, item.price)} style={{ background: appState.coins >= item.price ? "#5a8a4e" : "#ddd", color: appState.coins >= item.price ? "#fff" : "#999", border: "none", borderRadius: 16, padding: "8px 16px", fontFamily: "'Fredoka One', cursive", fontSize: 14, cursor: appState.coins >= item.price ? "pointer" : "not-allowed", width: "100%" }}>
                {wasBought && bought.success ? "✓ Added!" : wasBought ? "💸 No coins" : `🪙 ${item.price}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WORLD MAP ─────────────────────────────────────────────────────────────────
function WorldMapScreen({ totalSessions }) {
  const worlds = [
    { id: "farm",     name: "Your Farm",       emoji: "🏡", unlockAt: 0,  desc: "Where it all begins" },
    { id: "zen",      name: "Zen Garden",       emoji: "🎋", unlockAt: 10, desc: "Bamboo, koi & calm" },
    { id: "rice",     name: "Rice Fields",      emoji: "🌾", unlockAt: 25, desc: "Japanese countryside" },
    { id: "vineyard", name: "Italian Vineyard", emoji: "🍇", unlockAt: 45, desc: "Grapes & olive trees" },
    { id: "tropical", name: "Tropical Island",  emoji: "🏝️", unlockAt: 70, desc: "Coconuts & parrots" },
  ];
  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "linear-gradient(160deg, #e0f0ff 0%, #f0ece3 100%)", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28, color: "#2c5f8a", margin: 0 }}>🗺️ World Map</h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", color: "#999", fontSize: 14, margin: "4px 0 0" }}>Unlock new worlds through focus</p>
      </div>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        {worlds.map(w => {
          const unlocked = totalSessions >= w.unlockAt;
          return (
            <div key={w.id} style={{ background: unlocked ? "#fff" : "#f5f5f5", borderRadius: 20, padding: "18px 22px", boxShadow: unlocked ? "0 2px 16px rgba(0,0,0,0.07)" : "none", border: unlocked ? "1.5px solid #ddd" : "1.5px dashed #ddd", display: "flex", alignItems: "center", gap: 16, opacity: unlocked ? 1 : 0.55, transition: "all 0.3s" }}>
              <div style={{ fontSize: 40, filter: unlocked ? "none" : "grayscale(1)" }}>{w.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 17, color: unlocked ? "#3a3020" : "#aaa" }}>{w.name}</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: "#aaa" }}>{w.desc}</div>
              </div>
              {unlocked
                ? <div style={{ background: "#5a8a4e22", color: "#5a8a4e", borderRadius: 12, padding: "4px 12px", fontFamily: "'Fredoka One', cursive", fontSize: 13 }}>Unlocked ✓</div>
                : <div style={{ background: "#f0e8d8", color: "#b8860b", borderRadius: 12, padding: "4px 12px", fontFamily: "'Fredoka One', cursive", fontSize: 12 }}>{w.unlockAt - totalSessions} more sessions</div>
              }
            </div>
          );
        })}
      </div>
      <div style={{ maxWidth: 480, margin: "24px auto 0", background: "#fff8ee", borderRadius: 16, padding: 16, border: "1.5px solid #f6c90e44" }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", color: "#b8860b", marginBottom: 6, fontSize: 14 }}>🏅 Milestones</div>
        {MILESTONES.map(m => (
          <div key={m.sessions} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", opacity: totalSessions >= m.sessions ? 1 : 0.4 }}>
            <span style={{ fontSize: 20 }}>{m.emoji}</span>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: "#555" }}>{m.label}</span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: totalSessions >= m.sessions ? "#5a8a4e" : "#aaa" }}>{totalSessions >= m.sessions ? "✓" : `${m.sessions} sessions`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ACHIEVEMENTS ──────────────────────────────────────────────────────────────
function AchievementsScreen({ appState }) {
  const unlocked = ACHIEVEMENTS.filter(a => appState.unlockedAchievements.includes(a.id));
  const locked = ACHIEVEMENTS.filter(a => !appState.unlockedAchievements.includes(a.id));
  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "linear-gradient(160deg, #fef9f0 0%, #f0ece3 100%)", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28, color: "#6b4c1e", margin: 0 }}>🏅 Achievements</h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", color: "#999", fontSize: 14, margin: "4px 0 0" }}>{unlocked.length}/{ACHIEVEMENTS.length} unlocked</p>
      </div>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {[...unlocked, ...locked].map(a => {
          const isUnlocked = appState.unlockedAchievements.includes(a.id);
          return (
            <div key={a.id} style={{ background: isUnlocked ? "#fff" : "#f5f5f5", borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, border: isUnlocked ? "1.5px solid #f6c90e66" : "1.5px solid #eee", opacity: isUnlocked ? 1 : 0.5 }}>
              <div style={{ fontSize: 32, filter: isUnlocked ? "none" : "grayscale(1)" }}>{a.emoji}</div>
              <div>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 15, color: "#3a3020" }}>{a.label}</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: "#aaa" }}>{a.desc}</div>
              </div>
              {isUnlocked && <div style={{ marginLeft: "auto", color: "#f6c90e", fontSize: 20 }}>⭐</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── NAV BAR ───────────────────────────────────────────────────────────────────
function NavigationBar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "timer",  emoji: "⏱",  label: "Focus" },
    { id: "farm",   emoji: "🌾", label: "Farm" },
    { id: "shop",   emoji: "🛒", label: "Shop" },
    { id: "world",  emoji: "🗺️", label: "World" },
    { id: "awards", emoji: "🏅", label: "Awards" },
  ];
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,252,245,0.96)", borderTop: "1.5px solid rgba(139,100,20,0.12)", backdropFilter: "blur(12px)", display: "flex", justifyContent: "space-around", alignItems: "center", padding: "8px 0 max(8px, env(safe-area-inset-bottom))", zIndex: 100 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 12px", color: activeTab === t.id ? "#5a8a4e" : "#aaa", transition: "color 0.2s, transform 0.1s", transform: activeTab === t.id ? "scale(1.12)" : "scale(1)" }}>
          <span style={{ fontSize: 22 }}>{t.emoji}</span>
          <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 11 }}>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── TOP BAR ───────────────────────────────────────────────────────────────────
function TopBar({ coins, coinPulse, streak }) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(255,252,245,0.95)", backdropFilter: "blur(12px)", borderBottom: "1.5px solid rgba(139,100,20,0.10)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px" }}>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 20, color: "#5a8a4e" }}>🌿 FocusFarm</div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 13, color: "#888" }}>🔥 {streak}</div>
        <CoinDisplay coins={coins} pulse={coinPulse} />
      </div>
    </div>
  );
}

// ─── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [appState, setAppState] = useLocalStorage("focusfarm_v2", defaultState());
  const [activeTab, setActiveTab] = useState("timer");
  const [coinPulse, setCoinPulse] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString();
    if (appState.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      setAppState(s => ({ ...s, streak: s.lastActiveDate === yesterday ? s.streak : 1, lastActiveDate: today, todaySessions: 0 }));
    }
  }, []);

  function handleSessionComplete(count) {
    setAppState(s => {
      const newTotal = s.totalSessions + 1, newToday = s.todaySessions + 1;
      let earned = COINS_PER_SESSION;
      if (count % 4 === 0) earned += 25;
      if (s.streak > 0 && newToday === 1) earned += 10;

      const newGrid = s.grid.map(tile => {
        if (!tile) return null;
        const maxStage = tile.type === "crop" ? (CROPS[tile.id]?.stageKeys.length ?? 4) - 1 : tile.type === "animal" ? (ANIMALS[tile.id]?.stageKeys.length ?? 2) - 1 : 0;
        return tile.stage < maxStage ? { ...tile, stage: tile.stage + 1 } : tile;
      });

      const newHarvests = newGrid.reduce((acc, tile) => {
        if (!tile || tile.type !== "crop") return acc;
        return tile.stage === (CROPS[tile.id]?.stageKeys.length ?? 4) - 1 ? acc + 1 : acc;
      }, 0);

      const newState = { ...s, coins: s.coins + earned, totalSessions: newTotal, todaySessions: newToday, grid: newGrid, harvests: newHarvests };
      const newUnlocked = ACHIEVEMENTS.filter(a => !s.unlockedAchievements.includes(a.id) && a.condition(newState)).map(a => a.id);
      if (newUnlocked.length) newState.unlockedAchievements = [...s.unlockedAchievements, ...newUnlocked];
      return newState;
    });
    setCoinPulse(true);
    setTimeout(() => setCoinPulse(false), 600);
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />
      <div style={{ paddingTop: 60, paddingBottom: 70 }}>
        <TopBar coins={appState.coins} coinPulse={coinPulse} streak={appState.streak} />
        {activeTab === "timer"  && <TimerScreen appState={appState} setAppState={setAppState} onSessionComplete={handleSessionComplete} />}
        {activeTab === "farm"   && <FarmScreen  appState={appState} setAppState={setAppState} />}
        {activeTab === "shop"   && <ShopScreen  appState={appState} setAppState={setAppState} />}
        {activeTab === "world"  && <WorldMapScreen totalSessions={appState.totalSessions} />}
        {activeTab === "awards" && <AchievementsScreen appState={appState} />}
        <NavigationBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </>
  );
}
