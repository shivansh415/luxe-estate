import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';

const GOLD = 'rgba(176, 122, 90, 1)';
const GOLD_DIM = 'rgba(176, 122, 90, 0.4)';
const GOLD_FAINT = 'rgba(176, 122, 90, 0.15)';
const WHITE_MUTED = 'rgba(0, 0, 0, 1)';
const WHITE_FAINT = 'rgba(0, 0, 0, 0.8)';
const EASE_LUXURY = [0.16, 1, 0.3, 1];
const FONT_DISPLAY = "'Bebas Neue', sans-serif";
const FONT_BODY = "'Bricolage Grotesque', sans-serif";

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/shivansh.js?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/shivansh-patidar/' },
];

function SocialLink({ label, href }) {
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  return (
    <a
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        color: hovered ? GOLD : WHITE_MUTED,
        textDecoration: 'none',
        fontFamily: FONT_BODY,
        fontSize: '0.7rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        position: 'relative',
        display: 'inline-block',
        paddingBottom: '4px',
        transition: `color 0.4s cubic-bezier(${EASE_LUXURY.join(',')})`,
        cursor: 'pointer',
      }}
    >
      {label}
      {/* Underline animation element */}
      <span
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '1px',
          background: GOLD,
          transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'center',
          transition: `transform 0.4s cubic-bezier(${EASE_LUXURY.join(',')})`,
        }}
      />
    </a>
  );
}

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.5, ease: EASE_LUXURY }}
      viewport={{ once: true, margin: '-100px' }}
      style={{
        position: 'relative',
        zIndex: 1,
        background: 'transparent',
        padding: 'clamp(3rem, 6vw, 6rem) clamp(1.5rem, 5vw, 4rem) clamp(1.5rem, 3vw, 3rem)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 0,
      }}
    >
      {/* ── Gold gradient divider ── */}
      <div
        style={{
          width: '100%',
          height: '1px',
          background: `linear-gradient(90deg, transparent 0%, ${GOLD_DIM} 25%, ${GOLD} 50%, ${GOLD_DIM} 75%, transparent 100%)`,
          marginBottom: 'clamp(2rem, 4vw, 3.5rem)',
        }}
      />

      {/* ── Brand ── */}
      <h2
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
          fontWeight: 300,
          color: GOLD,
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        Luxe Estates
      </h2>

      {/* ── Tagline ── */}
      <p
        style={{
          fontFamily: FONT_BODY,
          fontSize: '0.7rem',
          fontWeight: 800,
          color: WHITE_MUTED,
          letterSpacing: '0.15em',
          margin: '0.8rem 0 0 0',
          lineHeight: 1.6,
        }}
      >
        Redefining Luxury Living
      </p>

      {/* ── Contact row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(0.6rem, 2vw, 1.2rem)',
          marginTop: 'clamp(1.5rem, 3vw, 2.5rem)',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 'clamp(0.65rem, 1.2vw, 0.75rem)',
            fontWeight: 800,
            color: WHITE_MUTED,
            letterSpacing: '0.05em',
          }}
        >
          shivanahpatidar@gmail.com
        </span>

        {/* Gold dot separator */}
        <span
          style={{
            width: '3px',
            height: '3px',
            borderRadius: '50%',
            background: GOLD_DIM,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />

        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 'clamp(0.65rem, 1.2vw, 0.75rem)',
            fontWeight: 800,
            color: WHITE_MUTED,
            letterSpacing: '0.05em',
          }}
        >
          +91 6265581678
        </span>
      </div>

      {/* ── Social links row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(1rem, 3vw, 2.5rem)',
          marginTop: 'clamp(1.5rem, 3vw, 2.5rem)',
          flexWrap: 'wrap',
        }}
      >
        {socialLinks.map((link) => (
          <SocialLink key={link.label} label={link.label} href={link.href} />
        ))}
      </div>

      {/* ── Copyright ── */}
      <p
        style={{
          fontFamily: FONT_BODY,
          fontSize: '0.6rem',
          fontWeight: 800,
          color: WHITE_FAINT,
          letterSpacing: '0.1em',
          margin: 'clamp(2rem, 4vw, 3.5rem) 0 0 0',
          lineHeight: 1.6,
        }}
      >
        © 2026 Luxe Estates. All Rights Reserved.
      </p>

      {/* ── Attribution ── */}
      <p
        style={{
          fontFamily: FONT_BODY,
          fontSize: '0.75rem',
          fontWeight: 800,
          color: WHITE_MUTED,
          letterSpacing: '0.15em',
          margin: '0.8rem 0 0 0',
          lineHeight: 1.6,
        }}
      >
        THIS ART IS CREATED BY SHIVANSH WITH ❤️
      </p>

      {/* ── Crafted tagline ── */}
      <p
        style={{
          fontFamily: FONT_BODY,
          fontSize: '0.55rem',
          fontWeight: 300,
          fontStyle: 'italic',
          color: GOLD_FAINT,
          letterSpacing: '0.12em',
          margin: '0.6rem 0 0 0',
          lineHeight: 1.6,
        }}
      >
        Crafted with obsession for detail
      </p>
    </motion.footer>
  );
}
