
/**
 * テロップコンポーネント集
 * SNS縦型動画（Reels/TikTok/Shorts）向け
 *
 * 使用方法:
 * import { HookText, SpeechBubble, BoxText, ... } from './TelopComponents';
 */

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// ============================================
// 共通設定
// ============================================

const FONT_FAMILY = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';

const COLORS = {
  lime: '#CCFF00',
  purple: '#8B5CF6',
  magenta: '#C026D3',
  pink: '#EC4899',
  red: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
};

// ============================================
// 1. フックテキスト (Hook Text)
// ============================================

interface HookTextProps {
  text: string;
  color?: string;
  startFrame?: number;
}

export const HookText: React.FC<HookTextProps> = ({
  text,
  color = COLORS.lime,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 12, stiffness: 200 },
  });

  const opacity = interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        fontFamily: FONT_FAMILY,
        fontSize: '80px',
        fontWeight: 900,
        color,
        textShadow: `
          3px 3px 0 ${COLORS.black},
          -3px -3px 0 ${COLORS.black},
          3px -3px 0 ${COLORS.black},
          -3px 3px 0 ${COLORS.black}
        `,
        textAlign: 'center',
        transform: `scale(${scale})`,
        opacity,
        lineHeight: 1.3,
      }}
    >
      {text.split('\n').map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
};

// ============================================
// 2. 吹き出し (Speech Bubble)
// ============================================

interface SpeechBubbleProps {
  text: string;
  position?: 'left' | 'right';
  startFrame?: number;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  text,
  position = 'left',
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [startFrame, startFrame + 8], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(frame, [startFrame, startFrame + 8], [20, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: COLORS.white,
        padding: '12px 24px',
        borderRadius: '24px',
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: '36px',
          fontWeight: 700,
          color: COLORS.black,
        }}
      >
        {text}
      </span>
      {/* 吹き出しの尖り部分 */}
      <div
        style={{
          position: 'absolute',
          bottom: '-12px',
          [position]: '24px',
          width: 0,
          height: 0,
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderTop: `16px solid ${COLORS.white}`,
        }}
      />
    </div>
  );
};

// ============================================
// 3. ボックステキスト (Box Text)
// ============================================

interface BoxTextProps {
  text: string;
  backgroundColor?: string;
  textColor?: string;
  startFrame?: number;
}

export const BoxText: React.FC<BoxTextProps> = ({
  text,
  backgroundColor = COLORS.purple,
  textColor = COLORS.white,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const translateX = interpolate(frame, [startFrame, startFrame + 12], [-50, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        backgroundColor,
        padding: '16px 28px',
        borderRadius: '10px',
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: '48px',
          fontWeight: 700,
          color: textColor,
          lineHeight: 1.4,
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ============================================
// 4. シンプルテキスト (Simple Text)
// ============================================

interface SimpleTextProps {
  text: string;
  startFrame?: number;
}

export const SimpleText: React.FC<SimpleTextProps> = ({
  text,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [startFrame, startFrame + 8], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        fontFamily: FONT_FAMILY,
        fontSize: '44px',
        fontWeight: 600,
        color: COLORS.white,
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        textAlign: 'center',
        opacity,
        lineHeight: 1.4,
      }}
    >
      {text.split('\n').map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
};

// ============================================
// 5. ブラケットハイライト (Bracket Highlight)
// ============================================

interface BracketHighlightProps {
  text: string;
  color?: string;
  startFrame?: number;
}

export const BracketHighlight: React.FC<BracketHighlightProps> = ({
  text,
  color = COLORS.pink,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 8, stiffness: 150 },
  });

  return (
    <span
      style={{
        fontFamily: FONT_FAMILY,
        fontSize: '56px',
        fontWeight: 800,
        color,
        textShadow: `0 0 10px ${color}80`,
        transform: `scale(${scale})`,
        display: 'inline-block',
      }}
    >
      【{text}】
    </span>
  );
};

// ============================================
// 6. 3D数字 (3D Number)
// ============================================

interface Number3DProps {
  number: string;
  unit?: string;
  color?: string;
  startFrame?: number;
}

export const Number3D: React.FC<Number3DProps> = ({
  number,
  unit = '',
  color = COLORS.lime,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  return (
    <span
      style={{
        fontFamily: FONT_FAMILY,
        fontSize: '120px',
        fontWeight: 900,
        color,
        textShadow: `
          2px 2px 0 ${COLORS.black},
          4px 4px 0 #666666,
          6px 6px 0 #333333
        `,
        transform: `scale(${scale})`,
        display: 'inline-block',
      }}
    >
      {number}
      {unit && <span style={{ fontSize: '60px' }}>{unit}</span>}
    </span>
  );
};

// ============================================
// 7. 3Dテキスト (3D Text)
// ============================================

interface Text3DProps {
  text: string;
  color?: string;
  startFrame?: number;
}

export const Text3D: React.FC<Text3DProps> = ({
  text,
  color = COLORS.purple,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  // 震えエフェクト
  const shake = Math.sin((frame - startFrame) * 0.8) * 2;

  return (
    <div
      style={{
        fontFamily: FONT_FAMILY,
        fontSize: '72px',
        fontWeight: 900,
        color,
        textShadow: `
          3px 3px 0 #581C87,
          6px 6px 0 #3B0764,
          9px 9px 15px rgba(0,0,0,0.5)
        `,
        letterSpacing: '0.05em',
        transform: `scale(${scale}) translateX(${shake}px)`,
        textAlign: 'center',
        lineHeight: 1.3,
      }}
    >
      {text.split('\n').map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
};

// ============================================
// 8. アンダーラインテキスト (Underline Text)
// ============================================

interface UnderlineTextProps {
  text: string;
  startFrame?: number;
}

export const UnderlineText: React.FC<UnderlineTextProps> = ({
  text,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [startFrame, startFrame + 8], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const lineWidth = interpolate(frame, [startFrame + 5, startFrame + 15], [0, 100], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'inline-block',
        opacity,
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: '48px',
          fontWeight: 600,
          color: COLORS.white,
        }}
      >
        {text}
      </span>
      <div
        style={{
          height: '3px',
          backgroundColor: COLORS.white,
          marginTop: '8px',
          width: `${lineWidth}%`,
        }}
      />
    </div>
  );
};

// ============================================
// 9. 段差レイアウト (Staggered Layout)
// ============================================

interface StaggeredTextProps {
  lines: { text: string; color?: string }[];
  startFrame?: number;
}

export const StaggeredText: React.FC<StaggeredTextProps> = ({
  lines,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {lines.map((line, index) => {
        const lineStart = startFrame + index * 5;
        const opacity = interpolate(frame, [lineStart, lineStart + 8], [0, 1], {
          extrapolateRight: 'clamp',
        });
        const translateX = interpolate(frame, [lineStart, lineStart + 10], [30, 0], {
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={index}
            style={{
              marginLeft: `${index * 60}px`,
              opacity,
              transform: `translateX(${translateX}px)`,
            }}
          >
            <span
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: '48px',
                fontWeight: 700,
                color: line.color || COLORS.lime,
              }}
            >
              {line.text}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// 10. ナンバーバッジ (Number Badge)
// ============================================

interface NumberBadgeProps {
  number: number;
  startFrame?: number;
}

export const NumberBadge: React.FC<NumberBadgeProps> = ({
  number,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 10, stiffness: 150 },
  });

  return (
    <div
      style={{
        fontFamily: FONT_FAMILY,
        fontSize: '90px',
        fontWeight: 900,
        color: COLORS.purple,
        textShadow: `
          4px 4px 0 #4C1D95,
          8px 8px 0 #2E1065
        `,
        transform: `scale(${scale})`,
      }}
    >
      No.{number}
    </div>
  );
};

// ============================================
// 11. カラーミックス (Mixed Color Inline)
// ============================================

interface MixedColorSegment {
  text: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  bold?: boolean;
}

interface MixedColorTextProps {
  segments: MixedColorSegment[];
  startFrame?: number;
}

export const MixedColorText: React.FC<MixedColorTextProps> = ({
  segments,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const sizeMap = {
    small: '40px',
    medium: '48px',
    large: '60px',
  };

  return (
    <div style={{ opacity, display: 'flex', alignItems: 'baseline', flexWrap: 'wrap' }}>
      {segments.map((segment, index) => (
        <span
          key={index}
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: sizeMap[segment.size || 'medium'],
            fontWeight: segment.bold ? 900 : 600,
            color: segment.color || COLORS.white,
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          }}
        >
          {segment.text}
        </span>
      ))}
    </div>
  );
};

// ============================================
// エクスポート
// ============================================

export const TelopComponents = {
  HookText,
  SpeechBubble,
  BoxText,
  SimpleText,
  BracketHighlight,
  Number3D,
  Text3D,
  UnderlineText,
  StaggeredText,
  NumberBadge,
  MixedColorText,
};

export default TelopComponents;
